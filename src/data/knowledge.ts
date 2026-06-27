import type { KnowledgeFolder, KnowledgeDoc } from "@/types";

/**
 * 知识库文件夹种子 — 后端 `GET /api/knowledge-base/folders` 不可用时回落。
 * 支持 parentId 嵌套；"root" 为虚拟根。
 */
export const KNOWLEDGE_FOLDERS: KnowledgeFolder[] = [
  { id: "f-formula", name: "配方与安评", parentId: null, count: 8 },
  { id: "f-ingredient", name: "原料与供应商", parentId: null, count: 6 },
  { id: "f-compliance", name: "法规合规", parentId: null, count: 4 },
  { id: "f-market", name: "趋势与竞品", parentId: null, count: 5 },
];

/** 知识库文档种子 — 后端 `GET /api/knowledge-base/docs?folderId=` 不可用时回落。 */
export const KNOWLEDGE_DOCS: KnowledgeDoc[] = [
  { id: "d1", name: "驻留类精华安评底稿.pdf", folderId: "f-formula", source: "upload", size: "2.4 MB", updatedAt: "2 小时前", status: "ready", chunks: 86 },
  { id: "d2", name: "防晒配方原料展开表.xlsx", folderId: "f-formula", source: "drive", size: "640 KB", updatedAt: "昨天", status: "ready", chunks: 32 },
  { id: "d3", name: "烟酰胺原料合规速览", folderId: "f-ingredient", source: "link", updatedAt: "3 天前", status: "indexing", chunks: 0 },
  { id: "d4", name: "2026 功效护肤趋势.md", folderId: "f-market", source: "upload", size: "120 KB", updatedAt: "昨天", status: "ready", chunks: 24 },
  { id: "d5", name: "备案文案禁用词与处罚案例", folderId: "f-compliance", source: "link", updatedAt: "5 天前", status: "ready", chunks: 41 },
  { id: "d6", name: "化妆品安全评估报告模板.docx", folderId: "f-compliance", source: "upload", size: "88 KB", updatedAt: "1 周前", status: "ready", chunks: 18 },
  { id: "d7", name: "平台抓取数据合规指引.pdf", folderId: "f-compliance", source: "upload", size: "1.1 MB", updatedAt: "2 周前", status: "failed", chunks: 0 },
  { id: "d8", name: "竞品背调暖色报告样例.pdf", folderId: "f-market", source: "upload", size: "8.7 MB", updatedAt: "3 天前", status: "ready", chunks: 120 },
];

export const KNOWLEDGE_ROOT_FOLDER_ID = "root";

/** 生成一个本地唯一 ID（用于乐观创建，后端 ID 在 best-effort 失败时缺失）。 */
export function makeKnowledgeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 创建一个新的知识库文件夹对象。 */
export function createKnowledgeFolder(
  name: string,
  parentId: string | null = null,
): KnowledgeFolder {
  return {
    id: makeKnowledgeId("f"),
    name,
    parentId,
    count: 0,
  };
}

/** 创建一个新的知识库文档对象（上传 / 链接 / 云盘）。 */
export function createKnowledgeDoc(input: {
  name: string;
  folderId: string;
  source: KnowledgeDoc["source"];
  size?: string;
  status?: KnowledgeDoc["status"];
  chunks?: number;
}): KnowledgeDoc {
  return {
    id: makeKnowledgeId("d"),
    name: input.name,
    folderId: input.folderId,
    source: input.source,
    size: input.size,
    updatedAt: "刚刚",
    status: input.status ?? "indexing",
    chunks: input.chunks ?? 0,
  };
}
