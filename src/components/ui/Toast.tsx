"use client";

import { AnimatePresence, motion } from "framer-motion";

export type ToastState = { message: string; onUndo: () => void } | null;

export function Toast({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-[60] flex justify-center px-4">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="glass-strong pointer-events-auto flex items-center gap-3 rounded-full px-4 py-2.5 text-sm"
          >
            <span>{toast.message}</span>
            <button
              onClick={() => {
                toast.onUndo();
                onDismiss();
              }}
              className="font-semibold text-bt-pink"
            >
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
