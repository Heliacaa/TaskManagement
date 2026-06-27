import type { Metadata } from "next";
import Script from "next/script";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { isPremium } from "@/lib/subscription";
import "./globals.css";

export const metadata: Metadata = {
  title: "TaskFlow SaaS MVP",
  description: "A portfolio-ready SaaS task manager with product analytics."
};

function getContentsquareTagUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_CONTENTSQUARE_TAG_URL?.trim();

  if (!rawUrl) {
    return null;
  }

  try {
    const url = new URL(rawUrl);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const premium = isPremium(user?.subscription);
  const contentsquareTagUrl = getContentsquareTagUrl();

  return (
    <html lang="en" className={premium ? "dark" : ""} suppressHydrationWarning>
      <body>
        {contentsquareTagUrl ? (
          <Script
            id="contentsquare-tag"
            src={contentsquareTagUrl}
            strategy="afterInteractive"
          />
        ) : null}
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  );
}
