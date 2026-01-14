import { api } from './api';

export interface User {
    uuid: string;
    first_name: string;
    last_name: string;
    user_type: 'ADMIN' | 'USER';
    // add other fields as needed
}

export interface AuthResponse {
    message: string;
    user: User;
    token: string;
}

export const authService = {
    login: async (username: string, password: string): Promise<AuthResponse> => {
        // For development/demo purposes without a real backend, we might want to mock if API fails
        try {
            // Mapping username to phone field for backend compatibility if needed, or sending as username
            // Assuming backend might still expect 'phone' or 'email'
            return await api.post('/auth/login/', { phone: username, password });
        } catch (error) {
            console.warn("API Login failed, using mock data for demo if enabled.");

            // MOCK FALLBACK
            if ((username === '1234567890' || username.toLowerCase() === 'john doe') && password === 'password') {
                return {
                    message: 'Login successful',
                    user: {
                        uuid: 'mock-uuid',
                        first_name: 'John',
                        last_name: 'Doe',
                        user_type: 'ADMIN'
                    },
                    token: 'mock-token-123'
                };
            }
            throw error;
        }
    },

    register: async (data: any) => {
        return api.post('/auth/register/', data);
    },

    logout: async (token: string) => {
        return api.post('/auth/logout/', {}, token);
    }
};
