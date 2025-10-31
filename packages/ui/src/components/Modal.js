import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from './Button';
export function Modal({ open, title, onClose, children, footer }) {
    if (!open)
        return null;
    return (_jsx("div", { className: "modal-overlay", role: "dialog", "aria-modal": "true", children: _jsxs("div", { className: "modal", children: [_jsxs("div", { className: "modal-header", children: [_jsx("strong", { children: title }), _jsx(Button, { variant: "outline", onClick: onClose, "aria-label": "Fechar", children: "Fechar" })] }), _jsx("div", { className: "modal-body", children: children }), footer && _jsx("div", { className: "modal-footer", children: footer })] }) }));
}
export default Modal;
//# sourceMappingURL=Modal.js.map