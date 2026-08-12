// src/utils/auth.js
export const getAuthToken = () => localStorage.getItem('marhabaToken');

export const setAuthToken = (token) => {
  localStorage.setItem('marhabaToken', token);
};

export const removeAuthToken = () => {
  localStorage.removeItem('marhabaToken');
  localStorage.removeItem('userType');
  localStorage.removeItem('user');
  localStorage.removeItem('tokenExpiry');
};

export const getUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const authFetch = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (response.status === 401) {
    removeAuthToken();
    window.location.href = '/login';
    return null;
  }
  
  return response;
};