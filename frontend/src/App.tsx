import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { useAuthStore } from '@/stores/auth.store';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { GuestLayout } from '@/layouts/GuestLayout';
import { AdminLayout } from '@/layouts/AdminLayout';

import { HomePage } from '@/pages/public/HomePage';
import { SearchPage } from '@/pages/public/SearchPage';
import { LoginPage } from '@/pages/public/LoginPage';
import { RegisterPage } from '@/pages/public/RegisterPage';
import { ForgotPasswordPage } from '@/pages/public/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/public/ResetPasswordPage';
import { ChangePasswordPage } from '@/pages/customer/ChangePasswordPage';

import { BookingPage } from '@/pages/customer/BookingPage';
import { MyTicketsPage } from '@/pages/customer/MyTicketsPage';
import { PaymentResultPage } from '@/pages/customer/PaymentResultPage';
import { ProfilePage } from '@/pages/customer/ProfilePage';

import { ManageRoutesPage } from '@/pages/staff/ManageRoutesPage';
import { ManageSchedulesPage } from '@/pages/staff/ManageSchedulesPage';
import { ManageTripsPage } from '@/pages/staff/ManageTripsPage';
import { CounterBookingPage } from '@/pages/staff/CounterBookingPage';
import { ManageTicketsPage } from '@/pages/staff/ManageTicketsPage';
import { ShiftReportPage } from '@/pages/staff/ShiftReportPage';

import { DashboardPage } from '@/pages/admin/DashboardPage';
import { ManageBusesPage } from '@/pages/admin/ManageBusesPage';
import { ManageUsersPage } from '@/pages/admin/ManageUsersPage';

const queryClient = new QueryClient();

export default function App() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route element={<GuestLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          {/* Customer routes */}
          <Route element={<GuestLayout />}>
            <Route element={<ProtectedRoute allowedRoles={['Customer', 'Staff', 'Admin']} />}>
              <Route path="/customer/booking/:tripId" element={<BookingPage />} />
              <Route path="/customer/tickets" element={<MyTicketsPage />} />
              <Route path="/customer/payment/result" element={<PaymentResultPage />} />
              <Route path="/customer/change-password" element={<ChangePasswordPage />} />
              <Route path="/customer/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* Staff & Admin routes */}
          <Route element={<ProtectedRoute allowedRoles={['Staff', 'Admin']} />}>
            <Route element={<AdminLayout />}>
              <Route path="/staff/routes" element={<ManageRoutesPage />} />
              <Route path="/staff/schedules" element={<ManageSchedulesPage />} />
              <Route path="/staff/trips" element={<ManageTripsPage />} />
              <Route path="/staff/counter-booking" element={<CounterBookingPage />} />
              <Route path="/staff/tickets" element={<ManageTicketsPage />} />
              <Route path="/staff/shift-report" element={<ShiftReportPage />} />
            </Route>
          </Route>

          {/* Admin-only routes */}
          <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<DashboardPage />} />
              <Route path="/admin/buses" element={<ManageBusesPage />} />
              <Route path="/admin/users" element={<ManageUsersPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
