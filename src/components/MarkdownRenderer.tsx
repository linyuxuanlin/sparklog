import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

interface MarkdownRendererProps {
  content: string
  className?: string
  preview?: boolean
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  className = ''
}) => {
  return (
    <div className={`prose max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
                     // 段落处理
           p: ({ children }) => (
             <p className="text-gray-600 dark:text-gray-300 mb-2 last:mb-0 text-inherit">
               {children}
             </p>
           ),
          // 标题处理
          h1: ({ children }) => (
            <h1 className="text-gray-900 dark:text-gray-100 font-bold text-lg mb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-gray-900 dark:text-gray-100 font-semibold text-base mb-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-gray-900 dark:text-gray-100 font-semibold text-sm mb-2">
              {children}
            </h3>
          ),
          // 强调处理
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-700 dark:text-gray-200">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-700 dark:text-gray-200">
              {children}
            </em>
          ),
          // 代码处理
          code: ({ children, className }) => {
            const isInline = !className
            if (isInline) {
              return (
                <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-sm font-mono text-gray-800 dark:text-gray-200">
                  {children}
                </code>
              )
            }
            return (
              <code className="block bg-gray-100 dark:bg-gray-700 p-2 rounded text-sm font-mono text-gray-800 dark:text-gray-200 overflow-x-auto">
                {children}
              </code>
            )
          },
          // 代码块处理
          pre: ({ children }) => (
            <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm font-mono text-gray-800 dark:text-gray-200 overflow-x-auto mb-2">
              {children}
            </pre>
          ),
          // 列表处理
                     ul: ({ children }) => (
             <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-2 space-y-1 text-inherit">
               {children}
             </ul>
           ),
           ol: ({ children }) => (
             <ol className="list-decimal list-inside text-gray-600 dark:text-gray-300 mb-2 space-y-1 text-inherit">
               {children}
             </ol>
           ),
           li: ({ children }) => (
             <li className="text-gray-600 dark:text-gray-300 text-inherit">
               {children}
             </li>
           ),
          // 链接处理
          a: ({ children, href }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
            >
              {children}
            </a>
          ),
          // 引用处理
                     blockquote: ({ children }) => (
             <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-300 mb-2 text-inherit">
               {children}
             </blockquote>
           ),
          // 分割线处理
          hr: () => (
            <hr className="border-gray-300 dark:border-gray-600 my-4" />
          ),
          // 表格处理
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2">
              <table className="min-w-full border border-gray-300 dark:border-gray-600">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50 dark:bg-gray-700">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody>
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-gray-300 dark:border-gray-600">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">
              {children}
            </th>
          ),
                     td: ({ children }) => (
             <td className="px-3 py-2 text-gray-600 dark:text-gray-300 text-inherit">
               {children}
             </td>
           ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer 