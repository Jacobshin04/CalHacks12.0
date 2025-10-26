import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { owner, repo, customPrompt, groupBy } = body;

    // 🔵 DEBUG: Log what we're sending to CodeRabbit
    console.log("=== CodeRabbit Request Debug ===");
    console.log("Repository:", `${owner}/${repo}`);
    console.log("Group By:", groupBy || "NONE");
    console.log("Custom Prompt:", customPrompt);

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Missing owner or repo" },
        { status: 400 }
      );
    }

    // Get CodeRabbit API key from environment variables
    const codeRabbitApiKey = process.env.CODERABBIT_API_KEY;
    if (!codeRabbitApiKey) {
      return NextResponse.json(
        { error: "CodeRabbit API key not configured" },
        { status: 500 }
      );
    }

    // Build request payload for CodeRabbit report generation
    // Use date range for the report
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const requestPayload: any = {
      from: startDate,
      to: endDate,
      groupBy: groupBy || "REPOSITORY",
      ...(customPrompt && { prompt: customPrompt }),
    };

    console.log(
      "Sending to CodeRabbit:",
      JSON.stringify(requestPayload, null, 2)
    );

    // Use the report generation endpoint
    const codeRabbitResponse = await fetch(
      "https://api.coderabbit.ai/api/v1/report.generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-coderabbitai-api-key": codeRabbitApiKey,
        },
        body: JSON.stringify(requestPayload),
      }
    );

    console.log("CodeRabbit response status:", codeRabbitResponse.status);

    if (!codeRabbitResponse.ok) {
      const error = await codeRabbitResponse.text();
      console.error("🔴 CodeRabbit API error:", error);
      return NextResponse.json(
        { error: "Failed to get review from CodeRabbit", details: error },
        { status: codeRabbitResponse.status }
      );
    }

    const data = await codeRabbitResponse.json();
    console.log("✅ CodeRabbit response:", JSON.stringify(data, null, 2));
    console.log("=== End Debug ===\n");

    return NextResponse.json({
      owner,
      repo,
      result: data.result,
    });
  } catch (error) {
    console.error("Error calling CodeRabbit API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
