import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function Table({ columns, rows }) {
    return (_jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsx("tr", { children: columns.map((c) => (_jsx("th", { children: c.header }, String(c.key)))) }) }), _jsx("tbody", { children: rows.map((r, idx) => (_jsx("tr", { children: columns.map((c) => (_jsx("td", { children: String(r[c.key]) }, String(c.key)))) }, idx))) })] }));
}
export default Table;
//# sourceMappingURL=Table.js.map