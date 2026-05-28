import { Input, Select } from './ui/input';

export function Field({ label, children }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-white">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function TextField({ label, ...props }) {
  return (
    <Field label={label}>
      <Input {...props} />
    </Field>
  );
}

export function SelectField({ label, children, ...props }) {
  return (
    <Field label={label}>
      <Select {...props}>{children}</Select>
    </Field>
  );
}

export function FormError({ message }) {
  if (!message) return null;
  return <p className="rounded-md border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">{message}</p>;
}
