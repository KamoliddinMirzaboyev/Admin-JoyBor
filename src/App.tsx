import React, { Suspense } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from "./components/Layout/Layout";
import { Toaster } from "sonner";
import SEOHead from "./components/SEO/SEOHead";

// Lazy loading komponentlar (bir marta, modul yuklanganda yaratiladi)
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Students = React.lazy(() => import("./pages/Students"));
const Payments = React.lazy(() => import("./pages/Payments"));
const Rooms = React.lazy(() => import("./pages/Rooms"));
const FloorDetail = React.lazy(() => import("./pages/FloorDetail"));
const Attendance = React.lazy(() => import("./pages/Attendance"));
const Applications = React.lazy(() => import("./pages/Applications"));
const ApplicationDetail = React.lazy(() => import("./pages/ApplicationDetail"));
const Staff = React.lazy(() => import("./pages/Staff"));
const StaffProfile = React.lazy(() => import("./pages/StaffProfile"));
const Settings = React.lazy(() => import("./pages/Settings"));
const Notifications = React.lazy(() => import("./pages/Notifications"));
const Profile = React.lazy(() => import("./pages/Profile"));
const StudentProfile = React.lazy(() => import("./pages/StudentProfile"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

// Loading komponenti
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// Har bir sahifani Suspense bilan o'raydi (lazy komponentlar allaqachon yuqorida yaratilgan)
function withSuspense(Component: React.ComponentType) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Component />
    </Suspense>
  );
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 daqiqa staleTime - ma'lumotlar 5 daqiqa davomida "yangi" hisoblanadi
      gcTime: 1000 * 60 * 10, // 10 daqiqa cacheTime (gcTime) - foydalanilmayotgan ma'lumotlar 10 daqiqa xotirada saqlanadi
      retry: (failureCount, error: Error & { response?: { status?: number } }) => {
        if (error?.response?.status === 403 || error?.response?.status === 401) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: true, // Oyna fokusga kelganda ma'lumotlarni yangilash (agar stale bo'lsa)
      refetchOnMount: true, // Komponent mount bo'lganda yangilash (agar stale bo'lsa)
      refetchOnReconnect: true,
    },
  },
});

function RequireAuth() {
  const isAuth = sessionStorage.getItem('isAuth') === 'true';
  return isAuth ? <Outlet /> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SEOHead />
      <Toaster position="top-center" />
      <Routes>
        <Route element={<RequireAuth />}>
          <Route path="/" element={<Layout />}>
            <Route index element={withSuspense(Dashboard)} />
            <Route path="students" element={withSuspense(Students)} />
            <Route path="payments" element={withSuspense(Payments)} />
            <Route path="rooms" element={withSuspense(Rooms)} />
            <Route path="rooms/:floorId" element={withSuspense(FloorDetail)} />
            <Route path="attendance" element={withSuspense(Attendance)} />
            <Route path="applications" element={withSuspense(Applications)} />
            <Route path="applications/:id" element={withSuspense(ApplicationDetail)} />
            <Route path="staff" element={withSuspense(Staff)} />
            <Route path="staff/:id" element={withSuspense(StaffProfile)} />
            <Route path="settings" element={withSuspense(Settings)} />
            <Route path="notifications" element={withSuspense(Notifications)} />
            <Route path="profile" element={withSuspense(Profile)} />
            <Route path="studentprofile/:studentId" element={withSuspense(StudentProfile)} />
            {/* 404 Not Found route */}
            <Route path="*" element={withSuspense(NotFound)} />
          </Route>
        </Route>
      </Routes>
    </QueryClientProvider>
  );
}

export default App;
