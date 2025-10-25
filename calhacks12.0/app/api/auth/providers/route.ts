import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check if GitHub OAuth is configured
    const isConfigured =
      process.env.GITHUB_ID &&
      process.env.GITHUB_SECRET &&
      process.env.GITHUB_ID !== "test" &&
      process.env.GITHUB_SECRET !== "test";

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
