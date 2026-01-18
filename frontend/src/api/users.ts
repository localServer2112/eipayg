import api from './index';

// Types
export interface User {
    uuid: string;
    first_name: string;
    last_name: string;
    phone: string;
    address: string;
    user_type: 'ADMIN' | 'USER';
    created?: string;
    updated?: string;
}

export interface RegisterUserPayload {
    first_name: string;
    last_name: string;
    phone: string;
    address: string;
    user_type: 'ADMIN' | 'USER';
    password: string;
    password_confirm: string;
}

export interface RegisterUserResponse {
    message: string;
    user: User;
}

// Users API functions
export const usersApi = {
    /**
     * List all users
     */
    list: () =>
        api.get<User[]>('/api/users/'),

    /**
     * Get specific user by UUID
     */
    get: (uuid: string) =>
        api.get<User>(`/api/users/${uuid}/`),

    /**
     * Register a new user (member)
     */
    register: (payload: RegisterUserPayload) =>
        api.post<RegisterUserResponse>('/api/auth/register/', payload),
};

export default usersApi;
