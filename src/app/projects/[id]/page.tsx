"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquarePlus, Sparkles, Bot } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ChatComposer, type ComposerSubmitPayload } from "@/components/chat-composer";
import { PptConfig } from "@/components/ppt-config";
import { SessionActionsMenu } from "@/components/session-actions-menu";
import { MessageBubble } from "@/components/message-bubble";
import { ArtifactCanvas } from "@/components/artifact-canvas";
import { ArtifactHistory } from "@/components/artifact-history";
import { useCredits } from "@/components/credits/credits-provider";
import { CreditLockPanel } from "@/components/credits/credit-lock-panel";
import { getAgentBillingMode, getAgentRunCost, getTaskCost } from "@/lib/credits";
import { categoryMeta, getAgentById } from "@/lib/agents";
import { apiFetch, estimateCredits, openSse } from "@/lib/api";
import { takeComposerDraft, type ComposerDraft } from "@/lib/composer-draft";
import { PROJECTS, SEED_SESSIONS, SEED_MESSAGES, SEED_ARTIFACTS, getProject, type Project } from "@/data/projects";
import { TEMPLATE_CARDS } from "@/data/content";
import { DEFAULT_MODEL_ID } from "@/data/models";
import type { ChatSession, ChatMessage, ComposerAttachment, ArtifactType } from "@/types";
import type { AgentCapability, CreditEstimate, TaskComplexity } from "@/types/credits";

const CHAT_COST = getTaskCost("chat", "standard");
const PPT_SKILL_COST = getTaskCost("artifact-publish", "heavy");
const ENABLE_MOCK_SSE = process.env.NEXT_PUBLIC_AUBEAU_ENABLE_MOCK_SSE === "true";

/** mock 流式：根据输入生成 markdown 富文本（演示 markdown 渲染）。 */
function buildMockReply(text: string, cost: number, hasPpt: boolean): string {
  const headline = hasPpt ? "演示文稿已生成" : "任务编排完成";
  return `## ${headline}

已收到你的需求：「${text}」。我完成了**记忆检索**、**工具调用**与**结果编排**。

### 执行摘要
- ✅ 检索长期记忆与项目上下文
- ✅ 调用 \`web_search\` / \`memory_recall\` 工具
- ✅ 生成结构化结果并发布为工件

### 产出概览

| 维度 | 结果 |
|---|---|
| 工具调用 | 2 次（记忆检索 + 网络检索） |
| 预计消耗 | ${cost} 积分 |
| 工件类型 | ${hasPpt ? "PPT 演示文稿" : "结构化文档"} |

> 点击下方工件卡片，可在右侧画布实时查看完整产物。`;
}

function mockArtifactTitle(text: string, hasPpt: boolean): string {
  const head = text.slice(0, 16).trim();
  return hasPpt ? `${head || "主题"}·演示文稿` : `${head || "任务"}·结果文档`;
}

/** 从流式文本提取 HTML 代码块（```html ... ```）或裸 HTML，用于画布实时同步渲染。 */
function extractHtmlBlock(text: string): string {
  const m = text.match(/```(?:html)?\s*\n([\s\S]*?)```/);
  if (m && m[1].trim()) return m[1].trim();
  const trimmed = text.trim();
  if (/^<(!doctype|html|body|div|section)/i.test(trimmed)) return trimmed;
  return "";
}

/** mock 流式画布演示 HTML（simulateStream 中段注入，演示「边生成边渲染」同步效果）。 */
const DEMO_STREAM_HTML = `<!doctype html><html lang="zh"><head><meta charset="utf-8"><style>
  body{margin:0;font-family:-apple-system,"PingFang SC",system-ui,sans-serif;background:linear-gradient(135deg,#ecfdf5,#f0fdfa);color:#0f172a;padding:28px}
  .hd{display:flex;align-items:center;gap:12px;margin-bottom:18px}
  .b{width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#10b981,#34d399);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700}
  h1{font-size:19px;margin:0}.s{color:#64748b;font-size:12px;margin-top:2px}
  .pulse{display:inline-block;width:7px;height:7px;border-radius:50%;background:#10b981;animation:p 1s infinite;margin-right:6px;vertical-align:middle}
  @keyframes p{0%,100%{opacity:.3}50%{opacity:1}}
  .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
  .card{background:#fff;border-radius:12px;padding:14px;box-shadow:0 4px 12px rgba(16,185,129,.08)}
  .card h3{margin:0 0 5px;font-size:13px;color:#047857}.card p{margin:0;font-size:11px;color:#64748b;line-height:1.5}
</style></head><body>
  <div class="hd"><div class="b">🎨</div><div><h1>翡翠主题落地页</h1><div class="s"><span class="pulse"></span>AI 正在生成 · 流式渲染中</div></div></div>
  <div class="grid">
    <div class="card"><h3>响应式布局</h3><p>移动端自适应栅格</p></div>
    <div class="card"><h3>玻璃拟态</h3><p>翡翠青绿 + 毛玻璃</p></div>
    <div class="card"><h3>实时同步</h3><p>对话与画布联动</p></div>
    <div class="card"><h3>sandbox 渲染</h3><p>最严格沙箱隔离</p></div>
  </div>
</body></html>`;

/** 判定会话是否匹配当前项目（兼容后端返回与本地种子）。 */
function belongsTo(s: ChatSession, pid: string) {
  return (s.projectId ?? "") === pid;
}

function localCreditLock(
  cost: number,
  available: number,
  feature: string,
  capability: AgentCapability = "chat",
  complexity: TaskComplexity = "standard",
): CreditEstimate {
  return {
    allowed: false,
    lock: true,
    verdict: "blocked",
    low: cost,
    high: cost,
    unavailable: false,
    available,
    balance: available,
    reachableRounds: 0,
    topupNeeded: Math.max(0, cost - available),
    shortfall: Math.max(0, cost - available),
    capability,
    complexity,
    note: `${feature} 积分不足，请先充值或升级订阅。`,
    rechargeUrl: "/pricing?intent=recharge",
    upgradeUrl: "/pricing?intent=upgrade",
  };
}

export default function ProjectWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ agent?: string; skill?: string }>;
}) {
  const { id: projectId } = use(params);
  const query = use(searchParams);
  const { spend, refund, balance, showToast } = useCredits();

  const [project, setProject] = useState<Project | undefined>(() => getProject(projectId));
  const [sessions, setSessions] = useState<ChatSession[]>(() => SEED_SESSIONS.filter((s) => belongsTo(s, projectId)));
  const [activeId, setActiveId] = useState<string>("");
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [sending, setSending] = useState(false);
  const [creditLock, setCreditLock] = useState<CreditEstimate | null>(null);
  /** 正在流式生成的 assistant 消息 id（驱动 MessageBubble streaming 态）。 */
  const [streamingId, setStreamingId] = useState<string | null>(null);
  /** 同步画布显隐 + 当前聚焦工件。 */
  const [canvasOpen, setCanvasOpen] = useState(false);
  const [activeArtifactId, setActiveArtifactId] = useState<string>("");
  /** 流式画布同步：累积 text（提取 HTML 块用）+ 实时 HTML（画布优先渲染）。 */
  const [streamingHtml, setStreamingHtml] = useState<string>("");
  const streamTextRef = useRef<string>("");
  const streamTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 跨页挂载草稿（首页 Hero 携带，取出即删，一次性）。
  const [draft] = useState<ComposerDraft | null>(() => takeComposerDraft());

  // 挂载态：默认空白；仅当草稿或 ?agent= 带入时才挂载。用户在对话框选定后即锁定（对标）。
  const queryAgent = query.agent ? Number(query.agent) : NaN;
  const [mountedAgent, setMountedAgent] = useState<number | null>(
    () => draft?.mountedAgent ?? (Number.isFinite(queryAgent) && queryAgent > 0 ? queryAgent : null),
  );
  const agentLocked = mountedAgent !== null;
  const [mountedSkills, setMountedSkills] = useState<string[]>(
    () =>
      draft?.skills ??
      (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("skill") === "ppt"
        ? ["ppt"]
        : []),
  );
  const [attachments, setAttachments] = useState<ComposerAttachment[]>(() => draft?.attachments ?? []);
  const [model, setModel] = useState<string>(() => draft?.model ?? DEFAULT_MODEL_ID);
  const [target, setTarget] = useState<string>(() => draft?.target ?? "");
  const scrollRef = useRef<HTMLDivElement>(null);

  // PPT 技能上下文配置（仅当挂载 ppt 技能时显示，模板默认「智选」）。
  const [pptPages, setPptPages] = useState<number>(9);
  const [pptSize, setPptSize] = useState<string>("wide");
  const [pptTpl, setPptTpl] = useState<string>("auto");
  const hasPpt = mountedSkills.includes("ppt");

  // 拉项目详情 + 会话列表（后端不可用回落种子）。
  useEffect(() => {
    apiFetch<Project>(`/projects/${projectId}`)
      .then(setProject)
      .catch(() => setProject(getProject(projectId)));
    apiFetch<ChatSession[]>(`/chat/sessions?projectId=${projectId}`)
      .then((list) => setSessions(list.filter((s) => belongsTo(s, projectId))))
      .catch(() => setSessions(SEED_SESSIONS.filter((s) => belongsTo(s, projectId))));
  }, [projectId]);

  const activeSessionId =
    activeId && sessions.some((s) => s.id === activeId)
      ? activeId
      : (sessions.find((s) => !s.archived)?.id ?? sessions[0]?.id ?? "");

  // 选中会话时加载消息（后端不可用回落种子）。
  useEffect(() => {
    if (!activeSessionId || messages[activeSessionId]) return;
    const sid = activeSessionId;
    apiFetch<ChatMessage[]>(`/chat/sessions/${sid}/messages`)
      .then((list) => setMessages((prev) => ({ ...prev, [sid]: list })))
      .catch(() => setMessages((prev) => ({ ...prev, [sid]: SEED_MESSAGES[sid] ?? [] })));
  }, [activeSessionId, messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [activeSessionId, messages]);

  const activeMessages = messages[activeSessionId] ?? [];
  const agentCard = mountedAgent !== null ? getAgentById(mountedAgent) ?? TEMPLATE_CARDS[mountedAgent - 1] : null;
  const moveTargets = useMemo(() => PROJECTS.filter((p) => p.id !== projectId).map((p) => ({ id: p.id, name: p.name })), [projectId]);

  /** 当前会话所有消息的工件聚合（驱动画布工件列表，切会话自动跟随）。 */
  const sessionArtifacts = useMemo(
    () => activeMessages.flatMap((m) => m.artifacts ?? []),
    [activeMessages],
  );

  /** 项目级工件聚合（所有已加载会话的 artifacts + 来源会话标题），供工件历史侧栏。 */
  const projectArtifacts = useMemo(
    () =>
      Object.entries(messages).flatMap(([sid, msgs]) => {
        const sessionTitle = sessions.find((s) => s.id === sid)?.title ?? "会话";
        return msgs.flatMap((m) => (m.artifacts ?? []).map((a) => ({ ...a, sessionTitle })));
      }),
    [messages, sessions],
  );

  // 切换会话/工件集变化时，重置聚焦工件为最新的那个。
  useEffect(() => {
    if (sessionArtifacts.length === 0) {
      if (activeArtifactId) setActiveArtifactId("");
      return;
    }
    if (!sessionArtifacts.some((a) => a.artifactId === activeArtifactId)) {
      setActiveArtifactId(sessionArtifacts[sessionArtifacts.length - 1].artifactId);
    }
  }, [sessionArtifacts, activeArtifactId]);

  const patchMessage = useCallback((sid: string, id: string, fn: (m: ChatMessage) => ChatMessage) => {
    setMessages((prev) => ({
      ...prev,
      [sid]: (prev[sid] ?? []).map((m) => (m.id === id ? fn(m) : m)),
    }));
  }, []);

  /** 推进思考时间线（同步骤只更新 pct，不同步骤追加）。 */
  const pushReasoning = useCallback((sid: string, msgId: string, step: string, pct: number) => {
    setMessages((prev) => ({
      ...prev,
      [sid]: (prev[sid] ?? []).map((m) => {
        if (m.id !== msgId) return m;
        const reasoning = m.reasoning ?? [];
        const last = reasoning[reasoning.length - 1];
        if (last && last.step === step) {
          const next = reasoning.slice();
          next[next.length - 1] = { step, pct: Math.max(last.pct, pct) };
          return { ...m, reasoning: next };
        }
        return { ...m, reasoning: [...reasoning, { step, pct }] };
      }),
    }));
  }, []);

  /** 把消息里所有 running 工具置 done。 */
  const settleTools = useCallback((sid: string, msgId: string) => {
    setMessages((prev) => ({
      ...prev,
      [sid]: (prev[sid] ?? []).map((m) =>
        m.id !== msgId
          ? m
          : {
              ...m,
              toolCalls: (m.toolCalls ?? []).map((t) => (t.status === "running" ? { ...t, status: "done" as const } : t)),
            },
      ),
    }));
  }, []);

  /** 流式收尾：工具置 done、思考末步补满 100%、清除 streamingId。 */
  const finalizeAssistant = useCallback(
    (sid: string, msgId: string) => {
      settleTools(sid, msgId);
      setMessages((prev) => ({
        ...prev,
        [sid]: (prev[sid] ?? []).map((m) => {
          if (m.id !== msgId || !m.reasoning || m.reasoning.length === 0) return m;
          const next = m.reasoning.slice();
          next[next.length - 1] = { ...next[next.length - 1], pct: 100 };
          return { ...m, reasoning: next };
        }),
      }));
      setStreamingHtml("");
      streamTextRef.current = "";
      setStreamingId(null);
      setSending(false);
    },
    [settleTools],
  );

  /** 后端不可用时：逐 token 模拟流式 + 思考时间线 + 工具芯片 + 演示工件。 */
  const simulateStream = useCallback(
    (sid: string, assistantId: string, payload: ComposerSubmitPayload, cost: number) => {
      const steps = [
        { step: "正在理解任务", pct: 8 },
        { step: "检索长期记忆", pct: 26 },
        { step: "调用工具与数据源", pct: 44 },
        { step: "生成回复", pct: 70 },
        { step: "发布工件", pct: 96 },
      ];
      const pptSkill = payload.skillIds.includes("ppt");
      const full = buildMockReply(payload.text, cost, pptSkill);
      const mockId = `art-demo-${Date.now()}`;
      const mockType: ArtifactType = pptSkill ? "ppt" : "doc";
      const mockTitle = mockArtifactTitle(payload.text, pptSkill);
      const chars = Array.from(full);
      const batch = Math.max(2, Math.ceil(chars.length / 80));
      let i = 0;
      let stepIdx = 0;

      patchMessage(sid, assistantId, (m) => ({
        ...m,
        toolCalls: [
          { tool: "memory_recall", status: "running", summary: "项目记忆" },
          { tool: "web_search", status: "running", summary: "实时检索" },
        ],
      }));
      pushReasoning(sid, assistantId, steps[0].step, steps[0].pct);

      const tick = () => {
        if (i >= chars.length) {
          patchMessage(sid, assistantId, (m) => ({
            ...m,
            text: full,
            toolCalls: (m.toolCalls ?? []).map((t) => ({ ...t, status: "done" as const })),
            artifacts: [{ artifactId: mockId, type: mockType, title: mockTitle }],
          }));
          setActiveArtifactId(mockId);
          setCanvasOpen(true);
          pushReasoning(sid, assistantId, "发布工件", 100);
          finalizeAssistant(sid, assistantId);
          return;
        }
        patchMessage(sid, assistantId, (m) => ({ ...m, text: `${m.text}${chars.slice(i, i + batch).join("")}` }));
        i += batch;
        const ratio = Math.min(1, i / chars.length);
        if (ratio > 0.45) {
          patchMessage(sid, assistantId, (m) => ({
            ...m,
            toolCalls: (m.toolCalls ?? []).map((t, idx) => (idx === 0 ? { ...t, status: "done" as const } : t)),
          }));
        }
        // mock 流式画布同步演示：过半时注入演示 HTML，画布边生成边渲染。
        if (ratio > 0.5) {
          setStreamingHtml(DEMO_STREAM_HTML);
          setCanvasOpen(true);
        }
        const want = Math.min(steps.length - 1, Math.floor(ratio * steps.length));
        if (want !== stepIdx) {
          stepIdx = want;
          pushReasoning(sid, assistantId, steps[stepIdx].step, steps[stepIdx].pct);
        }
        streamTimer.current = setTimeout(tick, 26);
      };
      streamTimer.current = setTimeout(tick, 280);
    },
    [patchMessage, pushReasoning, finalizeAssistant],
  );

  const newChat = () => {
    const id = `s-${projectId}-${Date.now()}`;
    const s: ChatSession = { id, title: "新对话", projectId, updatedAt: "刚刚" };
    setSessions((prev) => [s, ...prev]);
    setActiveId(id);
    setMessages((prev) => ({ ...prev, [id]: [] }));
    setMountedSkills([]);
    setAttachments([]);
  };

  const send = async (payload: ComposerSubmitPayload) => {
    if (!activeSessionId) {
      newChat();
      return;
    }
    const hasPptSkill = payload.skillIds.includes("ppt");
    const selectedAgentId = payload.mountedAgentId ?? mountedAgent;
    const selectedAgentCard =
      selectedAgentId !== null && selectedAgentId !== undefined
        ? getAgentById(selectedAgentId) ?? TEMPLATE_CARDS[selectedAgentId - 1]
        : null;
    const selectedAgentCost = selectedAgentCard ? getAgentRunCost(selectedAgentCard) : CHAT_COST;
    const selectedBillingMode = selectedAgentCard ? getAgentBillingMode(selectedAgentCard.skillRef) : "token_metered";
    const runCost = hasPptSkill ? PPT_SKILL_COST : selectedAgentCost;
    const runCapability: AgentCapability = hasPptSkill ? "artifact-publish" : (selectedAgentCard?.capability ?? "chat");
    const runComplexity: TaskComplexity = hasPptSkill ? "heavy" : (selectedAgentCard?.complexity ?? "standard");
    const runFeature = hasPptSkill
      ? selectedAgentCard
        ? `${selectedAgentCard.title} + PPT 生成`
        : "对话 + PPT 生成"
      : (selectedAgentCard?.title ?? "对话");
    setCreditLock(null);
    setSending(true);
    if (!hasPptSkill && selectedBillingMode === "fixed_per_run") {
      if (balance < runCost) {
        setCreditLock(localCreditLock(runCost, balance, runFeature, runCapability, runComplexity));
        setSending(false);
        return;
      }
    } else {
      try {
        const estimate = await estimateCredits({
          capability: runCapability,
          complexity: runComplexity,
          model: payload.model,
          expectedRounds: 1,
        });
        if (estimate.lock || !estimate.allowed) {
          setCreditLock(estimate);
          setSending(false);
          return;
        }
      } catch {
        // Local design/demo mode may not have an authenticated backend; fall back to the existing client balance guard.
      }
    }
    if (!spend(runCost, `${runFeature} · ${project?.name ?? "项目"}`)) {
      setCreditLock(localCreditLock(runCost, balance, runFeature, runCapability, runComplexity));
      setSending(false);
      return;
    }
    const sid = activeSessionId;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", text: payload.text, createdAt: new Date().toISOString() };
    setMessages((prev) => ({ ...prev, [sid]: [...(prev[sid] ?? []), userMsg] }));

    const assistantId = `a-${Date.now()}`;
    setMessages((prev) => ({
      ...prev,
      [sid]: [
        ...(prev[sid] ?? []),
        {
          id: assistantId,
          role: "assistant",
          text: "",
          reasoning: [{ step: "正在理解任务", pct: 5 }],
          toolCalls: [],
          artifacts: [],
        },
      ],
    }));
    setStreamingId(assistantId);
    streamTextRef.current = "";
    setStreamingHtml("");

    let creditsReconciled = false;
    const reconcileCredits = (actualCost: number, reason: string) => {
      if (creditsReconciled) return;
      creditsReconciled = true;
      const normalizedCost = Math.max(0, Number.isFinite(actualCost) ? actualCost : 0);
      if (normalizedCost < runCost) {
        refund(runCost - normalizedCost, `${reason} · ${runFeature}`);
      } else if (normalizedCost > runCost) {
        const extra = normalizedCost - runCost;
        if (!spend(extra, `${reason} · ${runFeature}`)) {
          setCreditLock(localCreditLock(normalizedCost, balance, runFeature, runCapability, runComplexity));
        }
      }
    };

    openSse(
      `/chat/sessions/${sid}/messages`,
      {
        text: payload.text,
        mountedAgentId: payload.mountedAgentId ?? undefined,
        skillIds: payload.skillIds,
        model: payload.model,
        target: payload.target,
        attachments: payload.attachments,
        pptConfig: hasPptSkill ? { pages: pptPages, size: pptSize, template: pptTpl } : undefined,
      },
      {
        token: (p) => {
          const chunk = String(p.text ?? "");
          streamTextRef.current += chunk;
          patchMessage(sid, assistantId, (m) => ({ ...m, text: `${m.text}${chunk}` }));
          pushReasoning(sid, assistantId, "生成回复", 70);
          // 流式画布同步：累积文本含 HTML 块时实时渲染到画布。
          const html = extractHtmlBlock(streamTextRef.current);
          if (html) {
            setStreamingHtml(html);
            setCanvasOpen(true);
          }
        },
        tool_call: (p) => {
          const tool = String(p.tool ?? "tool");
          settleTools(sid, assistantId);
          patchMessage(sid, assistantId, (m) => ({
            ...m,
            toolCalls: [
              ...(m.toolCalls ?? []),
              { tool, status: "running", summary: p.summary ? String(p.summary) : undefined },
            ],
          }));
          pushReasoning(sid, assistantId, `调用工具 · ${tool}`, 45);
        },
        artifact: (p) => {
          const artifactId = String(p.artifactId ?? "");
          const type = String(p.type ?? "doc") as ArtifactType;
          const title = p.title ? String(p.title) : undefined;
          settleTools(sid, assistantId);
          patchMessage(sid, assistantId, (m) => ({
            ...m,
            artifacts: [...(m.artifacts ?? []), { artifactId, type, title }],
          }));
          setActiveArtifactId(artifactId);
          setCanvasOpen(true);
          pushReasoning(sid, assistantId, "发布工件", 92);
        },
        credits: (p) => {
          reconcileCredits(Number(p.cost ?? runCost), "后端实扣校准");
        },
        error: (p) => {
          reconcileCredits(0, "任务失败退还");
          patchMessage(sid, assistantId, (m) => ({
            ...m,
            text: `${m.text}\n\n> ⚠️ ${String(p.message ?? "任务暂不可用，请稍后重试。")}`,
          }));
          finalizeAssistant(sid, assistantId);
        },
        done: () => {
          reconcileCredits(runCost, "任务完成");
          finalizeAssistant(sid, assistantId);
        },
      },
    )
      .then(() => finalizeAssistant(sid, assistantId))
      .catch((error) => {
        if (ENABLE_MOCK_SSE) {
          // Explicit local demo mode only.
          simulateStream(sid, assistantId, payload, runCost);
          return;
        }
        reconcileCredits(0, "任务失败退款");
        const message = error instanceof Error ? error.message : "后端 SSE 连接失败";
        patchMessage(sid, assistantId, (m) => ({
          ...m,
          text: `${m.text}\n\n> 后端智能体没有完成真实回复：${message}`,
        }));
        finalizeAssistant(sid, assistantId);
      });
  };

  const onDelete = (sid: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sid));
    setMessages((prev) => {
      const next = { ...prev };
      delete next[sid];
      return next;
    });
    if (activeSessionId === sid) setActiveId("");
    apiFetch(`/chat/sessions/${sid}`, { method: "DELETE" }).catch(() => undefined);
    showToast("已删除会话", "info");
  };
  const onToggleArchive = (sid: string) =>
    setSessions((prev) => prev.map((s) => (s.id === sid ? { ...s, archived: !s.archived } : s)));
  const onRename = (sid: string, title: string) =>
    setSessions((prev) => prev.map((s) => (s.id === sid ? { ...s, title } : s)));
  const onMove = (sid: string, pid: string) => {
    setSessions((prev) => prev.map((s) => (s.id === sid ? { ...s, projectId: pid } : s)));
    if (activeSessionId === sid) setActiveId("");
    showToast("已移动到其他项目", "info");
  };

  const handleOpenArtifact = useCallback((id: string) => {
    setActiveArtifactId(id);
    setCanvasOpen(true);
  }, []);

  /** 重新生成：截断到该 assistant 之前的 user 消息，重发（流式中禁用）。 */
  const handleRegenerate = (assistantId: string) => {
    if (sending || !activeSessionId) return;
    const sid = activeSessionId;
    const list = messages[sid] ?? [];
    const idx = list.findIndex((m) => m.id === assistantId);
    if (idx < 0) return;
    let userIdx = idx - 1;
    while (userIdx >= 0 && list[userIdx].role !== "user") userIdx--;
    if (userIdx < 0) return;
    const userMsg = list[userIdx];
    setMessages((prev) => ({ ...prev, [sid]: list.slice(0, userIdx) }));
    send({
      text: userMsg.text,
      mountedAgentId: mountedAgent,
      skillIds: mountedSkills,
      attachments,
      model,
      target: target || undefined,
    });
  };

  const activeSessions = sessions.filter((s) => !s.archived);
  const archivedSessions = sessions.filter((s) => s.archived);
  const agentRunCost = agentCard ? getAgentRunCost(agentCard) : CHAT_COST;
  const currentRunCost = hasPpt ? PPT_SKILL_COST : agentRunCost;
  const currentFeature = hasPpt ? "PPT 生成" : (agentCard?.title ?? "项目对话");

  return (
    <AppShell>
      <div className="flex h-full overflow-hidden">
        {/* 会话列表（按项目隔离） */}
        <aside className="flex w-[260px] shrink-0 flex-col border-r border-[var(--glass-border-subtle)] bg-[var(--glass-bg-strong)] backdrop-blur-xl saturate-150">
          <div className="p-3">
            <button
              type="button"
              onClick={newChat}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-medium text-white transition-[filter,transform] hover:brightness-110 active:scale-[0.98]"
              style={{ backgroundImage: "var(--gradient-brand)", boxShadow: "var(--shadow-glow-emerald)" }}
            >
              <MessageSquarePlus className="h-4 w-4" strokeWidth={2} /> 新建对话
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-3">
            {activeSessions.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                active={s.id === activeSessionId}
                projects={moveTargets}
                onPick={() => setActiveId(s.id)}
                onRename={onRename}
                onToggleArchive={onToggleArchive}
                onMove={onMove}
                onDelete={onDelete}
              />
            ))}
            {archivedSessions.length > 0 && (
              <>
                <div className="px-2 pb-1 pt-3 text-[11px] font-medium text-[var(--text-icon-text-5)]">已归档</div>
                {archivedSessions.map((s) => (
                  <SessionRow
                    key={s.id}
                    session={s}
                    active={s.id === activeId}
                    projects={moveTargets}
                    onPick={() => setActiveId(s.id)}
                    onRename={onRename}
                    onToggleArchive={onToggleArchive}
                    onMove={onMove}
                    onDelete={onDelete}
                  />
                ))}
              </>
            )}
          </div>
          <ArtifactHistory items={projectArtifacts} activeId={activeArtifactId} onActivate={handleOpenArtifact} />
        </aside>

        {/* 对话区 */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--glass-border-subtle)] bg-[var(--glass-bg-strong)] px-5 backdrop-blur-xl saturate-150">
            <Link
              href="/projects"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-icon-text-3)] transition-colors hover:bg-[var(--neutral-grey60)]"
              aria-label="返回项目"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            </Link>
            <span className="text-[14px] font-medium text-[var(--brand-brand01-black)]">{project?.name ?? "项目"}</span>
            {agentCard && (
              <span
                className="ml-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-white"
                style={{ backgroundColor: categoryMeta(agentCard.category).accent }}
              >
                <Sparkles className="h-3 w-3" strokeWidth={2.5} />
                <span className="max-w-[160px] truncate">{agentCard.title}</span>
                <span className="rounded bg-white/25 px-1 text-[9px]">已锁定</span>
              </span>
            )}
            <span className="ml-2 hidden rounded-full bg-[var(--neutral-grey100)] px-2 py-0.5 text-[11px] text-[var(--text-icon-text-4)] sm:inline">
              仅显示本项目会话 · 每条约 {currentRunCost} 积分
            </span>
          </header>

          {creditLock ? (
            <CreditLockPanel
              estimate={creditLock}
              feature={hasPpt ? "PPT 生成" : currentFeature}
              className="bg-homepage flex-1 overflow-y-auto"
            />
          ) : (
            <>
              {/* 消息 */}
              <div ref={scrollRef} className="bg-homepage flex-1 overflow-y-auto px-5 py-6">
                {activeMessages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-[var(--text-icon-text-4)]">
                    <Bot className="mb-3 h-10 w-10" strokeWidth={1.5} />
                    <p className="text-[14px] font-medium text-[var(--text-icon-text-2)]">与本项目智能体开始对话</p>
                    <p className="mt-1 text-[12px]">{agentCard ? `已锁定「${agentCard.title}」，可随时调整技能与附件` : "先挂载智能体或直接输入任务"}</p>
                  </div>
                ) : (
                  <div className="mx-auto flex max-w-[760px] flex-col gap-4">
                    {activeMessages.map((m) => (
                      <MessageBubble
                        key={m.id}
                        message={m}
                        streaming={m.id === streamingId}
                        onOpenArtifact={handleOpenArtifact}
                        onRegenerate={handleRegenerate}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* 输入器 */}
              <div className="shrink-0 border-t border-[var(--glass-border-subtle)] bg-[var(--glass-bg-strong)] p-3 backdrop-blur-xl saturate-150">
                <div className="mx-auto max-w-[760px]">
                  <ChatComposer
                    variant="panel"
                    mountedAgent={mountedAgent}
                    mountedSkills={mountedSkills}
                    attachments={attachments}
                    model={model}
                    target={target}
                    initialText={draft?.text}
                    agentLocked={agentLocked}
                    topSlot={
                      hasPpt ? (
                        <PptConfig
                          pages={pptPages}
                          size={pptSize}
                          template={pptTpl}
                          onPagesChange={setPptPages}
                          onSizeChange={setPptSize}
                          onTemplateChange={setPptTpl}
                        />
                      ) : undefined
                    }
                    onAgentChange={setMountedAgent}
                    onSkillsChange={setMountedSkills}
                    onAttachmentsChange={setAttachments}
                    onModelChange={setModel}
                    onTargetChange={setTarget}
                    onSubmit={send}
                    sending={sending}
                    costLabel={`${currentRunCost} 积分/条`}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* 同步画布（桌面右侧常驻 / 移动端全屏覆盖；可折叠） */}
        {canvasOpen && (
          <div className="fixed inset-0 z-50 lg:static lg:z-auto lg:w-[440px] lg:max-w-[46%] lg:shrink-0">
            <ArtifactCanvas
              artifacts={sessionArtifacts}
              activeId={activeArtifactId}
              onActivate={setActiveArtifactId}
              onClose={() => setCanvasOpen(false)}
              seedArtifacts={SEED_ARTIFACTS}
              streamingHtml={streamingHtml}
              className="w-full"
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}

/** 会话行：标题 + 更新时间（hover 出 ⋯ 菜单）。 */
function SessionRow({
  session,
  active,
  projects,
  onPick,
  onRename,
  onToggleArchive,
  onMove,
  onDelete,
}: {
  session: ChatSession;
  active: boolean;
  projects: { id: string; name: string }[];
  onPick: () => void;
  onRename: (id: string, title: string) => void;
  onToggleArchive: (id: string) => void;
  onMove: (id: string, pid: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      onClick={onPick}
      className={`group mb-1 flex w-full cursor-pointer items-center gap-1 rounded-lg px-2.5 py-2 text-left transition-colors ${
        active ? "bg-[var(--neutral-grey100)]" : "hover:bg-[var(--neutral-grey60)]"
      } ${session.archived ? "opacity-55" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <div className={`truncate text-[13px] ${active ? "text-[var(--brand-brand01-black)]" : "text-[var(--text-icon-text-3)]"}`}>
          {session.title}
        </div>
        {session.updatedAt && (
          <div className="tabular-nums truncate text-[10px] text-[var(--text-icon-text-5)]">{session.updatedAt}</div>
        )}
      </div>
      <div className="opacity-0 transition-opacity group-hover:opacity-100">
        <SessionActionsMenu
          session={session}
          projects={projects}
          onRename={onRename}
          onToggleArchive={onToggleArchive}
          onMove={onMove}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
