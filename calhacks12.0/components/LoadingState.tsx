import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { GradientText } from "./GradientText";
import { Icons } from "./Icons";
import LiquidEther from "./LiquidEther";

export function LoadingState() {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "rgba(248, 249, 251, 0.95)" }}
    >
      {/* Blue Aura Background */}
      <div className="absolute inset-0">
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
      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-6"
          >
            <Loader2 className="w-16 h-16 text-[#3B82F6]" />
          </motion.div>

          <motion.h2
            className="text-[28px] font-bold text-[#1E293B] mb-4 flex items-center justify-center gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <span>Analyzing your latest code with</span>
            <GradientText from="#4F46E5" to="#3B82F6">
              <span className="flex items-center gap-2">
                AI <Icons.Brain className="w-6 h-6 inline-block" />
              </span>
            </GradientText>
          </motion.h2>

          <motion.p
            className="text-[18px] text-[#64748B]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            This might take a few seconds.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ delay: 0.6, duration: 2, repeat: Infinity }}
            className="mt-6 text-[14px] text-[#64748B]"
          >
            Scanning files, analyzing patterns, checking best practices...
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
