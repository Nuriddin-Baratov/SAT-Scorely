import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ComponentProps } from "react";
import { cn } from "@/shared/lib";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-fg shadow-[0_8px_24px_-8px_var(--accent)] hover:brightness-110 active:brightness-95",
  secondary: "bg-fg text-bg hover:opacity-90",
  outline: "border border-border bg-surface text-fg hover:bg-surface-2",
  ghost: "text-fg hover:bg-surface-2",
  danger: "text-danger hover:bg-danger-soft",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-13 px-7 text-base gap-2",
};

const base =
  "inline-flex items-center justify-center rounded-full font-medium transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-45 select-none whitespace-nowrap";

interface StyleProps {
  variant?: Variant;
  size?: Size;
}

export function buttonClass({ variant = "primary", size = "md" }: StyleProps = {}, className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & StyleProps) {
  return <button type={type} className={buttonClass({ variant, size }, className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & AnchorHTMLAttributes<HTMLAnchorElement> & StyleProps) {
  return <Link className={buttonClass({ variant, size }, className)} {...props} />;
}
