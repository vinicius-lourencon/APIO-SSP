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
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-[#3D3B3B]"
      >
        {label}
        {required && <span className="text-[#10512D]"> *</span>}
        {hint && (
          <span className="ml-2 text-xs font-normal text-[#8A8888]">
            {hint}
          </span>
        )}
      </label>
      {cloneElement(children, { id })}
      {counter && (
        <p className="mt-1 text-right text-xs tabular-nums text-[#8A8888]">
          {counter}
        </p>
      )}
    </div>
  );
}
