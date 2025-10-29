import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline';
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const v =
    variant === 'primary' ? 'btn btn-primary' : variant === 'secondary' ? 'btn btn-secondary' : 'btn btn-outline';
  return <button className={`${v} ${className}`} {...props} />;
}

export default Button;
