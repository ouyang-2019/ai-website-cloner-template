import type { AgentCategory } from "@/types";

/**
 * 技能广场数据 — 创作"能力入口"视角（对标 skillsquare / Kimi 产品入口）。
 * 每个技能是一个可点击的创作入口，PPT 等关键技能有专属创作流页面。
 */
export interface SkillEntry {
  id: string;
  name: string;
  desc: string;
  icon: "ppt" | "doc" | "image" | "table" | "website" | "video" | "all";
  category: AgentCategory;
  cover: string;
  /** 创作流入口（PPT 指向专属页，其余默认进对话）。 */
  href: string;
  badge?: "热门" | "新上";
  uses: string;
}

const SKILL_COVERS = [
  "/images/gallery/cover-02.png", "/images/gallery/cover-03.jpg", "/images/gallery/cover-06.png",
  "/images/gallery/cover-08.jpg", "/images/gallery/cover-11.jpg", "/images/gallery/cover-13.jpg",
  "/images/gallery/cover-16.png", "/images/gallery/cover-19.jpg", "/images/gallery/cover-21.jpg",
  "/images/gallery/cover-23.jpg", "/images/gallery/cover-26.png", "/images/gallery/cover-29.jpg",
];
const c = (i: number) => SKILL_COVERS[i % SKILL_COVERS.length];

export const SKILLS: SkillEntry[] = [
  { id: "ppt", name: "PPT 生成", desc: "主题/文档一键生成精美演示文稿，多模板多尺寸", icon: "ppt", category: "doc", cover: c(0), href: "/chat?skill=ppt", badge: "热门", uses: "128k" },
  { id: "doc", name: "文档撰写", desc: "报告、方案、稿件的高质量撰写与发布", icon: "doc", category: "doc", cover: c(1), href: "/chat", badge: "热门", uses: "96k" },
  { id: "sheet", name: "表格分析", desc: "原始数据到商业洞察的深度分析与可视化", icon: "table", category: "sheet", cover: c(2), href: "/chat", uses: "74k" },
  { id: "website", name: "网站建设", desc: "一句话生成可部署的企业官网与落地页", icon: "website", category: "doc", cover: c(3), href: "/chat", badge: "热门", uses: "61k" },
  { id: "video", name: "视频创作", desc: "脚本、素材、短视频、数字人全流程", icon: "video", category: "video", cover: c(4), href: "/chat", uses: "52k" },
  { id: "research", name: "深度研究", desc: "多源检索、证据溯源与综合研判报告", icon: "image", category: "research", cover: c(5), href: "/chat", uses: "48k" },
  { id: "image", name: "图像生成", desc: "海报、Banner、Logo、AI 插画生成与编辑", icon: "image", category: "channel", cover: c(6), href: "/chat", uses: "89k" },
  { id: "slides-html", name: "HTML 演示", desc: "动画丰富的单文件 HTML 演示文稿", icon: "ppt", category: "doc", cover: c(7), href: "/chat?skill=ppt", uses: "33k" },
  { id: "pdf", name: "PDF 生成", desc: "结构化内容生成排版精良的可打印 PDF", icon: "doc", category: "doc", cover: c(8), href: "/chat", uses: "27k" },
  { id: "data-report", name: "数据报告", desc: "分析结果注入精美 HTML 报告模板", icon: "table", category: "sheet", cover: c(9), href: "/chat", uses: "41k" },
  { id: "minutes", name: "会议纪要", desc: "录音转写、AI 摘要与会后待办提取", icon: "doc", category: "writing", cover: c(10), href: "/chat", badge: "新上", uses: "18k" },
  { id: "poster", name: "海报设计", desc: "营销海报、社媒配图、活动主视觉", icon: "image", category: "channel", cover: c(11), href: "/chat", badge: "新上", uses: "22k" },
  { id: "ian-xiaohei", name: "小黑怪诞配图", desc: "GitHub 6.3k★ 爆款 AI 配图神器——把中文文章的认知锚点变成白底手绘怪诞插图，小黑 IP，16:9 横版，少量红橙蓝中文批注，逆天的内容配图生产力工具，让抽象判断一图入魂", icon: "image", category: "doc", cover: c(0), href: "/chat", badge: "热门", uses: "6.3k" },
];
