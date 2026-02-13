"use client";

import { motion } from "framer-motion";

interface VerdictLabelProps {
  label: string;
  emoji: string;
}

export function VerdictLabel({ label, emoji }: VerdictLabelProps) {
  return (
    <motion.div
      initial={{ scale: 3, opacity: 0, y: -20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 600,
        damping: 20,
        mass: 1.2,
        delay: 0.8,
      }}
      className="font-display font-bold text-lg text-text text-center"
    >
      {label} {emoji}
    </motion.div>
  );
}
