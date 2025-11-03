import * as React from "react"

export const Table = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full overflow-auto">
    <table className="w-full border-collapse border border-gray-300 text-sm text-left">{children}</table>
  </div>
)

export const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <thead className="bg-gray-100">{children}</thead>
)

export const TableBody = ({ children }: { children: React.ReactNode }) => (
  <tbody>{children}</tbody>
)

export const TableRow = ({ children }: { children: React.ReactNode }) => (
  <tr className="border-b border-gray-300 hover:bg-gray-50">{children}</tr>
)

export const TableHead = ({ children }: { children: React.ReactNode }) => (
  <th className="p-3 font-medium text-gray-700">{children}</th>
)

export const TableCell = ({ children }: { children: React.ReactNode }) => (
  <td className="p-3">{children}</td>
)
