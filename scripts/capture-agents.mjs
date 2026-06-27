#!/usr/bin/env node
/**
 * 批量驱动全部智能体并截图验证（scripts/capture-agents.mjs）
 *
 * 对每个智能体（1..N）：
 *   1. 打开新的介绍页 /agents/N —— 验证渲染、收集 console/page 错误；
 *   2. 打开项目工作台 /projects/<proj>?agent=N —— 截图作为「真实驱动效果图」，
 *      存入 public/images/agent-showcase/agent-NN.png。
 *
 * 产出：public/images/agent-showcase/agent-NN.png × N + scripts/agent-capture-report.json
 *
 * 用法：node scripts/capture-agents.mjs [--base=http://localhost:3000] [--from=1] [--to=53]
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = arg("base", "http://127.0.0.1:3939");
const FROM = Number(arg("from", "1"));
const TO = Number(arg("to", "53"));
const OUT_DIR = path.resolve("public/images/agent-showcase");

// 与 src/data/projects.ts 的 agentId → projectId 映射保持一致；未命中回落活跃项目。
const AGENT_TO_PROJECT = {
  2: "p1", 1: "p2", 4: "p3", 3: "p4", 6: "p5", 16: "p6", 17: "p7", 15: "p8",
};
const ACTIVE_FALLBACKS = ["p1", "p2", "p4", "p8"];
function projectFor(id) {
  return AGENT_TO_PROJECT[id] ?? ACTIVE_FALLBACKS[(id - 1) % ACTIVE_FALLBACKS.length];
}
function pad2(n) {
  return String(n).padStart(2, "0");
}
function arg(key, dflt) {
  const m = process.argv.find((a) => a.startsWith(`--${key}=`));
  return m ? m.slice(key.length + 3) : dflt;
}

const report = [];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  locale: "zh-CN",
});

await mkdir(OUT_DIR, { recursive: true });

for (let id = FROM; id <= TO; id++) {
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    // 前端模板无后端：API 503/502/504 与「Failed to load resource」属预期降级，不计为失败。
    if (/503|502|504|Failed to load resource|net::ERR|fetch/.test(t)) return;
    errors.push(`console: ${t}`.slice(0, 300));
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${String(e && e.message ? e.message : e)}`.slice(0, 300)));

  const entry = { id, detailOk: false, workspaceOk: false, errorCount: 0, errors: [], file: null };

  // 1) 介绍页验证
  try {
    await page.goto(`${BASE}/agents/${id}`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(1800);
    // 关键内容存在性校验
    const h1 = await page.locator("h1").first().textContent().catch(() => "");
    entry.detailOk = !!h1;
  } catch (e) {
    errors.push(`detail-nav: ${String(e && e.message ? e.message : e)}`.slice(0, 300));
  }

  // 2) 工作台「运行」截图
  const proj = projectFor(id);
  try {
    await page.goto(`${BASE}/projects/${proj}?agent=${id}`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(1600);
    const file = path.join(OUT_DIR, `agent-${pad2(id)}.png`);
    await page.screenshot({ path: file, fullPage: false });
    entry.workspaceOk = true;
    entry.file = `agent-${pad2(id)}.png`;
  } catch (e) {
    errors.push(`workspace-nav: ${String(e && e.message ? e.message : e)}`.slice(0, 300));
  }

  entry.errorCount = errors.length;
  entry.errors = errors.slice(0, 5);
  report.push(entry);

  const tag = entry.detailOk && entry.workspaceOk && entry.errorCount === 0 ? "OK " : "ERR";
  process.stdout.write(`[${tag}] agent ${pad2(id)} detail=${entry.detailOk} ws=${entry.workspaceOk} errs=${entry.errorCount}\n`);

  await page.close();
}

await browser.close();

const reportPath = path.resolve("scripts/agent-capture-report.json");
await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");

const failed = report.filter((r) => !r.detailOk || !r.workspaceOk || r.errorCount > 0);
process.stdout.write(`\n=== 完成：${report.length} 个，失败 ${failed.length} 个 ===\n`);
if (failed.length > 0) {
  for (const f of failed) {
    process.stdout.write(`  ✗ agent ${pad2(f.id)}: detail=${f.detailOk} ws=${f.workspaceOk} errs=${f.errorCount}\n`);
    f.errors.forEach((e) => process.stdout.write(`      · ${e}\n`));
  }
}
process.stdout.write(`报告：${reportPath}\n截图目录：${OUT_DIR}\n`);
process.exit(failed.length > 0 ? 1 : 0);

// 注：playwright 须已安装。如缺浏览器内核：npx playwright install chromium
