export interface User {
  email: string;
  id: string;
}

const HARDCODED_USER: User = {
  email: 'forecasting@kemppi.com',
  id: 'hardcoded-user'
};

export const userService = {
  getCurrentUser: () => HARDCODED_USER,
  isAuthenticated: () => true
}; 