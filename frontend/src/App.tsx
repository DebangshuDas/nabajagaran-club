import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SiteLayout } from "./components/layout/SiteLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { AdminModulePlaceholder } from "./pages/admin/AdminModulePlaceholder";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AnnouncementsManagementPage } from "./pages/admin/AnnouncementsManagementPage";
import { ClubProfileManagementPage } from "./pages/admin/ClubProfileManagementPage";
import { EventsManagementPage } from "./pages/admin/EventsManagementPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import DirectoryPage from "./pages/DirectoryPage";
import DurgaPujaPage from "./pages/DurgaPujaPage";
import EventsPage from "./pages/EventsPage";
import GalleryPage from "./pages/GalleryPage";
import HomePage from "./pages/HomePage";
import InitiativesPage from "./pages/InitiativesPage";
import KaliPujaPage from "./pages/KaliPujaPage";
import MembershipPage from "./pages/MembershipPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="events" element={<EventsManagementPage />} />
          <Route path="announcements" element={<AnnouncementsManagementPage />} />
          <Route path="businesses" element={<AdminModulePlaceholder title="Business directory" />} />
          <Route path="membership" element={<AdminModulePlaceholder title="Membership" />} />
          <Route path="volunteers" element={<AdminModulePlaceholder title="Volunteers" />} />
          <Route path="gallery" element={<AdminModulePlaceholder title="Gallery" />} />
          <Route path="sponsors" element={<AdminModulePlaceholder title="Sponsors" />} />
          <Route path="messages" element={<AdminModulePlaceholder title="Contact messages" />} />
          <Route path="club-profile" element={<ClubProfileManagementPage />} />
        </Route>
        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="durga-puja" element={<DurgaPujaPage />} />
          <Route path="kali-puja" element={<KaliPujaPage />} />
          <Route path="initiatives" element={<InitiativesPage />} />
          <Route path="directory" element={<DirectoryPage />} />
          <Route path="gallery" element={<GalleryPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="membership" element={<MembershipPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
