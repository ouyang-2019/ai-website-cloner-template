export type BeautyBarrierStatus = "ready" | "gray";

export interface BeautyBarrierTableRow {
  product: string;
  brand: string;
  platform: string;
  price: string;
  score: string;
  lifecycle: string;
}

export interface BeautyBarrierProfile {
  status: BeautyBarrierStatus;
  sourceProject: string;
  outputMode: string;
  pipeline: string[];
  deliverables: string[];
  concurrency: string;
  trendRows?: BeautyBarrierTableRow[];
  competitorScores?: Array<{ label: string; value: number; note: string }>;
  competitorRows?: Array<{ competitor: string; price: string; signal: string; risk: string }>;
}

export const BEAUTY_BARRIER_AGENT_PROFILES: Record<string, BeautyBarrierProfile> = {
  cosmetic_formula_review: {
    status: "ready",
    sourceProject: "化妆品备案安评助手开发B0 · Dify formula_review + WebApp review_engine",
    outputMode: "结构化审核报告",
    pipeline: ["解析配方表", "Catalog2021/企业原料匹配", "15项成人法规检查", "儿童7项附加检查", "风险分级与证据导出"],
    deliverables: ["配方审核结论", "禁限用/超限/配伍风险清单", "原料展开表", "可下载审核报告"],
    concurrency: "确定性规则引擎优先，目录/企业原料表常驻索引，LLM 只用于解释和摘要，可按租户队列横向扩展。",
  },
  cosmetic_safety_report: {
    status: "ready",
    sourceProject: "化妆品备案安评助手开发B0 · Dify safety_report + services/safety",
    outputMode: "Word/Excel 安评工件",
    pipeline: ["配方与产品参数校验", "暴露参数计算", "三源资料比对", "安全边际与风险物质整理", "报告导出"],
    deliverables: ["安评记录", "Word 安评报告", "Excel 计算底表", "参考依据与附录"],
    concurrency: "重报告任务进入后台队列，预计算常用暴露参数和原料资料，报告导出异步化并写 artifact。",
  },
  cosmetic_ingredient_compliance: {
    status: "ready",
    sourceProject: "化妆品备案安评助手开发B0 · Dify ingredient_query + Catalog2021",
    outputMode: "原料合规评审表",
    pipeline: ["原料名称归一", "法规目录查询", "限用量/使用范围判断", "风险物质与标签要求提取", "历史使用量对照"],
    deliverables: ["原料法规卡片", "风险等级", "适用范围限制", "标签/警示要求"],
    concurrency: "热点原料查询走只读缓存，批量评审分片执行，法规库更新用版本化索引避免锁表。",
  },
  cosmetic_claim_compliance: {
    status: "ready",
    sourceProject: "化妆品备案安评助手开发B0 · copywriting_engine + 备案审核法规 RAG",
    outputMode: "文案合规审查报告",
    pipeline: ["OCR/文本抽取", "禁用词与功效宣称扫描", "备案法规 RAG 检索", "处罚案例对照", "九维风险审查"],
    deliverables: ["文案风险点", "合规改写建议", "证据出处", "待人工确认项"],
    concurrency: "规则扫描本地完成，RAG 只取必要法规片段，长文档按段落并发审查后合并结论。",
  },
  cosmetic_artwork_consistency: {
    status: "ready",
    sourceProject: "化妆品备案安评助手开发B0 · artwork_compare_service + draft_diff",
    outputMode: "一致性差异清单",
    pipeline: ["包装稿/OCR 解析", "备案资料字段抽取", "配方全成分核对", "宣称与标签交叉检查", "版本差异定位"],
    deliverables: ["差异定位表", "高风险不一致项", "版本对比摘要", "复核清单"],
    concurrency: "OCR 和字段抽取可分文件并行，差异比对是确定性流程，结果缓存到工件快照。",
  },
  cosmetic_reference_formula: {
    status: "ready",
    sourceProject: "化妆品备案安评助手开发B0 · AI Formulator state_machine/verifiers",
    outputMode: "参考配方草案与 verifier 报告",
    pipeline: ["结构化 brief", "真实配方锚点检索", "模板优先生成", "后处理归一", "A/B/C verifier + 定向修复"],
    deliverables: ["参考配方表", "商品名/INCI/比例", "工程 warning", "verifier 证据"],
    concurrency: "高确定性模板先行，A 级失败才进入定向修复；重生成链路进队列并设置租户级并发上限。",
  },
  beauty_trend_radar: {
    status: "ready",
    sourceProject: "product-trend-radar · collectors + analysis/report + data_hub",
    outputMode: "趋势报告 + 抓取数据报表",
    pipeline: ["多源采集/导入", "爆品评分", "生命周期分层", "趋势报告生成", "抓取数据表展示"],
    deliverables: ["热点爆品趋势分析报告", "抓取数据报表", "评分与生命周期", "数据局限性提示"],
    concurrency: "采集任务离线/定时跑，用户请求读取快照和物化表；实时刷新进入独立采集队列并按供应商限流。",
    trendRows: [
      { product: "科颜萃 B5 精华", brand: "科颜萃", platform: "抖音/淘宝", price: "¥59.9", score: "40.8", lifecycle: "观察期" },
      { product: "OLAY 水光小白瓶", brand: "OLAY", platform: "京东/抖音", price: "¥129", score: "40.5", lifecycle: "观察期" },
      { product: "珀莱雅源力精华", brand: "珀莱雅", platform: "天猫/小红书", price: "¥259", score: "40.3", lifecycle: "观察期" },
      { product: "雅诗兰黛小棕瓶", brand: "Estée Lauder", platform: "天猫/京东", price: "¥690", score: "40.2", lifecycle: "标杆样本" },
    ],
  },
  beauty_competitor_due_diligence: {
    status: "ready",
    sourceProject: "美妆雷达 高保真 v1-暖色原版.dc.html · Hermes market_radar",
    outputMode: "暖色六维竞品背调报告",
    pipeline: ["输入产品/品牌/链接", "联网检索与数据源快照", "六维评分", "竞品矩阵", "品牌/公司穿透与风险机会"],
    deliverables: ["六维评分概览", "竞品评分矩阵", "品牌公司穿透", "价格/口碑/需求供给趋势", "策略建议"],
    concurrency: "把竞品快照、品牌穿透和价格趋势拆成可缓存子任务，报告页读取聚合结果；监控类任务按目标维度增量刷新。",
    competitorScores: [
      { label: "价格力", value: 86, note: "中低价带可放量" },
      { label: "功效力", value: 78, note: "强功效需证据背书" },
      { label: "口碑力", value: 72, note: "正负反馈分化" },
      { label: "渠道力", value: 68, note: "内容电商强于线下" },
      { label: "品牌力", value: 61, note: "母公司背书有限" },
      { label: "风险", value: 42, note: "同质化与监管趋严" },
    ],
    competitorRows: [
      { competitor: "The Ordinary 烟酰胺精华", price: "¥65-89", signal: "平价强认知", risk: "国际品牌下沉" },
      { competitor: "CeraVe 水杨酸线", price: "¥79-129", signal: "温和修护心智", risk: "直接功效对标" },
      { competitor: "SkinCeuticals 院线精华", price: "¥600+", signal: "专业背书强", risk: "高端价差明显" },
    ],
  },
  beauty_ingredient_research_gray: {
    status: "gray",
    sourceProject: "计划推出 · 原料资产/供应商 ETL + company_ingredients",
    outputMode: "原料调研档案",
    pipeline: ["供应商检索", "牌号/INCI 归一", "价格区间抽取", "功效与使用量对照", "品牌应用反查"],
    deliverables: ["供应商清单", "牌号型号", "价格范围", "功效/用量", "知名品牌应用"],
    concurrency: "供应商和价格数据离线抓取，运行时只做索引检索与增量校验，避免每次实时爬取。",
  },
  beauty_factory_research_gray: {
    status: "gray",
    sourceProject: "计划推出 · 工厂/工商/法规风险数据源",
    outputMode: "工厂背调报告",
    pipeline: ["代工厂识别", "合作客户抽取", "规模/产能判断", "财务与工商风险", "法规处罚扫描"],
    deliverables: ["工厂画像", "合作品牌", "产能与优势", "财务风险", "法规风险"],
    concurrency: "工商和处罚数据做日级快照，重查询进队列，报告聚合走缓存和物化视图。",
  },
  beauty_brand_research_gray: {
    status: "gray",
    sourceProject: "计划推出 · 品牌/公司/渠道/舆情数据源",
    outputMode: "品牌调研报告",
    pipeline: ["品牌定位识别", "公司股权穿透", "渠道信号汇总", "爆品结构分析", "口碑风险扫描"],
    deliverables: ["品牌定位", "公司穿透", "渠道表现", "产品矩阵", "风险机会"],
    concurrency: "品牌底档缓存，渠道和口碑指标按天滚动刷新，用户报告按需拼装。",
  },
  beauty_packaging_research_gray: {
    status: "gray",
    sourceProject: "计划推出 · 包材供应商/工艺/MOQ 数据源",
    outputMode: "包材调研报告",
    pipeline: ["包材供应商检索", "工艺与材质归类", "MOQ/报价抽取", "剂型适配", "交期风险评估"],
    deliverables: ["供应商与工艺", "MOQ/报价", "适配剂型", "交期风险", "备选方案"],
    concurrency: "包材 SKU 和供应商目录离线索引，报价只存区间和时间戳，避免高频外部请求。",
  },
};

export function beautyBarrierProfile(skillRef: string): BeautyBarrierProfile | null {
  return BEAUTY_BARRIER_AGENT_PROFILES[skillRef] ?? null;
}
