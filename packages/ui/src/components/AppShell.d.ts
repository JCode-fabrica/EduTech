import React from 'react';
export declare function Header({ onToggleTheme, theme }: {
    onToggleTheme: () => void;
    theme?: 'light' | 'dark';
}): import("react/jsx-runtime").JSX.Element;
export declare function Sidebar({ children }: React.PropsWithChildren): import("react/jsx-runtime").JSX.Element;
export declare function AppShell({ header, sidebar, children }: React.PropsWithChildren<{
    header?: React.ReactNode;
    sidebar?: React.ReactNode;
}>): import("react/jsx-runtime").JSX.Element;
export default AppShell;
//# sourceMappingURL=AppShell.d.ts.map