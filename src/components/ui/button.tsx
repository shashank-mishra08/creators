import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:opacity-90 shadow-sm hover:-translate-y-0.5",
        accent:
          "bg-gradient-to-br from-accent to-[hsl(280_84%_68%)] text-accent-foreground shadow-[0_8px_24px_-8px_hsl(var(--accent)/0.7)] hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-8px_hsl(var(--accent)/0.8)]",
        outline:
          "border border-border bg-background/40 hover:bg-muted text-foreground",
        ghost: "hover:bg-muted text-foreground",
        subtle: "bg-muted text-foreground hover:bg-border",
      },
      size: {
        sm: "h-9 px-4",
        md: "h-11 px-6",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
