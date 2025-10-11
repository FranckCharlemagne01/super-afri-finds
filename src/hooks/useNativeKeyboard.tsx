import { useEffect, useRef, RefObject } from 'react';

/**
 * Hook to handle native keyboard behavior on mobile
 * Prevents UI jumping and maintains focus
 */
export const useNativeKeyboard = (
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement>
) => {
  const scrollPositionRef = useRef(0);
  const isKeyboardOpenRef = useRef(false);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const handleFocus = () => {
      isKeyboardOpenRef.current = true;
      scrollPositionRef.current = window.scrollY;
      
      // Prevent viewport zoom on iOS
      input.style.fontSize = '16px';
      
      // Scroll input into view smoothly
      setTimeout(() => {
        input.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 300);
    };

    const handleBlur = () => {
      isKeyboardOpenRef.current = false;
      
      // Restore original font size
      input.style.fontSize = '';
      
      // Restore scroll position on Android
      if (scrollPositionRef.current > 0) {
        window.scrollTo({
          top: scrollPositionRef.current,
          behavior: 'smooth'
        });
      }
    };

    // Handle resize events (keyboard open/close)
    const handleResize = () => {
      if (isKeyboardOpenRef.current && document.activeElement === input) {
        // Keep input visible when keyboard appears
        setTimeout(() => {
          input.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }, 100);
      }
    };

    input.addEventListener('focus', handleFocus);
    input.addEventListener('blur', handleBlur);
    window.addEventListener('resize', handleResize);

    return () => {
      input.removeEventListener('focus', handleFocus);
      input.removeEventListener('blur', handleBlur);
      window.removeEventListener('resize', handleResize);
    };
  }, [inputRef]);
};

/**
 * Hook to fix input zoom on iOS
 */
export const usePreventIOSZoom = (
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement>
) => {
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    // Prevent iOS zoom by setting font-size to 16px minimum
    const originalFontSize = window.getComputedStyle(input).fontSize;
    const fontSize = parseInt(originalFontSize);

    if (fontSize < 16) {
      input.style.fontSize = '16px';
    }

    return () => {
      input.style.fontSize = originalFontSize;
    };
  }, [inputRef]);
};

