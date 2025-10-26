"use client";

import { useState } from "react";

interface FeedbackData {
  analysis: {
    overallScore: number;
    strengths: string[];
    improvements: string[];
    securityIssues: string[];
    performanceIssues: string[];
    codeQuality: string[];
    recommendations: string[];
  };
  summary: string;
}

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoName: string;
  feedback: FeedbackData | null;
  isLoading: boolean;
}

export default function FeedbackModal({
  isOpen,
  onClose,
  repoName,
  feedback,
  isLoading,
}: FeedbackModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            🧠 AI Code Analysis: {repoName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Analyzing your codebase...
              </h3>
              <p className="text-gray-600">
                Our AI is examining your code structure, patterns, and best practices
              </p>
            </div>
          ) : feedback ? (
            <div className="space-y-6">
              {/* Overall Score */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Overall Score
                  </h3>
                  <div
                    className={`text-3xl font-bold ${
                      feedback.analysis.overallScore >= 90
                        ? "text-green-600"
                        : feedback.analysis.overallScore >= 70
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {feedback.analysis.overallScore}/100
                  </div>
                </div>
                <p className="text-gray-700">{feedback.summary}</p>
              </div>

              {/* Strengths */}
              <div>
                <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center">
                  ✅ Strengths
                </h3>
                <ul className="space-y-2">
                  {feedback.analysis.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      <span className="text-gray-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Areas for Improvement */}
              <div>
                <h3 className="text-lg font-semibold text-yellow-700 mb-3 flex items-center">
                  🔧 Areas for Improvement
                </h3>
                <ul className="space-y-2">
                  {feedback.analysis.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-yellow-500 mr-2">•</span>
                      <span className="text-gray-700">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Security Issues */}
              {feedback.analysis.securityIssues.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-red-700 mb-3 flex items-center">
                    🔒 Security Issues
                  </h3>
                  <ul className="space-y-2">
                    {feedback.analysis.securityIssues.map((issue, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        <span className="text-gray-700">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Performance Issues */}
              {feedback.analysis.performanceIssues.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-orange-700 mb-3 flex items-center">
                    ⚡ Performance Issues
                  </h3>
                  <ul className="space-y-2">
                    {feedback.analysis.performanceIssues.map((issue, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-orange-500 mr-2">•</span>
                        <span className="text-gray-700">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Code Quality */}
              <div>
                <h3 className="text-lg font-semibold text-blue-700 mb-3 flex items-center">
                  📝 Code Quality
                </h3>
                <ul className="space-y-2">
                  {feedback.analysis.codeQuality.map((quality, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span className="text-gray-700">{quality}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="text-lg font-semibold text-purple-700 mb-3 flex items-center">
                  💡 Recommendations
                </h3>
                <ul className="space-y-2">
                  {feedback.analysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-purple-500 mr-2">•</span>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No analysis available
              </h3>
              <p className="text-gray-600">
                Click "Analyze with AI" to get started
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
