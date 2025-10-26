import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

interface EnvVar {
  name: string;
  defaultValue: string;
  description?: string;
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

    // Fetch .env.example file
    const envExampleUrl = `https://api.github.com/repos/${owner}/${repo}/contents/.env.example`;
    const envRes = await fetch(envExampleUrl, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "GitLit",
      },
      cache: "no-store",
    });

    if (!envRes.ok) {
      return NextResponse.json({
        owner,
        repo,
        envVars: [],
        message: "No .env.example file found",
      });
    }

    const envFileData = await envRes.json();
    const envContent = Buffer.from(envFileData.content, "base64").toString(
      "utf-8"
    );
    const envVars = parseEnvFile(envContent);

    return NextResponse.json({
      owner,
      repo,
      envVars,
    });
  } catch (error) {
    console.error("Error fetching .env.example:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function parseEnvFile(content: string): EnvVar[] {
  const envVars: EnvVar[] = [];
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    // Parse KEY=VALUE format
    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (match) {
      const name = match[1];
      const value = match[2] || "";
      const defaultValue = generateDefaultValue(name, value);

      envVars.push({
        name,
        defaultValue,
        description: extractComment(content, lines.indexOf(line)),
      });
    }
  }

  return envVars;
}

function generateDefaultValue(name: string, originalValue: string): string {
  const lowerName = name.toLowerCase();

  // Database URLs
  if (name.includes("DATABASE_URL") || name.includes("DB_URL")) {
    return "postgresql://localhost:5432/testdb";
  }
  if (name.includes("MONGO") || name.includes("MONGODB")) {
    return "mongodb://localhost:27017/test";
  }

  // API Keys - provide mock values
  if (name.includes("API_KEY") || name.includes("SECRET")) {
    return `mock_${name.toLowerCase()}_for_testing`;
  }

  // URLs
  if (name.includes("URL") || name.includes("ENDPOINT")) {
    return originalValue || "http://localhost:3000";
  }

  // Ports
  if (name.includes("PORT")) {
    return "3000";
  }

  // JWT secrets
  if (name.includes("JWT") || name.includes("TOKEN")) {
    return "test-secret-key-change-in-production";
  }

  // OAuth
  if (
    name.includes("GITHUB") ||
    name.includes("GOOGLE") ||
    name.includes("AUTH")
  ) {
    return originalValue || "test-client-id";
  }

  // Return empty string or original value
  return originalValue || "";
}

function extractComment(
  content: string,
  lineIndex: number
): string | undefined {
  const lines = content.split("\n");

  // Check if the line above is a comment
  if (lineIndex > 0) {
    const prevLine = lines[lineIndex - 1].trim();
    if (prevLine.startsWith("#")) {
      return prevLine.substring(1).trim();
    }
  }

  // Check for inline comment
  const match = lines[lineIndex].match(/#\s*(.+)$/);
  return match ? match[1].trim() : undefined;
}

// Helper endpoint to create .env file content
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { envVars } = body;

    if (!envVars || !Array.isArray(envVars)) {
      return NextResponse.json(
        { error: "Missing envVars array" },
        { status: 400 }
      );
    }

    const envContent = envVars
      .map((envVar: EnvVar) => `${envVar.name}=${envVar.defaultValue}`)
      .join("\n");

    return NextResponse.json({
      content: envContent,
      format: ".env",
    });
  } catch (error) {
    console.error("Error generating .env content:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
