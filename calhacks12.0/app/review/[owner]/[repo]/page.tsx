"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Loader2,
  RefreshCw,
  FileText,
  Home,
  FolderGit2,
  Download,
  X,
} from "lucide-react";
import { GradientText } from "@/components/GradientText";
import { CountUp } from "@/components/CountUp";
import { FadeInText } from "@/components/FadeInText";
import { GitLitLogo } from "@/components/GitLitLogo";
import { Icons } from "@/components/Icons";
import LiquidEther from "@/components/LiquidEther";
import ApiTestResults from "@/components/ApiTestResults";
import { MetricsDetailModal } from "@/components/MetricsDetailModal";

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
  const router = useRouter();
  const search = useSearchParams();
  const owner = params.owner;
  const repo = params.repo;
  const path = search.get("path") ?? "";

  const [pulls, setPulls] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"analyzing" | "complete">(
    "analyzing"
  );

  // Metrics state
  const [readabilityData, setReadabilityData] = useState<{
    value: string;
    source: string;
    content: string;
    score: number | null;
    loading: boolean;
  }>({
    value: "Analyzing...",
    source: "Loading",
    content: "",
    score: null,
    loading: true,
  });
  const [bugsData, setBugsData] = useState<{
    value: string;
    source: string;
    comments: string[];
    loading: boolean;
  } | null>({
    value: "Analyzing...",
    source: "Loading",
    comments: [],
    loading: true,
  });
  const [securityData, setSecurityData] = useState<{
    content: string;
    score: number | null;
    loading: boolean;
  }>({ content: "", score: null, loading: true });
  const [designData, setDesignData] = useState<{
    content: string;
    score: number | null;
    loading: boolean;
  }>({ content: "", score: null, loading: true });
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showDesignModal, setShowDesignModal] = useState(false);
  const [showReadabilityModal, setShowReadabilityModal] = useState(false);
  const [showBugsModal, setShowBugsModal] = useState(false);
  const [totalIssues, setTotalIssues] = useState({ security: 0, design: 0 });

  // API Testing state
  const [showApiTests, setShowApiTests] = useState(false);
  const [apiTestsLoading, setApiTestsLoading] = useState(false);
  const [apiTestsResults, setApiTestsResults] = useState<any>(null);

  // Postman export state
  const [postmanLoading, setPostmanLoading] = useState(false);

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

  // Unified Claude analysis (readability, bugs, security, design)
  useEffect(() => {
    if (!owner || !repo) return;

    const run = async () => {
      setReadabilityData((prev) => ({ ...prev, loading: true }));
      setSecurityData((prev) => ({ ...prev, loading: true }));
      setDesignData((prev) => ({ ...prev, loading: true }));
      setBugsData((prev) => (prev ? { ...prev, loading: true } : prev));
      try {
        const res = await fetch("/api/claude/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ owner, repo }),
        });

        if (!res.ok) throw new Error(`check failed ${res.status}`);
        const data = await res.json();
        const r = data.result || {};

        // Readability
        const readScore: number | null =
          typeof r.readability?.score === "number" ? r.readability.score : null; // 0-25
        const readAssessment = r.readability?.assessment || "Needs review";
        const readBullets: string[] = r.readability?.bullets || [];
        setReadabilityData({
          value: readAssessment,
          source: "Claude",
          content: readBullets.join("\n"),
          score: readScore !== null ? readScore * 4 : null, // keep 0-100 for overall
          loading: false,
        });

        // Bugs
        const bugScore: number =
          typeof r.bugs?.score === "number" ? r.bugs.score : 0; // 0-25
        const bugBullets: string[] = r.bugs?.bullets || [];
        setBugsData({
          value: `${bugScore}/25`,
          source: "Claude",
          comments: bugBullets,
          loading: false,
        });

        // Security
        const secScore: number | null =
          typeof r.security?.score === "number" ? r.security.score : null; // 0-25
        const secBullets: string[] = r.security?.bullets || [];
        setSecurityData({
          content: [secScore != null ? `Score: ${secScore}/25` : "Score: N/A", ...secBullets].join("\n"),
          score: secScore !== null ? secScore * 4 : null, // maintain 0-100 compatibility
          loading: false,
        });
        setTotalIssues((prev) => ({ ...prev, security: secBullets.length }));

        // Design
        const desScore: number | null =
          typeof r.design?.score === "number" ? r.design.score : null; // 0-25
        const desBullets: string[] = r.design?.bullets || [];
        setDesignData({
          content: [desScore != null ? `Score: ${desScore}/25` : "Score: N/A", ...desBullets].join("\n"),
          score: desScore !== null ? desScore * 4 : null, // maintain 0-100 compatibility
          loading: false,
        });
        setTotalIssues((prev) => ({ ...prev, design: desBullets.length }));

        setReviewStatus("complete");
      } catch (e) {
        console.error("[ReviewPage] unified check error", e);
        setReadabilityData((prev) => ({ ...prev, loading: false, value: "Error", source: "Error" }));
        setSecurityData((prev) => ({ ...prev, loading: false }));
        setDesignData((prev) => ({ ...prev, loading: false }));
        setBugsData((prev) => (prev ? { ...prev, loading: false, value: "Error", source: "Error" } : prev));
      }
    };

    run();
  }, [owner, repo]);

  

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

  const handleExportPostman = async () => {
    try {
      setPostmanLoading(true);
      // 1) Discover endpoints
      const endpointsRes = await fetch("/api/analyze/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo }),
      });
      if (!endpointsRes.ok) {
        const err = await endpointsRes.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to discover endpoints");
      }
      const endpointsData = await endpointsRes.json();
      const endpoints = endpointsData?.endpoints || [];

      // 2) Generate Postman collection JSON
      const pmRes = await fetch("/api/postman/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo, endpoints }),
      });
      if (!pmRes.ok) {
        const err = await pmRes.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to generate Postman collection");
      }
      const collection = await pmRes.json();

      // 3) Download JSON as file
      const blob = new Blob([JSON.stringify(collection, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${owner}-${repo}-postman-collection.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting Postman collection:", error);
      setError("Failed to export Postman collection");
    } finally {
      setPostmanLoading(false);
    }
  };

  // Select first PR if none selected (must be before early returns)
  useEffect(() => {
    if (pulls.length > 0 && !selectedPR) {
      setSelectedPR(pulls[0]);
    }
  }, [pulls, selectedPR]);

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
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
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <GitLitLogo className="w-64 h-20" animate={true} />
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="text-lg text-gray-700 font-semibold">
                Loading repository...
              </p>
            </div>
          </div>
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

  // Helper function to extract bullet points from text
  const extractBulletPoints = (text: string): string[] => {
    // Look for bullet patterns: -, •, *, numbered lists
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

    // If no bullets, break into key points (sentences or first parts)
    if (bullets.length === 0) {
      const sentences = text
        .replace(/[.!?]+/g, ".")
        .split(".")
        .map((s) => s.trim())
        .filter((s) => s.length > 20)
        .slice(0, 4);
      return sentences;
    }

    // Max 4 bullets
    return bullets.slice(0, 4);
  };

  // Check if all metrics are complete
  const allMetricsComplete =
    !readabilityData.loading &&
    (!bugsData || !bugsData.loading) &&
    !securityData.loading &&
    !designData.loading;

  // Calculate quality score from metrics (only after all complete)
  const calculateQualityScore = () => {
    if (!allMetricsComplete) return 0; // Show 0 while analyzing

    let totalScore = 0;

    // Readability: 25 points based on score or assessment
    if (readabilityData.score !== null) {
      totalScore += readabilityData.score / 4; // Convert 0-100 to 0-25
    } else {
      // Fallback to assessment
      if (readabilityData.value === "Excellent") totalScore += 25;
      else if (readabilityData.value === "Good") totalScore += 20;
      else if (readabilityData.value === "Fair") totalScore += 15;
      else if (readabilityData.value === "Mixed") totalScore += 12;
      else if (readabilityData.value === "Needs improvement") totalScore += 5;
      else totalScore += 0;
    }

    // Bugs: 25 points
    // No issues = 25, Has issues but not many = 15, Many issues = 5, Error = 0
    if (bugsData?.value === "No issues") totalScore += 25;
    else if (bugsData?.value && bugsData.value.includes("found")) {
      const issueCount = parseInt(bugsData.value.match(/\d+/)?.[0] || "0");
      if (issueCount <= 2) totalScore += 15;
      else if (issueCount <= 5) totalScore += 10;
      else totalScore += 5;
    } else totalScore += 0;

    // Security: 25 points based on score or issues
    if (securityData.score !== null) {
      totalScore += securityData.score / 4; // Convert 0-100 to 0-25
    } else {
      const issueCount = totalIssues.security;
      if (issueCount === 0) totalScore += 25;
      else if (issueCount <= 3) totalScore += 20;
      else if (issueCount <= 7) totalScore += 15;
      else totalScore += 10;
    }

    // System Design: 25 points based on score or issues
    if (designData.score !== null) {
      totalScore += designData.score / 4; // Convert 0-100 to 0-25
    } else {
      const issueCount = totalIssues.design;
      if (issueCount === 0) totalScore += 25;
      else if (issueCount <= 3) totalScore += 20;
      else if (issueCount <= 7) totalScore += 15;
      else totalScore += 10;
    }

    return Math.round(totalScore);
  };

  const qualityScore = calculateQualityScore();

  // Prepare metrics for display
  const metrics = [
    {
      icon: Icons.Broom,
      title: "Readability",
      value: readabilityData?.loading
        ? "Analyzing..."
        : readabilityData?.value || "No data",
      color: "#10B981",
      source: readabilityData?.source,
      loading: readabilityData?.loading || false,
      onClick: () => setShowReadabilityModal(true),
    },
    {
      icon: Icons.Bug,
      title: "Bugs",
      value: bugsData?.loading
        ? "Analyzing..."
        : bugsData?.value || "No issues",
      color:
        bugsData?.value &&
        bugsData.value !== "No issues" &&
        bugsData.value !== "Analyzing..."
          ? "#F59E0B"
          : "#10B981",
      source: bugsData?.source,
      loading: bugsData?.loading || false,
      onClick: () => setShowBugsModal(true),
    },
    {
      icon: Icons.Lock,
      title: "Security",
      value: securityData.loading
        ? "Analyzing..."
        : `${totalIssues.security} ${
            totalIssues.security === 1 ? "issue" : "issues"
          }`,
      color: securityData.loading
        ? "#10B981"
        : totalIssues.security === 0
        ? "#10B981"
        : "#F59E0B",
      loading: securityData.loading,
      onClick: () => setShowSecurityModal(true),
    },
    {
      icon: Icons.Zap,
      title: "System Design",
      value: designData.loading
        ? "Analyzing..."
        : `${totalIssues.design} ${
            totalIssues.design === 1 ? "issue" : "issues"
          }`,
      color: designData.loading
        ? "#10B981"
        : totalIssues.design === 0
        ? "#10B981"
        : "#F59E0B",
      loading: designData.loading,
      onClick: () => setShowDesignModal(true),
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
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
      <div className="relative z-10 min-h-screen max-w-5xl mx-auto px-8 py-12">
        {/* Top Bar with Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{
                scale: 1.05,
                boxShadow: "0px 0px 20px rgba(79, 70, 229, 0.4)",
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border-2 border-[#E2E8F0] text-[#1E293B] font-semibold cursor-pointer transition-colors hover:border-[#4F46E5] shadow-sm"
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </motion.button>
          </div>
          <GitLitLogo className="w-48 h-14" animate={false} />
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 mt-16"
        >
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-[32px] font-bold text-[#1E293B] flex items-center gap-3">
              <Icons.Wave className="w-8 h-8" />
              <span>Code Review</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 text-[18px] text-[#64748B]">
            <span>Repo:</span>
            <span className="text-[#1E293B] font-semibold">
              {owner}/{repo}
            </span>
            {selectedPR && (
              <>
                <Icons.Truck className="w-5 h-5 text-[#64748B]" />
                <span className="text-[#1E293B]">PR #{selectedPR.number}</span>
              </>
            )}
          </div>
          <div className="h-px bg-gradient-to-r from-[#E2E8F0] via-[#4F46E5] to-[#E2E8F0] mt-6" />
        </motion.div>

        {/* API Test Results */}
        {showApiTests && apiTestsResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <ApiTestResults
              tests={apiTestsResults.tests}
              summary={apiTestsResults.summary}
              isLoading={apiTestsLoading}
              message={apiTestsResults.message}
              requiresServer={apiTestsResults.requiresServer}
              serverCommand={apiTestsResults.serverCommand}
            />
          </motion.div>
        )}

        {/* Review Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-10"
        >
          <h2 className="text-[24px] font-semibold mb-4 flex items-center gap-2">
            <span className="text-[#64748B]">[</span>
            <GradientText from="#8B5CF6" to="#6366F1">
              CodeRabbit
            </GradientText>
            <span className="text-[#1E293B]">Review Status</span>
            <span className="text-[#64748B]">]</span>
          </h2>

          <div className="rounded-2xl bg-white border border-[#E2E8F0] p-8 overflow-hidden shadow-sm">
            <AnimatePresence mode="wait">
              {reviewStatus === "analyzing" ? (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <Loader2 className="w-8 h-8 text-[#3B82F6]" />
                    </motion.div>
                    <p className="text-[24px] font-bold text-[#1E293B]">
                      Loading… (Analyzing PR{" "}
                      <GradientText from="#4F46E5" to="#3B82F6">
                        #{selectedPR?.number || "..."}
                      </GradientText>
                      )
                    </p>
                  </div>
                  <motion.p
                    className="text-[16px] text-[#64748B]"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ⏱ Running{" "}
                    <GradientText from="#8B5CF6" to="#6366F1">
                      AI review
                    </GradientText>{" "}
                    on backend...
                  </motion.p>
                </motion.div>
              ) : (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    <p className="text-[20px] font-semibold text-[#10B981] mb-2 flex items-center justify-center gap-2">
                      <Icons.CheckCircle className="w-6 h-6" />
                      <span>Analysis Complete!</span>
                    </p>
                    <p className="text-[16px] text-[#64748B]">
                      PR #{selectedPR?.number || "..."} reviewed successfully
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Quality Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-[24px] font-semibold mb-6 flex items-center gap-2">
            <span className="text-[#64748B]">[</span>
            <span className="text-[#10B981] flex items-center gap-2">
              <Icons.CheckCircle className="w-6 h-6" />
              Code Quality Score
            </span>
            <span className="text-[#64748B]">]</span>
          </h2>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-3xl bg-white border-2 border-[#E2E8F0] p-10 mb-8 text-center relative overflow-hidden shadow-md"
          >
            <motion.div
              className="absolute inset-0 opacity-20"
              animate={{
                background: [
                  "radial-gradient(circle at 20% 50%, #4F46E5 0%, transparent 50%)",
                  "radial-gradient(circle at 80% 50%, #3B82F6 0%, transparent 50%)",
                  "radial-gradient(circle at 20% 50%, #4F46E5 0%, transparent 50%)",
                ],
              }}
              transition={{ duration: 8, repeat: Infinity }}
            />

            <div className="relative z-10">
              <motion.p
                className="text-[16px] text-[#64748B] mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Code Quality Score
              </motion.p>
              <motion.div
                className="text-[80px] font-extrabold leading-none mb-2"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
              >
                <GradientText from="#4F46E5" to="#3B82F6">
                  <CountUp end={qualityScore} duration={1.5} delay={0.8} /> /{" "}
                  <CountUp end={100} duration={1.5} delay={0.8} />
                </GradientText>
              </motion.div>
              <motion.div
                className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden max-w-md mx-auto"
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 1, duration: 0.6 }}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-[#4F46E5] to-[#3B82F6] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${qualityScore}%` }}
                  transition={{ delay: 1.2, duration: 1, ease: "easeOut" }}
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {metrics.map((metric, index) => {
              const IconComponent = metric.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.02, borderColor: metric.color }}
                  onClick={metric.onClick}
                  className="rounded-2xl bg-white border-2 border-[#E2E8F0] p-6 cursor-pointer transition-colors shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-2">
                    <IconComponent className="w-8 h-8 text-[#1E293B]" />
                    <motion.div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: metric.color }}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: index * 0.2,
                      }}
                    />
                  </div>
                  <p className="text-[20px] font-bold text-[#1E293B] mb-1">
                    {metric.title}
                  </p>
                  <p
                    className="text-[18px] font-semibold"
                    style={{ color: metric.color }}
                  >
                    {metric.loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      metric.value
                    )}
                  </p>
                  {metric.source &&
                    !metric.loading &&
                    metric.source !== "Loading" && (
                      <p className="text-[12px] text-[#64748B] mt-1">
                        via {metric.source}
                      </p>
                    )}
                </motion.div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <FadeInText delay={1.2}>
            <div className="flex gap-4 mb-8">
              <motion.button
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0px 0px 24px rgba(79, 70, 229, 0.5)",
                }}
                whileTap={{ scale: 0.98 }}
                onClick={handleTestApiEndpoints}
                disabled={apiTestsLoading}
                className="flex-1 px-8 py-5 rounded-2xl text-white font-bold cursor-pointer flex items-center justify-center gap-2 text-[18px] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background:
                    "linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)",
                }}
              >
                <RefreshCw
                  className={`w-5 h-5 ${apiTestsLoading ? "animate-spin" : ""}`}
                />
                {apiTestsLoading ? "Testing..." : "Test API Endpoints"}
              </motion.button>

              <motion.button
                whileHover={{
                  scale: 1.02,
                  borderColor: "#3B82F6",
                  boxShadow: "0px 0px 20px rgba(59, 130, 246, 0.3)",
                }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExportPostman}
                disabled={postmanLoading}
                className="flex-1 px-8 py-5 rounded-2xl bg-white border-2 border-[#4F46E5] text-[#1E293B] font-bold cursor-pointer flex items-center justify-center gap-2 text-[18px] transition-colors shadow-sm hover:shadow-md disabled:opacity-50"
              >
                <Download
                  className={`w-5 h-5 ${postmanLoading ? "animate-spin" : ""}`}
                />
                {postmanLoading ? "Exporting..." : "Export Postman"}
              </motion.button>
            </div>
          </FadeInText>
        </motion.div>

        {/* PR Selection Sidebar - Collapsible */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white/50 backdrop-blur-sm rounded-2xl border-2 border-[#E2E8F0] p-6 max-h-[600px] overflow-y-auto"
        >
          <h2 className="text-xl font-semibold mb-4">
            Pull Requests ({pulls.length})
          </h2>
          {pulls.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No pull requests found
            </p>
          ) : (
            <div className="space-y-3">
              {pulls.map((pull) => (
                <div
                  key={pull.id}
                  className={`border rounded-xl p-4 cursor-pointer transition-all ${
                    selectedPR?.id === pull.id
                      ? "border-[#4F46E5] bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => {
                    setSelectedPR(pull);
                    setReviewStatus("analyzing");
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-[#1E293B] line-clamp-2">
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
                  <div className="flex items-center text-sm text-[#64748B]">
                    <span>{pull.user.login}</span>
                    <span className="mx-2">•</span>
                    <span>{formatDate(pull.updated_at)}</span>
                    <span className="mx-2">•</span>
                    <span>💬 {pull.totalComments}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      <MetricsDetailModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
        type="security"
        title="Security Analysis"
        content={securityData.content}
        score={securityData.score}
      />

      <MetricsDetailModal
        isOpen={showDesignModal}
        onClose={() => setShowDesignModal(false)}
        type="design"
        title="System Design Analysis"
        content={designData.content}
        score={designData.score}
      />

      {/* Readability Modal */}
      <AnimatePresence>
        {showReadabilityModal && readabilityData && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReadabilityModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 text-white bg-gradient-to-r from-[#10B981] to-[#059669]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icons.Broom className="w-8 h-8" />
                      <div>
                        <h2 className="text-2xl font-bold mb-1">
                          Readability Analysis
                        </h2>
                        <p className="text-white/80 text-sm">
                          via {readabilityData.source}
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ rotate: 90, scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowReadabilityModal(false)}
                      className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </motion.button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  {readabilityData.content ? (
                    <div className="space-y-3">
                      {extractBulletPoints(readabilityData.content).map(
                        (bullet, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <span className="text-[#10B981] mt-1 text-lg font-bold">
                              •
                            </span>
                            <p className="text-sm text-[#1E293B] flex-1 font-semibold">
                              {bullet}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600">
                      No readability analysis available.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bugs Modal */}
      <AnimatePresence>
        {showBugsModal && bugsData && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBugsModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 text-white bg-gradient-to-r from-[#F59E0B] to-[#D97706]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icons.Bug className="w-8 h-8" />
                      <div>
                        <h2 className="text-2xl font-bold mb-1">
                          Bug Analysis
                        </h2>
                        <p className="text-white/80 text-sm">
                          via {bugsData.source}
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ rotate: 90, scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowBugsModal(false)}
                      className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </motion.button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  {bugsData.comments.length > 0 ? (
                    <>
                      {/* Summary Card */}
                      <div className="mb-6 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-bold text-gray-800">
                            Issues Identified
                          </h3>
                          <div className="flex items-center gap-2 px-3 py-1 bg-orange-200 rounded-full">
                            <Icons.Bug className="w-4 h-4 text-orange-700" />
                            <span className="text-sm font-semibold text-orange-800">
                              {bugsData.comments.length}{" "}
                              {bugsData.comments.length === 1
                                ? "Issue"
                                : "Issues"}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700">
                          Review the details below for specific concerns and
                          recommendations from CodeRabbit.
                        </p>
                      </div>

                      {/* Extract all bullets from all comments */}
                      <div className="space-y-3">
                        {bugsData.comments
                          .flatMap((comment) => extractBulletPoints(comment))
                          .map((bullet, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-3 bg-white border-2 border-red-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                            >
                              <span className="text-orange-600 mt-1 text-lg font-bold">
                                •
                              </span>
                              <p className="text-sm text-gray-800 leading-relaxed flex-1 font-semibold">
                                {bullet}
                              </p>
                            </div>
                          ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-600">No bug comments found.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
