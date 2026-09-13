import Script from "next/script";

export default function VercelAnalyticsScript() {
  return <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />;
}
