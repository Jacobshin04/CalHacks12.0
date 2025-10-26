"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  Code,
  Shield,
  Zap,
  Bug,
} from "lucide-react";
import { Icons } from "./Icons";
import { GradientText } from "./GradientText";

interface ReviewDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReviewDetailsModal({
  isOpen,
  onClose,
}: ReviewDetailsModalProps) {
  const issues = [
    {
      type: "warning",
      severity: "Minor",
      title: "Unused import detected",
      description: "Line 42: Import 'unused' from './utils' is never used",
      file: "src/components/Button.tsx",
      line: 42,
      suggestion: "Remove the unused import or use it in the code",
    },
    {
      type: "info",
      severity: "Suggestion",
      title: "Consider extracting magic number",
      description:
        "Line 156: Magic number '42' should be extracted to a named constant",
      file: "src/utils/helpers.ts",
      line: 156,
      suggestion: "Define constant: const MAX_RETRIES = 42;",
    },
  ];

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
              <div className="bg-gradient-to-r from-[#4F46E5] to-[#3B82F6] p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Review Details</h2>
                    <p className="text-blue-100">PR #42 - cinesis-app</p>
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
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Overall Score */}
                <div className="bg-gradient-to-br from-[#F8F9FB] to-[#EEF2FF] rounded-2xl p-6 border border-[#E2E8F0]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[#1E293B]">
                      Overall Score
                    </h3>
                    <GradientText
                      from="#4F46E5"
                      to="#3B82F6"
                      className="text-3xl font-bold"
                    >
                      87/100
                    </GradientText>
                  </div>
                  <div className="h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#4F46E5] to-[#3B82F6] rounded-full"
                      style={{ width: "87%" }}
                    />
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border-2 border-[#E2E8F0] rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <span className="font-semibold text-[#1E293B]">
                        Readability
                      </span>
                    </div>
                    <p className="text-lg font-bold text-green-600">Good</p>
                  </div>

                  <div className="bg-white border-2 border-[#E2E8F0] rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                      </div>
                      <span className="font-semibold text-[#1E293B]">Bugs</span>
                    </div>
                    <p className="text-lg font-bold text-amber-600">2 minor</p>
                  </div>

                  <div className="bg-white border-2 border-[#E2E8F0] rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-green-600" />
                      </div>
                      <span className="font-semibold text-[#1E293B]">
                        Security
                      </span>
                    </div>
                    <p className="text-lg font-bold text-green-600">
                      No issues
                    </p>
                  </div>

                  <div className="bg-white border-2 border-[#E2E8F0] rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-green-600" />
                      </div>
                      <span className="font-semibold text-[#1E293B]">
                        Performance
                      </span>
                    </div>
                    <p className="text-lg font-bold text-green-600">Optimal</p>
                  </div>
                </div>

                {/* Issues List */}
                <div>
                  <h3 className="text-lg font-semibold text-[#1E293B] mb-4">
                    Issues Found
                  </h3>
                  <div className="space-y-3">
                    {issues.map((issue, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white border-2 border-[#E2E8F0] rounded-xl p-4 hover:border-[#3B82F6] transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              issue.type === "warning"
                                ? "bg-amber-50"
                                : "bg-blue-50"
                            }`}
                          >
                            {issue.type === "warning" ? (
                              <AlertTriangle className="w-5 h-5 text-amber-600" />
                            ) : (
                              <Info className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-[#1E293B]">
                                {issue.title}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                                  issue.severity === "Minor"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {issue.severity}
                              </span>
                            </div>
                            <p className="text-sm text-[#64748B] mb-2">
                              {issue.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-[#64748B] mb-2">
                              <span className="flex items-center gap-1">
                                <Code className="w-4 h-4" />
                                {issue.file}
                              </span>
                              <span>Line {issue.line}</span>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-3">
                              <p className="text-sm text-[#64748B]">
                                <span className="font-semibold text-blue-700">
                                  💡 Suggestion:{" "}
                                </span>
                                {issue.suggestion}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-[#F8F9FB] px-6 py-4 border-t border-[#E2E8F0]">
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#3B82F6] text-white font-semibold"
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
