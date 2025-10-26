"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LiquidEther from "../../../../../components/LiquidEther";
import { GitLitLogo } from "../../../../../components/GitLitLogo";

export default function AnalysisPage() {
  const params = useParams<{ owner: string; repo: string }>();
  const router = useRouter();
  const owner = params.owner;
  const repo = params.repo;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [securityText, setSecurityText] = useState<string>("");
  const [designText, setDesignText] = useState<string>("");
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [designError, setDesignError] = useState<string | null>(null);
  const [securityScore, setSecurityScore] = useState<number | null>(null);
  const [designScore, setDesignScore] = useState<number | null>(null);

  useEffect(() => {
    async function fetchBoth() {
      try {
        setLoading(true);
        setError(null);
        setSecurityError(null);
        setDesignError(null);
        console.log("[ui:analysis] Fetching security & design", { owner, repo });
        const body = JSON.stringify({ owner, repo });
        const retryFetchJson = async (url: string, init: RequestInit, retries = 1) => {
          let attempt = 0;
          let lastError: any = null;
          while (attempt <= retries) {
            try {
              const res = await fetch(url, init);
              if (res.ok) {
                try {
                  return await res.json();
                } catch (e) {
                  // fall back to text if json parse fails
                  const t = await res.text();
                  return { result: t } as any;
                }
              } else {
                let msg = `${res.status} ${res.statusText}`;
                try {
                  const j = await res.json();
                  msg = j?.error || msg;
                } catch {
                  try {
                    const t = await res.text();
                    if (t) msg = t;
                  } catch {}
                }
                lastError = new Error(msg);
                if (res.status === 401) throw lastError; // don't retry auth
              }
            } catch (e) {
              lastError = e;
            }
            attempt++;
            if (attempt <= retries) await new Promise((r) => setTimeout(r, 600));
          }
          throw lastError || new Error("Request failed");
        };
        const extractScore = (text: string, labelCandidates: string[]) => {
          try {
            // Try explicit "<Label> Score: N/100"
            for (const label of labelCandidates) {
              const re = new RegExp(`${label}\\s*Score\\s*:\\s*(\\d{1,3})\\s*/\\s*100`, "i");
              const m = text.match(re);
              if (m) {
                const n = parseInt(m[1], 10);
                if (!isNaN(n) && n >= 0 && n <= 100) return n;
              }
            }
            // Fallback: first number like N/100
            const m2 = text.match(/(\d{1,3})\s*\/\s*100/);
            if (m2) {
              const n = parseInt(m2[1], 10);
              if (!isNaN(n) && n >= 0 && n <= 100) return n;
            }
          } catch {}
          return null;
        };
        // Serialize calls to reduce burst errors/limits
        let secScoreLocal: number | null = null;
        try {
          const secJson = await retryFetchJson("/api/claude/rate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          }, 1);
          const text = secJson?.result || "No content returned";
          console.log("[ui:analysis] Security preview", text.slice(0, 200));
          setSecurityText(text);
          setSecurityError(null);
          secScoreLocal = extractScore(text, ["Security"]); 
          setSecurityScore(secScoreLocal);
        } catch (e: any) {
          const msg = e?.message || "Failed to get security analysis";
          console.warn("[ui:analysis] Security error", msg);
          setSecurityError(msg);
          setSecurityText("");
          setSecurityScore(null);
        }

        let desScoreLocal: number | null = null;
        try {
          const desJson = await retryFetchJson("/api/claude/design", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          }, 1);
          const text = desJson?.result || "No content returned";
          console.log("[ui:analysis] Design preview", text.slice(0, 200));
          setDesignText(text);
          setDesignError(null);
          desScoreLocal = extractScore(text, ["System Design", "Design"]);
          setDesignScore(desScoreLocal);
        } catch (e: any) {
          const msg = e?.message || "Failed to get system design analysis";
          console.warn("[ui:analysis] Design error", msg);
          setDesignError(msg);
          setDesignText("");
          setDesignScore(null);
        }

        // Persist average score for dashboard overlay
        try {
          const haveAny = (secScoreLocal !== null) || (desScoreLocal !== null);
          if (haveAny && typeof window !== "undefined") {
            const avg = Math.round(((secScoreLocal ?? 0) + (desScoreLocal ?? 0)) / ((secScoreLocal !== null ? 1 : 0) + (desScoreLocal !== null ? 1 : 0)));
            const key = `${owner}/${repo}`;
            const raw = window.localStorage.getItem("repoScores");
            const store = raw ? JSON.parse(raw) : {};
            store[key] = {
              securityScore: secScoreLocal,
              designScore: desScoreLocal,
              averageScore: isFinite(avg) ? avg : 0,
              updatedAt: new Date().toISOString(),
            };
            window.localStorage.setItem("repoScores", JSON.stringify(store));
            console.log("[ui:analysis] Saved repoScores", key, store[key]);
          }
        } catch {}

        if (!securityText && !designText && securityError && designError) {
          setError("Both analyses failed. Please try again.");
        }
      } catch (e: any) {
        console.error("[ui:analysis] Error", e);
        setError(e?.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    if (owner && repo) fetchBoth();
  }, [owner, repo]);

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
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push(`/dashboard`)}
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Back</span>
          </button>

          <GitLitLogo className="w-48 h-14" animate={false} />
        </div>

        <div className="mb-6">
          <h1 className="text-[32px] font-bold text-gray-800 mb-2">
            Analysis: {owner}/{repo}
          </h1>
          <p className="text-[16px] text-gray-600">Security and System Design Insights</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-700"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">Error: {error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold">Security Analysis</h2>
                <div className="px-3 py-1 rounded-lg text-sm font-semibold border" style={{ borderColor: "#2563eb", color: "#2563eb", backgroundColor: "#2563eb22" }}>
                  {securityScore !== null ? `Score: ${securityScore}/100` : "Score: --/100"}
                </div>
              </div>
              {securityError ? (
                <div className="text-red-600 font-medium text-sm">{securityError}</div>
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-gray-800">{securityText}</pre>
              )}
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold">System Design</h2>
                <div className="px-3 py-1 rounded-lg text-sm font-semibold border" style={{ borderColor: "#10b981", color: "#10b981", backgroundColor: "#10b98122" }}>
                  {designScore !== null ? `Score: ${designScore}/100` : "Score: --/100"}
                </div>
              </div>
              {designError ? (
                <div className="text-red-600 font-medium text-sm">{designError}</div>
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-gray-800">{designText}</pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


