import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BuildStatusIndicator from '../BuildStatusIndicator'

describe('BuildStatusIndicator', () => {
  const mockBuildInfo = {
    buildTime: '2024-01-01T12:00:00Z',
    totalNotes: 10,
    publicNotes: 8,
    privateNotes: 2
  }

  describe('构建状态显示', () => {
    it('应该显示正在构建状态', () => {
      const buildStatus = {
        isBuilding: true,
        lastBuildTime: '2024-01-01T11:00:00Z'
      }

      render(
        <BuildStatusIndicator
          buildStatus={buildStatus}
          buildInfo={mockBuildInfo}
        />
      )

      expect(screen.getByText('内容编译中...')).toBeInTheDocument()
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('应该显示构建错误状态', () => {
      const buildStatus = {
        isBuilding: false,
        error: '构建失败：语法错误'
      }

      const onRefresh = vi.fn()

      render(
        <BuildStatusIndicator
          buildStatus={buildStatus}
          buildInfo={mockBuildInfo}
          onRefresh={onRefresh}
        />
      )

      expect(screen.getByText('构建失败')).toBeInTheDocument()
      
      // 点击刷新按钮
      const refreshButton = screen.getByTitle('重新加载')
      fireEvent.click(refreshButton)
      
      expect(onRefresh).toHaveBeenCalledTimes(1)
    })

    it('应该显示内容最新状态', () => {
      const buildStatus = {
        isBuilding: false,
        lastBuildTime: new Date(Date.now() - 2 * 60 * 1000).toISOString() // 2分钟前
      }

      const buildInfo = {
        ...mockBuildInfo,
        buildTime: new Date(Date.now() - 2 * 60 * 1000).toISOString()
      }

      render(
        <BuildStatusIndicator
          buildStatus={buildStatus}
          buildInfo={buildInfo}
        />
      )

      expect(screen.getByText(/内容最新/)).toBeInTheDocument()
    })

    it('应该显示内容较旧状态', () => {
      const buildStatus = {
        isBuilding: false,
        lastBuildTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3小时前
      }

      const buildInfo = {
        ...mockBuildInfo,
        buildTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      }

      render(
        <BuildStatusIndicator
          buildStatus={buildStatus}
          buildInfo={buildInfo}
        />
      )

      expect(screen.getByText(/内容较旧/)).toBeInTheDocument()
    })
  })

  describe('笔记统计显示', () => {
    it('应该显示笔记总数', () => {
      const buildStatus = { isBuilding: false }

      render(
        <BuildStatusIndicator
          buildStatus={buildStatus}
          buildInfo={mockBuildInfo}
        />
      )

      expect(screen.getByText('10 篇')).toBeInTheDocument()
    })

    it('应该在有私密笔记时显示公开笔记数量', () => {
      const buildStatus = { isBuilding: false }

      render(
        <BuildStatusIndicator
          buildStatus={buildStatus}
          buildInfo={mockBuildInfo}
        />
      )

      expect(screen.getByText('(8 公开)')).toBeInTheDocument()
    })

    it('应该在没有私密笔记时不显示公开笔记数量', () => {
      const buildStatus = { isBuilding: false }
      const buildInfo = {
        ...mockBuildInfo,
        privateNotes: 0
      }

      render(
        <BuildStatusIndicator
          buildStatus={buildStatus}
          buildInfo={buildInfo}
        />
      )

      expect(screen.queryByText(/公开/)).not.toBeInTheDocument()
    })
  })

  describe('刷新功能', () => {
    it('应该在提供onRefresh时显示刷新按钮', () => {
      const buildStatus = { isBuilding: false }
      const onRefresh = vi.fn()

      render(
        <BuildStatusIndicator
          buildStatus={buildStatus}
          buildInfo={mockBuildInfo}
          onRefresh={onRefresh}
        />
      )

      const refreshButton = screen.getByTitle('刷新内容')
      expect(refreshButton).toBeInTheDocument()
      
      fireEvent.click(refreshButton)
      expect(onRefresh).toHaveBeenCalledTimes(1)
    })

    it('应该在未提供onRefresh时不显示刷新按钮', () => {
      const buildStatus = { isBuilding: false }

      render(
        <BuildStatusIndicator
          buildStatus={buildStatus}
          buildInfo={mockBuildInfo}
        />
      )

      expect(screen.queryByTitle('刷新内容')).not.toBeInTheDocument()
    })
  })

  describe('时间格式化', () => {
    it('应该正确格式化时间显示', () => {
      const buildStatus = { isBuilding: false }
      const buildInfo = {
        ...mockBuildInfo,
        buildTime: '2024-01-01T15:30:00Z'
      }

      render(
        <BuildStatusIndicator
          buildStatus={buildStatus}
          buildInfo={buildInfo}
        />
      )

      // 检查是否包含格式化的时间
      expect(screen.getByText(/01\/01 23:30/)).toBeInTheDocument()
    })

    it('应该处理无效的时间字符串', () => {
      const buildStatus = { isBuilding: false }
      const buildInfo = {
        ...mockBuildInfo,
        buildTime: 'invalid-date'
      }

      render(
        <BuildStatusIndicator
          buildStatus={buildStatus}
          buildInfo={buildInfo}
        />
      )

      // 应该显示原始字符串
      expect(screen.getByText(/invalid-date/)).toBeInTheDocument()
    })
  })

  describe('样式类名', () => {
    it('应该应用自定义className', () => {
      const buildStatus = { isBuilding: false }

      const { container } = render(
        <BuildStatusIndicator
          buildStatus={buildStatus}
          buildInfo={mockBuildInfo}
          className="custom-class"
        />
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('应该根据内容新鲜度应用不同的样式', () => {
      const buildStatus = { isBuilding: false }
      
      // 测试新鲜内容的样式
      const freshBuildInfo = {
        ...mockBuildInfo,
        buildTime: new Date(Date.now() - 1 * 60 * 1000).toISOString() // 1分钟前
      }

      const { container, rerender } = render(
        <BuildStatusIndicator
          buildStatus={buildStatus}
          buildInfo={freshBuildInfo}
        />
      )

      expect(container.firstChild).toHaveClass('text-green-700', 'bg-green-50')

      // 测试较旧内容的样式
      const staleBuildInfo = {
        ...mockBuildInfo,
        buildTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3小时前
      }

      rerender(
        <BuildStatusIndicator
          buildStatus={buildStatus}
          buildInfo={staleBuildInfo}
        />
      )

      expect(container.firstChild).toHaveClass('text-orange-700', 'bg-orange-50')
    })
  })

  describe('边界情况', () => {
    it('应该处理空的buildInfo', () => {
      const buildStatus = { isBuilding: false }

      render(
        <BuildStatusIndicator
          buildStatus={buildStatus}
          buildInfo={null}
        />
      )

      expect(screen.getByText('内容状态未知')).toBeInTheDocument()
    })

    it('应该处理没有buildTime的情况', () => {
      const buildStatus = { isBuilding: false }
      const buildInfo = {
        totalNotes: 5,
        publicNotes: 5,
        privateNotes: 0
      }

      render(
        <BuildStatusIndicator
          buildStatus={buildStatus}
          buildInfo={buildInfo}
        />
      )

      expect(screen.getByText('内容状态未知')).toBeInTheDocument()
    })
  })
})
