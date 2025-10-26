import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { owner, repo, gitUrl } = body;

    if (!owner || !repo || !gitUrl) {
      return NextResponse.json(
        { error: "Missing owner, repo, or gitUrl" },
        { status: 400 }
      );
    }

    const containerId = `${owner}-${repo}-${Date.now()}`;
    const port = 3001;

    console.log(`🐳 Starting Docker container for ${owner}/${repo}`);

    // For demo purposes, simulate Docker operations
    // In production, you would:
    // 1. Clone the repo
    // 2. Build Docker image
    // 3. Run container with port mapping
    // 4. Wait for health check
    // 5. Return container info

    const serverInfo = {
      owner,
      repo,
      containerId,
      port,
      status: "running",
      url: `http://localhost:${port}`,
      timestamp: new Date().toISOString(),
      gitUrl,
    };

    console.log(`✅ Container started: ${containerId}`);

    return NextResponse.json({
      success: true,
      server: serverInfo,
      message: "Docker container started successfully",
    });
  } catch (error: any) {
    console.error("Error starting Docker container:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { containerId } = body;

    if (!containerId) {
      return NextResponse.json(
        { error: "Missing containerId" },
        { status: 400 }
      );
    }

    console.log(`🛑 Stopping Docker container: ${containerId}`);

    // In production:
    // await execAsync(`docker stop ${containerId}`);
    // await execAsync(`docker rm ${containerId}`);

    return NextResponse.json({
      success: true,
      message: "Container stopped successfully",
      containerId,
    });
  } catch (error: any) {
    console.error("Error stopping container:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
