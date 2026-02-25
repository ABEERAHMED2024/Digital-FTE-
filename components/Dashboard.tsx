
import React, { useState, useEffect } from 'react';
import { getAllTickets, getTicketById, updateTicket, addMessageToTicket, getCustomerHistory } from '../services/mockDB';
import { Ticket, TicketStatus, Channel, Message } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Copy, Check, MessageSquarePlus, User, Bot, AlertCircle, History, MessageCircle, Send, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const STATUS_COLORS = {
  [TicketStatus.OPEN]: 'bg-blue-100 text-blue-800 border-blue-200',
  [TicketStatus.PROCESSING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [TicketStatus.RESOLVED]: 'bg-green-100 text-green-800 border-green-200',
  [TicketStatus.ESCALATED]: 'bg-red-100 text-red-800 border-red-200',
  [TicketStatus.AWAITING_HUMAN]: 'bg-purple-100 text-purple-800 border-purple-200',
};

const SENTIMENT_COLORS = (score: number) => {
  if (score > 0.7) return 'text-green-500 bg-green-50 border-green-100';
  if (score < 0.3) return 'text-red-500 bg-red-50 border-red-100';
  return 'text-yellow-600 bg-yellow-50 border-yellow-100';
};

const SentimentBadge: React.FC<{ score: number }> = ({ score }) => {
  const label = score > 0.7 ? 'Positive' : score < 0.3 ? 'Negative' : 'Neutral';
  const emoji = score > 0.7 ? '😊' : score < 0.3 ? '😠' : '😐';
  
  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${SENTIMENT_COLORS(score)}`}>
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
      whileHover={{ scale: 1.03, backgroundColor: '#eff6ff' }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onUse(suggestion)}
      className="group flex items-center gap-2.5 bg-white text-blue-700 px-4 py-2 rounded-full border border-blue-100 hover:border-blue-300 transition-all cursor-pointer shadow-sm hover:shadow-md max-w-[280px]"
    >
      <Bot className="w-3.5 h-3.5 text-blue-500" />
      <span className="text-[11px] font-bold truncate flex-1 leading-tight" title={suggestion}>{suggestion}</span>
      <button 
        onClick={handleCopy}
        className="ml-1 p-1 hover:bg-blue-200 rounded-full transition-colors"
        title="Copy to clipboard"
      >
        {copied ? (
          <Check className="w-3 h-3 text-green-600" />
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

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar - Analytics */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            {stats.map(s => (
              <div key={s.label} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-4">Channel Volume</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {chartData.map((d, i) => (
              <div key={d.name} className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                  {d.name}
                </span>
                <span className="font-bold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Ticket List */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
            <h2 className="text-2xl font-bold">Active Tickets</h2>
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              {['all', ...Object.values(TicketStatus)].map(s => (
                <button
                  key={s}
                  onClick={() => setFilter(s as any)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    filter === s ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {s.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Channel</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Sentiment</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTickets.map(t => (
                  <tr key={t.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{t.customer_name}</div>
                      <div className="text-xs text-gray-500">{t.customer_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 line-clamp-1">{t.subject}</div>
                      <div className="mt-1">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase tracking-wider border border-gray-200">
                          {t.category}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span title={t.source_channel} className="text-xl">{CHANNEL_ICONS[t.source_channel]}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${STATUS_COLORS[t.status]}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {t.messages[0]?.sentiment_score !== undefined ? (
                        <SentimentBadge score={t.messages[0].sentiment_score} />
                      ) : (
                        <span className="text-xs text-gray-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setSelectedTicket(t)}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-sm underline"
                      >
                        View Thread
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredTickets.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No tickets found matching this filter.</td>
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold">Ticket: {selectedTicket.subject}</h3>
                      <div className="flex gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${STATUS_COLORS[selectedTicket.status]}`}>
                          {selectedTicket.status.replace('_', ' ')}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase border border-slate-200">
                          {selectedTicket.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <User className="w-3.5 h-3.5" />
                      <p>Customer: <span className="font-bold text-gray-900">{selectedTicket.customer_name}</span> ({selectedTicket.customer_email})</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {selectedTicket.status !== TicketStatus.AWAITING_HUMAN && (
                      <button 
                        onClick={handleHandover}
                        className="px-4 py-2 bg-purple-100 text-purple-700 text-sm font-bold rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2 border border-purple-200"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Human Handover
                      </button>
                    )}
                    <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-6 border-b border-gray-100 -mb-6">
                  <button 
                    onClick={() => setModalTab('thread')}
                    className={`pb-3 px-1 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${modalTab === 'thread' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Conversation Thread
                  </button>
                  <button 
                    onClick={() => setModalTab('history')}
                    className={`pb-3 px-1 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${modalTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                  >
                    <History className="w-4 h-4" />
                    Customer History ({customerHistory.length})
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                {modalTab === 'thread' ? (
                  <div className="space-y-6">
                    {/* Sentiment Summary Header */}
                    {selectedTicket.messages.some(m => m.sentiment_score !== undefined) && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between"
                      >
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Current Sentiment Analysis</p>
                          <div className="flex items-center gap-2">
                            <SentimentBadge score={selectedTicket.messages.reduce((acc, m) => m.sentiment_score !== undefined ? m.sentiment_score : acc, 0.5)} />
                            <span className="text-xs text-gray-500 italic">Based on latest interaction</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Urgency Level</p>
                          <span className={`text-xs font-bold ${selectedTicket.priority === 'high' ? 'text-red-600' : 'text-blue-600'}`}>
                            {selectedTicket.priority.toUpperCase()}
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {selectedTicket.messages.map((m, idx) => (
                      <motion.div 
                        key={m.id}
                        initial={{ opacity: 0, x: m.role === 'customer' ? -10 : 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`flex ${m.role === 'customer' ? 'justify-start' : m.role === 'system' ? 'justify-center' : 'justify-end'}`}
                      >
                        {m.role === 'system' ? (
                          <div className="bg-gray-200/50 text-gray-500 text-[11px] font-bold uppercase px-4 py-1.5 rounded-full tracking-wider border border-gray-200">
                            {m.content}
                          </div>
                        ) : (
                          <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm border ${
                            m.role === 'customer' ? 'bg-white text-gray-800 rounded-tl-none border-gray-100' : 'bg-blue-600 text-white rounded-tr-none border-blue-500'
                          }`}>
                            <div className="flex justify-between items-center mb-2 gap-4">
                              <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 flex items-center gap-1.5">
                                {m.role === 'customer' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                                {m.role === 'customer' ? 'Customer' : 'Digital FTE'} • {m.channel}
                              </span>
                              {m.sentiment_score !== undefined && (
                                <SentimentBadge score={m.sentiment_score} />
                              )}
                            </div>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                            <div className="mt-2 text-[10px] text-right opacity-60">
                              {new Date(m.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                    {selectedTicket.status === TicketStatus.ESCALATED && (
                      <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-800 text-sm italic text-center shadow-sm">
                        <div className="font-bold mb-1 uppercase text-[10px] tracking-widest">Escalation Alert</div>
                        ⚠️ This ticket was escalated to human support by the AI.
                        <br/>
                        Reason: {selectedTicket.resolution_notes || 'High severity detection'}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Total Tickets</p>
                        <p className="text-2xl font-black text-gray-900">{customerHistory.length}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Resolved</p>
                        <p className="text-2xl font-black text-green-600">{customerHistory.filter(t => t.status === TicketStatus.RESOLVED).length}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Avg. Sentiment</p>
                        <p className="text-2xl font-black text-blue-600">
                          {(customerHistory.reduce((acc, t) => acc + (t.messages[0]?.sentiment_score || 0.5), 0) / customerHistory.length * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    {/* Sentiment Trend Chart */}
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">Sentiment Trend (Last {customerHistory.length} Tickets)</p>
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[...customerHistory].reverse().map((t, i) => ({ 
                            name: `T-${customerHistory.length - i}`, 
                            sentiment: (t.messages[0]?.sentiment_score || 0.5) * 100 
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" hide />
                            <YAxis domain={[0, 100]} hide />
                            <Tooltip 
                              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '10px' }}
                              labelStyle={{ fontWeight: 'bold' }}
                            />
                            <Line type="monotone" dataKey="sentiment" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Previous Interactions</h4>
                      <div className="space-y-3">
                        {customerHistory.map(t => (
                          <div key={t.id} className={`p-4 rounded-xl border bg-white shadow-sm transition-all ${t.id === selectedTicket.id ? 'ring-2 ring-blue-500 border-blue-200' : 'border-gray-100 hover:border-gray-200'}`}>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="text-sm font-bold text-gray-900">{t.subject}</p>
                                <p className="text-[10px] text-gray-400">{new Date(t.created_at).toLocaleDateString()} • {t.category}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${STATUS_COLORS[t.status]}`}>
                                  {t.status.replace('_', ' ')}
                                </span>
                                {t.messages[0]?.sentiment_score !== undefined && (
                                  <SentimentBadge score={t.messages[0].sentiment_score} />
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2 italic">"{t.messages[0].content}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-100 bg-white">
                 {selectedTicket.ai_suggestions && selectedTicket.ai_suggestions.length > 0 && (
                   <div className="mb-4">
                     <div className="flex items-center gap-2 mb-2">
                       <Bot className="w-3 h-3 text-blue-500" />
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">AI Suggested Replies</p>
                     </div>
                     <div className="flex flex-wrap gap-2">
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
                 <div className="flex gap-2">
                   <input 
                    id="human-reply-input"
                    type="text" 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Human takeover - Type a reply..." 
                    className="flex-1 px-4 py-2 bg-slate-900 text-white border border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                   <button 
                    onClick={handleSendMessage}
                    className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                   >
                     <Send className="w-4 h-4" />
                     Send
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
