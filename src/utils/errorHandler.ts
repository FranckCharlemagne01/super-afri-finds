interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  backoff?: boolean;
}

// Fonction utilitaire pour retry avec backoff exponentiel
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = true } = options;
  
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Attendre avant le prochain essai
      const waitTime = backoff ? delay * Math.pow(2, attempt) : delay;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${waitTime}ms`);
    }
  }
  
  throw lastError!;
}

// Gestionnaire d'erreur centralisé
export function handleError(error: any, context?: string) {
  const errorMessage = error?.message || 'Unknown error';
  
  console.error(`Error ${context ? `in ${context}` : ''}:`, {
    message: errorMessage,
    details: error,
    timestamp: new Date().toISOString()
  });
  
  // Ne pas spammer l'utilisateur avec des toasts d'erreur
  // Retourner juste l'erreur pour que le composant puisse décider quoi faire
  return {
    message: errorMessage,
    isNetworkError: errorMessage.includes('Failed to fetch') || errorMessage.includes('Network Error'),
    shouldRetry: errorMessage.includes('Failed to fetch') || errorMessage.includes('timeout')
  };
}