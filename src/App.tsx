import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { useAutoRefreshOnNewVersion } from "@/hooks/useAutoRefreshOnNewVersion";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";

// Eagerly loaded (critical path)
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy loaded (non-critical routes)
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const BusinessPage = lazy(() => import("./pages/BusinessPage"));
const ShopPage = lazy(() => import("./pages/ShopPage"));
const PartnerDashboard = lazy(() => import("./pages/PartnerDashboard"));
const VipPass = lazy(() => import("./pages/VipPass"));
const VerifyVip = lazy(() => import("./pages/VerifyVip"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCanceled = lazy(() => import("./pages/PaymentCanceled"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const GoPage = lazy(() => import("./pages/GoPage"));
const DiscoverPage = lazy(() => import("./pages/DiscoverPage"));
const PlacePage = lazy(() => import("./pages/PlacePage"));
const VibePage = lazy(() => import("./pages/VibePage"));
const ReferralPage = lazy(() => import("./pages/ReferralPage"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PosterPage = lazy(() => import("./pages/PosterPage"));
const VenueContextPage = lazy(() => import("./pages/VenueContextPage"));
const VipPassPage = lazy(() => import("./pages/VipPassPage"));
const ScanPage = lazy(() => import("./pages/ScanPage"));
const VenuePage = lazy(() => import("./pages/VenuePage"));
const PartnerInvitePage = lazy(() => import("./pages/PartnerInvitePage"));
const AdminRoute = lazy(() => import("./pages/AdminRoute"));
const DemoPartnerPage = lazy(() => import("./pages/DemoPartnerPage"));
const PlaceDetailPage = lazy(() => import("./pages/PlaceDetailPage"));
const StrategicDemoPage = lazy(() => import("./pages/StrategicDemoPage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const StrategicDemoPage = lazy(() => import("./pages/StrategicDemoPage"));

const queryClient = new QueryClient();

const LazyFallback = () => (
  <div className="h-[100dvh] w-full bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
  </div>
);

const AppShell = () => {
  useAutoRefreshOnNewVersion();

  return (
    <LanguageProvider>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<LazyFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/business" element={<BusinessPage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/partner-dashboard" element={<PartnerDashboard />} />
              <Route path="/vip-pass" element={<VipPass />} />
              <Route path="/verify" element={<VerifyVip />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-canceled" element={<PaymentCanceled />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/go" element={<GoPage />} />
              <Route path="/GO" element={<Navigate to="/go" replace />} />
              <Route path="/discover" element={<DiscoverPage />} />
              <Route path="/place/:id" element={<PlacePage />} />
              <Route path="/vibe/:id" element={<VibePage />} />
              <Route path="/referral" element={<ReferralPage />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/poster" element={<PosterPage />} />
              <Route path="/go/:slug" element={<VenueContextPage />} />
              <Route path="/pass/:id" element={<VipPassPage />} />
              <Route path="/scan" element={<ScanPage />} />
              <Route path="/venue/:slug" element={<VenuePage />} />
              <Route path="/partner-invite/:token" element={<PartnerInvitePage />} />
              <Route path="/admin" element={<AdminRoute />} />
              <Route path="/spot/:slug" element={<PlaceDetailPage />} />
              <Route path="/demo" element={<DemoPartnerPage />} />
              <Route path="/strategic" element={<StrategicDemoPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </LanguageProvider>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
