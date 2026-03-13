import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserLocation } from '@/hooks/useUserLocation';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  seller_id: string;
  original_price?: number;
  discount_percentage?: number;
  rating?: number;
  reviews_count?: number;
  is_flash_sale?: boolean;
  badge?: string;
  video_url?: string;
}

interface SearchSuggestion {
  id: string;
  title: string;
  type: 'product' | 'category' | 'city' | 'commune';
  category?: string;
}

export const useSearch = () => {
  const { location: userLocation } = useUserLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [communeFilter, setCommuneFilter] = useState<string>('');

  // Recherche de produits optimisée avec full-text search PostgreSQL
  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data: products, error } = await supabase.rpc('search_products', {
        search_query: query.trim(),
        user_city: userLocation.city || null,
        user_country: userLocation.country || null
      });

      if (error) throw error;

      let results = products || [];

      // Client-side commune filtering and prioritization
      if (communeFilter) {
        const communeMatches = results.filter((p: any) => 
          p.commune && p.commune.toLowerCase() === communeFilter.toLowerCase()
        );
        const otherResults = results.filter((p: any) => 
          !p.commune || p.commune.toLowerCase() !== communeFilter.toLowerCase()
        );
        results = [...communeMatches, ...otherResults];
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Génération de suggestions intelligentes avec full-text search
  const generateSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const { data: results, error } = await supabase.rpc('search_suggestions', {
        search_query: query.trim(),
        max_results: 10
      });

      if (error) throw error;

      const typedSuggestions: SearchSuggestion[] = (results || []).map(item => ({
        id: item.id,
        title: item.title,
        type: item.type as 'product' | 'category',
        category: item.category
      }));

      setSuggestions(typedSuggestions);
    } catch (error) {
      console.error('Erreur lors de la génération des suggestions:', error);
      setSuggestions([]);
    }
  };

  // Effect pour recherche automatique avec dépendances géographiques
  useEffect(() => {
    if (searchTerm.trim()) {
      const timeoutId = setTimeout(() => {
        searchProducts(searchTerm);
        generateSuggestions(searchTerm);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setSuggestions([]);
    }
  }, [searchTerm, userLocation.city, userLocation.country, communeFilter]);

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    suggestions,
    loading,
    showSuggestions,
    setShowSuggestions,
    searchProducts,
    generateSuggestions,
    communeFilter,
    setCommuneFilter,
  };
};
