import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";

interface QualityRequestBody {
  owner?: string;
  repo?: string;
  branch?: string;
  repoUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = (await request.json()) as QualityRequestBody;
    const owner = body.owner;
    const repo = body.repo;
    const branch = body.branch || "main";

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Missing owner or repo" },
        { status: 400 }
      );
    }

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      return NextResponse.json(
        { error: "Anthropic API key not configured" },
        { status: 500 }
      );
    }

    const repoUrl = body.repoUrl || `https://github.com/${owner}/${repo}`;

    const prompt = `Analyze code quality for ${owner}/${repo}. Be ULTRA-CONCISE.

Format:
**Score: XX/100**

[Optional: 1-2 sentence summary]

**Top Issues:**
• [Most critical issue - one line max 60 chars]
• [Second critical issue - one line max 60 chars]

**Top Recommendations:**
• [Priority fix - one line max 60 chars]
• [Priority fix - one line max 60 chars]

Max 4 bullets total. Action-focused. Skip fluff.`;

    const anthropicPayload = {
      model: "claude-3-haiku-20240307",
      max_tokens: 2000,
      temperature: 0.3,
      system:
        "You are an experienced code quality and readability analyst. Provide clear, actionable insights.",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    } as const;

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(anthropicPayload),
    });

    if (!anthropicRes.ok) {
      const text = await anthropicRes.text();
      console.error("Anthropic API error:", text);
      return NextResponse.json(
        { error: "Failed to get quality analysis from Claude", details: text },
        { status: anthropicRes.status }
      );
    }

    const anthropicData = await anthropicRes.json();
    const contentBlocks = anthropicData?.content || [];
    const textContent = contentBlocks
      .map((b: any) => (typeof b === "string" ? b : b.text || ""))
      .join("\n");

    return NextResponse.json({
      owner,
      repo,
      result: textContent || "No content returned",
      repoUrl,
    });
  } catch (error) {
    console.error("Quality route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
