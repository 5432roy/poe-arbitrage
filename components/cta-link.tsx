import type { ReactNode } from "react";
import Link from "next/link";

const variants = {
  primary:
    "inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors duration-fast ease-standard hover:bg-primary-hover",
  secondary:
    "inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors duration-fast ease-standard hover:bg-surface-muted",
  nav: "inline-flex min-h-11 items-center text-sm font-medium text-foreground-muted transition-colors duration-fast ease-standard hover:text-foreground",
} as const;

type CtaLinkProps = {
  href: string;
  children: ReactNode;
  variant?: keyof typeof variants;
  className?: string;
};

export function CtaLink({
  href,
  children,
  variant = "primary",
  className = "",
}: CtaLinkProps) {
  return (
    <Link href={href} className={`${variants[variant]} ${className}`.trim()}>
      {children}
    </Link>
  );
}
