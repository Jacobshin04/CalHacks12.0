import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";

export async function GET(request: NextRequest) {
  console.log('📂 === GITHUB REPOS API CALLED ===');
  
  try {
    // Get the session to retrieve the access token using NextAuth v5
    console.log('🔐 Checking authentication for GitHub repos...');
    const session = await auth();

    if (!session?.accessToken) {
      console.log('❌ No GitHub access token found');
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.log('✅ GitHub access token found');

    // Fetch repositories from GitHub API
    console.log('🌐 Fetching repositories from GitHub API...');
    const response = await fetch(
      "https://api.github.com/user/repos?per_page=100&sort=updated",
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "GitLit",
        },
      }
    );
    
    console.log('📊 GitHub API response status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ GitHub API error:", response.status, error);
      return NextResponse.json(
        { error: "Failed to fetch repositories" },
        { status: response.status }
      );
    }

    console.log('✅ GitHub API request successful, parsing response...');
    const repos = await response.json();
    console.log(`📊 Found ${repos.length} repositories from GitHub`);

    // Transform the data to match our RepoScore interface
    console.log('🔄 Transforming repository data...');
    const transformedRepos = repos.map((repo: any) => ({
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      private: repo.private,
      url: repo.html_url,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      updatedAt: repo.updated_at,
      score: Math.floor(Math.random() * 30) + 70, // Placeholder score (70-100)
      lastReview: "Never",
      issues: repo.open_issues_count,
      security: 0,
      performance: Math.floor(Math.random() * 20) + 80,
    }));

    console.log('📋 Sample repository data:', {
      firstRepo: transformedRepos[0] ? {
        name: transformedRepos[0].name,
        fullName: transformedRepos[0].fullName,
        language: transformedRepos[0].language
      } : 'No repos found'
    });
    
    console.log('🏁 === GITHUB REPOS API COMPLETED ===');
    return NextResponse.json({ repos: transformedRepos });
  } catch (error) {
    console.error("Error fetching repositories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
