import { NextResponse } from "next/server";
import { defaultAdsSettings } from "@/lib/ads-settings";

let adsSettings = defaultAdsSettings;

export async function GET() {
  return NextResponse.json(adsSettings);
}

export async function POST(request: Request) {
  const body = await request.json();
  adsSettings = {
    adsense: Boolean(body.adsense),
    display300x250: Boolean(body.display300x250),
    inPagePush: Boolean(body.inPagePush),
  };

  return NextResponse.json(adsSettings);
}
