import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'motion/react';
import {
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Wifi,
  Sparkles,
  ShieldCheck,
  Droplets,
  WashingMachine,
  Zap,
  Lock,
  BookOpen,
  Utensils,
  Sofa,
  Bike,
  Wrench,
  MapPin,
  Clock,
  Phone,
  Mail,
  Check,
} from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { ResilientImage } from '../components/ResilientImage';
import { EnquiryForm } from '../components/EnquiryForm';
import { Room, GalleryItem, Amenity } from '../types';

// Map icon string names from DB to Lucide components
const AMENITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Wifi,
  Sparkles,
  ShieldCheck,
  Droplets,
  WashingMachine,
  Zap,
  Lock,
  BookOpen,
  Utensils,
  Sofa,
  Bike,
  Wrench,
};

function renderAmenityIcon(iconName: string, className = 'w-5 h-5') {
  const IconComp = AMENITY_ICONS[iconName] || Sparkles;
  return <IconComp className={className} />;
}

function useDocumentMeta(title: string, description: string) {
  useEffect(() => {
    if (title) document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && description) {
      metaDesc.setAttribute('content', description);
    }
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && title) {
      ogTitle.setAttribute('content', title);
    }
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && description) {
      ogDesc.setAttribute('content', description);
    }
  }, [title, description]);
}

// ==========================================
// REUSABLE EDITORIAL SECTIONS
// ==========================================

export const RoomsShowcaseSection: React.FC<{ isFullPage?: boolean }> = ({ isFullPage = false }) => {
  const { rooms, loading } = useSite();
  const [filter, setFilter] = useState<'ALL' | 'SINGLE' | 'DOUBLE' | 'TRIPLE'>('ALL');

  const filterButtons: { key: 'ALL' | 'SINGLE' | 'DOUBLE' | 'TRIPLE'; label: string }[] = [
    { key: 'ALL', label: 'ALL' },
    { key: 'SINGLE', label: 'SINGLE' },
    { key: 'DOUBLE', label: 'DOUBLE' },
    { key: 'TRIPLE', label: 'TRIPLE' },
  ];

  const filteredRooms = rooms.filter((r) => {
    if (filter === 'ALL') return true;
    const upperType = r.type.toUpperCase();
    return upperType.includes(filter);
  });

  return (
    <section
      id="home-rooms"
      className={`${isFullPage ? 'py-16 md:py-24' : 'py-24 md:py-32'} bg-[#F7F6F2] border-t border-[#111111]/10`}
    >
      <div className="max-w-[1360px] mx-auto px-5 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-[#111111]/10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs uppercase tracking-[0.18em] text-[#5F5F5F] mb-3">
              PRIVATE & SHARED LIVING
            </p>
            <h2
              className="font-editorial text-4xl md:text-5xl text-[#111111] font-normal leading-[1.1]"
              style={{ textWrap: 'balance' }}
            >
              Spaces designed for calm,
              <br />
              everyday living.
            </h2>
          </motion.div>

          {/* Interactive Filter Controls */}
          <div
            role="tablist"
            aria-label="Filter rooms by occupancy"
            className="flex flex-wrap items-center gap-2 border-b border-[#111111]/15 pb-1"
          >
            {filterButtons.map((btn) => {
              const active = filter === btn.key;
              return (
                <button
                  key={btn.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(btn.key)}
                  className={`relative px-4 py-2 text-xs tracking-[0.16em] uppercase transition-colors whitespace-nowrap ${
                    active ? 'text-[#111111] font-semibold' : 'text-[#858585] hover:text-[#111111]'
                  }`}
                >
                  {btn.label}
                  {active && (
                    <motion.div
                      layoutId="room-filter-underline"
                      className="absolute left-0 right-0 -bottom-[5px] h-[2px] bg-[#315C4C]"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
            {[1, 2, 3].map((n) => (
              <div key={n} className="space-y-4 animate-pulse">
                <div className="aspect-[4/3] bg-[#F1EFE9] w-full" />
                <div className="h-4 bg-[#F1EFE9] w-1/3" />
                <div className="h-7 bg-[#F1EFE9] w-2/3" />
                <div className="h-16 bg-[#F1EFE9] w-full" />
              </div>
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="py-16 text-left border-b border-[#111111]/10">
            <h3 className="font-editorial text-2xl text-[#111111] mb-2">
              No room availability configured.
            </h3>
            <p className="text-sm text-[#5F5F5F] max-w-lg">
              Room availability is currently being updated. Please contact ABC Coliving for current options.
            </p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pt-12">
            <AnimatePresence mode="popLayout">
              {filteredRooms.map((room) => (
                <RoomEditorialItem key={room.id} room={room} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
  );
};

const RoomEditorialItem: React.FC<{ room: Room }> = ({ room }) => {
  const primaryImage = room.images?.[0] || '';
  const priceDisplay =
    room.price !== null && room.price !== undefined && Number(room.price) > 0
      ? `₹${Number(room.price).toLocaleString('en-IN')} / ${room.priceLabel || 'month'}`
      : 'Contact for Pricing';

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="group flex flex-col justify-between border-b border-[#111111]/15 hover:border-[#111111]/45 pb-8 transition-colors duration-300"
    >
      <div>
        <Link to={`/rooms/${room.id}`} className="block overflow-hidden aspect-[4/3] mb-6 bg-[#F1EFE9]">
          <ResilientImage
            src={primaryImage}
            alt={room.name}
            hoverZoom
            revealOnScroll
            containerClassName="w-full h-full"
            className="w-full h-full object-cover"
          />
        </Link>

        {/* Clean Unboxed Metadata with Separator (Zero-Pill Discipline) */}
        <div className="flex items-center gap-2 text-xs text-[#5F5F5F] uppercase tracking-[0.12em] mb-2">
          <span>{room.type}</span>
          <span aria-hidden="true">·</span>
          <span>Up to {room.capacity} {room.capacity === 1 ? 'Resident' : 'Residents'}</span>
          <span aria-hidden="true">·</span>
          <span className="text-[#315C4C]">{room.availability || 'Available'}</span>
        </div>

        <Link to={`/rooms/${room.id}`} className="block">
          <h3 className="font-editorial text-2xl md:text-3xl text-[#111111] font-normal transition-transform duration-300 group-hover:-translate-y-[3px]">
            {room.name}
          </h3>
        </Link>

        <p className="text-sm text-[#5F5F5F] leading-relaxed mt-3 line-clamp-3">
          {room.description}
        </p>

        {room.features && room.features.length > 0 && (
          <div className="mt-5 pt-4 border-t border-[#111111]/10 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#5F5F5F]">
            {room.features.slice(0, 4).map((feat, idx) => (
              <React.Fragment key={feat}>
                <span>{feat}</span>
                {idx < Math.min(room.features.length, 4) - 1 && (
                  <span aria-hidden="true" className="text-[#858585]">·</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      <div className="mt-7 pt-4 border-t border-[#111111]/10 flex items-center justify-between">
        <div>
          <span className="block text-[11px] uppercase tracking-[0.12em] text-[#858585]">
            Residence Tariff
          </span>
          <span className="text-sm font-medium text-[#111111]">{priceDisplay}</span>
        </div>

        <Link
          to={`/rooms/${room.id}`}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#111111] font-medium group-hover:text-[#315C4C] transition-colors whitespace-nowrap"
        >
          <span>View Room</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-[5px]" />
        </Link>
      </div>
    </motion.article>
  );
};

// ==========================================
// AMENITIES SECTION (Editorial Grid on Desktop, Accordion on Mobile)
// ==========================================

export const AmenitiesSection: React.FC<{ isFullPage?: boolean }> = ({ isFullPage = false }) => {
  const { amenities, loading } = useSite();
  const [openMobileId, setOpenMobileId] = useState<string | null>(null);

  return (
    <section
      id="home-amenities"
      className={`${isFullPage ? 'py-16 md:py-24' : 'py-24 md:py-32'} bg-[#FFFFFF] border-t border-[#111111]/10`}
    >
      <div className="max-w-[1360px] mx-auto px-5 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mb-14"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-[#5F5F5F] mb-3">
            EVERYDAY CONVENIENCE
          </p>
          <h2
            className="font-editorial text-4xl md:text-5xl text-[#111111] font-normal leading-[1.1]"
            style={{ textWrap: 'balance' }}
          >
            Thoughtful essentials included from day one.
          </h2>
          <p className="text-base text-[#5F5F5F] leading-relaxed mt-4">
            Every detail at ABC Coliving is organized so you can focus on your work, studies, and daily routine without managing household logistics.
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="h-36 bg-[#F7F6F2] animate-pulse p-6" />
            ))}
          </div>
        ) : amenities.length === 0 ? (
          <div className="py-12 border-t border-[#111111]/10 text-sm text-[#5F5F5F]">
            Amenities list is currently being updated.
          </div>
        ) : (
          <>
            {/* Desktop Clean Editorial Grid */}
            <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 border-t border-l border-[#111111]/10">
              {amenities.map((amenity: Amenity, idx) => (
                <motion.div
                  key={amenity.id}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{ duration: 0.45, delay: Math.min(idx * 0.04, 0.3) }}
                  className="group p-8 border-r border-b border-[#111111]/10 hover:border-[#315C4C]/40 hover:bg-[#F7F6F2]/60 transition-colors duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="text-[#315C4C] mb-5 transition-transform duration-300 group-hover:translate-x-1">
                      {renderAmenityIcon(amenity.icon, 'w-5 h-5 stroke-[1.5]')}
                    </div>
                    <h3 className="font-editorial text-2xl text-[#111111] font-normal transition-transform duration-300 group-hover:translate-x-1">
                      {amenity.name}
                    </h3>
                    <p className="text-sm text-[#5F5F5F] leading-relaxed mt-2.5 transition-transform duration-300 group-hover:translate-x-0.5">
                      {amenity.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Mobile Accordion */}
            <div className="md:hidden border-t border-[#111111]/15 divide-y divide-[#111111]/10">
              {amenities.map((amenity: Amenity) => {
                const isOpen = openMobileId === amenity.id;
                return (
                  <div key={amenity.id} className="py-3.5">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenMobileId(isOpen ? null : amenity.id)}
                      className="w-full flex items-center justify-between text-left py-1.5"
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="text-[#315C4C]">
                          {renderAmenityIcon(amenity.icon, 'w-4 h-4')}
                        </span>
                        <span className="font-editorial text-xl text-[#111111]">
                          {amenity.name}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-[#5F5F5F] transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          className="overflow-hidden"
                        >
                          <p className="text-sm text-[#5F5F5F] leading-relaxed pt-2 pb-1 pl-7">
                            {amenity.description}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

// ==========================================
// FOOD / MEALS INTERACTIVE SECTION
// ==========================================

export const FoodSection: React.FC<{ isFullPage?: boolean }> = ({ isFullPage = false }) => {
  const { food, loading } = useSite();
  const [selectedMeal, setSelectedMeal] = useState<string>('Breakfast');

  useEffect(() => {
    if (food.length > 0 && !food.some((f) => f.meal === selectedMeal)) {
      setSelectedMeal(food[0].meal);
    }
  }, [food, selectedMeal]);

  const activeFood = food.find((f) => f.meal === selectedMeal) || food[0];

  return (
    <section
      id="home-food"
      className={`${isFullPage ? 'py-16 md:py-24' : 'py-24 md:py-32'} bg-[#F1EFE9] border-t border-[#111111]/10`}
    >
      <div className="max-w-[1360px] mx-auto px-5 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-xs uppercase tracking-[0.18em] text-[#315C4C] font-medium mb-3">
                GOOD FOOD. EVERY DAY.
              </p>
              <h2
                className="font-editorial text-4xl md:text-5xl text-[#111111] font-normal leading-[1.1]"
                style={{ textWrap: 'balance' }}
              >
                Meals that feel like home.
              </h2>
              <p className="text-base text-[#5F5F5F] leading-relaxed mt-4">
                Prepared cleanly in our kitchen and served warm in the communal dining space — nourishing everyday meals without the daily chore of cooking.
              </p>
            </motion.div>

            {/* Interactive Meal Tabs (Breakfast / Lunch / Dinner) */}
            {loading ? (
              <div className="h-32 bg-[#FFFFFF]/60 animate-pulse" />
            ) : food.length === 0 ? (
              <p className="text-sm text-[#5F5F5F]">
                Dining schedule details are available upon enquiry.
              </p>
            ) : (
              <div className="space-y-6">
                <div
                  role="tablist"
                  aria-label="Daily Meals"
                  className="flex items-center gap-6 border-b border-[#111111]/15"
                >
                  {food.map((item) => {
                    const isSelected = activeFood?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => setSelectedMeal(item.meal)}
                        className={`relative pb-3 text-xs uppercase tracking-[0.16em] transition-colors whitespace-nowrap ${
                          isSelected
                            ? 'text-[#111111] font-semibold'
                            : 'text-[#858585] hover:text-[#111111]'
                        }`}
                      >
                        {item.meal}
                        {isSelected && (
                          <motion.div
                            layoutId="meal-tab-indicator"
                            className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-[#315C4C]"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {activeFood && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeFood.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-3 pt-2"
                    >
                      <h3 className="font-editorial text-2xl md:text-3xl text-[#111111] font-normal">
                        {activeFood.title}
                      </h3>
                      <p className="text-sm md:text-base text-[#5F5F5F] leading-relaxed">
                        {activeFood.description}
                      </p>
                      {activeFood.timing && (
                        <div className="pt-2 flex items-center gap-2 text-xs text-[#5F5F5F]">
                          <Clock className="w-3.5 h-3.5 text-[#315C4C]" />
                          <span>{activeFood.timing}</span>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-7">
            {activeFood && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFood.id}
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45 }}
                  className="aspect-[4/3] overflow-hidden bg-[#FFFFFF] border border-[#111111]/10"
                >
                  <ResilientImage
                    src={activeFood.image}
                    alt={`${activeFood.meal} — ${activeFood.title}`}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// ==========================================
// GALLERY SECTION WITH FULL-SCREEN LIGHTBOX
// ==========================================

const GALLERY_CATEGORIES = [
  'All',
  'Bedrooms',
  'Bathrooms',
  'Dining',
  'Common Areas',
  'Exterior',
  'Study Spaces',
  'Amenities',
  'Other',
];

export const GallerySection: React.FC<{ isFullPage?: boolean }> = ({ isFullPage = false }) => {
  const { gallery, loading } = useSite();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Only show category tabs that either have items or when on full gallery page
  const visibleCategories = isFullPage
    ? GALLERY_CATEGORIES
    : GALLERY_CATEGORIES.filter(
        (cat) => cat === 'All' || gallery.some((g) => g.category === cat)
      );

  const filteredGallery = gallery.filter(
    (item) => selectedCategory === 'All' || item.category === selectedCategory
  );

  // Keyboard navigation for Lightbox (ESC, ArrowLeft, ArrowRight)
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) =>
          prev !== null ? (prev + 1) % filteredGallery.length : null
        );
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev !== null
            ? (prev - 1 + filteredGallery.length) % filteredGallery.length
            : null
        );
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, filteredGallery.length]);

  const currentLightboxItem: GalleryItem | undefined =
    lightboxIndex !== null ? filteredGallery[lightboxIndex] : undefined;

  return (
    <section
      id="home-gallery"
      className={`${isFullPage ? 'py-16 md:py-24' : 'py-24 md:py-32'} bg-[#FFFFFF] border-t border-[#111111]/10`}
    >
      <div className="max-w-[1360px] mx-auto px-5 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-[#111111]/10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs uppercase tracking-[0.18em] text-[#5F5F5F] mb-3">
              INSIDE ABC
            </p>
            <h2
              className="font-editorial text-4xl md:text-5xl text-[#111111] font-normal leading-[1.1]"
              style={{ textWrap: 'balance' }}
            >
              A closer look at our spaces.
            </h2>
          </motion.div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {visibleCategories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setLightboxIndex(null);
                  }}
                  className={`px-3.5 py-1.5 text-xs uppercase tracking-[0.12em] border transition-colors whitespace-nowrap ${
                    active
                      ? 'border-[#111111] bg-[#111111] text-white'
                      : 'border-[#111111]/15 text-[#5F5F5F] hover:border-[#111111]/40 hover:text-[#111111]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="aspect-[4/3] bg-[#F7F6F2] animate-pulse" />
            ))}
          </div>
        ) : filteredGallery.length === 0 ? (
          <div className="py-16 text-left">
            <p className="font-editorial text-2xl text-[#111111] mb-1">
              No photographs in {selectedCategory} yet.
            </p>
            <p className="text-sm text-[#5F5F5F]">
              Select another category or schedule a visit to experience the property in person.
            </p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-12"
          >
            <AnimatePresence mode="popLayout">
              {filteredGallery.map((item, idx) => {
                // Editorial asymmetric masonry spans on desktop
                const colSpanClass =
                  idx % 5 === 0
                    ? 'md:col-span-7 aspect-[16/10]'
                    : idx % 5 === 1
                    ? 'md:col-span-5 aspect-[4/3]'
                    : 'md:col-span-4 aspect-[4/3]';

                return (
                  <motion.figure
                    layout
                    key={item.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.4 }}
                    className={`${colSpanClass} group relative overflow-hidden bg-[#F7F6F2] cursor-pointer`}
                    onClick={() => setLightboxIndex(idx)}
                  >
                    <button
                      type="button"
                      aria-label={`Open ${item.title} in full-screen lightbox`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxIndex(idx);
                      }}
                      className="w-full h-full block text-left focus:outline-none"
                    >
                      <ResilientImage
                        src={item.image}
                        alt={item.title}
                        hoverZoom
                        className="w-full h-full object-cover"
                      />
                      <figcaption className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/75 via-black/35 to-transparent text-white opacity-95 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                        <span className="block text-[11px] uppercase tracking-[0.14em] text-white/80">
                          {item.category}
                        </span>
                        <span className="block font-editorial text-xl text-white mt-0.5">
                          {item.title}
                        </span>
                      </figcaption>
                    </button>
                  </motion.figure>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Full-Screen Lightbox */}
        <AnimatePresence>
          {currentLightboxItem && lightboxIndex !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setLightboxIndex(null)}
              role="dialog"
              aria-modal="true"
              aria-label="Gallery Image Lightbox"
              className="fixed inset-0 z-50 bg-[#111111]/92 flex items-center justify-center p-4 md:p-10"
            >
              <button
                type="button"
                aria-label="Close lightbox"
                onClick={() => setLightboxIndex(null)}
                className="absolute top-6 right-6 w-11 h-11 flex items-center justify-center border border-white/20 text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {filteredGallery.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex(
                        (lightboxIndex - 1 + filteredGallery.length) % filteredGallery.length
                      );
                    }}
                    className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center border border-white/20 text-white hover:bg-white/10 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex((lightboxIndex + 1) % filteredGallery.length);
                    }}
                    className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center border border-white/20 text-white hover:bg-white/10 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              <motion.div
                key={currentLightboxItem.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25 }}
                onClick={(e) => e.stopPropagation()}
                className="max-w-5xl w-full flex flex-col items-center"
              >
                <div className="w-full max-h-[75vh] overflow-hidden bg-[#111111] flex items-center justify-center">
                  <img
                    src={currentLightboxItem.image}
                    alt={currentLightboxItem.title}
                    referrerPolicy="no-referrer"
                    className="max-h-[75vh] w-auto object-contain"
                  />
                </div>
                <div className="w-full pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-white">
                  <div>
                    <span className="text-xs uppercase tracking-[0.14em] text-white/70">
                      {currentLightboxItem.category}
                    </span>
                    <h3 className="font-editorial text-2xl text-white">
                      {currentLightboxItem.title}
                    </h3>
                    {currentLightboxItem.description && (
                      <p className="text-sm text-white/80 mt-0.5">
                        {currentLightboxItem.description}
                      </p>
                    )}
                  </div>
                  <div className="text-xs font-mono-tabular text-white/60">
                    {lightboxIndex + 1} / {filteredGallery.length}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

// ==========================================
// LOCATION SECTION (Database-Driven, Never Fabricates Address)
// ==========================================

export const LocationSection: React.FC<{ isFullPage?: boolean }> = ({ isFullPage = false }) => {
  const { settings, openEnquiryModal } = useSite();

  const hasAddress = Boolean(settings.address && settings.address.trim());
  const hasGoogleMaps = Boolean(settings.googleMapsUrl && settings.googleMapsUrl.trim());
  const hasLandmarks = Boolean(settings.nearbyLandmarks && settings.nearbyLandmarks.trim());
  const hasWorkplaces = Boolean(settings.nearbyWorkplaces && settings.nearbyWorkplaces.trim());
  const hasColleges = Boolean(settings.nearbyColleges && settings.nearbyColleges.trim());
  const hasTransport = Boolean(settings.transportInfo && settings.transportInfo.trim());

  const hasAnyNeighbourhoodDetails =
    hasLandmarks || hasWorkplaces || hasColleges || hasTransport;

  return (
    <section
      id="home-location"
      className={`${isFullPage ? 'py-16 md:py-24' : 'py-24 md:py-32'} bg-[#F7F6F2] border-t border-[#111111]/10`}
    >
      <div className="max-w-[1360px] mx-auto px-5 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 space-y-6"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-[#315C4C] font-medium">
              NEIGHBOURHOOD & ACCESS
            </p>
            <h2
              className="font-editorial text-4xl md:text-5xl text-[#111111] font-normal leading-[1.1]"
              style={{ textWrap: 'balance' }}
            >
              Stay close to
              <br />
              what matters.
            </h2>
            <p className="text-base text-[#5F5F5F] leading-relaxed max-w-lg">
              Positioned for straightforward daily commutes, peaceful evenings, and easy access to everyday essentials.
            </p>

            {/* Only render address if configured in Admin Settings */}
            {hasAddress && (
              <div className="pt-4 border-t border-[#111111]/10 space-y-1.5">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#858585]">
                  <MapPin className="w-3.5 h-3.5 text-[#315C4C]" />
                  <span>Property Address</span>
                </div>
                <p className="text-base text-[#111111] leading-relaxed">{settings.address}</p>
              </div>
            )}

            <div className="pt-4 flex flex-wrap items-center gap-4">
              {hasGoogleMaps ? (
                <a
                  href={settings.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3 bg-[#111111] text-white px-7 py-3.5 text-xs uppercase tracking-[0.14em] font-medium hover:bg-[#315C4C] hover:-translate-y-[1px] transition-all duration-200 whitespace-nowrap"
                >
                  <span>Get Directions</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-[5px]" />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => openEnquiryModal()}
                  className="group inline-flex items-center gap-3 bg-[#111111] text-white px-7 py-3.5 text-xs uppercase tracking-[0.14em] font-medium hover:bg-[#315C4C] hover:-translate-y-[1px] transition-all duration-200 whitespace-nowrap"
                >
                  <span>Get Directions & Schedule Visit</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-[5px]" />
                </button>
              )}
            </div>
          </motion.div>

          <div className="lg:col-span-6">
            {hasAnyNeighbourhoodDetails ? (
              <div className="bg-[#FFFFFF] border border-[#111111]/10 p-8 md:p-10 divide-y divide-[#111111]/10">
                {hasLandmarks && (
                  <div className="pb-6">
                    <h3 className="text-xs uppercase tracking-[0.14em] text-[#858585] mb-2">
                      Nearby Landmarks
                    </h3>
                    <p className="text-sm text-[#111111] leading-relaxed">
                      {settings.nearbyLandmarks}
                    </p>
                  </div>
                )}
                {hasWorkplaces && (
                  <div className="py-6">
                    <h3 className="text-xs uppercase tracking-[0.14em] text-[#858585] mb-2">
                      Nearby Workplaces & Tech Hubs
                    </h3>
                    <p className="text-sm text-[#111111] leading-relaxed">
                      {settings.nearbyWorkplaces}
                    </p>
                  </div>
                )}
                {hasColleges && (
                  <div className="py-6">
                    <h3 className="text-xs uppercase tracking-[0.14em] text-[#858585] mb-2">
                      Nearby Colleges & Institutions
                    </h3>
                    <p className="text-sm text-[#111111] leading-relaxed">
                      {settings.nearbyColleges}
                    </p>
                  </div>
                )}
                {hasTransport && (
                  <div className="pt-6">
                    <h3 className="text-xs uppercase tracking-[0.14em] text-[#858585] mb-2">
                      Transport & Connectivity
                    </h3>
                    <p className="text-sm text-[#111111] leading-relaxed">
                      {settings.transportInfo}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#FFFFFF] border border-[#111111]/10 p-8 md:p-12 space-y-5">
                <span className="text-xs uppercase tracking-[0.16em] text-[#315C4C]">
                  PRIVATE PROPERTY VISITS
                </span>
                <h3 className="font-editorial text-2xl md:text-3xl text-[#111111] font-normal">
                  Experience the neighbourhood in person.
                </h3>
                <p className="text-sm text-[#5F5F5F] leading-relaxed">
                  Reach out to our team to receive the exact Google Maps pin and arrange a guided walk-through of available rooms and common spaces.
                </p>
                <div className="pt-2">
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#111111] border-b border-[#111111] pb-1 hover:text-[#315C4C] hover:border-[#315C4C] transition-colors"
                  >
                    <span>Request Location Pin</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// ==========================================
// FAQ ACCORDION SECTION
// ==========================================

export const FaqAccordionSection: React.FC<{ isFullPage?: boolean }> = ({ isFullPage = false }) => {
  const { faqs, loading } = useSite();
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (faqs.length > 0 && openId === null) {
      setOpenId(faqs[0].id);
    }
  }, [faqs, openId]);

  return (
    <section
      className={`${isFullPage ? 'py-16 md:py-24' : 'py-24 md:py-32'} bg-[#FFFFFF] border-t border-[#111111]/10`}
    >
      <div className="max-w-[1360px] mx-auto px-5 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[#5F5F5F] mb-3">
              COMMON QUESTIONS
            </p>
            <h2
              className="font-editorial text-4xl md:text-5xl text-[#111111] font-normal leading-[1.1]"
              style={{ textWrap: 'balance' }}
            >
              Everything you need to know before moving in.
            </h2>
            <p className="text-sm text-[#5F5F5F] leading-relaxed mt-4 max-w-sm">
              Have a specific question about room options or move-in dates? Feel free to send us a direct enquiry.
            </p>
          </div>

          <div className="lg:col-span-7">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-16 bg-[#F7F6F2] animate-pulse" />
                ))}
              </div>
            ) : faqs.length === 0 ? (
              <p className="text-sm text-[#5F5F5F]">
                FAQs are currently being updated. Please contact us directly with any questions.
              </p>
            ) : (
              <div className="border-t border-[#111111]/15 divide-y divide-[#111111]/10">
                {faqs.map((faq) => {
                  const isOpen = openId === faq.id;
                  return (
                    <div key={faq.id} className="py-5">
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setOpenId(isOpen ? null : faq.id)}
                        className="w-full flex items-start justify-between gap-6 text-left group"
                      >
                        <div>
                          <span className="block text-[11px] uppercase tracking-[0.14em] text-[#858585] mb-1">
                            {faq.category}
                          </span>
                          <span className="font-editorial text-2xl text-[#111111] group-hover:text-[#315C4C] transition-colors">
                            {faq.question}
                          </span>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-[#5F5F5F] shrink-0 mt-2 transition-transform duration-300 ${
                            isOpen ? 'rotate-180 text-[#315C4C]' : ''
                          }`}
                        />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <p className="text-sm md:text-base text-[#5F5F5F] leading-relaxed pt-3 pr-8">
                              {faq.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// ==========================================
// 1. HOME PAGE (/)
// ==========================================

export const HomePage: React.FC = () => {
  const { settings, gallery, testimonials, openEnquiryModal } = useSite();
  const prefersReducedMotion = useReducedMotion();

  useDocumentMeta(
    settings.seoTitle || 'ABC Coliving | Comfortable Modern Co-Living',
    settings.seoDescription ||
      'Discover comfortable rooms, convenient amenities and community-focused living at ABC Coliving.'
  );

  const heroImageUrl =
    settings.heroImage ||
    gallery[0]?.image ||
    '/images/zenn_hero_living_1791277920156.jpg';

  const lifestyleImageUrl =
    settings.lifestyleImage ||
    '/images/zenn_study_cowork_1791277978036.jpg';

  // Parallax ref for Lifestyle section
  const lifestyleRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress: lifestyleScroll } = useScroll({
    target: lifestyleRef,
    offset: ['start end', 'end start'],
  });
  const parallaxY = useTransform(
    lifestyleScroll,
    [0, 1],
    prefersReducedMotion ? [0, 0] : [-15, 15]
  );

  const introHighlights = [
    {
      num: '01',
      title: 'Comfort',
      desc: 'Well-ventilated rooms with custom wooden beds, supportive mattresses, and calm natural palettes.',
    },
    {
      num: '02',
      title: 'Convenience',
      desc: 'High-speed Wi-Fi, regular housekeeping, hot water, power backup, and homestyle meals handled daily.',
    },
    {
      num: '03',
      title: 'Community',
      desc: 'Shared dining and study spaces that foster genuine connection while respecting personal quiet.',
    },
  ];

  const whyABCPillars = [
    {
      num: '01',
      title: 'Move In With Ease',
      desc: 'Skip furniture shopping and utility setups. Every room is thoughtfully furnished and ready from the day you arrive.',
    },
    {
      num: '02',
      title: 'Everyday Essentials',
      desc: 'From high-speed internet and regular room cleaning to laundry access and prompt maintenance support.',
    },
    {
      num: '03',
      title: 'Space To Focus',
      desc: 'Dedicated study desks and quiet common areas designed for working professionals and students alike.',
    },
    {
      num: '04',
      title: 'A Sense Of Community',
      desc: 'A welcoming, respectful living environment where neighbours share meals, conversations, and everyday routines.',
    },
  ];

  return (
    <div>
      {/* EDITORIAL HOME HERO */}
      <section id="home-hero" className="bg-[#FFFFFF] pt-10 pb-20 md:pt-16 md:pb-28">
        <div className="max-w-[1360px] mx-auto px-5 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            {/* LEFT COLUMN: Sequence eyebrow -> heading -> paragraph -> buttons */}
            <div className="lg:col-span-5 space-y-6">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="text-xs uppercase tracking-[0.2em] text-[#315C4C] font-medium"
              >
                PREMIUM CO-LIVING
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
                className="font-editorial text-5xl sm:text-6xl lg:text-[64px] text-[#111111] font-normal leading-[1.06] tracking-tight"
                style={{ textWrap: 'balance' }}
              >
                A better place
                <br />
                to call home.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="text-base md:text-lg text-[#5F5F5F] leading-relaxed max-w-md"
              >
                Comfortable rooms, thoughtful amenities and a welcoming community — designed to make everyday living feel simple.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.34, ease: [0.16, 1, 0.3, 1] }}
                className="pt-2 flex flex-wrap items-center gap-4"
              >
                <button
                  type="button"
                  onClick={() => openEnquiryModal()}
                  className="group inline-flex items-center gap-3 bg-[#111111] text-white px-7 py-3.5 text-xs uppercase tracking-[0.14em] font-medium hover:bg-[#315C4C] hover:-translate-y-[1px] active:scale-[0.98] transition-all duration-200 whitespace-nowrap"
                >
                  <span>Schedule a Visit</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-[5px]" />
                </button>

                <Link
                  to="/rooms"
                  className="inline-flex items-center justify-center border border-[#111111]/25 text-[#111111] px-7 py-3.5 text-xs uppercase tracking-[0.14em] font-medium hover:border-[#111111] hover:-translate-y-[1px] active:scale-[0.98] transition-all duration-200 whitespace-nowrap"
                >
                  Explore Rooms
                </Link>
              </motion.div>
            </div>

            {/* RIGHT COLUMN: Large Property Image + Caption Below */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7"
            >
              <div className="aspect-[16/10] overflow-hidden bg-[#F7F6F2] border border-[#111111]/10">
                <ResilientImage
                  src={heroImageUrl}
                  alt="ABC Coliving sunlit living space"
                  priority
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-[#5F5F5F] italic font-editorial text-base mt-3">
                Thoughtfully designed spaces for everyday living.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* INTRODUCTION SECTION */}
      <section className="py-24 md:py-32 bg-[#FFFFFF] border-t border-[#111111]/10">
        <div className="max-w-[1360px] mx-auto px-5 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.65 }}
              className="lg:col-span-5"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-[#315C4C] font-medium mb-3">
                WELCOME TO ABC
              </p>
              <h2
                className="font-editorial text-4xl md:text-5xl text-[#111111] font-normal leading-[1.1]"
                style={{ textWrap: 'balance' }}
              >
                More than a PG.
                <br />
                A place to belong.
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.65, delay: 0.1 }}
              className="lg:col-span-7 space-y-5 text-base md:text-lg text-[#5F5F5F] leading-relaxed max-w-2xl"
            >
              <p>
                ABC Coliving brings together comfortable private spaces, useful everyday amenities and welcoming shared areas to create a living experience that feels effortless from day one.
              </p>
              <p>
                Whether you're moving for work, studies or a fresh start, ABC gives you a comfortable space to settle in, focus on your goals and feel at home.
              </p>
            </motion.div>
          </div>

          {/* Three Editorial Highlights with Thin Horizontal Dividers Instead of Cards */}
          <div className="mt-16 pt-4 border-t border-[#111111]/15 divide-y divide-[#111111]/10">
            {introHighlights.map((item, idx) => (
              <motion.div
                key={item.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.55, delay: idx * 0.1 }}
                className="py-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline"
              >
                <div className="md:col-span-2 font-editorial text-2xl text-[#315C4C]">
                  {item.num}
                </div>
                <div className="md:col-span-4">
                  <h3 className="font-editorial text-3xl text-[#111111] font-normal">
                    {item.title}
                  </h3>
                </div>
                <div className="md:col-span-6">
                  <p className="text-sm md:text-base text-[#5F5F5F] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ROOMS SHOWCASE WITH INSTANT FILTER */}
      <RoomsShowcaseSection />

      {/* AMENITIES SECTION */}
      <AmenitiesSection />

      {/* FOOD SECTION */}
      <FoodSection />

      {/* WHY ABC SECTION */}
      <section className="py-24 md:py-32 bg-[#FFFFFF] border-t border-[#111111]/10">
        <div className="max-w-[1360px] mx-auto px-5 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6 }}
            className="max-w-xl mb-16"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-[#5F5F5F] mb-3">
              THE ABC STANDARD
            </p>
            <h2
              className="font-editorial text-4xl md:text-5xl text-[#111111] font-normal leading-[1.1]"
              style={{ textWrap: 'balance' }}
            >
              Why residents choose ABC Coliving.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 border-t border-[#111111]/15 pt-12">
            {whyABCPillars.map((pillar, idx) => (
              <motion.div
                key={pillar.num}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="space-y-3"
              >
                <div className="font-editorial text-5xl text-[#858585]/45 font-normal">
                  {pillar.num}
                </div>
                <h3 className="font-editorial text-2xl text-[#111111] font-normal">
                  {pillar.title}
                </h3>
                <p className="text-sm text-[#5F5F5F] leading-relaxed">
                  {pillar.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY SECTION */}
      <GallerySection />

      {/* LIFESTYLE IMAGE SECTION (Image + Overlapping Bottom-Left White Content Box, No Darkened Text Overlay) */}
      <section ref={lifestyleRef} className="py-20 md:py-28 bg-[#F1EFE9] border-t border-[#111111]/10">
        <div className="max-w-[1360px] mx-auto px-5 md:px-10">
          <div className="relative">
            <div className="aspect-[16/9] w-full overflow-hidden bg-[#F7F6F2] border border-[#111111]/10">
              <motion.div style={{ y: parallaxY }} className="w-full h-[108%] -mt-[4%]">
                <ResilientImage
                  src={lifestyleImageUrl}
                  alt="ABC Coliving study and lifestyle lounge"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </div>

            {/* White Content Box Slightly Overlapping the Bottom-Left */}
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.65 }}
              className="bg-[#FFFFFF] border border-[#111111]/15 p-8 md:p-12 max-w-md -mt-10 md:-mt-24 mx-4 md:ml-10 relative z-10"
            >
              <div className="font-editorial text-2xl md:text-3xl text-[#111111] leading-snug tracking-wide space-y-0.5">
                <div>YOUR SPACE.</div>
                <div>YOUR ROUTINE.</div>
                <div className="text-[#315C4C]">YOUR ABC.</div>
              </div>
              <p className="text-sm md:text-base text-[#5F5F5F] leading-relaxed mt-4 mb-6">
                Your next home could be closer than you think.
              </p>
              <button
                type="button"
                onClick={() => openEnquiryModal()}
                className="group inline-flex items-center gap-3 bg-[#111111] text-white px-6 py-3 text-xs uppercase tracking-[0.14em] font-medium hover:bg-[#315C4C] hover:-translate-y-[1px] active:scale-[0.98] transition-all duration-200 whitespace-nowrap"
              >
                <span>Schedule a Visit</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-[5px]" />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* REVIEWS / TESTIMONIALS SECTION (Database-Driven, Never Fabricates Fake Reviews) */}
      <section className="py-24 md:py-32 bg-[#FFFFFF] border-t border-[#111111]/10">
        <div className="max-w-[1360px] mx-auto px-5 md:px-10">
          <div className="mb-12">
            <p className="text-xs uppercase tracking-[0.18em] text-[#5F5F5F] mb-3">
              RESIDENT VOICES
            </p>
            <h2
              className="font-editorial text-4xl md:text-5xl text-[#111111] font-normal leading-[1.1]"
              style={{ textWrap: 'balance' }}
            >
              Life at ABC.
            </h2>
          </div>

          {testimonials.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className="border-t border-b border-[#111111]/15 py-14 max-w-2xl"
            >
              <h3 className="font-editorial text-3xl text-[#111111] font-normal mb-3">
                Real resident experiences matter.
              </h3>
              <p className="text-base text-[#5F5F5F] leading-relaxed">
                Resident reviews and experiences will appear here as the ABC community grows.
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 border-t border-[#111111]/15 pt-12">
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col justify-between border-b border-[#111111]/10 pb-8"
                >
                  <p className="font-editorial italic text-2xl text-[#111111] leading-relaxed">
                    “{t.testimonial}”
                  </p>
                  <div className="mt-6 pt-4 border-t border-[#111111]/10">
                    <div className="text-sm font-medium text-[#111111]">{t.name}</div>
                    {t.description && (
                      <div className="text-xs text-[#858585] mt-0.5">{t.description}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* LOCATION SECTION */}
      <LocationSection />

      {/* FAQ SECTION */}
      <FaqAccordionSection />

      {/* HOME CONTACT / ENQUIRY SECTION */}
      <section className="py-24 md:py-32 bg-[#F1EFE9] border-t border-[#111111]/10">
        <div className="max-w-[1360px] mx-auto px-5 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5 space-y-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#315C4C] font-medium">
                ENQUIRE & VISIT
              </p>
              <h2
                className="font-editorial text-4xl md:text-5xl text-[#111111] font-normal leading-[1.1]"
                style={{ textWrap: 'balance' }}
              >
                Plan your move to ABC Coliving.
              </h2>
              <p className="text-base text-[#5F5F5F] leading-relaxed">
                Share your details and preferred room type below. Our team will reach out with current availability and help schedule your visit.
              </p>
            </div>

            <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#111111]/10 p-8 md:p-12">
              <EnquiryForm sourcePage="/" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// ==========================================
// 2. ROOMS PAGE (/rooms)
// ==========================================

export const RoomsPage: React.FC = () => {
  useDocumentMeta(
    'Rooms & Living Options | ABC Coliving',
    'Explore Single Sharing, Double Sharing, and Triple Sharing rooms at ABC Coliving.'
  );

  return (
    <div>
      <section className="pt-14 pb-8 bg-[#FFFFFF]">
        <div className="max-w-[1360px] mx-auto px-5 md:px-10">
          <p className="text-xs uppercase tracking-[0.18em] text-[#315C4C] mb-2">
            RESIDENCES
          </p>
          <h1 className="font-editorial text-5xl md:text-6xl text-[#111111] font-normal">
            Rooms at ABC.
          </h1>
        </div>
      </section>
      <RoomsShowcaseSection isFullPage />
    </div>
  );
};

// ==========================================
// 3. ROOM DETAIL PAGE (/rooms/:id)
// ==========================================

export const RoomDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { rooms, loading, openEnquiryModal } = useSite();
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  const room = rooms.find((r) => r.id === id);
  const similarRooms = rooms.filter((r) => r.id !== id).slice(0, 2);

  useDocumentMeta(
    room ? `${room.name} (${room.type}) | ABC Coliving` : 'Room Details | ABC Coliving',
    room ? room.description : 'Explore thoughtfully furnished co-living rooms at ABC Coliving.'
  );

  useEffect(() => {
    setSelectedImageIdx(0);
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-[1360px] mx-auto px-5 md:px-10 py-20 space-y-8 animate-pulse">
        <div className="h-8 bg-[#F7F6F2] w-1/3" />
        <div className="aspect-[16/9] bg-[#F7F6F2] w-full" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="max-w-[1360px] mx-auto px-5 md:px-10 py-24">
        <p className="text-xs uppercase tracking-[0.16em] text-[#858585] mb-2">ROOM NOT FOUND</p>
        <h1 className="font-editorial text-4xl text-[#111111] mb-4">
          This room listing is no longer available.
        </h1>
        <Link
          to="/rooms"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#111111] border-b border-[#111111] pb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Rooms</span>
        </Link>
      </div>
    );
  }

  const images = room.images && room.images.length > 0
    ? room.images
    : ['/images/zenn_single_room_1791277933710.jpg'];

  const priceDisplay =
    room.price !== null && room.price !== undefined && Number(room.price) > 0
      ? `₹${Number(room.price).toLocaleString('en-IN')} / ${room.priceLabel || 'month'}`
      : 'Contact for Pricing';

  return (
    <div className="bg-[#FFFFFF]">
      <div className="max-w-[1360px] mx-auto px-5 md:px-10 py-12 md:py-20">
        <div className="mb-8">
          <Link
            to="/rooms"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#5F5F5F] hover:text-[#111111] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Rooms</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left: Room Image Gallery */}
          <div className="lg:col-span-7 space-y-4">
            <div className="aspect-[4/3] overflow-hidden bg-[#F7F6F2] border border-[#111111]/10">
              <ResilientImage
                src={images[selectedImageIdx] || images[0]}
                alt={`${room.name} — Image ${selectedImageIdx + 1}`}
                priority
                className="w-full h-full object-cover"
              />
            </div>

            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`View room photo ${idx + 1}`}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`w-24 aspect-[4/3] overflow-hidden border transition-all shrink-0 ${
                      selectedImageIdx === idx
                        ? 'border-[#111111] opacity-100'
                        : 'border-transparent opacity-60 hover:opacity-90'
                    }`}
                  >
                    <ResilientImage src={imgUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Room Specifications & Actions */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#5F5F5F]">
              <span>{room.type}</span>
              <span aria-hidden="true">·</span>
              <span>Capacity: {room.capacity} {room.capacity === 1 ? 'Person' : 'Persons'}</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#315C4C] font-medium">{room.availability || 'Available'}</span>
            </div>

            <h1 className="font-editorial text-4xl md:text-5xl text-[#111111] font-normal leading-[1.1]">
              {room.name}
            </h1>

            <div className="py-4 border-y border-[#111111]/10 flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-[0.14em] text-[#858585]">Tariff</span>
              <span className="font-editorial text-2xl text-[#111111]">{priceDisplay}</span>
            </div>

            <p className="text-base text-[#5F5F5F] leading-relaxed">{room.description}</p>

            {room.features && room.features.length > 0 && (
              <div className="space-y-3 pt-2">
                <h2 className="text-xs uppercase tracking-[0.14em] text-[#858585] font-sans font-medium">
                  Included Room Features
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {room.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-sm text-[#111111]">
                      <Check className="w-4 h-4 text-[#315C4C] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  openEnquiryModal({
                    roomPreference: room.type,
                    roomId: room.id,
                    roomName: room.name,
                  })
                }
                className="group inline-flex items-center gap-3 bg-[#111111] text-white px-7 py-3.5 text-xs uppercase tracking-[0.14em] font-medium hover:bg-[#315C4C] transition-colors whitespace-nowrap"
              >
                <span>Schedule Visit</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-[5px]" />
              </button>

              <a
                href="#room-enquiry-section"
                className="inline-flex items-center justify-center border border-[#111111]/25 text-[#111111] px-7 py-3.5 text-xs uppercase tracking-[0.14em] font-medium hover:border-[#111111] transition-colors whitespace-nowrap"
              >
                Enquire Now
              </a>
            </div>
          </div>
        </div>

        {/* Dedicated Room Enquiry Section (Automatically knows which room the user is enquiring about) */}
        <div
          id="room-enquiry-section"
          className="mt-20 pt-16 border-t border-[#111111]/10 grid grid-cols-1 lg:grid-cols-12 gap-12"
        >
          <div className="lg:col-span-5 space-y-3">
            <p className="text-xs uppercase tracking-[0.16em] text-[#315C4C]">
              DIRECT ROOM ENQUIRY
            </p>
            <h2 className="font-editorial text-3xl md:text-4xl text-[#111111] font-normal">
              Enquire about {room.name}
            </h2>
            <p className="text-sm text-[#5F5F5F] leading-relaxed">
              Your enquiry will automatically reference <strong className="text-[#111111] font-medium">{room.name} ({room.type})</strong> so our team can share exact availability and move-in details.
            </p>
          </div>
          <div className="lg:col-span-7 bg-[#F7F6F2] p-8 md:p-10 border border-[#111111]/10">
            <EnquiryForm
              defaultRoomPreference={room.type}
              defaultRoomId={room.id}
              roomName={room.name}
              sourcePage={`/rooms/${room.id}`}
            />
          </div>
        </div>

        {/* Similar Rooms */}
        {similarRooms.length > 0 && (
          <div className="mt-24 pt-16 border-t border-[#111111]/10">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[#858585] mb-2">
                  OTHER LIVING OPTIONS
                </p>
                <h2 className="font-editorial text-3xl md:text-4xl text-[#111111] font-normal">
                  Similar Rooms
                </h2>
              </div>
              <Link
                to="/rooms"
                className="text-xs uppercase tracking-[0.14em] text-[#111111] border-b border-[#111111] pb-1"
              >
                View All Rooms
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {similarRooms.map((sim) => (
                <RoomEditorialItem key={sim.id} room={sim} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 4. AMENITIES PAGE (/amenities)
// ==========================================

export const AmenitiesPage: React.FC = () => {
  useDocumentMeta(
    'Amenities & Facilities | ABC Coliving',
    'High-speed Wi-Fi, housekeeping, 24/7 security, laundry, study spaces, and everyday essentials at ABC Coliving.'
  );

  return (
    <div>
      <section className="pt-14 pb-6 bg-[#FFFFFF]">
        <div className="max-w-[1360px] mx-auto px-5 md:px-10">
          <p className="text-xs uppercase tracking-[0.18em] text-[#315C4C] mb-2">
            FACILITIES & SERVICES
          </p>
          <h1 className="font-editorial text-5xl md:text-6xl text-[#111111] font-normal">
            Everyday Amenities.
          </h1>
        </div>
      </section>
      <AmenitiesSection isFullPage />
    </div>
  );
};

// ==========================================
// 5. GALLERY PAGE (/gallery)
// ==========================================

export const GalleryPage: React.FC = () => {
  useDocumentMeta(
    'Property Gallery | ABC Coliving',
    'Browse photographs of bedrooms, dining spaces, study lounges, and common areas at ABC Coliving.'
  );

  return (
    <div>
      <section className="pt-14 pb-6 bg-[#FFFFFF]">
        <div className="max-w-[1360px] mx-auto px-5 md:px-10">
          <p className="text-xs uppercase tracking-[0.18em] text-[#315C4C] mb-2">
            VISUAL ARCHIVE
          </p>
          <h1 className="font-editorial text-5xl md:text-6xl text-[#111111] font-normal">
            Property Gallery.
          </h1>
        </div>
      </section>
      <GallerySection isFullPage />
    </div>
  );
};

// ==========================================
// 6. FOOD PAGE (/food)
// ==========================================

export const FoodPage: React.FC = () => {
  useDocumentMeta(
    'Dining & Homestyle Meals | ABC Coliving',
    'Freshly prepared Breakfast, Lunch, and Dinner served in a welcoming communal dining space at ABC Coliving.'
  );

  return (
    <div>
      <section className="pt-14 pb-6 bg-[#FFFFFF]">
        <div className="max-w-[1360px] mx-auto px-5 md:px-10">
          <p className="text-xs uppercase tracking-[0.18em] text-[#315C4C] mb-2">
            HOMESTYLE DINING
          </p>
          <h1 className="font-editorial text-5xl md:text-6xl text-[#111111] font-normal">
            Good Food. Every Day.
          </h1>
        </div>
      </section>
      <FoodSection isFullPage />
    </div>
  );
};

// ==========================================
// 7. LOCATION PAGE (/location)
// ==========================================

export const LocationPage: React.FC = () => {
  useDocumentMeta(
    'Location & Neighbourhood | ABC Coliving',
    'Stay close to what matters at ABC Coliving.'
  );

  return (
    <div>
      <section className="pt-14 pb-6 bg-[#FFFFFF]">
        <div className="max-w-[1360px] mx-auto px-5 md:px-10">
          <p className="text-xs uppercase tracking-[0.18em] text-[#315C4C] mb-2">
            CONNECTIVITY
          </p>
          <h1 className="font-editorial text-5xl md:text-6xl text-[#111111] font-normal">
            Location.
          </h1>
        </div>
      </section>
      <LocationSection isFullPage />
    </div>
  );
};

// ==========================================
// 8. CONTACT PAGE (/contact)
// ==========================================

export const ContactPage: React.FC = () => {
  const { settings } = useSite();
  const location = useLocation();

  useDocumentMeta(
    'Contact & Schedule a Visit | ABC Coliving',
    'Get in touch with ABC Coliving to check room availability or schedule a property visit.'
  );

  const hasPhone = Boolean(settings.phone && settings.phone.trim());
  const hasEmail = Boolean(settings.email && settings.email.trim());
  const hasAddress = Boolean(settings.address && settings.address.trim());

  return (
    <section className="py-16 md:py-24 bg-[#FFFFFF]">
      <div className="max-w-[1360px] mx-auto px-5 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 items-start">
          <div className="lg:col-span-5 space-y-6">
            <p className="text-xs uppercase tracking-[0.18em] text-[#315C4C] font-medium">
              CONTACT ABC
            </p>
            <h1
              className="font-editorial text-5xl md:text-6xl text-[#111111] font-normal leading-[1.08]"
              style={{ textWrap: 'balance' }}
            >
              Let’s find your room.
            </h1>
            <p className="text-base text-[#5F5F5F] leading-relaxed">
              Whether you’re looking to move in immediately or planning ahead, fill in your preferred room type and move-in date below.
            </p>

            {(hasPhone || hasEmail || hasAddress) && (
              <div className="pt-6 border-t border-[#111111]/10 space-y-4 text-sm text-[#5F5F5F]">
                {hasPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-[#315C4C]" />
                    <a href={`tel:${settings.phone}`} className="text-[#111111] hover:underline">
                      {settings.phone}
                    </a>
                  </div>
                )}
                {hasEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-[#315C4C]" />
                    <a href={`mailto:${settings.email}`} className="text-[#111111] hover:underline">
                      {settings.email}
                    </a>
                  </div>
                )}
                {hasAddress && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[#315C4C] shrink-0 mt-1" />
                    <span className="text-[#111111]">{settings.address}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-7 bg-[#F7F6F2] border border-[#111111]/10 p-8 md:p-12">
            <h2 className="font-editorial text-3xl text-[#111111] font-normal mb-6">
              Send an Enquiry
            </h2>
            <EnquiryForm sourcePage={location.pathname} />
          </div>
        </div>
      </div>
    </section>
  );
};

// ==========================================
// 9. FAQ PAGE (/faq)
// ==========================================

export const FaqPage: React.FC = () => {
  useDocumentMeta(
    'Frequently Asked Questions | ABC Coliving',
    'Answers to common questions about living at ABC Coliving.'
  );

  return (
    <div>
      <section className="pt-14 pb-6 bg-[#FFFFFF]">
        <div className="max-w-[1360px] mx-auto px-5 md:px-10">
          <p className="text-xs uppercase tracking-[0.18em] text-[#315C4C] mb-2">
            HELP & INFORMATION
          </p>
          <h1 className="font-editorial text-5xl md:text-6xl text-[#111111] font-normal">
            Frequently Asked Questions.
          </h1>
        </div>
      </section>
      <FaqAccordionSection isFullPage />
    </div>
  );
};

// ==========================================
// 10. PRIVACY POLICY (/privacy) & 11. TERMS (/terms)
// ==========================================

export const PrivacyPage: React.FC = () => {
  const { settings } = useSite();
  useDocumentMeta('Privacy Policy | ABC Coliving', 'Privacy Policy for ABC Coliving.');

  return (
    <section className="py-16 md:py-24 bg-[#FFFFFF]">
      <div className="max-w-3xl mx-auto px-5 md:px-10 space-y-6">
        <p className="text-xs uppercase tracking-[0.18em] text-[#858585]">LEGAL</p>
        <h1 className="font-editorial text-4xl md:text-5xl text-[#111111] font-normal">
          Privacy Policy
        </h1>
        <div className="space-y-4 text-sm md:text-base text-[#5F5F5F] leading-relaxed border-t border-[#111111]/10 pt-8">
          <p>
            {settings.brandName || 'ABC Coliving'} respects your privacy and is committed to protecting the personal details you share when submitting a room enquiry or scheduling a property visit.
          </p>
          <h2 className="font-editorial text-2xl text-[#111111] pt-4">Information We Collect</h2>
          <p>
            When you use our enquiry or visit scheduling forms, we collect your name, phone number, email address, preferred room sharing type, target move-in date, and any message you choose to provide.
          </p>
          <h2 className="font-editorial text-2xl text-[#111111] pt-4">How We Use Your Information</h2>
          <p>
            Your contact details are used solely by the ABC Coliving team to respond to your enquiry, share room availability, and coordinate property visits. We do not sell or rent resident or prospective resident information to third parties.
          </p>
        </div>
      </div>
    </section>
  );
};

export const TermsPage: React.FC = () => {
  const { settings } = useSite();
  useDocumentMeta('Terms of Use | ABC Coliving', 'Terms and conditions for ABC Coliving.');

  return (
    <section className="py-16 md:py-24 bg-[#FFFFFF]">
      <div className="max-w-3xl mx-auto px-5 md:px-10 space-y-6">
        <p className="text-xs uppercase tracking-[0.18em] text-[#858585]">LEGAL</p>
        <h1 className="font-editorial text-4xl md:text-5xl text-[#111111] font-normal">
          Terms of Residence & Website Use
        </h1>
        <div className="space-y-4 text-sm md:text-base text-[#5F5F5F] leading-relaxed border-t border-[#111111]/10 pt-8">
          <p>
            Welcome to {settings.brandName || 'ABC Coliving'}. By accessing this website or submitting an enquiry, you agree to these terms.
          </p>
          <h2 className="font-editorial text-2xl text-[#111111] pt-4">Room Availability & Bookings</h2>
          <p>
            Submitting an online enquiry or visit request does not constitute a confirmed reservation. Room allocation and tariffs are finalized upon completion of resident verification and house onboarding guidelines.
          </p>
          <h2 className="font-editorial text-2xl text-[#111111] pt-4">Community Guidelines</h2>
          <p>
            ABC Coliving is designed as a peaceful, respectful shared living environment. Residents are expected to uphold house norms regarding quiet hours, cleanliness, and visitor policies.
          </p>
        </div>
      </div>
    </section>
  );
};
