export const PAGE_CACHE_TTL = 45 * 60 * 1000;

const pages = new Map();

export function getCachedPage(pageId, now = Date.now()) {
  const cached = pages.get(pageId);

  if (!cached || now - cached.savedAt >= PAGE_CACHE_TTL) {
    pages.delete(pageId);
    return null;
  }

  return cached.content;
}

export function cachePage(pageId, content, now = Date.now()) {
  pages.set(pageId, { content, savedAt: now });
}
