import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";

interface RateRequestBody {
  owner?: string;
  repo?: string;
  branch?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = (await request.json()) as RateRequestBody;
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
    console.log("[claude:rate] Incoming request", {
      owner,
      repo,
      branch,
      anthropicKeyConfigured: Boolean(anthropicApiKey),
    });
    if (!anthropicApiKey) {
      return NextResponse.json(
        { error: "Anthropic API key not configured" },
        { status: 500 }
      );
    }

    // Fetch light repo metadata to enrich the prompt
    const repoMetaRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "GitLit",
        },
        cache: "no-store",
      }
    );

    let repoMeta: any = null;
    if (repoMetaRes.ok) {
      repoMeta = await repoMetaRes.json();
    }

    const repoUrl = repoMeta?.html_url || `https://github.com/${owner}/${repo}`;

    const prompt = `Security audit for ${owner}/${repo}. ULTRA-CONCISE.

Format:
**Score: XX/100**

**Critical Risks:**
• [Top vulnerability - one line max 60 chars]
• [Second risk - one line max 60 chars]

**Urgent Fixes:**
• [Priority action - one line max 60 chars]

Max 3 bullets. Actionable. Skip details.`;

    const anthropicPayload = {
      model: "claude-3-haiku-20240307",
      max_tokens: 800,
      temperature: 0.2,
      system:
        "Be precise, pragmatic, and concise. Prefer concrete, actionable guidance.",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    } as const;

    // Helper: fetch with timeout and retries (backoff for 429/5xx)
    async function fetchWithRetry(
      url: string,
      init: RequestInit & { timeoutMs?: number },
      maxRetries = 2
    ) {
      let attempt = 0;
      let lastErr: any = null;
      while (attempt <= maxRetries) {
        const controller = new AbortController();
        const timeout = setTimeout(
          () => controller.abort(),
          init.timeoutMs ?? 20000
        );
        try {
          const res = await fetch(url, { ...init, signal: controller.signal });
          clearTimeout(timeout);
          if (res.ok) return res;
          if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
            const wait = Math.min(1500 * Math.pow(2, attempt), 4000);
            await new Promise((r) => setTimeout(r, wait));
            attempt++;
            continue;
          }
          return res; // non-retryable
        } catch (e: any) {
          clearTimeout(timeout);
          lastErr = e;
          // retry aborted/timeouts once
          const wait = Math.min(1500 * Math.pow(2, attempt), 4000);
          await new Promise((r) => setTimeout(r, wait));
          attempt++;
        }
      }
      throw lastErr || new Error("Request failed after retries");
    }

    const anthropicRes = await fetchWithRetry(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(anthropicPayload),
        timeoutMs: 20000,
      },
      2
    );

    if (!anthropicRes.ok) {
      const text = await anthropicRes.text();
      console.error("[claude:rate] Anthropic API error", {
        status: anthropicRes.status,
        statusText: anthropicRes.statusText,
        bodyPreview: text.slice(0, 300),
      });
      return NextResponse.json(
        { error: "Failed to get code rating from Claude", details: text },
        { status: anthropicRes.status }
      );
    }

    const anthropicData = await anthropicRes.json();
    const contentBlocks = anthropicData?.content || [];
    const textContent = contentBlocks
      .map((b: any) => (typeof b === "string" ? b : b.text || ""))
      .join("\n");

    console.log("[claude:rate] Received response", {
      contentLength: textContent?.length || 0,
      preview: (textContent || "").slice(0, 200),
    });

    return NextResponse.json({
      owner,
      repo,
      result: textContent || "No content returned",
      repoUrl,
    });
  } catch (error) {
    console.error("Code rating route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
