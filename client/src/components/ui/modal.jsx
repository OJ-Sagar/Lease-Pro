import { X } from 'lucide-react';
import { Button } from './button';

export function Modal({ title, description, open, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6">
      <div className="glass mx-auto max-h-[calc(100vh-3rem)] max-w-3xl overflow-y-auto rounded-lg p-5">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-white">{title}</h2>
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
