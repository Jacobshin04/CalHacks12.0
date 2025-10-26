"use client";

import { useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";

export default function ReviewPage() {
  const params = useParams<{ owner: string; repo: string }>();
  const search = useSearchParams(); // optional if you want ?path=
  const owner = params.owner;
  const repo = params.repo;
  const path = search.get("path") ?? ""; // root

  useEffect(() => {
    async function run() {
      try {
        const res = await fetch(`/api/github/contents?owner=${owner}&repo=${repo}&path=${encodeURIComponent(path)}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok) {
          console.error("Review fetch error:", json);
          return;
        }

        // 🔵 Browser console log so you can see it in DevTools
        console.log(`[review] contents of ${owner}/${repo} path="${path}"`, json);

        // Optional: if it's a single file, GitHub returns base64 in json.data.content
        // You can test-decoding here later, but for now we just log raw.
      } catch (e) {
        console.error("Review fetch exception:", e);
      }
    }
    run();
  }, [owner, repo, path]);

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-2">Review: {owner}/{repo}</h1>
      <p className="text-gray-600">Fetched root contents. Check both the **server logs** and your **browser console**.</p>
    </div>
  );
}
