"use client";

import { motion } from "framer-motion";

interface NextBeefButtonProps {
  onClick: () => void;
  isLoading?: boolean;
}

export function NextBeefButton({ onClick, isLoading }: NextBeefButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={isLoading}
      whileHover={{ y: -2, scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className="bg-accent text-white px-12 py-4 rounded-pill font-display font-bold text-[1.1rem] hover:shadow-[0_8px_40px_rgba(255,77,77,0.35)] transition-shadow disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
      ) : (
        "Next Beef →"
      )}
    </motion.button>
  );
}
