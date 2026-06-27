import { describe, expect, it, vi } from "vitest";
import {
  buildMixpanelProperties,
  createMixpanelForwarder
} from "./mixpanel";

describe("Mixpanel analytics adapter", () => {
  it("does not initialize the SDK without a project token", async () => {
    const init = vi.fn();
    const forwarder = createMixpanelForwarder({
      sdk: {
        init
      },
      env: {
        NODE_ENV: "test"
      }
    });

    const result = await forwarder.track({
      event: "signup_completed",
      userId: "user_1"
    });

    expect(result).toEqual({
      forwarded: false,
      reason: "not_configured"
    });
    expect(init).not.toHaveBeenCalled();
  });

  it("maps event metadata to privacy-safe Mixpanel properties", async () => {
    const track = vi.fn((eventName, properties, callback) => callback());
    const init = vi.fn(() => ({
      track
    }));
    const forwarder = createMixpanelForwarder({
      sdk: {
        init
      },
      env: {
        MIXPANEL_PROJECT_TOKEN: "project-token",
        NODE_ENV: "test"
      }
    });

    await forwarder.track({
      event: "project_created",
      userId: "user_1",
      metadata: {
        projectId: "project_1",
        projectCount: 2
      },
      user: {
        id: "user_1",
        plan: "free",
        isAdmin: false
      }
    });

    expect(init).toHaveBeenCalledWith("project-token");
    expect(track).toHaveBeenCalledWith(
      "project_created",
      expect.objectContaining({
        distinct_id: "user_1",
        event_source: "taskflow_web",
        environment: "test",
        plan: "free",
        is_admin: false,
        projectId: "project_1",
        projectCount: 2
      }),
      expect.any(Function)
    );

    const properties = buildMixpanelProperties(
      {
        event: "project_created",
        userId: "user_1",
        metadata: {
          email: "hidden@example.com",
          name: "Hidden User"
        },
        user: {
          id: "user_1",
          plan: "premium",
          isAdmin: true
        }
      },
      {
        NODE_ENV: "test"
      }
    );

    expect(properties).toMatchObject({
      distinct_id: "user_1",
      plan: "premium",
      is_admin: true
    });
    expect(properties).not.toHaveProperty("email");
    expect(properties).not.toHaveProperty("name");
  });

  it("returns an error result when Mixpanel tracking fails", async () => {
    const logger = {
      warn: vi.fn()
    };
    const error = new Error("network failed");
    const track = vi.fn((eventName, properties, callback) => callback(error));
    const forwarder = createMixpanelForwarder({
      sdk: {
        init: vi.fn(() => ({
          track
        }))
      },
      env: {
        MIXPANEL_PROJECT_TOKEN: "project-token",
        NODE_ENV: "test"
      },
      logger
    });

    const result = await forwarder.track({
      event: "task_created",
      userId: "user_1"
    });

    expect(result).toEqual({
      forwarded: false,
      reason: "error",
      error
    });
    expect(logger.warn).toHaveBeenCalledWith("Mixpanel event failed", error);
  });
});
