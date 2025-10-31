export declare function Table<T extends object>({ columns, rows }: {
    columns: {
        key: keyof T;
        header: string;
    }[];
    rows: T[];
}): import("react/jsx-runtime").JSX.Element;
export default Table;
//# sourceMappingURL=Table.d.ts.map