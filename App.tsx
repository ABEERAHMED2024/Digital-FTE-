
import React, { useState } from 'react';
import { SupportForm } from './components/SupportForm';
import { Dashboard } from './components/Dashboard';

type View = 'form' | 'crm';

const App: React.FC = () => {
  const [view, setView] = useState<View>('form');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200">
                F
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 leading-none">TechCorp FTE</h1>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1">24/7 AI Support Engine</p>
              </div>
            </div>

            <nav className="flex gap-2 bg-gray-100 p-1.5 rounded-xl">
              <button
                onClick={() => setView('form')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  view === 'form' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Customer Portal
              </button>
              <button
                onClick={() => setView('crm')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  view === 'crm' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                CRM Dashboard
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {view === 'form' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="text-center mb-12">
               <span className="bg-blue-100 text-blue-600 text-xs font-black uppercase px-3 py-1 rounded-full mb-4 inline-block">Support Component</span>
               <h2 className="text-4xl font-black text-gray-900 tracking-tight">Need help? We're on it.</h2>
               <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
                 Our Digital FTE (Full-Time AI Employee) handles queries instantly. 
                 Try asking about pricing, troubleshooting, or just say hello!
               </p>
             </div>
             <SupportForm />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="mb-8">
               <h2 className="text-3xl font-black text-gray-900 tracking-tight">Agent Workspace</h2>
               <p className="text-gray-500 font-medium">Monitoring the Digital FTE's performance across all channels.</p>
             </div>
             <Dashboard />
          </div>
        )}
      </main>

      {/* Footer info block */}
      <footer className="bg-white border-t border-gray-100 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-400 font-medium mb-4">
            Digital FTE Hackathon 5 • Built with React, Tailwind & Gemini 3
          </p>
          <div className="flex justify-center gap-8">
            <div className="flex items-center gap-2 text-green-500 text-xs font-bold">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              SYSTEMS ONLINE
            </div>
            <div className="flex items-center gap-2 text-blue-500 text-xs font-bold">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              AI ENGINE READY
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
