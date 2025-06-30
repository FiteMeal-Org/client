// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://fh8mlxkf-3000.asse.devtunnels.ms',
  ENDPOINTS: {
    LOGIN: '/api/login',
    REGISTER: '/api/register',
    PROFILES: '/api/profiles',
    PROFILE_BY_ID: (id: string) => `/api/profiles/${id}`, // Helper function
    UPLOAD: '/api/upload',
    PREP_MEAL: 'api/add-prepmeal',
  },
};

// Helper function to get full URL
export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
