import React from 'react'

export const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-[#0F1113] text-[#C0C4CC] pt-safe-top pb-safe-bottom px-4">
    {children}
  </div>
)