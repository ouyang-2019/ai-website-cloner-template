/**
 * PPT 模板与尺寸 — 对标 pptx skill 的 design guideline + nano 尺寸模式。
 * 模板提供完整配色（accent/背景/表面/文字/次要），驱动 HTML 页面生成器。
 */
export interface PptTemplate {
  id: string;
  name: string;
  desc: string;
  accent: string;
  bg: string;
  surface: string;
  text: string;
  muted: string;
  dark?: boolean;
}

export interface PptSize {
  id: string;
  name: string;
  /** CSS aspect-ratio 宽/高。 */
  w: number;
  h: number;
  desc: string;
  badge?: string;
}

export const PPT_TEMPLATES: PptTemplate[] = [
  { id: "business-pro", name: "商务专业", desc: "沉稳蓝调，适合汇报与提案", accent: "#2563eb", bg: "#f8fafc", surface: "#ffffff", text: "#0f172a", muted: "#64748b" },
  { id: "tech-dark", name: "科技深色", desc: "暗色霓虹，适合产品与科技发布", accent: "#22d3ee", bg: "#0b1220", surface: "#111a2e", text: "#e2e8f0", muted: "#94a3b8", dark: true },
  { id: "minimal-light", name: "极简亮色", desc: "大量留白，适合高端品牌", accent: "#0f172a", bg: "#ffffff", surface: "#f8fafc", text: "#0f172a", muted: "#94a3b8" },
  { id: "magazine-bold", name: "杂志粗体", desc: "橙黑撞色，适合营销与创意", accent: "#ea580c", bg: "#fff7ed", surface: "#ffffff", text: "#1c1917", muted: "#78716c" },
  { id: "china-elegant", name: "国潮雅致", desc: "红金东方，适合文化与节日", accent: "#b91c1c", bg: "#fef2f2", surface: "#fffbeb", text: "#1c1917", muted: "#92400e" },
  { id: "academic-clean", name: "学术清爽", desc: "墨绿克制，适合论文与答辩", accent: "#047857", bg: "#f0fdf4", surface: "#ffffff", text: "#052e16", muted: "#6b7280" },
  { id: "startup-vibrant", name: "创业活力", desc: "紫调明快，适合融资与路演", accent: "#7c3aed", bg: "#faf5ff", surface: "#ffffff", text: "#2e1065", muted: "#7c6f8a" },
  { id: "nature-organic", name: "自然有机", desc: "草绿温润，适合可持续与生活", accent: "#65a30d", bg: "#f7fee7", surface: "#ffffff", text: "#1a2e05", muted: "#6b7280" },
];

export const PPT_SIZES: PptSize[] = [
  { id: "wide", name: "宽屏 16:9", w: 16, h: 9, desc: "标准演示，投影/会议首选", badge: "默认" },
  { id: "standard", name: "传统 4:3", w: 4, h: 3, desc: "经典比例，兼容旧设备" },
  { id: "vertical", name: "竖屏 9:16", w: 9, h: 16, desc: "移动端 nano 模式，短视频/海报", badge: "nano" },
  { id: "square", name: "方形 1:1", w: 1, h: 1, desc: "社交分享，朋友圈/小红书" },
];

/** 可选页数（对话框内 PPT 配置）。 */
export const PPT_PAGE_COUNTS = [6, 8, 10, 12, 15] as const;
