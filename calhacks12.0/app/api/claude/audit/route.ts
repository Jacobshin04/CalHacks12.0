import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";

interface AuditRequestBody {
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

    const body = (await request.json()) as AuditRequestBody;
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

    // Basic repo metadata to include as context for the audit (cheap but helpful)
    const repoMetaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "GitLit",
      },
      cache: "no-store",
    });

    let repoMeta: any = null;
    if (repoMetaRes.ok) {
      repoMeta = await repoMetaRes.json();
    }

    const repoUrl = repoMeta?.html_url || `https://github.com/${owner}/${repo}`;

    const questions = `You are a senior application security auditor. Provide a concise but high-signal audit in markdown.

Context:
- Repository: ${owner}/${repo}
- URL: ${repoUrl}
- Default branch (assumed): ${branch}
- Metadata: ${repoMeta ? JSON.stringify({
      private: repoMeta.private,
      visibility: repoMeta.visibility,
      language: repoMeta.language,
      topics: repoMeta.topics,
      has_pages: repoMeta.has_pages,
      archived: repoMeta.archived,
      disabled: repoMeta.disabled,
    }) : "unavailable"}

Answer the following nine sections with clear action items. Keep to ≤300 words total, but be specific. Use a 0–100 score for section 1.

1) Overall Security Health: overall summary and a Security Score (0–100).
2) Secret Management: any exposed secrets/keys/.env risks.
3) Dependency Safety: outdated/vulnerable deps or risky usage.
4) Auth & Authorization: token validation, password handling, open endpoints.
5) Input Validation & Sanitization: protection against SQLi/XSS/command injection.
6) Data Handling & Privacy: storage/transmission/logging of sensitive data; crypto usage.
7) Config & Environment Security: unsafe configs (DEBUG, CORS, exposed ports, DB URIs).
8) API & Network Security: route protections, HTTPS, scopes, least privilege.
9) Code Safety Patterns: insecure patterns (eval/exec/shell/dynamic imports).

If evidence is missing, state assumptions and recommended checks. End with a short prioritized remediation checklist.`;

    const anthropicPayload = {
      model: "claude-3-haiku-20240307",
      max_tokens: 1200,
      temperature: 0.2,
      system: "You are an experienced application security engineer. Be precise, high-signal, and pragmatic.",
      messages: [
        {
          role: "user",
          content: questions,
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
        { error: "Failed to get audit from Claude", details: text },
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
    console.error("Audit route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


