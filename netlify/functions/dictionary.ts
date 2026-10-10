import type { Config, Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  // Only allow GET requests
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  const word = context.params.word;

  if (!word || typeof word !== "string" || word.trim() === "") {
    return new Response(JSON.stringify({ error: "Missing or invalid word parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Basic validation: prevent arbitrary URL building
  if (word.includes("/") || word.includes("\\")) {
    return new Response(JSON.stringify({ error: "Invalid word parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const targetUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.trim())}`;

  try {
    const apiResponse = await fetch(targetUrl, {
      signal: AbortSignal.timeout(5000),
      headers: {
        "Accept": "application/json",
        "User-Agent": "ChapterCheck/1.0"
      }
    });
    // const apiResponse = await fetch(targetUrl, {
    //   headers: {
    //     "Accept": "application/json",
    //     "User-Agent": "ChapterCheck/1.0"
    //   }
    // });

    if (!apiResponse.ok) {
      if (apiResponse.status === 404) {
        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }
      return new Response(JSON.stringify({ error: `Upstream error: ${apiResponse.status}` }), {
        status: 502,
        headers: { "Content-Type": "application/json" }
      });
    }

    const data = await apiResponse.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Allow caching on the edge for performance
        "Cache-Control": "public, s-maxage=3600"
      }
    });
  } catch (err) {
    console.error("Dictionary API Fetch Error:", err);
    return new Response(JSON.stringify({ error: "Failed to reach dictionary service" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const config: Config = {
  path: "/api/dictionary/:word"
};
