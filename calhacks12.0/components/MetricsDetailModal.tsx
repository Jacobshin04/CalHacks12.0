"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, Shield, Zap, FileText } from "lucide-react";
import { GradientText } from "./GradientText";

interface MetricsDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "security" | "design";
  title: string;
  content: string;
  score: number | null;
}

// Helper function to extract bullet points
const extractBulletPoints = (text: string): string[] => {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);

  const bullets = lines
    .filter(
      (line) =>
        line.match(/^[-•*→]\s+/) ||
        line.match(/^\d+[.)]\s+/) ||
        line.startsWith("•") ||
        line.startsWith("-") ||
        line.startsWith("*")
    )
    .map((line) =>
      line
        .replace(/^[-•*→]\s*/, "")
        .replace(/^\d+[.)]\s*/, "")
        .trim()
    )
    .filter((line) => line.length > 10 && line.length < 100);

  if (bullets.length === 0) {
    const sentences = text
      .replace(/[.!?]+/g, ".")
      .split(".")
      .map((s) => s.trim())
      .filter((s) => s.length > 20 && s.length < 150)
      .slice(0, 4);
    return sentences;
  }

  // Max 4 bullets
  return bullets.slice(0, 4);
};

export function MetricsDetailModal({
  isOpen,
  onClose,
  type,
  title,
  content,
  score,
}: MetricsDetailModalProps) {
  const IconComponent = type === "security" ? Shield : Zap;
  const gradientColors =
    type === "security"
      ? { from: "#2563eb", to: "#3b82f6" }
      : { from: "#10b981", to: "#059669" };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div
                className="p-6 text-white"
                style={{
                  background: `linear-gradient(135deg, ${gradientColors.from} 0%, ${gradientColors.to} 100%)`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <IconComponent className="w-8 h-8" />
                    <div>
                      <h2 className="text-2xl font-bold mb-1">{title}</h2>
                      <p className="text-white/80 text-sm">Detailed Analysis</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ rotate: 90, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </motion.button>
                </div>

                {/* Score Display */}
                {score !== null && (
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="flex items-center justify-between">
                      <span className="text-white/90">Overall Score</span>
                      <GradientText
                        from={gradientColors.from}
                        to={gradientColors.to}
                        className="text-3xl font-bold bg-white"
                      >
                        {score}/100
                      </GradientText>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full rounded-full bg-white"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {content ? (
                  <div className="space-y-3">
                    {extractBulletPoints(content).map((bullet, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span
                          className={`mt-1 text-lg font-bold ${
                            type === "security"
                              ? "text-[#2563eb]"
                              : "text-[#10b981]"
                          }`}
                        >
                          •
                        </span>
                        <p className="text-sm text-[#1E293B] flex-1 leading-relaxed font-semibold">
                          {bullet}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No analysis available yet.</p>
                )}
              </div>

              {/* Footer */}
              <div className="bg-[#F8F9FB] px-6 py-4 border-t border-[#E2E8F0]">
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="flex-1 px-6 py-3 rounded-xl text-white font-semibold"
                    style={{
                      background: `linear-gradient(135deg, ${gradientColors.from} 0%, ${gradientColors.to} 100%)`,
                    }}
                  >
                    Close
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
