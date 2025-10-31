import { jsx as _jsx } from "react/jsx-runtime";
export function Card({ children, className = '', ...rest }) {
    return (_jsx("div", { className: `surface card ${className}`, ...rest, children: children }));
}
export default Card;
//# sourceMappingURL=Card.js.map