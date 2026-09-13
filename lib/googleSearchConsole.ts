import { createSign } from "node:crypto";

const SEARCH_CONSOLE_SCOPE = "https://www.googleapis.com/auth/webmasters";
const SEARCH_CONSOLE_ENDPOINT =
  "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function base64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function getSiteUrl() {
  return (
    process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://cinevero.vercel.app/"
  ).trim();
}

export function getSearchConsoleSiteUrl() {
  return getSiteUrl();
}

async function getAccessToken() {
  const clientEmail = required("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const privateKey = required("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY").replace(
    /\\n/g,
    "\n",
  );
  const now = Math.floor(Date.now() / 1000);

  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(
    JSON.stringify({
      iss: clientEmail,
      scope: SEARCH_CONSOLE_SCOPE,
      aud: GOOGLE_TOKEN_ENDPOINT,
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claim}`;

  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(privateKey, "base64url");

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
    cache: "no-store",
  });

  const payload = await response.json();
  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.error_description || payload?.error || "Google authentication failed");
  }

  return payload.access_token as string;
}

export async function inspectSearchConsoleUrl(url: string) {
  const siteUrl = getSiteUrl();
  const normalized = new URL(url).toString();
  const propertyRoot = siteUrl.replace(/\/$/, "");

  if (!normalized.startsWith(`${propertyRoot}/`) && normalized !== siteUrl) {
    throw new Error(`URL must belong to the configured Search Console property: ${siteUrl}`);
  }

  const accessToken = await getAccessToken();
  const response = await fetch(SEARCH_CONSOLE_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inspectionUrl: normalized,
      siteUrl,
      languageCode: "en-US",
    }),
    cache: "no-store",
  });

  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.error?.message || "Google Search Console inspection failed";
    throw new Error(message);
  }

  const result = payload?.inspectionResult || {};
  const indexStatus = result.indexStatusResult || {};

  return {
    url: normalized,
    inspectionResultLink: result.inspectionResultLink || null,
    verdict: indexStatus.verdict || null,
    coverageState: indexStatus.coverageState || null,
    indexingState: indexStatus.indexingState || null,
    robotsTxtState: indexStatus.robotsTxtState || null,
    pageFetchState: indexStatus.pageFetchState || null,
    lastCrawlTime: indexStatus.lastCrawlTime || null,
    googleCanonical: indexStatus.googleCanonical || null,
    userCanonical: indexStatus.userCanonical || null,
    crawledAs: indexStatus.crawledAs || null,
    sitemap: indexStatus.sitemap || [],
    referringUrls: indexStatus.referringUrls || [],
    richResultsVerdict: result.richResultsResult?.verdict || null,
  };
}

export async function inspectManySearchConsoleUrls(urls: string[]) {
  const unique = Array.from(new Set(urls.map((url) => url.trim()).filter(Boolean))).slice(0, 20);
  const results = [];

  for (const url of unique) {
    try {
      results.push({ ok: true, ...(await inspectSearchConsoleUrl(url)) });
    } catch (error) {
      results.push({
        ok: false,
        url,
        error: error instanceof Error ? error.message : "Inspection failed",
      });
    }
  }

  return results;
}
