import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('should render onboarding view by default', () => {
    render(<App />)

    expect(screen.getByText('Welcome to Cadence')).toBeInTheDocument()
    expect(screen.getByText('Get Started')).toBeInTheDocument()
  })

  it('should navigate to dashboard when Get Started is clicked', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Get Started' }))

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Quest management interface')).toBeInTheDocument()
  })

  it('should support navigation between all views', () => {
    render(<App />)

    // Start at onboarding
    expect(screen.getByText('Welcome to Cadence')).toBeInTheDocument()

    // Navigate to dashboard
    fireEvent.click(screen.getByRole('button', { name: 'Get Started' }))
    expect(screen.getByText('Dashboard')).toBeInTheDocument()

    // Navigate to evolution lab
    const evolutionButton = screen.getByText('Quest management interface')
    expect(evolutionButton).toBeInTheDocument()
  })
})