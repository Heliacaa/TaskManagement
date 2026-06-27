"use client";

import { getHotjarConfig, type HotjarConfig } from "./hotjar";

type HotjarSdk = {
  init(siteId: number, version: number): boolean;
  identify(
    userId: string | null,
    userInfo: Record<string | number, string | number | Date | boolean>
  ): boolean;
  event(actionName: string): boolean;
  stateChange(relativePath: string): boolean;
};

type HotjarState = {
  initialized: boolean;
};

type HotjarClient = ReturnType<typeof createHotjarClient>;

export type HotjarIdentity = {
  id: string;
  plan: "free" | "premium";
  isAdmin: boolean;
};

export function createHotjarClient({
  sdk,
  getConfig,
  state = { initialized: false }
}: {
  sdk: HotjarSdk;
  getConfig: () => HotjarConfig | null;
  state?: HotjarState;
}) {
  function ensureReady() {
    const config = getConfig();

    if (!config) {
      return false;
    }

    if (!state.initialized) {
      state.initialized = sdk.init(config.siteId, config.version);
    }

    return state.initialized;
  }

  return {
    identify(user: HotjarIdentity | null) {
      if (!user || !ensureReady()) {
        return false;
      }

      return sdk.identify(user.id, {
        plan: user.plan,
        is_admin: user.isAdmin
      });
    },
    event(actionName: string) {
      if (!actionName || !ensureReady()) {
        return false;
      }

      return sdk.event(actionName);
    },
    stateChange(relativePath: string) {
      if (!relativePath || !ensureReady()) {
        return false;
      }

      return sdk.stateChange(relativePath);
    }
  };
}

let browserHotjarClient: HotjarClient | null = null;
let browserHotjarClientPromise: Promise<HotjarClient | null> | null = null;

async function getBrowserHotjarClient() {
  if (!getHotjarConfig()) {
    return null;
  }

  if (browserHotjarClient) {
    return browserHotjarClient;
  }

  browserHotjarClientPromise ??= import("@hotjar/browser")
    .then((module) => {
      browserHotjarClient = createHotjarClient({
        sdk: module.default,
        getConfig: () => getHotjarConfig()
      });

      return browserHotjarClient;
    })
    .catch((error) => {
      console.warn("Hotjar SDK failed to load", error);
      browserHotjarClientPromise = null;
      return null;
    });

  return browserHotjarClientPromise;
}

export async function identifyHotjar(user: HotjarIdentity | null) {
  const client = await getBrowserHotjarClient();
  return client ? client.identify(user) : false;
}

export async function trackHotjarEvent(actionName: string) {
  const client = await getBrowserHotjarClient();
  return client ? client.event(actionName) : false;
}

export async function trackHotjarStateChange(relativePath: string) {
  const client = await getBrowserHotjarClient();
  return client ? client.stateChange(relativePath) : false;
}
