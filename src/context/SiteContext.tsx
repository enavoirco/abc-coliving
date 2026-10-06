import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  SiteSettings,
  Room,
  Amenity,
  GalleryItem,
  FoodItem,
  Testimonial,
  FAQItem,
  PublicSitePayload,
} from '../types';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface EnquiryModalState {
  isOpen: boolean;
  roomPreference: string;
  roomId: string | null;
  roomName?: string;
}

interface SiteContextValue {
  settings: SiteSettings;
  rooms: Room[];
  amenities: Amenity[];
  gallery: GalleryItem[];
  food: FoodItem[];
  testimonials: Testimonial[];
  faqs: FAQItem[];
  loading: boolean;
  error: string | null;
  refreshPublicData: () => Promise<void>;
  adminToken: string | null;
  adminUser: AdminUser | null;
  authChecking: boolean;
  loginAdmin: (token: string, user: AdminUser) => void;
  logoutAdmin: () => void;
  enquiryModal: EnquiryModalState;
  openEnquiryModal: (opts?: { roomPreference?: string; roomId?: string | null; roomName?: string }) => void;
  closeEnquiryModal: () => void;
}

const defaultSettings: SiteSettings = {
  brandName: 'ABC',
  tagline: 'Live Better. Feel at Home.',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  latitude: '',
  longitude: '',
  googleMapsUrl: '',
  googleBusinessUrl: '',
  nearbyLandmarks: '',
  nearbyWorkplaces: '',
  nearbyColleges: '',
  transportInfo: '',
  instagram: '',
  facebook: '',
  heroImage: '/images/zenn_hero_living_1791277920156.jpg',
  lifestyleImage: '/images/zenn_study_cowork_1791277978036.jpg',
  logo: '',
  favicon: '',
  seoTitle: 'ABC Coliving | Comfortable Modern Co-Living',
  seoDescription: 'Discover comfortable rooms, convenient amenities and community-focused living at ABC Coliving.',
};

const SiteContext = createContext<SiteContextValue | undefined>(undefined);

const ADMIN_TOKEN_STORAGE_KEY = 'abc_admin_auth_token';

export const SiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [food, setFood] = useState<FoodItem[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  const [enquiryModal, setEnquiryModal] = useState<EnquiryModalState>({
    isOpen: false,
    roomPreference: 'Single Sharing',
    roomId: null,
    roomName: undefined,
  });

  const refreshPublicData = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/public/bootstrap');
      if (!res.ok) {
        throw new Error('Unable to load property information.');
      }
      const data: PublicSitePayload = await res.json();
      setSettings({ ...defaultSettings, ...(data.settings || {}) });
      setRooms(Array.isArray(data.rooms) ? data.rooms : []);
      setAmenities(Array.isArray(data.amenities) ? data.amenities : []);
      setGallery(Array.isArray(data.gallery) ? data.gallery : []);
      setFood(Array.isArray(data.food) ? data.food : []);
      setTestimonials(Array.isArray(data.testimonials) ? data.testimonials : []);
      setFaqs(Array.isArray(data.faqs) ? data.faqs : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPublicData();
  }, [refreshPublicData]);

  useEffect(() => {
    async function verifyToken() {
      if (!adminToken) {
        setAdminUser(null);
        setAuthChecking(false);
        return;
      }
      try {
        const res = await fetch('/api/admin/me', {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (!res.ok) {
          throw new Error('Invalid session');
        }
        const data = await res.json();
        setAdminUser(data.user);
      } catch {
        setAdminToken(null);
        setAdminUser(null);
        try {
          sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
          localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
        } catch {
          // ignore storage errors
        }
      } finally {
        setAuthChecking(false);
      }
    }
    verifyToken();
  }, [adminToken]);

  const loginAdmin = useCallback((token: string, user: AdminUser) => {
    setAdminToken(token);
    setAdminUser(user);
    try {
      sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
      localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
    } catch {
      // ignore storage errors
    }
  }, []);

  const logoutAdmin = useCallback(() => {
    setAdminToken(null);
    setAdminUser(null);
    try {
      sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
      localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
  }, []);

  const openEnquiryModal = useCallback(
    (opts?: { roomPreference?: string; roomId?: string | null; roomName?: string }) => {
      setEnquiryModal({
        isOpen: true,
        roomPreference: opts?.roomPreference || 'Single Sharing',
        roomId: opts?.roomId || null,
        roomName: opts?.roomName,
      });
    },
    []
  );

  const closeEnquiryModal = useCallback(() => {
    setEnquiryModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <SiteContext.Provider
      value={{
        settings,
        rooms,
        amenities,
        gallery,
        food,
        testimonials,
        faqs,
        loading,
        error,
        refreshPublicData,
        adminToken,
        adminUser,
        authChecking,
        loginAdmin,
        logoutAdmin,
        enquiryModal,
        openEnquiryModal,
        closeEnquiryModal,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
};

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) {
    throw new Error('useSite must be used within a SiteProvider');
  }
  return ctx;
}
