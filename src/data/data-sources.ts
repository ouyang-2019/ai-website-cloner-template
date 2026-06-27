/** 一手数据源 — 源自 Kimi 数据源体系（8 个结构化 API 数据源）。 */
export interface DataSource {
  key: string;
  name: string;
  desc: string;
  apiCount: number;
  domain: "金融行情" | "宏观经济" | "全球发展" | "学术文献" | "企业工商" | "法律法规";
  tags: string[];
}

export const DATA_SOURCES: DataSource[] = [
  {
    key: "yahoo_finance",
    name: "Yahoo Finance",
    desc: "A股 / 港股 / 美股行情、历史价格、财报、期权链与分析师评级",
    apiCount: 14,
    domain: "金融行情",
    tags: ["股票", "ETF", "外汇", "加密货币", "期权"],
  },
  {
    key: "ifind",
    name: "同花顺 iFinD",
    desc: "金融终端：宏观、行业、债券、基金、研报全量结构化数据",
    apiCount: 22,
    domain: "金融行情",
    tags: ["宏观", "行业", "债券", "研报"],
  },
  {
    key: "sec_edgar",
    name: "SEC EDGAR",
    desc: "美国证监会披露：10-K / 10-Q / 13F 等监管文件全文检索与解析",
    apiCount: 8,
    domain: "金融行情",
    tags: ["监管披露", "10-K", "美股"],
  },
  {
    key: "imf",
    name: "IMF 国际货币基金",
    desc: "全球宏观经济、国际贸易、汇率与金融稳健性指标",
    apiCount: 10,
    domain: "宏观经济",
    tags: ["宏观", "汇率", "贸易"],
  },
  {
    key: "world_bank_open_data",
    name: "世界银行开放数据",
    desc: "全球发展指标：GDP、人口、贫困、教育与环境",
    apiCount: 6,
    domain: "全球发展",
    tags: ["GDP", "人口", "发展指标"],
  },
  {
    key: "scholar",
    name: "Google Scholar",
    desc: "学术文献检索：论文、引用网络、作者档案与版本",
    apiCount: 5,
    domain: "学术文献",
    tags: ["论文", "引用", "学术"],
  },
  {
    key: "tianyancha",
    name: "天眼查",
    desc: "企业工商信息、股权结构、风险扫描、关联关系与知识产权",
    apiCount: 12,
    domain: "企业工商",
    tags: ["工商", "股权", "风险", "知产"],
  },
  {
    key: "yuandian_law",
    name: "元典法律",
    desc: "法律法规库、裁判文书与案例检索、法条关联分析",
    apiCount: 9,
    domain: "法律法规",
    tags: ["法条", "判例", "裁判文书"],
  },
];
