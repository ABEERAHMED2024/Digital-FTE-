
import React, { useState } from 'react';
import { Channel, Priority } from '../types';
import { createTicket } from '../services/mockDB';
import { processTicketWithAI } from '../services/geminiService';
import { updateTicket, addMessageToTicket } from '../services/mockDB';

const CATEGORIES = [
  { value: 'general', label: 'General Question' },
  { value: 'technical', label: 'Technical Support' },
  { value: 'billing', label: 'Billing Inquiry' },
  { value: 'bug_report', label: 'Bug Report' },
  { value: 'feedback', label: 'Feedback' }
];

const PRIORITIES = [
  { value: 'low', label: 'Low - Not urgent' },
  { value: 'medium', label: 'Medium - Need help soon' },
  { value: 'high', label: 'High - Urgent issue' }
];

export const SupportForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    priority: 'medium' as Priority,
    message: ''
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (formData.name.trim().length < 2) {
      setError('Please enter your name (at least 2 characters)');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.subject.trim().length < 5) {
      setError('Please enter a subject (at least 5 characters)');
      return false;
    }
    if (formData.message.trim().length < 10) {
      setError('Please describe your issue in more detail (at least 10 characters)');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validateForm()) return;

    setStatus('submitting');
    try {
      // 1. Create ticket in Mock DB
      const ticket = createTicket({
        ...formData,
        channel: Channel.WEB_FORM
      });
      setTicketId(ticket.id);

      // 2. Simulate AI Employee Processing (The "FTE" logic)
      const aiResult = await processTicketWithAI(formData.message, Channel.WEB_FORM, "New Customer Inquiry");
      
      // 3. Store AI reply
      addMessageToTicket(ticket.id, {
        conversation_id: ticket.conversation_id,
        channel: Channel.WEB_FORM,
        direction: 'outbound',
        role: 'agent',
        content: aiResult.response,
        sentiment_score: aiResult.sentiment
      });

      // 4. Update ticket metadata
      updateTicket(ticket.id, {
        status: aiResult.should_escalate ? 'escalated' as any : 'resolved' as any,
        resolution_notes: aiResult.reason,
        category: aiResult.category,
        ai_suggestions: aiResult.suggestions
      });

      setStatus('success');
    } catch (err: any) {
      setError(err.message || 'Submission failed');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="max-w-2xl mx-auto p-12 glass-card neon-border animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center">
          <div className="w-24 h-24 bg-cyber-green/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-cyber-green/30 shadow-[0_0_20px_rgba(57,255,20,0.2)]">
            <svg className="w-12 h-12 text-cyber-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter">TRANSMISSION SUCCESS</h2>
          <p className="text-gray-600 mb-8 text-lg font-medium">Your support request has been uplinked to our neural network.</p>
          <div className="bg-black/5 rounded-2xl p-8 mb-10 border border-black/5 backdrop-blur-md">
            <p className="text-xs font-black text-cyber-blue uppercase tracking-[0.3em] mb-2">Ticket ID Hash</p>
            <p className="text-3xl font-mono font-black text-gray-900 tracking-widest">{ticketId}</p>
          </div>
          <p className="text-sm text-gray-500 italic mb-10">
            Our Digital FTE is analyzing your query. Expect a response in your neural link (email) shortly.
          </p>
          <button
            onClick={() => setStatus('idle')}
            className="cyber-button w-full py-4 text-sm tracking-widest uppercase"
          >
            Initiate New Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-12 glass-card neon-border relative overflow-hidden">
      <div className="scan-line opacity-10"></div>
      <div className="mb-12 relative z-10">
        <h2 className="text-4xl font-black text-gray-900 mb-3 tracking-tighter">CONTACT <span className="text-cyber-blue">SUPPORT</span></h2>
        <p className="text-gray-600 text-lg font-medium">Initialize a support session with our AI-powered core.</p>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 animate-shake">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          <span className="font-bold text-sm uppercase tracking-wider">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label htmlFor="name" className="block text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Identity Signature *</label>
            <input
              type="text" id="name" name="name"
              value={formData.name} onChange={handleChange}
              required
              className="w-full px-5 py-4 bg-black/5 text-gray-900 border border-black/10 rounded-xl focus:ring-2 focus:ring-cyber-blue focus:border-transparent transition-all outline-none placeholder:text-gray-400 font-medium"
              placeholder="Enter your name"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Neural Link (Email) *</label>
            <input
              type="email" id="email" name="email"
              value={formData.email} onChange={handleChange}
              required
              className="w-full px-5 py-4 bg-black/5 text-gray-900 border border-black/10 rounded-xl focus:ring-2 focus:ring-cyber-blue focus:border-transparent transition-all outline-none placeholder:text-gray-400 font-medium"
              placeholder="your@email.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="subject" className="block text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Transmission Subject *</label>
          <input
            type="text" id="subject" name="subject"
            value={formData.subject} onChange={handleChange}
            required
            className="w-full px-5 py-4 bg-black/5 text-gray-900 border border-black/10 rounded-xl focus:ring-2 focus:ring-cyber-blue focus:border-transparent transition-all outline-none placeholder:text-gray-400 font-medium"
            placeholder="What is the nature of your inquiry?"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label htmlFor="category" className="block text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Sector *</label>
            <select
              id="category" name="category"
              value={formData.category} onChange={handleChange}
              className="w-full px-5 py-4 bg-black/5 text-gray-900 border border-black/10 rounded-xl focus:ring-2 focus:ring-cyber-blue focus:border-transparent transition-all outline-none appearance-none font-medium cursor-pointer"
            >
              {CATEGORIES.map(cat => <option key={cat.value} value={cat.value} className="bg-white text-gray-900">{cat.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="priority" className="block text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Priority Level</label>
            <select
              id="priority" name="priority"
              value={formData.priority} onChange={handleChange}
              className="w-full px-5 py-4 bg-black/5 text-gray-900 border border-black/10 rounded-xl focus:ring-2 focus:ring-cyber-blue focus:border-transparent transition-all outline-none appearance-none font-medium cursor-pointer"
            >
              {PRIORITIES.map(pri => <option key={pri.value} value={pri.value} className="bg-white text-gray-900">{pri.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="message" className="block text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Data Payload *</label>
          <textarea
            id="message" name="message"
            value={formData.message} onChange={handleChange}
            required
            rows={5}
            className="w-full px-5 py-4 bg-black/5 text-gray-900 border border-black/10 rounded-xl focus:ring-2 focus:ring-cyber-blue focus:border-transparent transition-all outline-none resize-none placeholder:text-gray-400 font-medium"
            placeholder="Describe your issue in detail for AI processing..."
          />
          <div className="mt-3 flex justify-between items-center">
            <span className="text-xs text-cyber-blue/40 font-black uppercase tracking-widest">Encrypted Transmission Enabled</span>
            <p className="text-xs text-gray-500 font-bold">{formData.message.length}/1000</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={status === 'submitting'}
          className={`w-full py-5 px-8 rounded-xl font-black text-sm uppercase tracking-[0.2em] transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-4 shadow-2xl ${
            status === 'submitting' 
              ? 'bg-white/10 text-gray-500 cursor-not-allowed border border-white/5' 
              : 'bg-gradient-to-r from-cyber-blue to-cyber-purple text-white shadow-[0_0_30px_rgba(0,242,255,0.3)]'
          }`}
        >
          {status === 'submitting' ? (
            <>
              <div className="w-5 h-5 border-2 border-cyber-blue border-t-transparent rounded-full animate-spin"></div>
              Neural Processing...
            </>
          ) : (
            'Initiate Uplink'
          )}
        </button>

        <p className="text-center text-xs text-gray-600 font-bold tracking-widest uppercase">
          Neural link secured via <span className="text-cyber-blue">TechCorp Core</span>
        </p>
      </form>
    </div>
  );
};
