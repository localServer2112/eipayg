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
     * List all users by extracting from cards with full details
     */
    list: async (): Promise<{ data: User[] }> => {
        const response = await cardsApi.list();
        // @ts-ignore
        const cards: Card[] = Array.isArray(response.data) ? response.data : (response.data?.results || []);

        // Get unique card UUIDs to fetch detailed info
        const cardUuids = cards.map(card => card.uuid).filter(Boolean);

        // Fetch detailed info for each card to get user_info and account_details
        const detailedCardsPromises = cardUuids.map(async (uuid) => {
            try {
                const infoResponse = await cardsApi.getInfo({ card_uuid: uuid });
                return infoResponse.data;
            } catch (error) {
                console.error(`Failed to fetch info for card ${uuid}:`, error);
                return null;
            }
        });

        const detailedCards = await Promise.all(detailedCardsPromises);

        // Extract unique users from detailed cards
        const usersMap = new Map<string, User>();

        detailedCards.forEach((cardInfo) => {
            if (!cardInfo) return;

            // Get balance from account_details
            const balance = cardInfo.account_details?.balance || '';

            // Get user from user_info
            if (cardInfo.user_info?.uuid) {
                if (!usersMap.has(cardInfo.user_info.uuid)) {
                    usersMap.set(cardInfo.user_info.uuid, {
                        uuid: cardInfo.user_info.uuid,
                        first_name: cardInfo.user_info.first_name || '',
                        last_name: cardInfo.user_info.last_name || '',
                        phone: cardInfo.user_info.phone || '',
                        address: cardInfo.user_info.address || '',
                        balance: balance,
                        card_uuid: cardInfo.uuid,
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

        // Find card by user_phone (since user_info might not be in list response)
        const card = cards.find(c => c.user_phone === identifier);

        if (card) {
            // Fetch detailed card info to get user_info and account_details
            try {
                const infoResponse = await cardsApi.getInfo({ card_uuid: card.uuid });
                const cardInfo = infoResponse.data;

                if (cardInfo.user_info) {
                    return {
                        data: {
                            uuid: cardInfo.user_info.uuid,
                            first_name: cardInfo.user_info.first_name || '',
                            last_name: cardInfo.user_info.last_name || '',
                            phone: cardInfo.user_info.phone || '',
                            address: cardInfo.user_info.address || '',
                            balance: cardInfo.account_details?.balance || '',
                            card_uuid: cardInfo.uuid,
                        }
                    };
                }
            } catch (error) {
                console.error(`Failed to fetch info for card ${card.uuid}:`, error);
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
