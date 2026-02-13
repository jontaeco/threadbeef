"use client";

import { AnimatePresence, motion } from "framer-motion";

interface LoadingOverlayProps {
  visible: boolean;
}

export function LoadingOverlay({ visible }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-10 bg-bg/80 backdrop-blur-[4px] rounded-thread flex items-center justify-center"
        >
          <div className="w-8 h-8 border-[3px] border-border border-t-accent rounded-full animate-spin" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
