import React from 'react';

type CardProps = React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>;

export function Card({ children, className = '', ...rest }: CardProps) {
  return (
    <div className={`surface card ${className}`} {...rest}>
      {children}
    </div>
  );
}

export default Card;
