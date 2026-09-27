import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Layout } from './Layout'

describe('Layout', () => {
  it('should render children correctly', () => {
    render(
      <Layout>
        <div>Test Child</div>
      </Layout>
    )

    expect(screen.getByText('Test Child')).toBeInTheDocument()
  })

  it('should apply correct container classes', () => {
    const { container } = render(
      <Layout>
        <div>Content</div>
      </Layout>
    )

    const layoutDiv = container.firstChild as HTMLElement
    expect(layoutDiv).toHaveClass('min-h-screen')
    expect(layoutDiv).toHaveClass('bg-[#0F1113]')
    expect(layoutDiv).toHaveClass('text-[#C0C4CC]')
    expect(layoutDiv).toHaveClass('pt-safe-top')
    expect(layoutDiv).toHaveClass('pb-safe-bottom')
    expect(layoutDiv).toHaveClass('px-4')
  })

  it('should render multiple children', () => {
    render(
      <Layout>
        <h1>Title</h1>
        <p>Paragraph</p>
        <button>Click me</button>
      </Layout>
    )

    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Paragraph')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })
})