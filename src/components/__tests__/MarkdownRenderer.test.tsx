import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import MarkdownRenderer from '../MarkdownRenderer'

// 模拟 react-markdown 组件
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>
}))

// 模拟 remark 插件
vi.mock('remark-breaks', () => ({
  default: () => {}
}))

vi.mock('remark-gfm', () => ({
  default: () => {}
}))

describe('MarkdownRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该渲染 Markdown 内容', () => {
    const markdownContent = '# 标题\n\n这是段落内容。'
    
    render(<MarkdownRenderer content={markdownContent} />)
    
    expect(screen.getByTestId('markdown')).toBeInTheDocument()
    expect(screen.getByTestId('markdown')).toHaveTextContent(markdownContent.replace(/\n/g, ' ').replace(/\s+/g, ' '))
  })

  it('应该处理空内容', () => {
    render(<MarkdownRenderer content="" />)
    
    expect(screen.getByTestId('markdown')).toBeInTheDocument()
    expect(screen.getByTestId('markdown')).toHaveTextContent('')
  })

  it('应该处理包含中文的内容', () => {
    const chineseContent = '# 中文标题\n\n这是中文内容，包含标点符号！？。'
    
    render(<MarkdownRenderer content={chineseContent} />)
    
    expect(screen.getByTestId('markdown')).toBeInTheDocument()
    expect(screen.getByTestId('markdown')).toHaveTextContent(chineseContent.replace(/\n/g, ' ').replace(/\s+/g, ' '))
  })

  it('应该处理包含代码块的内容', () => {
    const codeContent = '```javascript\nconst x = 1;\nconsole.log(x);\n```'
    
    render(<MarkdownRenderer content={codeContent} />)
    
    expect(screen.getByTestId('markdown')).toBeInTheDocument()
    expect(screen.getByTestId('markdown')).toHaveTextContent(codeContent.replace(/\n/g, ' '))
  })

  it('应该处理包含链接的内容', () => {
    const linkContent = '[GitHub](https://github.com) 是一个代码托管平台。'
    
    render(<MarkdownRenderer content={linkContent} />)
    
    expect(screen.getByTestId('markdown')).toBeInTheDocument()
    expect(screen.getByTestId('markdown')).toHaveTextContent(linkContent.replace(/\n/g, ' '))
  })

  it('应该处理包含图片的内容', () => {
    const imageContent = '![图片描述](https://example.com/image.png)'
    
    render(<MarkdownRenderer content={imageContent} />)
    
    expect(screen.getByTestId('markdown')).toBeInTheDocument()
    expect(screen.getByTestId('markdown')).toHaveTextContent(imageContent.replace(/\n/g, ' '))
  })

  it('应该处理包含表格的内容', () => {
    const tableContent = `| 列1 | 列2 |
|-----|-----|
| 值1 | 值2 |`
    
    render(<MarkdownRenderer content={tableContent} />)
    
    expect(screen.getByTestId('markdown')).toBeInTheDocument()
    expect(screen.getByTestId('markdown')).toHaveTextContent(tableContent.replace(/\n/g, ' '))
  })

  it('应该处理包含列表的内容', () => {
    const listContent = `- 项目1
- 项目2
- 项目3`
    
    render(<MarkdownRenderer content={listContent} />)
    
    expect(screen.getByTestId('markdown')).toBeInTheDocument()
    expect(screen.getByTestId('markdown')).toHaveTextContent(listContent.replace(/\n/g, ' '))
  })

  it('应该处理包含引用块的内容', () => {
    const quoteContent = '> 这是一个引用块\n> 可以包含多行内容'
    
    render(<MarkdownRenderer content={quoteContent} />)
    
    expect(screen.getByTestId('markdown')).toBeInTheDocument()
    expect(screen.getByTestId('markdown')).toHaveTextContent(quoteContent.replace(/\n/g, ' '))
  })

  it('应该处理包含内联代码的内容', () => {
    const inlineCodeContent = '使用 `console.log()` 来输出内容。'
    
    render(<MarkdownRenderer content={inlineCodeContent} />)
    
    expect(screen.getByTestId('markdown')).toBeInTheDocument()
    expect(screen.getByTestId('markdown')).toHaveTextContent(inlineCodeContent.replace(/\n/g, ' '))
  })

  it('应该处理包含强调的内容', () => {
    const emphasisContent = '这是**粗体**文本，这是*斜体*文本。'
    
    render(<MarkdownRenderer content={emphasisContent} />)
    
    expect(screen.getByTestId('markdown')).toBeInTheDocument()
    expect(screen.getByTestId('markdown')).toHaveTextContent(emphasisContent.replace(/\n/g, ' '))
  })

  it('应该处理包含删除线的内容', () => {
    const strikethroughContent = '这是~~删除线~~文本。'
    
    render(<MarkdownRenderer content={strikethroughContent} />)
    
    expect(screen.getByTestId('markdown')).toBeInTheDocument()
    expect(screen.getByTestId('markdown')).toHaveTextContent(strikethroughContent.replace(/\n/g, ' '))
  })

  it('应该处理包含任务列表的内容', () => {
    const taskListContent = `- [x] 已完成的任务
- [ ] 未完成的任务
- [ ] 另一个任务`
    
    render(<MarkdownRenderer content={taskListContent} />)
    
    expect(screen.getByTestId('markdown')).toBeInTheDocument()
    expect(screen.getByTestId('markdown')).toHaveTextContent(taskListContent.replace(/\n/g, ' '))
  })

  it('应该处理包含脚注的内容', () => {
    const footnoteContent = `这里是一个脚注[^1]。

[^1]: 这是脚注的内容。`
    
    render(<MarkdownRenderer content={footnoteContent} />)
    
    expect(screen.getByTestId('markdown')).toBeInTheDocument()
    expect(screen.getByTestId('markdown')).toHaveTextContent(footnoteContent.replace(/\n/g, ' ').replace(/\s+/g, ' '))
  })

  it('应该处理包含数学公式的内容', () => {
    const mathContent = `行内公式：$E = mc^2$

块级公式：
$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$`
    
    render(<MarkdownRenderer content={mathContent} />)
    
    expect(screen.getByTestId('markdown')).toBeInTheDocument()
    expect(screen.getByTestId('markdown')).toHaveTextContent(mathContent.replace(/\n/g, ' ').replace(/\s+/g, ' '))
  })

  it('应该处理包含 HTML 标签的内容', () => {
    const htmlContent = '<div>这是 HTML 内容</div>'
    
    render(<MarkdownRenderer content={htmlContent} />)
    
    expect(screen.getByTestId('markdown')).toBeInTheDocument()
    expect(screen.getByTestId('markdown')).toHaveTextContent(htmlContent.replace(/\n/g, ' '))
  })

  it('应该处理包含特殊字符的内容', () => {
    const specialCharsContent = '特殊字符：& < > " \' \\'
    
    render(<MarkdownRenderer content={specialCharsContent} />)
    
    expect(screen.getByTestId('markdown')).toBeInTheDocument()
    expect(screen.getByTestId('markdown')).toHaveTextContent(specialCharsContent.replace(/\n/g, ' '))
  })
})
