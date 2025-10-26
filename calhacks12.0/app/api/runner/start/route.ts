import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { owner, repo, useDocker = false } = body;

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Missing owner or repo" },
        { status: 400 }
      );
    }

    const port = 3001;
    const containerId = `${owner}-${repo}-${Date.now()}`;
    const repoPath = path.join(process.cwd(), "example-test-repo");

    // Check if Docker is requested
    if (useDocker && fs.existsSync(path.join(repoPath, "Dockerfile"))) {
      console.log(`🐳 Starting Docker container: ${containerId}`);

      try {
        // Build Docker image
        console.log("Building Docker image...");
        await execAsync(`cd ${repoPath} && docker build -t ${containerId} .`);

        // Run container
        console.log("Starting Docker container...");
        const runCommand = `docker run -d -p ${port}:3001 --name ${containerId} ${containerId}`;
        await execAsync(runCommand);

        // Wait for container to be ready
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Check health
        const healthCheck = await fetch(`http://localhost:${port}/api/health`, {
          method: "GET",
          signal: AbortSignal.timeout(3000),
        });

        const serverInfo = {
          owner,
          repo,
          containerId,
          port,
          status: healthCheck.ok ? "running" : "starting",
          url: `http://localhost:${port}`,
          timestamp: new Date().toISOString(),
          mode: "docker",
        };

        return NextResponse.json({
          success: true,
          server: serverInfo,
          message: "Docker container started and ready",
          requiresServerStart: false,
        });
      } catch (error: any) {
        console.error("Docker error:", error);
        return NextResponse.json(
          { error: "Failed to start Docker container", details: error.message },
          { status: 500 }
        );
      }
    }

    // Check if server is running locally
    let serverRunning = false;
    try {
      const healthCheck = await fetch(`http://localhost:${port}/api/health`, {
        method: "GET",
        signal: AbortSignal.timeout(1000),
      });
      serverRunning = healthCheck.ok;
    } catch (error) {
      console.log(`⚠️ No server detected on port ${port}`);
    }

    const serverInfo = {
      owner,
      repo,
      containerId,
      port,
      status: serverRunning ? "running" : "not_running",
      url: `http://localhost:${port}`,
      timestamp: new Date().toISOString(),
      mode: "local",
    };

    return NextResponse.json({
      success: true,
      server: serverInfo,
      message: serverRunning
        ? "Server is running and ready for testing"
        : "Server not running. Please start the test server first.",
      requiresServerStart: !serverRunning,
    });
  } catch (error: any) {
    console.error("Error starting server:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
