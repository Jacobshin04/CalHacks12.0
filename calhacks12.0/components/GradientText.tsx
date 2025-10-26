import { ReactNode } from "react";

interface GradientTextProps {
  children: ReactNode;
  from: string;
  to: string;
  className?: string;
}

export function GradientText({
  children,
  from,
  to,
  className = "",
}: GradientTextProps) {
  return (
    <span
      className={`bg-gradient-to-r ${className}`}
      style={{
        backgroundImage: `linear-gradient(to right, ${from}, ${to})`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
    >
      {children}
    </span>
  );
}
