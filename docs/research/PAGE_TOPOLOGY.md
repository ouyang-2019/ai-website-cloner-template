# Page Topology — tiangong.cn homepage

## Root layout
```
html.light (lang="zh")
└── body (white bg, #323233 text, 16px)
    ├── header.header-nav-bar  ── fixed top, 54px, transparent bg, px-right 20px
    └── main  ── flex, h-[calc(100vh-54px)], overflow-x-auto
        ├── .sidebar-wrapper (290px) ── LEFT
        │   ├── .top-line (absolute 1px divider, #e1e3e7)
        │   └── .collapsed-simple-sidebar (290px, flex)
        │       ├── .sidebar (60px PRIMARY RAIL) ── icon nav, border-r 1px #e1e3e7
        │       │   ├── TOP group: 新建项目(active, bg 80% white), 探索技能, 定时任务(+new badge)
        │   │   │   └── each: 40×40 btn, radius 8px, p 6px 4px, mb-30px
        │       │   └── BOTTOM (mt-auto): 项目(chevron) + guide icon (36×36)
        │       └── .secondary-sidebar (230px) ── bg 50% white, rounded-tl-20px
        │           ├── content (p 6px 14px 14px) → sidebar-container (gap 8px)
        │           │   ├── top: search/new-project area (40px)
        │           │   ├── .project-list-scroll (flex-col gap 8px): 探索技能/定时任务/项目 (3 items × 202×40)
        │           │   └── .im-entry-card (202×71, radius 10px): "连接 IM 渠道" + brand logos
        │           └── light-half-circle.png (absolute top-right corner, 20×20)
        │
        └── content col (1150px, flex-1)
            └── scroller (overflow-x-auto, flex-col)
                └── x-new-home (1150×846, overflow-auto, rounded-tl/tr-20px, bg white)
                    └── .new-home-content-bg (1150×812, flex-col)
                        ├── BG IMAGE: skywork-homepage-bg-light.webp (page decoration)
                        ├── 0. x-search-area (860px centered, mt-150px, gap 20px) ── CENTER HERO
                        │   ├── general-hero (greeting row, 860×60, gap 12px)
                        │   │   ├── "配置SkyClaw" tooltip (89×30, #262d3a bg, white, 12px, radius 8px)
                        │   │   ├── "Hi，我是SkyClaw" (#485568, 18px)
                        │   │   └── "全能助手，一步开启高效任务处理新体验" (#000818, 24px/28.8, 500)
                        │   ├── chat input box (white, radius, border) ── placeholder "试试安排任务、自动流程或设置周期性工作，输入@可引用文件或技能"
                        │   │   ├── goal-mode-toggle "目标" (72×32, #f9fafc bg, radius 8px)
                        │   │   ├── "技能" button
                        │   │   ├── "智选模型" (15px, #485568) + New badge
                        │   │   └── send button (black circle)
                        │   └── .quick-skill-list (723×37, gap 12px/16px, flex-wrap)
                        │       └── 7 buttons: PPT 文档 图片 表格 网站 视频 全部Skills (h37, white, border #d4d6dc, radius 12px)
                        ├── 1. .quer-item-container "新用户免费体验" (HIDDEN by default)
                        ├── 2. 热门项目 gallery (1150×9024, waterfall masonry, ~100 cards)
                        │   ├── header row (.mb-16 .px-24): "热门项目" (#000818, 18px)
                        │   └── waterfall → .template-card (266×384, radius 20px, border #edeff1, p12)
                        │       ├── cover img (240×320, 3:4, radius 16px, object-cover)
                        │       └── title (16px/500, line-clamp-2) + "使用模板" (hover)
                        ├── 3. spacer (1×18, hidden)
                        ├── 4. footer (.fixed bottom-0, 1180×32, bg #f7f8fa, pt-6px)
                        │   └── 版权所有 © 昆仑万维科技股份有限公司 · 京公网安备11010102006563号 · 京ICP备09007496号-17 · 京ICP证080262号
                        └── 5. el-overlay modal (HIDDEN by default)
```

## Scroll model
- Window does NOT scroll. Header is fixed (54px).
- `main` = `h-[calc(100vh-54px)]`, horizontal overflow only.
- Vertical scroll happens inside `<x-new-home>` (`overflow:auto`) — the gallery + hero live here.
- Sidebar columns are full-height, fixed beside the scroller.
- Footer is `position: fixed; bottom: 0` overlaying the content (z-10).

## Interaction model per section
| Section | Model |
|---|---|
| Header | static (transparent). Buttons → routes (登录/modal) |
| Sidebar rail | click (nav select). Active = 80% white bg |
| Sidebar project list | click. Items have hover |
| SkyClaw hero | static greeting. Chat input = contenteditable focus state |
| Skill quick buttons | click (route to skill) + hover border/bg |
| 热门项目 gallery | click card → template. Hover = "使用模板" overlay appears |
| Footer | static links (备案 → external beian sites) |
