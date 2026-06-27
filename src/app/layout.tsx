import type { Metadata } from "next";
import "./globals.css";
import { CreditsProvider } from "@/components/credits/credits-provider";
import { CreditInsufficientDialog } from "@/components/credits/credit-insufficient-dialog";
import { TierLimitToast } from "@/components/credits/tier-limit-toast";

export const metadata: Metadata = {
  title: "AUBEAU · 企业级智能体协作平台",
  description:
    "AUBEAU — 企业级智能体协作平台：持久身份、长期记忆、自主触发、工件发布与渠道触达，一步到位。",
  icons: {
    icon: "/seo/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" className="light h-full antialiased">
      <body className="min-h-full flex flex-col overflow-hidden">
        <CreditsProvider>
          {children}
          <CreditInsufficientDialog />
          <TierLimitToast />
        </CreditsProvider>
      </body>
    </html>
  );
}
