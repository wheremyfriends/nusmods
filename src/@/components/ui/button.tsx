import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  `btn !inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm
  font-medium ring-offset-background transition-colors focus-visible:outline-none
  focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed gap-x-1`,
  {
    variants: {
      variant: {
        default: "btn-outline-primary",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "btn-outline-secondary",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-black underline-offset-4 hover:bg-gray-200",
        submit: "btn-primary w-full",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
