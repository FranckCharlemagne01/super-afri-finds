import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROJECT_REF = "zqskpspbyzptzjcoitwt";
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const BUCKET = "product-images";
const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;

type Report = {
  scanned: {
    products: number;
    product_images: number;
    storage_files: number;
  };
  deleted: {
    db_urls_removed: number;
    storage_files_deleted: number;
  };
  failed: {
    http_checks: number;
    db_updates: number;
    storage_deletes: number;
  };
  skipped: {
    invalid_url: number;
    already_placeholder_or_empty: number;
    non_file_entries: number;
  };
  samples: {
    db_updates: Array<{ product_id: string; removed: string[]; kept: string[] }>;
    storage_deletes: Array<{ path: string; reason: "orphan" | "inaccessible"; ok: boolean; error?: string }>;
  };
  errors: string[];
};

// Legacy result kept for backward compatibility with existing UI
interface LegacyCleanupResult {
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

function isProductImagesPublicUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const cleaned = url.split("?")[0].trim();
  return cleaned.startsWith(STORAGE_BASE);
}

function toStoragePathFromPublicUrl(url: string): string {
  return url.split("?")[0].trim().replace(STORAGE_BASE, "");
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Real HTTP check (HEAD then GET) with timeout.
async function isPublicImageAccessible(url: string, report: Report): Promise<boolean> {
  const cleanUrl = url.split("?")[0].trim();
  try {
    const head = await fetchWithTimeout(cleanUrl, { method: "HEAD" }, 8000);
    if (head.ok) return true;

    // Some environments/proxies can behave poorly with HEAD: try a small GET.
    const get = await fetchWithTimeout(
      cleanUrl,
      {
        method: "GET",
        headers: {
          // Try to minimize payload while still doing a real access.
          Range: "bytes=0-0",
        },
      },
      10000
    );

    return get.ok;
  } catch {
    report.failed.http_checks++;
    return false;
  }
}

async function removeWithRetry(
  supabaseAdmin: ReturnType<typeof createClient>,
  path: string,
  report: Report,
  reason: "orphan" | "inaccessible",
  maxAttempts = 3
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path]);
      if (!error) {
        report.deleted.storage_files_deleted++;
        report.samples.storage_deletes.push({ path, reason, ok: true });
        return true;
      }

      if (attempt === maxAttempts) {
        report.failed.storage_deletes++;
        report.samples.storage_deletes.push({ path, reason, ok: false, error: error.message });
        report.errors.push(`[storage.remove] ${path}: ${error.message}`);
        return false;
      }

      await sleep(250 * attempt);
    } catch (e) {
      if (attempt === maxAttempts) {
        report.failed.storage_deletes++;
        report.samples.storage_deletes.push({ path, reason, ok: false, error: String(e) });
        report.errors.push(`[storage.remove.exception] ${path}: ${String(e)}`);
        return false;
      }
      await sleep(250 * attempt);
    }
  }

  return false;
}

async function listAllStorageFiles(supabaseAdmin: ReturnType<typeof createClient>): Promise<string[]> {
  // Breadth-first scan with pagination per folder.
  const files: string[] = [];
  const prefixes: string[] = [""]; // root

  while (prefixes.length) {
    const prefix = prefixes.shift() ?? "";
    let offset = 0;

    // paginate
    while (true) {
      const { data, error } = await supabaseAdmin.storage.from(BUCKET).list(prefix, {
        limit: 1000,
        offset,
        sortBy: { column: "name", order: "asc" },
      });

      if (error) {
        // If a folder fails listing, skip it but don't crash.
        break;
      }

      const batch = data ?? [];
      if (batch.length === 0) break;

      for (const entry of batch) {
        if (!entry?.name) continue;

        // Folder entries typically have no id and no metadata.
        const isFolder = (entry as any).id == null && (entry as any).metadata == null;
        if (isFolder) {
          const nextPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
          prefixes.push(nextPrefix);
          continue;
        }

        // File
        const filePath = prefix ? `${prefix}/${entry.name}` : entry.name;
        files.push(filePath);
      }

      if (batch.length < 1000) break;
      offset += 1000;
    }
  }

  return files;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized - Missing token" }), {
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
    return new Response(JSON.stringify({ success: false, error: "Unauthorized - Invalid token" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  const { data: isSuperAdmin } = await supabaseAuth.rpc("has_role", {
    _user_id: user.id,
    _role: "superadmin",
  });

  if (!isSuperAdmin) {
    return new Response(JSON.stringify({ success: false, error: "Forbidden - Superadmin access required" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 403,
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  const report: Report = {
    scanned: { products: 0, product_images: 0, storage_files: 0 },
    deleted: { db_urls_removed: 0, storage_files_deleted: 0 },
    failed: { http_checks: 0, db_updates: 0, storage_deletes: 0 },
    skipped: { invalid_url: 0, already_placeholder_or_empty: 0, non_file_entries: 0 },
    samples: { db_updates: [], storage_deletes: [] },
    errors: [],
  };

  const legacy: LegacyCleanupResult = {
    totalProductsChecked: 0,
    brokenImagesFound: 0,
    imagesRemovedFromDB: 0,
    productsUpdated: 0,
    storageFilesDeleted: 0,
    orphanedFilesDeleted: 0,
    errors: [],
    details: [],
  };

  console.log(`[CLEANUP] start by ${user.id}`);

  try {
    // 1) Fetch all products (id/title/images)
    const { data: products, error: fetchError } = await supabaseAdmin
      .from("products")
      .select("id, title, images");

    if (fetchError) {
      throw new Error(`Failed to fetch products: ${fetchError.message}`);
    }

    const productList = products ?? [];
    report.scanned.products = productList.length;
    legacy.totalProductsChecked = productList.length;

    // 2) Scan storage first to build a set of existing files
    const storageFiles = await listAllStorageFiles(supabaseAdmin);
    report.scanned.storage_files = storageFiles.length;
    const storageSet = new Set(storageFiles);

    // 3) Build set of referenced storage paths (after we clean DB)
    const referencedPaths = new Set<string>();

    // 4) HARD RESET per product: keep only accessible & existing bucket images.
    for (const product of productList) {
      const rawImages: unknown = (product as any).images;

      if (!Array.isArray(rawImages) || rawImages.length === 0) {
        report.skipped.already_placeholder_or_empty++;
        continue;
      }

      const kept: string[] = [];
      const removed: string[] = [];

      for (const raw of rawImages as any[]) {
        if (!raw || typeof raw !== "string") {
          removed.push(String(raw));
          legacy.brokenImagesFound++;
          continue;
        }

        const cleanedUrl = raw.split("?")[0].trim();

        if (!isProductImagesPublicUrl(cleanedUrl)) {
          report.skipped.invalid_url++;
          removed.push(cleanedUrl);
          legacy.brokenImagesFound++;
          continue;
        }

        report.scanned.product_images++;

        const path = toStoragePathFromPublicUrl(cleanedUrl);

        // Missing in storage listing => broken.
        if (!storageSet.has(path)) {
          removed.push(cleanedUrl);
          legacy.brokenImagesFound++;
          continue;
        }

        // Real HTTP check
        const ok = await isPublicImageAccessible(cleanedUrl, report);
        if (!ok) {
          removed.push(cleanedUrl);
          legacy.brokenImagesFound++;

          // Try to delete the inaccessible file to avoid future issues.
          const deleted = await removeWithRetry(supabaseAdmin, path, report, "inaccessible");
          if (deleted) legacy.storageFilesDeleted++;

          continue;
        }

        kept.push(cleanedUrl);
      }

      // Update DB if changed (HARD RESET)
      const changed = kept.length !== (rawImages as any[]).length;
      if (changed) {
        try {
          const { error: updateError } = await supabaseAdmin
            .from("products")
            .update({ images: kept, updated_at: new Date().toISOString() })
            .eq("id", (product as any).id);

          if (updateError) {
            report.failed.db_updates++;
            legacy.errors.push(`Update failed for ${(product as any).id}: ${updateError.message}`);
            report.errors.push(`[db.update] product ${(product as any).id}: ${updateError.message}`);
          } else {
            report.deleted.db_urls_removed += removed.length;
            legacy.imagesRemovedFromDB += removed.length;
            legacy.productsUpdated++;

            report.samples.db_updates.push({ product_id: (product as any).id, removed, kept });

            legacy.details.push({
              productId: (product as any).id,
              productTitle: (product as any).title || "Sans titre",
              brokenUrls: removed,
              action: `Removed ${removed.length} broken image(s), ${kept.length} valid remaining`,
            });
          }
        } catch (e) {
          report.failed.db_updates++;
          legacy.errors.push(`Update exception for ${(product as any).id}: ${String(e)}`);
          report.errors.push(`[db.update.exception] product ${(product as any).id}: ${String(e)}`);
        }
      }

      // Track referenced paths for orphan cleanup.
      for (const url of kept) {
        referencedPaths.add(toStoragePathFromPublicUrl(url));
      }
    }

    // 5) HARD DELETE orphans in storage (anything not referenced anymore)
    for (const path of storageFiles) {
      if (!referencedPaths.has(path)) {
        const ok = await removeWithRetry(supabaseAdmin, path, report, "orphan");
        if (ok) legacy.orphanedFilesDeleted++;
      }
    }

    legacy.errors = [...new Set(legacy.errors)];
    report.errors = [...new Set(report.errors)];

    const partialFailures = report.failed.db_updates + report.failed.storage_deletes + report.failed.http_checks;

    return new Response(
      JSON.stringify({
        success: true,
        report,
        // backward compatibility
        result: legacy,
        message:
          partialFailures > 0
            ? `Nettoyage terminé avec erreurs partielles: ${report.deleted.db_urls_removed} URLs retirées DB, ${report.deleted.storage_files_deleted} fichiers supprimés storage, ${partialFailures} échecs.`
            : `Nettoyage terminé: ${report.deleted.db_urls_removed} URLs retirées DB, ${report.deleted.storage_files_deleted} fichiers supprimés storage.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("[CLEANUP] Fatal error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
