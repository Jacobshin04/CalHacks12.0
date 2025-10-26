"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import ApiTestResults from "@/components/ApiTestResults";

interface PullRequest {
  id: number;
  number: number;
  title: string;
  body: string;
  state: string;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  comments: any[];
  reviewComments: any[];
  totalComments: number;
}

export default function ReviewPage() {
  const params = useParams<{ owner: string; repo: string }>();
  const search = useSearchParams();
  const owner = params.owner;
  const repo = params.repo;
  const path = search.get("path") ?? "";

  const [pulls, setPulls] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null);

  // API Testing state
  const [showApiTests, setShowApiTests] = useState(false);
  const [apiTestsLoading, setApiTestsLoading] = useState(false);
  const [apiTestsResults, setApiTestsResults] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch both contents and pull requests
        const [contentsRes, pullsRes] = await Promise.all([
          fetch(
            `/api/github/contents?owner=${owner}&repo=${repo}&path=${encodeURIComponent(
              path
            )}`,
            {
              cache: "no-store",
            }
          ),
          fetch(
            `/api/github/pulls?owner=${owner}&repo=${repo}&state=all&per_page=20`,
            {
              cache: "no-store",
            }
          ),
        ]);

        if (!contentsRes.ok) {
          console.error("Contents fetch error:", await contentsRes.json());
        }

        if (!pullsRes.ok) {
          const errorData = await pullsRes.json();
          console.error("Pulls fetch error:", errorData);
          setError(errorData.error || "Failed to fetch pull requests");
          return;
        }

        const pullsData = await pullsRes.json();
        setPulls(pullsData.pulls || []);

        console.log(
          `[review] ${owner}/${repo} - Found ${
            pullsData.pulls?.length || 0
          } pull requests`
        );
      } catch (e) {
        console.error("Review fetch exception:", e);
        setError("An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [owner, repo, path]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case "open":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-red-100 text-red-800";
      case "merged":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleTestApiEndpoints = async () => {
    try {
      setApiTestsLoading(true);
      setShowApiTests(true);

      // Step 1: Discover endpoints
      const endpointsRes = await fetch("/api/analyze/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo }),
      });

      if (!endpointsRes.ok) {
        throw new Error("Failed to discover endpoints");
      }

      let endpointsData = await endpointsRes.json();

      // Map endpoints to correct paths for the test server
      if (endpointsData.endpoints && endpointsData.endpoints.length > 0) {
        const mapRes = await fetch("/api/test/map-endpoints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoints: endpointsData.endpoints }),
        });

        if (mapRes.ok) {
          const mappedData = await mapRes.json();
          endpointsData = { ...endpointsData, endpoints: mappedData.endpoints };
        }
      }

      // Check if any endpoints were found
      if (!endpointsData.endpoints || endpointsData.endpoints.length === 0) {
        setApiTestsResults({
          tests: [],
          summary: {
            total: 0,
            passed: 0,
            failed: 0,
            avgResponseTime: 0,
          },
          message: "No API endpoints found in this repository.",
        });
        return;
      }

      // Step 2: Setup server (mock mode - no Docker needed)
      const serverRes = await fetch("/api/runner/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo, useDocker: false }),
      });

      const serverData = await serverRes.json();

      // Step 3: Execute tests (using mock data, no real server needed)
      const testsRes = await fetch("/api/test/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoints: endpointsData.endpoints,
          baseUrl: serverData.server?.url || "http://localhost",
          serverPort: serverData.server?.port || 3001,
        }),
      });

      const testsData = await testsRes.json();
      setApiTestsResults(testsData);
    } catch (error) {
      console.error("Error testing API endpoints:", error);
      setError("Failed to test API endpoints");
    } finally {
      setApiTestsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <h1 className="text-2xl font-bold mb-2">
          Review: {owner}/{repo}
        </h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">
            Review: {owner}/{repo}
          </h1>
          <p className="text-gray-600 mt-1">
            Pull Request History and Comments
          </p>
        </div>
        <button
          onClick={handleTestApiEndpoints}
          disabled={apiTestsLoading}
          className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
        >
          {apiTestsLoading ? "Testing..." : "🧪 Test API Endpoints"}
        </button>
      </div>

      {/* API Test Results */}
      {showApiTests && apiTestsResults && (
        <div className="mb-6">
          <ApiTestResults
            tests={apiTestsResults.tests}
            summary={apiTestsResults.summary}
            isLoading={apiTestsLoading}
            message={apiTestsResults.message}
            requiresServer={apiTestsResults.requiresServer}
            serverCommand={apiTestsResults.serverCommand}
          />
        </div>
      )}

      <div className="mb-6"></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pull Requests List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Pull Requests ({pulls.length})
          </h2>
          {pulls.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <p className="text-gray-600">
                No pull requests found for this repository.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pulls.map((pull) => (
                <div
                  key={pull.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedPR?.id === pull.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedPR(pull)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 line-clamp-2">
                      #{pull.number} {pull.title}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStateColor(
                        pull.state
                      )}`}
                    >
                      {pull.state}
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <img
                      src={pull.user.avatar_url}
                      alt={pull.user.login}
                      className="w-4 h-4 rounded-full mr-2"
                    />
                    <span>{pull.user.login}</span>
                    <span className="mx-2">•</span>
                    <span>{formatDate(pull.updated_at)}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-500">
                    <span className="mr-4">
                      💬 {pull.totalComments} comments
                    </span>
                    <a
                      href={pull.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View on GitHub →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected PR Details and Comments */}
        <div>
          {selectedPR ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                PR #{selectedPR.number} Details
              </h2>

              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-gray-900 mb-2">
                  {selectedPR.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  {selectedPR.body || "No description provided."}
                </p>

                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <img
                    src={selectedPR.user.avatar_url}
                    alt={selectedPR.user.login}
                    className="w-5 h-5 rounded-full mr-2"
                  />
                  <span>{selectedPR.user.login}</span>
                  <span className="mx-2">•</span>
                  <span>Created {formatDate(selectedPR.created_at)}</span>
                  <span className="mx-2">•</span>
                  <span>Updated {formatDate(selectedPR.updated_at)}</span>
                </div>
              </div>

              {/* Comments Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Comments ({selectedPR.totalComments})
                </h3>

                {selectedPR.comments.length === 0 &&
                selectedPR.reviewComments.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                    <p className="text-gray-600">
                      No comments found for this pull request.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Regular Comments */}
                    {selectedPR.comments.map((comment, index) => (
                      <div
                        key={`comment-${index}`}
                        className="bg-white border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center mb-2">
                          <img
                            src={comment.user.avatar_url}
                            alt={comment.user.login}
                            className="w-6 h-6 rounded-full mr-2"
                          />
                          <span className="font-medium text-gray-900">
                            {comment.user.login}
                          </span>
                          <span className="text-sm text-gray-500 ml-2">
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                        <div className="text-gray-700 whitespace-pre-wrap">
                          {comment.body}
                        </div>
                      </div>
                    ))}

                    {/* Review Comments */}
                    {selectedPR.reviewComments.map((comment, index) => (
                      <div
                        key={`review-${index}`}
                        className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                      >
                        <div className="flex items-center mb-2">
                          <img
                            src={comment.user.avatar_url}
                            alt={comment.user.login}
                            className="w-6 h-6 rounded-full mr-2"
                          />
                          <span className="font-medium text-gray-900">
                            {comment.user.login}
                          </span>
                          <span className="text-sm text-gray-500 ml-2">
                            {formatDate(comment.created_at)}
                          </span>
                          <span className="ml-2 px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded">
                            Review Comment
                          </span>
                        </div>
                        <div className="text-gray-700 whitespace-pre-wrap mb-2">
                          {comment.body}
                        </div>
                        {comment.path && (
                          <div className="text-sm text-gray-500">
                            📁 {comment.path}:{comment.line}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
              <p className="text-gray-600">
                Select a pull request to view details and comments.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
