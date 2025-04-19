import apiClient from '../api/apiClient';

export const login = async (credentials: { username: string; password: string }) => {
  const response = await apiClient.post('/auth/login', credentials);
  console.log(response.data.data);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await apiClient.get('/auth/me');
  console.log(response.data);
  return response.data;
};
