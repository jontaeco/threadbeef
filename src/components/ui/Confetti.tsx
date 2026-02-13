"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PARTICLE_COUNT = 30;
const COLORS = [
  "#ff4d4d", // accent
  "#f5c542", // yellow
  "#4dabf7", // blue
  "#51cf66", // green
  "#cc5de8", // purple
  "#ff922b", // orange
];

interface ConfettiProps {
  trigger: boolean;
}

interface Particle {
  id: number;
  x: number;
  color: string;
  rotation: number;
  scale: number;
}

export function Confetti({ trigger }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (trigger) {
      const newParticles: Particle[] = Array.from(
        { length: PARTICLE_COUNT },
        (_, i) => ({
          id: i,
          x: Math.random() * 100,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          rotation: Math.random() * 720 - 360,
          scale: Math.random() * 0.5 + 0.5,
        })
      );
      setParticles(newParticles);

      const timer = setTimeout(() => setParticles([]), 1800);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <AnimatePresence>
      {particles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{
                x: `${p.x}vw`,
                y: "-5vh",
                opacity: 1,
                rotate: 0,
                scale: p.scale,
              }}
              animate={{
                y: "110vh",
                opacity: [1, 1, 0],
                rotate: p.rotation,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.5,
                ease: "easeIn",
                delay: Math.random() * 0.3,
              }}
              className="absolute w-3 h-3 rounded-sm"
              style={{ backgroundColor: p.color }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
