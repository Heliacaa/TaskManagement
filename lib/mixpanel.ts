import type { Prisma } from "@prisma/client";
import Mixpanel from "mixpanel";

type MixpanelClient = {
  track(
    eventName: string,
    properties: Record<string, unknown>,
    callback?: (error?: Error) => void
  ): void;
};

type MixpanelSdk = {
  init(token: string): MixpanelClient;
};

type AnalyticsEnv = Record<string, string | undefined>;

type AnalyticsLogger = {
  warn(message?: unknown, ...optionalParams: unknown[]): void;
};

export type MixpanelAnalyticsUser = {
  id: string;
  plan?: string;
  isAdmin: boolean;
};

export type MixpanelAnalyticsEvent = {
  event: string;
  userId?: string | null;
  metadata?: Prisma.InputJsonValue | Prisma.JsonValue | null;
  user?: MixpanelAnalyticsUser | null;
};

type MixpanelForwardResult =
  | {
      forwarded: true;
    }
  | {
      forwarded: false;
      reason: "not_configured" | "error";
      error?: unknown;
    };

function getMixpanelToken(env: AnalyticsEnv = process.env) {
  const token = env.MIXPANEL_PROJECT_TOKEN?.trim();
  return token ? token : null;
}

export function isMixpanelConfigured(env: AnalyticsEnv = process.env) {
  return Boolean(getMixpanelToken(env));
}

function readProperties(
  metadata?: Prisma.InputJsonValue | Prisma.JsonValue | null
) {
  if (!metadata || Array.isArray(metadata) || typeof metadata !== "object") {
    return {};
  }

  const blockedKeys = new Set(["email", "name", "password", "passwordHash"]);

  return Object.fromEntries(
    Object.entries(metadata as Record<string, unknown>).filter(
      ([key]) => !blockedKeys.has(key)
    )
  );
}

export function buildMixpanelProperties(
  input: MixpanelAnalyticsEvent,
  env: AnalyticsEnv = process.env
) {
  const metadata = readProperties(input.metadata);
  const userId = input.userId ?? input.user?.id ?? "anonymous";

  return {
    ...metadata,
    distinct_id: userId,
    event_source: "taskflow_web",
    environment: env.NODE_ENV ?? "development",
    plan:
      input.user?.plan ??
      (typeof metadata.plan === "string" ? metadata.plan : "unknown"),
    is_admin: input.user?.isAdmin ?? false
  };
}

export function createMixpanelForwarder({
  sdk = Mixpanel,
  env = process.env,
  logger = console
}: {
  sdk?: MixpanelSdk;
  env?: AnalyticsEnv;
  logger?: AnalyticsLogger;
} = {}) {
  let client: MixpanelClient | null | undefined;

  function getClient() {
    if (client !== undefined) {
      return client;
    }

    const token = getMixpanelToken(env);
    client = token ? sdk.init(token) : null;
    return client;
  }

  async function track(
    input: MixpanelAnalyticsEvent
  ): Promise<MixpanelForwardResult> {
    let mixpanelClient: MixpanelClient | null;

    try {
      mixpanelClient = getClient();
    } catch (error) {
      logger.warn("Mixpanel init failed", error);
      return {
        forwarded: false,
        reason: "error",
        error
      };
    }

    if (!mixpanelClient) {
      return {
        forwarded: false,
        reason: "not_configured"
      };
    }

    const properties = buildMixpanelProperties(input, env);

    return new Promise<MixpanelForwardResult>((resolve) => {
      try {
        mixpanelClient.track(input.event, properties, (error?: Error) => {
          if (error) {
            logger.warn("Mixpanel event failed", error);
            resolve({
              forwarded: false,
              reason: "error",
              error
            });
            return;
          }

          resolve({
            forwarded: true
          });
        });
      } catch (error) {
        logger.warn("Mixpanel event failed", error);
        resolve({
          forwarded: false,
          reason: "error",
          error
        });
      }
    });
  }

  return {
    track
  };
}

const mixpanelForwarder = createMixpanelForwarder();

export async function forwardToMixpanel(input: MixpanelAnalyticsEvent) {
  return mixpanelForwarder.track(input);
}
