import React from 'react';

export function Card({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`surface card ${className}`}>{children}</div>;
}

export default Card;
