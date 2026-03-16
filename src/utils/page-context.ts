const PAGE_IDS = [
  'home',
  'conflicts-live',
  'infrastructure-risk',
  'stability-report',
  'intent-warning',
  'simulation',
  'opinion-war',
] as const;

export type PageId = typeof PAGE_IDS[number];

export function isValidPageId(value: string | null | undefined): value is PageId {
  return Boolean(value && PAGE_IDS.includes(value as PageId));
}

export function getCurrentPageId(): PageId {
  const fromUrl = new URLSearchParams(window.location.search).get('page')?.toLowerCase();
  if (isValidPageId(fromUrl)) return fromUrl;

  const fromBody = document.body.dataset.page?.toLowerCase();
  if (isValidPageId(fromBody)) return fromBody;

  const fromWindow = (window as unknown as { __WM_PAGE__?: string }).__WM_PAGE__?.toLowerCase();
  if (isValidPageId(fromWindow)) return fromWindow;

  return 'conflicts-live';
}

export function syncCurrentPageContext(): PageId {
  const page = getCurrentPageId();
  document.body.dataset.page = page;
  (window as unknown as { __WM_PAGE__?: string }).__WM_PAGE__ = page;
  return page;
}
