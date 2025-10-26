import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

interface EndpointInfo {
  method: string;
  path: string;
  file: string;
  parameters: {
    query: string[];
    body: string[];
    headers: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { owner, repo } = body;

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Missing owner or repo" },
        { status: 400 }
      );
    }

    // Fetch repository contents from root
    const contentsUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;
    const contentsRes = await fetch(contentsUrl, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "GitLit",
      },
      cache: "no-store",
    });

    if (!contentsRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch repository contents" },
        { status: contentsRes.status }
      );
    }

    const contents = await contentsRes.json();
    const endpoints: EndpointInfo[] = [];

    // Search for API route files
    await searchForRoutes(
      owner,
      repo,
      contents,
      endpoints,
      session.accessToken
    );

    return NextResponse.json({
      owner,
      repo,
      endpoints,
      total: endpoints.length,
    });
  } catch (error) {
    console.error("Error discovering endpoints:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function searchForRoutes(
  owner: string,
  repo: string,
  items: any[],
  endpoints: EndpointInfo[],
  accessToken: string,
  path = ""
): Promise<void> {
  for (const item of items) {
    // Check if it's a directory - search recursively
    if (item.type === "dir") {
      const dirPath = path ? `${path}/${item.name}` : item.name;

      // Recursively search ALL directories
      const dirContentsUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}`;
      const dirRes = await fetch(dirContentsUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "GitLit",
        },
        cache: "no-store",
      });

      if (dirRes.ok) {
        const dirContents = await dirRes.json();
        await searchForRoutes(
          owner,
          repo,
          dirContents,
          endpoints,
          accessToken,
          dirPath
        );
      }
    }

    // Check if it's a route file
    if (item.type === "file" && isRouteFile(item.name)) {
      const filePath = path ? `${path}/${item.name}` : item.name;
      const routeUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
      const fileRes = await fetch(routeUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "GitLit",
        },
        cache: "no-store",
      });

      if (fileRes.ok) {
        const fileData = await fileRes.json();
        const content = Buffer.from(fileData.content, "base64").toString(
          "utf-8"
        );
        const discoveredEndpoints = parseEndpoints(content, filePath);
        endpoints.push(...discoveredEndpoints);
      }
    }
  }
}

function isRouteFile(filename: string): boolean {
  const routePatterns = [
    /route\.(ts|tsx|js|jsx)$/,
    /routes\.(ts|tsx|js|jsx)$/,
    /index\.(ts|tsx|js|jsx)$/,
    /.*\.routes?\.(ts|tsx|js|jsx)$/,
    /\.(py)$/, // Python files (app.py, main.py, etc.)
    /\.(js)$/, // General JavaScript files (ping.js, etc.)
  ];

  return routePatterns.some((pattern) => pattern.test(filename));
}

function parseEndpoints(content: string, filePath: string): EndpointInfo[] {
  const endpoints: EndpointInfo[] = [];

  // Next.js App Router patterns
  const nextAppPattern =
    /(?:export\s+)?(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(/g;
  const matches = content.matchAll(nextAppPattern);

  for (const match of matches) {
    const method = match[1];
    const directory = filePath
      .split("/")
      .slice(0, -1)
      .join("/")
      .replace(/^app\/api/, "");
    const path = directory || "/";

    endpoints.push({
      method,
      path,
      file: filePath,
      parameters: extractParameters(content),
    });
  }

  // Express.js patterns
  const expressPatterns = [
    /app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
  ];

  for (const pattern of expressPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const method = match[1].toUpperCase();
      const path = match[2];

      endpoints.push({
        method,
        path,
        file: filePath,
        parameters: extractParameters(content),
      });
    }
  }

  // Flask patterns
  const flaskPattern =
    /@app\.(get|post|put|delete|patch|route)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  const flaskMatches = content.matchAll(flaskPattern);
  for (const match of flaskMatches) {
    const method =
      match[1].toUpperCase() === "ROUTE" ? "GET" : match[1].toUpperCase();
    const path = match[2];

    endpoints.push({
      method,
      path,
      file: filePath,
      parameters: extractParameters(content),
    });
  }

  // FastAPI patterns
  const fastApiPattern =
    /@app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  const fastApiMatches = content.matchAll(fastApiPattern);
  for (const match of fastApiMatches) {
    const method = match[1].toUpperCase();
    const path = match[2];

    endpoints.push({
      method,
      path,
      file: filePath,
      parameters: extractParameters(content),
    });
  }

  return endpoints;
}

function extractParameters(content: string): {
  query: string[];
  body: string[];
  headers: string[];
} {
  const query = [
    ...content.matchAll(/searchParams\.get\(['"`]([^'"`]+)['"`]/g),
  ].map((m) => m[1]);
  const body =
    [...content.matchAll(/await\s+request\.json\(\)/g)].length > 0
      ? ["body"]
      : [];
  const headers: string[] = [];

  return { query, body, headers };
}
