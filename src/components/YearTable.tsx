import { tableFeatures, useTable, type ColumnDef } from "@tanstack/react-table";

interface TableColumn<T> {
  id: string;
  header: string;
  align: "left" | "right";
  cell: (row: T) => string;
}

const features = tableFeatures({});

export function YearTable<T extends { year: number }>({
  rows,
  columns,
  caption,
}: {
  rows: T[];
  columns: readonly TableColumn<T>[];
  caption: string;
}) {
  const alignById = new Map(columns.map((column) => [column.id, column.align]));
  const columnDefs: ColumnDef<typeof features, T>[] = columns.map((column) => ({
    id: column.id,
    header: column.header,
    cell: (info) => column.cell(info.row.original),
  }));

  const table = useTable({
    features,
    data: rows,
    columns: columnDefs,
    getRowId: (row) => String(row.year),
  });

  return (
    <section className="rounded-2xl border border-line bg-card">
      <div className="border-b border-line px-4 py-3">
        <h2 className="font-display text-2xl">Year by year</h2>
      </div>
      <div className="max-h-[28rem] overflow-auto">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 bg-card">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-line text-left text-muted">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    className={`px-4 py-2 font-medium ${alignClass(alignById.get(header.column.id))}`}
                  >
                    <table.FlexRender header={header} />
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-line/70 last:border-0">
                {row.getAllCells().map((cell) => (
                  <td key={cell.id} className={`px-4 py-2 tabular-nums ${alignClass(alignById.get(cell.column.id))}`}>
                    <table.FlexRender cell={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function alignClass(align: "left" | "right" | undefined): string {
  return align === "left" ? "text-left" : "text-right";
}
