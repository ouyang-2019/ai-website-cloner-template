"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  BrainCircuit,
  Workflow,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch, setAuthToken } from "@/lib/api";
import { HomePromoBanner } from "@/components/promo-banner";

type AuthMode = "password" | "code" | "register";

interface AuthResponse {
  token?: string;
  access_token?: string;
}

/**
 * AUBEAU 登录/注册页面
 * 左侧深色品牌面板（参考  的"夜空 + 暖琥珀"语言）+ 右侧白卡表单。
 * AUBEAU 品牌渐变仅保留在标识方块；其余强调色采用  的琥珀金 #E8B86A。
 */
export default function LoginPage() {
  const router = useRouter();

  // 模式切换：密码登录 / 验证码登录 / 注册
  const [mode, setMode] = useState<AuthMode>("password");

  // 表单字段
  const [account, setAccount] = useState(""); // 手机号或邮箱
  const [phone, setPhone] = useState(""); // 验证码模式专用手机号
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  // UI 状态
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 验证码倒计时
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // 开启 60 秒倒计时
  const startCountdown = () => {
    setCountdown(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
  };

  // 发送验证码（demo：仅前端倒计时）
  const handleSendCode = () => {
    if (!phone.trim()) {
      setError("请输入手机号");
      return;
    }
    if (countdown > 0) return;
    setError(null);
    startCountdown();
  };

  // 表单校验
  const validate = (): string | null => {
    if (mode === "code") {
      if (!phone.trim()) return "请输入手机号";
      if (!code.trim()) return "请输入验证码";
      return null;
    }
    if (!account.trim()) return "请输入手机号或邮箱";
    if (!password) return "请输入密码";
    if (mode === "register") {
      if (!confirmPassword) return "请再次输入密码";
      if (password !== confirmPassword) return "两次输入的密码不一致";
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "code") {
        // 验证码登录：demo 模式，真实后端接口 TBD
        setAuthToken("demo-" + Date.now());
        router.push("/");
        return;
      }

      const path = mode === "register" ? "/auth/register" : "/auth/login";
      const body =
        mode === "register"
          ? { account, password, inviteCode: inviteCode || undefined }
          : { account, password };

      const response = await apiFetch<AuthResponse>(path, {
        method: "POST",
        body: JSON.stringify(body),
      });
      const token = response.token || response.access_token;
      if (!token) throw new Error("响应缺少 token");
      setAuthToken(token);
      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "请求失败，请稍后重试";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const tabs: { key: AuthMode; label: string }[] = [
    { key: "password", label: "密码登录" },
    { key: "code", label: "验证码登录" },
    { key: "register", label: "注册" },
  ];

  return (
    <div className="bg-homepage flex min-h-screen w-full flex-col font-sans antialiased">
      {/* 顶部全宽促销广告栏（倒计时 + 跳转套餐） */}
      <HomePromoBanner />
      <div className="flex w-full flex-1">
      {/* ============================================================
          左侧品牌面板 —— 深夜空 + 琥珀光晕（ 语言）
         ============================================================ */}
      <aside className="relative hidden w-[46%] min-w-[480px] overflow-hidden lg:flex">
        {/* 基底：自上而下的近黑微渐变 */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, #0B0B0F 0%, #131318 55%, #0E0E12 100%)",
          }}
          aria-hidden
        />
        {/* 主光晕：右上琥珀色弥散光（ 标志色） */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 78% 20%, rgba(232,184,106,0.42) 0%, rgba(232,184,106,0.10) 32%, transparent 58%)",
          }}
          aria-hidden
        />
        {/* 次光晕：左下冷调反衬 */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 18% 82%, rgba(61,78,90,0.30) 0%, transparent 52%)",
          }}
          aria-hidden
        />
        {/* 星点纹理（极低透明度） */}
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.9) 0.6px, transparent 1.2px)",
            backgroundSize: "32px 32px",
          }}
          aria-hidden
        />
        {/* 顶部入光（柔和的漫射） */}
        <div
          className="absolute inset-x-0 top-0 h-40"
          style={{
            background:
              "linear-gradient(180deg, rgba(232,184,106,0.08) 0%, transparent 100%)",
          }}
          aria-hidden
        />

        {/* 居中品牌内容 */}
        <div className="relative z-10 flex w-full flex-col justify-center px-16 xl:px-20">
          {/* AUBEAU 标识（品牌渐变 A 方块 + wordmark） */}
          <div className="mb-14 flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-[12px] text-lg font-bold text-white shadow-[0_8px_24px_-8px_rgba(77,94,255,0.6)]"
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
              }}
              aria-hidden
            >
              A
            </span>
            <span className="text-[22px] font-semibold tracking-[-0.01em] text-white">
              AUBEAU
            </span>
          </div>

          {/* 主标题 */}
          <h1 className="text-[42px] font-bold leading-[1.12] tracking-[-0.02em] text-white xl:text-[48px]">
            企业级智能体
            <br />
            协作平台
          </h1>
          <p className="mt-5 max-w-[420px] text-[15px] leading-relaxed text-white/62">
            持久记忆 · 自主触发 · 一步到位 —— 让创意自由生长。
          </p>

          {/* 特性列表 */}
          <ul className="mt-14 max-w-[440px] space-y-5">
            <FeatureRow
              icon={<Sparkles className="h-[18px] w-[18px]" strokeWidth={1.75} />}
              title="一步到位"
              desc="自然语言驱动，复杂任务自动编排"
            />
            <FeatureRow
              icon={<BrainCircuit className="h-[18px] w-[18px]" strokeWidth={1.75} />}
              title="持久记忆"
              desc="跨会话上下文与技能沉淀"
            />
            <FeatureRow
              icon={<Workflow className="h-[18px] w-[18px]" strokeWidth={1.75} />}
              title="自主触发"
              desc="定时任务与事件驱动的工作流"
            />
          </ul>

          {/* 底部细线 + 版权 */}
          <div className="mt-16 border-t border-white/8 pt-6 text-[12px] text-white/40">
            © {new Date().getFullYear()} AUBEAU · Sovereign AI Agent Platform
          </div>
        </div>
      </aside>

      {/* ============================================================
          右侧表单面板
         ============================================================ */}
      <main className="relative flex flex-1 items-center justify-center px-6 py-12 sm:px-12">
        {/* 返回首页 */}
        <Link
          href="/"
          className="hover:bg-[#F4F5F7] absolute left-6 top-6 flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-[13px] text-[#7F8896] transition-colors sm:left-10 sm:top-10"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          返回首页
        </Link>

        <div className="w-full max-w-[420px]">
          {/* 移动端品牌标识（小屏可见） */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-[10px] text-sm font-bold text-white"
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
              }}
              aria-hidden
            >
              A
            </span>
            <span className="text-lg font-semibold tracking-[-0.01em] text-[#000818]">
              AUBEAU
            </span>
          </div>

          {/* 表单卡片 */}
          <div className="rounded-[24px] border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] p-8 shadow-[var(--shadow-glass)] backdrop-blur-[18px] saturate-150">
            <h2 className="text-[24px] font-semibold tracking-[-0.01em] text-[#000818]">
              欢迎使用 AUBEAU
            </h2>
            <p className="mt-1.5 text-[13px] text-[#7F8896]">
              登录或注册以开始你的智能体协作之旅
            </p>

            {/* 模式切换 Tab —— 分段控件 + 滑动指示器 */}
            <div className="relative mb-6 mt-7 flex gap-1 rounded-[12px] bg-[#F4F5F7] p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => switchMode(tab.key)}
                  className={cn(
                    "relative z-10 flex-1 cursor-pointer rounded-[8px] px-3 py-2 text-[13px] font-medium transition-colors duration-200",
                    mode === tab.key
                      ? "text-[#0B0B0F]"
                      : "text-[#979FAB] hover:text-[#485568]"
                  )}
                >
                  {tab.label}
                </button>
              ))}
              {/* 滑动指示器 */}
              <div
                className="absolute bottom-1 top-1 z-0 rounded-[8px] bg-white shadow-[0_2px_6px_rgba(11,11,15,0.08)] transition-all duration-300 ease-out"
                style={{
                  width: "calc((100% - 8px) / 3)",
                  left:
                    mode === "password"
                      ? "4px"
                      : mode === "code"
                        ? "calc((100% - 8px) / 3 + 4px)"
                        : "calc((100% - 8px) * 2 / 3 + 4px)",
                }}
                aria-hidden
              />
            </div>

            {/* 表单 */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {mode === "code" ? (
                <>
                  <Field label="手机号">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="请输入手机号"
                      autoComplete="tel"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="验证码">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="请输入验证码"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        className={cn(inputClass, "flex-1")}
                      />
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={countdown > 0}
                        className={cn(
                          "h-12 shrink-0 cursor-pointer rounded-[12px] border border-[#E1E3E7] bg-white px-3 text-[13px] font-medium transition-colors",
                          countdown > 0
                            ? "cursor-not-allowed text-[#C1C5CD]"
                            : "text-[var(--brand-brand03-blue)] hover:bg-[var(--brand-emerald-50)] hover:border-[var(--brand-emerald-200)]"
                        )}
                      >
                        {countdown > 0 ? (
                          <span className="tabular-nums">{countdown}s 后重发</span>
                        ) : (
                          "获取验证码"
                        )}
                      </button>
                    </div>
                  </Field>
                </>
              ) : (
                <>
                  <Field label="手机号 / 邮箱">
                    <input
                      type="text"
                      value={account}
                      onChange={(e) => setAccount(e.target.value)}
                      placeholder="请输入手机号或邮箱"
                      autoComplete="username"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="密码">
                    <PasswordInput
                      value={password}
                      onChange={setPassword}
                      show={showPassword}
                      onToggle={() => setShowPassword((v) => !v)}
                      placeholder="请输入密码"
                      autoComplete={
                        mode === "register" ? "new-password" : "current-password"
                      }
                    />
                  </Field>
                  {mode === "register" && (
                    <>
                      <Field label="确认密码">
                        <PasswordInput
                          value={confirmPassword}
                          onChange={setConfirmPassword}
                          show={showConfirm}
                          onToggle={() => setShowConfirm((v) => !v)}
                          placeholder="请再次输入密码"
                          autoComplete="new-password"
                        />
                      </Field>
                      <Field label="邀请码（可选）">
                        <input
                          type="text"
                          value={inviteCode}
                          onChange={(e) => setInviteCode(e.target.value)}
                          placeholder="如有邀请码请填写"
                          className={inputClass}
                        />
                      </Field>
                    </>
                  )}
                </>
              )}

              {/* 内联错误提示 */}
              {error && (
                <p className="rounded-[10px] border border-[#F3D8C4] bg-[#FDF4EC] px-3 py-2 text-[13px] text-[#B6660D]">
                  {error}
                </p>
              )}

              {/* 主提交按钮 —— 琥珀金渐变 */}
              <button
                type="submit"
                disabled={submitting}
                className={cn(
                  "mt-2 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[12px] text-[15px] font-semibold text-white transition-transform duration-150",
                  "active:scale-[0.96]",
                  submitting && "cursor-not-allowed opacity-75"
                )}
                style={{
                  backgroundImage: "var(--gradient-brand)",
                  boxShadow: "var(--shadow-glow-emerald)",
                }}
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
                {submitting ? "处理中..." : mode === "register" ? "注册" : "登录"}
              </button>
            </form>

            {/* 页脚：忘记密码 + 协议 */}
            <div className="mt-5 flex items-center justify-between text-[13px]">
              {mode === "password" ? (
                <button
                  type="button"
                  className="cursor-pointer text-[var(--brand-brand03-blue)] hover:underline"
                >
                  忘记密码?
                </button>
              ) : (
                <span />
              )}
              <label className="flex cursor-pointer items-center gap-1.5 text-[#7F8896]">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 cursor-pointer accent-[var(--brand-brand03-blue)]"
                />
                登录即同意
                <span className="text-[var(--brand-brand03-blue)]">《用户协议》</span>
                <span className="text-[var(--brand-brand03-blue)]">《隐私政策》</span>
              </label>
            </div>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}

// ---- 输入框样式 ----
// 高度 48px、圆角 12px、灰底，聚焦时琥珀色描边 + 光晕（ 风格）
const inputClass =
  "h-12 w-full rounded-[12px] border border-[var(--glass-border-subtle)] bg-[var(--glass-bg)] px-3.5 text-sm text-[#000818] backdrop-blur-[12px] placeholder:text-[#C1C5CD] transition-colors focus:border-[var(--brand-brand03-blue)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-brand03-blue)]/15";

// ---- 字段包装 ----
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-[#333B46]">
        {label}
      </span>
      {children}
    </label>
  );
}

// ---- 密码输入框（带显示/隐藏切换） ----
function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
  autoComplete: string;
}) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={cn(inputClass, "pr-11")}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? "隐藏密码" : "显示密码"}
        className="hover:bg-[#F4F5F7] absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[8px] transition-colors"
      >
        {show ? (
          <EyeOff className="h-4 w-4 text-[#7F8896]" strokeWidth={1.75} />
        ) : (
          <Eye className="h-4 w-4 text-[#7F8896]" strokeWidth={1.75} />
        )}
      </button>
    </div>
  );
}

// ---- 特性列表行 ----
// 深色面板上的玻璃质感图标瓦片 + 琥珀色图标
function FeatureRow({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex items-start gap-4">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-[#E8B86A]"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
        aria-hidden
      >
        {icon}
      </span>
      <div className="pt-0.5">
        <div className="text-[15px] font-medium text-white">{title}</div>
        <div className="mt-0.5 text-[13px] leading-relaxed text-white/55">
          {desc}
        </div>
      </div>
    </li>
  );
}
