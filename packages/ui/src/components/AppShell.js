import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from './Button';
export function Header({ onToggleTheme, theme = 'light' }) {
    return (_jsxs("div", { className: "header", children: [_jsx("div", { style: { display: 'flex', gap: 12, alignItems: 'center' }, children: _jsx("strong", { children: "EduTech" }) }), _jsx("div", { className: "row", children: _jsx(Button, { variant: "outline", onClick: onToggleTheme, "aria-label": "Alternar tema", children: theme === 'light' ? '🌙' : '☀️' }) })] }));
}
export function Sidebar({ children }) {
    return _jsx("aside", { className: "sidebar", children: children });
}
export function AppShell({ header, sidebar, children }) {
    return (_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '240px 1fr', height: '100%' }, children: [_jsx("div", { children: sidebar }), _jsxs("div", { style: { display: 'grid', gridTemplateRows: '56px 1fr' }, children: [_jsx("div", { children: header }), _jsx("div", { className: "content", children: children })] })] }));
}
export default AppShell;
//# sourceMappingURL=AppShell.js.map