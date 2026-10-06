import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Check } from 'lucide-react';

interface EnquiryFormProps {
  defaultRoomPreference?: string;
  defaultRoomId?: string | null;
  roomName?: string;
  sourcePage?: string;
  compact?: boolean;
  onSuccess?: () => void;
}

const ROOM_OPTIONS = [
  'Single Sharing',
  'Double Sharing',
  'Triple Sharing',
  'Not Sure Yet',
];

export const EnquiryForm: React.FC<EnquiryFormProps> = ({
  defaultRoomPreference = 'Single Sharing',
  defaultRoomId = null,
  roomName,
  sourcePage = '/contact',
  compact = false,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [roomPreference, setRoomPreference] = useState(
    ROOM_OPTIONS.includes(defaultRoomPreference) ? defaultRoomPreference : 'Single Sharing'
  );
  const [moveInDate, setMoveInDate] = useState('');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (defaultRoomPreference && ROOM_OPTIONS.includes(defaultRoomPreference)) {
      setRoomPreference(defaultRoomPreference);
    }
  }, [defaultRoomPreference]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (name.trim().length < 2) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!/^[+\d][\d\s\-()]{7,18}$/.test(phone.trim())) {
      setErrorMessage('Please enter a valid 10-digit phone number.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!ROOM_OPTIONS.includes(roomPreference)) {
      setErrorMessage('Please select a preferred room type.');
      return;
    }
    if (!moveInDate || isNaN(Date.parse(moveInDate))) {
      setErrorMessage('Please select your preferred move-in date.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/public/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          roomId: defaultRoomId || null,
          roomPreference,
          moveInDate,
          message: roomName
            ? `[Enquiring about: ${roomName}] ${message.trim()}`.trim()
            : message.trim(),
          sourcePage,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not submit your enquiry. Please try again.');
      }

      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to send enquiry. Please check your connection.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="border border-[#111111]/10 bg-[#F7F6F2] p-8 md:p-10 text-left"
        role="status"
        aria-live="polite"
      >
        <div className="inline-flex items-center justify-center w-10 h-10 bg-[#315C4C] text-white mb-5">
          <Check className="w-5 h-5" />
        </div>
        <h3 className="font-editorial text-3xl text-[#111111] font-normal mb-2">
          Enquiry Sent ✓
        </h3>
        <p className="text-[#5F5F5F] text-base leading-relaxed max-w-md mb-6">
          Thanks for reaching out. The ABC team will get back to you soon.
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setName('');
            setPhone('');
            setEmail('');
            setMoveInDate('');
            setMessage('');
          }}
          className="text-xs tracking-widest uppercase text-[#111111] border-b border-[#111111] pb-1 hover:text-[#315C4C] hover:border-[#315C4C] transition-colors whitespace-nowrap"
        >
          Send Another Enquiry
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {roomName && (
        <div className="border-l-2 border-[#315C4C] pl-3 py-1 text-xs text-[#5F5F5F]">
          Enquiring regarding <span className="text-[#111111] font-medium">{roomName}</span> ·{' '}
          <span>{roomPreference}</span>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 border border-red-800/30 bg-red-50/70 text-red-900 text-xs leading-relaxed"
        >
          {errorMessage}
        </div>
      )}

      <div className={compact ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'grid grid-cols-1 md:grid-cols-2 gap-5'}>
        <div>
          <label
            htmlFor={`enq-name-${sourcePage}`}
            className="block text-xs text-[#5F5F5F] mb-2 font-medium"
          >
            Full Name *
          </label>
          <input
            id={`enq-name-${sourcePage}`}
            name="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="w-full bg-white border border-[#111111]/15 px-3.5 py-2.5 text-sm text-[#111111] placeholder:text-[#858585] focus:outline-none focus:border-[#315C4C] transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor={`enq-phone-${sourcePage}`}
            className="block text-xs text-[#5F5F5F] mb-2 font-medium"
          >
            Phone Number *
          </label>
          <input
            id={`enq-phone-${sourcePage}`}
            name="phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full bg-white border border-[#111111]/15 px-3.5 py-2.5 text-sm text-[#111111] placeholder:text-[#858585] focus:outline-none focus:border-[#315C4C] transition-colors"
          />
        </div>
      </div>

      <div className={compact ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'grid grid-cols-1 md:grid-cols-2 gap-5'}>
        <div>
          <label
            htmlFor={`enq-email-${sourcePage}`}
            className="block text-xs text-[#5F5F5F] mb-2 font-medium"
          >
            Email *
          </label>
          <input
            id={`enq-email-${sourcePage}`}
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-white border border-[#111111]/15 px-3.5 py-2.5 text-sm text-[#111111] placeholder:text-[#858585] focus:outline-none focus:border-[#315C4C] transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor={`enq-room-${sourcePage}`}
            className="block text-xs text-[#5F5F5F] mb-2 font-medium"
          >
            Preferred Room Type *
          </label>
          <select
            id={`enq-room-${sourcePage}`}
            name="roomPreference"
            value={roomPreference}
            onChange={(e) => setRoomPreference(e.target.value)}
            className="w-full bg-white border border-[#111111]/15 px-3.5 py-2.5 text-sm text-[#111111] focus:outline-none focus:border-[#315C4C] transition-colors"
          >
            {ROOM_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor={`enq-date-${sourcePage}`}
          className="block text-xs text-[#5F5F5F] mb-2 font-medium"
        >
          Move-in Date *
        </label>
        <input
          id={`enq-date-${sourcePage}`}
          name="moveInDate"
          type="date"
          required
          value={moveInDate}
          onChange={(e) => setMoveInDate(e.target.value)}
          className="w-full bg-white border border-[#111111]/15 px-3.5 py-2.5 text-sm text-[#111111] focus:outline-none focus:border-[#315C4C] transition-colors"
        />
      </div>

      <div>
        <label
          htmlFor={`enq-message-${sourcePage}`}
          className="block text-xs text-[#5F5F5F] mb-2 font-medium"
        >
          Message
        </label>
        <textarea
          id={`enq-message-${sourcePage}`}
          name="message"
          rows={compact ? 3 : 4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Any specific preferences, questions, or preferred visit time..."
          className="w-full bg-white border border-[#111111]/15 px-3.5 py-2.5 text-sm text-[#111111] placeholder:text-[#858585] focus:outline-none focus:border-[#315C4C] transition-colors resize-none"
        />
      </div>

      <div className="pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="group inline-flex items-center justify-center gap-3 bg-[#111111] text-white px-7 py-3.5 text-xs font-medium tracking-wider uppercase hover:bg-[#315C4C] hover:-translate-y-[1px] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 whitespace-nowrap"
        >
          <span>{submitting ? 'Sending Enquiry...' : 'Submit Enquiry'}</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-[5px]" />
        </button>
      </div>
    </form>
  );
};
