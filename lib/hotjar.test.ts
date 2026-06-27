import { describe, expect, it, vi } from "vitest";
import { createHotjarClient } from "./hotjar-client";
import { getHotjarConfig } from "./hotjar";

describe("Hotjar analytics adapter", () => {
  it("returns no config when Hotjar env is missing or invalid", () => {
    expect(getHotjarConfig({})).toBeNull();
    expect(
      getHotjarConfig({
        NEXT_PUBLIC_HOTJAR_SITE_ID: "not-a-number",
        NEXT_PUBLIC_HOTJAR_VERSION: "6"
      })
    ).toBeNull();
    expect(
      getHotjarConfig({
        NEXT_PUBLIC_HOTJAR_SITE_ID: "123",
        NEXT_PUBLIC_HOTJAR_VERSION: "bad"
      })
    ).toBeNull();
  });

  it("uses version 6 by default when only site id is configured", () => {
    expect(
      getHotjarConfig({
        NEXT_PUBLIC_HOTJAR_SITE_ID: "123"
      })
    ).toEqual({
      siteId: 123,
      version: 6
    });
  });

  it("does not call the SDK when Hotjar is not configured", () => {
    const sdk = {
      init: vi.fn(),
      identify: vi.fn(),
      event: vi.fn(),
      stateChange: vi.fn()
    };
    const client = createHotjarClient({
      sdk,
      getConfig: () => null
    });

    expect(client.event("pricing_viewed")).toBe(false);
    expect(
      client.identify({
        id: "user_1",
        plan: "free",
        isAdmin: false
      })
    ).toBe(false);
    expect(client.stateChange("/pricing")).toBe(false);
    expect(sdk.init).not.toHaveBeenCalled();
    expect(sdk.event).not.toHaveBeenCalled();
    expect(sdk.identify).not.toHaveBeenCalled();
    expect(sdk.stateChange).not.toHaveBeenCalled();
  });
});
