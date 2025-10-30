import * as React from "react";

// jednoduchá utilitka na spájanie tried
function cn(...cls: Array<string | undefined | null | false>) {
  return cls.filter(Boolean).join(" ");
}

export type TableProps = React.TableHTMLAttributes<HTMLTableElement> & {
  containerClassName?: string; // className pre wrapper <div>
};

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ children, className, containerClassName, ...props }, ref) => (
    <div className={cn("w-full overflow-auto", containerClassName)}>
      <table
        ref={ref}
        className={cn(
          "w-full border-collapse border border-gray-300 text-sm text-left",
          className
        )}
        {...props}
      >
        {children}
      </table>
    </div>
  )
);
Table.displayName = "Table";

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ children, className, ...props }, ref) => (
  <thead ref={ref} className={cn("bg-gray-100", className)} {...props}>
    {children}
  </thead>
));
TableHeader.displayName = "TableHeader";

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ children, className, ...props }, ref) => (
  <tbody ref={ref} className={cn("", className)} {...props}>
    {children}
  </tbody>
));
TableBody.displayName = "TableBody";

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ children, className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn("border-b border-gray-300 hover:bg-gray-50", className)}
    {...props}
  >
    {children}
  </tr>
));
TableRow.displayName = "TableRow";

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ children, className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn("p-3 font-medium text-gray-700", className)}
    {...props}
  >
    {children}
  </th>
));
TableHead.displayName = "TableHead";

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ children, className, ...props }, ref) => (
  <td ref={ref} className={cn("p-3", className)} {...props}>
    {children}
  </td>
));
TableCell.displayName = "TableCell";
