import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="ml-2 text-xs text-muted">{hint}</span>}
      <div className="mt-2">{children}</div>
    </label>
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-2xl border border-border bg-bg px-4 text-base outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-4 focus:ring-accent/15",
        className,
      )}
      {...props}
    />
  );
}

export function FieldGroup({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">
        {label}
        {hint && <span className="ml-2 text-xs font-normal text-muted">{hint}</span>}
      </legend>
      <div className="mt-2.5">{children}</div>
    </fieldset>
  );
}

export function Chips<T extends string | number>({
  options,
  value,
  onChange,
  multiple = false,
  name,
}: {
  options: { value: T; label: string }[];
  value: T | T[];
  onChange: (value: T) => void;
  multiple?: boolean;
  name: string;
}) {
  const selected = (v: T) => (Array.isArray(value) ? value.includes(v) : value === v);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected(option.value);
        return (
          <label
            key={String(option.value)}
            className={cn(
              "cursor-pointer select-none rounded-full border px-4 py-2 text-sm font-medium transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-accent/20",
              active
                ? "border-accent bg-accent text-accent-fg"
                : "border-border bg-bg text-fg hover:border-fg/30",
            )}
          >
            <input
              type={multiple ? "checkbox" : "radio"}
              name={name}
              className="sr-only"
              checked={active}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}

export function OptionCard({
  active,
  title,
  description,
  onSelect,
  name,
}: {
  active: boolean;
  title: string;
  description: string;
  onSelect: () => void;
  name: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer gap-3 rounded-2xl border p-4 transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-accent/20",
        active ? "border-accent bg-accent-soft" : "border-border bg-bg hover:border-fg/30",
      )}
    >
      <input type="radio" name={name} className="sr-only" checked={active} onChange={onSelect} />
      <span
        className={cn(
          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 transition",
          active ? "border-accent" : "border-border",
        )}
      >
        {active && <span className="size-2.5 rounded-full bg-accent" />}
      </span>
      <span>
        <span className="block font-medium">{title}</span>
        <span className="mt-0.5 block text-sm text-muted">{description}</span>
      </span>
    </label>
  );
}
