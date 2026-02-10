import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // IMPORTANT: Use an absolute base so Vite emits /assets/* URLs.
  // This prevents nested routes like /boutique/... from trying to load
  // assets from /boutique/assets/* (which can be caught by SPA fallbacks
  // on some hosts/CDNs and returned as index.html -> wrong MIME type).
  base: '/',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize chunk size for better caching
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Standard Vite naming – allows both Preview (/src/main.tsx) and
        // Published (dist/assets/*) environments to work correctly.
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Enable minification optimizations
    minify: 'esbuild',
    target: 'es2020',
    // Source maps for production debugging (optional)
    sourcemap: false,
    // CSS code splitting
    cssCodeSplit: true,
    // Reduce bundle size
    reportCompressedSize: false,
  },
  // Optimize deps pre-bundling for faster dev and build
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'framer-motion',
      'lucide-react',
      '@tanstack/react-query',
    ],
    // Include recharts in pre-bundling to avoid initialization errors
    // exclude: [], // No exclusions needed
  },
  // Enable esbuild optimizations
  esbuild: {
    // Remove console.log in production
    drop: mode === 'production' ? ['console', 'debugger'] : [],
    // Minify identifiers
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
  },
}));
