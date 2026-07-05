import React, { useState } from 'react'
import { Layout } from './components/Layout'

type View = 'onboarding' | 'dashboard' | 'evolution' | 'archive'

function App() {
  const [view, setView] = useState<View>('onboarding')

  const navigate = (newView: View) => {
    setView(newView)
  }

  return (
    <Layout>
      <div className="flex-1">
        {view === 'onboarding' && (
          <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-2xl font-bold mb-4">Welcome to Cadence</h1>
            <button
              onClick={() => navigate('dashboard')}
              className="px-6 py-3 bg-[#D4AF37] text-[#0F1113] rounded-full font-semibold hover:opacity-90 transition"
            >
              Get Started
            </button>
          </div>
        )}
        {view === 'dashboard' && (
          <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            <p className="text-gray-500">Quest management interface</p>
          </div>
        )}
        {view === 'evolution' && (
          <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-2xl font-bold mb-4">Evolution Lab</h1>
            <p className="text-gray-500">Quest history and archive</p>
          </div>
        )}
        {view === 'archive' && (
          <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-2xl font-bold mb-4">Archive</h1>
            <p className="text-gray-500">Past quarters</p>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default App