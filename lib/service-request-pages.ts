interface RequestPage<T> {
  data: { items: T[]; totalPages: number };
}

/** Keep client-side catalog filters consistent across every authorized page. */
export async function loadServiceRequestPages<T>(
  fetchPage: (params: { page: number; limit: number; scope?: 'catalog' }) => Promise<RequestPage<T>>,
  withCatalogScope = true,
): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const response = await fetchPage({ page, limit: 200, ...(withCatalogScope ? {scope:'catalog' as const} : {}) });
    items.push(...response.data.items);
    totalPages = response.data.totalPages;
    page += 1;
  } while (page <= totalPages);
  return items;
}
