import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SiteLayout } from "./components/layout/SiteLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
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
