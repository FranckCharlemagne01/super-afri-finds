import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSearch } from '@/hooks/useSearch';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  onSearch?: (term: string) => void;
  showResults?: boolean;
}

export const SearchBar = ({ 
  placeholder = "Rechercher des produits...", 
  className,
  onSearch,
  showResults = true
}: SearchBarProps) => {
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { 
    searchTerm, 
    setSearchTerm, 
    suggestions, 
    loading,
    showSuggestions,
    setShowSuggestions 
  } = useSearch();

  // Fermer les suggestions quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(value.length >= 2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setShowSuggestions(false);
      if (onSearch) {
        onSearch(searchTerm);
      } else if (showResults) {
        navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
      }
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    if (suggestion.type === 'category') {
      navigate(`/category/${suggestion.id}`);
    } else {
      navigate(`/product/${suggestion.id}`);
    }
    setShowSuggestions(false);
    setSearchTerm('');
  };

  const clearSearch = () => {
    setSearchTerm('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
          className="w-full pl-10 pr-12 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-background"
          autoComplete="off"
        />
        {searchTerm && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-lg shadow-lg mt-1 z-50 max-h-80 overflow-y-auto">
          <div className="py-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.type}-${suggestion.id}-${index}`}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-2 text-left hover:bg-muted transition-colors flex items-center gap-3"
              >
                <Search className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{suggestion.title}</div>
                  {suggestion.type === 'product' && suggestion.category && (
                    <div className="text-xs text-muted-foreground">
                      dans {suggestion.category}
                    </div>
                  )}
                  {suggestion.type === 'category' && (
                    <div className="text-xs text-muted-foreground">
                      Catégorie
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
          
          {searchTerm.trim() && (
            <div className="border-t border-border px-4 py-2">
              <button
                onClick={() => {
                  if (showResults) {
                    navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
                  } else if (onSearch) {
                    onSearch(searchTerm);
                  }
                  setShowSuggestions(false);
                }}
                className="text-sm text-primary hover:underline"
              >
                Voir tous les résultats pour "{searchTerm}"
              </button>
            </div>
          )}
        </div>
      )}

      {/* Loading indicator */}
      {loading && showSuggestions && (
        <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-lg shadow-lg mt-1 z-50">
          <div className="px-4 py-3 text-sm text-muted-foreground">
            Recherche en cours...
          </div>
        </div>
      )}
    </div>
  );
};