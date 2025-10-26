"use client";

import { useState } from "react";

export default function TestClaudePage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testClaudeAPI = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      console.log('🧪 Testing Claude API from frontend...');
      
      const response = await fetch("/api/test-claude", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log('🧪 Test result:', data);
      
      setTestResult(data);
    } catch (error) {
      console.error('❌ Test failed:', error);
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          🧪 Claude AI API Test
        </h1>

        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Test Claude AI API Connection</h2>
          <p className="text-white/80 mb-6">
            This will test if the Claude AI API is working correctly with your API key.
          </p>

          <button
            onClick={testClaudeAPI}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Testing Claude API..." : "Test Claude API"}
          </button>
        </div>

        {testResult && (
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              {testResult.success ? "✅ Test Results" : "❌ Test Failed"}
            </h3>

            {testResult.success ? (
              <div className="space-y-4">
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                  <h4 className="text-green-300 font-semibold mb-2">Claude API Response</h4>
                  <div className="text-white text-sm space-y-1">
                    <p><strong>Overall Score:</strong> {testResult.response.overallScore}</p>
                    <p><strong>Strengths Count:</strong> {testResult.response.strengthsCount}</p>
                    <p><strong>Summary:</strong> {testResult.response.summary}</p>
                  </div>
                </div>

                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                  <p className="text-green-300 font-semibold">
                    🎉 Claude AI API is working correctly!
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <h4 className="text-red-300 font-semibold mb-2">Error Details</h4>
                <p className="text-white text-sm">{testResult.error}</p>
                <p className="text-white text-sm mt-2">{testResult.message}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">What This Test Does</h3>
          <div className="text-white text-sm space-y-2">
            <p>1. Creates a Claude Service instance</p>
            <p>2. Tests the API key loading and validation</p>
            <p>3. Sends a test request to Claude AI</p>
            <p>4. Checks the response format and content</p>
            <p>5. Reports success or failure with detailed error information</p>
          </div>
        </div>

        <div className="mt-4 bg-white/10 backdrop-blur-lg rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Check Console Logs</h3>
          <div className="text-white text-sm space-y-2">
            <p>Open your browser's Developer Tools (F12) and check the Console tab for detailed logs:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>🔑 Claude API Key debug information</li>
              <li>🔧 Claude Service initialization logs</li>
              <li>🌐 API request and response details</li>
              <li>❌ Detailed error messages if something fails</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
