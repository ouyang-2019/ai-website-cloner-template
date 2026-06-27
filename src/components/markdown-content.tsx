"use client";

import { useState, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Check, Copy } from "lucide-react";

/** 从 React 子树递归提取纯文本（用于代码块复制按钮）。 */
function nodeText(node: ReactNode): string {
  if (node == null || node === false || node === true) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (typeof node === "object" && node !== null && "props" in node) {
    return nodeText((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

/** 代码块容器：深色玻璃底 + 等宽 + 顶栏（语言标签 + 复制按钮）。 */
function CodeBlock({ children }: { children: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const raw = nodeText(children);
  // 从内层 <code className="hljs language-xxx"> 提取语言标签。
  const first = Array.isArray(children) ? children[0] : children;
  const cls =
    first && typeof first === "object" && "props" in first
      ? String((first as { props: { className?: string } }).props.className ?? "")
      : "";
  const lang = cls.match(/language-(\w+)/)?.[1] ?? "";
  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 剪贴板不可用时静默 */
    }
  };
  return (
    <div className="group my-2.5 overflow-hidden rounded-xl shadow-[var(--shadow-code)]">
      {/* 顶栏：语言标签 + 复制（天工/Kimi 风格） */}
      <div className="flex items-center justify-between bg-[var(--neutral-grey900)] px-3 py-1.5">
        <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--neutral-grey500)]">
          {lang || "code"}
        </span>
        {raw && (
          <button
            type="button"
            onClick={copy}
            aria-label="复制代码"
            className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--neutral-grey500)] transition-colors hover:bg-white/5 hover:text-[var(--neutral-grey60)] active:scale-[0.96]"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-[var(--brand-brand04-green)]" strokeWidth={2.5} />
            ) : (
              <Copy className="h-3.5 w-3.5" strokeWidth={2} />
            )}
          </button>
        )}
      </div>
      <pre className="overflow-x-auto bg-[var(--neutral-grey800)] p-3 font-mono text-[12.5px] leading-[20px] text-[var(--neutral-grey60)]">
        {children}
      </pre>
    </div>
  );
}

/** react-markdown 元素样式映射（玻璃/翡翠 token；链接强制 noopener；表格翡翠表头 + tabular-nums；标题 text-balance）。 */
const components: Components = {
  h1: ({ children }) => <h1 className="mb-2 mt-3 text-[18px] font-semibold leading-tight text-balance text-[var(--text-icon-text-1)]">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-3 text-[16px] font-semibold leading-tight text-balance text-[var(--text-icon-text-1)]">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-1.5 mt-2 text-[15px] font-semibold text-balance text-[var(--text-icon-text-1)]">{children}</h3>,
  h4: ({ children }) => <h4 className="mb-1 mt-2 text-[14px] font-semibold text-balance text-[var(--text-icon-text-1)]">{children}</h4>,
  p: ({ children }) => <p className="mb-2 text-pretty last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 ml-5 list-disc space-y-1 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 ml-5 list-decimal space-y-1 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="pl-1 marker:text-[var(--text-icon-text-4)]">{children}</li>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--brand-brand03-blue)] underline underline-offset-2 transition-opacity hover:opacity-80">
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold text-[var(--text-icon-text-1)]">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => <del className="text-[var(--text-icon-text-4)] line-through">{children}</del>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 rounded-r-lg border-l-2 border-[var(--brand-brand03-blue)] bg-[var(--neutral-grey60)] py-1.5 pl-3 text-[var(--text-icon-text-3)]">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-[var(--glass-border-subtle)]" />,
  table: ({ children }) => (
    <div className="my-2.5 overflow-x-auto rounded-xl shadow-[var(--shadow-bubble)]">
      <table className="w-full border-collapse text-[13px] tabular-nums">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-[var(--neutral-grey60)]">{children}</thead>,
  th: ({ children }) => <th className="border-b border-[var(--glass-border-subtle)] px-3 py-1.5 text-left font-semibold text-[var(--text-icon-text-1)]">{children}</th>,
  td: ({ children }) => <td className="border-b border-[var(--glass-border-subtle)] px-3 py-1.5 text-[var(--text-icon-text-2)]">{children}</td>,
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  // v9：block code 的 code 元素带 language-xxx className（已被 <pre> 包裹，样式由 CodeBlock 负责）；
  // inline code 无 className → 翡翠等宽小标签。
  code: ({ className, children }) => {
    if (/language-/.test(className ?? "")) {
      return <code className={className}>{children}</code>;
    }
    return <code className="rounded bg-[var(--neutral-grey100)] px-1 py-0.5 font-mono text-[12.5px] text-[var(--brand-brand03-blue)]">{children}</code>;
  },
};

/**
 * AI 回复 markdown 富文本渲染（react-markdown + remark-gfm + rehype-highlight）。
 * 玻璃/翡翠 token 样式；代码块带语言顶栏 + 复制；表格 tabular-nums；标题 text-balance。
 * @param streaming  流式生成中（渲染正文末尾打字光标，天工/Kimi 风格）
 */
export function MarkdownContent({ text, className = "", streaming = false }: { text: string; className?: string; streaming?: boolean }) {
  return (
    <div className={`text-[14px] leading-[22px] text-[var(--text-icon-text-2)] ${streaming ? "streaming-md" : ""} ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
