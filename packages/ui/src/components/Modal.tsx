import React from 'react';
import { Button } from './Button';

export function Modal({
  open,
  title,
  onClose,
  children,
  footer
}: React.PropsWithChildren<{ open: boolean; title?: string; onClose: () => void; footer?: React.ReactNode }>) {
  if (!open) return null;
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <strong>{title}</strong>
          <Button variant="outline" onClick={onClose} aria-label="Fechar">Fechar</Button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;

