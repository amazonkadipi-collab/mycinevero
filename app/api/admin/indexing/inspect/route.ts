import { NextResponse } from "next/server";
import { inspectManySearchConsoleUrls } from "../../../../../lib/googleSearchConsole";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const urls = Array.isArray(body?.urls) ? body.urls : [];

    if (!urls.length) {
      return NextResponse.json({ error: "Provide at least one URL" }, { status: 400 });
    }

    const results = await inspectManySearchConsoleUrls(
      urls.filter((url: unknown): url is string => typeof url === "string"),
    );

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Inspection failed" },
      { status: 500 },
    );
  }
}
