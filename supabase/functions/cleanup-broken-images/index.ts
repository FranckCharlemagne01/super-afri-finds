import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CleanupResult {
  totalProductsChecked: number;
  brokenImagesFound: number;
  imagesRemoved: number;
  productsUpdated: string[];
  storageFilesDeleted: number;
  orphanedFilesDeleted: number;
  errors: string[];
}

const SUPABASE_URL = "https://zqskpspbyzptzjcoitwt.supabase.co";
const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/product-images/`;

// Validate a URL is truly accessible (HTTP 200)
async function isImageAccessible(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, { method: "HEAD", signal: controller.signal });
    clearTimeout(timeoutId);
    return response.ok;
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

  // Authentication check
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    console.error("Missing Authorization header");
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
    console.error("Authentication failed:", authError?.message);
    return new Response(JSON.stringify({ error: "Unauthorized - Invalid token" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  console.log(`User ${user.id} attempting cleanup operation`);

  // Authorization check (superadmin only)
  const { data: isSuperAdmin, error: roleError } = await supabaseAuth.rpc("has_role", {
    _user_id: user.id,
    _role: "superadmin",
  });

  if (roleError || !isSuperAdmin) {
    console.error(`User ${user.id} is not a superadmin`);
    return new Response(JSON.stringify({ error: "Forbidden - Superadmin access required" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 403,
    });
  }

  console.log(`Superadmin ${user.id} authorized - starting FULL cleanup`);

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const result: CleanupResult = {
    totalProductsChecked: 0,
    brokenImagesFound: 0,
    imagesRemoved: 0,
    productsUpdated: [],
    storageFilesDeleted: 0,
    orphanedFilesDeleted: 0,
    errors: [],
  };

  try {
    // 1. Fetch all products
    const { data: products, error: fetchError } = await supabase
      .from("products")
      .select("id, title, images");

    if (fetchError) throw new Error(`Failed to fetch products: ${fetchError.message}`);
    result.totalProductsChecked = products?.length || 0;

    console.log(`Checking ${result.totalProductsChecked} products...`);

    // 2. Check each product's images with real HTTP HEAD check
    for (const product of products || []) {
      if (!product.images || !Array.isArray(product.images) || product.images.length === 0) {
        continue; // Nothing to check
      }

      const validImages: string[] = [];
      const brokenImages: string[] = [];

      for (const imageUrl of product.images) {
        if (!imageUrl || typeof imageUrl !== "string" || imageUrl.trim() === "") {
          brokenImages.push("empty");
          continue;
        }

        // Real accessibility check
        const accessible = await isImageAccessible(imageUrl);

        if (accessible) {
          validImages.push(imageUrl);
        } else {
          brokenImages.push(imageUrl);
          result.brokenImagesFound++;

          // Delete from storage if it's our bucket
          if (imageUrl.startsWith(STORAGE_BASE)) {
            const filePath = imageUrl.replace(STORAGE_BASE, "");
            const { error: deleteError } = await supabase.storage
              .from("product-images")
              .remove([filePath]);

            if (!deleteError) {
              result.storageFilesDeleted++;
              console.log(`Deleted broken file from storage: ${filePath}`);
            }
          }
        }
      }

      // Update product if any images were broken
      if (brokenImages.length > 0) {
        const { error: updateError } = await supabase
          .from("products")
          .update({ images: validImages, updated_at: new Date().toISOString() })
          .eq("id", product.id);

        if (updateError) {
          result.errors.push(`Failed to update product ${product.id}: ${updateError.message}`);
        } else {
          result.imagesRemoved += brokenImages.length;
          result.productsUpdated.push(`${product.title} (${product.id})`);
          console.log(`Cleaned product ${product.title}: removed ${brokenImages.length} broken image(s)`);
        }
      }
    }

    // 3. Clean orphaned storage files (files not referenced by any product)
    console.log("Checking for orphaned storage files...");

    const { data: allProducts } = await supabase.from("products").select("images");
    const allImageUrls = new Set<string>();
    for (const p of allProducts || []) {
      if (p.images && Array.isArray(p.images)) {
        for (const url of p.images) {
          if (url) allImageUrls.add(url);
        }
      }
    }

    // List all folders in product-images bucket
    const { data: storageFiles, error: listError } = await supabase.storage
      .from("product-images")
      .list("", { limit: 1000 });

    if (!listError && storageFiles) {
      for (const folder of storageFiles) {
        if (!folder.id || !folder.name) continue;

        // List files in folder
        const { data: folderFiles } = await supabase.storage
          .from("product-images")
          .list(folder.name, { limit: 500 });

        for (const file of folderFiles || []) {
          const fileUrl = `${STORAGE_BASE}${folder.name}/${file.name}`;

          if (!allImageUrls.has(fileUrl)) {
            // Orphaned file - delete
            const { error: deleteError } = await supabase.storage
              .from("product-images")
              .remove([`${folder.name}/${file.name}`]);

            if (!deleteError) {
              result.orphanedFilesDeleted++;
              console.log(`Deleted orphaned file: ${folder.name}/${file.name}`);
            }
          }
        }
      }
    }

    console.log(`Cleanup completed:`, result);

    return new Response(JSON.stringify({
      success: true,
      result,
      message: `Nettoyage terminé: ${result.brokenImagesFound} images cassées, ${result.imagesRemoved} retirées de la DB, ${result.storageFilesDeleted + result.orphanedFilesDeleted} fichiers supprimés du storage.`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Cleanup error:", error);
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
