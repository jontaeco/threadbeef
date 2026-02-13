"use client";

import { motion } from "framer-motion";

interface HeatRatingProps {
  rating: number;
}

export function HeatRating({ rating }: HeatRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: rating }, (_, i) => (
        <motion.span
          key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.1 + 0.3, type: "spring", stiffness: 400, damping: 15 }}
          className="text-sm"
        >
          🌶️
        </motion.span>
      ))}
    </div>
  );
}
