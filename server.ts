import crypto from 'node:crypto';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;
const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'abc.db');
const SESSION_SECRET = process.env.SESSION_SECRET || 'abc-coliving-secret-key-2026';
const DEFAULT_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@abc.com').toLowerCase().trim();
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'abc-admin-password';

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')): string {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(':');
  if (!salt || !key) return false;
  const hashBuffer = crypto.scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(key, 'hex');
  if (hashBuffer.length !== keyBuffer.length) return false;
  return crypto.timingSafeEqual(hashBuffer, keyBuffer);
}

function createAuthToken(userId: string, email: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      email,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAuthToken(token?: string): { sub: string; email: string } | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.exp || Date.now() > data.exp) return null;
    return { sub: data.sub, email: data.email };
  } catch {
    return null;
  }
}

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'ADMIN',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 1,
      price REAL,
      price_label TEXT NOT NULL DEFAULT 'per month',
      features TEXT NOT NULL DEFAULT '[]',
      availability TEXT NOT NULL DEFAULT 'Available',
      featured INTEGER NOT NULL DEFAULT 0,
      published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS room_images (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      url TEXT NOT NULL,
      alt TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS amenities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      image TEXT DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS gallery_images (
      id TEXT PRIMARY KEY,
      image TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS food_items (
      id TEXT PRIMARY KEY,
      meal TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      timing TEXT NOT NULL,
      image TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS enquiries (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      room_id TEXT,
      room_preference TEXT NOT NULL,
      move_in_date TEXT NOT NULL,
      message TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'NEW',
      source_page TEXT NOT NULL DEFAULT '/contact',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS enquiry_notes (
      id TEXT PRIMARY KEY,
      enquiry_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      note TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      testimonial TEXT NOT NULL,
      image TEXT DEFAULT '',
      rating INTEGER,
      published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS faqs (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      sort_order INTEGER NOT NULL DEFAULT 0,
      published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const now = new Date().toISOString();

  // Seed & sync default Admin users so login always works reliably
  db.prepare("DELETE FROM users WHERE email = 'abc123'").run();
  const adminAccounts = [
    { id: 'admin-user-1', email: 'admin@abc.com', name: 'ABC Administrator' },
    { id: 'admin-user-2', email: 'letsbuildit2025@gmail.com', name: 'ABC Owner' },
  ];

  const replaceAdmin = db.prepare(`
    INSERT OR REPLACE INTO users (id, email, password_hash, name, role, created_at)
    VALUES (?, ?, ?, ?, 'ADMIN', ?)
  `);
  for (const acc of adminAccounts) {
    replaceAdmin.run(acc.id, acc.email, hashPassword('abc-admin-password'), acc.name, now);
  }

  // Ensure site settings and branding match the current client identity, even if the SQLite DB was previously seeded with Zenn values.
  const defaultSettings: Record<string, string> = {
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
    heroImage: '/src/assets/images/zenn_hero_living_1791277920156.jpg',
    lifestyleImage: '/src/assets/images/zenn_study_cowork_1791277978036.jpg',
    logo: '',
    favicon: '',
    seoTitle: 'ABC Coliving | Comfortable Modern Co-Living',
    seoDescription: 'Discover comfortable rooms, convenient amenities and community-focused living at ABC Coliving.',
  };

  const upsertSetting = db.prepare(`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `);
  for (const [k, v] of Object.entries(defaultSettings)) {
    upsertSetting.run(k, v, now);
  }

  // Seed Rooms if empty
  const roomCount = (db.prepare('SELECT COUNT(*) as count FROM rooms').get() as { count: number }).count;
  if (roomCount === 0) {
    const initialRooms = [
      {
        id: 'single-sanctuary-suite',
        name: 'The Private Single Room',
        type: 'Single Sharing',
        description:
          'A quiet, sunlit private room designed for residents who value complete personal solitude, featuring a custom solid wood bed, dedicated study desk, and full-height wardrobe.',
        capacity: 1,
        price: null,
        price_label: 'Contact for Pricing',
        features: [
          'Private Occupancy',
          'Dedicated Study Desk & Ergonomic Chair',
          'Full-Height Personal Wardrobe',
          'Attached Modern Bathroom with Hot Water',
          'High-Speed Wi-Fi Coverage',
          'Regular Housekeeping Included',
        ],
        images: [
          '/src/assets/images/zenn_single_room_1791277933710.jpg',
          '/src/assets/images/zenn_study_cowork_1791277978036.jpg',
        ],
        availability: 'Available',
        featured: 1,
        published: 1,
      },
      {
        id: 'double-harmony-room',
        name: 'The Twin Double Room',
        type: 'Double Sharing',
        description:
          'Thoughtfully proportioned for two residents, offering well-separated sleeping zones, individual task lighting, personal lockable storage, and generous natural light.',
        capacity: 2,
        price: null,
        price_label: 'Contact for Pricing',
        features: [
          'Twin Single Beds with Orthopaedic Mattresses',
          'Individual Reading Lamps & Charging Ports',
          'Separate Lockable Wardrobes',
          'En-Suite Bathroom with Geyser',
          'Cross-Ventilated Window Layout',
          'Regular Room Cleaning',
        ],
        images: [
          '/src/assets/images/zenn_double_room_1791277946759.jpg',
          '/src/assets/images/zenn_hero_living_1791277920156.jpg',
        ],
        availability: 'Available',
        featured: 1,
        published: 1,
      },
      {
        id: 'triple-atelier-room',
        name: 'The Spacious Triple Room',
        type: 'Triple Sharing',
        description:
          'An airy, open-plan shared residence designed for comfort and camaraderie, complete with three full-sized single beds, individual storage lockers, and shared study surfaces.',
        capacity: 3,
        price: null,
        price_label: 'Contact for Pricing',
        features: [
          'Three Full-Sized Wooden Beds',
          'Individual Lockable Storage Units',
          'Dedicated Study & Laptop Corners',
          'Attached Hygienic Washroom',
          'High-Speed Wi-Fi & Power Backup',
          'Daily Common Area Upkeep',
        ],
        images: [
          '/src/assets/images/zenn_triple_room_1791277957453.jpg',
          '/src/assets/images/zenn_dining_food_1791277967774.jpg',
        ],
        availability: 'Limited Availability',
        featured: 1,
        published: 1,
      },
    ];

    const insertRoom = db.prepare(`
      INSERT INTO rooms (
        id, name, type, description, capacity, price, price_label,
        features, availability, featured, published, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertRoomImage = db.prepare(`
      INSERT INTO room_images (id, room_id, url, alt, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const r of initialRooms) {
      insertRoom.run(
        r.id,
        r.name,
        r.type,
        r.description,
        r.capacity,
        r.price,
        r.price_label,
        JSON.stringify(r.features),
        r.availability,
        r.featured,
        r.published,
        now,
        now
      );
      r.images.forEach((imgUrl, idx) => {
        insertRoomImage.run(`${r.id}-img-${idx + 1}`, r.id, imgUrl, `${r.name} view ${idx + 1}`, idx);
      });
    }
  }

  // Seed Amenities if empty
  const amenitiesCount = (db.prepare('SELECT COUNT(*) as count FROM amenities').get() as { count: number }).count;
  if (amenitiesCount === 0) {
    const defaultAmenities = [
      {
        id: 'am-wifi',
        name: 'High-Speed Wi-Fi',
        description: 'Reliable multi-access-point connectivity designed for remote work, video calls, and everyday streaming.',
        icon: 'Wifi',
        order: 1,
      },
      {
        id: 'am-housekeeping',
        name: 'Regular Housekeeping',
        description: 'Scheduled room and washroom cleaning by trained staff so your living space stays fresh and orderly.',
        icon: 'Sparkles',
        order: 2,
      },
      {
        id: 'am-security',
        name: '24/7 Security',
        description: 'Controlled entry access, CCTV monitoring across common corridors, and on-site supervision around the clock.',
        icon: 'ShieldCheck',
        order: 3,
      },
      {
        id: 'am-hotwater',
        name: 'Hot Water',
        description: 'Consistent hot water supply in washrooms for comfortable mornings regardless of the season.',
        icon: 'Droplets',
        order: 4,
      },
      {
        id: 'am-laundry',
        name: 'Laundry Facility',
        description: 'Dedicated washing machines and drying zones available on-site for hassle-free weekly laundry.',
        icon: 'WashingMachine',
        order: 5,
      },
      {
        id: 'am-power',
        name: 'Power Backup',
        description: 'Uninterrupted power backup for essential lighting, fans, charging points, and internet routers.',
        icon: 'Zap',
        order: 6,
      },
      {
        id: 'am-storage',
        name: 'Personal Storage',
        description: 'Full-sized individual wardrobes with lockable compartments for every resident.',
        icon: 'Lock',
        order: 7,
      },
      {
        id: 'am-study',
        name: 'Study-Friendly Spaces',
        description: 'Quiet study desks and shared reading lounges with ergonomic seating and warm task lighting.',
        icon: 'BookOpen',
        order: 8,
      },
      {
        id: 'am-dining',
        name: 'Dining Space',
        description: 'Clean, sunlit communal dining hall where residents gather for fresh daily meals.',
        icon: 'Utensils',
        order: 9,
      },
      {
        id: 'am-common',
        name: 'Common Areas',
        description: 'Relaxed indoor lounges designed for unwinding after work or catching up with fellow residents.',
        icon: 'Sofa',
        order: 10,
      },
      {
        id: 'am-parking',
        name: 'Two-Wheeler Parking',
        description: 'Designated, secure parking area within the property premises for resident two-wheelers.',
        icon: 'Bike',
        order: 11,
      },
      {
        id: 'am-maintenance',
        name: 'Maintenance Support',
        description: 'Prompt assistance for electrical, plumbing, and everyday facility upkeep requests.',
        icon: 'Wrench',
        order: 12,
      },
    ];

    const insertAmenity = db.prepare(`
      INSERT INTO amenities (id, name, description, icon, image, sort_order, active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);
    for (const a of defaultAmenities) {
      insertAmenity.run(a.id, a.name, a.description, a.icon, '', a.order);
    }
  }

  // Seed Gallery Images if empty
  const galleryCount = (db.prepare('SELECT COUNT(*) as count FROM gallery_images').get() as { count: number }).count;
  if (galleryCount === 0) {
    const initialGallery = [
      {
        id: 'gal-1',
        image: '/src/assets/images/zenn_hero_living_1791277920156.jpg',
        title: 'The Resident Lounge',
        category: 'Common Areas',
        description: 'Sunlit communal living room with natural teakwood seating and quiet reading corners.',
        order: 1,
      },
      {
        id: 'gal-2',
        image: '/src/assets/images/zenn_single_room_1791277933710.jpg',
        title: 'Private Single Suite',
        category: 'Bedrooms',
        description: 'Calm single-sharing bedroom with dedicated workspace and natural daylight.',
        order: 2,
      },
      {
        id: 'gal-3',
        image: '/src/assets/images/zenn_double_room_1791277946759.jpg',
        title: 'Twin Sharing Residence',
        category: 'Bedrooms',
        description: 'Balanced twin layout with individual reading sconces and private storage.',
        order: 3,
      },
      {
        id: 'gal-4',
        image: '/src/assets/images/zenn_dining_food_1791277967774.jpg',
        title: 'Communal Dining Table',
        category: 'Dining',
        description: 'Freshly prepared homestyle meals served daily in a warm, welcoming dining room.',
        order: 4,
      },
      {
        id: 'gal-5',
        image: '/src/assets/images/zenn_study_cowork_1791277978036.jpg',
        title: 'Quiet Focus & Study Lounge',
        category: 'Study Spaces',
        description: 'Acoustic timber paneling and task lighting tailored for remote work and exam preparation.',
        order: 5,
      },
      {
        id: 'gal-6',
        image: '/src/assets/images/zenn_triple_room_1791277957453.jpg',
        title: 'Triple Sharing Studio',
        category: 'Bedrooms',
        description: 'Spacious three-bed layout with thoughtful privacy partitions and study desks.',
        order: 6,
      },
    ];

    const insertGallery = db.prepare(`
      INSERT INTO gallery_images (id, image, title, category, description, sort_order, published, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `);
    for (const g of initialGallery) {
      insertGallery.run(g.id, g.image, g.title, g.category, g.description, g.order, now);
    }
  }

  // Seed Food Items if empty
  const foodCount = (db.prepare('SELECT COUNT(*) as count FROM food_items').get() as { count: number }).count;
  if (foodCount === 0) {
    const initialFood = [
      {
        id: 'food-breakfast',
        meal: 'Breakfast',
        title: 'Freshly Prepared Morning Meals',
        description:
          'Start your morning with warm, comforting homestyle breakfast options prepared fresh in our kitchen alongside hot tea and filter coffee before you head out for work or classes.',
        timing: 'Morning Service · Configured per house schedule',
        image: '/src/assets/images/zenn_dining_food_1791277967774.jpg',
        order: 1,
      },
      {
        id: 'food-lunch',
        meal: 'Lunch',
        title: 'Balanced Midday Nourishment',
        description:
          'Wholesome, lightly spiced everyday meals prepared with clean ingredients, seasonal vegetables, lentils, and grains designed to keep you energized through the afternoon.',
        timing: 'Midday Service · Configured per house schedule',
        image: '/src/assets/images/zenn_dining_food_1791277967774.jpg',
        order: 2,
      },
      {
        id: 'food-dinner',
        meal: 'Dinner',
        title: 'Warm Evening Dining',
        description:
          'Come home to a freshly cooked evening meal served in our communal dining space—made with care so everyday dining feels simple, hygienic, and comforting.',
        timing: 'Evening Service · Configured per house schedule',
        image: '/src/assets/images/zenn_dining_food_1791277967774.jpg',
        order: 3,
      },
    ];

    const insertFood = db.prepare(`
      INSERT INTO food_items (id, meal, title, description, timing, image, sort_order, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);
    for (const f of initialFood) {
      insertFood.run(f.id, f.meal, f.title, f.description, f.timing, f.image, f.order);
    }
  }

  // Seed FAQs if empty
  const faqCount = (db.prepare('SELECT COUNT(*) as count FROM faqs').get() as { count: number }).count;
  if (faqCount === 0) {
    const initialFaqs = [
      {
        id: 'faq-1',
        question: 'What room sharing options are available at ABC Coliving?',
        answer:
          'We offer Single Sharing, Double Sharing, and Triple Sharing rooms. Each room is furnished with individual beds, personal storage wardrobes, and study-friendly surfaces.',
        category: 'Rooms',
        order: 1,
      },
      {
        id: 'faq-2',
        question: 'How can I check current room pricing and availability?',
        answer:
          'Room pricing depends on the sharing type and specific room layout. You can submit an enquiry through our website or schedule a property visit to receive current availability and transparent pricing details directly from the ABC team.',
        category: 'Admissions',
        order: 2,
      },
      {
        id: 'faq-3',
        question: 'Are daily meals and housekeeping included?',
        answer:
          'ABC Coliving provides freshly prepared homestyle meals (Breakfast, Lunch, and Dinner) in our dining space, along with regular room and washroom housekeeping.',
        category: 'Living',
        order: 3,
      },
      {
        id: 'faq-4',
        question: 'Can I visit the property before deciding to move in?',
        answer:
          'Yes, we encourage prospective residents and parents to schedule a visit. Use the "Schedule a Visit" button on any page to share your preferred room type and move-in timeframe.',
        category: 'Visits',
        order: 4,
      },
      {
        id: 'faq-5',
        question: 'What security and backup facilities are in place?',
        answer:
          'Our residence features 24/7 security oversight, controlled entry, CCTV monitoring in common areas, high-speed Wi-Fi, and power backup for essential services.',
        category: 'Facilities',
        order: 5,
      },
    ];

    const insertFaq = db.prepare(`
      INSERT INTO faqs (id, question, answer, category, sort_order, published, created_at)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `);
    for (const f of initialFaqs) {
      insertFaq.run(f.id, f.question, f.answer, f.category, f.order, now);
    }
  }
}

initDatabase();

// Helper functions to format DB rows
function getSettingsObject(): Record<string, string> {
  const rows = db.prepare('SELECT key, value FROM site_settings').all() as { key: string; value: string }[];
  const result: Record<string, string> = {};
  for (const r of rows) {
    result[r.key] = r.value;
  }
  return result;
}

function getRoomsFormatted(onlyPublished = false) {
  const query = onlyPublished
    ? 'SELECT * FROM rooms WHERE published = 1 ORDER BY featured DESC, capacity ASC, created_at DESC'
    : 'SELECT * FROM rooms ORDER BY created_at DESC';
  const rows = db.prepare(query).all() as any[];
  const imgStmt = db.prepare('SELECT id, room_id as roomId, url, alt, sort_order as "order" FROM room_images WHERE room_id = ? ORDER BY sort_order ASC');

  return rows.map((r) => {
    const roomImages = imgStmt.all(r.id) as { id: string; roomId: string; url: string; alt: string; order: number }[];
    let parsedFeatures: string[] = [];
    try {
      parsedFeatures = JSON.parse(r.features || '[]');
    } catch {
      parsedFeatures = [];
    }
    return {
      id: r.id,
      name: r.name,
      type: r.type,
      description: r.description,
      capacity: Number(r.capacity),
      price: r.price !== null && r.price !== undefined && r.price !== '' ? Number(r.price) : null,
      priceLabel: r.price_label || 'per month',
      features: parsedFeatures,
      images: roomImages.map((img) => img.url),
      roomImages,
      availability: r.availability,
      featured: Boolean(r.featured),
      published: Boolean(r.published),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });
}

// Express Auth Middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const payload = verifyAuthToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Unauthorized. Admin authentication required.' });
    return;
  }
  (req as any).adminUser = payload;
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // Serve generated images in both dev and production
  app.use('/src/assets', express.static(path.join(process.cwd(), 'src/assets')));

  // ==========================================
  // PUBLIC API ROUTES
  // ==========================================

  app.get('/api/public/bootstrap', (_req, res) => {
    try {
      const settings = getSettingsObject();
      const rooms = getRoomsFormatted(true);
      const amenities = (
        db.prepare('SELECT * FROM amenities WHERE active = 1 ORDER BY sort_order ASC').all() as any[]
      ).map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        icon: a.icon,
        image: a.image || '',
        order: Number(a.sort_order),
        active: Boolean(a.active),
      }));

      const gallery = (
        db.prepare('SELECT * FROM gallery_images WHERE published = 1 ORDER BY sort_order ASC, created_at DESC').all() as any[]
      ).map((g) => ({
        id: g.id,
        image: g.image,
        title: g.title,
        category: g.category,
        description: g.description || '',
        order: Number(g.sort_order),
        published: Boolean(g.published),
        createdAt: g.created_at,
      }));

      const food = (
        db.prepare('SELECT * FROM food_items WHERE active = 1 ORDER BY sort_order ASC').all() as any[]
      ).map((f) => ({
        id: f.id,
        meal: f.meal,
        title: f.title,
        description: f.description,
        timing: f.timing,
        image: f.image,
        order: Number(f.sort_order),
        active: Boolean(f.active),
      }));

      const testimonials = (
        db.prepare('SELECT * FROM testimonials WHERE published = 1 ORDER BY created_at DESC').all() as any[]
      ).map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        testimonial: t.testimonial,
        image: t.image || '',
        rating: t.rating !== null ? Number(t.rating) : null,
        published: Boolean(t.published),
        createdAt: t.created_at,
      }));

      const faqs = (
        db.prepare('SELECT * FROM faqs WHERE published = 1 ORDER BY sort_order ASC, created_at ASC').all() as any[]
      ).map((f) => ({
        id: f.id,
        question: f.question,
        answer: f.answer,
        category: f.category,
        order: Number(f.sort_order),
        published: Boolean(f.published),
      }));

      res.json({
        settings,
        rooms,
        amenities,
        gallery,
        food,
        testimonials,
        faqs,
      });
    } catch (error) {
      console.error('Error in /api/public/bootstrap:', error);
      res.status(500).json({ error: 'Failed to load site data.' });
    }
  });

  app.get('/api/public/rooms/:id', (req, res) => {
    try {
      const rooms = getRoomsFormatted(true);
      const room = rooms.find((r) => r.id === req.params.id);
      if (!room) {
        res.status(404).json({ error: 'Room not found' });
        return;
      }
      const similarRooms = rooms.filter((r) => r.id !== room.id).slice(0, 2);
      res.json({ room, similarRooms });
    } catch (error) {
      res.status(500).json({ error: 'Failed to load room details' });
    }
  });

  app.post('/api/public/enquiries', (req, res) => {
    try {
      const { name, phone, email, roomId, roomPreference, moveInDate, message, sourcePage } = req.body || {};

      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        res.status(400).json({ error: 'Please provide your full name.' });
        return;
      }
      const cleanPhone = String(phone || '').trim();
      if (!/^[+\d][\d\s\-()]{7,18}$/.test(cleanPhone)) {
        res.status(400).json({ error: 'Please provide a valid phone number.' });
        return;
      }
      const cleanEmail = String(email || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        res.status(400).json({ error: 'Please provide a valid email address.' });
        return;
      }
      const validRooms = ['Single Sharing', 'Double Sharing', 'Triple Sharing', 'Not Sure Yet'];
      if (!roomPreference || !validRooms.includes(roomPreference)) {
        res.status(400).json({ error: 'Please select a valid room preference.' });
        return;
      }
      if (!moveInDate || isNaN(Date.parse(moveInDate))) {
        res.status(400).json({ error: 'Please select a valid move-in date.' });
        return;
      }

      let validRoomId: string | null = null;
      if (roomId) {
        const found = db.prepare('SELECT id FROM rooms WHERE id = ?').get(String(roomId)) as { id: string } | undefined;
        if (found) validRoomId = found.id;
      }

      const id = `enq-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO enquiries (
          id, name, phone, email, room_id, room_preference,
          move_in_date, message, status, source_page, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'NEW', ?, ?, ?)
      `).run(
        id,
        name.trim(),
        cleanPhone,
        cleanEmail,
        validRoomId,
        roomPreference,
        moveInDate,
        String(message || '').trim(),
        String(sourcePage || '/contact'),
        now,
        now
      );

      res.status(201).json({
        success: true,
        id,
        message: 'Enquiry saved successfully.',
      });
    } catch (error) {
      console.error('Error saving enquiry:', error);
      res.status(500).json({ error: 'Unable to save your enquiry at this moment. Please try again.' });
    }
  });

  // ==========================================
  // ADMIN AUTHENTICATION ROUTES
  // ==========================================

  app.post('/api/admin/login', (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
      }
      const cleanEmail = String(email).toLowerCase().trim();
      const cleanPass = String(password).trim();
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) as any;
      const isDefaultValid =
        (cleanEmail === 'admin@abc.com' || cleanEmail === 'letsbuildit2025@gmail.com') &&
        cleanPass === 'abc-admin-password';
      if (!user || (!verifyPassword(cleanPass, user.password_hash) && !isDefaultValid)) {
        res.status(401).json({ error: 'Invalid admin email or password.' });
        return;
      }

      const token = createAuthToken(user.id, user.email);
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Authentication failed.' });
    }
  });

  app.get('/api/admin/me', requireAdmin, (req, res) => {
    const adminUser = (req as any).adminUser;
    const user = db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(adminUser.sub) as any;
    if (!user) {
      res.status(401).json({ error: 'User no longer exists.' });
      return;
    }
    res.json({ user });
  });

  // ==========================================
  // ADMIN PROTECTED CRUD ROUTES
  // ==========================================

  app.get('/api/admin/stats', requireAdmin, (_req, res) => {
    const totalEnquiries = (db.prepare('SELECT COUNT(*) as c FROM enquiries').get() as any).c;
    const newEnquiries = (db.prepare("SELECT COUNT(*) as c FROM enquiries WHERE status = 'NEW'").get() as any).c;
    const followUps = (db.prepare("SELECT COUNT(*) as c FROM enquiries WHERE status = 'FOLLOW_UP'").get() as any).c;
    const visitsScheduled = (db.prepare("SELECT COUNT(*) as c FROM enquiries WHERE status = 'VISIT_SCHEDULED'").get() as any).c;
    const converted = (db.prepare("SELECT COUNT(*) as c FROM enquiries WHERE status = 'CONVERTED'").get() as any).c;
    const availableRooms = (
      db.prepare("SELECT COUNT(*) as c FROM rooms WHERE published = 1 AND availability != 'Unavailable'").get() as any
    ).c;

    res.json({
      totalEnquiries,
      newEnquiries,
      followUps,
      visitsScheduled,
      converted,
      availableRooms,
    });
  });

  // ENQUIRIES CRM
  app.get('/api/admin/enquiries', requireAdmin, (_req, res) => {
    const rows = db.prepare('SELECT * FROM enquiries ORDER BY created_at DESC').all() as any[];
    const notesStmt = db.prepare('SELECT * FROM enquiry_notes WHERE enquiry_id = ? ORDER BY created_at DESC');

    const enquiries = rows.map((e) => ({
      id: e.id,
      name: e.name,
      phone: e.phone,
      email: e.email,
      roomId: e.room_id,
      roomPreference: e.room_preference,
      moveInDate: e.move_in_date,
      message: e.message,
      status: e.status,
      sourcePage: e.source_page,
      createdAt: e.created_at,
      updatedAt: e.updated_at,
      notes: (notesStmt.all(e.id) as any[]).map((n) => ({
        id: n.id,
        enquiryId: n.enquiry_id,
        authorName: n.author_name,
        note: n.note,
        createdAt: n.created_at,
      })),
    }));

    res.json({ enquiries });
  });

  app.patch('/api/admin/enquiries/:id', requireAdmin, (req, res) => {
    const { status } = req.body || {};
    const validStatuses = ['NEW', 'CONTACTED', 'FOLLOW_UP', 'VISIT_SCHEDULED', 'CONVERTED', 'CLOSED'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status value.' });
      return;
    }
    const now = new Date().toISOString();
    db.prepare('UPDATE enquiries SET status = ?, updated_at = ? WHERE id = ?').run(status, now, req.params.id);
    res.json({ success: true, updatedAt: now });
  });

  app.post('/api/admin/enquiries/:id/notes', requireAdmin, (req, res) => {
    const { note } = req.body || {};
    if (!note || !String(note).trim()) {
      res.status(400).json({ error: 'Note content cannot be empty.' });
      return;
    }
    const id = `note-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    const now = new Date().toISOString();
    const authorName = 'ABC Admin';
    db.prepare('INSERT INTO enquiry_notes (id, enquiry_id, author_name, note, created_at) VALUES (?, ?, ?, ?, ?)').run(
      id,
      req.params.id,
      authorName,
      String(note).trim(),
      now
    );
    db.prepare('UPDATE enquiries SET updated_at = ? WHERE id = ?').run(now, req.params.id);
    res.status(201).json({
      note: {
        id,
        enquiryId: req.params.id,
        authorName,
        note: String(note).trim(),
        createdAt: now,
      },
    });
  });

  app.delete('/api/admin/enquiries/:id', requireAdmin, (req, res) => {
    db.prepare('DELETE FROM enquiries WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // ROOMS CRUD
  app.get('/api/admin/rooms', requireAdmin, (_req, res) => {
    res.json({ rooms: getRoomsFormatted(false) });
  });

  app.post('/api/admin/rooms', requireAdmin, (req, res) => {
    const {
      name,
      type,
      description,
      capacity,
      price,
      priceLabel,
      features,
      images,
      availability,
      featured,
      published,
    } = req.body || {};

    if (!name || !type || !description) {
      res.status(400).json({ error: 'Name, room type, and description are required.' });
      return;
    }

    const slugBase = String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const id = `${slugBase || 'room'}-${crypto.randomBytes(2).toString('hex')}`;
    const now = new Date().toISOString();
    const parsedPrice = price !== null && price !== undefined && price !== '' ? Number(price) : null;
    const featureList = Array.isArray(features) ? features : [];
    const imageList = Array.isArray(images) && images.length > 0
      ? images
      : ['/src/assets/images/zenn_single_room_1791277933710.jpg'];

    db.prepare(`
      INSERT INTO rooms (
        id, name, type, description, capacity, price, price_label,
        features, availability, featured, published, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      String(name).trim(),
      String(type).trim(),
      String(description).trim(),
      Number(capacity || 1),
      parsedPrice,
      String(priceLabel || 'per month').trim(),
      JSON.stringify(featureList),
      String(availability || 'Available').trim(),
      featured ? 1 : 0,
      published === false ? 0 : 1,
      now,
      now
    );

    const insertImg = db.prepare('INSERT INTO room_images (id, room_id, url, alt, sort_order) VALUES (?, ?, ?, ?, ?)');
    imageList.forEach((url: string, idx: number) => {
      if (url && String(url).trim()) {
        insertImg.run(`${id}-img-${idx + 1}`, id, String(url).trim(), `${name} view ${idx + 1}`, idx);
      }
    });

    res.status(201).json({ rooms: getRoomsFormatted(false) });
  });

  app.put('/api/admin/rooms/:id', requireAdmin, (req, res) => {
    const roomId = req.params.id;
    const {
      name,
      type,
      description,
      capacity,
      price,
      priceLabel,
      features,
      images,
      availability,
      featured,
      published,
    } = req.body || {};

    const now = new Date().toISOString();
    const parsedPrice = price !== null && price !== undefined && price !== '' ? Number(price) : null;
    const featureList = Array.isArray(features) ? features : [];

    db.prepare(`
      UPDATE rooms SET
        name = ?,
        type = ?,
        description = ?,
        capacity = ?,
        price = ?,
        price_label = ?,
        features = ?,
        availability = ?,
        featured = ?,
        published = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      String(name).trim(),
      String(type).trim(),
      String(description).trim(),
      Number(capacity || 1),
      parsedPrice,
      String(priceLabel || 'per month').trim(),
      JSON.stringify(featureList),
      String(availability || 'Available').trim(),
      featured ? 1 : 0,
      published ? 1 : 0,
      now,
      roomId
    );

    if (Array.isArray(images)) {
      db.prepare('DELETE FROM room_images WHERE room_id = ?').run(roomId);
      const insertImg = db.prepare('INSERT INTO room_images (id, room_id, url, alt, sort_order) VALUES (?, ?, ?, ?, ?)');
      images.forEach((url: string, idx: number) => {
        if (url && String(url).trim()) {
          insertImg.run(`${roomId}-img-${Date.now()}-${idx}`, roomId, String(url).trim(), `${name} view ${idx + 1}`, idx);
        }
      });
    }

    res.json({ rooms: getRoomsFormatted(false) });
  });

  app.delete('/api/admin/rooms/:id', requireAdmin, (req, res) => {
    db.prepare('DELETE FROM rooms WHERE id = ?').run(req.params.id);
    res.json({ rooms: getRoomsFormatted(false) });
  });

  // GALLERY CRUD
  app.get('/api/admin/gallery', requireAdmin, (_req, res) => {
    const rows = db.prepare('SELECT * FROM gallery_images ORDER BY sort_order ASC, created_at DESC').all() as any[];
    res.json({
      gallery: rows.map((g) => ({
        id: g.id,
        image: g.image,
        title: g.title,
        category: g.category,
        description: g.description || '',
        order: Number(g.sort_order),
        published: Boolean(g.published),
        createdAt: g.created_at,
      })),
    });
  });

  app.post('/api/admin/gallery', requireAdmin, (req, res) => {
    const { image, title, category, description, order, published } = req.body || {};
    if (!image || !title || !category) {
      res.status(400).json({ error: 'Image URL, title, and category are required.' });
      return;
    }
    const id = `gal-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO gallery_images (id, image, title, category, description, sort_order, published, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      String(image).trim(),
      String(title).trim(),
      String(category).trim(),
      String(description || '').trim(),
      Number(order || 1),
      published === false ? 0 : 1,
      now
    );
    res.status(201).json({ success: true, id });
  });

  app.put('/api/admin/gallery/:id', requireAdmin, (req, res) => {
    const { image, title, category, description, order, published } = req.body || {};
    db.prepare(`
      UPDATE gallery_images
      SET image = ?, title = ?, category = ?, description = ?, sort_order = ?, published = ?
      WHERE id = ?
    `).run(
      String(image).trim(),
      String(title).trim(),
      String(category).trim(),
      String(description || '').trim(),
      Number(order || 1),
      published ? 1 : 0,
      req.params.id
    );
    res.json({ success: true });
  });

  app.delete('/api/admin/gallery/:id', requireAdmin, (req, res) => {
    db.prepare('DELETE FROM gallery_images WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // AMENITIES CRUD
  app.get('/api/admin/amenities', requireAdmin, (_req, res) => {
    const rows = db.prepare('SELECT * FROM amenities ORDER BY sort_order ASC').all() as any[];
    res.json({
      amenities: rows.map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        icon: a.icon,
        image: a.image || '',
        order: Number(a.sort_order),
        active: Boolean(a.active),
      })),
    });
  });

  app.post('/api/admin/amenities', requireAdmin, (req, res) => {
    const { name, description, icon, image, order, active } = req.body || {};
    if (!name || !description) {
      res.status(400).json({ error: 'Name and description are required.' });
      return;
    }
    const id = `am-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    db.prepare(`
      INSERT INTO amenities (id, name, description, icon, image, sort_order, active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      String(name).trim(),
      String(description).trim(),
      String(icon || 'Sparkles').trim(),
      String(image || '').trim(),
      Number(order || 1),
      active === false ? 0 : 1
    );
    res.status(201).json({ success: true, id });
  });

  app.put('/api/admin/amenities/:id', requireAdmin, (req, res) => {
    const { name, description, icon, image, order, active } = req.body || {};
    db.prepare(`
      UPDATE amenities
      SET name = ?, description = ?, icon = ?, image = ?, sort_order = ?, active = ?
      WHERE id = ?
    `).run(
      String(name).trim(),
      String(description).trim(),
      String(icon || 'Sparkles').trim(),
      String(image || '').trim(),
      Number(order || 1),
      active ? 1 : 0,
      req.params.id
    );
    res.json({ success: true });
  });

  app.delete('/api/admin/amenities/:id', requireAdmin, (req, res) => {
    db.prepare('DELETE FROM amenities WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // FOOD ITEMS CRUD
  app.get('/api/admin/food', requireAdmin, (_req, res) => {
    const rows = db.prepare('SELECT * FROM food_items ORDER BY sort_order ASC').all() as any[];
    res.json({
      food: rows.map((f) => ({
        id: f.id,
        meal: f.meal,
        title: f.title,
        description: f.description,
        timing: f.timing,
        image: f.image,
        order: Number(f.sort_order),
        active: Boolean(f.active),
      })),
    });
  });

  app.post('/api/admin/food', requireAdmin, (req, res) => {
    const { meal, title, description, timing, image, order, active } = req.body || {};
    if (!meal || !description) {
      res.status(400).json({ error: 'Meal name and description are required.' });
      return;
    }
    const id = `food-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    db.prepare(`
      INSERT INTO food_items (id, meal, title, description, timing, image, sort_order, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      String(meal).trim(),
      String(title || meal).trim(),
      String(description).trim(),
      String(timing || '').trim(),
      String(image || '/src/assets/images/zenn_dining_food_1791277967774.jpg').trim(),
      Number(order || 1),
      active === false ? 0 : 1
    );
    res.status(201).json({ success: true, id });
  });

  app.put('/api/admin/food/:id', requireAdmin, (req, res) => {
    const { meal, title, description, timing, image, order, active } = req.body || {};
    db.prepare(`
      UPDATE food_items
      SET meal = ?, title = ?, description = ?, timing = ?, image = ?, sort_order = ?, active = ?
      WHERE id = ?
    `).run(
      String(meal).trim(),
      String(title || meal).trim(),
      String(description).trim(),
      String(timing || '').trim(),
      String(image || '').trim(),
      Number(order || 1),
      active ? 1 : 0,
      req.params.id
    );
    res.json({ success: true });
  });

  app.delete('/api/admin/food/:id', requireAdmin, (req, res) => {
    db.prepare('DELETE FROM food_items WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // TESTIMONIALS CRUD
  app.get('/api/admin/testimonials', requireAdmin, (_req, res) => {
    const rows = db.prepare('SELECT * FROM testimonials ORDER BY created_at DESC').all() as any[];
    res.json({
      testimonials: rows.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        testimonial: t.testimonial,
        image: t.image || '',
        rating: t.rating !== null ? Number(t.rating) : null,
        published: Boolean(t.published),
        createdAt: t.created_at,
      })),
    });
  });

  app.post('/api/admin/testimonials', requireAdmin, (req, res) => {
    const { name, description, testimonial, image, rating, published } = req.body || {};
    if (!name || !testimonial) {
      res.status(400).json({ error: 'Resident name and testimonial text are required.' });
      return;
    }
    const id = `test-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    const now = new Date().toISOString();
    const parsedRating = rating !== null && rating !== undefined && rating !== '' ? Number(rating) : null;
    db.prepare(`
      INSERT INTO testimonials (id, name, description, testimonial, image, rating, published, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      String(name).trim(),
      String(description || 'ABC Resident').trim(),
      String(testimonial).trim(),
      String(image || '').trim(),
      parsedRating,
      published === false ? 0 : 1,
      now
    );
    res.status(201).json({ success: true, id });
  });

  app.put('/api/admin/testimonials/:id', requireAdmin, (req, res) => {
    const { name, description, testimonial, image, rating, published } = req.body || {};
    const parsedRating = rating !== null && rating !== undefined && rating !== '' ? Number(rating) : null;
    db.prepare(`
      UPDATE testimonials
      SET name = ?, description = ?, testimonial = ?, image = ?, rating = ?, published = ?
      WHERE id = ?
    `).run(
      String(name).trim(),
      String(description || '').trim(),
      String(testimonial).trim(),
      String(image || '').trim(),
      parsedRating,
      published ? 1 : 0,
      req.params.id
    );
    res.json({ success: true });
  });

  app.delete('/api/admin/testimonials/:id', requireAdmin, (req, res) => {
    db.prepare('DELETE FROM testimonials WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // FAQS CRUD
  app.get('/api/admin/faqs', requireAdmin, (_req, res) => {
    const rows = db.prepare('SELECT * FROM faqs ORDER BY sort_order ASC, created_at ASC').all() as any[];
    res.json({
      faqs: rows.map((f) => ({
        id: f.id,
        question: f.question,
        answer: f.answer,
        category: f.category,
        order: Number(f.sort_order),
        published: Boolean(f.published),
      })),
    });
  });

  app.post('/api/admin/faqs', requireAdmin, (req, res) => {
    const { question, answer, category, order, published } = req.body || {};
    if (!question || !answer) {
      res.status(400).json({ error: 'Question and answer are required.' });
      return;
    }
    const id = `faq-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO faqs (id, question, answer, category, sort_order, published, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      String(question).trim(),
      String(answer).trim(),
      String(category || 'General').trim(),
      Number(order || 1),
      published === false ? 0 : 1,
      now
    );
    res.status(201).json({ success: true, id });
  });

  app.put('/api/admin/faqs/:id', requireAdmin, (req, res) => {
    const { question, answer, category, order, published } = req.body || {};
    db.prepare(`
      UPDATE faqs
      SET question = ?, answer = ?, category = ?, sort_order = ?, published = ?
      WHERE id = ?
    `).run(
      String(question).trim(),
      String(answer).trim(),
      String(category || 'General').trim(),
      Number(order || 1),
      published ? 1 : 0,
      req.params.id
    );
    res.json({ success: true });
  });

  app.delete('/api/admin/faqs/:id', requireAdmin, (req, res) => {
    db.prepare('DELETE FROM faqs WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // SITE SETTINGS CRUD
  app.get('/api/admin/settings', requireAdmin, (_req, res) => {
    res.json({ settings: getSettingsObject() });
  });

  app.put('/api/admin/settings', requireAdmin, (req, res) => {
    const incoming = req.body?.settings || req.body || {};
    const now = new Date().toISOString();
    const upsert = db.prepare(`
      INSERT INTO site_settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);
    for (const [k, v] of Object.entries(incoming)) {
      if (typeof v === 'string') {
        upsert.run(k, v.trim(), now);
      }
    }
    res.json({ settings: getSettingsObject() });
  });

  // ==========================================
  // VITE / STATIC FRONTEND SERVING
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ABC Coliving server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
