import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Reads a `highlight` (or custom) query param from the URL,
 * returns the ID to highlight, and auto-clears it after a delay.
 * Also provides a CSS class helper for the pulsing effect.
 */
export const useHighlightedItem = (paramName = 'highlight') => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get(paramName);
    if (id) {
      setHighlightedId(id);

      // Remove param from URL without navigation
      const newParams = new URLSearchParams(searchParams);
      newParams.delete(paramName);
      setSearchParams(newParams, { replace: true });

      // Clear highlight after animation
      const timer = setTimeout(() => setHighlightedId(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, paramName, setSearchParams]);

  const isHighlighted = (id: string) => highlightedId === id;

  const highlightClass = (id: string) =>
    highlightedId === id
      ? 'ring-2 ring-primary ring-offset-2 animate-[pulse_1s_ease-in-out_3] bg-primary/5 transition-all duration-500'
      : '';

  return { highlightedId, isHighlighted, highlightClass };
};
