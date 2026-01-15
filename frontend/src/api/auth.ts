import api from './index';

// Types
export interface RegisterPayload {
    first_name: string;
    last_name: string;
    phone: string;
    address: string;
    user_type: 'ADMIN' | 'USER';
    password: string;
    password_confirm: string;
}

export interface RegisterResponse {
    message: string;
    user: UserProfile;
    token: string;
}

export interface LoginPayload {
    phone: string;
    password: string;
}

export interface LoginResponse {
    message: string;
    user: UserProfile;
    token: string;
}

export interface ChangePasswordPayload {
    old_password: string;
    new_password: string;
    new_password_confirm: string;
}

export interface UserProfile {
    uuid: string;
    first_name: string;
    last_name: string;
    phone: string;
    address: string;
    user_type: 'ADMIN' | 'USER';
    created?: string;
    updated?: string;
}

// Auth API functions
export const authApi = {
    /**
     * Register a new admin user
     */
    register: (payload: RegisterPayload) =>
        api.post<RegisterResponse>('/api/auth/register/', payload),

    /**
     * Login and get authentication token
     */
    login: (payload: LoginPayload) =>
        api.post<LoginResponse>('/api/auth/login/', payload),

    /**
     * Logout and invalidate token
     */
    logout: () =>
        api.post('/api/auth/logout/'),

    /**
     * Change password (authenticated users)
     */
    changePassword: (payload: ChangePasswordPayload) =>
        api.put('/api/auth/change-password/', payload),

    /**
     * Get current user's profile
     */
    getProfile: () =>
        api.get<UserProfile>('/api/auth/profile/'),
};

export default authApi;
