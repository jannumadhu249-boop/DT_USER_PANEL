import { URLS } from "../url";

export const resolveMediaUrl = (raw) => {
  if (!raw || typeof raw !== "string") return "";

  let path = raw.trim().replace(/\\/g, "/");
  if (!path) return "";

  path = path.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, "http://72.61.116.4:8000");

  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }

  const base = (URLS.ImageUrl || URLS.Base_Url || "http://72.61.116.4:8000").replace(/\/+$/, "");
  const bare = path.replace(/^\/+/, "");

  if (!bare.includes("/")) {
    return `${base}/uploads/dashboard/${bare}`;
  }

  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
};

export const getMediaUrlCandidates = (raw) => {
  if (!raw) return [];
  const primaryBase = (URLS.ImageUrl || URLS.Base_Url || "http://72.61.116.4:8000").replace(/\/+$/, "");
  const fallbackBase = "http://72.61.116.4:8000";
  const bases = [...new Set([primaryBase, fallbackBase].filter(Boolean))];

  const trimmedRaw = String(raw).trim().replace(/\\/g, "/");
  if (!trimmedRaw) return [];

  const candidates = [];

  if (trimmedRaw.startsWith("http://") || trimmedRaw.startsWith("https://") || trimmedRaw.startsWith("data:")) {
    const primary = trimmedRaw.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, primaryBase);
    candidates.push(primary);
    if (primary.includes("/public/")) {
      candidates.push(primary.replace("/public/", "/"));
    }
    if (!primary.includes("/uploads/")) {
      try {
        const u = new URL(primary);
        candidates.push(`${u.origin}/uploads/dashboard${u.pathname}`);
        candidates.push(`${u.origin}/uploads/banners${u.pathname}`);
        candidates.push(`${u.origin}/uploads/file_status${u.pathname}`);
        candidates.push(`${u.origin}/uploads${u.pathname}`);
      } catch {
        /* ignore */
      }
    }
  } else {
    const bare = trimmedRaw.replace(/^\/+/, "");
    for (const b of bases) {
      if (!bare.includes("/")) {
        candidates.push(`${b}/uploads/dashboard/${bare}`);
        candidates.push(`${b}/uploads/banners/${bare}`);
        candidates.push(`${b}/uploads/file_status/${bare}`);
        candidates.push(`${b}/uploads/${bare}`);
        candidates.push(`${b}/public/uploads/dashboard/${bare}`);
        candidates.push(`${b}/public/uploads/banners/${bare}`);
        candidates.push(`${b}/public/uploads/file_status/${bare}`);
        candidates.push(`${b}/public/uploads/${bare}`);
        candidates.push(`${b}/${bare}`);
        candidates.push(`${b}/public/${bare}`);
      } else {
        if (bare.startsWith("uploads/")) {
          candidates.push(`${b}/${bare}`);
          candidates.push(`${b}/public/${bare}`);
        } else {
          candidates.push(`${b}/uploads/${bare}`);
          candidates.push(`${b}/public/uploads/${bare}`);
          candidates.push(`${b}/${bare}`);
        }
      }
    }
  }

  // Also include URI-encoded versions if candidate has spaces
  const all = [];
  for (const c of candidates) {
    if (c) {
      all.push(c);
      if (c.includes(" ")) {
        all.push(encodeURI(c));
      }
    }
  }

  return [...new Set(all)];
};

