import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the caller is a superadmin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SB_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is superadmin using their JWT
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: callerData } = await callerClient.auth.getUser();
    if (!callerData?.user) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check caller role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerData.user.id)
      .maybeSingle();

    if (!roleData || roleData.role !== "superadmin") {
      return new Response(JSON.stringify({ error: "Accès réservé aux superadmins" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { full_name, email, phone, commission_rate, referral_code, referral_link } = await req.json();

    if (!full_name || !email || !referral_code) {
      return new Response(JSON.stringify({ error: "Nom, email et code referral requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate a temporary password
    const tempPassword = `Partner_${crypto.randomUUID().slice(0, 8)}!`;

    // 1. Create the auth user
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name,
        phone: phone || "",
        user_role: "partner",
      },
    });

    if (createError) {
      // If user already exists, try to find them
      if (createError.message?.includes("already been registered")) {
        const { data: existingUsers } = await adminClient.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find((u: any) => u.email === email);
        if (existingUser) {
          // User exists - assign partner role and create ambassador record
          return await createPartnerRecords(
            adminClient,
            existingUser.id,
            { full_name, email, phone, commission_rate, referral_code, referral_link },
            null, // no temp password for existing user
            corsHeaders
          );
        }
      }
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!newUser?.user) {
      return new Response(JSON.stringify({ error: "Échec de création du compte" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return await createPartnerRecords(
      adminClient,
      newUser.user.id,
      { full_name, email, phone, commission_rate, referral_code, referral_link },
      tempPassword,
      corsHeaders
    );
  } catch (error) {
    console.error("Error in create-partner-account:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur interne" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function createPartnerRecords(
  adminClient: any,
  userId: string,
  data: {
    full_name: string;
    email: string;
    phone?: string;
    commission_rate: number;
    referral_code: string;
    referral_link?: string;
  },
  tempPassword: string | null,
  corsHeaders: Record<string, string>
) {
  // 2. Assign 'partner' role in user_roles (upsert to avoid duplicates)
  const { error: roleError } = await adminClient
    .from("user_roles")
    .upsert(
      { user_id: userId, role: "partner" },
      { onConflict: "user_id" }
    );

  if (roleError) {
    console.error("Role assignment error:", roleError);
  }

  // 3. Create profile if not exists
  const { error: profileError } = await adminClient
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || null,
      },
      { onConflict: "user_id" }
    );

  if (profileError) {
    console.error("Profile creation error:", profileError);
  }

  // 4. Create ambassador record
  const { error: ambassadorError } = await adminClient
    .from("ambassadors")
    .insert({
      user_id: userId,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      referral_code: data.referral_code,
      referral_link: data.referral_link || null,
      commission_rate: data.commission_rate,
      status: "active",
    });

  if (ambassadorError) {
    return new Response(JSON.stringify({ error: ambassadorError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 5. Send password reset email so partner can set their own password
  await adminClient.auth.admin.generateLink({
    type: "recovery",
    email: data.email,
    options: {
      redirectTo: "https://djassa.siteviral.site/auth/reset-password",
    },
  });

  return new Response(
    JSON.stringify({
      success: true,
      user_id: userId,
      referral_code: data.referral_code,
      temp_password: tempPassword,
      message: tempPassword
        ? `Compte créé. Mot de passe temporaire: ${tempPassword}`
        : "Compte existant lié comme partenaire.",
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
