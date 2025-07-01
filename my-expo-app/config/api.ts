// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://api-fitemeal.vercel.app',
  ENDPOINTS: {
    LOGIN: '/api/login',
    REGISTER: '/api/register',
    PROFILES: '/api/profiles',
    PROFILE_BY_ID: (id: string) => `/api/profiles/${id}`, // Helper function
    UPLOAD: '/api/upload',
    UPLOAD_GET: '/api/upload', // GET endpoint for uploaded meal plans
    PREP_MEAL: '/api/add-prepmeal',
    EXERCISE: '/api/excercise',
  },
};

// Helper function to get full URL
export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
