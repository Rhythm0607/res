import api from './api';

export interface UserResponse {
  id: number;
  email: string;
  full_name: string;
  avatar_url?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export const authService = {
  login: async (email: string, password: string): Promise<TokenResponse> => {
    // FastAPI OAuth2PasswordRequestForm expects form-urlencoded username/password fields
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await api.post<TokenResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  register: async (fullName: string, email: string, password: string): Promise<UserResponse> => {
    const payload = {
      full_name: fullName,
      email: email,
      password: password,
    };
    const response = await api.post<UserResponse>('/auth/register', payload);
    return response.data;
  },

  getMe: async (): Promise<UserResponse> => {
    const response = await api.get<UserResponse>('/auth/me');
    return response.data;
  },

  updateProfile: async (fullName: string, email: string): Promise<UserResponse> => {
    const response = await api.put<UserResponse>('/auth/profile', { full_name: fullName, email });
    return response.data;
  },

  updatePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.put('/auth/password', { current_password: currentPassword, new_password: newPassword });
  },

  uploadAvatar: async (file: File): Promise<UserResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<UserResponse>('/auth/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
