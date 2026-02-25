
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
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-xl border border-blue-50">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Thank You!</h2>
          <p className="text-gray-600 mb-6 text-lg">Your support request has been submitted successfully.</p>
          <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-100">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Your Ticket ID</p>
            <p className="text-2xl font-mono font-bold text-blue-600">{ticketId}</p>
          </div>
          <p className="text-sm text-gray-500 italic">
            Our AI assistant has processed your request. You should receive an email confirmation shortly.
          </p>
          <button
            onClick={() => setStatus('idle')}
            className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-xl border border-blue-50">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Contact Support</h2>
        <p className="text-gray-500 text-lg">Fill out the form below and our AI-powered support team will help you shortly.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">Your Name *</label>
            <input
              type="text" id="name" name="name"
              value={formData.name} onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-slate-900 text-white border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none placeholder:text-slate-500"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
            <input
              type="email" id="email" name="email"
              value={formData.email} onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-slate-900 text-white border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none placeholder:text-slate-500"
              placeholder="john@techcorp.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">Subject *</label>
          <input
            type="text" id="subject" name="subject"
            value={formData.subject} onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-slate-900 text-white border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none placeholder:text-slate-500"
            placeholder="Brief description of your issue"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
            <select
              id="category" name="category"
              value={formData.category} onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-900 text-white border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
            >
              {CATEGORIES.map(cat => <option key={cat.value} value={cat.value} className="bg-slate-900 text-white">{cat.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="priority" className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
            <select
              id="priority" name="priority"
              value={formData.priority} onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-900 text-white border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
            >
              {PRIORITIES.map(pri => <option key={pri.value} value={pri.value} className="bg-slate-900 text-white">{pri.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">How can we help? *</label>
          <textarea
            id="message" name="message"
            value={formData.message} onChange={handleChange}
            required
            rows={5}
            className="w-full px-4 py-3 bg-slate-900 text-white border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none placeholder:text-slate-500"
            placeholder="Please describe your issue or question in detail..."
          />
          <p className="mt-2 text-xs text-gray-400 text-right">{formData.message.length}/1000 characters</p>
        </div>

        <button
          type="submit"
          disabled={status === 'submitting'}
          className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 shadow-lg ${
            status === 'submitting' ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
          }`}
        >
          {status === 'submitting' ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              AI Processing...
            </>
          ) : (
            'Submit Support Request'
          )}
        </button>

        <p className="text-center text-xs text-gray-400">
          By submitting, you agree to our <a href="#" className="text-blue-500 underline">Privacy Policy</a>. Our AI agents monitor this channel 24/7.
        </p>
      </form>
    </div>
  );
};
