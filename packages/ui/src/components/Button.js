import { jsx as _jsx } from "react/jsx-runtime";
export function Button({ variant = 'primary', className = '', ...props }) {
    const v = variant === 'primary' ? 'btn btn-primary' : variant === 'secondary' ? 'btn btn-secondary' : 'btn btn-outline';
    return _jsx("button", { className: `${v} ${className}`, ...props });
}
export default Button;
//# sourceMappingURL=Button.js.map