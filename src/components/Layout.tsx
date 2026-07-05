import React from 'react'

export const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-gray-50 text-gray-900 pt-safe-top pb-safe-bottom px-4">
    {children}
  </div>
)