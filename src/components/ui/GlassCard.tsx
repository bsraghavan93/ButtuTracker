"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type GlassCardProps = HTMLMotionProps<"div"> & {
  strong?: boolean;
};

export function GlassCard({ className, strong, children, ...props }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "rounded-3xl p-4",
        strong ? "glass-strong" : "glass",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
