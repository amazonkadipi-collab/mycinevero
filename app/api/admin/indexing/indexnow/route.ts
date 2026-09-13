import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://cinevero.vercel.app";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const urls = Array.from(
      new Set(
        (Array.isArray(body?.urls) ? body.urls : [])
          .filter((url: unknown): url is string => typeof url === "string")
          .map((url) => url.trim())
          .filter((url) => url.startsWith(SITE_URL.replace(/\/$/, "") + "/"))
          .slice(0, 10000),
      ),
    );

    if (!urls.length) {
      return NextResponse.json({ error: "No valid Cinevero URLs supplied" }, { status: 400 });
    }

    const key = process.env.INDEXNOW_KEY || "cinevero-indexnow-2026";
    const keyLocation = `${SITE_URL.replace(/\/$/, "")}/${key}.txt`;

    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(SITE_URL).host,
        key,
        keyLocation,
        urlList: urls,
      }),
      cache: "no-store",
    });

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        { error: `IndexNow returned HTTP ${response.status}`, details: text },
        { status: 502 },
      );
    }

    return NextResponse.json({ submitted: urls.length, status: response.status, details: text || "OK" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "IndexNow submission failed" },
      { status: 500 },
    );
  }
}
