export function DataTable({ columns, rows, empty = 'No records found' }) {
  return (
    <div className="rounded-lg border border-white/10">
      <div className="grid gap-3 p-3 lg:hidden">
        {rows?.length ? rows.map((row) => (
          <article key={row.id || JSON.stringify(row)} className="rounded-lg border border-white/10 bg-white/[0.045] p-3">
            <div className="grid gap-2">
              {columns.map((column) => (
                <div key={column.key} className="grid grid-cols-[7.5rem_1fr] gap-3 text-sm">
                  <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{column.label}</span>
                  <span className="min-w-0 break-words text-right text-muted-foreground">
                    {column.render ? column.render(row) : row[column.key]}
                  </span>
                </div>
              ))}
            </div>
          </article>
        )) : <p className="px-4 py-8 text-center text-muted-foreground">{empty}</p>}
      </div>
      <div className="hidden overflow-x-auto overscroll-x-contain lg:block">
        <table className="min-w-max divide-y divide-white/10 text-sm lg:min-w-full">
          <thead className="bg-white/[0.06]">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="whitespace-nowrap px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground sm:px-4">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows?.length ? rows.map((row) => (
              <tr key={row.id || JSON.stringify(row)} className="transition hover:bg-white/[0.04]">
                {columns.map((column) => (
                  <td key={column.key} className="max-w-56 overflow-hidden text-ellipsis whitespace-nowrap px-3 py-3 text-muted-foreground sm:px-4">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            )) : (
              <tr>
                <td className="px-4 py-8 text-center text-muted-foreground" colSpan={columns.length}>{empty}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
