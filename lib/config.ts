// lib/config.ts

export const CONFIG = {
  // Empty string = use relative paths (proxied by Next.js rewrites)
  apiBase: '',
  
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
  return true; // Always true because we're using rewrites
}
