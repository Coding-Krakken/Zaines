/**
 * Agent Dispatcher
 *
 * Dispatches next agent via code chat CLI with handoff context
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { AgentId, HandoffCommentData, WorkItemContext } from "./types";
import { logError, logInfo } from "./logger";

const execFileAsync = promisify(execFile);

export interface DispatchConfig {
  codeCommand?: string; // 'code' or 'code-oss'
  timeout?: number; // milliseconds
  dryRun?: boolean;
}

export interface DispatchResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  error?: string;
}

export class AgentDispatcher {
  private readonly config: DispatchConfig;

  constructor(config: Partial<DispatchConfig> = {}) {
    this.config = {
      codeCommand: config.codeCommand ?? this.detectCodeCommand(),
      timeout: config.timeout ?? 300000, // 5 minutes
      dryRun: config.dryRun ?? process.env["SUBZERO_DISPATCH_DRY_RUN"] === "1",
    };
  }

  /**
   * Dispatch next agent via code chat
   *
   * This is MANDATORY - both posting the handoff comment AND dispatching the agent must succeed.
   */
  async dispatch(
    nextAgent: AgentId,
    context: WorkItemContext,
    handoffCommentUrl: string,
    extraInstructions?: string,
  ): Promise<DispatchResult> {
    // Build strict prompt
    const prompt = this.buildPrompt(
      context,
      handoffCommentUrl,
      extraInstructions,
    );

    // Get repository path
    const repoPath = process.cwd();

    // Build command
    const args = ["chat", "-m", nextAgent, "--add-file", repoPath];

    // Add prompt as final argument
    args.push(prompt);

    // Execute
    if (this.config.dryRun) {
      logInfo("[DRY RUN] Would dispatch agent:");
      logInfo(`  Agent: ${nextAgent}`);
      logInfo(`  Command: ${this.config.codeCommand} ${args.join(" ")}`);
      logInfo(`  Prompt: ${prompt}`);

      return {
        success: true,
        stdout: "[DRY RUN] Simulated dispatch success",
      };
    }

    try {
      const { stdout, stderr } = await execFileAsync(
        this.config.codeCommand!,
        args,
        {
          timeout: this.config.timeout,
          windowsHide: true,
          cwd: repoPath,
        },
      );

      logInfo(`✅ Successfully dispatched to ${nextAgent}`);
      logInfo(`   Handoff: ${handoffCommentUrl}`);

      return {
        success: true,
        stdout: stdout.toString(),
        stderr: stderr.toString(),
      };
    } catch (error) {
      const err = error as {
        stdout?: string;
        stderr?: string;
        message?: string;
        code?: string;
      };

      logError(`❌ Failed to dispatch to ${nextAgent}`);
      logError(`   Error: ${err.message}`);
      logError(`   Stderr: ${err.stderr || "N/A"}`);

      return {
        success: false,
        stdout: err.stdout?.toString(),
        stderr: err.stderr?.toString(),
        error: err.message || `Dispatch failed with code ${err.code}`,
      };
    }
  }

  /**
   * Build strict prompt for next agent
   *
   * The prompt MUST include:
   * - Handoff comment URL
   * - Explicit instruction to read it
   * - Explicit instruction to post their own handoff before dispatching again
   */
  private buildPrompt(
    context: WorkItemContext,
    handoffCommentUrl: string,
    extraInstructions?: string,
  ): string {
    const parts = [
      `📋 HANDOFF RECEIVED`,
      ``,
      `Work Item: Issue #${context.issueNumber}${context.prNumber ? ` | PR #${context.prNumber}` : ""}`,
      `Branch: ${context.branchName}`,
      ``,
      `🔗 READ THIS HANDOFF FIRST:`,
      handoffCommentUrl,
      ``,
      `✅ MANDATORY INSTRUCTIONS:`,
      `1. Open the handoff comment URL above and READ IT COMPLETELY`,
      `2. Quote the "Handoff:" title line to confirm you read it`,
      `3. Complete ALL items in the "Next Actions" checklist`,
      `4. Before dispatching to the next agent, you MUST:`,
      `   - Post your own handoff comment using the handoff template`,
      `   - Include the comment URL in your dispatch`,
      ``,
      `📦 Repository: ${context.repo}`,
      `🔧 Your role: Execute the next actions from the handoff`,
      ``,
    ];

    if (extraInstructions) {
      parts.push(`📝 Additional Context:`);
      parts.push(extraInstructions);
      parts.push(``);
    }

    parts.push(
      `⚠️  CRITICAL: If you encounter blockers, post a "Blocked" handoff and dispatch to the appropriate escalation path.`,
    );
    parts.push(``);
    parts.push(`Begin work now.`);

    return parts.join("\n");
  }

  /**
   * Detect which VS Code command is available
   */
  private detectCodeCommand(): string {
    // Check environment variable first
    if (process.env["SUBZERO_CODE_COMMAND"]) {
      return process.env["SUBZERO_CODE_COMMAND"];
    }

    // Default to 'code' (most common)
    return "code";
  }

  /**
   * Validate that code command is available
   */
  async validateCodeCommand(): Promise<boolean> {
    try {
      await execFileAsync(this.config.codeCommand!, ["--version"], {
        timeout: 5000,
        windowsHide: true,
      });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Default singleton instance
 */
export const defaultAgentDispatcher = new AgentDispatcher();

interface HandoffProvider {
  postHandoff(
    context: WorkItemContext,
    data: HandoffCommentData,
  ): Promise<{ commentUrl: string }>;
}

/**
 * High-level helper: Post handoff + Dispatch (BOTH MANDATORY)
 *
 * This enforces the non-negotiable requirement: posting a handoff comment AND
 * dispatching the next agent must BOTH succeed. If either fails, the whole operation fails.
 */
export async function postHandoffAndDispatch(
  handoffProvider: HandoffProvider,
  dispatcher: AgentDispatcher,
  context: WorkItemContext,
  handoffData: HandoffCommentData,
  extraInstructions?: string,
): Promise<{ commentUrl: string; dispatchResult: DispatchResult }> {
  // Step 1: Post handoff comment (MANDATORY)
  logInfo(
    `📤 Posting handoff comment for ${context.agent} → ${handoffData.nextAgent}`,
  );
  const { commentUrl } = await handoffProvider.postHandoff(
    context,
    handoffData,
  );

  // Step 2: Dispatch next agent (MANDATORY)
  logInfo(`📨 Dispatching to ${handoffData.nextAgent}`);
  const dispatchResult = await dispatcher.dispatch(
    handoffData.nextAgent,
    context,
    commentUrl,
    extraInstructions,
  );

  // Both must succeed
  if (!dispatchResult.success) {
    throw new Error(
      `Dispatch failed after handoff was posted. Handoff: ${commentUrl}. Error: ${dispatchResult.error}`,
    );
  }

  logInfo(
    `✅ Handoff complete: ${context.agent} → ${handoffData.nextAgent}`,
  );
  logInfo(`   Comment: ${commentUrl}`);

  return { commentUrl, dispatchResult };
}
