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
    is_active?: boolean;
    created?: string;
    updated?: string;
    balance?: string;
    card_uuid?: string; // Associated card UUID for navigation
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
     * List all users by extracting from cards
     */
    list: async (): Promise<{ data: User[] }> => {
        const response = await cardsApi.list();
        // @ts-ignore
        const cards: Card[] = Array.isArray(response.data) ? response.data : (response.data?.results || []);

        // Extract unique users from cards
        const usersMap = new Map<string, User>();

        cards.forEach(card => {
            // Try to get user from user_info first
            if (card.user_info?.uuid) {
                if (!usersMap.has(card.user_info.uuid)) {
                    usersMap.set(card.user_info.uuid, {
                        uuid: card.user_info.uuid,
                        first_name: card.user_info.first_name || '',
                        last_name: card.user_info.last_name || '',
                        phone: card.user_info.phone || card.user_phone || '',
                        address: card.user_info.address || '',
                        balance: card.account_details?.balance,
                        card_uuid: card.uuid,
                    });
                }
            }
            // Fallback: use user_phone as identifier if user_info not available
            else if (card.user_phone) {
                if (!usersMap.has(card.user_phone)) {
                    usersMap.set(card.user_phone, {
                        uuid: card.user_phone, // Use phone as UUID fallback
                        first_name: card.user_name?.split(' ')[0] || card.name_on_card?.split(' ')[0] || '',
                        last_name: card.user_name?.split(' ').slice(1).join(' ') || card.name_on_card?.split(' ').slice(1).join(' ') || '',
                        phone: card.user_phone,
                        address: '',
                        balance: card.account_details?.balance || card.balance,
                        card_uuid: card.uuid,
                    });
                }
            }
        });

        return { data: Array.from(usersMap.values()) };
    },

    /**
     * Get specific user by UUID or phone from cards
     */
    get: async (identifier: string): Promise<{ data: User | null }> => {
        const response = await cardsApi.list();
        // @ts-ignore
        const cards: Card[] = Array.isArray(response.data) ? response.data : (response.data?.results || []);

        // Find card by user_info.uuid or user_phone
        const card = cards.find(c =>
            c.user_info?.uuid === identifier ||
            c.user_phone === identifier
        );

        if (card) {
            if (card.user_info) {
                return {
                    data: {
                        uuid: card.user_info.uuid,
                        first_name: card.user_info.first_name || '',
                        last_name: card.user_info.last_name || '',
                        phone: card.user_info.phone || card.user_phone || '',
                        address: card.user_info.address || '',
                        balance: card.account_details?.balance,
                    }
                };
            } else if (card.user_phone) {
                return {
                    data: {
                        uuid: card.user_phone,
                        first_name: card.user_name?.split(' ')[0] || card.name_on_card?.split(' ')[0] || '',
                        last_name: card.user_name?.split(' ').slice(1).join(' ') || card.name_on_card?.split(' ').slice(1).join(' ') || '',
                        phone: card.user_phone,
                        address: '',
                        balance: card.account_details?.balance || card.balance,
                    }
                };
            }
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
