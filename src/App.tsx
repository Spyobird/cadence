import React, { useState } from 'react'
import { Layout } from './components/Layout'
import { Onboarding } from './components/Onboarding'

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
          <Onboarding onNavigate={() => navigate('dashboard')} />
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