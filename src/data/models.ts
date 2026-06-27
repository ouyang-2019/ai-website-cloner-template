import type { ModelOption } from "@/types";

/**
 * 大模型选项 — 对话输入框"模型选择器"使用。
 * `auto` 为智选（由编排引擎按任务自动挑选），其余为命名模型。
 * 后端就绪后可由 `GET /api/models` 替换。
 */
export const MODELS: ModelOption[] = [
  { id: "auto", name: "智选模型", vendor: "AUBEAU", desc: "按任务自动匹配最优模型", badge: "New" },
  { id: "claude-opus", name: "Claude Opus", vendor: "Anthropic", desc: "深度推理 · 复杂编排" },
  { id: "claude-sonnet", name: "Claude Sonnet", vendor: "Anthropic", desc: "均衡 · 日常任务" },
  { id: "gpt-5", name: "GPT-5", vendor: "OpenAI", desc: "通用强能力" },
  { id: "deepseek-v3", name: "DeepSeek V3", vendor: "DeepSeek", desc: "高性价比 · 中文优化" },
  { id: "qwen-max", name: "Qwen Max", vendor: "阿里云", desc: "中文 · 工具调用" },
];

/** 默认选中模型。 */
export const DEFAULT_MODEL_ID = "auto";

/** 按 id 取模型显示名（找不到回落"智选模型"）。 */
export function modelLabel(id: string | null | undefined): string {
  return (id && MODELS.find((m) => m.id === id)?.name) ?? "智选模型";
}
