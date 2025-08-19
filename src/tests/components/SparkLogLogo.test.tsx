import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SparkLogLogo from '@/components/ui/SparkLogLogo'

describe('SparkLogLogo', () => {
  it('renders with default props', () => {
    render(<SparkLogLogo />)
    const svg = screen.getByTestId('sparklog-logo') || document.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('width', '32')
    expect(svg).toHaveAttribute('height', '32')
  })

  it('renders with custom size', () => {
    render(<SparkLogLogo size={48} />)
    const svg = screen.getByTestId('sparklog-logo') || document.querySelector('svg')
    expect(svg).toHaveAttribute('width', '48')
    expect(svg).toHaveAttribute('height', '48')
  })

  it('applies custom className', () => {
    render(<SparkLogLogo className="text-red-500" />)
    const svg = screen.getByTestId('sparklog-logo') || document.querySelector('svg')
    expect(svg).toHaveClass('text-red-500')
  })
})