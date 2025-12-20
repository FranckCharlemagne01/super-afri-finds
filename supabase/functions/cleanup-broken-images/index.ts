import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CleanupResult {
  totalProductsChecked: number;
  brokenImagesFound: number;
  imagesRemovedFromDB: number;
  productsUpdated: number;
  storageFilesDeleted: number;
  orphanedFilesDeleted: number;
  errors: string[];
  details: {
    productId: string;
    productTitle: string;
    brokenUrls: string[];
    action: string;
  }[];
}

const SUPABASE_URL = "https://zqskpspbyzptzjcoitwt.supabase.co";
const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/product-images/`;

// Real HTTP HEAD check with timeout
async function isImageAccessible(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, { method: "HEAD", signal: controller.signal });
    clearTimeout(timeoutId);
    return response.ok && response.status === 200;
  } catch {
    return false;
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Auth check
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized - Missing token" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized - Invalid token" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  // Superadmin check
  const { data: isSuperAdmin } = await supabaseAuth.rpc("has_role", {
    _user_id: user.id,
    _role: "superadmin",
  });

  if (!isSuperAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden - Superadmin access required" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 403,
    });
  }

  console.log(`[CLEANUP] Superadmin ${user.id} starting HARD cleanup`);

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const result: CleanupResult = {
    totalProductsChecked: 0,
    brokenImagesFound: 0,
    imagesRemovedFromDB: 0,
    productsUpdated: 0,
    storageFilesDeleted: 0,
    orphanedFilesDeleted: 0,
    errors: [],
    details: [],
  };

  try {
    // 1. Fetch ALL products
    const { data: products, error: fetchError } = await supabase
      .from("products")
      .select("id, title, images");

    if (fetchError) throw new Error(`Failed to fetch products: ${fetchError.message}`);

    result.totalProductsChecked = products?.length || 0;
    console.log(`[CLEANUP] Scanning ${result.totalProductsChecked} products...`);

    // Collect all valid URLs across products
    const allValidUrls = new Set<string>();

    // 2. Check each product's images with real HTTP HEAD check
    for (const product of products || []) {
      if (!product.images || !Array.isArray(product.images) || product.images.length === 0) {
        continue;
      }

      const validImages: string[] = [];
      const brokenImages: string[] = [];

      for (const imageUrl of product.images) {
        if (!imageUrl || typeof imageUrl !== "string" || imageUrl.trim() === "") {
          brokenImages.push("empty_url");
          continue;
        }

        const cleanUrl = imageUrl.split("?")[0].trim();

        // Must be our bucket
        if (!cleanUrl.startsWith(STORAGE_BASE)) {
          brokenImages.push(cleanUrl);
          continue;
        }

        // Real HTTP accessibility check
        const accessible = await isImageAccessible(cleanUrl);

        if (accessible) {
          validImages.push(cleanUrl);
          allValidUrls.add(cleanUrl);
        } else {
          brokenImages.push(cleanUrl);
          result.brokenImagesFound++;

          // Delete from storage
          const filePath = cleanUrl.replace(STORAGE_BASE, "");
          const { error: deleteError } = await supabase.storage
            .from("product-images")
            .remove([filePath]);

          if (!deleteError) {
            result.storageFilesDeleted++;
            console.log(`[CLEANUP] Deleted broken file: ${filePath}`);
          }
        }
      }

      // Update product if any broken
      if (brokenImages.length > 0) {
        const { error: updateError } = await supabase
          .from("products")
          .update({ images: validImages, updated_at: new Date().toISOString() })
          .eq("id", product.id);

        if (updateError) {
          result.errors.push(`Update failed for ${product.id}: ${updateError.message}`);
        } else {
          result.imagesRemovedFromDB += brokenImages.length;
          result.productsUpdated++;
          result.details.push({
            productId: product.id,
            productTitle: product.title || "Sans titre",
            brokenUrls: brokenImages,
            action: `Removed ${brokenImages.length} broken image(s), ${validImages.length} valid remaining`,
          });
          console.log(`[CLEANUP] Product ${product.title}: removed ${brokenImages.length} broken image(s)`);
        }
      }
    }

    // 3. Clean orphaned storage files
    console.log("[CLEANUP] Scanning for orphaned storage files...");

    const { data: storageList } = await supabase.storage
      .from("product-images")
      .list("", { limit: 1000 });

    if (storageList) {
      for (const folder of storageList) {
        if (!folder.name) continue;

        const { data: files } = await supabase.storage
          .from("product-images")
          .list(folder.name, { limit: 500 });

        for (const file of files || []) {
          if (!file.name) continue;
          const fileUrl = `${STORAGE_BASE}${folder.name}/${file.name}`;

          if (!allValidUrls.has(fileUrl)) {
            const { error: delErr } = await supabase.storage
              .from("product-images")
              .remove([`${folder.name}/${file.name}`]);

            if (!delErr) {
              result.orphanedFilesDeleted++;
              console.log(`[CLEANUP] Deleted orphaned file: ${folder.name}/${file.name}`);
            }
          }
        }
      }
    }

    console.log(`[CLEANUP] Complete:`, result);

    return new Response(
      JSON.stringify({
        success: true,
        result,
        message: `Nettoyage terminé: ${result.brokenImagesFound} images cassées détectées, ${result.imagesRemovedFromDB} retirées de la DB, ${result.storageFilesDeleted + result.orphanedFilesDeleted} fichiers supprimés du storage, ${result.productsUpdated} produits mis à jour.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("[CLEANUP] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
