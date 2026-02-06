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
        // Optimized chunk splitting for better caching and loading
        manualChunks: (id) => {
          // React core - rarely changes, cache long-term
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          // Router - separate chunk for route-based code splitting
          if (id.includes('node_modules/react-router')) {
            return 'router';
          }
          // Supabase client - separate for auth/data operations
          if (id.includes('node_modules/@supabase')) {
            return 'supabase';
          }
          // Animation library
          if (id.includes('node_modules/framer-motion')) {
            return 'framer';
          }
          // Radix UI components - load on demand
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix-ui';
          }
          // Charts - include d3 only, let recharts bundle with its consumers
          // to avoid circular dependency issues with 'S' initialization
          if (id.includes('node_modules/d3-')) {
            return 'd3-utils';
          }
          // Form handling
          if (id.includes('node_modules/react-hook-form') || 
              id.includes('node_modules/@hookform') || 
              id.includes('node_modules/zod')) {
            return 'forms';
          }
          // Date utilities
          if (id.includes('node_modules/date-fns')) {
            return 'date-utils';
          }
          // Lucide icons
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
          // Tanstack query
          if (id.includes('node_modules/@tanstack')) {
            return 'tanstack';
          }
        },
        // Use a stable entry filename so static previews can always load the app
        // without needing the Vite HTML transform (hashed /assets/index-*.js).
        // Chunks/assets keep hashes for caching.
        entryFileNames: 'assets/app.js',
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
