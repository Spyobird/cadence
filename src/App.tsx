import React, { useState } from 'react'
import { Layout } from './components/Layout'
import { Onboarding } from './components/Onboarding'
import { Dashboard } from './components/Dashboard'
import { EvolutionLab } from './components/EvolutionLab'
import { ReflectionLog } from './components/ReflectionLog'

type View = 'onboarding' | 'dashboard' | 'evolution' | 'archive'

function App() {
  const [view, setView] = useState<View>('onboarding')

  const navigate = (newView: View) => {
    setView(newView)
  }

  return (
    <Layout>
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 overflow-y-auto">
          {view === 'onboarding' && (
            <Onboarding onNavigate={() => navigate('dashboard')} />
          )}
          {view === 'dashboard' && (
            <Dashboard onNavigate={navigate} />
          )}
          {view === 'evolution' && (
            <EvolutionLab onNavigate={navigate} />
          )}
          {view === 'archive' && (
            <ReflectionLog onNavigate={navigate} />
          )}
        </main>

        {view !== 'onboarding' && (
          <nav className="fixed bottom-0 left-0 right-0 bg-[#0F1113]/90 backdrop-blur-sm border-t border-[#1E2124] px-6 py-3 flex justify-around items-center text-xs font-mono uppercase tracking-widest">
            <button
              onClick={() => navigate('dashboard')}
              className={`flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-[#D4AF37]' : 'text-[#64748B]'}`}
            >
              <span>Home</span>
            </button>
            <button
              onClick={() => navigate('evolution')}
              className={`flex flex-col items-center gap-1 ${view === 'evolution' ? 'text-[#D4AF37]' : 'text-[#64748B]'}`}
            >
              <span>Evolution</span>
            </button>
            <button
              onClick={() => navigate('archive')}
              className={`flex flex-col items-center gap-1 ${view === 'archive' ? 'text-[#D4AF37]' : 'text-[#64748B]'}`}
            >
              <span>Archive</span>
            </button>
          </nav>
        )}
      </div>
    </Layout>
  )
}

export default App