# 多智能体工作流编排引擎 — 开源调研报告

> 调研对象：AUBEAU 企业级 AI 智能体协作平台「多智能体工作流编排引擎」
> 调研范围：GitHub 主流开源多 agent 编排 / 工作流引擎方案
> 调研侧重：**多 agent 之间的数据流通机制 + 执行编排模型**（非项目泛泛介绍）
> 调研方法：deepwiki 架构抓取 + 官方文档 + 对比文章
> 报告日期：2026-06-26

---

## 一、执行摘要（TL;DR）

1. **最该借鉴的是 Dify + LangGraph + CrewAI 三家组合，而非任何单一项目**。Dify 的 `VariablePool` selector 黑板模型几乎完美印证了 AUBEAU 的初步设想；LangGraph 的 checkpoint + interrupt 提供了生产级持久化与人工节点的范式；CrewAI 的 task output 串联（默认顺序 pipe + `context=[...]` 显式多输入 + `output_pydantic` 结构化契约）提供了"节点 IO 契约"的最佳实践。

2. **AUBEAU 的"VariablePool + 节点 IO 契约 + 复用 Orchestrator.run"方案完全站得住**，与 Dify 生产实现、PocketFlow 100 行核心、Agno Workflow 高度一致。`OrchestratorRequest` 已有 `request_id` 幂等键 + `tenant_id` 租户隔离 + `session_budget_credits` 预算，天然适合作为节点执行器。

3. **最大挑战来自 AutoGen 的命运和 Temporal 的可靠性**：AutoGen 已进入官方维护模式（微软转向 Microsoft Agent Framework），印证了"对话式 GroupChat 消息传递"范式在生产环境难以收敛，**AUBEAU 应明确避开纯消息传递范式**。Temporal 的"确定性重放 + event sourcing"是企业级工作流的可靠性天花板，AUBEAU 至少应借鉴其"可重放执行记录"理念（即 `WorkflowRun` + `WorkflowNodeExecution` 持久化），而不必引入 Temporal 的全套复杂度。

4. **重型产物走 ArtifactRef 只传 ID 不进 prompt 的设计，比上述所有开源项目都更前沿**——它们仍在用"大变量外置 offload"曲线救国（Dify 的 `DraftVarLoader`/`ThreadPoolExecutor` 异步加载大变量），AUBEAU 可在此基础上更进一步。

5. **不要做的事**：不要引入 LangChain/LangGraph 的 channel reducer 概念（过度抽象）；不要做 AutoGen 式 LLM-as-router 的 speaker selection（不可控、贵、慢）；不要在前端 ReactFlow 画布把 edge 只画成 `{source, target}`——必须从 day 1 就把 edge 升级为「带 sourceHandle/targetHandle + 数据契约的 typed edge」。

---

## 二、对比矩阵

| 项目 | 编排模型 | 数据流通机制 | 并行/分支/循环 | 人工节点 | 持久化/恢复 | license | 成熟度 |
|---|---|---|---|---|---|---|---|
| **LangGraph** | BSP 状态图（Pregel）+ 声明式 StateGraph + 函数式 @task/@entrypoint | **黑板**：typed `State`（TypedDict）+ Channel reducer（LastValue/Topic/BinaryOperatorAggregate） | superstep 内并行；条件 edge；循环原生支持；Send API 动态扇出 | `interrupt()` 暂停 + `Command(resume=...)` 恢复 + `update_state()` 时间旅行 | **Checkpoint**（Postgres/Sqlite）每 superstep 持久化；可 fork/replay | MIT | 生产级，LangChain 官方 |
| **AutoGen v0.4+** | 对话式编排：`BaseGroupChat` + RoundRobin/Selector/`GraphFlow`(FSM)；事件驱动 AgentRuntime | **消息传递**：agent 间序列化 message，GroupChatManager 路由；无共享黑板 | RoundRobin 顺序；Selector(LLM 选下一发言者)；GraphFlow 用有向图自定义转移 | UserProxyAgent / handoff；pause-resume 较弱 | SingleThreadedAgentRuntime 内存；无原生 checkpoint（可加 SQLite memory） | MIT (Claude-style) | **⚠️ 维护模式**，微软转 Microsoft Agent Framework |
| **CrewAI** | 双模：Crew（自主协作，role/goal/backstory）+ Flow（事件驱动 @start/@listen/@router） | **任务输出串联**：上一 task 输出自动 pipe 给下一 task；`context=[...]` 显式多输入；`output_pydantic` 结构化 | Crew process: sequential/hierarchical；Flow 内 @router 条件分支；支持嵌套 Crew 作 step | Flow 的 human feedback；guardrail 可拒接/重试 | Flow state 持久化 + checkpoint 恢复（`8.2 Checkpointing and Flow Recovery`） | MIT | 生产级，企业版 AMP |
| **Dify** | DAG（`graphon` 引擎，GraphEngine 拓扑调度）+ 声明式节点配置 | **变量 selector**（黑板）：`VariablePool` 用 `['node_id','output_key']` 寻址；`GraphRuntimeState` 运行态；大变量 offload 异步加载 | 并行节点；IF/ELSE + 迭代 + 并行执行节点；循环靠迭代节点 | `QuestionifierNode` + `human_input_adapter` pause-resume（事件挂起） | `WorkflowRun`(整次执行) + `WorkflowNodeExecutionModel`(节点级) 双层记录；graph 快照 | Apache-2.0（自托管） | 生产级，国内主流 |
| **PocketFlow** | 极简有向图（100 行核心），action-based 路由 | **黑板**：`shared` dict（最朴素） | BatchNode 批量；async 并行；action 条件路由；递归 Flow | 自实现（human-in-the-loop cookbook pattern） | 无内置（靠 shared 持久化） | MIT | 极简参考实现，多语言移植 |
| **LlamaIndex Workflows** | **事件驱动**：@step 装饰器 + Event 类型 + Context | **事件队列 + Context 共享态**：`send_event` 入队；广播到所有 step；step 收指定 Event 类型；Context 跨 step 持久态 | 事件天然异步并行；循环（无 StopEvent 不停）；广播/单播 | 自定义 Event 触发外部 + Context 收回填 | Context 可序列化（beta）；checkpoint service | MIT | 生产级（beta），LLamaIndex 官方 |
| **Coze 扣子** | 可视化画布 + 节点（Start/LLM/Code/Knowledge/选择器/变量赋值/变量聚合...） | **变量引用 `{{}}` + 黑板**：Start 定义输入变量；节点输出写入；下游 `{{node.var}}` 引用；变量赋值/聚合节点显式流转 | 选择器节点（if-else 分支）；变量聚合（多路 fan-in）；迭代节点 | 节点 pause + 人工输入 | 执行历史记录 | 闭源 SaaS | 国内主流商用 |
| **n8n** | 通用工作流引擎：节点 + 连线（无代码），Queue/Regular 双模式 | **item 数组 + expression**：`$json` 当前 item；`$node["X"]` 跨节点引用；`$items("X")` 全量；item 逐条流过节点 | Loop/Switch/ Merge 节点；Sub-workflow；AI Agent 节点 | Wait/Webhook/ Form 节点 | **Execution 持久化** + 失败重跑 + 状态恢复（manual/queue） | Sustainable Use License（**非 OSI**，商用受限） | 生产级，但 license 受限 |
| **Temporal** | **确定性重放工作流**（代码即工作流），Activity 隔离副作用 | **event sourcing**：Activity 结果写入 event history；replay 时复用不重算；signal/query 外部交互 | 全编程式（代码逻辑即分支/循环/并行） | Signal + Activity（pause-resume via await） | **天花板级**：event history + deterministic replay，跨进程跨机器恢复 | MIT | 生产级，企业可靠性行业标杆 |
| **Agno** | 三原语：Agent / Team（coordinator 路由委托）/ Workflow（多步 sequential/parallel） | Workflow 用 step output 串联 + session state；Team 用 lead model 路由 | Workflow step: sequential/parallel/conditional/loop；session 持久 | HITL 工具审批（pause 执行 → 人工批准 → resume） | Session 持久化（AgentSession/TeamSession/WorkflowSession）+ LearningMachine 跨会话 | MPL-2.0 | 生产级（AgentOS runtime） |
| **Flowise / Langflow** | 可视化：Flowise Chatflow/Agentflow；Langflow DAG + 组件 | 连线 + 参数 binding（Flowise 把上游输出 bind 到下游 input）；Langflow 通过 component IO 端口 | Flowise Chatflow Tool（嵌套 workflow 作 tool）；Langflow 多 agent 组件 | 人工节点（Human input 组件） | 执行记录 + chatflow 持久 | Apache-2.0 | 生产级，可视化建站首选 |

> 注：license 列用 ★ 标记需重点关注的：n8n 的 Sustainable Use License 不是 OSI 开源协议，商用需法务审视；Agno MPL-2.0 是弱 copyleft（修改文件需开源，链接无要求）。

---

## 三、逐项目深度剖析

### 3.1 LangGraph — 状态图 + Checkpoint 的生产级范式

**机制要点**

LangGraph 基于 Google Pregel 论文的 **Bulk Synchronous Parallel (BSP)** 模型，核心抽象四个：`Graph`(DAG)、`State`(typed 共享数据)、`Channel`(typed 容器 + reducer 合并语义)、`Checkpoint`(序列化快照)。

执行引擎 `Pregel` 按离散 superstep 推进：
1. **Plan**：根据 channel 状态决定哪些 node 就绪
2. **Execute**：并行执行就绪 node
3. **Update**：用 reducer 合并 writes 到 channel
4. **Checkpoint**：通过 `BaseCheckpointSaver` 持久化

关键文件位置：
- `libs/langgraph/pyproject.toml` — `langgraph-checkpoint` 基础接口
- `PostgresSaver` / `SqliteSaver` 生产/本地实现
- `BaseStore` 跨 thread 长期记忆

**数据流通（黑板范式）**
- `LastValue<K>` channel：最后一次写入覆盖（默认）
- `Topic` channel：发布订阅（一对多）
- `BinaryOperatorAggregate` channel：自定义 reducer（如列表拼接、计数累加）

**人工节点（最强项）**
```python
response = interrupt("Your question here")
# Resume when ready:
graph.invoke(Command(resume="Your response here"), thread)
```
- `interrupt()` 暂停 → 框架自动 checkpoint → 等待人工
- `Command(resume=...)` 恢复并注入人工值
- `update_state()` 修改 checkpoint 状态 → **time travel**：可回滚到任意历史 checkpoint，改 state，从那里分叉重放

**可靠性**
- 每 superstep checkpoint → 进程崩了从最近 checkpoint 恢复
- 重试策略（`RetryPolicy`）+ 错误处理原生
- Time Travel: replay 任意历史时点

**对 AUBEAU 的可借鉴点**
- ✅ **Checkpoint 是必学项**：AUBEAU 工作流应每个节点执行后 snapshot「VariablePool + 已完成节点集 + 当前 frontier」，与 LangGraph 的 superstep checkpoint 同构
- ✅ **`interrupt()` + `Command(resume)` 二元组**：AUBEAU 的人工节点 API 可直接借鉴这个签名
- ✅ **Channel reducer 抽象**：用于多分支并行结果如何合并（fan-in）——但 AUBEAU 可简化为「LastValue + 列表拼接」两种内置 reducer
- ⚠️ **不要全盘引入 Channel 概念**：对 AUBEAU 的画布用户过于抽象，selector 黑板（Dify 式）更可视
- ⚠️ LangGraph 强绑 LangChain 生态（`langchain-core>=1.4.0`），不适合直接复用为 AUBEAU 编排层；只学理念

---

### 3.2 Microsoft AutoGen — 对话式编排的反面教材

**机制要点**

AutoGen v0.4 是对 v0.2 的完全重写，三层架构：
- `autogen-core`：`AgentRuntime`(消息总线) + `BaseAgent` + `ChatCompletionClient` + `BaseTool`
- `autogen-agentchat`：`AssistantAgent` + `BaseGroupChat` 系列
- `autogen-ext`：集成扩展

**Multi-Agent Teams（4.1 Team Orchestration）**
- `RoundRobinGroupChat`：循环固定顺序
- `SelectorGroupChat`：**LLM 选下一发言者**（model-based routing）
- `GraphFlow`：用有向图（FSM）定义 speaker 转移
- `MagenticOne`：通用任务的复杂多 agent 系统（参考实现）

**数据流通（消息传递范式）**
- agent 之间通过序列化 message 通信
- `BaseGroupChatManager` 是大脑：维护 conversation history + 决定下一个 speaker
- agent 没有共享黑板，只能读 conversation 上下文 + 自己的 memory

**关键事实：维护模式**
> "AutoGen is now in maintenance mode. It will not receive new features or enhancements and is community managed going forward. New users should start with Microsoft Agent Framework." — AutoGen README

**对 AUBEAU 的可借鉴点**
- ❌ **不要采用 GroupChat 消息传递范式**：AUBEAU 是企业平台，需要可审计、可回放、可计费——GroupChat 让 conversation history 膨胀，agent 看到的上下文不可控，计费极难对齐
- ❌ **不要用 LLM-as-router（SelectorGroupChat 模式）**：每次选下一 agent 都要调一次 LLM，慢 + 贵 + 不可预测
- ✅ **GraphFlow 的 FSM 思路**：如果要支持「对话式编排」用例（如多 agent 辩论），FSM 比 LLM-router 可控得多
- ⚠️ MagenticOne 的 orchestrator-worker 模式（一个主 agent 分派给 worker）有参考价值，但 AUBEAU 的「画布定义拓扑」更结构化

---

### 3.3 CrewAI — Task 输出串联的最佳实践

**机制要点**

CrewAI 是独立实现（不依赖 LangChain），双模编排：
- **Crew**：自主协作团队（Agent 有 role/goal/backstory，可相互 delegate）
- **Flow**：事件驱动的细粒度控制（@start/@listen/@router 装饰器），Crew 可作为 Flow 的一个 step

**数据流通（任务输出串联范式）**
三种核心机制：
1. **默认顺序 pipe**：sequential process 下，上一 task 输出**自动**作为下一 task 的 input（GitHub Issue #1977 确认）
2. **显式 context piping**：`Task(context=[task_a, task_b])` 手动指定多输入 → 解决 fan-in
3. **结构化契约**：`output_pydantic=YourModel` / `output_json=(dict, schema)` → 强制下游收到的是结构化对象，而非自由文本
4. **Guardrails**（2.3.1）：`Task(guardrail=fn)` 在输出**传给下一 task 之前**做校验/转换/拒绝重做

**与单 agent 的关系**
CrewAI 的 Agent 内部就是单 agent loop（LiteAgent 是更轻量的变体），多个 Agent 的 task 串/并联成 Crew → **这正是 AUBEAU 设想的「复用 Orchestrator 作为节点执行器」**。

**可靠性**
- Flow 的 state 可持久化 + checkpoint（`8.2 Checkpointing and Flow Recovery`）
- Task guardrail 失败可重试

**对 AUBEAU 的可借鉴点**
- ✅ **Task 默认顺序 pipe 是黄金默认值**：AUBEAU 工作流的「上一节点输出自动作为下一节点 input」应是零配置默认，避免用户每次手动连线
- ✅ **`output_pydantic` 结构化契约 = 节点 IO 契约**：AUBEAU 的节点应声明 `inputs: PortSpec[]` / `outputs: PortSpec[]`，outputs 最好是 Pydantic 模型（AUBEAU 后端是 Python，天然契合）
- ✅ **Guardrail 模式**：AUBEAU 节点输出后可挂校验/转换钩子（对齐 InputSafetyGateway 理念），失败可回到本节点重做或转人工
- ✅ **Crew-as-Flow-step**：AUBEAU 应支持「子工作流」作为节点（Dify 也支持），便于复用
- ⚠️ Crew 的「agent 间 delegate」是 LLM-driven 的，不可控；AUBEAU 应把 delegate 限制在画布显式定义的 edge 上

---

### 3.4 Dify — VariablePool selector 黑板的工业级实现（AUBEAU 设想的直接印证）

**机制要点**

Dify 工作流引擎由独立包 `graphon` 提供，`WorkflowEntry` 初始化 `GraphEngine`：
- 输入：`Graph` 对象（nodes + edges + 配置）+ `GraphRuntimeState` + `CommandChannel`（默认 `InMemoryChannel`）
- 执行：`GraphEngine` 按 node 依赖关系 traverse + invoke node
- 配额：`LLMQuotaLayer` 作为执行层 wrapper 做速率限制

**数据流通（变量 selector 黑板范式）— 最核心**
```
VariablePool 是工作流执行的中心数据仓库：
- 写入：node 执行后把 outputs 写入 pool
- 读取：node 启动时从 pool 读 inputs
- 寻址：用 selector ['node_id', 'output_key']（这是关键设计！）
```

关键细节：
- **`VariableLoader` 接口**（`DraftVarLoader` 实现）：负责变量从持久化存储的取回
- **大变量 offload**：超大变量外置存储 + 用 `ThreadPoolExecutor` 异步加载，减少主路径延迟
- **变量来源**：system variables + user inputs + environment variables 初始化 pool

**工作流模型四层分离（极其重要的工程范式）**
1. **静态定义层**：`Workflow` 表存 graph blueprint（nodes/edges/配置），无运行态
2. **执行引擎层**：`GraphEngine` traverse + 调度
3. **运行态层**：`VariablePool` + `GraphRuntimeState`
4. **执行记录层**：`WorkflowRun`(整次执行: status/graph snapshot/metrics) + `WorkflowNodeExecutionModel`(节点级: inputs/outputs/status/metadata，大数据 truncate 后 offload)

**人工节点（5.6）**
`human_input_adapter` + pause-resume：节点暂停 → 等待外部输入 → 注入 → 继续。

**对 AUBEAU 的可借鉴点**
- ✅ **AUBEAU 的 VariablePool 设想被 Dify 完美印证**，且 selector `['node_id', 'output_key']` 是经过生产验证的寻址方案 → AUBEAU 可直接采用
- ✅ **四层分离是工业级范式**：AUBEAU 必须把「工作流定义」「运行态」「执行记录」三者分离持久化，对应表：`Workflow`(定义) / `WorkflowRun`(执行实例) / `WorkflowNodeExecution`(节点执行)
- ✅ **`LLMQuotaLayer` 模式**：AUBEAU 的 `BillingService` 应作为节点执行的 wrapper layer（与 AgentGateway.astep 内逐轮 reserve 闸对齐）
- ✅ **大变量 offload 思路**：但 AUBEAU 可用 ArtifactRef（只传 ID 不进 prompt）做得更彻底——Dify 还在传"大变量内容"，AUBEAU 直接连内容都不传，只传引用
- ✅ **graph snapshot on run**：每次执行时冻结 graph 定义快照，避免运行中定义变更导致不一致

---

### 3.5 PocketFlow — 100 行核心，最纯粹的黑板抽象

**机制要点**

整个框架就一个文件 `pocketflow/__init__.py`（100 行），零依赖，零 vendor lock-in。

**三阶段 Node 生命周期（最优雅的设计）**
```
prep(shared)        → 从 shared store 读数据
exec(prep_res)      → 执行核心逻辑（LLM call/API）
post(shared, prep, exec) → 写回 shared + return action
```

`action` 是 labeled edge（如 "default"/"approved"/"rejected"），`Flow` 根据 action 路由到下一 node。

**数据流通（最朴素黑板）**
`shared` 就是个 dict，prep 读、post 写。**没有任何 selector/channel/event 等抽象**——极简但有效。

**类层次**
- `BaseNode`（三阶段）
- `Node`（加 retry）
- `AsyncNode`（异步）
- `BatchNode`（map-reduce 批量）
- `Flow`（编排，递归可嵌套）

**对 AUBEAU 的可借鉴点**
- ✅ **三阶段生命周期是节点契约的最小完备集**：AUBEAU 节点 API 应有 `prepare(variable_pool) → execute(inputs) → finalize(variable_pool, outputs)` 三阶段，与 PocketFlow 同构但用 VariablePool 替代 shared dict
- ✅ **action-based 路由**：AUBEAU 的条件分支可让节点 return `action` 字符串，对应画布上不同 edge label（比 IF/ELSE 独立节点更优雅，但可视化上 IF 节点对用户更友好——AUBEAU 可两者都支持）
- ✅ **BatchNode 模式**：AUBEAU 的「迭代节点」（map-reduce）可直接借鉴
- ✅ **零依赖哲学**：AUBEAU 编排引擎核心不应依赖任何 LLM SDK（Orchestrator 已是这风格）
- ⚠️ PocketFlow 没有持久化、没有 checkpoint——AUBEAU 必须自己加

---

### 3.6 LlamaIndex Workflows — 事件驱动范式

**机制要点**

事件驱动 + 步骤式：
- `@step` 装饰器标注异步方法，每个 step **接收一种 Event 类型 + emit Event**
- `Context` 对象：跨 step 的共享状态 + `send_event()` 入队
- 事件**不被消费后删除**（GitHub #18245），由队列机制管理

**事件流转**
```
step 收 Event → 处理 → Context.send_event(NewEvent) →
orchestrator 循环：检测 StopEvent 则停，否则继续 dispatch
```

支持广播（`dispatch` 不指定 step → 所有 step 队列收到，非匹配者忽略）。

**对 AUBEAU 的可借鉴点**
- ⚠️ **事件驱动 vs DAG 拓扑**：LlamaIndex 用事件驱动，对开发者编程友好，但**对可视化画布不友好**（边不是显式的数据契约，而是隐式的事件订阅关系）
- ❌ **不推荐 AUBEAU 主流程采用事件驱动**：AUBEAU 是画布驱动的企业产品，DAG 拓扑（Dify 式）比事件流更可审计、可计费、可可视化
- ✅ **Context 共享态概念**：可借鉴用于"会话级"状态（非节点 IO），如工作流执行过程中的临时累加器
- ✅ **StopEvent 模式**：工作流的终止条件（与 Orchestrator 的 FINALIZE 同构）

---

### 3.7 Coze 扣子 — 国内主流商用范式

**机制要点**

可视化画布 + 节点（Start/LLM/Code/Knowledge/选择器/变量赋值/变量聚合/迭代...）。

**数据流通（`{{}}` 变量引用 + 黑板）**
- **Start 节点**定义输入变量（从外部 Bot 取值启动）
- 每个节点输出写入变量池
- 下游节点用 `{{node_id.variable_name}}` 引用（`{{llm_question}}` 这类模板语法）
- **变量赋值节点**：显式把值赋给变量 → 动态更新 + 中间结果存储
- **变量聚合节点**：多路 fan-in → 一个统一变量（按数据类型聚合：String/Integer/File/Object/Array）
- **选择器节点**：if-else 分支数据流向控制

**对 AUBEAU 的可借鉴点**
- ✅ **`{{node.var}}` 引用语法对用户友好**：AUBEAU 画布节点的输入框可支持这种模板语法（隐式生成 selector），降低心智负担
- ✅ **变量赋值/聚合作为显式节点**：AUBEAU 可提供「变量赋值」「变量聚合」节点，让用户显式控制数据流转（比纯 selector 隐式流动更易懂）
- ✅ **Start 节点定义输入契约**：AUBEAU 工作流也应有显式 input schema 声明
- ⚠️ Coze 闭源，只能学 UX 不能学实现

---

### 3.8 n8n — 通用工作流引擎的数据传递借鉴

**机制要点**

通用工作流自动化平台（非 AI 专用），500+ 节点集成。Vue3 画布 + Node.js 后端，Regular/Queue 双模式（Bull/Redis）。

**数据流通（item 数组 + expression）**
- **核心数据单元**：item，每个 item = `{ json: {...}, binary: {...} }`
- 节点处理 item 数组，逐条流转
- **expression 引用**：
  - `$json.field` — 当前 item 的 json 字段
  - `$node["NodeName"]` — 引用指定节点的输出
  - `$items("NodeName")` — 引用指定节点的全量 item 数组
  - `$item(index)` — 按 index 引用

**执行恢复（2.4）**
- Execution 持久化到 DB（含每节点 inputs/outputs/status）
- 失败可重跑（manual 模式从起点；queue 模式从失败节点）
- 错误处理：Retry Node + Error Trigger Workflow

**对 AUBEAU 的可借鉴点**
- ✅ **expression 引用机制对 UI 友好**：AUBEAU 节点配置面板可支持 `$nodes.llm_agent_1.outputs.summary` 这类表达式（编译为 selector）
- ✅ **Execution 持久化 + 重跑**：AUBEAU 的 `WorkflowRun` 失败后应能从失败节点重跑（需配合 idempotent node 执行）
- ✅ **Queue 模式（Bull/Redis）**：AUBEAU 工作流节点执行可走 Celery/Redis 异步队列（与现有 backend 栈一致），实现水平扩展
- ⚠️ **n8n 的 item 数组语义对 LLM 工作流过重**：LLM agent 节点通常处理单条 prompt 而非数据集 → AUBEAU 不必强制 item 数组语义
- ❌ **license 风险**：n8n 的 Sustainable Use License 不是 OSI 开源，不能直接复用代码

---

### 3.9 Temporal — 可靠性的天花板（不必全上，但要学理念）

**机制要点**

企业级工作流平台，核心是 **"代码即工作流" + 确定性重放 + event sourcing**：
- **Workflow 代码必须确定性**：给定相同输入 + 相同 event history，必须产生相同输出
- **Activity 隔离副作用**：所有非确定性操作（API 调用、DB 写、LLM 调用）放 Activity，Activity 在 replay 时**不重新执行**，复用 event history 中记录的结果
- **Signal**：外部事件注入 workflow（成为 history 一部分，确定性 replay）
- **Query**：只读查询 workflow 状态（不影响 history）
- **workflowId + runId**：标识一次执行；同一 workflowId 可有多 run（继续-as-new）

**可靠性（行业天花板）**
- 进程崩 → 任意机器拉起 → replay event history → 恢复到失败点 → 继续
- Activity 自动重试（指数退避 + 超时）
- 跨语言、跨进程、跨数据中心

**对 AUBEAU 的可借鉴点**
- ✅ **「执行记录可重放」理念必学**：AUBEAU 应记录每个节点的 inputs/outputs/状态，使得「从某节点重放」成为可能（不需要 Temporal 的全套 event sourcing，但需 WorkflowNodeExecution 表）
- ✅ **Activity 隔离原则**：AUBEAU 节点内的 Orchestrator.run（含 LLM 调用、工具执行、计费）本身就是"有副作用的活动"——应在节点执行记录中标记"已执行不可重算"，replay 时直接读结果（与 Temporal Activity 同构）
- ✅ **Signal 思路 → 人工节点 + 外部回调**：AUBEAU 的 pause-resume 节点本质就是 Temporal Signal（外部事件注入）
- ⚠️ **不要引入 Temporal 全套复杂度**：确定性约束对 LLM agent 工作流太重（LLM 输出本质非确定性，强行 replay 会失败）；AUBEAU 的"重放"应是「节点级结果复用」而非「workflow 代码 replay」
- ⚠️ Temporal 自身可作为 AUBEAU 长时运行工作流的底层调度器（如批量任务、定时触发），但节点内部仍是 AUBEAU 自研 Orchestrator

---

### 3.10 Agno — 多 agent 编排的现代整合（含运行时）

**机制要点**

三层架构（与 AUBEAU 理念高度契合）：
- **Framework 层**：`Agent` / `Team` / `Workflow` / `Registry`(管不可序列化对象如 tools/models)
- **Runtime 层（AgentOS）**：stateless 横向扩展 + session 持久 + JWT RBAC + 多租户
- **Control Plane 层**：Web 控制台（实时观测 + 人工审批）

**三种原语对比**
- `Agent`：单 agent（含 tools/memory/knowledge/guardrails）—— 对应 AUBEAU 的 Orchestrator
- `Team`：多 agent 协作（lead model 路由/委托）—— coordinator-worker 模式
- `Workflow`：多步编排（sequential/parallel/conditional/loop step）—— 对应 AUBEAU 要做的层

**Workflow 的 HITL（2.3.3）**
工具执行需人工审批 → 暂停 → 控制台审批 → 恢复。**这与 AUBEAU 的 ToolGateway「默认拒绝/fail-closed」+ 工具授权理念完全一致**。

**对 AUBEAU 的可借鉴点**
- ✅ **三层分离架构**：Framework（编排）+ Runtime（AgentOS 风格 stateless API）+ Control Plane（观测/审批）—— AUBEAU 已有 backend(API) + frontend(画布/控制台) 的天然分层
- ✅ **Workflow step 类型枚举**：sequential/parallel/conditional/loop 四类是完备集，AUBEAU 节点类型可参考
- ✅ **HITL 工具审批**：AUBEAU 的 ToolGateway authorize 已是这思路，工作流层应暴露「审批节点」让用户在画布上显式插入
- ✅ **Registry 概念**：管不可序列化对象（DB 连接、model client 实例）—— AUBEAU 的 SkillRegistry / ToolGateway 同构
- ✅ **Session 三态持久**：AgentSession / TeamSession / WorkflowSession —— AUBEAU 应有 WorkflowSession（运行态）+ WorkflowRun（执行记录）+ Workflow（定义）
- ⚠️ MPL-2.0 弱 copyleft，链接无要求，可参考架构但不能直接复制代码到闭源

---

### 3.11 Flowise / Langflow — 可视化编排的 UI/数据连线借鉴

**机制要点**

可视化拖拽编排 LLM 应用：
- **Flowise**：三种 builder 模式（Chatflow/Agentflow/Multi-Agent），Chatflow Tool 可嵌套 workflow 作 tool
- **Langflow**：节点编辑器 + 组件 IO 端口（Python 集成强），138k+ stars

**数据连线机制**
- 节点声明 input/output 端口
- 连线 = 端口到端口的数据 binding
- Langflow 的 component 模型：每个组件显式声明 inputs/outputs，类型化连线

**对 AUBEAU 的可借鉴点**
- ✅ **端口化节点 IO**：AUBEAU 节点必须显式声明 input/output ports（type + name），画布连线绑定到端口而非节点 → 这正是「节点 IO 契约」的 UI 表达
- ✅ **类型化连线**：output port 类型必须与 input port 类型匹配才能连线（避免用户接错）
- ✅ **Chatflow Tool 嵌套**：AUBEAU 应支持「工作流作为工具」被 agent 调用（Dify 也支持）
- ⚠️ 这些项目偏 chatbot 场景，企业级多租户/计费/审计能力弱 → AUBEAU 不应直接复用

---

## 四、数据流通机制专项对比（核心章节）

多 agent 工作流的数据流通可归纳为四种范式。本节深入对比，并判断哪种最契合 AUBEAU。

### 4.1 范式一：共享黑板（VariablePool / shared dict / State + Channel）

**代表**：Dify VariablePool、PocketFlow shared、LangGraph State+Channel、Coze 变量池

**机制**：存在一个中心数据仓库，节点从中读、写回。寻址用 selector（`['node_id','output_key']`）或 typed key。

**优点**
- ✅ **可审计**：任一时刻数据有单一真相源，便于持久化快照
- ✅ **可可视化**：画布用户通过 `{{node.output}}` 引用，心智负担低
- ✅ **支持并行**：多个节点同时写不同 key，reducer 合并冲突
- ✅ **易于持久化恢复**：snapshot 整个 pool 即可 checkpoint
- ✅ **fan-in 自然**：多节点输出可在 pool 中并存，下游按 selector 取多个

**缺点**
- ⚠️ 数据所有权不显式（节点隐式依赖某些 selector，类型不安全）
- ⚠️ 大对象传递成本（需 offload 机制，如 Dify 的 ThreadPoolExecutor）

**适用场景**：DAG 拓扑、可视化画布、需审计的企业工作流 — **AUBEAU 的场景**。

### 4.2 范式二：消息传递（GroupChat / Event Bus）

**代表**：AutoGen GroupChat、LlamaIndex Workflows（部分）、AutoGen AgentRuntime

**机制**：agent 之间通过序列化 message/event 通信，无共享态，靠 conversation history 或 event queue 流转。

**优点**
- ✅ 松耦合，agent 可独立演进
- ✅ 适合对话式协作（多 agent 辩论、回合制）

**缺点**
- ❌ **不可审计**：conversation history 膨胀，谁说了什么难追溯
- ❌ **计费极难**：每个 agent 的 LLM 调用边界模糊
- ❌ **持久化复杂**：要序列化整个 message 流才能恢复
- ❌ **可视化困难**：消息流 vs DAG 拓扑不对应
- ❌ **LLM-as-router 不可控**：SelectorGroupChat 模式贵 + 慢 + 不可预测

**适用场景**：研究、demo、对话式 agent — **不是 AUBEAU 的场景**。

### 4.3 范式三：任务输出串联（task output piping）

**代表**：CrewAI Task、Agno Workflow step

**机制**：上一节点/任务的输出**自动**作为下一节点/任务的输入；显式 `context=[...]` 声明多输入。

**优点**
- ✅ **最小心智负担**：默认零配置自动串联
- ✅ **结构化契约自然**：`output_pydantic` 强制类型 → 下游收到的是 typed object
- ✅ **guardrail 可插入**：输出校验/转换在传递前发生

**缺点**
- ⚠️ 默认顺序 pipe 只适合线性流程，并行/分支需要显式 context 或独立节点
- ⚠️ fan-in 需要显式声明，不如黑板自然

**适用场景**：编程式编排（Python 代码定义工作流）、线性 agent pipeline — AUBEAU 作为画布产品的**辅助范式**。

### 4.4 范式四：变量引用 / selector 表达式

**代表**：Dify selector、Coze `{{}}`、n8n `$json`/`$node`

**机制**：节点配置中用表达式显式引用其他节点的输出，框架在节点执行前 resolve 引用 → 注入 inputs。

**优点**
- ✅ **用户显式控制**：每个输入来源清晰可见
- ✅ **支持任意拓扑**：fan-in/fan-out 自然（多个表达式引用同一/不同节点）
- ✅ **UI 友好**：配置面板可见所有引用关系

**缺点**
- ⚠️ 引用类型安全需框架校验（连线时校验类型匹配）
- ⚠️ 引用解析需有清晰的 eval 时机（节点就绪时）

**适用场景**：可视化画布产品 — **AUBEAU 的场景**。

### 4.5 范式综合判断：AUBEAU 应采用「黑板 + selector 引用」复合范式

**结论**：AUBEAU 的「VariablePool + 节点 IO 契约」设想是**黑板范式（4.1）+ selector 引用范式（4.4）的复合**，这是最适合企业级可视化画布产品的组合。具体：

| 维度 | AUBEAU 应采用 | 印证项目 |
|---|---|---|
| 底层存储 | VariablePool 黑板（selector `['node_id','output_key']`） | Dify、PocketFlow、Coze |
| 用户表达 | 节点配置中 `$nodes.X.outputs.Y` 或 `{{X.Y}}` 表达式 | n8n、Coze、Dify |
| 默认行为 | 顺序连线的上一节点 output 自动注入下一节点 input | CrewAI（顺序 pipe 默认） |
| 类型契约 | 节点声明 `inputs/outputs: PortSpec[]`（Pydantic 模型） | CrewAI output_pydantic、Langflow component ports |
| 大产物 | ArtifactRef（只传 ID，不入 prompt） | AUBEAU 原创设计，优于 Dify 大变量 offload |
| 并行合并 | LastValue + 列表拼接两种内置 reducer | LangGraph channel reducer 简化版 |

---

## 五、对 AUBEAU 方案的结论与建议

### 5.1 方案是否站得住？—— 站得住，且被多家生产级项目印证

AUBEAU 初步设想：「VariablePool 黑板 + 节点 IO 契约 + WorkflowRunner 拓扑调度 + 每个 agent 节点复用 Orchestrator.run + 重型产物走 ArtifactRef」。

**逐项验证**：

| AUBEAU 设想 | 印证项目 | 信心 |
|---|---|---|
| VariablePool 黑板（selector 寻址） | Dify（生产级）、PocketFlow（最纯粹）、Coze（商用主流） | ⭐⭐⭐⭐⭐ 完全成立 |
| 节点 IO 契约（inputs/outputs port spec） | CrewAI output_pydantic、Langflow component ports、Agno Workflow step | ⭐⭐⭐⭐⭐ 完全成立 |
| WorkflowRunner 拓扑调度（就绪节点计算） | Dify GraphEngine、LangGraph Pregel Plan 阶段、PocketFlow Flow | ⭐⭐⭐⭐⭐ 完全成立 |
| 复用 Orchestrator.run 作节点执行器 | CrewAI Agent-as-step、Agno Agent-in-Workflow、PocketFlow Node 内嵌 LLM loop | ⭐⭐⭐⭐⭐ 完全成立，且 AUBEAU OrchestratorRequest 已有 request_id 幂等键 + tenant_id + budget，天然适合 |
| 重型产物走 ArtifactRef 只传 ID | Dify 大变量 offload（曲线救国）、Temporal Activity 结果记录 | ⭐⭐⭐⭐ AUBEAU 设计更先进，是差异化优势 |

**结论**：方案整体站得住，**不需要推翻重设计**，但需要补齐若干生产级能力（见 5.2）。

### 5.2 额外应借鉴的能力

#### 必须补齐（P0）

1. **Checkpoint 持久化（借鉴 LangGraph + Dify）**
   - 每个节点执行后 snapshot：VariablePool + 已完成节点集 + 当前 frontier + WorkflowSession 元数据
   - 进程崩溃后可从最近 checkpoint 恢复
   - 表设计：`workflow_run`(整次) + `workflow_node_execution`(节点级 inputs/outputs/status) + `workflow_session_state`(可恢复快照)

2. **节点执行记录可重放（借鉴 Temporal + n8n）**
   - 每个 node execution 记录 inputs/outputs/status/metrics（含 LLM tokens/credits）
   - 失败工作流可从失败节点重跑（前提：节点执行 idempotent，AUBEAU OrchestratorRequest.request_id 已支持）
   - 大产物 offload（Dify 式 truncate + 外置存储），但更推荐 ArtifactRef

3. **人工节点 pause-resume（借鉴 LangGraph interrupt）**
   - API 签名：节点 `interrupt(reason)` → 工作流挂起 + 持久化 → 外部注入值 → `resume(value)` → 继续
   - 与 AUBEAU 已有的 ToolGateway authorize「默认拒绝/fail-closed」理念对齐
   - 控制台暴露「待审批节点」视图（Agno AgentOS 风格）

4. **节点 IO 类型化契约（借鉴 CrewAI + Langflow）**
   - 节点声明 `inputs: list[PortSpec]`、`outputs: list[PortSpec]`，PortSpec 含 name/type/required
   - outputs 推荐用 Pydantic 模型（AUBEAU 后端 Python，天然契合）
   - 画布连线时类型校验（output 类型必须匹配 input 类型，Langflow 风格）

#### 应该补齐（P1）

5. **配额层 wrapper（借鉴 Dify LLMQuotaLayer + 复用 AUBEAU BillingService）**
   - 每个节点执行前后包一层 BillingService：执行前预扣 → 执行后实扣/退款
   - 与 Orchestrator 内逐轮 reserve 闸对齐：工作流层做"节点级"预算闸，Orchestrator 做"轮级"预算闸

6. **默认顺序 pipe + 显式 context（借鉴 CrewAI）**
   - 画布上 A→B 直连时，A 的默认 output 自动注入 B 的默认 input（零配置）
   - 用户可在 B 的输入面板用 `$nodes.A.outputs.X` 表达式显式引用任意上游节点（n8n/Coze 风格）

7. **子工作流作为节点（借鉴 Dify + Flowise Chatflow Tool）**
   - 支持工作流嵌套调用，便于复用
   - 子工作流的 outputs 成为节点 outputs

8. **迭代/并行节点（借鉴 PocketFlow BatchNode + Dify 迭代节点）**
   - map-reduce 模式：输入数组 → 并行执行子流程 → 聚合结果

#### 可选（P2）

9. **工作流作为 tool 被 agent 调用**（Dify、Flowise 支持）
10. **Time Travel**（LangGraph）：从历史 checkpoint 分叉重放——企业审计场景有价值
11. **Signal/Query**（Temporal）：长时运行工作流的外部交互

### 5.3 推荐架构（AUBEAU 工作流编排引擎）

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend: ReactFlow 画布（typed edges + port binding）     │
│  - edge 升级为 {source, target, sourceHandle, targetHandle} │
│  - 节点配置面板支持 $nodes.X.outputs.Y 表达式                │
│  - 类型化连线校验                                            │
└─────────────────────────────────────────────────────────────┘
                          │ (DSL: graph JSON)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  WorkflowRunner（拓扑调度器，借鉴 Dify GraphEngine）         │
│  - 输入：Graph + VariablePool(initial) + WorkflowSession    │
│  - 调度：计算就绪节点（所有 input selector 已 resolved）     │
│  - 并行：就绪节点并行执行（asyncio）                         │
│  - 分支：条件 edge（if-else）、迭代节点                      │
│  - 持久化：每节点后 checkpoint                              │
└─────────────────────────────────────────────────────────────┘
                          │
            ┌─────────────┼─────────────┐
            ▼             ▼             ▼
   ┌──────────────┐ ┌───────────┐ ┌───────────┐
   │ AgentNode    │ │ ToolNode  │ │ HITLNode  │
   │ (复用        │ │ (ToolGw)  │ │ (interrupt│
   │  Orchestrator│ │           │ │  +resume) │
   │  .run)       │ │           │ │           │
   └──────────────┘ └───────────┘ └───────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│  VariablePool（黑板，selector ['node_id','output_key']）     │
│  - 内存态：当前执行的数据                                    │
│  - 大产物：ArtifactRef（只传 ID 不入 prompt）                │
│  - 持久化：序列化到 workflow_session_state                   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  持久层                                                      │
│  - workflow（定义 blueprint + graph snapshot）               │
│  - workflow_run（执行实例 + status + metrics）               │
│  - workflow_node_execution（节点级 inputs/outputs/status）   │
│  - workflow_session_state（可恢复快照/checkpoint）           │
│  - artifact（重型产物，ID 索引，不入 prompt）                │
└─────────────────────────────────────────────────────────────┘
```

**关键设计决策**

- **节点执行器**：AgentNode 内部调用 `Orchestrator.run(OrchestratorRequest(...))`，把 VariablePool 解析出的 inputs 拼成 `user_message`（或更结构化的 prompt template），Orchestrator 产出的 artifacts 转为 ArtifactRef 写回 VariablePool
- **就绪节点计算**：节点 X 就绪 ⟺ X 的所有 input selector 在 VariablePool 中已存在 AND 所有上游依赖节点已完成
- **edge 数据语义**：edge 不再是裸 `{source, target}`，而是 `{source, target, sourceHandle, targetHandle}`，`sourceHandle` 指向 source 节点的某个 output port，`targetHandle` 指向 target 节点的某个 input port（ReactFlow 原生支持，AUBEAU 当前未用）
- **失败处理**：节点失败 → 标记 workflow_run failed + 持久化已执行节点 → 用户可「从失败节点重跑」（idempotent 保证）
- **配额**：WorkflowRunner 在调用 AgentNode 前包一层 `BillingService.reserve_session_budget`，Orchestrator 内部仍有逐轮 reserve（双层防护）

### 5.4 反模式（不要做的事）

1. ❌ **不要采用 AutoGen 式 GroupChat / LLM-as-router**
   - 原因：不可审计、不可控、贵、慢、计费难对齐
   - 替代：拓扑显式定义在画布上，下一节点由 edge 决定，不由 LLM 决定

2. ❌ **不要采用事件驱动（LlamaIndex Workflows 式）作为主流程**
   - 原因：事件订阅关系对画布用户不友好，可审计性弱
   - 替代：DAG 拓扑（Dify 式）为主，事件驱动仅用于「外部触发器」场景

3. ❌ **不要让 edge 只表达 `{source, target}`**
   - 原因：丢失数据语义，前端只能模拟动画，无法真正调度
   - 替代：从 day 1 就用 typed edge `{source, target, sourceHandle, targetHandle}`，edge 是数据契约的 UI 表达

4. ❌ **不要把重型产物（图片/文档/代码）内容塞进 VariablePool 再传给 LLM**
   - 原因：成本高、prompt 膨胀、与 AUBEAU ArtifactPublisher 理念冲突
   - 替代：ArtifactRef（ID + 元数据），LLM 只看摘要/preview，需要时显式工具取回（AUBEAU 已有此设计，要坚持）

5. ❌ **不要直接引入 LangGraph / LangChain 作为编排层**
   - 原因：强绑 LangChain 生态、channel reducer 过度抽象、Python-only
   - 替代：自研轻量 WorkflowRunner（参考 PocketFlow 100 行哲学），只学 LangGraph 的 checkpoint 理念

6. ❌ **不要强行引入 Temporal 全套确定性约束**
   - 原因：LLM 输出本质非确定性，强行 replay 会失败；Temporal 的复杂度对企业内部平台过重
   - 替代：借鉴「节点级结果复用 + 执行记录可重放」理念，不借鉴「workflow 代码 replay」

7. ❌ **不要忽略 license**
   - n8n（Sustainable Use License，非 OSI）禁止商业复用
   - Agno（MPL-2.0 弱 copyleft）修改文件需开源
   - CrewAI / Dify / LangGraph（MIT / Apache-2.0）友好
   - AUBEAU 自研编排引擎，仅借鉴架构理念，不复制代码

8. ❌ **不要让工作流定义与运行态混在一张表**
   - 原因：定义会被运行中变更污染，无法审计历史
   - 替代：四层分离（Dify 工业范式）：`workflow`(定义) / `workflow_run`(实例) / `workflow_node_execution`(节点) / `workflow_session_state`(快照)

---

## 六、参考链接清单

### 项目官方
- LangGraph: https://github.com/langchain-ai/langgraph
- AutoGen: https://github.com/microsoft/autogen
- CrewAI: https://github.com/crewAIInc/crewAI
- Dify: https://github.com/langgenius/dify
- PocketFlow: https://github.com/The-Pocket/PocketFlow
- LlamaIndex Workflows: https://github.com/run-llama/llama_index
- n8n: https://github.com/n8n-io/n8n
- Temporal: https://github.com/temporal-io/temporal
- Agno: https://github.com/agno-agi/agno
- Flowise: https://github.com/FlowiseAI/Flowise
- Langflow: https://github.com/langflow-ai/langflow

### 关键文档
- LangGraph interrupt + Command(resume): https://docs.langchain.com/oss/javascript/langgraph/interrupts
- LangGraph Human-in-the-loop: https://www.langchain.com/blog/making-it-easier-to-build-human-in-the-loop-agents-with-interrupt
- LangGraph Time Travel: https://forum.langchain.com/t/how-to-time-travel-to-before-interrupt-and-resume-with-a-different-value/2434
- AutoGen Teams (GroupChat/GraphFlow): https://microsoft.github.io/autogen/stable//reference/python/autogen_agentchat.teams.html
- AutoGen Selector Group Chat: https://microsoft.github.io/autogen/stable//user-guide/agentchat-user-guide/selector-group-chat.html
- AutoGen 维护模式声明: https://github.com/microsoft/autogen/blob/main/README.md
- CrewAI Tasks (context/guardrail/output_pydantic): https://docs.crewai.com/v1.14.7/en/concepts/tasks
- CrewAI Processes: https://docs.crewai.com/v1.14.7/en/concepts/processes
- CrewAI Checkpointing: https://deepwiki.com/crewAIInc/crewAI/8.2-checkpointing-and-flow-recovery
- Dify Workflow Definition: https://deepwiki.com/langgenius/dify/5.1-workflow-definition-and-execution-model
- Dify Human Input Node: https://deepwiki.com/langgenius/dify/5.6-human-input-node-and-pause-resume-mechanism
- PocketFlow Core (100 lines): https://github.com/The-Pocket/PocketFlow/blob/main/pocketflow/__init__.py
- LlamaIndex Workflows: https://developers.llamaindex.ai/python/llamaagents/workflows/
- LlamaIndex Context API: https://developers.llamaindex.ai/python/workflows-api-reference/context/
- Temporal Workflow Definition: https://docs.temporal.io/workflow-definition
- Temporal Workflows: https://docs.temporal.io/workflows
- n8n Data Structure: https://docs.n8n.io/data/data-structure/
- n8n Expressions: https://n8n-io-n8n.mintlify.app/workflows/expressions
- Coze 变量赋值节点: https://www.coze.cn/open/docs/guides/variable_assign_node
- Coze 变量聚合节点: https://www.coze.cn/open/docs/guides/variable_merge_node
- Coze 低代码工作流: https://www.coze.cn/open/docs/guides/workflow
- Agno Workflow HITL: https://deepwiki.com/agno-agi/agno/2.3.3-human-in-the-loop-(hitl)-workflows
- Agno Three-Layer Architecture: https://deepwiki.com/agno-agi/agno/1-overview

### 对比文章
- PocketFlow vs LangChain/CrewAI/LangGraph: https://github.com/The-Pocket/PocketFlow (Framework Positioning 章节)
- LangFlow vs Flowise: https://leanware.co/insights/compare-langflow-vs-flowise
- AutoGen v0.4 重写解析: https://newsletter.victordibia.com/p/a-friendly-introduction-to-the-autogen
- Temporal Determinism Concepts: https://keithtenzer.com/temporal/Temporal_Fundamentals_Concepts/

---

## 附录 A：调研方法论说明

- **deepwiki MCP**：抓取了 LangGraph、AutoGen、CrewAI、PocketFlow、Agno、Dify、n8n 的架构总览 + Dify 工作流定义子页（最关键的一页）。Temporal 的 deepwiki 抓取超时，改用 WebSearch 补足。
- **WebSearch**：补齐了 AutoGen GroupChat/GraphFlow、n8n expression、LangGraph interrupt、Flowise/Langflow、CrewAI task chaining、Coze 变量系统、LlamaIndex Workflows、Temporal programming model 等细节。
- **代码层核验**：直接读取了 AUBEAU `backend/app/services/aubeau/orchestrator/loop.py` 头部，确认 Orchestrator 是状态机式单 agent 循环（INIT→LOOP_GUARD→LLM_CALL→TOOL_EXEC→FINALIZE），有 `OrchestratorRequest`(含 request_id/tenant_id/budget) + `StepEvent` 契约 → 印证「复用 Orchestrator 作节点执行器」完全可行。
- **未逐行读源码**：按调研方法约定，抓架构层机制即可，未深入各项目源码实现细节。
