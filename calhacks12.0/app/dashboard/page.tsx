"use client";

import { useSession, signOut, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface RepoScore {
  name: string;
  score: number;
  lastReview: string;
  issues: number;
  security: number;
  performance: number;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [repoScores, setRepoScores] = useState<RepoScore[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      // Simulate loading and fetching repo data
      setTimeout(() => {
        setRepoScores([
          {
            name: "my-awesome-project",
            score: 87,
            lastReview: "2 hours ago",
            issues: 2,
            security: 0,
            performance: 95,
          },
          {
            name: "react-dashboard",
            score: 92,
            lastReview: "1 day ago",
            issues: 1,
            security: 0,
            performance: 88,
          },
        ]);
        setIsLoading(false);
      }, 2000);
    }
  }, [status, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-white mb-2">
            🧠 Analyzing your repositories...
          </h2>
          <p className="text-gray-300">
            Running AI code review on your latest commits
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">🧠 GitLit</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img
                  className="h-8 w-8 rounded-full"
                  src={session.user?.image || ""}
                  alt={session.user?.name || ""}
                />
                <span className="text-sm font-medium text-gray-700">
                  {session.user?.name}
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    signIn("github", {
                      callbackUrl: "/dashboard",
                      prompt: "select_account",
                    })
                  }
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Switch Account
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() =>
                    signOut({
                      callbackUrl: "/auth/signin",
                      redirect: true,
                    })
                  }
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {session.user?.name?.split(" ")[0]}! 👋
            </h2>
            <p className="text-gray-600">
              Here's your repository health overview
            </p>
          </div>

          {/* Repo Scores Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {repoScores.map((repo, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {repo.name}
                  </h3>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      repo.score >= 90
                        ? "bg-green-100 text-green-800"
                        : repo.score >= 70
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {repo.score}/100
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Last Review</span>
                    <span className="text-gray-900">{repo.lastReview}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Issues</span>
                    <span className="text-gray-900">{repo.issues}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Security</span>
                    <span className="text-gray-900">
                      {repo.security === 0
                        ? "✅ Clean"
                        : `${repo.security} issues`}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Performance</span>
                    <span className="text-gray-900">
                      {repo.performance}/100
                    </span>
                  </div>
                </div>

                <button className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                  View Details
                </button>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <div className="text-center">
                  <div className="text-2xl mb-2">🔍</div>
                  <div className="font-medium text-gray-900">
                    Run New Review
                  </div>
                  <div className="text-sm text-gray-500">
                    Analyze latest changes
                  </div>
                </div>
              </button>

              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
                <div className="text-center">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="font-medium text-gray-900">View Trends</div>
                  <div className="text-sm text-gray-500">
                    Code quality over time
                  </div>
                </div>
              </button>

              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
                <div className="text-center">
                  <div className="text-2xl mb-2">⚙️</div>
                  <div className="font-medium text-gray-900">Settings</div>
                  <div className="text-sm text-gray-500">
                    Configure notifications
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
