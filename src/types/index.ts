// Content shape interfaces for the AUBEAU 智能体平台 homepage.

import type { AgentCapability, TaskComplexity, SubscriptionPlan } from "./credits";

/** A 智能体能力 quick-action button under the AUBEAU input. */
export interface SkillQuickAction {
  /** Visible label, e.g. "任务编排", "长期记忆". */
  label: string;
  /** Colored leading icon key (maps to components/icons.tsx). */
  icon: "ppt" | "doc" | "image" | "table" | "website" | "video" | "all";
  /** Underlying agent capability (drives credit cost + tier gating). */
  capability: AgentCapability;
  /** Default task complexity for cost preview. */
  complexity: TaskComplexity;
}

/**
 * 智能体能力大类 — 对标 skill 体系（6 类）。
 * doc=文档智能 / sheet=表格分析 / video=视频创作 /
 * research=深度研究 / writing=专业写作 / channel=集成协同。
 */
export type AgentCategory = "beauty" | "doc" | "sheet" | "video" | "research" | "writing" | "channel";

/** A template card in the 热门智能体 gallery. */
export interface TemplateCard {
  /** Template title (AUBEAU agent template name). */
  title: string;
  /** Local cover image path under /public. */
  cover: string;
  /** Minimum plan required to use this template (for tier badge). Optional. */
  minTier?: SubscriptionPlan;
  /** Capability category (drives explore filters + badge color). */
  category: AgentCategory;
  /** One-line capability tagline (Chinese, derived from real skill description). */
  tagline: string;
  /** Primary capability driving credit cost + tier gating. */
  capability: AgentCapability;
  /** Default task complexity for cost preview. */
  complexity: TaskComplexity;
  /** Real tool identifiers from the source skill (English, for authenticity). */
  tools: string[];
  /** Source skill name in the reference repo (for traceability). */
  skillRef: string;
}

/** Metadata for an agent category (label / icon key / accent / blurb). */
export interface CategoryMeta {
  key: AgentCategory;
  label: string;
  /** Colored leading icon key (maps to components/icons.tsx). */
  icon: "ppt" | "doc" | "image" | "table" | "website" | "video" | "all";
  /** Accent color (hex). */
  accent: string;
  /** Short descriptor shown under the category label. */
  blurb: string;
}

/** A primary-rail navigation item (icon + tooltip label). */
export interface NavItem {
  /** Icon key rendered in the rail (resolved in sidebar.tsx). */
  icon: "plus" | "compass" | "clock" | "folder" | "home" | "book" | "workflow";
  label: string;
  href: string;
  active?: boolean;
  /** Show the "new" corner badge. */
  isNew?: boolean;
}

/** A secondary-panel list entry. */
export interface SidePanelItem {
  label: string;
  href: string;
  icon: "compass" | "clock" | "folder" | "sparkles" | "home" | "book" | "workflow";
  badge?: string;
  active?: boolean;
}

// —— 对话 / 挂载 ——————————————————————————————

/** 对话会话 — 属于某个项目（projectId），按项目隔离展示。 */
export interface ChatSession {
  id: string;
  title: string;
  projectId: string;
  updatedAt?: string;
  /** 归档会话在列表中弱化展示，不计入活跃。 */
  archived?: boolean;
}

/** 工件产物类型（§13.2 / §7 artifact 事件）。 */
export type ArtifactType = "report" | "doc" | "video" | "channel" | "ppt";

/** 对话消息携带的工件引用（只 ID+类型+标题，原始 HTML 不入消息上下文）。 */
export interface MessageArtifact {
  artifactId: string;
  type: ArtifactType;
  title?: string;
}

/** 工具调用记录（assistant 消息内的工具调用芯片）。 */
export interface MessageToolCall {
  tool: string;
  status: "running" | "done";
  summary?: string;
}

/** 思考过程时间线的一步（SSE 进度驱动）。 */
export interface MessageReasoningStep {
  step: string;
  pct: number;
}

/**
 * 单条对话消息。
 * reasoning/toolCalls/artifacts 为前端本地聚合 SSE 事件的结构化字段（可选，
 * 向后兼容旧消息）。原始 artifact HTML 不入消息，仅存 artifactId，画布按需
 * 经 §13.2 GET /artifacts/:id 取 html 在 sandbox iframe 渲染。
 */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt?: string;
  /** 思考过程时间线（前端本地聚合 SSE 进度）。 */
  reasoning?: MessageReasoningStep[];
  /** 工具调用记录（前端本地聚合 SSE tool_call 事件）。 */
  toolCalls?: MessageToolCall[];
  /** 工件引用（前端本地聚合 SSE artifact 事件；只 ID+类型，HTML 走 §13.2 取）。 */
  artifacts?: MessageArtifact[];
}

/** 工件详情（§13.2 GET /artifacts/:id → { type, html, meta }）。 */
export interface ArtifactDetail {
  id: string;
  type: ArtifactType;
  html?: string;
  title?: string;
  meta?: Record<string, unknown>;
  createdAt?: string;
}

/** 对话框附件（文件或链接），挂载到输入框随消息发送。 */
export interface ComposerAttachment {
  id: string;
  name: string;
  kind: "file" | "link";
  size?: number;
  url?: string;
}

/** 大模型选项（输入框模型选择器）。 */
export interface ModelOption {
  id: string;
  name: string;
  vendor?: string;
  desc?: string;
  badge?: string;
}

// —— 知识库 ——————————————————————————————

/** 知识库文档（上传/链接/云盘接入）。 */
export interface KnowledgeDoc {
  id: string;
  name: string;
  folderId: string;
  source: "upload" | "link" | "drive";
  size?: string;
  updatedAt: string;
  status: "ready" | "indexing" | "failed";
  chunks?: number;
}

/** 知识库文件夹（支持嵌套）。 */
export interface KnowledgeFolder {
  id: string;
  name: string;
  parentId: string | null;
  count?: number;
}

// —— 工作流（智能体编排画布）——————————————————————————————

/**
 * 节点 IO 端口规格（§5.2 P0 #4 类型化契约）。
 * 节点声明 inputs / outputs 端口列表，画布 typed edge 的 sourceHandle/targetHandle
 * 绑定到端口名；连线时做类型匹配（text↔text / artifact↔artifact）。
 */
export interface PortSpec {
  /** 端口名（edge 的 sourceHandle/targetHandle 引用此名）。 */
  name: string;
  /** 端口类型：text=轻量文本直传；artifact=重型产物走 ArtifactRef（只 ID+preview）。 */
  type: "text" | "artifact";
  /** 是否必填（fan-in 时缺失 required input 由 runner 决定是否阻断）。 */
  required?: boolean;
  /** 端口显示名（UI 用，可选）。 */
  label?: string;
}

/** 工作流上的智能体节点数据（节点 = 智能体）。 */
export interface WorkflowAgentNodeData {
  agentId: number;
  title: string;
  cover: string;
  category: AgentCategory;
  accent: string;
  capability: string;
  /**
   * 节点输入端口契约（§5.2 P0 #4）。缺省时由前端补一个默认 text 输入槽 "input"
   * （向后兼容旧工作流：无 inputs 走默认顺序 pipe）。
   */
  inputs?: PortSpec[];
  /**
   * 节点输出端口契约。缺省时前端补 ``[{name:"output",type:"text"}]`` 单输出
   * （向后兼容：旧 edge 无 sourceHandle 时取上游默认 "output"）。
   */
  outputs?: PortSpec[];
}

/** 工作流节点（start / end / agent）。 */
export interface WorkflowNode {
  id: string;
  type: "start" | "end" | "agent";
  position: { x: number; y: number };
  data: WorkflowAgentNodeData | Record<string, unknown>;
}

/**
 * 工作流连线（typed edge，§5.3 关键设计决策 + §5.4 反模式 #3）。
 *
 * ``sourceHandle`` / ``targetHandle`` 缺省时走默认顺序 pipe（向后兼容旧无 handle
 * 的 edge：上游默认 "output" → 下游下一个未填输入槽）。
 */
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  /** 上游输出端口名（缺省="output" 默认输出）。 */
  sourceHandle?: string;
  /** 下游输入端口名（缺省=顺序填入下一个未填槽位）。 */
  targetHandle?: string;
}

/** 一个完整工作流（可保存/复用）。 */
export interface Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  updatedAt?: string;
}
