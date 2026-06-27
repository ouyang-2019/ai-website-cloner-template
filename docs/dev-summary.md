# AUBEAU 订阅促销系统 + 智能体展示页 · 开发总结

> 覆盖本轮所有改动：智能体介绍页重构、促销广告栏系统、定价页改造、套餐精简调价、结账页接入，以及过程中踩到的环境/框架坑与最佳实践。供后续开发复用。

---

## 一、功能清单（最终交付）

### 1. 智能体介绍页重构 `/agents/[id]`
- **去账单化**：删除「能力与积分成本」表、积分/次统计、积分 CTA、Agent 工作空间档案、记忆与技能进化、模拟示例对话。
- **新增互动条**（右上角）：观看（点看即计数）/ 收藏（切换）/ 转发（复制链接或原生 share）。
- **真实案例展示**：首张为该智能体真实驱动截图，其余为同类真实封面，可放大查看。
- **CTA**：使用模板·做同款（进入工作台并锁定智能体）/ 复制配置（复制 skillRef + 工具链）。
- **工作原理**：按主能力给出 3 步执行链路。

### 2. 促销广告栏系统 `src/components/promo-banner.tsx`
- **PromoBanner**（订阅页）：深色饱和渐变 + 巨型 `73` + 金色「限时特惠」徽标 + 倒计时 + 三档规则 + 流光动画。
- **HomePromoBanner**（首页/登录页）：全宽 + 倒计时 + 立即抢购跳转 `/pricing`。
- **PromoCountdown**（共享）：`距结束 XX天 XX时 XX分 XX秒`，每秒跳动。

### 3. 定价页 `/pricing`
- 删除「智能体任务积分消耗参考」整块。
- 套餐卡放大（`p-6`、价格 34px、容器 1280px、`lg:grid-cols-4`）。
- **折扣标签**（右上角折角）：随月付/年付切换（88/73/95 折）。
- **原价划线 + 折后价**：大字折后价 + 小字原价划线。

### 4. 套餐精简与调价
- 去掉 Business，保留 **Free / Starter / Pro / Ultra** 四档。
- 月付原价：Starter **39** / Pro **99** / Ultra **249**（Free 0）；年付 = 月付 × 95%（37 / 94 / 237）。
- 残留 Business 引用清理：`credits-provider` 默认 plan → `ultra`；`content.ts` 5 个 `minTier: "business"` → `"ultra"`。

### 5. 结账页 `CheckoutDrawer` 接入促销价
- 应付金额 = 折后合计；原价划线 + `XX折` 徽标 +「限时优惠 · 已省 $X」。
- 支付宝扫码文案、底部按钮金额自动跟随折后价。

---

## 二、架构与关键代码

### 共享数据层 `src/lib/credits.ts`（单一数据源）
四端口径（广告栏 / 折扣标签 / 划线价 / 结账）全部同源，避免不一致：

```ts
/** X 折 = 原价 X%。月付 95 折；年付 Starter/Pro 88 折、Ultra 73 折。 */
export function planDiscount(plan, period): number | null {
  if (plan === "free") return null;
  if (period === "monthly") return 95;
  return plan === "ultra" ? 73 : 88;
}
export function getDiscountedPrice(plan, period) { /* round(base × d/100) */ }
export function getOriginalTotal(plan, period)    { /* 年付 base×12，月付 base */ }
export function getCheckoutTotal(plan, period)    { /* 折后合计，结账以此为准 */ }
```

### 倒计时（SSR 安全 + 永续）
React 19 严格模式下，读外部存储（时间）用 `useSyncExternalStore`，规避 `set-state-in-effect` 告警与水合不一致：

```ts
const PERIOD = 3 * DAY;                              // 滚动 3 天周期
const BASE = new Date("2026-01-01T00:00:00+08:00").getTime();
const SERVER_NOW = BASE + PERIOD - 2.5 * DAY;        // SSR 确定性快照
function rollingTarget(now) { return BASE + Math.ceil((now - BASE) / PERIOD) * PERIOD; }
function useTick(ms) {
  return useSyncExternalStore(
    (cb) => { const t = setInterval(cb, ms); return () => clearInterval(t); },
    () => Date.now(),      // 客户端：真实时间
    () => SERVER_NOW,      // 服务端：确定性，保证水合一致
  );
}
```

### 关键文件清单
| 文件 | 职责 |
|---|---|
| `src/lib/credits.ts` | 套餐配置 + 促销折扣函数（单一数据源） |
| `src/lib/agent-showcase.ts` | 智能体展示页派生（截图路径、工作原理、案例、复制配置） |
| `src/components/promo-banner.tsx` | PromoBanner + HomePromoBanner + PromoCountdown |
| `src/components/agent-engagement-bar.tsx` | 观看/收藏/转发（useSyncExternalStore + localStorage） |
| `src/components/agent-case-showcase.tsx` | 真实案例画廊 + 放大查看 |
| `src/components/checkout-drawer.tsx` | 结账抽屉（折后价 + 划线 + 已省） |
| `scripts/capture-agents.mjs` | Playwright 批量驱动 53 个智能体 + 截图 + 错误验证 |

---

## 三、经验总结（踩坑 → 最佳实践）

### 1. Windows + 中文路径 + Turbopack dev 的 EPERM
**现象**：`npm run dev` 反复 `EPERM: rename .next/dev/build-manifest.json`（重试 101 次失败），manifest 损坏 → 客户端不完全水合：SSR 内容最新、`<Link>` 导航正常，但页面内自定义 `onClick`/`useState` 全不响应，HMR WebSocket 报 `ERR_INVALID_HTTP_RESPONSE`。
**根因**：非 ASCII 路径 `D:\AI工作区\...` + Windows 文件锁（疑似杀软扫描 rename 临时文件）触发 Turbopack dev 增量编译 EPERM。`npm run build`（一次性编译）不受影响。
**对策**：本机验证交互走 `npm run build && npm run start`（standalone 生产服务），不要依赖 dev 的 HMR。已记入项目记忆。

### 2. React 19：读外部存储用 useSyncExternalStore，别用 mounted 标志
**坑**：`useEffect` 里 `setMounted(true)` 触发 `react-hooks/set-state-in-effect` 告警（级联渲染）。
**正解**：localStorage / 定时器 / Date 这类外部存储，用 `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)`。`getServerSnapshot` 返回确定性值，天然解决水合不一致，零告警。

### 3. 内联 `<style>` 标签会泄漏成「乱码」
**现象**：组件内 `<style>{`@keyframes...`}</style>` 在部分浏览器把裸 CSS 当可见文本渲染（看起来像乱码）。无头 Chromium 不复现。
**对策**：`@keyframes` 一律放 `globals.css`，组件用 `className="my-anim"` 引用。页面内 `<style>` 标签数保持 0。

### 4. Standalone 生产服务会锁 `.next/standalone`
**现象**：`next build`（`output: "standalone"`）报 `EBUSY: rmdir '.next/standalone'`，因为 `node .next/standalone/server.js` 正在跑、持有句柄。
**对策**：重建前先停 standalone 进程：
```bash
powershell.exe -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"name='node.exe'\" | Where-Object { \$_.CommandLine -match 'standalone' } | ForEach-Object { Stop-Process -Id \$_.ProcessId -Force }"
```

### 5. 后台进程会被会话回收 → 用 detached 启动
**现象**：`run_in_background: true` 起的 standalone 服务在下一次回合被回收（exit 127），3939 失联。
**对策**：用 PowerShell `Start-Process` 独立启动，脱离会话生命周期：
```bash
powershell.exe -NoProfile -Command "Start-Process -FilePath 'node' -ArgumentList '.next/standalone/server.js' -WorkingDirectory '<root>' -WindowStyle Hidden -RedirectStandardOutput '<log>' -RedirectStandardError '<log>'"
```

### 6. 浏览器缓存 → 每次重建后提示硬刷新
Next 生产构建换 chunk hash，但浏览器可能仍用旧缓存，导致用户看到旧版/「没生效」。`Ctrl+Shift+R` 硬刷新强制拉新。出现「我改了但用户说没变」时，先怀疑缓存。

### 7. Playwright 批量驱动验证（回归保护）
`scripts/capture-agents.mjs`：遍历全部智能体，开页面 + 收 console/page 错误 + 截图 + 输出 JSON 报告。错误过滤要排除预期的后端 503（前端模板无后端，API 503 是优雅降级，非真错误）。改路由后跑一遍，能一次性catch渲染回归。

### 8. make-interfaces-feel-better 细节原则（落地清单）
- 同心圆角：外环 = 内环 + padding。
- 数字用 `tabular-nums`（计数/价格/倒计时）。
- 按钮按压 `active:scale-[0.96]`，别低于 0.95。
- 图片 `outline: 1px solid rgba(0,0,0,0.1)`（纯黑/纯白，别用 tinted neutral）。
- 标题 `text-balance`、正文 `text-pretty`。
- 阴影 > 实边框（透明多层 box-shadow）。
- 不用 `transition: all`，只列具体属性。

### 9. 其它
- **端口确认**：本项目前端是 3939（不是 3000）。`npm run dev` 和 `npm run start` 都默认 3939（`prepare-standalone.mjs` 注入）。
- **套餐类型**：`Record<SubscriptionPlan, PlanConfig>` 要求所有 plan 键存在；下架某套餐时，PLAN_CONFIGS 条目保留（满足类型），只从 `PLANS_FOR_PRICING`/`PLAN_ORDER` 移除，并 remap 其 minTier/默认值引用。
- **DRY**：促销计算一旦抽到 `lib/credits.ts`，所有展示端（卡片/结账/广告栏）共享，改一处全联动。

---

## 四、可复用资产

| 资产 | 复用场景 |
|---|---|
| `scripts/capture-agents.mjs` | 任何「逐页驱动 + 截图 + 错误验证」的回归脚本模板（改 BASE/路由即可） |
| `PromoCountdown` 模式 | 任何需要「SSR 安全 + 永续倒计时」的限时组件 |
| `useSyncExternalStore` + localStorage 模式 | 任何客户端持久化偏好（点赞/收藏/折叠态），无水合告警 |
| `lib/credits.ts` 促销函数族 | 价格/折扣相关展示与结算的单一数据源范式 |
| detached `Start-Process` | Windows 上启动需跨会话存活的本地服务 |
| `promo-shine` 流光 | globals.css 里的 keyframes + class，可复用到任意促销条 |

---

## 五、后续可改进

- 套餐权益随档位上移：Ultra 现 $249，若要拿到原 Business 的 50000 积分 + 团队协作，需同步升级 `PLAN_CONFIGS.ultra` 的 credits/features。
- 倒计时到期处理：目前滚动周期永不到期，如需真实到期（转「已结束」态），加 `diff<=0` 分支。
- 结账真实支付：当前 CheckoutDrawer 是 mock（扫码/卡号占位），需接 LemonSqueezy URL / 支付宝当面付 SDK。
- 促销可配置化：折扣值（88/73/95）与周期（3 天）目前硬编码，可抽到 env/配置以运营可调。
- Business 类型清理：`SubscriptionPlan` 类型仍含 `"business"`，若彻底删除需同步改 `types/credits.ts`（当前保留以满足 Record 类型，无副作用）。
