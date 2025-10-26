import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth"; // adjust if your auth path differs

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const path = searchParams.get("path") ?? ""; // root by default

    if (!owner || !repo) {
      return NextResponse.json({ error: "Missing owner/repo" }, { status: 400 });
    }

    const ghUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;

    const res = await fetch(ghUrl, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "GitLit",
      },
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("GitHub contents error:", data);
      return NextResponse.json(
        { error: "Failed to fetch contents", details: data },
        { status: res.status }
      );
    }

    // 🔵 Server log so you can see it in your terminal
    console.log(`[contents] ${owner}/${repo} path="${path}" ->`, Array.isArray(data) ? `${data.length} entries` : data?.name);

    // For files, GitHub returns base64 content. Return as-is (client can decode or just inspect).
    return NextResponse.json({ data });
  } catch (err) {
    console.error("API /contents error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
