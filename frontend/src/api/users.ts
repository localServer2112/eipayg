import api from './index';
import { cardsApi, Card } from './cards';

// Types for User
export interface User {
    uuid: string;
    first_name: string;
    last_name: string;
    phone: string;
    address: string;
    user_type?: 'ADMIN' | 'USER';
    created?: string;
    updated?: string;
    balance?: string;
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
     * List all users by fetching cards and extracting user info
     */
    list: async (): Promise<{ data: User[] }> => {
        const response = await cardsApi.list();
        // @ts-ignore
        const cards: Card[] = Array.isArray(response.data) ? response.data : (response.data.results || []);

        // Extract unique users from cards by phone
        const usersMap = new Map<string, User>();
        cards.forEach(card => {
            if (card.user_info && card.user_info.uuid) {
                if (!usersMap.has(card.user_info.uuid)) {
                    usersMap.set(card.user_info.uuid, {
                        uuid: card.user_info.uuid,
                        first_name: card.user_info.first_name,
                        last_name: card.user_info.last_name,
                        phone: card.user_info.phone,
                        address: card.user_info.address,
                        balance: card.account_details?.balance,
                    });
                }
            }
        });

        return { data: Array.from(usersMap.values()) };
    },

    /**
     * Get specific user by UUID from cards
     */
    get: async (uuid: string): Promise<{ data: User | null }> => {
        const response = await cardsApi.list();
        // @ts-ignore
        const cards: Card[] = Array.isArray(response.data) ? response.data : (response.data.results || []);

        const card = cards.find(c => c.user_info?.uuid === uuid);
        if (card && card.user_info) {
            return {
                data: {
                    uuid: card.user_info.uuid,
                    first_name: card.user_info.first_name,
                    last_name: card.user_info.last_name,
                    phone: card.user_info.phone,
                    address: card.user_info.address,
                    balance: card.account_details?.balance,
                }
            };
        }
        return { data: null };
    },

    /**
     * Register a new user (member)
     */
    register: (payload: RegisterUserPayload) =>
        api.post<RegisterUserResponse>('/api/auth/register/', payload),
};

export default usersApi;
