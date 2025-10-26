import { NextRequest, NextResponse } from "next/server";

// Map discovered endpoints to actual test server routes
// This fixes the path mismatch between file structure and actual API paths
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoints } = body;

    if (!endpoints || !Array.isArray(endpoints)) {
      return NextResponse.json(
        { error: "Missing endpoints array" },
        { status: 400 }
      );
    }

    // Map endpoints to correct paths based on actual server.js routes
    const mappedEndpoints = endpoints.map((endpoint: any) => {
      let cleanPath = endpoint.path;

      // Remove any file structure artifacts
      cleanPath = cleanPath.replace(/^calhacks12\.0\//, "");
      cleanPath = cleanPath.replace(/^app\/api/, "/api");
      cleanPath = cleanPath.replace(/^\/app/, "");
      cleanPath = cleanPath.replace(/route\.ts$/, "");
      cleanPath = cleanPath.replace(/route\.js$/, "");

      // Ensure it starts with /
      if (!cleanPath.startsWith("/")) {
        cleanPath = `/${cleanPath}`;
      }

      // Remove trailing slashes
      cleanPath = cleanPath.replace(/\/$/, "");

      // Handle dynamic routes for Express server
      // Convert [id] to :id for Express
      cleanPath = cleanPath.replace(/\[(\w+)\]/g, ":$1");

      // Remove common patterns that don't work in Express
      cleanPath = cleanPath.replace(/\/route$/, "");

      return {
        ...endpoint,
        path: cleanPath || "/",
      };
    });

    return NextResponse.json({
      endpoints: mappedEndpoints,
    });
  } catch (error: any) {
    console.error("Error mapping endpoints:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
