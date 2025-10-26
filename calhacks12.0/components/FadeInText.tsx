import { motion } from "motion/react";

interface GitLitLogoProps {
  className?: string;
  animate?: boolean;
}

export function GitLitLogo({
  className = "w-24 h-24",
  animate = true,
}: GitLitLogoProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Main Logo SVG */}
      <svg
        viewBox="0 0 400 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-2xl"
      >
        {/* Flame/Fire Icon */}
        <g transform="translate(20, 20)">
          {/* Outer flame */}
          <motion.path
            d="M40 70C40 70 25 55 25 40C25 25 35 10 35 10C35 10 32 25 40 30C40 30 45 15 55 10C65 5 70 15 70 25C70 35 75 45 75 55C75 70 60 80 47.5 80C35 80 40 70 40 70Z"
            fill="url(#flameGradient1)"
            animate={
              animate
                ? {
                    scaleY: [1, 1.05, 0.98, 1.02, 1],
                    scaleX: [1, 0.98, 1.02, 0.99, 1],
                    y: [0, -2, 1, -1, 0],
                    opacity: [0.95, 1, 0.93, 0.98, 0.95],
                  }
                : {}
            }
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Middle flame */}
          <motion.path
            d="M45 65C45 65 38 55 38 45C38 35 43 25 43 25C43 25 42 35 47 38C47 38 50 28 56 25C62 22 65 28 65 35C65 42 68 48 68 54C68 64 58 70 50 70C42 70 45 65 45 65Z"
            fill="url(#flameGradient2)"
            animate={
              animate
                ? {
                    scaleY: [1, 0.97, 1.05, 0.99, 1],
                    scaleX: [1, 1.03, 0.98, 1.01, 1],
                    y: [0, 1, -2, 0.5, 0],
                    opacity: [0.9, 0.95, 1, 0.92, 0.9],
                  }
                : {}
            }
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3,
            }}
          />
          {/* Inner flame */}
          <motion.path
            d="M48 55C48 55 45 50 45 45C45 40 48 35 48 35C48 35 47.5 40 50 42C50 42 52 37 55 35C58 33 60 36 60 40C60 44 62 47 62 50C62 56 57 60 52.5 60C48 60 48 55 48 55Z"
            fill="url(#flameGradient3)"
            animate={
              animate
                ? {
                    scaleY: [1, 1.08, 0.95, 1.03, 1],
                    scaleX: [1, 0.96, 1.04, 0.98, 1],
                    y: [0, -3, 2, -1, 0],
                    opacity: [0.85, 0.95, 0.88, 1, 0.85],
                  }
                : {}
            }
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.6,
            }}
          />
        </g>

        {/* GitLit text - combined */}
        <text
          x="110"
          y="75"
          style={{
            fontSize: "64px",
            fontWeight: "800",
            fill: "url(#textGradient)",
            fontFamily: "system-ui, -apple-system, sans-serif",
            letterSpacing: "-2px",
          }}
        >
          GitLit
        </text>

        {/* Gradient Definitions */}
        <defs>
          {/* Flame gradients - blue */}
          <linearGradient id="flameGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="flameGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
          <linearGradient id="flameGradient3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#93c5fd" />
          </linearGradient>
          {/* Text gradient - blue */}
          <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="30%" stopColor="#3b82f6" />
            <stop offset="70%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
      </svg>

      {/* Animated glow effect - blue */}
      {animate && (
        <motion.div
          className="absolute inset-0 blur-3xl opacity-20 pointer-events-none"
          animate={{
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-blue-500 rounded-full" />
        </motion.div>
      )}
    </div>
  );
}

import { ReactNode } from "react";

interface FadeInTextProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function FadeInText({
  children,
  delay = 0,
  className = "",
}: FadeInTextProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
