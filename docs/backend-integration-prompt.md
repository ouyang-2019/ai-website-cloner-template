# AUBEAU 前后端打通提示词（粘贴到 aubeau 后端项目使用）

> 把下面整段提示词粘贴到 aubeau 后端项目的 Claude/agent 里，让它基于此实现后端 API。
> 配套契约详见：`ai-website-cloner-template/docs/api-contract.md`

---

## 提示词正文（从此处复制）

你是 AUBEAU 后端工程师。AUBEAU 是企业级智能体协作平台，前端（Next.js 16，位于 `ai-website-cloner-template/`）**已完整就绪，全部用 mock 数据**。你的任务是在当前后端项目（`backend/`，FastAPI + SQLAlchemy + Alembic）实现真实 API，与前端契约严格对齐，让前端从 mock 切换到真实数据。

### 一、前端契约（必须遵守）

完整契约见 `ai-website-cloner-template/docs/api-contract.md`。核心要点：

**技术约定**
- API 前缀 `/api`；鉴权 `Authorization: Bearer <token>`；租户隔离由后端按 token 注入 `tenant_id`，前端不传。
- 流式接口（对话回复、PPT 生成）必须用 **SSE（text/event-stream）**，逐 token/逐页推送。
- 列表统一分页 `?page=&size=`，响应 `{items, total}`。

**必须实现的 API（按优先级）**

P0 先通：
- `POST /api/auth/login` · `GET /api/users/me`
- `GET /api/credits/balance` · `GET /api/credits/transactions`
- `GET /api/agents`（支持 `category/q/sort/scope/page`）· `GET /api/agents/:id`
- `GET /api/categories` · `GET /api/skills`
- `POST /api/chat/sessions` · `GET /api/chat/sessions` · `GET /api/chat/sessions/:id/messages`
- `POST /api/chat/sessions/:id/messages`（**SSE 流**，见下）

P1：
- `POST /api/credits/spend` · `POST /api/credits/refund` · `POST /api/credits/claim-weekly`（`claim-daily` 仅作兼容旧路径）
- `GET /api/scheduled-tasks` · `POST` · `PATCH /:id` · `DELETE`
- `GET /api/projects` · `POST`

P2：
- `GET /api/billing/plans` · `POST /api/billing/orders` · `GET /api/billing/orders/:id` · `POST /api/billing/webhook`
- `POST /api/ppt/generate`（**SSE 流**，逐页 HTML）· `GET /api/ppt/jobs/:jobId/download`
- `GET /api/artifacts` · `GET /api/artifacts/:id`
- `GET /api/data-sources` · `GET /api/agents/:id/workspace` · `GET /api/agents/:id/memory` · `GET /api/agents/:id/evolution`

**对话 SSE 契约（最关键）**
```
POST /api/chat/sessions/:id/messages
Body: {text, mountedAgentId?, skillIds:[], pptConfig?:{pages,size,template}, target?}
Response: text/event-stream
event: token     data: {text}
event: tool_call data: {tool, args}
event: artifact  data: {artifactId, type}
event: credits   data: {cost, balance}      // 实际扣费
event: done      data: {messageId}
```

**PPT 生成 SSE 契约**
```
POST /api/ppt/generate
Body: {theme, templateId, sizeId, pages}
event: page     data: {pageNo, total, type, html}
event: credits  data: {cost, balance}
event: done     data: {jobId, downloadUrl}
```

### 二、数据模型（与前端 type 对齐）

```python
# 智能体
class Agent:
    id: int
    title: str
    cover: str
    min_tier: Optional[Literal["free","starter","pro","ultra","business"]]
    category: Literal["doc","sheet","video","research","writing","channel"]
    tagline: str
    capability: Literal["orchestration","tool-call","memory-retrieval","artifact-publish","im-channel","autonomous-trigger","chat"]
    complexity: Literal["light","standard","heavy"]
    tools: list[str]
    skill_ref: str

# 积分
class CreditBalance: balance:int; plan:str; monthly_credits:int; used_credits:int; expires_at:str
class CreditTransaction: id; type:Literal["spend","recharge","refund","daily"]; amount:int; reason:str; created_at:str
class PlanConfig: key; display_name; monthly_price; yearly_price; monthly_credits; daily_credits;
                  max_concurrent_tasks; max_agents; watermark:bool; long_term_memory:bool; accent:str; features:list[str]

# 对话
class ChatSession: id; title; updated_at
class Message: id; role:Literal["user","assistant"]; text; created_at

# PPT
class PptTemplate: id; name; desc; accent; bg; surface; text; muted; dark:bool
class PptSize: id; name; w:int; h:int; desc; badge
class PptPage: type:Literal["cover","agenda","section","data","quote","closing"]; title; page_no; total; html

# 其他
class ScheduledTask: id; title; cron; status:Literal["running","paused"]; agent_id; last_run; next_run; total_runs; credits_used
class Project: id; name; cover; agent_id; updated_at; status:Literal["active","idle","archived"]; credits_used
class Artifact: id; type:Literal["report","doc","video","channel","ppt"]; title; html; meta; created_at
class DataSource: key; name; desc; api_count; domain; tags:list[str]
```

前端现有 53 个智能体（`data/content.ts`）、12 个技能（`data/skills.ts`）、8 个数据源（`data/data-sources.ts`）、5 个套餐（`lib/credits.ts` 的 PLAN_CONFIGS）、8 个 PPT 模板（`data/ppt.ts`）——请用这些作为种子数据写 Alembic seed migration，保证前端切换后内容一致。

### 三、必须遵守的安全/业务不变量

1. **积分预扣 + 实扣 + 退款**：任务前按预估预扣（reserve）；完成后按实际消耗 settle，差额 refund；任何失败必退。
2. **租户隔离**：所有持久化与查询带 `tenant_id` 过滤。
3. **默认拒绝**：高风险工具（删除/外发/支付/读密钥/定时任务创建）必须二次审批。
4. **记忆=数据非指令**：注入 prompt 的记忆后端标记为 data，不可执行。
5. **IM 输入不可信**：IM 渠道消息净化后再入上下文。
6. **模型密钥不出后端**：前端永不接触模型 provider key；沙箱零密钥。
7. **工件不回原文到模型上下文**：只回 artifact_id + 元数据。

### 四、实现步骤（建议顺序）

1. 读 `ai-website-cloner-template/docs/api-contract.md` + 前端 `src/types/`、`src/data/` 确认契约与种子。
2. 建 SQLAlchemy 模型 + Alembic 迁移 + seed（用前端 mock 作为种子数据）。
3. P0：auth + credits balance/transactions + agents/categories/skills 列表 + 对话 SSE（先打通最小流：token + done）。
4. P1：积分 spend/refund + 定时任务 + 项目。
5. P2：支付（支付宝 + LemonSqueezy webhook）+ PPT 生成 SSE + 工件 + 数据源 + 工作空间/记忆/进化。
6. 每个 API 写 pytest（参考前端契约的请求/响应结构）。
7. 与前端联调：前端把 `CreditsProvider` 与各页 mock 替换为 `fetch` 调用真实 API（见下方切换清单）。

### 五、验收标准

- [ ] 前端登录后，所有页面数据来自真实 API（非 mock 常量）。
- [ ] 对话发送 → SSE 逐 token 流式显示 + `credits` 事件更新余额。
- [ ] 挂载 PPT 技能 + 配置发送 → 流式收到逐页 HTML。
- [ ] 积分：运行扣费、失败退款、每周领取、套餐升级全链路正确。
- [ ] 定时任务/项目 CRUD 生效；定时任务到点触发 agent（可 mock 执行）。
- [ ] 支付：下单→扫码/跳转→webhook 回调→套餐生效+积分到账。
- [ ] 所有查询带租户隔离；高风险操作默认拒绝。
- [ ] `pytest` 绿；前端 `npm run build` 绿。

### 六、前端 mock → 真实 API 切换点（联调时改这些）

| 前端位置 | 当前 mock | 改为 |
|---|---|---|
| `credits-provider.tsx` 的 useState | 本地 balance/tx | `fetch("/api/credits/balance")` + `fetch("/api/credits/transactions")` |
| `credits-provider.tsx` 的 spend/refund/claimDaily | 本地运算 | `POST /api/credits/spend` 等 |
| `chat/page.tsx` 的 `mockReply` setTimeout | 本地 | `fetch` + SSE 消费（EventSource 或 ReadableStream） |
| `explore/skills/projects/scheduled-tasks` 页 | 硬编码数组 | `GET /api/agents` 等 |
| `create/ppt` 的 `generateDeck` | 本地 HTML | `POST /api/ppt/generate` SSE |
| `pricing` + `checkout-drawer` | mock 处理 | `POST /api/billing/orders` + 轮询 |
| `agents/[id]` 的工作空间/记忆/进化/工件 | 从 card 派生 | `GET /api/agents/:id/workspace` 等 |

### 七、输出要求

- 先输出一份「实现计划」（模型 + 迁移 + API 顺序 + 风险点），等我确认后再写代码。
- 每个 API 实现后附 curl 测试样例。
- 遇到契约歧义，先停下来问我，不要擅自偏离前端契约。

开始：先读 `ai-website-cloner-template/docs/api-contract.md`，然后给出实现计划。

---

## 使用说明

1. 先在前端项目确认 `docs/api-contract.md` 已生成（如未生成，让前端 agent 跑一遍总结）。
2. 在 aubeau 后端项目根目录启动 Claude，粘贴上面「提示词正文」。
3. 后端会先给实现计划，确认后逐 API 实现。
4. 联调时按「前端切换点」表格，把前端 mock 逐个替换为 `fetch`。
5. 前端 base URL 建议：`NEXT_PUBLIC_API_BASE`（默认 `/api`，dev 用 `http://localhost:8000/api`，配 `rewrites` 代理避免 CORS）。
