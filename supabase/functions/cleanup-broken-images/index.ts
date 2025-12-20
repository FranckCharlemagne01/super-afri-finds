import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROJECT_REF = "zqskpspbyzptzjcoitwt";
const SUPABASE_URL_PUBLIC = `https://${PROJECT_REF}.supabase.co`;
const BUCKET = "product-images";
const STORAGE_BASE = `${SUPABASE_URL_PUBLIC}/storage/v1/object/public/${BUCKET}/`;

type SummaryReport = {
  scanned: number;
  db_cleaned: number;
  storage_deleted: number;
  failed: number;
  skipped: number;
};

type Report = {
  summary: SummaryReport;
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
    storage_list: number;
  };
  skipped: {
    invalid_url: number;
    already_empty: number;
    non_string: number;
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

function normalizeUrl(url: string): string {
  return url.split("?")[0].trim();
}

function isProductImagesPublicUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  return normalizeUrl(url).startsWith(STORAGE_BASE);
}

function toStoragePathFromPublicUrl(url: string): string {
  return normalizeUrl(url).replace(STORAGE_BASE, "");
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

async function isPublicImageAccessibleWithRetry(url: string, report: Report, maxAttempts = 2): Promise<boolean> {
  const cleanUrl = normalizeUrl(url);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const head = await fetchWithTimeout(cleanUrl, { method: "HEAD" }, 8000);
      if (head.ok) return true;

      // Some CDNs/proxies are weird with HEAD. Use a real GET with a tiny range.
      const get = await fetchWithTimeout(
        cleanUrl,
        {
          method: "GET",
          headers: { Range: "bytes=0-0" },
        },
        12000
      );

      if (get.ok) return true;

      // 403/404/500 etc: not accessible
      return false;
    } catch {
      report.failed.http_checks++;
      // Retry only if we still have attempts left.
      if (attempt < maxAttempts) {
        await sleep(250 * attempt);
        continue;
      }
      return false;
    }
  }

  return false;
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

async function listAllStorageFiles(supabaseAdmin: ReturnType<typeof createClient>, report: Report): Promise<string[]> {
  // Breadth-first scan with pagination per folder. Never throw.
  const files: string[] = [];
  const prefixes: string[] = [""]; // root

  while (prefixes.length) {
    const prefix = prefixes.shift() ?? "";
    let offset = 0;

    while (true) {
      let data: any[] | null = null;
      let error: any = null;

      // Retry listing a folder page (transient failures happen)
      for (let attempt = 1; attempt <= 3; attempt++) {
        const res = await supabaseAdmin.storage.from(BUCKET).list(prefix, {
          limit: 1000,
          offset,
          sortBy: { column: "name", order: "asc" },
        });

        data = (res.data as any[]) ?? null;
        error = res.error;

        if (!error) break;
        await sleep(200 * attempt);
      }

      if (error) {
        report.failed.storage_list++;
        report.errors.push(`[storage.list] prefix="${prefix}" offset=${offset}: ${error.message}`);
        // Skip this prefix page, but keep going.
        break;
      }

      const batch = data ?? [];
      if (batch.length === 0) break;

      for (const entry of batch) {
        if (!entry?.name) continue;

        const isFolder = (entry as any).id == null && (entry as any).metadata == null;
        if (isFolder) {
          const nextPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
          prefixes.push(nextPrefix);
          continue;
        }

        const filePath = prefix ? `${prefix}/${entry.name}` : entry.name;
        files.push(filePath);
      }

      if (batch.length < 1000) break;
      offset += 1000;
    }
  }

  return files;
}

async function mapLimit<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let idx = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const current = idx++;
      if (current >= items.length) return;
      results[current] = await worker(items[current]);
    }
  });

  await Promise.allSettled(runners);
  return results;
}

async function fetchAllProducts(supabaseAdmin: ReturnType<typeof createClient>, report: Report, legacy: LegacyCleanupResult) {
  const all: Array<{ id: string; title: string | null; images: string[] }> = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("id, title, images")
      .range(from, from + pageSize - 1);

    if (error) {
      report.errors.push(`[db.select] range(${from},${from + pageSize - 1}): ${error.message}`);
      legacy.errors.push(`Fetch products failed at offset ${from}: ${error.message}`);
      // Stop pagination but don't crash.
      break;
    }

    const batch = (data as any[]) ?? [];
    if (batch.length === 0) break;

    for (const p of batch) {
      all.push({
        id: p.id,
        title: p.title ?? null,
        images: Array.isArray(p.images) ? p.images : [],
      });
    }

    if (batch.length < pageSize) break;
    from += pageSize;
  }

  return all;
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

  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser();

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
    summary: { scanned: 0, db_cleaned: 0, storage_deleted: 0, failed: 0, skipped: 0 },
    scanned: { products: 0, product_images: 0, storage_files: 0 },
    deleted: { db_urls_removed: 0, storage_files_deleted: 0 },
    failed: { http_checks: 0, db_updates: 0, storage_deletes: 0, storage_list: 0 },
    skipped: { invalid_url: 0, already_empty: 0, non_string: 0 },
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

  // IMPORTANT: never throw. Always return a report even on partial failure.
  try {
    // 1) Scan storage first (so we can detect missing files fast)
    const storageFiles = await listAllStorageFiles(supabaseAdmin, report);
    report.scanned.storage_files = storageFiles.length;
    const storageSet = new Set(storageFiles);

    // 2) Fetch ALL products with pagination (100% scan)
    const productList = await fetchAllProducts(supabaseAdmin, report, legacy);
    report.scanned.products = productList.length;
    legacy.totalProductsChecked = productList.length;

    // 3) Track referenced paths AFTER DB cleanup
    const referencedPaths = new Set<string>();

    // 4) HARD RESET per product (keep only: correct bucket URL + exists in storage + publicly accessible)
    for (const product of productList) {
      const rawImages = product.images;

      if (!Array.isArray(rawImages) || rawImages.length === 0) {
        report.skipped.already_empty++;
        continue;
      }

      const kept: string[] = [];
      const removed: string[] = [];

      // Validate images concurrently (bounded)
      const decisions = await mapLimit(rawImages, 8, async (raw) => {
        if (!raw || typeof raw !== "string") {
          return { raw: String(raw), keep: false, reason: "non_string" as const };
        }

        const cleanedUrl = normalizeUrl(raw);

        if (!isProductImagesPublicUrl(cleanedUrl)) {
          return { raw: cleanedUrl, keep: false, reason: "invalid_url" as const };
        }

        report.scanned.product_images++;
        const path = toStoragePathFromPublicUrl(cleanedUrl);

        if (!storageSet.has(path)) {
          return { raw: cleanedUrl, keep: false, reason: "missing_in_storage" as const, path };
        }

        const ok = await isPublicImageAccessibleWithRetry(cleanedUrl, report);
        if (!ok) {
          // attempt delete but don't block
          await removeWithRetry(supabaseAdmin, path, report, "inaccessible");
          return { raw: cleanedUrl, keep: false, reason: "inaccessible" as const, path };
        }

        return { raw: cleanedUrl, keep: true, reason: "ok" as const, path };
      });

      for (const d of decisions) {
        if (d.keep) {
          kept.push(d.raw);
          if (d.path) referencedPaths.add(d.path);
        } else {
          removed.push(d.raw);
          legacy.brokenImagesFound++;
          if (d.reason === "invalid_url") report.skipped.invalid_url++;
          if (d.reason === "non_string") report.skipped.non_string++;
        }
      }

      const changed = kept.length !== rawImages.length;
      if (changed) {
        try {
          const { error: updateError } = await supabaseAdmin
            .from("products")
            .update({ images: kept, updated_at: new Date().toISOString() })
            .eq("id", product.id);

          if (updateError) {
            report.failed.db_updates++;
            legacy.errors.push(`Update failed for ${product.id}: ${updateError.message}`);
            report.errors.push(`[db.update] product ${product.id}: ${updateError.message}`);
          } else {
            report.deleted.db_urls_removed += removed.length;
            legacy.imagesRemovedFromDB += removed.length;
            legacy.productsUpdated++;
            report.samples.db_updates.push({ product_id: product.id, removed, kept });
            legacy.details.push({
              productId: product.id,
              productTitle: product.title || "Sans titre",
              brokenUrls: removed,
              action: `Removed ${removed.length} broken image(s), ${kept.length} valid remaining`,
            });
          }
        } catch (e) {
          report.failed.db_updates++;
          legacy.errors.push(`Update exception for ${product.id}: ${String(e)}`);
          report.errors.push(`[db.update.exception] product ${product.id}: ${String(e)}`);
        }
      } else {
        // even if unchanged, mark referenced
        for (const url of kept) referencedPaths.add(toStoragePathFromPublicUrl(url));
      }
    }

    // 5) HARD DELETE orphans in storage (anything not referenced anymore)
    for (const path of storageFiles) {
      if (!referencedPaths.has(path)) {
        const ok = await removeWithRetry(supabaseAdmin, path, report, "orphan");
        if (ok) legacy.orphanedFilesDeleted++;
      }
    }

    // Summaries
    const failedCount = report.failed.http_checks + report.failed.db_updates + report.failed.storage_deletes + report.failed.storage_list;
    const skippedCount = report.skipped.already_empty + report.skipped.invalid_url + report.skipped.non_string;

    report.summary = {
      scanned: report.scanned.products,
      db_cleaned: legacy.productsUpdated,
      storage_deleted: report.deleted.storage_files_deleted,
      failed: failedCount,
      skipped: skippedCount,
    };

    legacy.storageFilesDeleted = report.deleted.storage_files_deleted;

    legacy.errors = [...new Set(legacy.errors)];
    report.errors = [...new Set(report.errors)];

    return new Response(
      JSON.stringify({
        success: true,
        report,
        result: legacy,
        message:
          failedCount > 0
            ? `Nettoyage terminé avec erreurs partielles: ${report.deleted.db_urls_removed} URLs retirées DB, ${report.deleted.storage_files_deleted} fichiers supprimés storage, ${failedCount} échecs.`
            : `Nettoyage terminé: ${report.deleted.db_urls_removed} URLs retirées DB, ${report.deleted.storage_files_deleted} fichiers supprimés storage.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (e) {
    const msg = (e as Error)?.message || String(e);
    report.errors.push(`[fatal.catch] ${msg}`);

    report.summary = {
      scanned: report.scanned.products,
      db_cleaned: 0,
      storage_deleted: report.deleted.storage_files_deleted,
      failed: 1,
      skipped: 0,
    };

    return new Response(
      JSON.stringify({
        success: false,
        error: msg,
        report,
        result: legacy,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
