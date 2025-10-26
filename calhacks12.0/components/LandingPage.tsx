import { motion } from "motion/react";
import { Github, Sparkles } from "lucide-react";
import { TypeWriter } from "./TypeWriter";
import { FadeInText } from "./FadeInText";
import { GradientText } from "./GradientText";
import { GitLitLogo } from "./GitLitLogo";
import LiquidEther from "./LiquidEther";

interface LandingPageProps {
  onConnectGitHub: () => void;
  isLoading?: boolean;
  isConfigured?: boolean;
}

export function LandingPage({
  onConnectGitHub,
  isLoading = false,
  isConfigured = true,
}: LandingPageProps) {
  return (
    <div className="min-h-screen relative p-4">
      {/* Animated Border Container */}
      <motion.div
        className="min-h-screen relative overflow-hidden rounded-3xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(248, 249, 251, 0.95) 0%, rgba(238, 242, 255, 0.95) 100%)",
          border: "6px solid #60A5FA",
          backdropFilter: "blur(10px)",
        }}
        animate={{
          boxShadow: [
            "0 0 20px rgba(96, 165, 250, 0.3), inset 0 0 20px rgba(96, 165, 250, 0.1)",
            "0 0 40px rgba(96, 165, 250, 0.6), inset 0 0 30px rgba(96, 165, 250, 0.2)",
            "0 0 20px rgba(96, 165, 250, 0.3), inset 0 0 20px rgba(96, 165, 250, 0.1)",
          ],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Blue Aura Background - Inside Border */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden">
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
        {/* Hero Section */}
        <div className="relative z-10 flex flex-col items-center min-h-screen px-20 pt-[120px] pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl"
          >
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0, duration: 0.8 }}
              className="flex items-center justify-center mb-8"
            >
              <GitLitLogo className="w-96 h-28" animate={true} />
            </motion.div>

            <h1
              className="text-[48px] font-bold mb-6 relative"
              style={{
                color: "#1E40AF",
                filter:
                  "drop-shadow(0 0 20px rgba(59, 130, 246, 0.5)) drop-shadow(0 0 40px rgba(79, 70, 229, 0.3))",
              }}
            >
              <TypeWriter
                text="AI-Powered Repo Scoring"
                speed={60}
                delay={600}
              />
            </h1>

            <FadeInText
              delay={2.5}
              className="text-[20px] text-[#64748B] mb-12"
            >
              Get instant{" "}
              <GradientText from="#4F46E5" to="#3B82F6">
                AI code reviews
              </GradientText>{" "}
              and{" "}
              <GradientText from="#4F46E5" to="#3B82F6">
                repo health scores
              </GradientText>
              .
            </FadeInText>

            <FadeInText delay={3}>
              {/* Configuration Warning */}
              {!isConfigured && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-yellow-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        GitHub OAuth Not Configured
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          Please set up your GitHub OAuth credentials in the
                          .env.local file:
                        </p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>
                            Get your Client ID and Secret from GitHub Developer
                            Settings
                          </li>
                          <li>
                            Update GITHUB_ID and GITHUB_SECRET in .env.local
                          </li>
                          <li>Restart the development server</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow:
                    "0px 0px 24px rgba(79, 70, 229, 0.6), 0px 0px 48px rgba(59, 130, 246, 0.3)",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={onConnectGitHub}
                disabled={isLoading || !isConfigured}
                className="px-12 py-6 rounded-2xl text-[24px] font-bold text-white mb-8 cursor-pointer relative overflow-hidden flex items-center justify-center gap-3 mx-auto pointer-events-auto disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background:
                    "linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)",
                  boxShadow: "0px 4px 12px rgba(79, 70, 229, 0.4)",
                }}
              >
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    border: "2px solid rgba(59, 130, 246, 0.5)",
                  }}
                  animate={{
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                {/* Shine/Glare Effect */}
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background:
                      "linear-gradient(110deg, transparent 25%, rgba(255, 255, 255, 0.4) 45%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0.4) 55%, transparent 75%)",
                    backgroundSize: "200% 100%",
                  }}
                  animate={{
                    backgroundPosition: ["200% 0", "-200% 0"],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 1,
                    ease: "easeInOut",
                  }}
                />
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Connecting...
                  </div>
                ) : (
                  <>
                    <Github className="relative z-10 w-7 h-7" />
                    <span className="relative z-10">Connect GitHub</span>
                  </>
                )}
              </motion.button>
            </FadeInText>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.8, duration: 0.6 }}
              className="text-[16px] font-medium text-[#64748B] flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Auto Reviews • Live Repo Scores • PR Insights</span>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
