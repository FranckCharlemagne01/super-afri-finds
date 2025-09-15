import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  type: 'product' | 'category';
  category?: string;
}

export const useSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fonction pour normaliser le text et tolérer les fautes d'orthographe
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[ñ]/g, 'n');
  };

  // Fonction pour calculer la distance de Levenshtein (tolérance aux fautes)
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  };

  // Recherche de produits avec tolérance aux fautes
  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      const normalizedQuery = normalizeText(query);
      const queryWords = normalizedQuery.split(' ').filter(word => word.length > 0);

      const filteredProducts = products?.filter(product => {
        const normalizedTitle = normalizeText(product.title);
        const normalizedDescription = normalizeText(product.description || '');
        const normalizedCategory = normalizeText(product.category);
        
        // Recherche exacte d'abord
        for (const word of queryWords) {
          if (normalizedTitle.includes(word) || 
              normalizedDescription.includes(word) || 
              normalizedCategory.includes(word)) {
            return true;
          }
        }

        // Recherche avec tolérance aux fautes (distance max de 2)
        const titleWords = normalizedTitle.split(' ');
        const descWords = normalizedDescription.split(' ');
        const categoryWords = normalizedCategory.split(' ');
        
        for (const queryWord of queryWords) {
          if (queryWord.length < 3) continue; // Skip très courts mots
          
          const allWords = [...titleWords, ...descWords, ...categoryWords];
          for (const word of allWords) {
            if (word.length >= 3 && levenshteinDistance(queryWord, word) <= 2) {
              return true;
            }
          }
        }

        return false;
      }) || [];

      setSearchResults(filteredProducts);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Génération de suggestions
  const generateSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('id, title, category')
        .eq('is_active', true)
        .limit(10);

      if (error) throw error;

      const normalizedQuery = normalizeText(query);
      const productSuggestions: SearchSuggestion[] = [];
      const categorySuggestions: SearchSuggestion[] = [];

      // Catégories populaires
      const popularCategories = [
        'Téléphones & Tablettes',
        'Électronique',
        'Vêtements & Chaussures', 
        'Maison & Jardin',
        'Beauté & Soins',
        'Alimentation',
        'Automobile'
      ];

      // Suggestions de catégories
      popularCategories.forEach(category => {
        const normalizedCategory = normalizeText(category);
        if (normalizedCategory.includes(normalizedQuery)) {
          categorySuggestions.push({
            id: category.toLowerCase().replace(/\s+/g, '-'),
            title: category,
            type: 'category'
          });
        }
      });

      // Suggestions de produits
      products?.forEach(product => {
        const normalizedTitle = normalizeText(product.title);
        if (normalizedTitle.includes(normalizedQuery) && productSuggestions.length < 5) {
          productSuggestions.push({
            id: product.id,
            title: product.title,
            type: 'product',
            category: product.category
          });
        }
      });

      setSuggestions([...categorySuggestions, ...productSuggestions]);
    } catch (error) {
      console.error('Erreur lors de la génération des suggestions:', error);
      setSuggestions([]);
    }
  };

  // Effect pour recherche automatique
  useEffect(() => {
    if (searchTerm.trim()) {
      const timeoutId = setTimeout(() => {
        searchProducts(searchTerm);
        generateSuggestions(searchTerm);
      }, 300); // Debounce de 300ms

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setSuggestions([]);
    }
  }, [searchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    suggestions,
    loading,
    showSuggestions,
    setShowSuggestions,
    searchProducts,
    generateSuggestions
  };
};