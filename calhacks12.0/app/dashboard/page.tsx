"use client";

import { useSession, signOut, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingState } from "../../components/LoadingState";
import { GitLitLogo } from "../../components/GitLitLogo";
import LiquidEther from "../../components/LiquidEther";
import Link from "next/link";

interface RepoScore {
  name: string;
  fullName?: string;
  description?: string;
  private?: boolean;
  url?: string;
  language?: string;
  stars?: number;
  forks?: number;
  updatedAt?: string;
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
  const [rateOpen, setRateOpen] = useState(false);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);
  const [rateResult, setRateResult] = useState<string>("");
  const [rateRepoLabel, setRateRepoLabel] = useState<string>("");
  const [designOpen, setDesignOpen] = useState(false);
  const [designLoading, setDesignLoading] = useState(false);
  const [designError, setDesignError] = useState<string | null>(null);
  const [designResult, setDesignResult] = useState<string>("");
  const [designRepoLabel, setDesignRepoLabel] = useState<string>("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated") {
      // Fetch actual GitHub repositories
      fetch("/api/github/repos")
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch repositories");
          }
          return res.json();
        })
        .then((data) => {
          // Overlay scores from localStorage if present
          let repos = data.repos || [];
          try {
            if (typeof window !== "undefined") {
              const raw = window.localStorage.getItem("repoScores");
              const store = raw ? JSON.parse(raw) : {};
              repos = repos.map((r: any) => {
                const key = r.fullName ?? `unknown/${r.name}`;
                const overlay = store[key];
                if (overlay && typeof overlay.averageScore === "number") {
                  return { ...r, score: overlay.averageScore };
                }
                return r;
              });
            }
          } catch {}
          setRepoScores(repos);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching repositories:", error);
          setIsLoading(false);
          // Fallback to mock data on error
          setRepoScores([
            {
              name: "my-awesome-project",
              score: 0,
              lastReview: "Never",
              issues: 0,
              security: 0,
              performance: 0,
            },
            {
              name: "react-dashboard",
              score: 0,
              lastReview: "Never",
              issues: 0,
              security: 0,
              performance: 0,
            },
          ]);
        });
    }
  }, [status, router]);

  if (status === "loading" || isLoading) {
    return <LoadingState />;
  }

  if (!session) {
    return null;
  }

  const runCodeRating = async (fullName: string) => {
    try {
      setRateOpen(true);
      setRateLoading(true);
      setRateError(null);
      setRateResult("");
      setRateRepoLabel(fullName);

      const [owner, repoName] = (fullName ?? "unknown/unknown").split("/");
      console.log("[ui:rate] Requesting code rating", { fullName, owner, repoName });
      const res = await fetch("/api/claude/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo: repoName }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to get code rating");
      }

      const data = await res.json();
      console.log("[ui:rate] Received response", {
        ok: res.ok,
        resultLen: (data?.result || "").length,
        preview: (data?.result || "").slice(0, 200),
      });
      setRateResult(data.result || "No content returned");
    } catch (e: any) {
      console.error("[ui:rate] Error", e);
      setRateError(e?.message || "An error occurred while getting code rating");
    } finally {
      setRateLoading(false);
    }
  };

  const runSystemDesign = async (fullName: string) => {
    try {
      setDesignOpen(true);
      setDesignLoading(true);
      setDesignError(null);
      setDesignResult("");
      setDesignRepoLabel(fullName);

      const [owner, repoName] = (fullName ?? "unknown/unknown").split("/");
      console.log("[ui:design] Requesting system design", { fullName, owner, repoName });
      const res = await fetch("/api/claude/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo: repoName }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to get system design analysis");
      }

      const data = await res.json();
      console.log("[ui:design] Received response", {
        ok: res.ok,
        resultLen: (data?.result || "").length,
        preview: (data?.result || "").slice(0, 200),
      });
      setDesignResult(data.result || "No content returned");
    } catch (e: any) {
      console.error("[ui:design] Error", e);
      setDesignError(e?.message || "An error occurred while getting system design analysis");
    } finally {
      setDesignLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background with LiquidEther */}
      <div className="fixed inset-0 overflow-hidden">
        {/* Base background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(248, 249, 251, 0.95) 0%, rgba(238, 242, 255, 0.95) 100%)",
          }}
        />
        {/* Base blue gradient */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(96, 165, 250, 0.5) 0%, rgba(96, 165, 250, 0.3) 40%, rgba(96, 165, 250, 0) 70%)",
          }}
        />
        {/* Animated fluid layer */}
        <div className="absolute inset-0 opacity-30">
          <LiquidEther
            colors={["#60A5FA", "#60A5FA", "#60A5FA", "#60A5FA", "#60A5FA"]}
            mouseForce={35}
            cursorSize={130}
            resolution={0.5}
            autoDemo={true}
            autoSpeed={0.5}
            autoIntensity={3.5}
          />
        </div>
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 min-h-screen max-w-7xl mx-auto px-8 py-12">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-12">
          {/* Home Button */}
          <button
            onClick={() => {
              signOut({ callbackUrl: "/" });
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border-2 border-gray-200 text-gray-800 font-semibold transition-colors hover:border-indigo-500"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span>Home</span>
          </button>

          {/* GitLit Logo */}
          <GitLitLogo className="w-48 h-14" animate={false} />
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[40px] font-bold text-gray-800 mb-3 flex items-center gap-3">
            <span>Welcome back, {session.user?.name?.split(" ")[0]}! 👋</span>
          </h1>
          <p className="text-[18px] text-gray-600">
            Select a repository to view detailed analysis
          </p>
        </div>

        {/* Repo Scores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {repoScores.map((repo, index) => {
            const getScoreLabel = (score: number) => {
              if (score >= 90) return { text: "EXCELLENT", color: "#10B981" };
              if (score >= 80) return { text: "GOOD", color: "#3B82F6" };
              if (score >= 70) return { text: "OKAY", color: "#F59E0B" };
              return { text: "NEEDS WORK", color: "#EF4444" };
            };

            const getLanguageColor = (lang: string) => {
              const colors: Record<string, string> = {
                TypeScript: "#3178C6",
                JavaScript: "#F7DF1E",
                React: "#61DAFB",
                Python: "#3776AB",
              };
              return colors[lang] || "#94A3B8";
            };

            const scoreInfo = getScoreLabel(repo.score);

            return (
              <div
                key={index}
                className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                {/* Repo Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {repo.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {repo.language && (
                        <div className="flex items-center gap-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: getLanguageColor(repo.language),
                            }}
                          />
                          <span>{repo.language}</span>
                        </div>
                      )}
                      {repo.stars !== undefined && (
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {repo.stars}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score Badge */}
                  <div
                    className="px-3 py-1 rounded-lg font-bold text-xs whitespace-nowrap flex-shrink-0"
                    style={{
                      backgroundColor: `${scoreInfo.color}20`,
                      color: scoreInfo.color,
                      border: `2px solid ${scoreInfo.color}`,
                    }}
                  >
                    {scoreInfo.text}
                  </div>
                </div>

                {/* Score with Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-[42px] font-extrabold leading-none bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                      {repo.score}
                    </span>
                    <span className="text-xl text-gray-500 mb-1">/100</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${repo.score}%`,
                        background:
                          "linear-gradient(90deg, #4F46E5 0%, #3B82F6 100%)",
                      }}
                    ></div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const [owner, repoName] = (
                        repo.fullName ?? `unknown/${repo.name}`
                      ).split("/");
                      router.push(`/review/${owner}/${repoName}`);
                    }}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all duration-200"
                    style={{
                      background:
                        "linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)",
                    }}
                  >
                    <span>Check Repo</span>
                  </button>
                  <button
                    onClick={() => {
                      const [owner, repoName] = (
                        repo.fullName ?? `unknown/${repo.name}`
                      ).split("/");
                      router.push(`/review/${owner}/${repoName}/analysis`);
                    }}
                    className="px-4 py-3 rounded-xl bg-white border-2 border-gray-200 text-gray-900 font-bold flex items-center justify-center transition-colors hover:border-indigo-500"
                  >
                    Analysis
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="group p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
              <div className="text-center">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-200">
                  🔍
                </div>
                <div className="font-semibold text-gray-900 mb-1">
                  Run New Review
                </div>
                <div className="text-sm text-gray-500">
                  Analyze latest changes
                </div>
              </div>
            </button>

            <button className="group p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 transition-all duration-200">
              <div className="text-center">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-200">
                  📊
                </div>
                <div className="font-semibold text-gray-900 mb-1">
                  View Trends
                </div>
                <div className="text-sm text-gray-500">
                  Code quality over time
                </div>
              </div>
            </button>

            <button className="group p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 transition-all duration-200">
              <div className="text-center">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-200">
                  ⚙️
                </div>
                <div className="font-semibold text-gray-900 mb-1">Settings</div>
                <div className="text-sm text-gray-500">
                  Configure notifications
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
      {rateOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="font-bold text-gray-900">Code Rating</div>
              <button
                onClick={() => {
                  setRateOpen(false);
                  setRateError(null);
                  setRateResult("");
                }}
                className="text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-4 max-h-[70vh] overflow-auto">
              <div className="text-sm text-gray-500 mb-3">{rateRepoLabel}</div>
              {rateLoading && (
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700"></div>
                  Getting code rating from Claude...
                </div>
              )}
              {!rateLoading && rateError && (
                <div className="text-red-600 font-medium">{rateError}</div>
              )}
              {!rateLoading && !rateError && (
                <pre className="whitespace-pre-wrap text-sm text-gray-800">{rateResult}</pre>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setRateOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {designOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="font-bold text-gray-900">System Design</div>
              <button
                onClick={() => {
                  setDesignOpen(false);
                  setDesignError(null);
                  setDesignResult("");
                }}
                className="text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-4 max-h-[70vh] overflow-auto">
              <div className="text-sm text-gray-500 mb-3">{designRepoLabel}</div>
              {designLoading && (
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700"></div>
                  Getting system design analysis from Claude...
                </div>
              )}
              {!designLoading && designError && (
                <div className="text-red-600 font-medium">{designError}</div>
              )}
              {!designLoading && !designError && (
                <pre className="whitespace-pre-wrap text-sm text-gray-800">{designResult}</pre>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setDesignOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
