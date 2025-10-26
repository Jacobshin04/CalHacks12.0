import { NextRequest, NextResponse } from "next/server";

interface EndpointTest {
  method: string;
  path: string;
  url: string;
  status: "success" | "error" | "pending";
  statusCode?: number;
  responseTime?: number;
  responseBody?: any;
  error?: string;
}

interface TestRequest {
  endpoints: Array<{
    method: string;
    path: string;
  }>;
  baseUrl: string;
  serverPort: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoints, baseUrl, serverPort } = body;

    if (!endpoints || !Array.isArray(endpoints) || endpoints.length === 0) {
      return NextResponse.json(
        { error: "Missing or empty endpoints array" },
        { status: 400 }
      );
    }

    const tests: EndpointTest[] = [];

    for (const endpoint of endpoints) {
      const startTime = Date.now();
      const cleanPath = endpoint.path.startsWith("/")
        ? endpoint.path
        : `/${endpoint.path}`;
      const test: EndpointTest = {
        method: endpoint.method,
        path: endpoint.path,
        url: `${baseUrl}${cleanPath}`,
        status: "pending",
      };

      try {
        // Always try real HTTP request - no mock data fallback
        // Make real HTTP request to the actual server
        const fullUrl = test.url;
        console.log(`Testing ${endpoint.method} ${fullUrl}`);

        const fetchOptions: RequestInit = {
          method: endpoint.method,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        };

        // Add body for POST, PUT, PATCH requests
        if (["POST", "PUT", "PATCH"].includes(endpoint.method)) {
          fetchOptions.body = JSON.stringify(generateSampleBody(cleanPath));
        }

        const response = await fetch(fullUrl, fetchOptions);
        const responseTime = Date.now() - startTime;

        test.responseTime = responseTime;
        test.statusCode = response.status;
        test.status = response.ok ? "success" : "error";

        // Try to parse response body
        try {
          test.responseBody = await response.json();
        } catch {
          try {
            test.responseBody = await response.text();
          } catch {
            test.responseBody = null;
          }
        }

        if (!response.ok) {
          test.error = `HTTP ${response.status}: ${response.statusText}`;
        }

        tests.push(test);
      } catch (error: any) {
        test.status = "error";
        test.error = error.message || "Request failed";
        test.responseTime = Date.now() - startTime;
        test.statusCode = 0;
        tests.push(test);
      }
    }

    const summary = {
      total: tests.length,
      passed: tests.filter((t) => t.status === "success").length,
      failed: tests.filter((t) => t.status === "error").length,
      avgResponseTime:
        tests.reduce((sum, t) => sum + (t.responseTime || 0), 0) / tests.length,
    };

    return NextResponse.json({
      tests,
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error executing tests:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to generate sample request body for POST/PUT/PATCH requests
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

  return { data: "test" };
}
