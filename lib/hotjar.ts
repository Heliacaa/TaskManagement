export type AnalyticsEnv = Record<string, string | undefined>;

export type HotjarConfig = {
  siteId: number;
  version: number;
};

function publicHotjarEnv(): AnalyticsEnv {
  return {
    NEXT_PUBLIC_HOTJAR_SITE_ID: process.env.NEXT_PUBLIC_HOTJAR_SITE_ID,
    NEXT_PUBLIC_HOTJAR_VERSION: process.env.NEXT_PUBLIC_HOTJAR_VERSION
  };
}

export function getHotjarConfig(
  env: AnalyticsEnv = publicHotjarEnv()
): HotjarConfig | null {
  const rawSiteId = env.NEXT_PUBLIC_HOTJAR_SITE_ID?.trim();
  const rawVersion = env.NEXT_PUBLIC_HOTJAR_VERSION?.trim() || "6";

  if (!rawSiteId) {
    return null;
  }

  const siteId = Number(rawSiteId);
  const version = Number(rawVersion);

  if (
    !Number.isInteger(siteId) ||
    siteId <= 0 ||
    !Number.isInteger(version) ||
    version <= 0
  ) {
    return null;
  }

  return {
    siteId,
    version
  };
}

export function isHotjarConfigured(env?: AnalyticsEnv) {
  return getHotjarConfig(env) !== null;
}
