"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export default function TestRepoPage() {
  const { data: session, status } = useSession();
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [repoFullName, setRepoFullName] = useState("");

  const testRepositoryFetch = async () => {
    if (!repoFullName.trim()) {
      alert("Please enter a repository full name (owner/repo)");
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      console.log('🧪 Testing repository fetch for:', repoFullName);
      
      const response = await fetch("/api/test-repo-fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: repoFullName.trim()
        }),
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

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="text-white text-xl mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <h1 className="text-white text-2xl mb-4">Please sign in to test repository fetching</h1>
          <a href="/auth/signin" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          🧪 Repository Fetching Test
        </h1>

        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Test Repository Code Fetching</h2>
          
          <div className="mb-4">
            <label className="block text-white text-sm font-medium mb-2">
              Repository Full Name (owner/repo):
            </label>
            <input
              type="text"
              value={repoFullName}
              onChange={(e) => setRepoFullName(e.target.value)}
              placeholder="e.g., facebook/react, microsoft/vscode"
              className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={testRepositoryFetch}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Testing..." : "Test Repository Fetch"}
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
                  <h4 className="text-green-300 font-semibold mb-2">Repository Structure</h4>
                  <div className="text-white text-sm space-y-1">
                    <p>Total Files: {testResult.data.structure.totalFiles}</p>
                    <p>Languages: {testResult.data.structure.languages.join(", ")}</p>
                    <p>Has README: {testResult.data.structure.hasReadme ? "Yes" : "No"}</p>
                    <p>Has package.json: {testResult.data.structure.hasPackageJson ? "Yes" : "No"}</p>
                    <p>Important Files: {testResult.data.structure.importantFiles}</p>
                  </div>
                </div>

                <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="text-blue-300 font-semibold mb-2">Code Analysis</h4>
                  <div className="text-white text-sm space-y-1">
                    <p>Functions: {testResult.data.analysis.functions}</p>
                    <p>Classes: {testResult.data.analysis.classes}</p>
                    <p>Imports: {testResult.data.analysis.imports}</p>
                    <p>Dependencies: {testResult.data.analysis.dependencies}</p>
                    <p>Total Lines: {testResult.data.analysis.totalLines}</p>
                    <p>Complexity: {testResult.data.analysis.complexity}</p>
                    <p>Test Coverage: {testResult.data.analysis.testCoverage}%</p>
                  </div>
                </div>

                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                  <p className="text-green-300 font-semibold">
                    🎉 Repository code fetching is working correctly!
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
          <h3 className="text-xl font-semibold text-white mb-4">How to Use This Test</h3>
          <div className="text-white text-sm space-y-2">
            <p>1. Enter a repository full name in the format "owner/repo" (e.g., "facebook/react")</p>
            <p>2. Click "Test Repository Fetch"</p>
            <p>3. Check the console logs for detailed information</p>
            <p>4. Look at the results above to see if code fetching is working</p>
            <p>5. If successful, you should see real numbers for files, functions, etc.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
