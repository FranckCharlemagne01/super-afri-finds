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
  errors: string[];
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const result: CleanupResult = {
      totalProductsChecked: 0,
      brokenImagesFound: 0,
      imagesRemoved: 0,
      productsUpdated: [],
      storageFilesDeleted: 0,
      errors: [],
    };

    // 1. Fetch all products (including those with empty arrays)
    const { data: products, error: fetchError } = await supabase
      .from("products")
      .select("id, title, images, is_active");

    if (fetchError) {
      throw new Error(`Failed to fetch products: ${fetchError.message}`);
    }

    result.totalProductsChecked = products?.length || 0;

    // 2. Check each product's images
    for (const product of products || []) {
      // Handle empty arrays or null images - deactivate if active
      if (!product.images || !Array.isArray(product.images) || product.images.length === 0) {
        if (product.is_active) {
          const { error: deactivateError } = await supabase
            .from("products")
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq("id", product.id);
          
          if (!deactivateError) {
            result.productsUpdated.push(`${product.title} (${product.id}) - désactivé (aucune image)`);
            result.brokenImagesFound++;
          }
        }
        continue;
      }

      const validImages: string[] = [];
      const brokenImages: string[] = [];

      for (const imageUrl of product.images) {
        // Skip invalid URLs
        if (!imageUrl || typeof imageUrl !== "string" || imageUrl.trim() === "") {
          brokenImages.push(imageUrl || "empty");
          continue;
        }

        // Check if image is accessible
        try {
          const response = await fetch(imageUrl, { method: "HEAD" });
          
          if (response.ok) {
            validImages.push(imageUrl);
          } else {
            brokenImages.push(imageUrl);
            result.brokenImagesFound++;
            
            // Try to delete from storage if it's a Supabase storage URL
            if (imageUrl.includes("supabase.co/storage")) {
              const pathMatch = imageUrl.match(/\/product-images\/(.+)$/);
              if (pathMatch) {
                const filePath = pathMatch[1];
                const { error: deleteError } = await supabase.storage
                  .from("product-images")
                  .remove([filePath]);
                
                if (!deleteError) {
                  result.storageFilesDeleted++;
                }
              }
            }
          }
        } catch (error) {
          // Network error or invalid URL - mark as broken
          brokenImages.push(imageUrl);
          result.brokenImagesFound++;
        }
      }

      // 3. Update product if any images were broken
      if (brokenImages.length > 0) {
        const { error: updateError } = await supabase
          .from("products")
          .update({ 
            images: validImages.length > 0 ? validImages : [],
            updated_at: new Date().toISOString()
          })
          .eq("id", product.id);

        if (updateError) {
          result.errors.push(`Failed to update product ${product.id}: ${updateError.message}`);
        } else {
          result.imagesRemoved += brokenImages.length;
          result.productsUpdated.push(`${product.title} (${product.id})`);
        }
      }
    }

    // 4. Clean up orphaned storage files (optional - can be slow)
    // List all files in storage and check if they're referenced
    const { data: storageFiles, error: listError } = await supabase.storage
      .from("product-images")
      .list("", { limit: 1000 });

    if (!listError && storageFiles) {
      // Get all image URLs from products
      const { data: allProducts } = await supabase
        .from("products")
        .select("images");
      
      const allImageUrls = new Set<string>();
      for (const p of allProducts || []) {
        if (p.images && Array.isArray(p.images)) {
          for (const url of p.images) {
            if (url) allImageUrls.add(url);
          }
        }
      }

      // Check for orphaned folders
      for (const folder of storageFiles) {
        if (folder.id && folder.name) {
          const { data: folderFiles } = await supabase.storage
            .from("product-images")
            .list(folder.name);

          for (const file of folderFiles || []) {
            const fileUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${folder.name}/${file.name}`;
            
            if (!allImageUrls.has(fileUrl)) {
              // Orphaned file - delete it
              const { error: deleteError } = await supabase.storage
                .from("product-images")
                .remove([`${folder.name}/${file.name}`]);
              
              if (!deleteError) {
                result.storageFilesDeleted++;
              }
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      result,
      message: `Nettoyage terminé: ${result.brokenImagesFound} images cassées trouvées, ${result.imagesRemoved} supprimées, ${result.storageFilesDeleted} fichiers orphelins retirés du storage.`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Cleanup error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
