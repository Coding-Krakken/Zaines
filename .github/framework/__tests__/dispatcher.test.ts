/**
 * Tests for Agent Dispatcher
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { AgentDispatcher, postHandoffAndDispatch } from "../dispatcher";
import type { WorkItemContext } from "../types";

describe("AgentDispatcher", () => {
  let dispatcher: AgentDispatcher;
  let mockContext: WorkItemContext;

  beforeEach(() => {
    dispatcher = new AgentDispatcher({ dryRun: true });

    mockContext = {
      repo: "owner/repo",
      issueNumber: 42,
      prNumber: 123,
      branchName: "feature/42-test-feature",
      agent: "frontend-engineer" as any,
      nextAgent: "backend-engineer" as any,
    };
  });

  describe("dispatch", () => {
    it("should dispatch in dry-run mode", async () => {
      const result = await dispatcher.dispatch(
        "backend-engineer" as any,
        mockContext,
        "https://github.com/owner/repo/pull/123#issuecomment-123456",
        "Additional context here",
      );

      expect(result.success).toBe(true);
      expect(result.stdout).toContain("[DRY RUN]");
    });

    it("should build prompt with handoff URL", async () => {
      const handoffUrl =
        "https://github.com/owner/repo/pull/123#issuecomment-123456";

      // Access private method for testing
      const prompt = dispatcher["buildPrompt"](
        mockContext,
        handoffUrl,
        undefined,
      );

      expect(prompt).toContain(handoffUrl);
      expect(prompt).toContain("READ THIS HANDOFF FIRST");
      expect(prompt).toContain("MANDATORY INSTRUCTIONS");
      expect(prompt).toContain("Issue #42");
      expect(prompt).toContain("PR #123");
    });

    it("should include extra instructions in prompt", async () => {
      const handoffUrl =
        "https://github.com/owner/repo/pull/123#issuecomment-123456";
      const extraInstructions = "Focus on API integration";

      const prompt = dispatcher["buildPrompt"](
        mockContext,
        handoffUrl,
        extraInstructions,
      );

      expect(prompt).toContain("Additional Context");
      expect(prompt).toContain(extraInstructions);
    });

    it("should include mandatory steps in prompt", async () => {
      const handoffUrl =
        "https://github.com/owner/repo/pull/123#issuecomment-123456";
      const prompt = dispatcher["buildPrompt"](mockContext, handoffUrl);

      expect(prompt).toContain('Quote the "Handoff:" title line');
      expect(prompt).toContain('Complete ALL items in the "Next Actions"');
      expect(prompt).toContain("Post your own handoff comment");
      expect(prompt).toContain("Include the comment URL in your dispatch");
    });

    it("should include blocker handling instructions", async () => {
      const handoffUrl =
        "https://github.com/owner/repo/pull/123#issuecomment-123456";
      const prompt = dispatcher["buildPrompt"](mockContext, handoffUrl);

      expect(prompt).toContain("If you encounter blockers");
      expect(prompt).toContain('post a "Blocked" handoff');
    });
  });

  describe("validateCodeCommand", () => {
    it("should validate code command availability", async () => {
      // This test will depend on whether 'code' is installed
      // In dry-run mode or CI, we can skip this or mock it
      const isValid = await dispatcher.validateCodeCommand();

      // In dry-run test environment, we don't enforce validation
      expect(typeof isValid).toBe("boolean");
    });
  });

  describe("code command detection", () => {
    it("should use SUBZERO_CODE_COMMAND if set", () => {
      process.env.SUBZERO_CODE_COMMAND = "code-insiders";
      const customDispatcher = new AgentDispatcher({ dryRun: true });

      expect(customDispatcher["config"].codeCommand).toBe("code-insiders");

      delete process.env.SUBZERO_CODE_COMMAND;
    });

    it('should default to "code" command', () => {
      const defaultDispatcher = new AgentDispatcher({ dryRun: true });

      expect(defaultDispatcher["config"].codeCommand).toBe("code");
    });
  });
});

describe("postHandoffAndDispatch", () => {
  it("should enforce both handoff posting and dispatch", async () => {
    // Mock providers
    const mockHandoffProvider = {
      postHandoff: jest.fn().mockResolvedValue({
        commentUrl:
          "https://github.com/owner/repo/pull/123#issuecomment-123456",
        commentId: 123456,
      }),
    };

    const mockDispatcher = new AgentDispatcher({ dryRun: true });

    const mockContext: WorkItemContext = {
      repo: "owner/repo",
      issueNumber: 42,
      prNumber: 123,
      branchName: "feature/42-test",
      agent: "frontend-engineer" as any,
      nextAgent: "backend-engineer" as any,
    };

    const mockHandoffData = {
      agent: "frontend-engineer" as any,
      workItem: { issueNumber: 42, prNumber: 123 },
      status: "Done" as any,
      scopeCompleted: ["Task completed"],
      keyDecisions: [],
      changesSummary: {
        filesChanged: 3,
        linesAdded: 100,
        linesRemoved: 20,
        notableFiles: [],
        commits: [],
      },
      verification: {
        commandsRun: [],
        expectedOutcome: [],
        actualOutcome: [],
        status: "Passed" as any,
      },
      risks: [],
      followUps: [],
      nextAgent: "backend-engineer" as any,
      nextActions: ["Review code", "Test changes"],
      links: {},
    };

    const result = await postHandoffAndDispatch(
      mockHandoffProvider,
      mockDispatcher,
      mockContext,
      mockHandoffData,
    );

    expect(result.commentUrl).toBeDefined();
    expect(result.dispatchResult.success).toBe(true);
    expect(mockHandoffProvider.postHandoff).toHaveBeenCalledWith(
      mockContext,
      mockHandoffData,
    );
  });

  it("should throw if dispatch fails after handoff is posted", async () => {
    const mockHandoffProvider = {
      postHandoff: jest.fn().mockResolvedValue({
        commentUrl:
          "https://github.com/owner/repo/pull/123#issuecomment-123456",
        commentId: 123456,
      }),
    };

    // Mock a failing dispatcher
    const mockDispatcher = {
      dispatch: jest.fn().mockResolvedValue({
        success: false,
        error: "Dispatch failed",
      }),
    };

    const mockContext: WorkItemContext = {
      repo: "owner/repo",
      issueNumber: 42,
      branchName: "feature/42-test",
      agent: "frontend-engineer" as any,
    };

    const mockHandoffData = {
      agent: "frontend-engineer" as any,
      workItem: { issueNumber: 42 },
      status: "Done" as any,
      scopeCompleted: [],
      keyDecisions: [],
      changesSummary: {
        filesChanged: 0,
        linesAdded: 0,
        linesRemoved: 0,
        notableFiles: [],
        commits: [],
      },
      verification: {
        commandsRun: [],
        expectedOutcome: [],
        actualOutcome: [],
        status: "Passed" as any,
      },
      risks: [],
      followUps: [],
      nextAgent: "backend-engineer" as any,
      nextActions: [],
      links: {},
    };

    await expect(
      postHandoffAndDispatch(
        mockHandoffProvider,
        mockDispatcher,
        mockContext,
        mockHandoffData,
      ),
    ).rejects.toThrow("Dispatch failed after handoff was posted");
  });
});
