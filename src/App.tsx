import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ThemeProvider } from "next-themes";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SmoothSkeleton } from "@/components/ui/smooth-skeleton";
import { Suspense, useState, useCallback, useEffect, memo } from "react";
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { SplashScreen } from "@/components/SplashScreen";
import { useInactivityDetector } from "@/hooks/useInactivityDetector";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import { NativeAppProvider } from "@/components/NativeAppProvider";
import { prefetchCriticalRoutes, useAutoPrefetch } from "@/hooks/usePrefetch";
import { motion } from "framer-motion";
import PWABottomInstallBar from "@/components/PWABottomInstallBar";
import { ProfileCompletionModal } from "@/components/ProfileCompletionModal";
import { PreviewBrokenBanner } from "@/components/PreviewBrokenBanner";
import { GoogleOnboardingRedirect } from "@/components/GoogleOnboardingRedirect";

const VerifyOtp = lazyWithRetry(() => import("./pages/VerifyOtp"));
const Verify = lazyWithRetry(() => import("./pages/Verify"));
const AuthCallback = lazyWithRetry(() => import("./pages/AuthCallback"));
const AuthWelcome = lazyWithRetry(() => import("./pages/AuthWelcome"));
const CompleteProfile = lazyWithRetry(() => import("./pages/CompleteProfile"));
const Welcome = lazyWithRetry(() => import("./pages/Welcome"));
const Index = lazyWithRetry(() => import("./pages/Index"));
const Auth = lazyWithRetry(() => import("./pages/Auth"));
const SellerDashboard = lazyWithRetry(() => import("./pages/SellerDashboard"));
const BuyerDashboard = lazyWithRetry(() => import("./pages/BuyerDashboard"));
const SuperAdmin = lazyWithRetry(() => import("./pages/SuperAdmin"));
const SuperAdminDashboard = lazyWithRetry(() => import("./pages/SuperAdminDashboard"));
const BusinessDashboard = lazyWithRetry(() => import("./pages/BusinessDashboard"));
const ProductDetail = lazyWithRetry(() => import("./pages/ProductDetail"));
const Cart = lazyWithRetry(() => import("./pages/Cart"));
const Favorites = lazyWithRetry(() => import("./pages/Favorites"));
const FlashSales = lazyWithRetry(() => import("./pages/FlashSales"));
const MyOrders = lazyWithRetry(() => import("./pages/MyOrders"));
const SearchResults = lazyWithRetry(() => import("./pages/SearchResults"));
const ShopPage = lazyWithRetry(() => import("./pages/ShopPage"));
const CategoryPage = lazyWithRetry(() => import("./pages/CategoryPage"));
const LegalNotice = lazyWithRetry(() => import("./pages/LegalNotice"));
const About = lazyWithRetry(() => import("./pages/About"));
const Pricing = lazyWithRetry(() => import("./pages/Pricing"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const MessagesPage = lazyWithRetry(() => import("./pages/MessagesPage"));
const CategoriesPage = lazyWithRetry(() => import("./pages/CategoriesPage"));
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
const DemoVideo = lazyWithRetry(() => import("./pages/DemoVideo"));
const ConfirmEmail = lazyWithRetry(() => import("./pages/ConfirmEmail"));
const InstallApp = lazyWithRetry(() => import("./pages/InstallApp"));
const Diagnostic = lazyWithRetry(() => import("./pages/Diagnostic"));
const PartnerDashboard = lazyWithRetry(() => import("./pages/PartnerDashboard"));
const Livraison = lazyWithRetry(() => import("./pages/Livraison"));
const DriverDashboard = lazyWithRetry(() => import("./pages/DriverDashboard"));
const DriverLogin = lazyWithRetry(() => import("./pages/DriverLogin"));
const Support = lazyWithRetry(() => import("./pages/Support"));

// Optimized QueryClient configuration for better caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh
      gcTime: 1000 * 60 * 30, // 30 minutes - keep in cache
      refetchOnWindowFocus: false, // Don't refetch on tab focus
      refetchOnReconnect: 'always', // Refetch on network reconnect
      retry: 1, // Only 1 retry to fail fast
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
    mutations: {
      retry: 1,
    },
  },
});

// Invisible fallback — keeps background stable while chunk loads (no spinner flash)
const PageLoadingFallback = memo(() => (
  <div className="min-h-screen bg-background" />
));
PageLoadingFallback.displayName = 'PageLoadingFallback';

// Routes wrapper — simple fade-in only (no exit animation to avoid double-flash)
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <div className="flex-1 flex flex-col">
      <Suspense fallback={<PageLoadingFallback />}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="flex-1 flex flex-col"
        >
          <Routes location={location}>
            <Route path="/" element={<Index />} />
            <Route path="/marketplace" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/welcome" element={<AuthWelcome />} />
            <Route path="/auth/complete-profile" element={<CompleteProfile />} />
            <Route path="/auth/confirm-email" element={<ConfirmEmail />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route 
              path="/seller-dashboard" 
              element={
                <ProtectedRoute requiredRole="seller">
                  <SellerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/buyer-dashboard" 
              element={
                <ProtectedRoute requiredRole="buyer">
                  <BuyerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/superadmin" 
              element={
                <ProtectedRoute requiredRole="superadmin">
                  <SuperAdmin />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/super-admin-dashboard" 
              element={
                <ProtectedRoute requiredRole="superadmin">
                  <SuperAdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/business-dashboard" 
              element={
                <ProtectedRoute requiredRole="superadmin">
                  <BusinessDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route 
              path="/partner-dashboard" 
              element={
                <ProtectedRoute>
                  <PartnerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/cart" element={<Cart />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/flash-sales" element={<FlashSales />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/boutique/:slug" element={<ShopPage />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/legal" element={<LegalNotice />} />
            <Route path="/about" element={<About />} />
            <Route path="/tarifs" element={<Pricing />} />
            <Route path="/demo" element={<DemoVideo />} />
            <Route path="/install" element={<InstallApp />} />
            <Route path="/diagnostic" element={<Diagnostic />} />
            <Route path="/livraison" element={
              <ProtectedRoute requiredRole="superadmin">
                <Livraison />
              </ProtectedRoute>
            } />
            <Route path="/driver-login" element={<DriverLogin />} />
            <Route 
              path="/driver-dashboard" 
              element={
                <ProtectedRoute>
                  <DriverDashboard />
                </ProtectedRoute>
              } 
            />
          <Route path="*" element={<NotFound />} />
          </Routes>
        </motion.div>
      </Suspense>
    </div>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Track visitor activity
  useVisitorTracking();
  
  // Auto-prefetch critical routes on mount
  useAutoPrefetch();

  // Prefetch critical routes IMMEDIATELY after splash completes
  useEffect(() => {
    if (!showSplash) {
      // Additional prefetch after splash for guaranteed coverage
      prefetchCriticalRoutes();
      setIsInitialLoad(false);
    }
  }, [showSplash]);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    if (isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [isInitialLoad]);

  const handleInactivity = useCallback(() => {
    setShowSplash(true);
  }, []);

  useInactivityDetector({
    onInactive: handleInactivity,
    timeout: 300000, // 5 minutes
    enabled: !showSplash && !isInitialLoad,
  });

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange={false}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NativeAppProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <PreviewBrokenBanner />
            {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
            <BrowserRouter>
              <AnimatedRoutes />
              <MobileBottomNav />
              <PushNotificationPrompt />
              <PWABottomInstallBar />
              <ProfileCompletionModal />
              <GoogleOnboardingRedirect />
            </BrowserRouter>
          </TooltipProvider>
        </NativeAppProvider>
      </AuthProvider>
    </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
