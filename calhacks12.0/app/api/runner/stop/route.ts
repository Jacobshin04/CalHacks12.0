import { NextRequest, NextResponse } from "next/server";

interface StopRequest {
  containerId?: string;
  owner: string;
  repo: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { containerId, owner, repo } = body;

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Missing owner or repo" },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Stop the Docker container if containerId is provided
    // 2. Kill any running server processes
    // 3. Clean up temporary files
    // 4. Free up the port

    // Simulate cleanup
    console.log(
      `Stopping server for ${owner}/${repo}${
        containerId ? ` (container: ${containerId})` : ""
      }`
    );

    return NextResponse.json({
      success: true,
      message: "Server stopped successfully",
      owner,
      repo,
      containerId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error stopping server:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
