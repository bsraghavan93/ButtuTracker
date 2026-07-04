"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "danger";

type ButtonProps = HTMLMotionProps<"button"> & {
  variant?: Variant;
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-bt-purple to-bt-pink text-white shadow-lg shadow-purple-900/30",
  ghost: "glass text-foreground",
  danger: "bg-bt-red/90 text-white",
};

export function Button({ className, variant = "primary", children, ...props }: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        "rounded-2xl px-4 py-2.5 font-medium text-sm transition-colors disabled:opacity-50 disabled:pointer-events-none",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
