
import React, { useState, useEffect } from 'react';
import { getAllTickets, getTicketById, updateTicket, addMessageToTicket, getCustomerHistory } from '../services/mockDB';
import { Ticket, TicketStatus, Channel, Message } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Copy, Check, MessageSquarePlus, User, Bot, AlertCircle, History, MessageCircle, Send, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const STATUS_COLORS = {
  [TicketStatus.OPEN]: 'bg-blue-100 text-blue-700 border-blue-200 shadow-sm',
  [TicketStatus.PROCESSING]: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  [TicketStatus.RESOLVED]: 'bg-green-100 text-green-700 border-green-200 shadow-sm',
  [TicketStatus.ESCALATED]: 'bg-red-100 text-red-700 border-red-200',
  [TicketStatus.AWAITING_HUMAN]: 'bg-purple-100 text-purple-700 border-purple-200 shadow-sm',
};

const SENTIMENT_COLORS = (score: number) => {
  if (score > 0.7) return 'text-green-700 bg-green-50 border-green-100';
  if (score < 0.3) return 'text-red-700 bg-red-50 border-red-100';
  return 'text-yellow-700 bg-yellow-50 border-yellow-100';
};

const SentimentBadge: React.FC<{ score: number }> = ({ score }) => {
  const label = score > 0.7 ? 'Positive' : score < 0.3 ? 'Negative' : 'Neutral';
  const emoji = score > 0.7 ? '😊' : score < 0.3 ? '😠' : '😐';
  
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${SENTIMENT_COLORS(score)}`}>
      <span>{emoji}</span>
      <span>{label} ({(score * 100).toFixed(0)}%)</span>
    </div>
  );
};

const AISuggestionChip: React.FC<{ suggestion: string; onUse: (s: string) => void }> = ({ suggestion, onUse }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(suggestion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03, backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onUse(suggestion)}
      className="group flex items-center gap-2.5 bg-black/5 text-gray-900 px-4 py-2 rounded-xl border border-black/5 hover:border-cyber-blue/50 transition-all cursor-pointer shadow-sm max-w-[280px]"
    >
      <Bot className="w-3.5 h-3.5 text-cyber-blue" />
      <span className="text-xs font-bold truncate flex-1 leading-tight" title={suggestion}>{suggestion}</span>
      <button 
        onClick={handleCopy}
        className="ml-1 p-1 hover:bg-white/10 rounded-full transition-colors"
        title="Copy to clipboard"
      >
        {copied ? (
          <Check className="w-3 h-3 text-cyber-green" />
        ) : (
          <Copy className="w-3 h-3 opacity-40 group-hover:opacity-100" />
        )}
      </button>
    </motion.div>
  );
};

const CHANNEL_ICONS = {
  [Channel.EMAIL]: '📧',
  [Channel.WHATSAPP]: '💬',
  [Channel.WEB_FORM]: '🌐',
};

export const Dashboard: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filter, setFilter] = useState<TicketStatus | 'all'>('all');
  const [modalTab, setModalTab] = useState<'thread' | 'history'>('thread');
  const [customerHistory, setCustomerHistory] = useState<Ticket[]>([]);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    setTickets(getAllTickets());
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      setCustomerHistory(getCustomerHistory(selectedTicket.customer_email));
    }
  }, [selectedTicket]);

  const refreshData = () => {
    const all = getAllTickets();
    setTickets(all);
    if (selectedTicket) {
      const updated = all.find(t => t.id === selectedTicket.id);
      if (updated) setSelectedTicket(updated);
    }
  };

  const handleHandover = () => {
    if (!selectedTicket) return;
    
    updateTicket(selectedTicket.id, { status: TicketStatus.AWAITING_HUMAN });
    addMessageToTicket(selectedTicket.id, {
      conversation_id: selectedTicket.conversation_id,
      channel: selectedTicket.source_channel,
      direction: 'outbound',
      role: 'system',
      content: 'Ticket status updated: Handed over to a human agent for further assistance.'
    });
    
    refreshData();
  };

  const handleSendMessage = () => {
    if (!selectedTicket || !replyText.trim()) return;

    addMessageToTicket(selectedTicket.id, {
      conversation_id: selectedTicket.conversation_id,
      channel: selectedTicket.source_channel,
      direction: 'outbound',
      role: 'agent',
      content: replyText
    });

    updateTicket(selectedTicket.id, { status: TicketStatus.RESOLVED });
    setReplyText('');
    refreshData();
  };

  const filteredTickets = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);

  const stats = [
    { label: 'Total Tickets', value: tickets.length, color: 'text-gray-900' },
    { label: 'Open', value: tickets.filter(t => t.status === TicketStatus.OPEN).length, color: 'text-blue-600' },
    { label: 'Escalated', value: tickets.filter(t => t.status === TicketStatus.ESCALATED).length, color: 'text-red-600' },
    { label: 'Resolved', value: tickets.filter(t => t.status === TicketStatus.RESOLVED).length, color: 'text-green-600' },
  ];

  const chartData = [
    { name: 'Email', value: tickets.filter(t => t.source_channel === Channel.EMAIL).length },
    { name: 'WhatsApp', value: tickets.filter(t => t.source_channel === Channel.WHATSAPP).length },
    { name: 'Web Form', value: tickets.filter(t => t.source_channel === Channel.WEB_FORM).length },
  ];

  const COLORS = ['#00f2ff', '#39ff14', '#bc00ff'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar - Analytics */}
      <div className="lg:col-span-1 space-y-8">
        <div className="glass-card p-6 neon-border">
          <h3 className="text-sm font-black text-gray-500 uppercase tracking-[0.2em] mb-6">Neural Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            {stats.map(s => (
              <div key={s.label} className="p-4 bg-black/5 rounded-xl border border-black/5">
                <p className="text-xs text-gray-500 font-black uppercase tracking-widest mb-1">{s.label}</p>
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 neon-border">
          <h3 className="text-sm font-black text-gray-500 uppercase tracking-[0.2em] mb-6">Channel Load</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} innerRadius={50} outerRadius={70} paddingAngle={8} dataKey="value" stroke="none">
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '12px', color: '#1a1a1a' }}
                  itemStyle={{ color: '#0070f3' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-3">
            {chartData.map((d, i) => (
              <div key={d.name} className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                <span className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: COLORS[i], color: COLORS[i] }}></div>
                  <span className="text-gray-400">{d.name}</span>
                </span>
                <span className="text-gray-900">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Ticket List */}
      <div className="lg:col-span-3 space-y-8">
        <div className="glass-card neon-border overflow-hidden">
          <div className="p-8 border-b border-black/5 flex flex-wrap justify-between items-center gap-6">
            <h2 className="text-2xl font-black text-gray-900 tracking-tighter">ACTIVE <span className="text-cyber-blue">NODES</span></h2>
            <div className="flex gap-2 bg-black/5 p-1 rounded-xl border border-black/5">
              {['all', ...Object.values(TicketStatus)].map(s => (
                <button
                  key={s}
                  onClick={() => setFilter(s as any)}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                    filter === s 
                      ? 'bg-cyber-blue text-white shadow-md' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-black/5'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-black/5 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">
                <tr>
                  <th className="px-8 py-5">Identity</th>
                  <th className="px-8 py-5">Payload</th>
                  <th className="px-8 py-5">Channel</th>
                  <th className="px-8 py-5">State</th>
                  <th className="px-8 py-5">Sentiment</th>
                  <th className="px-8 py-5">Timestamp</th>
                  <th className="px-8 py-5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filteredTickets.map(t => (
                  <tr key={t.id} className="hover:bg-black/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="font-bold text-gray-900 text-base">{t.customer_name}</div>
                      <div className="text-xs text-gray-500 font-medium">{t.customer_email}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-base font-medium text-gray-700 line-clamp-1">{t.subject}</div>
                      <div className="mt-2">
                        <span className="px-2 py-0.5 bg-black/5 text-cyber-blue text-xs font-black rounded uppercase tracking-widest border border-black/10">
                          {t.category}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span title={t.source_channel} className="text-xl filter grayscale group-hover:grayscale-0 transition-all">{CHANNEL_ICONS[t.source_channel]}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${STATUS_COLORS[t.status]}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      {t.messages[0]?.sentiment_score !== undefined ? (
                        <SentimentBadge score={t.messages[0].sentiment_score} />
                      ) : (
                        <span className="text-xs text-gray-600 font-black uppercase tracking-widest">N/A</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-xs text-gray-500 font-bold">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-6">
                      <button 
                        onClick={() => setSelectedTicket(t)}
                        className="text-cyber-blue hover:text-gray-900 font-black text-xs uppercase tracking-widest underline underline-offset-4 transition-colors"
                      >
                        Access Link
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredTickets.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-8 py-20 text-center text-gray-600 font-black uppercase tracking-[0.3em] text-sm">No active nodes detected</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Ticket Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card border-black/10 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-black/5 bg-black/5">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-2xl font-black text-gray-900 tracking-tighter">SESSION: {selectedTicket.subject}</h3>
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${STATUS_COLORS[selectedTicket.status]}`}>
                          {selectedTicket.status.replace('_', ' ')}
                        </span>
                        <span className="px-3 py-1 bg-black/5 text-cyber-blue rounded-full text-xs font-black uppercase tracking-widest border border-black/10">
                          {selectedTicket.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                      <User className="w-4 h-4 text-cyber-blue" />
                      <p>Subject Identity: <span className="text-gray-900 font-bold">{selectedTicket.customer_name}</span> <span className="text-gray-500">[{selectedTicket.customer_email}]</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {selectedTicket.status !== TicketStatus.AWAITING_HUMAN && (
                      <button 
                        onClick={handleHandover}
                        className="px-5 py-2.5 bg-cyber-purple/10 text-cyber-purple text-xs font-black uppercase tracking-widest rounded-xl hover:bg-cyber-purple/20 transition-all flex items-center gap-3 border border-cyber-purple/30 shadow-sm"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Human Override
                      </button>
                    )}
                    <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-black/5 rounded-full transition-colors text-gray-400 hover:text-gray-900">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-8 border-b border-black/5 -mb-8">
                  <button 
                    onClick={() => setModalTab('thread')}
                    className={`pb-4 px-2 text-xs font-black uppercase tracking-[0.2em] transition-all border-b-2 flex items-center gap-3 ${modalTab === 'thread' ? 'border-cyber-blue text-cyber-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Neural Thread
                  </button>
                  <button 
                    onClick={() => setModalTab('history')}
                    className={`pb-4 px-2 text-xs font-black uppercase tracking-[0.2em] transition-all border-b-2 flex items-center gap-3 ${modalTab === 'history' ? 'border-cyber-blue text-cyber-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    <History className="w-4 h-4" />
                    Archive Data ({customerHistory.length})
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 bg-white/50 cyber-grid bg-fixed">
                {modalTab === 'thread' ? (
                  <div className="space-y-8">
                    {/* Sentiment Summary Header */}
                    {selectedTicket.messages.some(m => m.sentiment_score !== undefined) && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm backdrop-blur-md flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs text-gray-500 font-black uppercase tracking-[0.2em] mb-2">Neural Sentiment Analysis</p>
                          <div className="flex items-center gap-3">
                            <SentimentBadge score={selectedTicket.messages.reduce((acc, m) => m.sentiment_score !== undefined ? m.sentiment_score : acc, 0.5)} />
                            <span className="text-xs text-gray-400 font-bold italic">Real-time processing active</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 font-black uppercase tracking-[0.2em] mb-2">Threat Level</p>
                          <span className={`text-sm font-black tracking-widest ${selectedTicket.priority === 'high' ? 'text-red-600' : 'text-cyber-blue'}`}>
                            {selectedTicket.priority.toUpperCase()}
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {selectedTicket.messages.map((m, idx) => (
                      <motion.div 
                        key={m.id}
                        initial={{ opacity: 0, x: m.role === 'customer' ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`flex ${m.role === 'customer' ? 'justify-start' : m.role === 'system' ? 'justify-center' : 'justify-end'}`}
                      >
                        {m.role === 'system' ? (
                          <div className="bg-black/5 text-gray-500 text-xs font-black uppercase px-5 py-2 rounded-full tracking-[0.2em] border border-black/5">
                            {m.content}
                          </div>
                        ) : (
                          <div className={`max-w-[80%] p-6 rounded-2xl shadow-sm border backdrop-blur-sm ${
                            m.role === 'customer' 
                              ? 'bg-white text-gray-800 rounded-tl-none border-black/5' 
                              : 'bg-gradient-to-br from-cyber-blue/10 to-cyber-purple/10 text-gray-900 rounded-tr-none border-cyber-blue/20'
                          }`}>
                            <div className="flex justify-between items-center mb-4 gap-6">
                              <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                                {m.role === 'customer' ? <User className="w-3.5 h-3.5 text-cyber-blue" /> : <Bot className="w-3.5 h-3.5 text-cyber-purple" />}
                                {m.role === 'customer' ? 'Subject' : 'Digital FTE'} • {m.channel}
                              </span>
                              {m.sentiment_score !== undefined && (
                                <SentimentBadge score={m.sentiment_score} />
                              )}
                            </div>
                            <p className="text-base whitespace-pre-wrap leading-relaxed font-medium">{m.content}</p>
                            <div className="mt-4 text-xs text-right text-gray-400 font-black tracking-widest">
                              {new Date(m.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                    {selectedTicket.status === TicketStatus.ESCALATED && (
                      <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl text-red-400 text-base italic text-center shadow-2xl backdrop-blur-md">
                        <div className="font-black mb-2 uppercase text-xs tracking-[0.3em]">Critical Escalation</div>
                        Neural core detected high-priority conflict. Human intervention required.
                        <br/>
                        <span className="text-gray-900 font-bold mt-2 inline-block">Reason: {selectedTicket.resolution_notes || 'Anomaly detected'}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="grid grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
                        <p className="text-xs text-gray-500 font-black uppercase tracking-widest mb-2">Total Sessions</p>
                        <p className="text-3xl font-black text-gray-900">{customerHistory.length}</p>
                      </div>
                      <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
                        <p className="text-xs text-gray-500 font-black uppercase tracking-widest mb-2">Resolved</p>
                        <p className="text-3xl font-black text-green-600">{customerHistory.filter(t => t.status === TicketStatus.RESOLVED).length}</p>
                      </div>
                      <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
                        <p className="text-xs text-gray-500 font-black uppercase tracking-widest mb-2">Avg. Affinity</p>
                        <p className="text-3xl font-black text-blue-600">
                          {(customerHistory.reduce((acc, t) => acc + (t.messages[0]?.sentiment_score || 0.5), 0) / customerHistory.length * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    {/* Sentiment Trend Chart */}
                    <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
                      <p className="text-xs text-gray-500 font-black uppercase tracking-[0.2em] mb-6">Neural Affinity Trend</p>
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[...customerHistory].reverse().map((t, i) => ({ 
                            name: `T-${customerHistory.length - i}`, 
                            sentiment: (t.messages[0]?.sentiment_score || 0.5) * 100 
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis dataKey="name" hide />
                            <YAxis domain={[0, 100]} hide />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '12px', color: '#1a1a1a', fontSize: '10px' }}
                              labelStyle={{ fontWeight: 'black', color: '#0070f3' }}
                            />
                            <Line type="monotone" dataKey="sentiment" stroke="#0070f3" strokeWidth={4} dot={{ r: 4, fill: '#0070f3', strokeWidth: 0 }} activeDot={{ r: 8, fill: '#fff', stroke: '#0070f3', strokeWidth: 2 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] mb-6">Historical Data Logs</h4>
                      <div className="space-y-4">
                        {customerHistory.map(t => (
                          <div key={t.id} className={`p-6 rounded-2xl border bg-white shadow-sm transition-all ${t.id === selectedTicket.id ? 'ring-2 ring-cyber-blue border-cyber-blue/50 bg-blue-50' : 'border-black/5 hover:border-black/10'}`}>
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <p className="text-base font-black text-gray-900 tracking-tight">{t.subject}</p>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">{new Date(t.created_at).toLocaleDateString()} • {t.category}</p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${STATUS_COLORS[t.status]}`}>
                                  {t.status.replace('_', ' ')}
                                </span>
                                {t.messages[0]?.sentiment_score !== undefined && (
                                  <SentimentBadge score={t.messages[0].sentiment_score} />
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2 italic font-medium">"{t.messages[0].content}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-black/10 bg-white/80 backdrop-blur-xl">
                 {selectedTicket.ai_suggestions && selectedTicket.ai_suggestions.length > 0 && (
                   <div className="mb-6">
                     <div className="flex items-center gap-3 mb-4">
                       <Bot className="w-4 h-4 text-cyber-blue" />
                       <p className="text-xs font-black text-gray-500 uppercase tracking-[0.3em]">Neural Response Suggestions</p>
                     </div>
                     <div className="flex flex-wrap gap-3">
                       {selectedTicket.ai_suggestions.map((suggestion, idx) => (
                         <AISuggestionChip 
                           key={idx} 
                           suggestion={suggestion} 
                           onUse={(s) => setReplyText(s)} 
                         />
                       ))}
                     </div>
                   </div>
                 )}
                 <div className="flex gap-4">
                   <input 
                    id="human-reply-input"
                    type="text" 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Enter manual override response..." 
                    className="flex-1 px-6 py-4 bg-black/5 text-gray-900 border border-black/10 rounded-xl outline-none focus:ring-2 focus:ring-cyber-blue placeholder:text-gray-400 font-medium transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                   <button 
                    onClick={handleSendMessage}
                    className="px-8 py-4 bg-gradient-to-r from-cyber-blue to-cyber-purple text-white font-black text-sm uppercase tracking-widest rounded-xl flex items-center gap-3 hover:shadow-[0_0_25px_rgba(0,242,255,0.4)] transition-all transform active:scale-95"
                   >
                     <Send className="w-4 h-4" />
                     Transmit
                   </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
