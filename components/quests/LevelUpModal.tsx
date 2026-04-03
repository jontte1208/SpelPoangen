"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";

// ─── CSS Confetti ─────────────────────────────────────────────────────────────

const COLORS = ["#facc15", "#00f5ff", "#a78bfa", "#f472b6", "#34d399", "#fb923c"];

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    type Particle = {
      x: number; y: number; vx: number; vy: number;
      size: number; color: string; rotation: number; rotationSpeed: number; opacity: number;
    };

    const particles: Particle[] = Array.from({ length: 120 }, () => ({
      x: randomBetween(0, canvas.width),
      y: randomBetween(-80, -10),
      vx: randomBetween(-2, 2),
      vy: randomBetween(2, 6),
      size: randomBetween(6, 12),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: randomBetween(0, Math.PI * 2),
      rotationSpeed: randomBetween(-0.1, 0.1),
      opacity: 1,
    }));

    let frame: number;
    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gravity
        p.rotation += p.rotationSpeed;
        if (p.y > canvas.height * 0.7) p.opacity = Math.max(0, p.opacity - 0.02);
        if (p.opacity > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        }
      }
      if (alive) frame = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 w-full h-full"
    />
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type Props = {
  show: boolean;
  newLevel: number;
  xpAwarded: number;
  onClose: () => void;
};

export default function LevelUpModal({ show, newLevel, xpAwarded, onClose }: Props) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal card */}
          <motion.div
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl border border-yellow-500/40 bg-slate-900 shadow-[0_0_60px_rgba(234,179,8,0.25)] text-center"
            initial={{ scale: 0.7, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 18, stiffness: 260 }}
          >
            {/* Confetti canvas */}
            <Confetti />

            <div className="relative px-8 py-10">
              {/* Glowing star */}
              <motion.div
                className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full border border-yellow-400/30 bg-yellow-400/10 shadow-[0_0_40px_rgba(234,179,8,0.4)]"
                initial={{ scale: 0.5, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
              >
                <motion.div
                  animate={{ rotate: [0, 15, -15, 10, -10, 0] }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <Star size={48} className="fill-yellow-400 text-yellow-400 drop-shadow-[0_0_12px_rgba(234,179,8,0.8)]" />
                </motion.div>
              </motion.div>

              {/* Text */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-yellow-500/80 mb-1">
                  Grattis!
                </p>
                <h2 className="text-3xl font-black text-white mb-1">NIVÅ UPP!</h2>
                <p className="text-lg font-bold text-yellow-300">
                  DU ÄR NU NIVÅ {newLevel}
                </p>
              </motion.div>

              {/* XP pill */}
              <motion.div
                className="mx-auto mt-4 inline-flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 }}
              >
                <span className="text-sm font-semibold text-blue-400">+{xpAwarded} XP intjänade</span>
              </motion.div>

              {/* Button */}
              <motion.button
                onClick={onClose}
                className="mt-6 w-full rounded-xl border border-yellow-500/40 bg-yellow-500/15 py-3 text-sm font-bold text-yellow-300 transition-colors hover:bg-yellow-500/25"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Fortsätt grinda 🔥
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
