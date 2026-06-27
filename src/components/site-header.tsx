"use client";

import Link from "next/link";
import { Menu, QrCode } from "lucide-react";
import { CreditHeaderButton } from "@/components/credits/credit-header-button";

/**
 * 顶部导航栏 (header.header-nav-bar).
 * Transparent, h-54px, flex justify-between, pr-20px. Fixed at top of viewport.
 * Left: logo wordmark + "AUBEAU 智能体" pill (Beta badge) + grid menu icon.
 * Right: app-download (QR) + 定价 + 积分 + 登录（跳转 /login 页）。
 */
export function SiteHeader() {
  return (
    <header className="header-nav-bar el-header z-30 flex h-[54px] shrink-0 items-center justify-between border-b border-[var(--glass-border-subtle)] bg-white/65 pr-5 backdrop-blur-xl">
      {/* Left cluster */}
      <div className="flex min-w-0 flex-1 items-center">
        {/* AUBEAU brand lockup */}
        <Link href="/" className="ml-[18px] mr-4 flex items-center gap-2 py-5">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[15px] font-bold text-white"
            style={{ backgroundImage: "var(--gradient-brand)", boxShadow: "0 6px 20px -6px rgba(16,185,129,0.45)" }}
            aria-hidden
          >
            A
          </span>
          <span className="text-[20px] font-semibold tracking-tight text-[var(--brand-brand01-black)]">
            AUBEAU
          </span>
        </Link>

        {/* 设计智能体 pill button */}
        <button
          type="button"
          className="bg-[var(--fill-7)] mr-2 flex h-8 cursor-pointer items-center gap-1.5 rounded-xl px-2.5 pl-2.5 transition-colors hover:bg-white"
        >
          {/* design glyph (multi-color, data-URI in original) */}
          <svg width={18} height={18} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M16.5 12.375V14.625C16.5 15.75 15.75 16.5 14.625 16.5H4.5C4.8075 16.5 5.1225 16.455 5.415 16.3575C5.4975 16.3275 5.58 16.2975 5.6625 16.26C5.925 16.155 6.18 16.005 6.405 15.81C6.4725 15.7575 6.5475 15.69 6.615 15.6225L6.645 15.5925L11.745 10.5H14.625C15.75 10.5 16.5 11.25 16.5 12.375Z" fill="#FFC710" />
            <path opacity={0.8} d="M13.7775 8.4675L11.745 10.5L6.645 15.5925C7.17 15.0525 7.5 14.31 7.5 13.5V6.255L9.5325 4.2225C10.3275 3.4275 11.3925 3.4275 12.1875 4.2225L13.7775 5.8125C14.5725 6.6075 14.5725 7.6725 13.7775 8.4675Z" fill="#FB6C15" />
            <path d="M5.625 1.5H3.375C2.25 1.5 1.5 2.25 1.5 3.375V13.5C1.5 13.7025 1.5225 13.905 1.56 14.1C1.5825 14.1975 1.605 14.295 1.635 14.3925C1.6725 14.505 1.71 14.6175 1.755 14.7225C1.7625 14.73 1.7625 14.7375 1.7625 14.7375C1.77 14.7375 1.77 14.7375 1.7625 14.745C1.8675 14.955 1.9875 15.1575 2.13 15.345C2.2125 15.4425 2.295 15.5325 2.3775 15.6225C2.46 15.7125 2.55 15.7875 2.6475 15.8625L2.655 15.87C2.8425 16.0125 3.045 16.1325 3.255 16.2375C3.2625 16.23 3.2625 16.23 3.2625 16.2375C3.375 16.29 3.4875 16.3275 3.6075 16.365C3.705 16.395 3.8025 16.4175 3.9 16.44C4.095 16.4775 4.2975 16.5 4.5 16.5C4.8075 16.5 5.1225 16.455 5.415 16.3575C5.4975 16.3275 5.58 16.2975 5.6625 16.26C5.925 16.155 6.18 16.005 6.405 15.81C6.4725 15.7575 6.5475 15.69 6.615 15.6225L6.645 15.5925C7.17 15.0525 7.5 14.31 7.5 13.5V3.375C7.5 2.25 6.75 1.5 5.625 1.5ZM4.5 14.625C3.8775 14.625 3.375 14.1225 3.375 13.5C3.375 12.8775 3.8775 12.375 4.5 12.375C5.1225 12.375 5.625 12.8775 5.625 13.5C5.625 14.1225 5.1225 14.625 4.5 14.625Z" fill="#0DCDFC" />
          </svg>
          <span className="text-[var(--text-icon-text-2)] whitespace-nowrap text-[15px] leading-[1.5]">
            AUBEAU 智能体
          </span>
          <span className="flex h-[18px] items-center justify-center rounded-lg bg-[var(--beta-bg)] px-1 text-[10px] leading-none text-[var(--beta-text)]">
            测试版
          </span>
        </button>

        {/* grid menu tooltip icon */}
        <button
          type="button"
          aria-label="菜单"
          className="hover:bg-[var(--fill-3-hover)] cursor-pointer rounded-md p-1 transition-colors"
        >
          <Menu className="h-5 w-5 text-[var(--text-icon-text-3)]" strokeWidth={1.75} />
        </button>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="App 下载"
          className="hover:bg-[var(--fill-2)] flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
        >
          <QrCode className="h-5 w-5 text-[var(--text-icon-text-3)]" strokeWidth={1.75} />
        </button>
        <Link
          href="/pricing"
          className="hidden text-[14px] font-medium text-[var(--text-icon-text-2)] transition-colors hover:text-[var(--brand-brand01-black)] md:inline"
        >
          定价
        </Link>
        <CreditHeaderButton />
        <Link
          href="/login"
          className="login-btn bg-[var(--brand-brand01-black)] flex h-9 cursor-pointer items-center justify-center rounded-xl px-3 text-[15px] text-white transition-opacity hover:opacity-90"
        >
          登录
        </Link>
      </div>
    </header>
  );
}
