import React, { useState, useEffect, useCallback } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  BedDouble,
  Image as ImageIcon,
  Sparkles,
  Utensils,
  MessageSquareQuote,
  HelpCircle,
  Settings as SettingsIcon,
  LogOut,
  ExternalLink,
  Search,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Eye,
} from 'lucide-react';
import { useSite } from '../context/SiteContext';
import {
  Enquiry,
  EnquiryStatus,
  Room,
  GalleryItem,
  Amenity,
  FoodItem,
  Testimonial,
  FAQItem,
  SiteSettings,
  AdminDashboardStats,
} from '../types';
import { ResilientImage } from '../components/ResilientImage';

const PRESET_IMAGES = [
  { label: 'Hero Lounge', url: '/src/assets/images/zenn_hero_living_1791277920156.jpg' },
  { label: 'Single Room', url: '/src/assets/images/zenn_single_room_1791277933710.jpg' },
  { label: 'Double Room', url: '/src/assets/images/zenn_double_room_1791277946759.jpg' },
  { label: 'Triple Room', url: '/src/assets/images/zenn_triple_room_1791277957453.jpg' },
  { label: 'Dining & Meals', url: '/src/assets/images/zenn_dining_food_1791277967774.jpg' },
  { label: 'Study Lounge', url: '/src/assets/images/zenn_study_cowork_1791277978036.jpg' },
];

const ENQUIRY_STATUSES: EnquiryStatus[] = [
  EnquiryStatus.NEW,
  EnquiryStatus.CONTACTED,
  EnquiryStatus.FOLLOW_UP,
  EnquiryStatus.VISIT_SCHEDULED,
  EnquiryStatus.CONVERTED,
  EnquiryStatus.CLOSED,
];

function formatDateShort(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ==========================================
// 1. ADMIN LOGIN PAGE (/admin/login)
// ==========================================

export const AdminLoginPage: React.FC = () => {
  const { adminToken, adminUser, authChecking, loginAdmin } = useSite();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@abc.com');
  const [password, setPassword] = useState('abc-admin-password');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!authChecking && adminToken && adminUser) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }
      loginAdmin(data.token, data.user);
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 p-8">
        <div className="mb-6 pb-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#315C4C] font-semibold">
              ABC
            </span>
            <h1 className="text-xl font-semibold text-slate-900 mt-1 font-sans">
              Admin Management Portal
            </h1>
          </div>
          <Link
            to="/"
            className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
          >
            <span>Public Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 p-3 border border-red-300 bg-red-50 text-red-800 text-xs"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-xs font-medium text-slate-700 mb-1.5">
              Admin Email
            </label>
            <input
              id="admin-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[#315C4C]"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-xs font-medium text-slate-700 mb-1.5">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[#315C4C]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-slate-900 text-white py-2.5 px-4 text-xs uppercase tracking-wider font-medium hover:bg-[#315C4C] transition-colors disabled:opacity-50"
          >
            {submitting ? 'Signing In...' : 'Sign In to Admin'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Default: admin@abc.com</span>
          <button
            type="button"
            onClick={() => {
              setEmail('admin@abc.com');
              setPassword('abc-admin-password');
            }}
            className="text-[#315C4C] font-medium hover:underline"
          >
            Fill Default Credentials
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. ADMIN WORKSPACE SHELL & AUTH GUARD
// ==========================================

const ADMIN_NAV_LINKS = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Enquiries CRM', path: '/admin/enquiries', icon: Inbox },
  { label: 'Rooms', path: '/admin/rooms', icon: BedDouble },
  { label: 'Gallery', path: '/admin/gallery', icon: ImageIcon },
  { label: 'Amenities', path: '/admin/amenities', icon: Sparkles },
  { label: 'Food & Meals', path: '/admin/food', icon: Utensils },
  { label: 'Testimonials', path: '/admin/testimonials', icon: MessageSquareQuote },
  { label: 'FAQ', path: '/admin/faq', icon: HelpCircle },
  { label: 'Site Settings', path: '/admin/settings', icon: SettingsIcon },
];

export const AdminLayout: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => {
  const { adminToken, adminUser, authChecking, logoutAdmin } = useSite();
  const location = useLocation();

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-sm text-slate-500">
        Verifying administrator session...
      </div>
    );
  }

  if (!adminToken || !adminUser) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col lg:flex-row font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 shrink-0 flex flex-col justify-between">
        <div>
          <div className="h-14 px-5 border-b border-slate-200 flex items-center justify-between">
            <Link to="/admin" className="font-semibold text-sm tracking-wider text-slate-900">
              ABC ADMIN
            </Link>
            <Link
              to="/"
              className="text-xs text-[#315C4C] hover:underline inline-flex items-center gap-1"
            >
              <span>Live Site</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <nav aria-label="Admin Navigation" className="p-3 flex lg:flex-col gap-1 overflow-x-auto">
            {ADMIN_NAV_LINKS.map((item) => {
              const Icon = item.icon;
              const active =
                item.path === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:block p-4 border-t border-slate-200">
          <div className="text-xs font-medium text-slate-900 truncate">{adminUser.name}</div>
          <div className="text-[11px] text-slate-500 truncate mb-3">{adminUser.email}</div>
          <button
            type="button"
            onClick={logoutAdmin}
            className="w-full inline-flex items-center justify-center gap-2 border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>ABC Admin</span>
            <span>/</span>
            <h1 className="text-sm font-semibold text-slate-900 font-sans">{title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5"
            >
              <span>View Public Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={logoutAdmin}
              className="lg:hidden text-xs text-slate-600 hover:text-slate-900"
            >
              Sign Out
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};

// ==========================================
// 3. ADMIN DASHBOARD PAGE (/admin)
// ==========================================

export const AdminDashboardPage: React.FC = () => {
  const { adminToken } = useSite();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const [statsRes, enqRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${adminToken}` } }),
        fetch('/api/admin/enquiries', { headers: { Authorization: `Bearer ${adminToken}` } }),
      ]);
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (enqRes.ok) {
        const data = await enqRes.json();
        setEnquiries(data.enquiries || []);
      }
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const filteredEnquiries = enquiries.filter((e) => {
    const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      e.name.toLowerCase().includes(q) ||
      e.phone.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.roomPreference.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const statItems = [
    { label: 'Total Enquiries', value: stats?.totalEnquiries ?? 0 },
    { label: 'New Enquiries', value: stats?.newEnquiries ?? 0 },
    { label: 'Follow-ups', value: stats?.followUps ?? 0 },
    { label: 'Visits Scheduled', value: stats?.visitsScheduled ?? 0 },
    { label: 'Converted', value: stats?.converted ?? 0 },
    { label: 'Available Rooms', value: stats?.availableRooms ?? 0 },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-8">
        {/* KPI Metric Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statItems.map((item) => (
            <div key={item.label} className="bg-white border border-slate-200 p-4">
              <div className="text-xs text-slate-500">{item.label}</div>
              <div className="text-2xl font-semibold text-slate-900 font-mono-tabular mt-1">
                {loading ? '—' : item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Enquiries Table with Search & Status Filter */}
        <div className="bg-white border border-slate-200">
          <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 font-sans">
                Recent Enquiries
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Incoming website leads and visit scheduling requests
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  aria-label="Search enquiries"
                  placeholder="Search name, phone, room..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <select
                aria-label="Filter enquiries by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-300 px-3 py-1.5 text-xs text-slate-900 bg-white focus:outline-none focus:border-slate-900"
              >
                <option value="ALL">All Statuses</option>
                {ENQUIRY_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>

              <Link
                to="/admin/enquiries"
                className="bg-slate-900 text-white px-3.5 py-1.5 text-xs font-medium hover:bg-[#315C4C] transition-colors whitespace-nowrap"
              >
                Open Full CRM
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4 font-medium">Name</th>
                  <th className="py-3 px-4 font-medium">Phone</th>
                  <th className="py-3 px-4 font-medium">Room</th>
                  <th className="py-3 px-4 font-medium">Move-in Date</th>
                  <th className="py-3 px-4 font-medium">Date</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Loading enquiries...
                    </td>
                  </tr>
                ) : filteredEnquiries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      No enquiries match the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredEnquiries.slice(0, 12).map((enq) => (
                    <tr key={enq.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-medium text-slate-900">{enq.name}</td>
                      <td className="py-3 px-4 font-mono-tabular text-slate-700">{enq.phone}</td>
                      <td className="py-3 px-4 text-slate-700">{enq.roomPreference}</td>
                      <td className="py-3 px-4 font-mono-tabular text-slate-700">
                        {formatDateShort(enq.moveInDate)}
                      </td>
                      <td className="py-3 px-4 font-mono-tabular text-slate-500">
                        {formatDateShort(enq.createdAt)}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#315C4C]">{enq.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

// ==========================================
// 4. ADMIN ENQUIRY CRM PAGE (/admin/enquiries)
// ==========================================

export const AdminEnquiriesPage: React.FC = () => {
  const { adminToken } = useSite();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const loadEnquiries = useCallback(async () => {
    if (!adminToken) return;
    const res = await fetch('/api/admin/enquiries', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      setEnquiries(data.enquiries || []);
    }
  }, [adminToken]);

  useEffect(() => {
    loadEnquiries();
  }, [loadEnquiries]);

  const selectedEnquiry = enquiries.find((e) => e.id === selectedEnquiryId) || null;

  const handleStatusChange = async (enquiryId: string, newStatus: EnquiryStatus) => {
    if (!adminToken) return;
    const res = await fetch(`/api/admin/enquiries/${enquiryId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setEnquiries((prev) =>
        prev.map((e) => (e.id === enquiryId ? { ...e, status: newStatus } : e))
      );
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !selectedEnquiry || !noteInput.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/admin/enquiries/${selectedEnquiry.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ note: noteInput.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setEnquiries((prev) =>
          prev.map((item) =>
            item.id === selectedEnquiry.id
              ? { ...item, notes: [data.note, ...(item.notes || [])] }
              : item
          )
        );
        setNoteInput('');
      }
    } finally {
      setSavingNote(false);
    }
  };

  const filtered = enquiries.filter((e) => {
    const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      e.name.toLowerCase().includes(q) ||
      e.phone.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.roomPreference.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <AdminLayout title="Enquiries CRM">
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              aria-label="Search enquiries in CRM"
              placeholder="Search by resident name, phone, email, or room type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              aria-label="Filter status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white"
            >
              <option value="ALL">All Statuses ({enquiries.length})</option>
              {ENQUIRY_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Enquiries List Table */}
          <div className="lg:col-span-7 bg-white border border-slate-200 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4 font-medium">Name & Contact</th>
                  <th className="py-3 px-4 font-medium">Room Interest</th>
                  <th className="py-3 px-4 font-medium">Move-in</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No enquiries found. Submit an enquiry on the public website to see it here.
                    </td>
                  </tr>
                ) : (
                  filtered.map((enq) => {
                    const isSelected = selectedEnquiry?.id === enq.id;
                    return (
                      <tr
                        key={enq.id}
                        onClick={() => setSelectedEnquiryId(enq.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-slate-100' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-900">{enq.name}</div>
                          <div className="font-mono-tabular text-slate-500 mt-0.5">{enq.phone}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">{enq.roomPreference}</td>
                        <td className="py-3.5 px-4 font-mono-tabular text-slate-700">
                          {formatDateShort(enq.moveInDate)}
                        </td>
                        <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                          <select
                            aria-label={`Change status for ${enq.name}`}
                            value={enq.status}
                            onChange={(e) =>
                              handleStatusChange(enq.id, e.target.value as EnquiryStatus)
                            }
                            className="border border-slate-300 px-2 py-1 text-xs bg-white text-slate-900"
                          >
                            {ENQUIRY_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedEnquiryId(enq.id)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#315C4C] hover:underline"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Enquiry Detail & Internal Notes Drawer/Panel */}
          <div className="lg:col-span-5 bg-white border border-slate-200 p-6">
            {!selectedEnquiry ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Select an enquiry row from the table to inspect contact details, update status, and record internal CRM notes.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="pb-4 border-b border-slate-200 flex items-start justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-400">
                      ENQUIRY RECORD
                    </span>
                    <h2 className="text-lg font-semibold text-slate-900 font-sans mt-0.5">
                      {selectedEnquiry.name}
                    </h2>
                    <p className="text-xs text-slate-500 font-mono-tabular mt-0.5">
                      Submitted {formatDateShort(selectedEnquiry.createdAt)} · Source:{' '}
                      {selectedEnquiry.sourcePage}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Close enquiry detail"
                    onClick={() => setSelectedEnquiryId(null)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <dl className="grid grid-cols-2 gap-4 text-xs border-b border-slate-200 pb-5">
                  <div>
                    <dt className="text-slate-500">Phone</dt>
                    <dd className="font-mono-tabular font-medium text-slate-900 mt-0.5">
                      <a href={`tel:${selectedEnquiry.phone}`} className="hover:underline">
                        {selectedEnquiry.phone}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Email</dt>
                    <dd className="font-medium text-slate-900 mt-0.5 break-all">
                      <a href={`mailto:${selectedEnquiry.email}`} className="hover:underline">
                        {selectedEnquiry.email}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Room Preference</dt>
                    <dd className="font-medium text-slate-900 mt-0.5">
                      {selectedEnquiry.roomPreference}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Target Move-in Date</dt>
                    <dd className="font-mono-tabular font-medium text-slate-900 mt-0.5">
                      {formatDateShort(selectedEnquiry.moveInDate)}
                    </dd>
                  </div>
                </dl>

                <div>
                  <label
                    htmlFor="detail-status-select"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Lead Status
                  </label>
                  <select
                    id="detail-status-select"
                    value={selectedEnquiry.status}
                    onChange={(e) =>
                      handleStatusChange(selectedEnquiry.id, e.target.value as EnquiryStatus)
                    }
                    className="w-full border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 bg-white"
                  >
                    {ENQUIRY_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedEnquiry.message && (
                  <div className="bg-slate-50 border border-slate-200 p-3.5 text-xs">
                    <div className="text-slate-500 mb-1 font-medium">Enquiry Message:</div>
                    <p className="text-slate-800 leading-relaxed">{selectedEnquiry.message}</p>
                  </div>
                )}

                {/* Internal Notes Stored in Database */}
                <div className="pt-2 border-t border-slate-200 space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 font-sans">
                    Internal CRM Notes ({selectedEnquiry.notes?.length || 0})
                  </h3>

                  <form onSubmit={handleAddNote} className="space-y-2">
                    <textarea
                      rows={2}
                      aria-label="Add internal note"
                      placeholder="Add an internal follow-up note or visit remark..."
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      className="w-full border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                    <button
                      type="submit"
                      disabled={savingNote || !noteInput.trim()}
                      className="bg-slate-900 text-white px-4 py-2 text-xs font-medium hover:bg-[#315C4C] transition-colors disabled:opacity-50"
                    >
                      {savingNote ? 'Saving Note...' : 'Add Internal Note'}
                    </button>
                  </form>

                  <div className="space-y-2.5 max-h-60 overflow-y-auto">
                    {selectedEnquiry.notes && selectedEnquiry.notes.length > 0 ? (
                      selectedEnquiry.notes.map((n) => (
                        <div key={n.id} className="border border-slate-200 bg-slate-50 p-3 text-xs">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                            <span className="font-medium text-slate-700">{n.authorName}</span>
                            <span className="font-mono-tabular">{formatDateShort(n.createdAt)}</span>
                          </div>
                          <p className="text-slate-800">{n.note}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">No internal notes recorded yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

// ==========================================
// 5. ADMIN ROOMS MANAGEMENT (/admin/rooms)
// ==========================================

export const AdminRoomsPage: React.FC = () => {
  const { adminToken, refreshPublicData } = useSite();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [editingRoom, setEditingRoom] = useState<Partial<Room> | null>(null);
  const [featuresText, setFeaturesText] = useState('');
  const [imagesText, setImagesText] = useState('');
  const [saving, setSaving] = useState(false);

  const loadRooms = useCallback(async () => {
    if (!adminToken) return;
    const res = await fetch('/api/admin/rooms', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      setRooms(data.rooms || []);
    }
  }, [adminToken]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const startCreate = () => {
    setEditingRoom({
      name: '',
      type: 'Single Sharing',
      description: '',
      capacity: 1,
      price: null,
      priceLabel: 'per month',
      availability: 'Available',
      featured: true,
      published: true,
    });
    setFeaturesText('Private Occupancy\nDedicated Study Desk\nPersonal Wardrobe\nHigh-Speed Wi-Fi');
    setImagesText('/src/assets/images/zenn_single_room_1791277933710.jpg');
  };

  const startEdit = (room: Room) => {
    setEditingRoom(room);
    setFeaturesText((room.features || []).join('\n'));
    setImagesText((room.images || []).join('\n'));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !editingRoom) return;
    setSaving(true);
    try {
      const payload = {
        ...editingRoom,
        features: featuresText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        images: imagesText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const isExisting = Boolean(editingRoom.id);
      const res = await fetch(
        isExisting ? `/api/admin/rooms/${editingRoom.id}` : '/api/admin/rooms',
        {
          method: isExisting ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify(payload),
        }
      );
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms || []);
        setEditingRoom(null);
        await refreshPublicData();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!adminToken) return;
    const res = await fetch(`/api/admin/rooms/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      setRooms(data.rooms || []);
      await refreshPublicData();
    }
  };

  return (
    <AdminLayout title="Room Management">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 font-sans">
              Rooms & Occupancy Categories
            </h2>
            <p className="text-xs text-slate-500">
              Manage room listings, availability, features, and optional pricing
            </p>
          </div>
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 text-xs font-medium hover:bg-[#315C4C] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Room</span>
          </button>
        </div>

        {editingRoom && (
          <form
            onSubmit={handleSave}
            className="bg-white border border-slate-300 p-6 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-semibold text-slate-900 font-sans">
                {editingRoom.id ? `Edit Room: ${editingRoom.name}` : 'Create New Room'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingRoom(null)}
                className="text-xs text-slate-500 hover:text-slate-900"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Room Name *</label>
                <input
                  type="text"
                  required
                  value={editingRoom.name || ''}
                  onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })}
                  className="w-full border border-slate-300 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Room Type *</label>
                <select
                  value={editingRoom.type || 'Single Sharing'}
                  onChange={(e) => setEditingRoom({ ...editingRoom, type: e.target.value })}
                  className="w-full border border-slate-300 px-3 py-2 text-xs bg-white"
                >
                  <option value="Single Sharing">Single Sharing</option>
                  <option value="Double Sharing">Double Sharing</option>
                  <option value="Triple Sharing">Triple Sharing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Availability Status
                </label>
                <select
                  value={editingRoom.availability || 'Available'}
                  onChange={(e) => setEditingRoom({ ...editingRoom, availability: e.target.value })}
                  className="w-full border border-slate-300 px-3 py-2 text-xs bg-white"
                >
                  <option value="Available">Available</option>
                  <option value="Limited Availability">Limited Availability</option>
                  <option value="Unavailable">Unavailable</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Capacity</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={editingRoom.capacity ?? 1}
                  onChange={(e) =>
                    setEditingRoom({ ...editingRoom, capacity: Number(e.target.value) })
                  }
                  className="w-full border border-slate-300 px-3 py-2 text-xs font-mono-tabular"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Price in ₹ (Leave empty for "Contact for Pricing")
                </label>
                <input
                  type="number"
                  placeholder="Contact for Pricing"
                  value={editingRoom.price ?? ''}
                  onChange={(e) =>
                    setEditingRoom({
                      ...editingRoom,
                      price: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                  className="w-full border border-slate-300 px-3 py-2 text-xs font-mono-tabular"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Price Label</label>
                <input
                  type="text"
                  value={editingRoom.priceLabel || 'per month'}
                  onChange={(e) => setEditingRoom({ ...editingRoom, priceLabel: e.target.value })}
                  className="w-full border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Description *</label>
              <textarea
                rows={3}
                required
                value={editingRoom.description || ''}
                onChange={(e) => setEditingRoom({ ...editingRoom, description: e.target.value })}
                className="w-full border border-slate-300 p-3 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Features (One per line)
                </label>
                <textarea
                  rows={4}
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  className="w-full border border-slate-300 p-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Image URLs (One per line)
                </label>
                <textarea
                  rows={4}
                  value={imagesText}
                  onChange={(e) => setImagesText(e.target.value)}
                  className="w-full border border-slate-300 p-3 text-xs font-mono"
                />
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {PRESET_IMAGES.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() =>
                        setImagesText((prev) => (prev ? `${prev}\n${p.url}` : p.url))
                      }
                      className="text-[11px] border border-slate-300 px-2 py-0.5 text-slate-600 hover:bg-slate-100"
                    >
                      + {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(editingRoom.published)}
                  onChange={(e) => setEditingRoom({ ...editingRoom, published: e.target.checked })}
                />
                <span>Published on public website</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(editingRoom.featured)}
                  onChange={(e) => setEditingRoom({ ...editingRoom, featured: e.target.checked })}
                />
                <span>Featured Room</span>
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-slate-900 text-white px-5 py-2 text-xs font-medium hover:bg-[#315C4C] transition-colors"
              >
                {saving ? 'Saving...' : 'Save Room'}
              </button>
              <button
                type="button"
                onClick={() => setEditingRoom(null)}
                className="border border-slate-300 px-4 py-2 text-xs text-slate-700"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                  <ResilientImage src={room.images?.[0]} alt={room.name} />
                </div>
                <div className="p-5 space-y-2">
                  <div className="text-[11px] uppercase tracking-wider text-slate-500">
                    {room.type} · {room.availability} · {room.published ? 'Published' : 'Draft'}
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 font-sans">{room.name}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2">{room.description}</p>
                  <div className="pt-2 text-xs font-medium text-slate-900 font-mono-tabular">
                    {room.price ? `₹${room.price.toLocaleString('en-IN')} / ${room.priceLabel}` : 'Contact for Pricing'}
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => startEdit(room)}
                  className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 font-medium"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(room.id)}
                  className="inline-flex items-center gap-1 text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

// ==========================================
// 6. ADMIN GALLERY MANAGEMENT (/admin/gallery)
// ==========================================

export const AdminGalleryPage: React.FC = () => {
  const { adminToken, refreshPublicData } = useSite();
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Bedrooms');
  const [image, setImage] = useState(PRESET_IMAGES[0].url);
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState(1);

  const loadGallery = useCallback(async () => {
    if (!adminToken) return;
    const res = await fetch('/api/admin/gallery', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      setGallery(data.gallery || []);
    }
  }, [adminToken]);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !title.trim() || !image.trim()) return;
    const res = await fetch('/api/admin/gallery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: title.trim(),
        category,
        image: image.trim(),
        description: description.trim(),
        order,
        published: true,
      }),
    });
    if (res.ok) {
      setTitle('');
      setDescription('');
      await loadGallery();
      await refreshPublicData();
    }
  };

  const handleTogglePublish = async (item: GalleryItem) => {
    if (!adminToken) return;
    await fetch(`/api/admin/gallery/${item.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ ...item, published: !item.published }),
    });
    await loadGallery();
    await refreshPublicData();
  };

  const handleDelete = async (id: string) => {
    if (!adminToken) return;
    await fetch(`/api/admin/gallery/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    await loadGallery();
    await refreshPublicData();
  };

  return (
    <AdminLayout title="Gallery Management">
      <div className="space-y-8">
        <form onSubmit={handleAdd} className="bg-white border border-slate-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 font-sans">
            Add Photograph to Gallery
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sunlit Study Corner"
                className="w-full border border-slate-300 px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-slate-300 px-3 py-2 text-xs bg-white"
              >
                {[
                  'Bedrooms',
                  'Bathrooms',
                  'Dining',
                  'Common Areas',
                  'Exterior',
                  'Study Spaces',
                  'Amenities',
                  'Other',
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Image URL *</label>
              <input
                type="text"
                required
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="w-full border border-slate-300 px-3 py-2 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Display Order</label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full border border-slate-300 px-3 py-2 text-xs font-mono-tabular"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500">Quick select asset:</span>
            {PRESET_IMAGES.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setImage(p.url)}
                className="border border-slate-300 px-2.5 py-1 text-[11px] hover:bg-slate-100"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Caption / Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional caption shown in lightbox"
              className="w-full border border-slate-300 px-3 py-2 text-xs"
            />
          </div>

          <button
            type="submit"
            className="bg-slate-900 text-white px-5 py-2 text-xs font-medium hover:bg-[#315C4C] transition-colors"
          >
            Add to Gallery
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {gallery.map((g) => (
            <div key={g.id} className="bg-white border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="aspect-[4/3] bg-slate-100">
                  <ResilientImage src={g.image} alt={g.title} />
                </div>
                <div className="p-4">
                  <div className="text-[11px] uppercase tracking-wider text-slate-500">
                    {g.category} · Order #{g.order}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 font-sans mt-0.5">
                    {g.title}
                  </h3>
                  {g.description && (
                    <p className="text-xs text-slate-600 mt-1">{g.description}</p>
                  )}
                </div>
              </div>
              <div className="px-4 py-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => handleTogglePublish(g)}
                  className="text-slate-700 hover:underline font-medium"
                >
                  {g.published ? 'Published (Hide)' : 'Hidden (Publish)'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(g.id)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

// ==========================================
// 7. ADMIN AMENITIES MANAGEMENT (/admin/amenities)
// ==========================================

export const AdminAmenitiesPage: React.FC = () => {
  const { adminToken, refreshPublicData } = useSite();
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Sparkles');
  const [order, setOrder] = useState(13);

  const loadAmenities = useCallback(async () => {
    if (!adminToken) return;
    const res = await fetch('/api/admin/amenities', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      setAmenities(data.amenities || []);
    }
  }, [adminToken]);

  useEffect(() => {
    loadAmenities();
  }, [loadAmenities]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !name.trim() || !description.trim()) return;
    const res = await fetch('/api/admin/amenities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim(),
        icon,
        order,
        active: true,
      }),
    });
    if (res.ok) {
      setName('');
      setDescription('');
      await loadAmenities();
      await refreshPublicData();
    }
  };

  const handleToggleActive = async (item: Amenity) => {
    if (!adminToken) return;
    await fetch(`/api/admin/amenities/${item.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ ...item, active: !item.active }),
    });
    await loadAmenities();
    await refreshPublicData();
  };

  const handleDelete = async (id: string) => {
    if (!adminToken) return;
    await fetch(`/api/admin/amenities/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    await loadAmenities();
    await refreshPublicData();
  };

  return (
    <AdminLayout title="Amenities Management">
      <div className="space-y-8">
        <form onSubmit={handleAdd} className="bg-white border border-slate-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 font-sans">Add Amenity</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Amenity Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-300 px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Icon</label>
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full border border-slate-300 px-3 py-2 text-xs bg-white"
              >
                {[
                  'Wifi',
                  'Sparkles',
                  'ShieldCheck',
                  'Droplets',
                  'WashingMachine',
                  'Zap',
                  'Lock',
                  'BookOpen',
                  'Utensils',
                  'Sofa',
                  'Bike',
                  'Wrench',
                ].map((ic) => (
                  <option key={ic} value={ic}>
                    {ic}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Order</label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full border border-slate-300 px-3 py-2 text-xs font-mono-tabular"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description *</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-slate-300 px-3 py-2 text-xs"
            />
          </div>

          <button
            type="submit"
            className="bg-slate-900 text-white px-5 py-2 text-xs font-medium hover:bg-[#315C4C]"
          >
            Create Amenity
          </button>
        </form>

        <div className="bg-white border border-slate-200 divide-y divide-slate-200">
          {amenities.map((a) => (
            <div key={a.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-slate-900">
                  {a.name}{' '}
                  <span className="text-xs text-slate-400 font-mono-tabular">(#{a.order})</span>
                </div>
                <div className="text-xs text-slate-600 mt-0.5">{a.description}</div>
              </div>
              <div className="flex items-center gap-4 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleActive(a)}
                  className={`font-medium ${a.active ? 'text-[#315C4C]' : 'text-slate-400'}`}
                >
                  {a.active ? 'Active' : 'Disabled'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(a.id)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

// ==========================================
// 8. ADMIN FOOD / MEALS MANAGEMENT (/admin/food)
// ==========================================

export const AdminFoodPage: React.FC = () => {
  const { adminToken, refreshPublicData } = useSite();
  const [food, setFood] = useState<FoodItem[]>([]);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);

  const loadFood = useCallback(async () => {
    if (!adminToken) return;
    const res = await fetch('/api/admin/food', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      setFood(data.food || []);
    }
  }, [adminToken]);

  useEffect(() => {
    loadFood();
  }, [loadFood]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !editingItem) return;
    await fetch(`/api/admin/food/${editingItem.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(editingItem),
    });
    setEditingItem(null);
    await loadFood();
    await refreshPublicData();
  };

  return (
    <AdminLayout title="Food & Meal Management">
      <div className="space-y-6">
        {editingItem && (
          <form onSubmit={handleSave} className="bg-white border border-slate-300 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 font-sans">
              Edit Meal: {editingItem.meal}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Meal Tab</label>
                <input
                  type="text"
                  value={editingItem.meal}
                  onChange={(e) => setEditingItem({ ...editingItem, meal: e.target.value })}
                  className="w-full border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Heading Title</label>
                <input
                  type="text"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Timing Note</label>
                <input
                  type="text"
                  value={editingItem.timing}
                  onChange={(e) => setEditingItem({ ...editingItem, timing: e.target.value })}
                  className="w-full border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={editingItem.description}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                className="w-full border border-slate-300 p-3 text-xs"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="bg-slate-900 text-white px-5 py-2 text-xs font-medium"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="border border-slate-300 px-4 py-2 text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {food.map((f) => (
            <div key={f.id} className="bg-white border border-slate-200 p-5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-wider text-[#315C4C] font-semibold">
                  {f.meal}
                </div>
                <h3 className="text-base font-semibold text-slate-900 font-sans">{f.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{f.description}</p>
                <div className="text-[11px] text-slate-500 pt-1">{f.timing}</div>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-200 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setEditingItem(f)}
                  className="text-slate-900 font-medium hover:underline"
                >
                  Edit Meal Details
                </button>
                <span className="text-slate-400">{f.active ? 'Active' : 'Hidden'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

// ==========================================
// 9. ADMIN TESTIMONIALS MANAGEMENT (/admin/testimonials)
// ==========================================

export const AdminTestimonialsPage: React.FC = () => {
  const { adminToken, refreshPublicData } = useSite();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [testimonialText, setTestimonialText] = useState('');

  const loadTestimonials = useCallback(async () => {
    if (!adminToken) return;
    const res = await fetch('/api/admin/testimonials', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      setTestimonials(data.testimonials || []);
    }
  }, [adminToken]);

  useEffect(() => {
    loadTestimonials();
  }, [loadTestimonials]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !name.trim() || !testimonialText.trim()) return;
    const res = await fetch('/api/admin/testimonials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || 'Verified Resident',
        testimonial: testimonialText.trim(),
        published: true,
      }),
    });
    if (res.ok) {
      setName('');
      setDescription('');
      setTestimonialText('');
      await loadTestimonials();
      await refreshPublicData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!adminToken) return;
    await fetch(`/api/admin/testimonials/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    await loadTestimonials();
    await refreshPublicData();
  };

  return (
    <AdminLayout title="Verified Resident Testimonials">
      <div className="space-y-8">
        <form onSubmit={handleAdd} className="bg-white border border-slate-200 p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 font-sans">
              Add Verified Resident Testimonial
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Testimonials are never auto-generated. Only verified entries added here appear on the public website.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Resident Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rohan Sharma"
                className="w-full border border-slate-300 px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Role / Stay Context
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Single Sharing Resident"
                className="w-full border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Testimonial Quote *
            </label>
            <textarea
              rows={3}
              required
              value={testimonialText}
              onChange={(e) => setTestimonialText(e.target.value)}
              placeholder="Enter the resident's genuine review..."
              className="w-full border border-slate-300 p-3 text-xs"
            />
          </div>

          <button
            type="submit"
            className="bg-slate-900 text-white px-5 py-2 text-xs font-medium hover:bg-[#315C4C]"
          >
            Publish Testimonial
          </button>
        </form>

        <div className="bg-white border border-slate-200 divide-y divide-slate-200">
          {testimonials.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No testimonials published yet. The public website currently displays the honest community message: "Real resident experiences matter."
            </div>
          ) : (
            testimonials.map((t) => (
              <div key={t.id} className="p-5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-slate-900 italic">“{t.testimonial}”</p>
                  <div className="text-xs font-medium text-slate-700">
                    {t.name} · <span className="text-slate-500">{t.description}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(t.id)}
                  className="text-xs text-red-600 hover:underline shrink-0"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

// ==========================================
// 10. ADMIN FAQ MANAGEMENT (/admin/faq)
// ==========================================

export const AdminFaqPage: React.FC = () => {
  const { adminToken, refreshPublicData } = useSite();
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('General');
  const [order, setOrder] = useState(6);

  const loadFaqs = useCallback(async () => {
    if (!adminToken) return;
    const res = await fetch('/api/admin/faqs', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      setFaqs(data.faqs || []);
    }
  }, [adminToken]);

  useEffect(() => {
    loadFaqs();
  }, [loadFaqs]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !question.trim() || !answer.trim()) return;
    const res = await fetch('/api/admin/faqs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        question: question.trim(),
        answer: answer.trim(),
        category: category.trim(),
        order,
        published: true,
      }),
    });
    if (res.ok) {
      setQuestion('');
      setAnswer('');
      await loadFaqs();
      await refreshPublicData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!adminToken) return;
    await fetch(`/api/admin/faqs/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    await loadFaqs();
    await refreshPublicData();
  };

  return (
    <AdminLayout title="FAQ Management">
      <div className="space-y-8">
        <form onSubmit={handleAdd} className="bg-white border border-slate-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 font-sans">Add FAQ Item</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Question *</label>
              <input
                type="text"
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full border border-slate-300 px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-slate-300 px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Order</label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full border border-slate-300 px-3 py-2 text-xs font-mono-tabular"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Answer *</label>
            <textarea
              rows={3}
              required
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full border border-slate-300 p-3 text-xs"
            />
          </div>

          <button
            type="submit"
            className="bg-slate-900 text-white px-5 py-2 text-xs font-medium hover:bg-[#315C4C]"
          >
            Add FAQ
          </button>
        </form>

        <div className="bg-white border border-slate-200 divide-y divide-slate-200">
          {faqs.map((f) => (
            <div key={f.id} className="p-5 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="text-[11px] uppercase tracking-wider text-slate-400">
                  {f.category} · Order #{f.order}
                </div>
                <div className="text-sm font-semibold text-slate-900">{f.question}</div>
                <p className="text-xs text-slate-600 leading-relaxed">{f.answer}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(f.id)}
                className="text-xs text-red-600 hover:underline shrink-0"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

// ==========================================
// 11. ADMIN SITE SETTINGS (/admin/settings)
// ==========================================

export const AdminSettingsPage: React.FC = () => {
  const { adminToken, settings, refreshPublicData } = useSite();
  const [form, setForm] = useState<SiteSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    setSaving(true);
    setSavedToast(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ settings: form }),
      });
      if (res.ok) {
        await refreshPublicData();
        setSavedToast(true);
      }
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: keyof SiteSettings, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <AdminLayout title="Site Settings">
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-6 space-y-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 font-sans">
              Centralized Brand, Contact, Location & SEO Settings
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Empty contact or address fields are gracefully hidden on the public website.
            </p>
          </div>
          {savedToast && (
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#315C4C] bg-emerald-50 px-3 py-1.5 border border-emerald-200">
              <Check className="w-3.5 h-3.5" />
              <span>Settings Saved</span>
            </div>
          )}
        </div>

        {/* Brand & SEO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Brand Name</label>
            <input
              type="text"
              value={form.brandName || ''}
              onChange={(e) => updateField('brandName', e.target.value)}
              className="w-full border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Tagline</label>
            <input
              type="text"
              value={form.tagline || ''}
              onChange={(e) => updateField('tagline', e.target.value)}
              className="w-full border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">SEO Title</label>
            <input
              type="text"
              value={form.seoTitle || ''}
              onChange={(e) => updateField('seoTitle', e.target.value)}
              className="w-full border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">SEO Description</label>
            <input
              type="text"
              value={form.seoDescription || ''}
              onChange={(e) => updateField('seoDescription', e.target.value)}
              className="w-full border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
        </div>

        {/* Contact Details */}
        <div className="pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Phone Number (Enables Call CTA)
            </label>
            <input
              type="text"
              value={form.phone || ''}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="Leave empty to hide Call button"
              className="w-full border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              WhatsApp Number (Enables WhatsApp CTA)
            </label>
            <input
              type="text"
              value={form.whatsapp || ''}
              onChange={(e) => updateField('whatsapp', e.target.value)}
              placeholder="Leave empty to hide WhatsApp button"
              className="w-full border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Official Email</label>
            <input
              type="email"
              value={form.email || ''}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="Leave empty if unconfigured"
              className="w-full border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
        </div>

        {/* Location & Neighbourhood */}
        <div className="pt-4 border-t border-slate-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Property Address
              </label>
              <input
                type="text"
                value={form.address || ''}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="Configure actual property address"
                className="w-full border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Google Maps Directions URL
              </label>
              <input
                type="url"
                value={form.googleMapsUrl || ''}
                onChange={(e) => updateField('googleMapsUrl', e.target.value)}
                placeholder="https://maps.google.com/..."
                className="w-full border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nearby Landmarks
              </label>
              <input
                type="text"
                value={form.nearbyLandmarks || ''}
                onChange={(e) => updateField('nearbyLandmarks', e.target.value)}
                className="w-full border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nearby Workplaces
              </label>
              <input
                type="text"
                value={form.nearbyWorkplaces || ''}
                onChange={(e) => updateField('nearbyWorkplaces', e.target.value)}
                className="w-full border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nearby Colleges
              </label>
              <input
                type="text"
                value={form.nearbyColleges || ''}
                onChange={(e) => updateField('nearbyColleges', e.target.value)}
                className="w-full border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Transport Information
              </label>
              <input
                type="text"
                value={form.transportInfo || ''}
                onChange={(e) => updateField('transportInfo', e.target.value)}
                className="w-full border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={saving}
            className="bg-slate-900 text-white px-6 py-2.5 text-xs uppercase tracking-wider font-medium hover:bg-[#315C4C] transition-colors"
          >
            {saving ? 'Saving Settings...' : 'Save Site Settings'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
};
