export enum RoomType {
  SINGLE = 'Single Sharing',
  DOUBLE = 'Double Sharing',
  TRIPLE = 'Triple Sharing',
}

export enum EnquiryStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  FOLLOW_UP = 'FOLLOW_UP',
  VISIT_SCHEDULED = 'VISIT_SCHEDULED',
  CONVERTED = 'CONVERTED',
  CLOSED = 'CLOSED',
}

export enum GalleryCategory {
  BEDROOMS = 'Bedrooms',
  BATHROOMS = 'Bathrooms',
  DINING = 'Dining',
  COMMON_AREAS = 'Common Areas',
  EXTERIOR = 'Exterior',
  STUDY_SPACES = 'Study Spaces',
  AMENITIES = 'Amenities',
  OTHER = 'Other',
}

export interface RoomImage {
  id: string;
  roomId: string;
  url: string;
  alt: string;
  order: number;
}

export interface Room {
  id: string;
  name: string;
  type: RoomType | string;
  description: string;
  capacity: number;
  price: number | null;
  priceLabel: string;
  features: string[];
  images: string[];
  roomImages?: RoomImage[];
  availability: string;
  featured: boolean;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Amenity {
  id: string;
  name: string;
  description: string;
  icon: string;
  image?: string;
  order: number;
  active: boolean;
}

export interface GalleryItem {
  id: string;
  image: string;
  title: string;
  category: GalleryCategory | string;
  description: string;
  order: number;
  published: boolean;
  createdAt: string;
}

export interface FoodItem {
  id: string;
  meal: 'Breakfast' | 'Lunch' | 'Dinner' | string;
  title: string;
  description: string;
  timing: string;
  image: string;
  order: number;
  active: boolean;
}

export interface EnquiryNote {
  id: string;
  enquiryId: string;
  authorName: string;
  note: string;
  createdAt: string;
}

export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  roomId: string | null;
  roomPreference: string;
  moveInDate: string;
  message: string;
  status: EnquiryStatus;
  sourcePage: string;
  notes?: EnquiryNote[];
  createdAt: string;
  updatedAt: string;
}

export interface Testimonial {
  id: string;
  name: string;
  description: string;
  testimonial: string;
  image?: string;
  rating?: number | null;
  published: boolean;
  createdAt: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  published: boolean;
}

export interface SiteSettings {
  brandName: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  latitude: string;
  longitude: string;
  googleMapsUrl: string;
  googleBusinessUrl: string;
  nearbyLandmarks: string;
  nearbyWorkplaces: string;
  nearbyColleges: string;
  transportInfo: string;
  instagram: string;
  facebook: string;
  heroImage: string;
  lifestyleImage: string;
  logo: string;
  favicon: string;
  seoTitle: string;
  seoDescription: string;
}

export interface PublicSitePayload {
  settings: SiteSettings;
  rooms: Room[];
  amenities: Amenity[];
  gallery: GalleryItem[];
  food: FoodItem[];
  testimonials: Testimonial[];
  faqs: FAQItem[];
}

export interface AdminDashboardStats {
  totalEnquiries: number;
  newEnquiries: number;
  followUps: number;
  visitsScheduled: number;
  converted: number;
  availableRooms: number;
}
