import { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSearch } from '@/hooks/useSearch';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { cities } from '@/data/cities';
import { getCommunesByCity } from '@/data/communes';

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
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedCommune, setSelectedCommune] = useState<string>('');
  const [locationOpen, setLocationOpen] = useState(false);
  const { 
    searchTerm, 
    setSearchTerm, 
    suggestions, 
    loading,
    showSuggestions,
    setShowSuggestions,
    setCommuneFilter,
  } = useSearch();

  const availableCommunes = selectedCity ? getCommunesByCity(selectedCity) : [];

  // Sync commune filter with hook
  useEffect(() => {
    setCommuneFilter(selectedCommune);
  }, [selectedCommune, setCommuneFilter]);

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
      const locationQuery = selectedCity ? ` ${selectedCity}` : '';
      const fullQuery = searchTerm + locationQuery;
      if (onSearch) {
        onSearch(fullQuery);
      } else if (showResults) {
        navigate(`/search?q=${encodeURIComponent(fullQuery)}`);
      }
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    if (suggestion.type === 'category') {
      navigate(`/category/${suggestion.id}`);
    } else if (suggestion.type === 'city') {
      const cityName = suggestion.id.replace('city:', '');
      navigate(`/search?q=${encodeURIComponent(cityName)}`);
    } else if (suggestion.type === 'commune') {
      const communeName = suggestion.id.replace('commune:', '');
      navigate(`/search?q=${encodeURIComponent(communeName)}`);
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

  const clearLocation = () => {
    setSelectedCity('');
    setSelectedCommune('');
  };

  const locationLabel = selectedCity
    ? selectedCommune
      ? `${selectedCity} - ${selectedCommune}`
      : selectedCity
    : '';

  return (
    <div ref={searchRef} className={cn("relative flex items-center gap-1.5", className)}>
      {/* Search input */}
      <form onSubmit={handleSubmit} className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
          className="w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-sm bg-background min-h-[44px] transition-all duration-200"
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

      {/* Location picker button */}
      <Popover open={locationOpen} onOpenChange={setLocationOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant={selectedCity ? "default" : "outline"}
            size="sm"
            className={cn(
              "min-h-[44px] shrink-0 gap-1 px-2.5 rounded-lg border-border",
              selectedCity ? "bg-primary text-primary-foreground" : ""
            )}
          >
            <MapPin className="w-4 h-4" />
            {locationLabel ? (
              <span className="text-xs max-w-[100px] truncate hidden sm:inline">{locationLabel}</span>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Filtrer par localisation</p>
            {selectedCity && (
              <Button variant="ghost" size="sm" onClick={clearLocation} className="h-6 px-2 text-xs text-muted-foreground">
                Réinitialiser
              </Button>
            )}
          </div>

          {/* City select */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Ville</label>
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setSelectedCommune('');
              }}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Toutes les villes</option>
              {cities.map((city) => (
                <option key={city.name} value={city.name}>{city.name}</option>
              ))}
            </select>
          </div>

          {/* Commune select */}
          {selectedCity && availableCommunes.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Commune</label>
              <select
                value={selectedCommune}
                onChange={(e) => setSelectedCommune(e.target.value)}
                className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Toutes les communes</option>
                {availableCommunes.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <Button
            size="sm"
            className="w-full"
            onClick={() => {
              setLocationOpen(false);
              if (searchTerm.trim()) {
                const locationQuery = selectedCity ? ` ${selectedCity}` : '';
                const fullQuery = searchTerm + locationQuery;
                if (onSearch) {
                  onSearch(fullQuery);
                } else if (showResults) {
                  navigate(`/search?q=${encodeURIComponent(fullQuery)}`);
                }
              } else if (selectedCity) {
                navigate(`/search?q=${encodeURIComponent(selectedCity)}`);
              }
            }}
          >
            <Search className="w-3.5 h-3.5 mr-1.5" />
            Rechercher
          </Button>
        </PopoverContent>
      </Popover>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-lg shadow-lg mt-1 z-50 max-h-80 overflow-y-auto md:max-h-64 lg:max-h-80">
          <div className="py-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.type}-${suggestion.id}-${index}`}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-3 sm:px-4 py-3 sm:py-2 text-left hover:bg-muted transition-colors flex items-center gap-2 sm:gap-3 min-h-[44px] active:bg-muted-foreground/10"
              >
                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm sm:text-sm font-medium truncate">{suggestion.title}</div>
                  {suggestion.type === 'product' && suggestion.category && (
                    <div className="text-xs text-muted-foreground truncate">
                      dans {suggestion.category}
                    </div>
                  )}
                  {suggestion.type === 'category' && (
                    <div className="text-xs text-muted-foreground">
                      Catégorie
                    </div>
                  )}
                  {suggestion.type === 'city' && (
                    <div className="text-xs text-muted-foreground">
                      📍 Ville
                    </div>
                  )}
                  {suggestion.type === 'commune' && (
                    <div className="text-xs text-muted-foreground">
                      📍 Commune
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
          
          {searchTerm.trim() && (
            <div className="border-t border-border px-3 sm:px-4 py-3 sm:py-2">
              <button
                onClick={() => {
                  if (showResults) {
                    navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
                  } else if (onSearch) {
                    onSearch(searchTerm);
                  }
                  setShowSuggestions(false);
                }}
                className="text-sm text-primary hover:underline active:text-primary-hover min-h-[44px] flex items-center"
              >
                Voir tous les résultats pour "{searchTerm.length > 20 ? searchTerm.substring(0, 20) + '...' : searchTerm}"
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
          className="w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-sm bg-background min-h-[44px] transition-all duration-200"
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
        <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-lg shadow-lg mt-1 z-50 max-h-80 overflow-y-auto md:max-h-64 lg:max-h-80">
          <div className="py-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.type}-${suggestion.id}-${index}`}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-3 sm:px-4 py-3 sm:py-2 text-left hover:bg-muted transition-colors flex items-center gap-2 sm:gap-3 min-h-[44px] active:bg-muted-foreground/10"
              >
                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm sm:text-sm font-medium truncate">{suggestion.title}</div>
                  {suggestion.type === 'product' && suggestion.category && (
                    <div className="text-xs text-muted-foreground truncate">
                      dans {suggestion.category}
                    </div>
                  )}
                  {suggestion.type === 'category' && (
                    <div className="text-xs text-muted-foreground">
                      Catégorie
                    </div>
                  )}
                  {suggestion.type === 'city' && (
                    <div className="text-xs text-muted-foreground">
                      📍 Ville
                    </div>
                  )}
                  {suggestion.type === 'commune' && (
                    <div className="text-xs text-muted-foreground">
                      📍 Commune
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
          
          {searchTerm.trim() && (
            <div className="border-t border-border px-3 sm:px-4 py-3 sm:py-2">
              <button
                onClick={() => {
                  if (showResults) {
                    navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
                  } else if (onSearch) {
                    onSearch(searchTerm);
                  }
                  setShowSuggestions(false);
                }}
                className="text-sm text-primary hover:underline active:text-primary-hover min-h-[44px] flex items-center"
              >
                Voir tous les résultats pour "{searchTerm.length > 20 ? searchTerm.substring(0, 20) + '...' : searchTerm}"
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