import type { ComposerAttachment } from "@/types";

/**
 * 跨页"挂载草稿"——在首页 Hero 挂载智能体/技能/附件/模型并输入后，
 * 跳转到项目会话时一次性携带，进入后回填到项目对话框。
 * 取出即删除（一次性）。
 */
export interface ComposerDraft {
  text?: string;
  mountedAgent?: number | null;
  skills?: string[];
  attachments?: ComposerAttachment[];
  model?: string;
  target?: string;
}

const KEY = "aubeau_composer_draft";

export function saveComposerDraft(d: ComposerDraft): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    // 忽略隐私模式 / 配额错误
  }
}

export function takeComposerDraft(): ComposerDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    return JSON.parse(raw) as ComposerDraft;
  } catch {
    return null;
  }
}
