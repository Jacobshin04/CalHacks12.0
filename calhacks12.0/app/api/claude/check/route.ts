import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";

interface CheckRequestBody {
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

    const body = (await request.json()) as CheckRequestBody;
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
    console.log("[claude:check] Incoming request", {
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

    // Fetch light repo metadata
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

    const prompt = `You are a senior code reviewer. Produce a single, ULTRA-CONCISE repository check covering readability, bugs, security, and system design.

Context:
- Repository: ${owner}/${repo}
- URL: ${repoUrl}
- Default branch (assumed): ${branch}
- Metadata: ${repoMeta ? JSON.stringify({
      private: repoMeta.private,
      visibility: repoMeta.visibility,
      language: repoMeta.language,
      topics: repoMeta.topics,
      archived: repoMeta.archived,
      disabled: repoMeta.disabled,
    }) : "unavailable"}

Return ONLY valid minified JSON with this exact shape. All scores are integers 0–25:
{
  "readability": { "score": number, "assessment": string, "bullets": string[] },
  "bugs":        { "score": number, "bullets": string[] },
  "security":    { "score": number, "bullets": string[] },
  "design":      { "score": number, "bullets": string[] }
}

Guidelines:
- Short, specific bullets (<=100 chars). No markdown. JSON only.`.trim();

    const anthropicPayload = {
      model: "claude-3-haiku-20240307",
      max_tokens: 2200,
      temperature: 0.2,
      system: "You are precise and return strictly valid JSON when asked.",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    } as const;

    // Helper: fetch with timeout and limited retries
    async function fetchWithRetry(
      url: string,
      init: RequestInit & { timeoutMs?: number },
      maxRetries = 1
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
          return res;
        } catch (e: any) {
          clearTimeout(timeout);
          lastErr = e;
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
      1
    );

    if (!anthropicRes.ok) {
      const text = await anthropicRes.text();
      console.error("[claude:check] Anthropic API error", {
        status: anthropicRes.status,
        statusText: anthropicRes.statusText,
        bodyPreview: text.slice(0, 300),
      });
      return NextResponse.json(
        { error: "Failed to get combined analysis from Claude", details: text },
        { status: anthropicRes.status }
      );
    }

    const anthropicData = await anthropicRes.json();
    const contentBlocks = anthropicData?.content || [];
    const rawText = contentBlocks
      .map((b: any) => (typeof b === "string" ? b : b.text || ""))
      .join("\n")
      .trim();

    let result: any = null;
    try {
      result = JSON.parse(rawText);
    } catch {
      const m = rawText.match(/\{[\s\S]*\}$/m);
      if (m) {
        result = JSON.parse(m[0]);
      } else {
        throw new Error("Claude did not return valid JSON");
      }
    }

    console.log("[claude:check] Received response", {
      keys: Object.keys(result || {}),
      rScore: result?.readability?.score,
      bScore: result?.bugs?.score,
      sScore: result?.security?.score,
      dScore: result?.design?.score,
    });

    return NextResponse.json({
      owner,
      repo,
      repoUrl,
      result,
    });
  } catch (error) {
    console.error("[claude:check] route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


