import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useAutoRefreshOnNewVersion } from "@/hooks/useAutoRefreshOnNewVersion";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import BusinessPage from "./pages/BusinessPage";
import ShopPage from "./pages/ShopPage";
import PartnerDashboard from "./pages/PartnerDashboard";
import VipPass from "./pages/VipPass";
import VerifyVip from "./pages/VerifyVip";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";

const queryClient = new QueryClient();

const AppShell = () => {
  useAutoRefreshOnNewVersion();

  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/business" element={<BusinessPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/partner-dashboard" element={<PartnerDashboard />} />
            <Route path="/vip-pass" element={<VipPass />} />
            <Route path="/verify" element={<VerifyVip />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-canceled" element={<PaymentCanceled />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppShell />
  </QueryClientProvider>
);

export default App;
