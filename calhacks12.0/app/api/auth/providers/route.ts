import { NextResponse } from "next/server";
import { env } from "../../../../lib/env";

export async function GET() {
  try { 
    // Debug: Log environment variables
    console.log("=== GitHub OAuth Debug ===");
    console.log("GITHUB_ID:", env.GITHUB_ID ? "SET" : "NOT SET");
    console.log("GITHUB_SECRET:", env.GITHUB_SECRET ? "SET" : "NOT SET");
    console.log("GITHUB_ID value:", env.GITHUB_ID);
    console.log("GITHUB_SECRET value:", env.GITHUB_SECRET ? "***HIDDEN***" : "NOT SET");
    
    // Check if GitHub OAuth is configured
    const isConfigured =
      env.GITHUB_ID &&
      env.GITHUB_SECRET &&
      env.GITHUB_ID !== "test" &&
      env.GITHUB_SECRET !== "test";

    console.log("isConfigured:", isConfigured);
    console.log("=========================");

    if (isConfigured) {
      return NextResponse.json({ github: "configured" });
    } else {
      return NextResponse.json({});
    }
  } catch (error) {
    console.error("Error checking providers:", error);
    return NextResponse.json({});
  }
}
