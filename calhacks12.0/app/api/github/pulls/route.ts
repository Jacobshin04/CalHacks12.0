import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const state = searchParams.get("state") || "all"; // all, open, closed
    const perPage = searchParams.get("per_page") || "30";

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Missing owner or repo" },
        { status: 400 }
      );
    }

    // Fetch pull requests from GitHub API
    const pullsUrl = `https://api.github.com/repos/${owner}/${repo}/pulls?state=${state}&per_page=${perPage}&sort=updated&direction=desc`;

    const pullsResponse = await fetch(pullsUrl, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "GitLit",
      },
      cache: "no-store",
    });

    if (!pullsResponse.ok) {
      const error = await pullsResponse.text();
      console.error("GitHub pulls API error:", error);
      return NextResponse.json(
        { error: "Failed to fetch pull requests" },
        { status: pullsResponse.status }
      );
    }

    const pulls = await pullsResponse.json();

    // For each pull request, fetch its comments
    const pullsWithComments = await Promise.all(
      pulls.map(async (pull: any) => {
        try {
          // Fetch PR comments
          const commentsUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${pull.number}/comments`;
          const commentsResponse = await fetch(commentsUrl, {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "GitLit",
            },
            cache: "no-store",
          });

          let comments = [];
          if (commentsResponse.ok) {
            comments = await commentsResponse.json();
          }

          // Fetch PR review comments
          const reviewCommentsUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${pull.number}/comments`;
          const reviewCommentsResponse = await fetch(reviewCommentsUrl, {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "GitLit",
            },
            cache: "no-store",
          });

          let reviewComments = [];
          if (reviewCommentsResponse.ok) {
            reviewComments = await reviewCommentsResponse.json();
          }

          return {
            ...pull,
            comments: comments,
            reviewComments: reviewComments,
            totalComments: comments.length + reviewComments.length,
          };
        } catch (error) {
          console.error(
            `Error fetching comments for PR ${pull.number}:`,
            error
          );
          return {
            ...pull,
            comments: [],
            reviewComments: [],
            totalComments: 0,
          };
        }
      })
    );

    return NextResponse.json({
      pulls: pullsWithComments,
      totalCount: pullsWithComments.length,
    });
  } catch (error) {
    console.error("Error fetching pull requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
