"use client";

import { useEffect } from "react";
import { trackHotjarEvent } from "@/lib/hotjar-client";

function sendEvent(event: string, metadata: Record<string, unknown>) {
  void trackHotjarEvent(event);

  const payload = JSON.stringify({ event, metadata });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics", new Blob([payload], { type: "application/json" }));
    return;
  }

  void fetch("/api/analytics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: payload,
    keepalive: true
  });
}

export function PricingTracker() {
  useEffect(() => {
    const activePlans = new Map<Element, number>();

    sendEvent("pricing_viewed", {
      page: "pricing"
    });

    const start = (target: Element) => {
      if (!activePlans.has(target)) {
        activePlans.set(target, Date.now());
      }
    };

    const stop = (target: Element) => {
      const startedAt = activePlans.get(target);

      if (!startedAt) {
        return;
      }

      activePlans.delete(target);
      sendEvent("pricing_plan_focused", {
        plan: target.getAttribute("data-pricing-plan"),
        durationMs: Date.now() - startedAt
      });
    };

    const cards = Array.from(document.querySelectorAll("[data-pricing-plan]"));
    const cleanups = cards.map((card) => {
      const onEnter = () => start(card);
      const onLeave = () => stop(card);

      card.addEventListener("mouseenter", onEnter);
      card.addEventListener("focusin", onEnter);
      card.addEventListener("mouseleave", onLeave);
      card.addEventListener("focusout", onLeave);

      return () => {
        card.removeEventListener("mouseenter", onEnter);
        card.removeEventListener("focusin", onEnter);
        card.removeEventListener("mouseleave", onLeave);
        card.removeEventListener("focusout", onLeave);
      };
    });

    const eventTargets = Array.from(document.querySelectorAll("[data-hotjar-event]"));
    const eventCleanups = eventTargets.map((target) => {
      const onClick = () => {
        const event = target.getAttribute("data-hotjar-event");

        if (event) {
          void trackHotjarEvent(event);
        }
      };

      target.addEventListener("click", onClick);

      return () => {
        target.removeEventListener("click", onClick);
      };
    });

    const flush = () => {
      cards.forEach((card) => stop(card));
    };

    window.addEventListener("beforeunload", flush);

    return () => {
      flush();
      cleanups.forEach((cleanup) => cleanup());
      eventCleanups.forEach((cleanup) => cleanup());
      window.removeEventListener("beforeunload", flush);
    };
  }, []);

  return null;
}
