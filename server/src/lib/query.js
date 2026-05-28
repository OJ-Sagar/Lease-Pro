export function pagination(query) {
  const page = Math.max(Number(query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize || 20), 1), 100);
  const from = (page - 1) * pageSize;
  return { page, pageSize, from, to: from + pageSize - 1 };
}

export function applyTextSearch(builder, columns, term) {
  if (!term) return builder;
  const pattern = columns.map((column) => `${column}.ilike.%${term}%`).join(',');
  return builder.or(pattern);
}
