
import React, { useState } from 'react';
import { SupportForm } from './components/SupportForm';
import { Dashboard } from './components/Dashboard';

type View = 'form' | 'crm';

const App: React.FC = () => {
  const [view, setView] = useState<View>('form');

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 relative overflow-hidden cyber-grid">
      {/* Background Decorative Elements */}
      <div className="glow-orb top-[-100px] left-[-100px] bg-cyber-blue"></div>
      <div className="glow-orb bottom-[-100px] right-[-100px] bg-cyber-purple"></div>
      <div className="scan-line"></div>

      {/* Navigation Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-black/5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyber-blue to-cyber-purple rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-[0_0_20px_rgba(0,242,255,0.4)]">
                F
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyber-blue to-gray-900">
                  TECHCORP <span className="text-cyber-purple">FTE</span>
                </h1>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-cyber-green rounded-full animate-pulse"></div>
                  <p className="text-xs text-cyber-blue/60 uppercase tracking-[0.2em] font-black">AI Support Core v3.1</p>
                </div>
              </div>
            </div>

            <nav className="flex gap-3 bg-black/5 p-1.5 rounded-2xl border border-black/5">
              <button
                onClick={() => setView('form')}
                className={`px-8 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-300 ${
                  view === 'form' 
                    ? 'bg-cyber-blue text-white shadow-md' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-black/5'
                }`}
              >
                Customer Portal
              </button>
              <button
                onClick={() => setView('crm')}
                className={`px-8 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-300 ${
                  view === 'crm' 
                    ? 'bg-cyber-purple text-white shadow-md' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-black/5'
                }`}
              >
                CRM Dashboard
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        {view === 'form' ? (
          <div className="animate-in fade-in zoom-in-95 duration-700">
             <div className="text-center mb-16">
               <div className="inline-flex items-center gap-2 bg-cyber-blue/10 border border-cyber-blue/20 px-4 py-1.5 rounded-full mb-6">
                 <div className="w-2 h-2 bg-cyber-blue rounded-full animate-ping"></div>
                 <span className="text-cyber-blue text-xs font-black uppercase tracking-widest">Active Support Node</span>
               </div>
               <h2 className="text-6xl font-black text-gray-900 tracking-tighter mb-6">
                 INTELLIGENT <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-blue to-cyber-purple">INTERFACE</span>
               </h2>
               <p className="text-gray-600 text-lg max-w-2xl mx-auto font-medium leading-relaxed">
                 Our Digital FTE (Full-Time AI Employee) is processing requests in real-time. 
                 Experience the future of automated customer success.
               </p>
             </div>
             <div className="glass-card p-1 neon-border">
               <SupportForm />
             </div>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-700">
             <div className="flex justify-between items-end mb-12">
               <div>
                 <h2 className="text-4xl font-black text-gray-900 tracking-tighter">COMMAND <span className="text-cyber-purple">CENTER</span></h2>
                 <p className="text-gray-500 font-bold uppercase text-sm tracking-widest mt-2">Real-time neural network monitoring</p>
               </div>
               <div className="flex gap-4">
                 <div className="text-right">
                   <p className="text-xs text-gray-500 font-black uppercase tracking-widest">Uptime</p>
                   <p className="text-cyber-green font-mono font-bold">99.998%</p>
                 </div>
                 <div className="text-right">
                   <p className="text-xs text-gray-500 font-black uppercase tracking-widest">Latency</p>
                   <p className="text-cyber-blue font-mono font-bold">14ms</p>
                 </div>
               </div>
             </div>
             <Dashboard />
          </div>
        )}
      </main>

      {/* Footer info block */}
      <footer className="bg-white border-t border-black/5 py-16 mt-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black/5 border border-black/10 rounded-lg flex items-center justify-center text-cyber-blue font-black">F</div>
              <p className="text-xs text-gray-500 font-bold tracking-widest">TECHCORP AI SYSTEMS</p>
            </div>
            
            <div className="flex justify-center gap-12">
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="w-2 h-2 bg-cyber-green rounded-full group-hover:shadow-[0_0_10px_#39ff14]"></div>
                <span className="text-xs text-gray-400 font-black tracking-widest uppercase">Core Online</span>
              </div>
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="w-2 h-2 bg-cyber-blue rounded-full group-hover:shadow-[0_0_10px_#00f2ff]"></div>
                <span className="text-xs text-gray-400 font-black tracking-widest uppercase">Neural Sync</span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-600 font-black tracking-widest uppercase">
                &copy; 2026 Digital FTE Hackathon 5
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
