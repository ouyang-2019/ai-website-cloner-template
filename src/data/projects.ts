import type { ChatSession, ChatMessage, ArtifactDetail } from "@/types";
import { TEMPLATE_CARDS } from "@/data/content";

/** 项目状态（与 api-contract Project 同构）。 */
export type ProjectStatus = "active" | "idle" | "archived";

export interface Project {
  id: string;
  name: string;
  cover: string;
  agentId: number;
  updatedAt: string;
  status: ProjectStatus;
  creditsUsed: number;
}

/**
 * 项目种子 — 后端 `GET /api/projects` 不可用时回落。
 * 与 `TEMPLATE_CARDS` 共享封面池，避免引入额外素材。
 */
export const PROJECTS: Project[] = [
  { id: "p1", name: "防晒配方审核", cover: TEMPLATE_CARDS[0].cover, agentId: 1, updatedAt: "2 小时前", status: "active", creditsUsed: 320 },
  { id: "p2", name: "驻留类产品安评报告", cover: TEMPLATE_CARDS[1].cover, agentId: 2, updatedAt: "昨天", status: "active", creditsUsed: 540 },
  { id: "p3", name: "原料合规批量评审", cover: TEMPLATE_CARDS[2].cover, agentId: 3, updatedAt: "3 天前", status: "idle", creditsUsed: 180 },
  { id: "p4", name: "功效宣称文案合规", cover: TEMPLATE_CARDS[3].cover, agentId: 4, updatedAt: "5 天前", status: "active", creditsUsed: 1250 },
  { id: "p5", name: "包装稿一致性复核", cover: TEMPLATE_CARDS[4].cover, agentId: 5, updatedAt: "1 周前", status: "idle", creditsUsed: 96 },
  { id: "p6", name: "参考配方生成灰盒验证", cover: TEMPLATE_CARDS[5].cover, agentId: 6, updatedAt: "2 周前", status: "archived", creditsUsed: 410 },
  { id: "p7", name: "爆品趋势雷达日报", cover: TEMPLATE_CARDS[6].cover, agentId: 7, updatedAt: "1 个月前", status: "archived", creditsUsed: 220 },
  { id: "p8", name: "小绿瓶竞品背调", cover: TEMPLATE_CARDS[7].cover, agentId: 8, updatedAt: "刚刚", status: "active", creditsUsed: 75 },
];

/** 按 id 取项目（回落 undefined）。 */
export function getProject(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}

/**
 * 会话种子 — 按 projectId 隔离。
 * 后端 `GET /api/chat/sessions?projectId=` 不可用时回落。
 */
export const SEED_SESSIONS: ChatSession[] = [
  { id: "p1-s1", title: "防晒配方审核", projectId: "p1", updatedAt: "2 小时前" },
  { id: "p1-s2", title: "儿童附加检查", projectId: "p1", updatedAt: "昨天" },
  { id: "p2-s1", title: "驻留类安评报告", projectId: "p2", updatedAt: "昨天" },
  { id: "p2-s2", title: "暴露参数补录", projectId: "p2", updatedAt: "3 天前" },
  { id: "p3-s1", title: "原料限用量复核", projectId: "p3", updatedAt: "3 天前" },
  { id: "p4-s1", title: "功效宣称合规改写", projectId: "p4", updatedAt: "5 天前" },
  { id: "p5-s1", title: "包装稿差异定位", projectId: "p5", updatedAt: "1 周前", archived: true },
  { id: "p8-s1", title: "小绿瓶竞品背调", projectId: "p8", updatedAt: "刚刚" },
];

/** 会话消息种子 — 后端 `GET /api/chat/sessions/:id/messages` 不可用时回落。
 *  assistant 消息已升级为富文本（markdown）+ 思考时间线 + 工具调用 + 工件引用，
 *  对标天工「对话输出 + 同步画布」模式。 */
export const SEED_MESSAGES: Record<string, ChatMessage[]> = {
  "p1-s1": [
    { id: "p1-s1-u1", role: "user", text: "请审核这份 SPF50+ 防晒配方，重点看防晒剂、儿童适用和限用量。" },
    {
      id: "p1-s1-a1",
      role: "assistant",
      text: `## 配方审核结论

已对 **SPF50+ 防晒配方** 完成 15 项法规检查，发现 **2 个 B 级预警**，审核报告工件已生成。

### 关键发现
- ✅ 防晒剂总量 \`28.5%\`，低于《化妆品安全技术规范》上限
- ⚠️ 二苯酮-3 含量 \`5.2%\`，超过儿童产品建议值（≤5%）
- ✅ 儿童附加检查：未检出尼泊金酯类防腐剂

### 法规对照

| 原料 | 含量 | 限值 | 判定 |
|---|---|---|---|
| 二苯酮-3 | 5.2% | 5%（儿童） | ⚠️ 儿童超限 |
| 奥克立林 | 8.0% | 10% | ✅ 合规 |
| 胡莫柳酯 | 6.3% | 10% | ✅ 合规 |

> 建议：面向儿童市场时将二苯酮-3 降至 5% 以下，或替换为乙基己基三嗪酮。

完整 15 项检查明细已发布为工件，点击下方卡片在画布查看。`,
      reasoning: [
        { step: "解析配方成分表", pct: 12 },
        { step: "检索《化妆品安全技术规范》", pct: 30 },
        { step: "调用儿童附加检查工具", pct: 55 },
        { step: "生成审核报告", pct: 80 },
        { step: "发布工件", pct: 100 },
      ],
      toolCalls: [
        { tool: "regulation_lookup", status: "done", summary: "安全技术规范" },
        { tool: "pediatric_check", status: "done", summary: "儿童附加检查" },
      ],
      artifacts: [{ artifactId: "p1-s1-art1", type: "report", title: "防晒配方审核报告" }],
    },
  ],
  "p2-s1": [
    { id: "p2-s1-u1", role: "user", text: "帮我基于这份驻留类面霜配方生成安评报告。" },
    {
      id: "p2-s1-a1",
      role: "assistant",
      text: `## 安评报告已生成

基于驻留类面霜配方，已完成**暴露评估**与**安全边际（MoS）**计算。

### 关键参数

| 参数 | 取值 | 来源 |
|---|---|---|
| 暴露量 | 1.54 g/d | SCCS 驻留类 |
| 皮肤吸收率 | 100% | 保守假设 |
| MoS | **1250** | ≥100 即安全 |

### 产物
- 📄 **Word 安评报告**（含 12 项原料评估 + MoS 计算过程）
- 📊 **Excel 计算底表**（暴露参数 / SED / MoS 公式）

> MoS 远高于 100，配方整体安全。报告待人工复核签发后可下载。`,
      reasoning: [
        { step: "解析配方与原料用量", pct: 15 },
        { step: "检索 SCCS 暴露参数", pct: 35 },
        { step: "计算 SED 与 MoS", pct: 65 },
        { step: "生成 Word/Excel 工件", pct: 90 },
        { step: "发布工件", pct: 100 },
      ],
      toolCalls: [
        { tool: "sccs_params", status: "done", summary: "暴露参数" },
        { tool: "mos_calculator", status: "done", summary: "MoS 计算" },
      ],
      artifacts: [{ artifactId: "p2-s1-art1", type: "doc", title: "驻留类面霜安评报告" }],
    },
  ],
  "p3-s1": [
    {
      id: "p3-s1-a1",
      role: "assistant",
      text: `## 等待原料清单上传

请上传原料清单（Excel/CSV），我将**批量查询**每项原料的：

- 法规**限用量**与使用范围
- **标签**强制要求
- **风险物质**监控清单
- 儿童 / 孕妇禁限用判定

> 支持格式：\`.xlsx\` \`.csv\` \`.txt\`，或直接粘贴成分表全文。

\`\`\`
原料名,含量%,功效,剂型
二苯酮-3,5.2,UV Filter,乳液
奥克立林,8.0,UV Filter,乳液
\`\`\``,
      reasoning: [{ step: "就绪 · 等待原料清单", pct: 5 }],
    },
  ],
};

/**
 * 工件种子（翡翠主题自包含 HTML）— 后端 §13.2 `GET /artifacts/:id` 不可用时回落。
 * 画布在 sandbox="" iframe 中渲染这些 HTML，演示产物同步展示。
 */
const DOC_SHELL = (title: string, badge: string, body: string): string =>
  `<!doctype html><html lang="zh"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>` +
  `*{box-sizing:border-box}body{margin:0;font-family:-apple-system,"PingFang SC",system-ui,sans-serif;color:#0f172a;background:#fff;padding:32px;line-height:1.7}` +
  `.hd{display:flex;align-items:center;gap:12px;padding-bottom:16px;border-bottom:3px solid #10b981;margin-bottom:20px}` +
  `.badge{width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#10b981,#34d399);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px}` +
  `h1{font-size:20px;margin:0}.sub{color:#64748b;font-size:12px;margin-top:2px}` +
  `h2{font-size:15px;color:#047857;margin:22px 0 10px;border-left:3px solid #10b981;padding-left:10px}` +
  `table{width:100%;border-collapse:collapse;font-size:13px;margin:10px 0}` +
  `th{background:#ecfdf5;color:#047857;padding:8px 10px;text-align:left;border-bottom:2px solid #10b981}` +
  `td{padding:8px 10px;border-bottom:1px solid #e2e8f0}` +
  `.warn{background:#fef3c7;color:#92400e;padding:8px 12px;border-radius:8px;border-left:3px solid #f59e0b;margin:12px 0;font-size:13px}` +
  `.ok{color:#047857;font-weight:600}.ng{color:#b45309;font-weight:600}p{margin:8px 0}</style></head><body>` +
  `<div class="hd"><div class="badge">${badge}</div><div><h1>${title}</h1><div class="sub">AUBEAU 智能体生成 · 翡翠主题预览</div></div></div>${body}</body></html>`;

export const SEED_ARTIFACTS: Record<string, ArtifactDetail> = {
  "p1-s1-art1": {
    id: "p1-s1-art1",
    type: "report",
    title: "防晒配方审核报告",
    html: DOC_SHELL("防晒配方审核报告", "审", `
      <h2>法规对照（节选）</h2>
      <table><thead><tr><th>原料</th><th>含量</th><th>限值</th><th>判定</th></tr></thead><tbody>
        <tr><td>二苯酮-3</td><td>5.2%</td><td>5%（儿童）</td><td class="ng">⚠️ 儿童超限</td></tr>
        <tr><td>奥克立林</td><td>8.0%</td><td>10%</td><td class="ok">合规</td></tr>
        <tr><td>胡莫柳酯</td><td>6.3%</td><td>10%</td><td class="ok">合规</td></tr>
      </tbody></table>
      <div class="warn">面向儿童市场建议：将二苯酮-3 降至 5% 以下，或替换为乙基己基三嗪酮。</div>
      <h2>结论</h2>
      <p>配方整体合规，仅二苯酮-3 在儿童场景需调整。完整 15 项检查明细见附件。</p>`),
  },
  "p2-s1-art1": {
    id: "p2-s1-art1",
    type: "doc",
    title: "驻留类面霜安评报告",
    html: DOC_SHELL("驻留类面霜安评报告", "安", `
      <h2>关键参数</h2>
      <table><thead><tr><th>参数</th><th>取值</th><th>来源</th></tr></thead><tbody>
        <tr><td>暴露量</td><td>1.54 g/d</td><td>SCCS 驻留类</td></tr>
        <tr><td>皮肤吸收率</td><td>100%</td><td>保守假设</td></tr>
        <tr><td>MoS</td><td class="ok">1250</td><td>≥100 安全</td></tr>
      </tbody></table>
      <h2>结论</h2>
      <p>MoS 远高于 100，配方整体安全。报告含 12 项原料评估与 MoS 计算过程，待人工复核签发。</p>`),
  },
};
