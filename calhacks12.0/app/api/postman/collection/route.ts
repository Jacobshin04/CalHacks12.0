import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoints, owner, repo } = body;

    if (!endpoints || !Array.isArray(endpoints)) {
      return NextResponse.json(
        { error: "Missing endpoints array" },
        { status: 400 }
      );
    }

    // Generate Postman collection from endpoints
    const collection = generatePostmanCollection(
      endpoints,
      owner || "Example",
      repo || "repo"
    );

    return NextResponse.json(collection);
  } catch (error: any) {
    console.error("Error generating Postman collection:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

function generatePostmanCollection(
  endpoints: any[],
  owner: string,
  repo: string
) {
  // Group endpoints by path prefix
  const groupedEndpoints = groupByPrefix(endpoints);

  // Convert to Postman format
  const items = Object.entries(groupedEndpoints).map(
    ([groupName, groupEndpoints]: [string, any]) => ({
      name: groupName,
      item: groupEndpoints.map((endpoint: any) => createPostmanItem(endpoint)),
    })
  );

  return {
    info: {
      name: `${owner}/${repo} - API Collection`,
      description: `Auto-generated Postman collection for ${owner}/${repo}`,
      schema:
        "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item: items,
  };
}

function groupByPrefix(endpoints: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {};

  for (const endpoint of endpoints) {
    const path = endpoint.path || "/";
    const parts = path.split("/").filter((p: string) => p);
    const groupName = parts.length > 0 ? capitalize(parts[0]) : "Misc";

    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(endpoint);
  }

  return groups;
}

function createPostmanItem(endpoint: any) {
  const url = `http://localhost:3001${endpoint.path}`;
  const method = endpoint.method || "GET";

  const item: any = {
    name: `${method} ${endpoint.path}`,
    request: {
      method,
      header: [
        {
          key: "Content-Type",
          value: "application/json",
        },
      ],
      url: {
        raw: url,
        protocol: "http",
        host: ["localhost"],
        port: "3001",
        path: endpoint.path.split("/").filter((p: string) => p),
      },
    },
  };

  // Add body for POST, PUT, PATCH requests
  if (["POST", "PUT", "PATCH"].includes(method)) {
    const body = generateSampleBody(endpoint.path);
    item.request.body = {
      mode: "raw",
      raw: JSON.stringify(body, null, 2),
    };
  }

  return item;
}

function generateSampleBody(path: string): any {
  const pathLower = path.toLowerCase();

  if (pathLower.includes("user")) {
    return {
      name: "Test User",
      email: "test@example.com",
    };
  }

  if (pathLower.includes("post")) {
    return {
      title: "Test Post",
      content: "This is test content",
      author: "Test Author",
      category: "tech",
    };
  }

  if (pathLower.includes("auth") || pathLower.includes("login")) {
    return {
      email: "test@example.com",
      password: "password123",
    };
  }

  return {
    data: "test",
  };
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
