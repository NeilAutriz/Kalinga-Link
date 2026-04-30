import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import ResourcesPage from './pages/ResourcesPage';
import DonatePage from './pages/DonatePage';
import VolunteerDashboard from './pages/VolunteerDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import ChildMonitoringPage from './pages/ChildMonitoringPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/donate" element={<DonatePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/me" element={<ProfilePage />} />
          <Route path="/dashboard" element={<VolunteerDashboard />} />
        </Route>

        <Route element={<ProtectedRoute roles={['organizer']} />}>
          <Route path="/organizer" element={<OrganizerDashboard />} />
        </Route>

        <Route element={<ProtectedRoute roles={['organizer', 'health']} />}>
          <Route path="/children" element={<ChildMonitoringPage />} />
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
}
