import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

// Fallback to .env if .env.local doesn't exist
dotenv.config({ path: ".env" });

// Environment configuration with validation
export const env = {
  // NextAuth configuration
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development",
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
  
  // GitHub OAuth configuration
  GITHUB_ID: process.env.GITHUB_ID,
  GITHUB_SECRET: process.env.GITHUB_SECRET,
  
  // Claude AI configuration
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
  
  // Node environment
  NODE_ENV: process.env.NODE_ENV || "development",
} as const;

// Debug Claude API key loading
console.log('🔑 === CLAUDE API KEY DEBUG ===');
console.log('🔑 CLAUDE_API_KEY exists:', !!env.CLAUDE_API_KEY);
console.log('🔑 CLAUDE_API_KEY length:', env.CLAUDE_API_KEY?.length || 0);
console.log('🔑 CLAUDE_API_KEY starts with sk-ant:', env.CLAUDE_API_KEY?.startsWith('sk-ant-') || false);
console.log('🔑 CLAUDE_API_KEY first 10 chars:', env.CLAUDE_API_KEY?.substring(0, 10) || 'NOT_FOUND');
console.log('🔑 === END CLAUDE API KEY DEBUG ===');

// Validation function to check required environment variables
export function validateEnv() {
  const requiredVars = ["GITHUB_ID", "GITHUB_SECRET", "NEXTAUTH_SECRET"];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missing.join(", ")}`);
    console.warn("Please check your .env.local file");
  } else {
    console.log("✅ All required environment variables are loaded");
  }
}

// Call validation in development
if (env.NODE_ENV === "development") {
  validateEnv();
}
