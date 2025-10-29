import React from 'react';

export function Table<T extends object>({
  columns,
  rows
}: {
  columns: { key: keyof T; header: string }[];
  rows: T[];
}) {
  return (
    <table className="table">
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={String(c.key)}>{c.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, idx) => (
          <tr key={idx}>
            {columns.map((c) => (
              <td key={String(c.key)}>{String(r[c.key])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Table;
