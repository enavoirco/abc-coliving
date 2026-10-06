import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useSpring, useReducedMotion } from 'motion/react';
import { X, Phone, MessageCircle, Calendar } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { EnquiryForm } from './EnquiryForm';

const NAV_ITEMS = [
  { label: 'Home', path: '/', sectionId: 'home-hero' },
  { label: 'Rooms', path: '/rooms', sectionId: 'home-rooms' },
  { label: 'Amenities', path: '/amenities', sectionId: 'home-amenities' },
  { label: 'Food', path: '/food', sectionId: 'home-food' },
  { label: 'Gallery', path: '/gallery', sectionId: 'home-gallery' },
  { label: 'Location', path: '/location', sectionId: 'home-location' },
];

export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, enquiryModal, openEnquiryModal, closeEnquiryModal } = useSite();
  const location = useLocation();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('Home');

  // Initial Hero Motion Intro (only once per session, skipped if ?autostart=1 or reduced motion)
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') return false;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    try {
      if (sessionStorage.getItem('abc_intro_seen') === '1') return false;
      sessionStorage.setItem('abc_intro_seen', '1');
      return location.pathname === '/';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!showIntro) return;
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 680);
    return () => clearTimeout(timer);
  }, [showIntro]);

  // 2px Scroll Progress Bar at top
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  // Sticky navbar scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change and scroll to top
  useEffect(() => {
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }, [location.pathname, prefersReducedMotion]);

  // Intersection Observer for active navigation on Homepage + Route matching on subpages
  useEffect(() => {
    if (location.pathname !== '/') {
      const matched = NAV_ITEMS.find(
        (item) => item.path !== '/' && location.pathname.startsWith(item.path)
      );
      setActiveSection(matched ? matched.label : '');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const matched = NAV_ITEMS.find((item) => item.sectionId === entry.target.id);
            if (matched) {
              setActiveSection(matched.label);
            }
          }
        }
      },
      { rootMargin: '-25% 0px -55% 0px', threshold: 0.05 }
    );

    NAV_ITEMS.forEach((item) => {
      const el = document.getElementById(item.sectionId);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [location.pathname]);

  // Close modal on ESC
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (enquiryModal.isOpen) closeEnquiryModal();
        if (mobileMenuOpen) setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enquiryModal.isOpen, mobileMenuOpen, closeEnquiryModal]);

  const brandTitle = settings.brandName || 'ABC';

  const hasPhone = Boolean(settings.phone && settings.phone.trim());
  const hasWhatsapp = Boolean(settings.whatsapp && settings.whatsapp.trim());

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#111111]">
      {/* 2px Black Scroll Progress Indicator on White */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-[2px] bg-[#111111] origin-left z-50 pointer-events-none"
      />

      {/* Brief Initial Brand Intro Overlay */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            key="abc-intro"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 bg-[#FFFFFF] flex flex-col items-center justify-center pointer-events-none"
          >
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="font-editorial text-2xl md:text-3xl tracking-[0.22em] text-[#111111]"
            >
              {brandTitle}
            </motion.span>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.45, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="w-24 h-[1px] bg-[#111111] mt-3 origin-center"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation Bar — Strict 3-Zone Contract */}
      <header
        className={`sticky top-0 z-40 bg-[#FFFFFF] border-b border-[#111111]/10 transition-all duration-300 ${
          isScrolled ? 'py-3 shadow-[0_2px_20px_rgba(17,17,17,0.04)]' : 'py-5'
        }`}
      >
        <div className="max-w-[1360px] mx-auto px-5 md:px-10 flex items-center justify-between">
          {/* ZONE 1: Single Brand Wordmark Element */}
          <Link
            to="/"
            className="font-editorial text-xl md:text-2xl tracking-[0.18em] text-[#111111] font-medium whitespace-nowrap shrink-0"
          >
            {brandTitle}
          </Link>

          {/* ZONE 2: Center Navigation Links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center gap-8"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.label;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className="relative py-1 text-xs uppercase tracking-[0.14em] text-[#111111] hover:text-[#315C4C] transition-colors whitespace-nowrap group"
                >
                  <span>{item.label}</span>
                  <span
                    className={`absolute left-0 right-0 bottom-0 h-[1px] bg-[#111111] transition-transform duration-300 origin-left ${
                      isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* ZONE 3: Primary Action & Mobile Menu Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => openEnquiryModal()}
              className="hidden sm:inline-flex items-center justify-center bg-[#111111] text-white px-5 py-2.5 text-xs uppercase tracking-[0.12em] font-medium hover:bg-[#315C4C] hover:-translate-y-[1px] active:scale-[0.98] transition-all duration-200 whitespace-nowrap shrink-0"
            >
              Schedule a Visit
            </button>

            <button
              type="button"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden relative w-10 h-10 flex flex-col items-center justify-center gap-1.5 text-[#111111] focus:outline-none"
            >
              <span
                className={`block w-5 h-[1.5px] bg-[#111111] transition-transform duration-300 ${
                  mobileMenuOpen ? 'translate-y-[3.5px] rotate-45' : ''
                }`}
              />
              <span
                className={`block w-5 h-[1.5px] bg-[#111111] transition-opacity duration-200 ${
                  mobileMenuOpen ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`block w-5 h-[1.5px] bg-[#111111] transition-transform duration-300 ${
                  mobileMenuOpen ? '-translate-y-[3.5px] -rotate-45' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Animated Mobile Navigation Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="lg:hidden overflow-hidden bg-[#FFFFFF] border-t border-[#111111]/10"
            >
              <div className="px-6 py-8 flex flex-col gap-5">
                {NAV_ITEMS.map((item, idx) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.22 }}
                  >
                    <Link
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block font-editorial text-2xl text-[#111111] hover:text-[#315C4C] transition-colors"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
                <div className="pt-4 border-t border-[#111111]/10 flex flex-col gap-3">
                  <Link
                    to="/faq"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs uppercase tracking-[0.14em] text-[#5F5F5F] hover:text-[#111111]"
                  >
                    Frequently Asked Questions
                  </Link>
                  <Link
                    to="/contact"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs uppercase tracking-[0.14em] text-[#5F5F5F] hover:text-[#111111]"
                  >
                    Contact & Enquiries
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openEnquiryModal();
                    }}
                    className="mt-2 w-full bg-[#111111] text-white py-3 text-xs uppercase tracking-[0.14em] font-medium hover:bg-[#315C4C] transition-colors"
                  >
                    Schedule a Visit
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-16 md:pb-0">{children}</main>

      {/* Quiet Editorial Footer */}
      <footer className="bg-[#F7F6F2] border-t border-[#111111]/10 text-[#111111]">
        <div className="max-w-[1360px] mx-auto px-5 md:px-10 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-[#111111]/10">
            <div className="md:col-span-5 space-y-4">
              <div className="font-editorial text-2xl tracking-[0.18em] text-[#111111]">
                {brandTitle}
              </div>
              <p className="font-editorial italic text-xl text-[#5F5F5F]">
                {settings.tagline || 'Live Better. Feel at Home.'}
              </p>
              <p className="text-sm text-[#5F5F5F] max-w-sm leading-relaxed">
                Comfortable private and shared living spaces, thoughtful everyday amenities, and a calm urban community.
              </p>
            </div>

            <div className="md:col-span-3 space-y-3">
              <h3 className="text-xs uppercase tracking-[0.16em] text-[#858585] font-sans font-medium">
                Explore
              </h3>
              <ul className="space-y-2.5 text-sm text-[#5F5F5F]">
                <li>
                  <Link to="/rooms" className="hover:text-[#111111] transition-colors">
                    Rooms & Living Options
                  </Link>
                </li>
                <li>
                  <Link to="/amenities" className="hover:text-[#111111] transition-colors">
                    Everyday Amenities
                  </Link>
                </li>
                <li>
                  <Link to="/food" className="hover:text-[#111111] transition-colors">
                    Dining & Homestyle Meals
                  </Link>
                </li>
                <li>
                  <Link to="/gallery" className="hover:text-[#111111] transition-colors">
                    Property Gallery
                  </Link>
                </li>
                <li>
                  <Link to="/location" className="hover:text-[#111111] transition-colors">
                    Location & Neighbourhood
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="hover:text-[#111111] transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-4 space-y-4">
              <h3 className="text-xs uppercase tracking-[0.16em] text-[#858585] font-sans font-medium">
                Visit & Connect
              </h3>

              {settings.address && settings.address.trim() && (
                <p className="text-sm text-[#5F5F5F] leading-relaxed">{settings.address}</p>
              )}

              <div className="space-y-1.5 text-sm text-[#5F5F5F]">
                {hasPhone && (
                  <div>
                    <a href={`tel:${settings.phone}`} className="hover:text-[#111111] transition-colors">
                      {settings.phone}
                    </a>
                  </div>
                )}
                {settings.email && settings.email.trim() && (
                  <div>
                    <a href={`mailto:${settings.email}`} className="hover:text-[#111111] transition-colors">
                      {settings.email}
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => openEnquiryModal()}
                  className="bg-[#111111] text-white px-5 py-2.5 text-xs uppercase tracking-[0.14em] hover:bg-[#315C4C] transition-colors whitespace-nowrap"
                >
                  Schedule a Visit
                </button>
                <Link
                  to="/contact"
                  className="text-xs uppercase tracking-[0.14em] text-[#111111] border-b border-[#111111] pb-1 hover:text-[#315C4C] hover:border-[#315C4C] transition-colors whitespace-nowrap"
                >
                  Send Enquiry
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#858585]">
            <div>
              © {new Date().getFullYear()} {brandTitle}. All rights reserved.
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <Link to="/privacy" className="hover:text-[#111111] transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-[#111111] transition-colors">
                Terms of Residence
              </Link>
              <Link to="/admin" className="hover:text-[#111111] transition-colors">
                Admin Portal
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Fixed Bottom Bar (Respecting 15% Sticky Cap & Hiding Unconfigured Call/WhatsApp) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#FFFFFF] border-t border-[#111111]/15 px-3 py-2 flex items-center gap-2">
        {hasPhone && (
          <a
            href={`tel:${settings.phone}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 border border-[#111111]/20 py-2.5 text-xs font-medium text-[#111111] whitespace-nowrap"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call</span>
          </a>
        )}
        {hasWhatsapp && (
          <a
            href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 border border-[#315C4C]/40 text-[#315C4C] py-2.5 text-xs font-medium whitespace-nowrap"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>
        )}
        <button
          type="button"
          onClick={() => openEnquiryModal()}
          className="flex-[1.5] inline-flex items-center justify-center gap-1.5 bg-[#111111] text-white py-2.5 text-xs uppercase tracking-[0.1em] font-medium whitespace-nowrap"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Schedule Visit</span>
        </button>
      </div>

      {/* Global Schedule a Visit / Room Enquiry Modal */}
      <AnimatePresence>
        {enquiryModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeEnquiryModal}
            className="fixed inset-0 z-50 bg-[#111111]/50 flex items-center justify-center p-4 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-visit-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#FFFFFF] border border-[#111111]/15 w-full max-w-xl p-6 md:p-10 relative my-8"
            >
              <button
                type="button"
                aria-label="Close modal"
                onClick={closeEnquiryModal}
                className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center text-[#5F5F5F] hover:text-[#111111] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.16em] text-[#315C4C] mb-2">
                  ABC
                </p>
                <h2
                  id="schedule-visit-modal-title"
                  className="font-editorial text-3xl md:text-4xl text-[#111111] font-normal"
                >
                  Schedule a Visit
                </h2>
                <p className="text-sm text-[#5F5F5F] mt-2">
                  Share your preferred room type and move-in date. Our team will coordinate a convenient time for your visit.
                </p>
              </div>

              <EnquiryForm
                defaultRoomPreference={enquiryModal.roomPreference}
                defaultRoomId={enquiryModal.roomId}
                roomName={enquiryModal.roomName}
                sourcePage={location.pathname}
                compact
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
