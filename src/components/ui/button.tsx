import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const variants = {
  default: "bg-primary text-primary-foreground shadow-[var(--shadow-xs)] hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  destructive: "bg-destructive text-destructive-foreground shadow-[var(--shadow-xs)] hover:bg-destructive/90",
  outline: "border border-border bg-card hover:bg-secondary hover:border-border/80",
  ghost: "hover:bg-secondary",
  link: "text-primary underline-offset-4 hover:underline px-0 min-h-0",
} as const;

const sizes = {
  default: "h-11 px-5 py-2 text-sm",
  sm: "h-9 px-3 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-11 w-11",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", disabled, ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[var(--radius)] font-medium",
          "transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50",
          "active:scale-[0.98]",
          variants[variant],
          sizes[size],
          className,
        )}
        ref={ref}
        disabled={disabled}
        aria-disabled={disabled || undefined}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
