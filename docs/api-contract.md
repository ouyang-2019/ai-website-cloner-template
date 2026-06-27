# AUBEAU 前端 ↔ 后端 API 对接契约 v2

> 用途：前端已就绪（真实接入 + 失败回落 mock），本文是后端实现接口的唯一对齐依据。
> 生成日期：2026-06-26 · 前端项目：`ai-website-cloner-template`（Next.js 16 / React 19 / TS strict）

---

## 一、总览

| 项 | 内容 |
|---|---|
| 框架 | Next.js 16.2.1（App Router，Turbopack）· React 19.2.4 · **TypeScript strict（禁 `any`）** |
| UI | Tailwind CSS v4（oklch 设计令牌，CSS 变量）· lucide-react · `cn()` 工具 |
| 状态 | 全局 `CreditsProvider`（积分/套餐/toast）+ 各页本地 `useState` |
| 数据 | `src/data/*.ts` mock 常量 + `src/lib/*.ts` 派生；`output: standalone` |
| 鉴权 | `Authorization: Bearer <token>`；token 存 `localStorage["aubeau_token"]`（或 `NEXT_PUBLIC_AUBEAU_DEMO_TOKEN`） |
| API 基址 | `NEXT_PUBLIC_API_BASE`（默认 `/api`）→ 经 `src/app/api/[...path]/route.ts` 反代到 `AUBEAU_BACKEND_URL`；**未配置返回 503** |
| 容错模式 | **fetch + 回落**：每个接口 `apiFetch(...).then(setX).catch(() => setX(SEED))`，前端可独立运行 |

### 路由清单（14）
| 路由 | 文件 | 说明 |
|---|---|---|
| `/` | `app/page.tsx` | 工作台首页：Hero（主技能挂载 + 全部技能入口）+ 热门智能体画廊 |
| `/login` | `app/login/page.tsx` | 登录/注册（密码·验证码·注册三态，loomic 视觉） |
| `/explore` | `app/explore/page.tsx` | 探索智能体（分类/搜索/排序） |
| `/agents/[id]` | `app/agents/[id]/page.tsx` | 智能体详情（工件/进化/工作空间/数据源/运行→项目） |
| `/projects` | `app/projects/page.tsx` | 项目列表（→ `/projects/[id]`） |
| `/projects/[id]` | `app/projects/[id]/page.tsx` | **项目工作台**：项目级会话（按 `projectId` 隔离）+ 流式对话 + 进度 |
| `/chat` | `app/chat/page.tsx` | **重定向**到默认活跃项目（透传 `?agent=&skill=`），保留旧入口 |
| `/knowledge-base` | `app/knowledge-base/page.tsx` | 知识库：文件夹树 + 文档列表 + 全 CRUD |
| `/workflow` | `app/workflow/page.tsx` | 工作流：模板落地页 → 画布编辑器（节点=智能体） |
| `/skills` | `app/skills/page.tsx` | 技能广场 |
| `/create/ppt` | `app/create/ppt/page.tsx` | PPT 独立创作流（SSE 逐页） |
| `/scheduled-tasks` | `app/scheduled-tasks/page.tsx` | 定时任务 |
| `/pricing` | `app/pricing/page.tsx` | 定价 + 支付抽屉 |
| `/api/[...path]` | `app/api/[...path]/route.ts` | 反代 → `AUBEAU_BACKEND_URL` |

### 共享外壳（`AppShell`）
`SiteHeader(54px)` + `main[Sidebar(主轨60 + 副面板230，可折叠，边缘把手) | 内容]` + `SiteFooter(fixed 32px)` + 全局 `ImFab`（右下角 IM 渠道弹窗）。所有业务页用 `<AppShell>`；`/login` 独立全屏。

---

## 二、通用约定

1. **前缀**：所有业务接口走 `/api` 前缀（前端 `apiFetch("/x")` → `${API_BASE}/x`）。
2. **鉴权**：除 `POST /auth/login`、`POST /auth/register`、`POST /billing/webhook` 外，全部需 `Authorization: Bearer <token>`。
3. **租户隔离**：所有查询/写入由后端按 token 解析的 `tenant_id` 过滤，**前端不传 `tenant_id`**。
4. **分页**：列表统一 `?page=&size=`，响应 `{ items: T[], total: number }`（部分历史接口返回裸数组，后端可二者兼容）。
5. **错误**：非 2xx 抛错（前端 catch 回落 mock）；业务错误返回 `{ detail: string }` 或 RFC7807。
6. **流式**：对话回复、PPT 生成、工作流运行**必须 SSE**（`text/event-stream`，`event:` + `data: JSON`）。
7. **积分**：前端先 `POST /credits/estimate` 做用前预估；不足时页面内锁定为积分处理视图，只提供充值/升级跳转；充足后再 `spend()` 预扣 → 后端预留额度；任务结束发实际消耗 `credits` 事件；差额 `refund`；失败必退。
8. **模型密钥**：前端**永远不接触**模型 provider key。
9. **记忆 = 数据**：注入 prompt 的记忆后端须标记为 data，不可执行。
10. **默认拒绝**：高风险工具（删除/外发/支付/读密钥）后端必须二次审批。

---

## 三、接口分域

### 1. 认证（`/auth`）
| # | 方法 | 路径 | 请求 body | 响应 |
|---|---|---|---|---|
| 1.1 | POST | `/auth/login` | `{ account: string, password: string }`（account=手机号/邮箱） | `{ token: string, user: User }` |
| 1.2 | POST | `/auth/register` | `{ account, password, inviteCode?: string }` | `{ token, user }` |
| 1.3 | POST | `/auth/sms-code` | `{ phone, scene: "login"\|"register" }` | `{ ok: true }` |
| 1.4 | POST | `/auth/login-by-code` | `{ phone, code }` | `{ token, user }` |
| 1.5 | GET | `/users/me` | — | `{ id, name, avatar, tenantId }` |

> 前端 `AuthResponse` 兼容 `token` 或 `access_token` 字段。验证码登录当前为 demo（本地发 token），真实联调需实现 1.3/1.4。

### 2. 积分与计费（`/credits` · `/billing`）— `CreditsProvider`
| # | 方法 | 路径 | 请求 | 响应 |
|---|---|---|---|---|
| 2.1 | GET | `/credits/balance` | — | `{ balance, plan, monthlyCredits, usedCredits, expiresAt }` |
| 2.2 | GET | `/credits/transactions?page=&size=` | — | `{ items: CreditTransaction[], total }` |
| 2.2a | POST | `/credits/estimate` | `{ capability, complexity?, model?, expectedRounds?, perRoundWorstCredits?, knownToolCredits? }` | `{ allowed, lock, verdict:"ok"\|"partial"\|"blocked", low, high, available, reachableRounds, topupNeeded, shortfall, rechargeUrl, upgradeUrl, note }` |
| 2.3 | POST | `/credits/spend` | `{ amount, reason, refId? }` | `{ ok, balance, txId }`；不足 `{ ok:false, shortfall }` |
| 2.4 | POST | `/credits/refund` | `{ amount, reason, txId? }` | `{ balance }` |
| 2.5 | POST | `/credits/claim-weekly` | — | `{ claimed, amount, balance, weeklyClaimed }` 或 `{ error:"already_claimed" }` |
| 2.5a | POST | `/credits/claim-daily` | — | 同 2.5（兼容旧路径，语义为每周领取） |
| 2.6 | GET | `/billing/plans` | — | `PlanConfig[]` |
| 2.7 | GET | `/credits/costs` | — | `{ [capability]: { [complexity]: cost } }` |
| 2.8 | POST | `/billing/orders` | `{ plan, period:"monthly"\|"yearly", method:"alipay"\|"lemonsqueezy" }` | `{ orderId, payUrl\|qrUrl, amount }` |
| 2.9 | GET | `/billing/orders/:id` | — | `{ status:"pending"\|"paid"\|"failed", plan? }` |
| 2.10 | POST | `/billing/webhook` | 支付宝/LemonSqueezy webhook | —（无需鉴权） |

### 3. 智能体与技能
| # | 方法 | 路径 | 请求 | 响应 |
|---|---|---|---|---|
| 3.1 | GET | `/agents?category=&q=&sort=hot\|new\|cost&scope=public\|mine&page=&size=` | — | `{ items: Agent[], total }` |
| 3.2 | GET | `/agents/:id` | — | `Agent` |
| 3.3 | GET | `/agents?sort=hot&size=12` | — | 热门子集（首页画廊） |
| 3.4 | GET | `/categories` | — | `CategoryMeta[]`（含各类 count） |
| 3.5 | GET | `/skills?category=&q=` | — | `SkillEntry[]` |
| 3.6 | GET | `/agents/:id/workspace` | — | `{ identity, router[], outputRules[], conduct[] }` |
| 3.7 | GET | `/agents/:id/memory` | — | `{ items: MemoryEntry[] }` |
| 3.8 | GET | `/agents/:id/evolution` | — | `{ version, runs, confidence, evidence, triggers[] }` |

### 4. 模型（`/models`）
| # | 方法 | 路径 | 响应 |
|---|---|---|---|
| 4.1 | GET | `/models` | `ModelOption[]`（`{ id, name, vendor?, desc?, badge? }`，含 `id:"auto"` 智选） |

> 前端 `src/data/models.ts` 内置 `MODELS` 常量（智选/Claude Opus·Sonnet/GPT-5/DeepSeek/Qwen），后端就绪后由本接口替换。`auto`=智选，由编排引擎自动匹配。

### 5. 项目（`/projects`）
| # | 方法 | 路径 | 请求 | 响应 |
|---|---|---|---|---|
| 5.1 | GET | `/projects?q=&status=` | — | `Project[]` |
| 5.2 | GET | `/projects/:id` | — | `Project` |
| 5.3 | POST | `/projects` | `{ name, agentId? }` | `Project` |
| 5.4 | PATCH | `/projects/:id` | `{ name? }` / `{ status }` | `Project` |

> 运行智能体（详情页）→ 前端选/建项目后跳 `/projects/:id?agent=<id>`，进入即预挂载并锁定该智能体（对标天工：选定即锁定，项目内技能/附件/模型仍可调）。

### 6. 对话会话（`/chat/sessions`，按项目隔离）
| # | 方法 | 路径 | 请求 | 响应 |
|---|---|---|---|---|
| 6.1 | GET | `/chat/sessions?projectId=` | — | `ChatSession[]`（含 `projectId`） |
| 6.2 | POST | `/chat/sessions` | `{ projectId, title? }` | `ChatSession` |
| 6.3 | GET | `/chat/sessions/:id/messages?page=` | — | `ChatMessage[]` |
| 6.4 | PATCH | `/chat/sessions/:id` | `{ title? }` / `{ archived:bool }` / `{ projectId }`（移动） | `ChatSession` |
| 6.5 | DELETE | `/chat/sessions/:id` | — | 204 |

> ⚠️ 6.1 必须按 `projectId` 过滤（这是修复"会话历史串台"的关键）。前端目前对重命名/归档/移动做乐观本地更新 + best-effort PATCH，后端实现后即真实持久化。

### 7. 对话发送（**核心 SSE**）— `POST /chat/sessions/:id/messages`
```
Body:
{
  "text": "string",
  "mountedAgentId": 2,            // 选定后锁定（项目内不可改）
  "skillIds": ["ppt"],            // 多选技能
  "model": "auto",                // 见 §4
  "target": "本次目标（可选）",
  "attachments": [                // 见 §8
    { "id":"att-1", "name":"a.pdf", "kind":"file", "size":12345 },
    { "id":"att-2", "name":"https://...", "kind":"link", "url":"https://..." }
  ],
  "pptConfig": {                  // 仅当 skillIds 含 "ppt"
    "pages": 9,                   // 5|9|15|25 或自定义 1–60
    "size": "wide",               // wide|standard|vertical|square
    "template": "auto"            // "auto"(智选) 或 PPT_TEMPLATES.id
  }
}

Response: text/event-stream
event: token      data: { "text": "..." }          // 逐 token（流式）
event: tool_call  data: { "tool": "...", "args": {...} }
event: artifact   data: { "artifactId": "...", "type": "report|doc|video|channel|ppt" }
event: credits    data: { "cost": 12, "balance": 488 }   // 本次实扣 + 余额（done 前发）
event: done       data: { "messageId": "..." }
```
> 前端据事件驱动**进度条**：理解任务 → 检索记忆 → 调用工具 → 生成回复 → 发布工件。前端预扣 `spend()`，后端 `done` 前发实际 `credits`，差额 `refund`。

### 8. 附件（`/attachments`）
| # | 方法 | 路径 | 请求 | 响应 |
|---|---|---|---|---|
| 8.1 | POST | `/attachments` | `multipart/form-data`（多文件） | `{ id, name, size, url? }[]` |

> 前端 `ChatComposer` 支持文件多选 + 添加链接，生成 `{id,name,kind,size/url}` 随 §7 body 发送。8.1 用于真正落盘/向量化；链接类前端本地生成、后端在消息发送时校验/抓取。

### 9. 知识库（`/knowledge-base`）— 全 CRUD
| # | 方法 | 路径 | 请求 | 响应 |
|---|---|---|---|---|
| 9.1 | GET | `/knowledge-base/folders` | — | `KnowledgeFolder[]` |
| 9.2 | POST | `/knowledge-base/folders` | `{ name, parentId? }` | `KnowledgeFolder` |
| 9.3 | PATCH | `/knowledge-base/folders/:id` | `{ name? }` / `{ parentId? }` | `KnowledgeFolder` |
| 9.4 | DELETE | `/knowledge-base/folders/:id` | — | 204（文档移至 root/未分类） |
| 9.5 | GET | `/knowledge-base/docs?folderId=` | — | `KnowledgeDoc[]` |
| 9.6 | POST | `/knowledge-base/docs` | `multipart`（上传）或 `{ name, url, folderId, source:"upload"\|"link"\|"drive" }` | `{ doc, status:"indexing" }` |
| 9.7 | PATCH | `/knowledge-base/docs/:id` | `{ name? }` / `{ folderId? }`（移动） | `KnowledgeDoc` |
| 9.8 | DELETE | `/knowledge-base/docs/:id` | — | 204 |
| 9.9 | GET | `/knowledge-base/docs/:id` | — | `{ status:"ready"\|"failed", chunks }`（向量化完成轮询/SSE） |

> 上传后前端乐观置 `indexing`，~1.2s 翻 `ready`（演示）；真实由后端向量化后通过 9.9 轮询或 SSE 回写 `status`/`chunks`。

### 10. PPT 生成（`/ppt`）
| # | 方法 | 路径 | 请求 | 响应 |
|---|---|---|---|---|
| 10.1 | GET | `/ppt/templates` | — | `PptTemplate[]` |
| 10.2 | GET | `/ppt/sizes` | — | `PptSize[]` |
| 10.3 | POST | `/ppt/generate` | `{ theme, templateId, sizeId, pages }` | **SSE**：见下 |
| 10.4 | GET | `/ppt/jobs/:jobId/download` | — | `application/vnd...pptx` |

**10.3 SSE 契约**：
```
event: page     data: { pageNo, total, type:"cover"|"agenda"|"section"|"data"|"quote"|"closing", title, html }
event: credits  data: { cost, balance }
event: done     data: { jobId, downloadUrl }
```

### 11. 工作流（`/workflows`）— 智能体编排画布
| # | 方法 | 路径 | 请求 | 响应 |
|---|---|---|---|---|
| 11.1 | GET | `/workflows` | — | `Workflow[]`（落地页"我的工作流"） |
| 11.2 | POST | `/workflows` | `Workflow`（nodes/edges） | `{ id }` |
| 11.3 | GET | `/workflows/:id` | — | `Workflow` |
| 11.4 | PUT | `/workflows/:id` | `Workflow` | `Workflow` |
| 11.5 | DELETE | `/workflows/:id` | — | 204 |
| 11.6 | GET | `/workflow-templates` | — | `WorkflowTemplate[]`（落地页模板库，可选） |
| 11.7 | POST | `/workflows/:id/run` | — | **SSE**：见下 |

**11.7 运行 SSE 契约**（按拓扑执行 agent 节点）：
```
event: node-start data: { nodeId }
event: node-done  data: { nodeId, artifactId? }
event: credits    data: { cost, balance }
event: done       data: { runId }
```

### 12. 定时任务（`/scheduled-tasks`）
| # | 方法 | 路径 | 请求 | 响应 |
|---|---|---|---|---|
| 12.1 | GET | `/scheduled-tasks?status=` | — | `ScheduledTask[]` |
| 12.2 | POST | `/scheduled-tasks` | `{ title, cron, agentId, config }` | `ScheduledTask` |
| 12.3 | PATCH | `/scheduled-tasks/:id` | `{ status:"running"\|"paused" }` | `ScheduledTask` |
| 12.4 | DELETE | `/scheduled-tasks/:id` | — | 204 |
| 12.5 | POST | `/scheduled-tasks/:id/run` | — | `{ ok }`（手动触发） |

### 13. 工件（`/artifacts`）
| # | 方法 | 路径 | 响应 |
|---|---|---|---|
| 13.1 | GET | `/artifacts?agentId=&projectId=&type=` | `Artifact[]` |
| 13.2 | GET | `/artifacts/:id` | `{ type, html, meta }` |
| 13.3 | GET | `/artifacts/:id/download` | 文件流 |

### 14. 数据源（`/data-sources`）
| # | 方法 | 路径 | 响应 |
|---|---|---|---|
| 14.1 | GET | `/data-sources` | `DataSource[]` |
| 14.2 | POST | `/data-sources/:key/query` | `{ method, params }` → 结果（预留） |

### 15. IM 渠道（`/im`）— 右下角 FAB
| # | 方法 | 路径 | 请求 | 响应 |
|---|---|---|---|---|
| 15.1 | GET | `/im/channels` | — | `{ id, name, connected:bool }[]`（微信/企业微信/飞书/钉钉/Slack/Discord/Telegram） |
| 15.2 | POST | `/im/connect` | `{ channel, auth?:{...} }` | `{ ok, url? }`（OAuth 跳转/回调） |
| 15.3 | DELETE | `/im/channels/:id` | — | 204（解绑） |

> 当前为占位（点击渠道 toast）。渠道集合：微信、企业微信、飞书、钉钉、Slack、Discord、Telegram（前端 `im-fab.tsx` 内置品牌色 + 单字标识）。

---

## 四、数据模型（对应 `src/types`）

```ts
// —— 鉴权 ——
interface User { id: string; name: string; avatar?: string; tenantId: string; }

// —— 智能体 / 技能 ——
type AgentCapability = "orchestration"|"tool-call"|"memory-retrieval"|"artifact-publish"|"im-channel"|"autonomous-trigger"|"chat";
type TaskComplexity = "light"|"standard"|"heavy";
type SubscriptionPlan = "free"|"starter"|"pro"|"ultra"|"business";
type AgentCategory = "beauty"|"doc"|"sheet"|"video"|"research"|"writing"|"channel";

interface Agent {                              // = TemplateCard 扩展
  id: number; title: string; cover: string; minTier?: SubscriptionPlan;
  category: AgentCategory; tagline: string;
  capability: AgentCapability; complexity: TaskComplexity;
  tools: string[]; skillRef: string;
}
interface CategoryMeta { key: AgentCategory; label: string; icon: string; accent: string; blurb: string; count?: number; }
interface SkillEntry { id: string; name: string; desc: string; icon: string; category: AgentCategory; cover: string; href: string; badge?: string; uses: number; }

// —— 对话 / 挂载 ——
interface ChatSession { id: string; title: string; projectId: string; updatedAt?: string; archived?: boolean; }
interface ChatMessage { id: string; role: "user"|"assistant"; text: string; createdAt?: string; }
interface ComposerAttachment { id: string; name: string; kind: "file"|"link"; size?: number; url?: string; }
interface ModelOption { id: string; name: string; vendor?: string; desc?: string; badge?: string; }   // id="auto"=智选

// —— 项目 ——
interface Project { id: string; name: string; cover: string; agentId: number; updatedAt: string; status: "active"|"idle"|"archived"; creditsUsed: number; }

// —— 知识库 ——
interface KnowledgeFolder { id: string; name: string; parentId: string | null; count?: number; }
interface KnowledgeDoc {
  id: string; name: string; folderId: string;
  source: "upload"|"link"|"drive"; size?: string; updatedAt: string;
  status: "ready"|"indexing"|"failed"; chunks?: number;
}

// —— 工作流（节点 = 智能体） ——
interface WorkflowAgentNodeData { agentId: number; title: string; cover: string; category: AgentCategory; accent: string; capability: string; }
interface WorkflowNode { id: string; type: "start"|"end"|"agent"; position: { x: number; y: number }; data: WorkflowAgentNodeData | Record<string, unknown>; }
interface WorkflowEdge { id: string; source: string; target: string; }
interface Workflow { id: string; name: string; nodes: WorkflowNode[]; edges: WorkflowEdge[]; updatedAt?: string; }

// —— PPT ——
interface PptTemplate { id: string; name: string; desc: string; accent: string; bg: string; surface: string; text: string; muted: string; dark?: boolean; }   // id="auto"=智选
interface PptSize { id: string; name: string; w: number; h: number; desc: string; badge?: string; }
interface PptPage { type: "cover"|"agenda"|"section"|"data"|"quote"|"closing"; title: string; pageNo: number; total: number; html: string; }

// —— 定时 / 工件 / 数据源 / 积分 ——
interface ScheduledTask { id: string; title: string; cron: string; status: "running"|"paused"; agentId: number; lastRun?: string|null; nextRun?: string|null; totalRuns: number; creditsUsed: number; }
interface Artifact { id: string; type: "report"|"doc"|"video"|"channel"|"ppt"; title: string; html: string; meta: Record<string, unknown>; createdAt: string; }
interface DataSource { key: string; name: string; desc: string; apiCount: number; domain: string; tags: string[]; }

interface CreditBalance { balance: number; plan: SubscriptionPlan; monthlyCredits: number; usedCredits: number; expiresAt: string; weeklyClaimed?: boolean; dailyClaimed?: boolean; }
interface CreditTransaction { id: string; transactionType: "task_deduct"|"task_refund"|"weekly_grant"|"daily_grant"|"purchase"|"bonus"; amount: number; balanceAfter: number; taskId?: string|null; description?: string|null; createdAt: string; }
interface PlanConfig { key: SubscriptionPlan; displayName: string; monthlyPrice: number; yearlyPrice: number; monthlyCredits: number; weeklyCredits: number; dailyCredits?: number; maxConcurrentTasks: number; maxAgents: number; watermark: boolean; longTermMemory: boolean; accent: string; features: string[]; }
```

### 美妆行业壁垒智能体

`/agents` 目录必须包含 `category="beauty"` 的行业壁垒 agent。它们替代原先“高级功能=通用 PPT/建站/调研/渠道集成”的产品定位；通用功能仍保留为普通 agent 或技能入口。

| skillRef | 名称 | minTier | 输出边界 |
|---|---|---|---|
| `cosmetic_formula_review` | AI 智妆 · 配方审核智能体 | `pro` | 配方审核结论、风险分级、证据表 |
| `cosmetic_safety_report` | AI 智妆 · 安评报告智能体 | `ultra` | Word/Excel 安评报告与计算底表 |
| `cosmetic_ingredient_compliance` | AI 智妆 · 原料合规评审 | `pro` | 原料法规卡、限用量、标签/风险要求 |
| `cosmetic_claim_compliance` | AI 智妆 · 文案合规评审 | `pro` | 文案风险点、合规改写、法规证据 |
| `cosmetic_artwork_consistency` | AI 智妆 · 稿件一致性审核 | `pro` | 包装稿/备案资料/全成分差异清单 |
| `cosmetic_reference_formula` | AI 智妆 · 参考配方生成 | `business` | 参考配方草案、verifier 报告；最高级订阅解锁 |
| `beauty_trend_radar` | 爆品趋势雷达智能体 | `ultra` | 只展示趋势报告和抓取数据报表；PPT、自媒体文案归普通 agent |
| `beauty_competitor_due_diligence` | 竞品背调智能体 | `ultra` | 暖色六维竞品背调报告 |
| `beauty_ingredient_research_gray` | 灰度 · 原料调研智能体 | `business` | 供应商、牌号、价格范围、功效、用量、品牌应用 |
| `beauty_factory_research_gray` | 灰度 · 化妆品工厂调研 | `business` | 工厂规模、客户、财务、法规风险、优势 |
| `beauty_brand_research_gray` | 灰度 · 品牌调研智能体 | `business` | 品牌定位、公司穿透、渠道、爆品结构、口碑风险 |
| `beauty_packaging_research_gray` | 灰度 · 包材调研智能体 | `business` | 包材供应商、工艺、MOQ、报价区间、适配剂型、交期 |

---

## 五、对接优先级

| P0（先通·MVP） | P1 | P2 |
|---|---|---|
| 1.1/1.2 登录注册 · 2.1 余额 · 3.1/3.2 智能体 · 3.5 技能 · 6.1/6.3 会话 · **7 对话 SSE** | 2.3/2.4 积分消费退款 · 5 项目 · 6.4 会话编辑 · 12 定时任务 · 4 模型 · 11.7 工作流运行 SSE | 支付(2.8/2.9) · PPT(10) · 工件(13) · 数据源(14) · IM(15) · 工作空间/记忆(3.6/3.7) |

---

## 六、环境变量

| 变量 | 用途 | 默认 |
|---|---|---|
| `AUBEAU_BACKEND_URL` | `/api/[...path]` 反代目标；未设→503 | — |
| `NEXT_PUBLIC_API_BASE` | 前端 `apiFetch` 基址 | `/api` |
| `NEXT_PUBLIC_AUBEAU_DEMO_TOKEN` | 未登录时的 demo token（SSR/本地） | — |

---

## 七、验证清单（后端自测）

- [ ] 登录返回 `token`；后续请求带 `Bearer` 能通过。
- [ ] `GET /chat/sessions?projectId=p1` **只返回** p1 的会话（不串台）。
- [ ] `POST /chat/sessions/:id/messages` 返回 SSE，含 `token/tool_call/artifact/credits/done` 事件。
- [ ] 知识库 9.x 全 CRUD；上传后 `indexing→ready` 可查。
- [ ] 工作流 `POST /workflows/:id/run` 返回 SSE，按拓扑 `node-start/node-done`。
- [ ] 积分 `spend` 预扣 + `done` 前发 `credits` 实扣 + 失败 `refund`。
- [ ] 租户隔离：A 租户看不到 B 租户数据。
