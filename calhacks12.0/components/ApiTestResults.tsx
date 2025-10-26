"use client";

import { useState } from "react";

interface EndpointTest {
  method: string;
  path: string;
  url: string;
  status: "success" | "error" | "pending";
  statusCode?: number;
  responseTime?: number;
  responseBody?: any;
  error?: string;
  expanded?: boolean;
}

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  avgResponseTime: number;
}

interface ApiTestResultsProps {
  tests: EndpointTest[];
  summary: TestSummary;
  isLoading?: boolean;
  message?: string;
  requiresServer?: boolean;
  serverCommand?: string;
}

export default function ApiTestResults({
  tests,
  summary,
  isLoading = false,
  message,
  requiresServer,
  serverCommand,
}: ApiTestResultsProps) {
  const [expandedTest, setExpandedTest] = useState<number | null>(null);

  const handleExportToPostman = async () => {
    try {
      const response = await fetch("/api/postman/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoints: tests }),
      });

      const collection = await response.json();

      // Download as JSON file
      const blob = new Blob([JSON.stringify(collection, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "postman-collection.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting to Postman:", error);
      alert("Failed to export collection");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "pending":
        return "⏳";
      default:
        return "❓";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "pending":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-blue-100 text-blue-800";
      case "POST":
        return "bg-green-100 text-green-800";
      case "PUT":
        return "bg-yellow-100 text-yellow-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      case "PATCH":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Running API tests...</span>
        </div>
      </div>
    );
  }

  // Show server start message if needed
  if (requiresServer) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">🖥️</div>
          <p className="text-gray-600 text-lg font-medium mb-2">
            {message || "Server not running"}
          </p>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
            <p className="text-sm text-yellow-800 font-semibold mb-2">
              📋 To start the test server:
            </p>
            <div className="bg-gray-900 text-green-300 p-3 rounded font-mono text-sm">
              {serverCommand ||
                "cd example-test-repo && npm install && npm start"}
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Then click "🧪 Test API Endpoints" again to run real tests!
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!tests || tests.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-gray-600 text-lg font-medium mb-2">
            No API endpoints found to test.
          </p>
          {message && <p className="text-gray-500 text-sm">{message}</p>}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <p className="text-sm text-blue-800 font-semibold mb-2">💡 Tip:</p>
            <p className="text-sm text-blue-700">
              This repository doesn't contain API route files in standard
              locations (app/api/, routes/, etc.). Make sure your API endpoints
              are in one of these formats:
            </p>
            <ul className="list-disc list-inside mt-2 text-sm text-blue-700 space-y-1">
              <li>
                Next.js:{" "}
                <code className="bg-blue-100 px-1 rounded">app/api/</code> or{" "}
                <code className="bg-blue-100 px-1 rounded">pages/api/</code>
              </li>
              <li>
                Express:{" "}
                <code className="bg-blue-100 px-1 rounded">routes/</code> or{" "}
                <code className="bg-blue-100 px-1 rounded">controllers/</code>
              </li>
              <li>
                Flask: files with{" "}
                <code className="bg-blue-100 px-1 rounded">@app.route()</code>{" "}
                decorators
              </li>
              <li>
                FastAPI: files with{" "}
                <code className="bg-blue-100 px-1 rounded">@app.get()</code> or
                similar decorators
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Test Summary</h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="text-2xl font-bold">{summary.total}</div>
            <div className="text-sm opacity-90">Total Tests</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-200">
              {summary.passed}
            </div>
            <div className="text-sm opacity-90">Passed ✅</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-200">
              {summary.failed}
            </div>
            <div className="text-sm opacity-90">Failed ❌</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {Math.round(summary.avgResponseTime)}ms
            </div>
            <div className="text-sm opacity-90">Avg Response Time</div>
          </div>
        </div>
        {summary.total > 0 && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center justify-between text-sm">
              <div className="opacity-90">
                Success Rate:{" "}
                {Math.round((summary.passed / summary.total) * 100)}%
              </div>
              <div className="flex items-center space-x-2">
                <span className="opacity-75">⚡ Total Time:</span>
                <span className="font-bold">
                  {Math.round(summary.avgResponseTime * summary.total)}ms
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Export Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleExportToPostman}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all border border-white/20"
          >
            📥 Export to Postman
          </button>
        </div>
      </div>

      {/* Test Results List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>
        {tests.map((test, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 ${getStatusColor(
              test.status
            )} transition-all`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getStatusIcon(test.status)}</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${getMethodBadgeColor(
                    test.method
                  )}`}
                >
                  {test.method}
                </span>
                <span className="font-mono text-sm text-gray-700">
                  {test.path}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                {test.statusCode && (
                  <span
                    className={`font-medium ${
                      test.status === "success"
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    {test.statusCode}
                  </span>
                )}
                {test.responseTime !== undefined && (
                  <span className="text-gray-500">
                    ⏱️ {test.responseTime}ms
                  </span>
                )}
              </div>
            </div>

            {expandedTest === index && (
              <div className="mt-3 pt-3 border-t border-gray-300 space-y-3">
                {/* Summary Section */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-gray-600 text-xs">Status Code</div>
                    <div
                      className={`font-semibold ${
                        test.statusCode && test.statusCode < 400
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {test.statusCode || "N/A"}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-gray-600 text-xs">Response Time</div>
                    <div className="font-semibold text-gray-700">
                      {test.responseTime !== undefined
                        ? `${test.responseTime}ms`
                        : "N/A"}
                    </div>
                  </div>
                </div>

                {/* Full URL */}
                <div>
                  <div className="text-xs text-gray-600 mb-1">Full URL:</div>
                  <div className="bg-gray-900 text-green-300 p-2 rounded font-mono text-xs break-all">
                    {test.url}
                  </div>
                </div>

                {/* Error Section */}
                {test.error && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <div className="font-semibold text-red-800 mb-1 flex items-center">
                      ⚠️ Error
                    </div>
                    <div className="text-sm text-red-700 font-mono break-all">
                      {test.error}
                    </div>
                  </div>
                )}

                {/* Response Body */}
                {test.responseBody && (
                  <div>
                    <div className="font-semibold text-gray-700 mb-2 flex items-center">
                      📦 Response Body:
                    </div>
                    <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto max-h-64 overflow-y-auto border border-gray-700">
                      {typeof test.responseBody === "string"
                        ? test.responseBody
                        : JSON.stringify(test.responseBody, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Request Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <div className="text-xs font-semibold text-blue-800 mb-2">
                    🔍 Request Details
                  </div>
                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="text-gray-600">Method:</span>{" "}
                      <span className="font-mono font-semibold">
                        {test.method}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Endpoint:</span>{" "}
                      <span className="font-mono">{test.path}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Result:</span>
                      <span
                        className={`ml-1 font-semibold ${
                          test.status === "success"
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {test.status === "success" ? "✅ Success" : "❌ Failed"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() =>
                setExpandedTest(expandedTest === index ? null : index)
              }
              className="mt-2 text-xs text-blue-600 hover:text-blue-800"
            >
              {expandedTest === index ? "▼ Hide details" : "▶ Show details"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
