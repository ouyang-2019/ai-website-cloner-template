"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Check, Plug, Plus, Loader2, AlertCircle } from "lucide-react";
import {
  type AgentTool,
  type McpRemoteTool,
  installMcpTool,
  listAgentMcpTools,
  setAgentToolEnabled,
  testMcpServer,
} from "@/lib/mcp";

interface Props {
  open: boolean;
  agentId: string;
  onClose: () => void;
}

/**
 * MCP 选择器 — 像 skills 一样按 agent 勾选挂载，外加「安装」流程。
 * 安装：填 server URL/key → 测试连接列工具 → 勾选安装。挂载：toggle 启用/停用。
 * 全部对接后端既有 `/tools` API；后端不可用时退化为空态（不抛断 UI）。
 */
export function AgentMcpPicker({ open, agentId, onClose }: Props) {
  const [tab, setTab] = useState<"mounted" | "install">("mounted");
  const [tools, setTools] = useState<AgentTool[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // 安装表单
  const [serverName, setServerName] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [discovered, setDiscovered] = useState<McpRemoteTool[] | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    if (!agentId) return;
    setLoading(true);
    listAgentMcpTools(agentId)
      .then(setTools)
      .catch(() => setTools([]))
      .finally(() => setLoading(false));
  }, [agentId]);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  if (!open) return null;

  const toggle = async (t: AgentTool) => {
    setBusyId(t.id);
    try {
      await setAgentToolEnabled(agentId, t.id, !t.enabled);
      setTools((prev) => prev.map((x) => (x.id === t.id ? { ...x, enabled: !x.enabled } : x)));
    } catch {
      setError("更新挂载状态失败");
    } finally {
      setBusyId(null);
    }
  };

  const test = async () => {
    setError("");
    setDiscovered(null);
    if (!serverUrl.trim()) {
      setError("请填写 MCP server URL");
      return;
    }
    setTesting(true);
    try {
      const res = await testMcpServer(serverUrl.trim(), apiKey.trim() || undefined);
      if (res.ok && res.tools) {
        setDiscovered(res.tools);
        if (!serverName.trim()) {
          try {
            setServerName(new URL(serverUrl.trim()).hostname);
          } catch {
            setServerName("mcp-server");
          }
        }
      } else {
        setError(res.error || "连接失败");
      }
    } catch {
      setError("连接失败（后端不可用或鉴权失败）");
    } finally {
      setTesting(false);
    }
  };

  const install = async (tool: McpRemoteTool) => {
    setInstalling(tool.name);
    setError("");
    const sName = serverName.trim() || "mcp-server";
    try {
      await installMcpTool({ serverName: sName, serverUrl: serverUrl.trim(), tool });
      // 安装后即为该 agent 启用挂载（按 display_name + server 名匹配新建工具）
      const fresh = await listAgentMcpTools(agentId);
      const created = fresh.find(
        (t) => t.display_name === tool.name && (t.mcp_server_name || "") === sName,
      );
      if (created) await setAgentToolEnabled(agentId, created.id, true);
      setTools(fresh);
      setTab("mounted");
    } catch {
      setError("安装失败（需要管理员权限或工具已存在）");
    } finally {
      setInstalling(null);
    }
  };

  const mountedCount = tools.filter((t) => t.enabled).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-full max-w-[680px] flex-col overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tabs + close */}
        <div className="flex items-center justify-between border-b border-[var(--neutral-grey200)] px-4 py-3">
          <div className="inline-flex items-center gap-1 rounded-lg bg-[var(--neutral-grey60)] p-0.5">
            <button
              type="button"
              onClick={() => setTab("mounted")}
              className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[12px] transition-colors ${
                tab === "mounted" ? "bg-white text-[var(--brand-brand01-black)] shadow-sm" : "text-[var(--text-icon-text-4)]"
              }`}
            >
              <Plug className="h-3.5 w-3.5" /> 已挂载 MCP（{mountedCount}）
            </button>
            <button
              type="button"
              onClick={() => setTab("install")}
              className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[12px] transition-colors ${
                tab === "install" ? "bg-white text-[var(--brand-brand01-black)] shadow-sm" : "text-[var(--text-icon-text-4)]"
              }`}
            >
              <Plus className="h-3.5 w-3.5" /> 安装 MCP
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-icon-text-4)] hover:text-[var(--text-icon-text-2)]"
            aria-label="关闭"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 border-b border-[var(--neutral-grey200)] bg-red-50 px-4 py-2 text-[12px] text-red-600">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
          </div>
        )}

        {tab === "mounted" ? (
          <div className="flex-1 overflow-y-auto p-3">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-[var(--text-icon-text-4)]">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : tools.length === 0 ? (
              <div className="py-10 text-center text-[12px] text-[var(--text-icon-text-4)]">
                还没有 MCP 工具。切到「安装 MCP」添加一个 server。
              </div>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {tools.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--neutral-grey200)] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium text-[var(--brand-brand01-black)]">
                        {t.display_name || t.name}
                      </div>
                      <div className="truncate text-[11px] text-[var(--text-icon-text-4)]">
                        {t.mcp_server_name ? `${t.mcp_server_name} · ` : ""}
                        {t.description || "MCP 工具"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggle(t)}
                      disabled={busyId === t.id}
                      className={`ml-3 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                        t.enabled ? "bg-[var(--brand-brand03-blue)]" : "bg-[var(--neutral-grey300)]"
                      }`}
                      aria-pressed={t.enabled}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                          t.enabled ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-2">
              <input
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder="名称（可选，如 weather）"
                className="h-9 w-full rounded-lg border border-[var(--neutral-grey300)] bg-white px-3 text-[12px] outline-none focus:border-[var(--brand-brand03-blue)]"
              />
              <input
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="MCP server URL（https://…/sse 或 /mcp）"
                className="h-9 w-full rounded-lg border border-[var(--neutral-grey300)] bg-white px-3 text-[12px] outline-none focus:border-[var(--brand-brand03-blue)]"
              />
              <input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="API Key（可选，Bearer）"
                type="password"
                className="h-9 w-full rounded-lg border border-[var(--neutral-grey300)] bg-white px-3 text-[12px] outline-none focus:border-[var(--brand-brand03-blue)]"
              />
              <button
                type="button"
                onClick={test}
                disabled={testing}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[var(--brand-brand01-black)] px-4 text-[12px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
                测试连接并列出工具
              </button>
            </div>

            {discovered && (
              <div className="mt-3">
                <div className="mb-1.5 text-[11px] text-[var(--text-icon-text-4)]">
                  发现 {discovered.length} 个工具 · 点「安装」挂载到本智能体
                </div>
                <ul className="flex flex-col gap-1.5">
                  {discovered.map((tool) => (
                    <li
                      key={tool.name}
                      className="flex items-center justify-between rounded-lg border border-[var(--neutral-grey200)] px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-medium text-[var(--brand-brand01-black)]">{tool.name}</div>
                        <div className="truncate text-[11px] text-[var(--text-icon-text-4)]">{tool.description || "—"}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => install(tool)}
                        disabled={installing === tool.name}
                        className="ml-3 inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-[var(--brand-brand03-blue)] px-3 text-[12px] font-medium text-[var(--brand-brand03-blue)] transition-colors hover:bg-blue-50 disabled:opacity-60"
                      >
                        {installing === tool.name ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        安装
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
