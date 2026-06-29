"use client";

import { apiFetch } from "@/lib/api";

/**
 * MCP 工具客户端 — 对接后端既有 `/tools` API（substrate）。
 * 安装：test-mcp 列工具 → POST /tools 建工具；按 agent：GET/PUT /tools/agents/{id}。
 * 与 skills 同范式：失败由调用方 catch 并退化（不抛断 UI）。
 */

export interface McpRemoteTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface McpTestResult {
  ok: boolean;
  tools?: McpRemoteTool[];
  error?: string;
}

export interface AgentTool {
  id: string;
  name: string;
  display_name: string;
  description: string;
  type: string;
  category: string;
  icon: string;
  enabled: boolean;
  mcp_server_name?: string | null;
  mcp_server_url?: string | null;
  source: string;
}

export interface AgentSummary {
  id: string;
  name: string;
  status?: string;
}

/** 取真实智能体列表（UUID）—— 供 MCP picker 在非 UUID 路由下选定真 agent。 */
export async function listAgents(): Promise<AgentSummary[]> {
  const res = await apiFetch<AgentSummary[] | { items: AgentSummary[] }>("/agents?page=1&size=200");
  return Array.isArray(res) ? res : res.items ?? [];
}

/** 是否为合法 UUID（决定 picker 直接用路由 id 还是弹出 agent 选择器）。 */
export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/** 测试连接一个 MCP server 并列出其工具（不落库）。 */
export function testMcpServer(serverUrl: string, apiKey?: string): Promise<McpTestResult> {
  return apiFetch<McpTestResult>("/tools/test-mcp", {
    method: "POST",
    body: JSON.stringify({ server_url: serverUrl, api_key: apiKey || null }),
  });
}

/** 取某 agent 可见的工具（含启用态）。 */
export function listAgentTools(agentId: string): Promise<AgentTool[]> {
  return apiFetch<AgentTool[]>(`/tools/agents/${agentId}`);
}

/** 仅 MCP 类型的 agent 工具。 */
export function listAgentMcpTools(agentId: string): Promise<AgentTool[]> {
  return listAgentTools(agentId).then((tools) => tools.filter((t) => t.type === "mcp"));
}

/** 按 agent 勾选/取消挂载一个工具。 */
export function setAgentToolEnabled(
  agentId: string,
  toolId: string,
  enabled: boolean,
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/tools/agents/${agentId}`, {
    method: "PUT",
    body: JSON.stringify([{ tool_id: toolId, enabled }]),
  });
}

export interface InstallMcpToolInput {
  serverName: string;
  serverUrl: string;
  tool: McpRemoteTool;
}

/** 把一个发现到的 MCP 远端工具安装为平台工具（admin，落 tenant 作用域）。 */
export function installMcpTool(input: InstallMcpToolInput): Promise<{ id: string; name: string }> {
  const safeServer = input.serverName.replace(/[^A-Za-z0-9_-]/g, "_") || "server";
  return apiFetch<{ id: string; name: string }>("/tools", {
    method: "POST",
    body: JSON.stringify({
      name: `mcp_${safeServer}_${input.tool.name}`,
      display_name: input.tool.name,
      description: input.tool.description || "",
      type: "mcp",
      category: "mcp",
      icon: "🔌",
      parameters_schema: input.tool.inputSchema || {},
      mcp_server_url: input.serverUrl,
      mcp_server_name: input.serverName,
      mcp_tool_name: input.tool.name,
    }),
  });
}
