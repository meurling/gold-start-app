// Weaviate configuration
// Copy this to your .env file and update with your actual values

export const WEAVIATE_CONFIG = {
  // Weaviate REST endpoint
  url: 'yarqfmhuskukffrbfy3sw.c0.europe-west3.gcp.weaviate.cloud',
  
  // Your Weaviate API key (set this in your .env file as VITE_WEAVIATE_API_KEY)
  apiKey: import.meta.env.VITE_WEAVIATE_API_KEY || '',
  
  // Connection scheme
  scheme: 'https' as const,
};

// Environment variables that need to be set in .env file:
/*
VITE_WEAVIATE_URL=yarqfmhuskukffrbfy3sw.c0.europe-west3.gcp.weaviate.cloud
VITE_WEAVIATE_API_KEY=your_weaviate_api_key_here
VITE_OPENAI_API_KEY=your_openai_api_key_here
*/
