import type { PptTemplate, PptSize } from "@/data/ppt";

/**
 * PPT HTML 页面生成器 — 移植 generate_ppt_html_pages 的产物形态：
 * 流式生成自包含 HTML 页面（每页一个），平台下载时转 pptx。
 * 按主题 + 模板配色 + 尺寸比例生成 6 页演示文稿。
 */

export type PptPageType = "cover" | "agenda" | "section" | "data" | "quote" | "closing";
export interface PptPage {
  type: PptPageType;
  title: string;
  pageNo: number;
  total: number;
  html: string;
}

const esc = (s: string) =>
  s.replace(/[<&>]/g, (m) => (m === "<" ? "&lt;" : m === ">" ? "&gt;" : "&amp;"));
const pad = (n: number) => n.toString().padStart(2, "0");

const SECTIONS = ["背景与趋势", "核心方案", "数据与成果", "总结与展望"];
const QUOTE = "把复杂留给自己，把简单交给用户。";

/** 公共 CSS：slide 按 size 比例，内容 flex 居中自适应。 */
function baseCss(t: PptTemplate, s: PptSize): string {
  return `
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;width:100%}
body{font-family:-apple-system,'PingFang SC','Noto Sans SC',sans-serif;background:${t.bg};color:${t.text};display:flex;align-items:center;justify-content:center;overflow:hidden}
.slide{width:100%;aspect-ratio:${s.w}/${s.h};max-height:100%;max-width:100%;position:relative;padding:7% 8%;display:flex;flex-direction:column}
.brand{position:absolute;top:4.5%;left:8%;font-size:clamp(9px,1.1vw,13px);font-weight:700;letter-spacing:.18em;color:${t.accent}}
.brand i{display:inline-block;width:7px;height:7px;border-radius:50%;background:${t.accent};margin-right:6px;vertical-align:middle}
.pg{position:absolute;bottom:4%;right:8%;font-size:clamp(8px,.9vw,11px);color:${t.muted}}
h1{font-size:clamp(22px,4.2vw,42px);font-weight:800;line-height:1.12;letter-spacing:-.01em}
h2{font-size:clamp(16px,2.6vw,28px);font-weight:700;line-height:1.2}
.k{font-size:clamp(8px,1vw,12px);color:${t.accent};font-weight:700;letter-spacing:.2em}
.sub{font-size:clamp(9px,1.2vw,14px);color:${t.muted};line-height:1.5}
.rule{width:9%;min-width:42px;height:4px;border-radius:2px;background:${t.accent}}
`.trim();
}

function doc(t: PptTemplate, s: PptSize, extraCss: string, body: string, pageNo: number, total: number): string {
  return `<!doctype html><html lang="zh"><head><meta charset="utf-8"><style>${baseCss(t, s)}${extraCss}</style></head><body><div class="slide"><div class="brand"><i></i>AUBEAU</div>${body}<div class="pg">${pad(pageNo)} / ${pad(total)}</div></div></body></html>`;
}

function cover(theme: string, t: PptTemplate, s: PptSize, n: number, total: number): string {
  return doc(t, s, `.c{justify-content:center;height:100%}.meta{margin-top:auto}`, `<div class="c"><div class="k">AUBEAU · 演示文稿</div><h1 style="margin-top:14px">${esc(theme)}</h1><div class="rule" style="margin:16px 0"></div><div class="sub">${t.name}风格 · ${s.name} · 由 PPT 智能体生成</div><div class="meta sub" style="margin-top:18px">共 ${total} 页 · 生成于 2026</div></div>`, n, total);
}

function agenda(t: PptTemplate, s: PptSize, n: number, total: number): string {
  const items = SECTIONS.map((title, i) => `<div class="ai"><span class="an">${pad(i + 1)}</span><span class="at">${title}</span><span class="al"></span></div>`).join("");
  return doc(t, s, `
.ag{margin-top:18px;display:flex;flex-direction:column;gap:clamp(8px,1.6vh,16px)}
.ai{display:flex;align-items:baseline;gap:14px;border-bottom:1px solid ${t.accent}22;padding-bottom:clamp(6px,1vh,12px)}
.an{font-size:clamp(14px,2vw,22px);font-weight:800;color:${t.accent};min-width:32px}
.at{font-size:clamp(13px,1.8vw,20px);font-weight:600}
.al{flex:1;border-top:1px dotted ${t.muted};opacity:.4;margin-left:8px}
`, `<div><div class="k">CONTENTS</div><h2 style="margin-top:8px">本次内容</h2></div><div class="ag">${items}</div>`, n, total);
}

function section(idx: number, t: PptTemplate, s: PptSize, n: number, total: number): string {
  return doc(t, s, `.c{justify-content:center;height:100%}.sn{font-size:clamp(40px,10vw,96px);font-weight:900;color:${t.accent};opacity:.18;line-height:1}`, `<div class="c"><div class="sn">${pad(idx + 1)}</div><div class="k" style="margin-bottom:10px">PART ${idx + 1}</div><h1>${SECTIONS[idx]}</h1><div class="rule" style="margin-top:16px"></div><div class="sub" style="margin-top:12px;max-width:80%">本节将围绕「${SECTIONS[idx]}」展开，结合数据与案例，给出可落地的结论与建议。</div></div>`, n, total);
}

function data(theme: string, t: PptTemplate, s: PptSize, n: number, total: number): string {
  const base = 60 + (theme.length % 30);
  const kpis = [
    { v: `${base}%`, l: "达成率" },
    { v: `${base * 4}`, l: "处理条目" },
    { v: `+${base / 5}`, l: "环比增长" },
  ].map((k) => `<div class="kp"><div class="kv">${k.v}</div><div class="kl">${k.l}</div></div>`).join("");
  const bars = [45, 70, 55, 85, 65, 92, 78]
    .map((h) => `<div class="bar" style="height:${h}%"></div>`)
    .join("");
  return doc(t, s, `
.body{margin-top:16px;display:flex;flex-direction:column;gap:16px;flex:1}
.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.kp{background:${t.surface};border:1px solid ${t.accent}22;border-radius:10px;padding:clamp(8px,1.4vh,14px)}
.kv{font-size:clamp(18px,3vw,30px);font-weight:800;color:${t.accent}}
.kl{font-size:clamp(9px,1vw,12px);color:${t.muted};margin-top:2px}
.chart{background:${t.surface};border:1px solid ${t.accent}22;border-radius:10px;padding:clamp(10px,1.6vh,16px);flex:1;display:flex;flex-direction:column}
.ct{font-size:clamp(10px,1.1vw,13px);font-weight:600;margin-bottom:10px}
.bars{display:flex;align-items:flex-end;gap:2%;flex:1;min-height:60px}
.bar{flex:1;background:linear-gradient(180deg,${t.accent},${t.accent}99);border-radius:4px 4px 0 0}
`, `<div><div class="k">DATA</div><h2 style="margin-top:8px">数据与成果</h2></div><div class="body"><div class="kpis">${kpis}</div><div class="chart"><div class="ct">近 7 日趋势</div><div class="bars">${bars}</div></div></div>`, n, total);
}

function quote(t: PptTemplate, s: PptSize, n: number, total: number): string {
  return doc(t, s, `
.c{justify-content:center;height:100%}
.mk{font-size:clamp(50px,12vw,120px);font-weight:900;color:${t.accent};opacity:.25;line-height:.7;font-family:Georgia,serif}
.qt{font-size:clamp(18px,3.4vw,34px);font-weight:700;line-height:1.35;margin-top:6px}
.by{font-size:clamp(10px,1.2vw,14px);color:${t.muted};margin-top:18px}
`, `<div class="c"><div class="mk">"</div><div class="qt">${esc(QUOTE)}</div><div class="by">—— AUBEAU 智能体 · ${t.name}</div></div>`, n, total);
}

function closing(t: PptTemplate, s: PptSize, n: number, total: number): string {
  return doc(t, s, `
.c{justify-content:center;align-items:center;text-align:center;height:100%}
.thx{font-size:clamp(36px,8vw,80px);font-weight:900;letter-spacing:.05em}
.by{font-size:clamp(10px,1.2vw,14px);color:${t.muted};margin-top:14px}
.chip{margin-top:22px;display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:999px;background:${t.surface};border:1px solid ${t.accent}44;color:${t.accent};font-size:clamp(9px,1vw,12px);font-weight:600}
`, `<div class="c"><div class="k">THANK YOU</div><div class="thx" style="margin-top:10px">谢谢观看</div><div class="by">由 AUBEAU PPT 智能体生成 · ${t.name}风格</div><div class="chip">AUBEAU · 企业级智能体协作平台</div></div>`, n, total);
}

/** 生成完整演示文稿（6 页），模拟流式 HTML 交付。 */
export function generateDeck(theme: string, t: PptTemplate, s: PptSize): PptPage[] {
  const total = 6;
  return [
    { type: "cover", title: theme, pageNo: 1, total, html: cover(theme, t, s, 1, total) },
    { type: "agenda", title: "目录", pageNo: 2, total, html: agenda(t, s, 2, total) },
    { type: "section", title: SECTIONS[0], pageNo: 3, total, html: section(0, t, s, 3, total) },
    { type: "data", title: "数据与成果", pageNo: 4, total, html: data(theme, t, s, 4, total) },
    { type: "quote", title: "金句", pageNo: 5, total, html: quote(t, s, 5, total) },
    { type: "closing", title: "谢谢", pageNo: 6, total, html: closing(t, s, 6, total) },
  ];
}

/** 页类型中文标签。 */
export const PAGE_TYPE_LABELS: Record<PptPageType, string> = {
  cover: "封面",
  agenda: "目录",
  section: "章节",
  data: "数据",
  quote: "金句",
  closing: "结尾",
};
