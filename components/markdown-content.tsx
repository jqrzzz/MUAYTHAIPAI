"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export default function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold text-white mt-8 mb-4 first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-semibold text-white mt-6 mb-3">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-medium text-white mt-5 mb-2">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-base font-medium text-neutral-200 mt-4 mb-2">{children}</h4>
        ),
        p: ({ children }) => (
          <p className="text-sm text-neutral-300 leading-relaxed mb-3">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-outside ml-5 mb-4 space-y-1.5 text-sm text-neutral-300">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-outside ml-5 mb-4 space-y-1.5 text-sm text-neutral-300">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="leading-relaxed">{children}</li>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-white">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-neutral-200">{children}</em>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-orange-500/40 pl-4 my-4 text-sm text-neutral-400 italic">
            {children}
          </blockquote>
        ),
        hr: () => (
          <hr className="border-white/10 my-6" />
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="border-b border-white/10">{children}</thead>
        ),
        tbody: ({ children }) => (
          <tbody className="divide-y divide-white/5">{children}</tbody>
        ),
        tr: ({ children }) => (
          <tr>{children}</tr>
        ),
        th: ({ children }) => (
          <th className="text-left py-2 px-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider">{children}</th>
        ),
        td: ({ children }) => (
          <td className="py-2 px-3 text-sm text-neutral-300">{children}</td>
        ),
        code: ({ children, className }) => {
          if (className?.includes("language-")) {
            return (
              <code className="block bg-white/5 rounded-lg p-4 text-sm text-neutral-300 overflow-x-auto mb-4">
                {children}
              </code>
            )
          }
          return (
            <code className="bg-white/10 rounded px-1.5 py-0.5 text-sm text-orange-300">{children}</code>
          )
        },
        a: ({ href, children }) => (
          <a href={href} className="text-orange-400 hover:underline" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
