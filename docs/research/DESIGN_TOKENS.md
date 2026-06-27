# 天工 (tiangong.cn) — Design Tokens

Extracted from live `https://www.tiangong.cn/` via `getComputedStyle()`.
Original site: Vue + Element Plus + Tailwind. Cloned in Next.js + Tailwind v4.

## Fonts

- **Display/UI:** `Outfit` (Google Font) — primary for Latin/headings
- **CJK:** `"Noto Sans SC"` (Google Font)
- **Stack:** `Outfit, "Noto Sans SC", "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif`
- Base size: **16px**, weight **400**, body color `rgb(50, 50, 51)` ≈ `#323233`

## Color System

### Brand
| Token | Hex | Usage |
|---|---|---|
| `--brand-brand01-black` | `#000818` | Primary text, 登录 button bg |
| `--brand-brand02-white` | `#ffffff` | Backgrounds |
| `--brand-brand03-blue` | `#4D5EFF` | Skywork blue accent, 文档 icon |
| `--brand-brand04-green` | `#00EBBE` | Teal accent |
| `--brand-brand05-magenta` | `#FF576D` | Pink accent, PPT icon |

### Neutral (grey scale)
| Token | Hex |
|---|---|
| `--neutral-grey60` | `#f9fafc` |
| `--neutral-grey80` | `#f7f8fa` (= `background-main-1`) |
| `--neutral-grey100` | `#f4f5f7` |
| `--neutral-grey200` | `#edeff1` (= card border / line-3) |
| `--neutral-grey300` | `#e1e3e7` (= top-line / sidebar border) |
| `--neutral-grey400` | `#d4d6dc` (= skill button border) |
| `--neutral-grey500` | `#c1c5cd` |
| `--neutral-grey600` | `#979fab` (= text-5) |
| `--neutral-grey700` | `#7f8896` (= text-4) |
| `--neutral-grey800` | `#485568` (= text-3) |
| `--neutral-grey900` | `#333b46` (= text-2) |
| `--neutral-grey950` | `#000818` |

### Text/icon scale
| Token | Resolves to |
|---|---|
| `--text-icon-text-1` | `#000818` (strongest) |
| `--text-icon-text-2` | `#333b46` (default body — buttons/labels) |
| `--text-icon-text-3` | `#485568` (secondary) |
| `--text-icon-text-4` | `#7f8896` (muted icons) |
| `--text-icon-text-5` | `#979fab` (placeholder) |

### Semantic backgrounds
| Token | Value | Usage |
|---|---|---|
| `--background-main-1` | `#f7f8fa` | Footer bg |
| `--background-main-5` | `#ffffff` | Home content area |
| `--background-main-7` | `#ffffff80` (50% white) | Secondary sidebar translucent |
| `--color-block-background` | `#ebedf0` | — |
| fill-4 | `#f9fafc` (≈grey60) | Template card bg |
| fill-7 | `rgba(255,255,255,0.6)` | 设计智能体 pill button bg |

### Skill icon brand colors
PPT `#FF576D` · 文档 `#4D5EFF` · 图片 `#FFAA00` · 表格 `#29CC5F` · 网站 `#7357FF` · 全部Skills `{#FFC362,#00C9A7,#FF4BD5,#FF0033}` · 视频 `currentColor`

### Gradients
- VIP dark: `linear-gradient(90deg, #FFDFA1 0%, #FFB861 100%)`
- Beta badge bg: `#fff2eb`, text `#fa6915`

## Radii
- Pill/按钮 primary: `12px`
- Card (template): `20px`, cover image inside `16px`
- Home container top corners: `20px 0 0 0` (tl+tr)
- Icon buttons: `8px` (lg) / `6px` (sm)
- IM entry card: `10px`

## Shadows
- `--el-box-shadow`: `0px 12px 32px 4px rgba(0,0,0,.04), 0px 8px 20px rgba(0,0,0,.08)`
- `--el-box-shadow-light`: `0px 0px 12px rgba(0,0,0,.12)`

## Spacing scale (Tailwind defaults observed)
4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 30, 40, 50, 150 (hero top margin)
