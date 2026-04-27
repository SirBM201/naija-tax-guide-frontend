// lib/config.ts - This is correct, no changes needed

export const CONFIG = {
  // Use relative path for API calls (they will be proxied by Next.js rewrites)
  apiBase: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  
  // App information
  appName: 'Naija Tax Guide',
  appDescription: 'Guided step-by-step tax filing for PAYE, VAT, and Company Income Tax.',
  
  // Feature flags
  features: {
    enableTaxFiling: true,
    enableCalculator: true,
    enableAIAsk: true,
  },
  
  // Support contact
  supportEmail: 'support@naijataxguides.com',
};

// Helper function to get full API URL
export function getApiUrl(path: string): string {
  const base = CONFIG.apiBase.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

// Helper to check if API is using same domain
export function isSameDomain(): boolean {
  if (typeof window === 'undefined') return false;
  if (!CONFIG.apiBase) return true; // Using relative paths
  try {
    const apiUrl = new URL(CONFIG.apiBase);
    return apiUrl.hostname === window.location.hostname;
  } catch {
    return false;
  }
}
