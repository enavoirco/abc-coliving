import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SiteProvider } from './context/SiteContext';
import { PublicLayout } from './components/PublicLayout';
import {
  HomePage,
  RoomsPage,
  RoomDetailPage,
  AmenitiesPage,
  GalleryPage,
  FoodPage,
  LocationPage,
  ContactPage,
  FaqPage,
  PrivacyPage,
  TermsPage,
} from './pages/PublicPages';
import {
  AdminLoginPage,
  AdminDashboardPage,
  AdminEnquiriesPage,
  AdminRoomsPage,
  AdminGalleryPage,
  AdminAmenitiesPage,
  AdminFoodPage,
  AdminTestimonialsPage,
  AdminFaqPage,
  AdminSettingsPage,
} from './pages/AdminPages';

export default function App() {
  return (
    <SiteProvider>
      <BrowserRouter>
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/enquiries" element={<AdminEnquiriesPage />} />
          <Route path="/admin/rooms" element={<AdminRoomsPage />} />
          <Route path="/admin/gallery" element={<AdminGalleryPage />} />
          <Route path="/admin/amenities" element={<AdminAmenitiesPage />} />
          <Route path="/admin/food" element={<AdminFoodPage />} />
          <Route path="/admin/testimonials" element={<AdminTestimonialsPage />} />
          <Route path="/admin/faq" element={<AdminFaqPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />

          {/* Public Routes wrapped in PublicLayout */}
          <Route
            path="/"
            element={
              <PublicLayout>
                <HomePage />
              </PublicLayout>
            }
          />
          <Route
            path="/rooms"
            element={
              <PublicLayout>
                <RoomsPage />
              </PublicLayout>
            }
          />
          <Route
            path="/rooms/:id"
            element={
              <PublicLayout>
                <RoomDetailPage />
              </PublicLayout>
            }
          />
          <Route
            path="/amenities"
            element={
              <PublicLayout>
                <AmenitiesPage />
              </PublicLayout>
            }
          />
          <Route
            path="/gallery"
            element={
              <PublicLayout>
                <GalleryPage />
              </PublicLayout>
            }
          />
          <Route
            path="/food"
            element={
              <PublicLayout>
                <FoodPage />
              </PublicLayout>
            }
          />
          <Route
            path="/location"
            element={
              <PublicLayout>
                <LocationPage />
              </PublicLayout>
            }
          />
          <Route
            path="/contact"
            element={
              <PublicLayout>
                <ContactPage />
              </PublicLayout>
            }
          />
          <Route
            path="/faq"
            element={
              <PublicLayout>
                <FaqPage />
              </PublicLayout>
            }
          />
          <Route
            path="/privacy"
            element={
              <PublicLayout>
                <PrivacyPage />
              </PublicLayout>
            }
          />
          <Route
            path="/terms"
            element={
              <PublicLayout>
                <TermsPage />
              </PublicLayout>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SiteProvider>
  );
}
