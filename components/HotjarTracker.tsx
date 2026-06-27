"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  identifyHotjar,
  trackHotjarStateChange,
  type HotjarIdentity
} from "@/lib/hotjar-client";

type HotjarTrackerProps = {
  user: HotjarIdentity | null;
};

export function HotjarTracker({ user }: HotjarTrackerProps) {
  const pathname = usePathname();
  const userId = user?.id ?? null;
  const plan = user?.plan ?? null;
  const isAdmin = user?.isAdmin ?? false;

  useEffect(() => {
    if (!userId || !plan) {
      return;
    }

    void identifyHotjar({
      id: userId,
      plan,
      isAdmin
    });
  }, [userId, plan, isAdmin]);

  useEffect(() => {
    void trackHotjarStateChange(pathname);
  }, [pathname]);

  return null;
}
