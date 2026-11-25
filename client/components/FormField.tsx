import { cloneElement, useId, type ReactElement, type ReactNode } from "react";

interface FormFieldProps {
  label: string;
  required?: boolean;
  hint?: ReactNode;
  counter?: string;
  children: ReactElement<{ id?: string }>;
}

export function FormField({
  label,
  required,
  hint,
  counter,
  children,
}: FormFieldProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-apoio">
        {label}
        {required && <span className="text-mata"> *</span>}
        {hint && (
          <span className="ml-2 text-xs font-normal text-fraco">{hint}</span>
        )}
      </label>
      {cloneElement(children, { id })}
      {counter && (
        <p className="mt-1 text-right text-xs tabular-nums text-fraco">
          {counter}
        </p>
      )}
    </div>
  );
}
