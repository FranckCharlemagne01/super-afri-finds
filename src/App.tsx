import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SmoothSkeleton } from "@/components/ui/smooth-skeleton";
import { lazy, Suspense } from "react";
import { SplashScreen } from "@/components/SplashScreen";
import { PageTransition } from "@/components/PageTransition";
import { useAppInitialization } from "@/hooks/useAppInitialization";
import { useTouchOptimization } from "@/hooks/useTouchOptimization";

const Verify = lazy(() => import("./pages/Verify"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const AuthWelcome = lazy(() => import("./pages/AuthWelcome"));
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
const NotFound = lazy(() => import("./pages/NotFound"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage").then(m => ({ default: m.CategoriesPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Loading fallback component
const PageLoadingFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <SmoothSkeleton className="w-full max-w-4xl h-96" />
  </div>
);

const AppContent = () => {
  const { isReady, showSplash, handleSplashComplete } = useAppInitialization();
  useTouchOptimization();

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (!isReady) {
    return <PageLoadingFallback />;
  }

  return (
    <>
      <Suspense fallback={<PageLoadingFallback />}>
        <PageTransition>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/welcome" element={<AuthWelcome />} />
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
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
        </PageTransition>
      </Suspense>
      <MobileBottomNav />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
