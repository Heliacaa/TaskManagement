import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { isPremium } from "@/lib/subscription";
import "./globals.css";

export const metadata: Metadata = {
  title: "TaskFlow SaaS MVP",
  description: "A portfolio-ready SaaS task manager with product analytics."
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const premium = isPremium(user?.subscription);

  return (
    <html lang="en" className={premium ? "dark" : ""} suppressHydrationWarning>
      <body>
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  );
}
