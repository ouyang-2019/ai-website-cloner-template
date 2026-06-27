# Behaviors — tiangong.cn homepage

Observed during recon. No smooth-scroll library (Lenis/Locomotive) detected — native scroll only.

## Scroll behavior
- **Window scroll:** disabled. Header is `position: fixed` (54px).
- **Content scroll:** vertical scroll lives inside `<x-new-home>` (`overflow: auto`). Sidebar stays put; hero scrolls away; gallery scrolls; footer is a `fixed bottom-0` overlay (always visible).
- No scroll-snap, no parallax, no scroll-driven animations detected.

## Header
- Transparent background, static. No shrink/shadow on scroll (content scrolls beneath, header never moves).
- 登录 button: click → login modal/route. 设计智能体 pill: click → route. Grid menu icon: tooltip.

## Sidebar
- **Primary rail (60px):** click a nav icon → becomes active (bg `rgba(255,255,255,0.8)`, radius 8px). Default active = 新建项目.
- **Nav items** have `cursor: pointer`; hover likely lightens bg (`hover:bg-fill-fill-3-hover`).
- **Secondary panel:** project list items clickable, hover bg. "连接 IM 渠道" card → opens IM connection flow.

## SkyClaw hero
- Greeting is static text.
- **Chat input** (`contenteditable`-style box): placeholder shown when empty `"试试安排任务、自动流程或设置周期性工作，输入@可引用文件或技能"`. Focus → caret + placeholder hides.
- **目标 toggle:** click → switches mode (target/skill). bg `#f9fafc`, radius 8px.
- **智选模型:** dropdown trigger (chevron up icon = open). Has "New" badge.
- **Send button:** black circle, disabled state when input empty.
- **Skill quick buttons:** click → route. Hover: border darkens / subtle bg. Each has a colored leading icon.

## 热门项目 gallery
- **Masonry/waterfall layout** (`.waterfall-item` wrappers; original uses JS waterfall). Clone with CSS `columns` + `break-inside: avoid`.
- **Card hover:** "使用模板" pill (white text, hidden by default w/h 0) fades in over the cover; card gains shadow. Cursor pointer.
- **Card click:** → template detail.

## Footer
- Static links (no hover color change observed beyond pointer). 备案 links open external `beian.mps.gov.cn` / `beian.miit.gov.cn`.

## Responsive
- Original is **desktop-first** (fixed 290+1150 layout, horizontal overflow on narrow viewports). No graceful mobile layout — the `main` is `overflow-x-auto`. Clone targets desktop (≥1280px); below that, allow horizontal scroll as the original does. No separate mobile breakpoints to replicate.

## Transitions
- Sidebar collapse: `transition-all duration-*` on `.collapsed-simple-sidebar`.
- Skill button icon: chevron `transition-transform duration-200`.
- General hover transitions: short (~150-200ms) ease, on background-color/border-color.
