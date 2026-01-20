import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SmoothSkeleton } from "@/components/ui/smooth-skeleton";
import { lazy, Suspense, useState, useCallback, useEffect, memo } from "react";
import { SplashScreen } from "@/components/SplashScreen";
import { useInactivityDetector } from "@/hooks/useInactivityDetector";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import { NativeAppProvider } from "@/components/NativeAppProvider";
import { prefetchCriticalRoutes, useAutoPrefetch } from "@/hooks/usePrefetch";
import { AnimatePresence, motion } from "framer-motion";
import PWABottomInstallBar from "@/components/PWABottomInstallBar";

const Verify = lazy(() => import("./pages/Verify"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const AuthWelcome = lazy(() => import("./pages/AuthWelcome"));
const Welcome = lazy(() => import("./pages/Welcome"));
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const SellerDashboard = lazy(() => import("./pages/SellerDashboard"));
const BuyerDashboard = lazy(() => import("./pages/BuyerDashboard"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Favorites = lazy(() => import("./pages/Favorites"));
const FlashSales = lazy(() => import("./pages/FlashSales"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const ShopPage = lazy(() => import("./pages/ShopPage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const LegalNotice = lazy(() => import("./pages/LegalNotice"));
const About = lazy(() => import("./pages/About"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const DemoVideo = lazy(() => import("./pages/DemoVideo"));
const ConfirmEmail = lazy(() => import("./pages/ConfirmEmail"));
const InstallApp = lazy(() => import("./pages/InstallApp"));

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

// Optimized loading fallback - minimal and fast
const PageLoadingFallback = memo(() => (
  <div className="min-h-screen bg-background flex items-center justify-center pb-safe-nav">
    <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
  </div>
));
PageLoadingFallback.displayName = 'PageLoadingFallback';

// Animated routes wrapper for page transitions
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 380, 
          damping: 35,
          mass: 0.8 
        }}
        className="min-h-screen"
      >
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes location={location}>
            <Route path="/" element={<Index />} />
            <Route path="/marketplace" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/welcome" element={<AuthWelcome />} />
            <Route path="/auth/confirm-email" element={<ConfirmEmail />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/verify" element={<Verify />} />
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
            <Route path="/product/:id" element={<ProductDetail />} />
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
            <Route path="/demo" element={<DemoVideo />} />
            <Route path="/install" element={<InstallApp />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NativeAppProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
            <BrowserRouter>
              <AnimatedRoutes />
              <MobileBottomNav />
              <PushNotificationPrompt />
              <PWABottomInstallBar />
            </BrowserRouter>
          </TooltipProvider>
        </NativeAppProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
