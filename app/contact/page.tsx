'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, subject, message })
      });

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      setSubmitted(true);
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please call our hotline.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      
      {/* Title */}
      <div className="text-center max-w-xl mx-auto mb-12">
        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 bg-neutral-100 px-3 py-1 rounded-full">
          Customer Support
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-black uppercase tracking-tight mt-3">
          Get in Touch with Us
        </h1>
        <p className="text-xs text-neutral-500 mt-2">
          Have questions about a product, warranty, or order status? We are here to assist you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Contact Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-black uppercase tracking-wider">Contact Channels</h3>

            <div className="space-y-3 text-xs text-neutral-700">
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-black shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-neutral-900">Direct Hotline</p>
                  <p className="text-neutral-500">09612-000000 | +880 1711 000000</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Sat - Thu: 10:00 AM - 8:00 PM</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-neutral-900">WhatsApp Support</p>
                  <a 
                    href="https://wa.me/8801711000000" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-emerald-700 font-semibold hover:underline"
                  >
                    +880 1711 000000 (Chat Now)
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-black shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-neutral-900">Email Address</p>
                  <p className="text-neutral-500">support@dhati.com</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-black shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-neutral-900">Headquarters</p>
                  <p className="text-neutral-500">House #14, Road #6, Dhanmondi, Dhaka-1205, Bangladesh</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-base font-bold text-black uppercase tracking-tight mb-2">
              Send Us a Message
            </h2>
            <p className="text-xs text-neutral-500 mb-6">
              Fill out this form and our support team will respond within 24 hours.
            </p>

            {submitted ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="text-sm font-bold text-emerald-900">Message Received!</h3>
                <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                  Thank you for reaching out. An administrator will review your message and reply via email or phone shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-2 text-xs font-semibold text-emerald-800 underline"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-neutral-800 block mb-1.5">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Asif Mahmud"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-800 block mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-neutral-800 block mb-1.5">
                      Mobile Number (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="01XXXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-800 block mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      placeholder="Product inquiry, warranty question..."
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-800 block mb-1.5">
                    Your Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Write your question or feedback here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-black resize-none"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-600 font-medium">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="py-3 px-6 bg-[#eb5a00] text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#d04f00] transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? 'Sending Message...' : 'Send Inquiry'}</span>
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
