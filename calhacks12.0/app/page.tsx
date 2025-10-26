"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LandingPage } from "../components/LandingPage";
import { GitLitLogo } from "../components/GitLitLogo";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (session) {
      router.push("/dashboard");
    }

    // Check if GitHub OAuth is configured
    fetch("/api/auth/providers")
      .then((res) => res.json())
      .then((data) => {
        setIsConfigured(Object.keys(data).length > 0);
      })
      .catch(() => {
        setIsConfigured(false);
      });
  }, [session, status, router]);

  const handleConnectGitHub = async () => {
    setIsLoading(true);
    try {
      await signIn("github", {
        callbackUrl: "/dashboard",
      });
    } catch (error) {
      console.error("Sign in error:", error);
      alert(
        "GitHub OAuth is not configured. Please check your environment variables."
      );
      setIsLoading(false);
    }
  };

  // Show loading while checking session
  if (status === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background:
            "linear-gradient(135deg, rgba(248, 249, 251, 0.95) 0%, rgba(238, 242, 255, 0.95) 100%)",
        }}
      >
        <div className="text-center">
          <div className="mb-8">
            <GitLitLogo className="w-96 h-28" animate={true} />
          </div>
          <p className="text-2xl text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page if not authenticated
  if (!session) {
    return (
      <LandingPage
        onConnectGitHub={handleConnectGitHub}
        isLoading={isLoading}
        isConfigured={isConfigured}
      />
    );
  }

  // This should not be reached due to useEffect redirect, but just in case
  return null;
}
