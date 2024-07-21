import { cn } from "@/lib/utils";
import { VariantProps, cva } from "class-variance-authority";
import React from "react";

const alertStyles = cva(["alert"], {
  variants: {
    variant: {
      success: ["alert-success"],
      danger: ["alert-danger"],
    },
  },
  defaultVariants: {
    variant: "success",
  },
});

type Props = {
  msg: String;
  className?: String;
} & VariantProps<typeof alertStyles>;

export const Alert = ({ variant, msg, className }: Props) => {
  return <div className={cn(alertStyles({ variant }), className)}>{msg}</div>;
};
