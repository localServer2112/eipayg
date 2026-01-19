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

        // Only process cards that are assigned (have user_phone)
        const assignedCards = cards.filter(card => card.user_phone);

        // Fetch detailed info for assigned cards only
        const detailedCardsPromises = assignedCards.map(async (card) => {
            try {
                const infoResponse = await cardsApi.getInfo({ card_uuid: card.uuid });
                return { card, details: infoResponse.data };
            } catch (error) {
                // Fallback to basic card data if detailed fetch fails
                return { card, details: null };
            }
        });

        const results = await Promise.all(detailedCardsPromises);

        // Extract unique users
        const usersMap = new Map<string, User>();

        results.forEach(({ card, details }) => {
            // Use detailed info if available, otherwise fallback to card data
            if (details?.user_info?.uuid) {
                if (!usersMap.has(details.user_info.uuid)) {
                    usersMap.set(details.user_info.uuid, {
                        uuid: details.user_info.uuid,
                        first_name: details.user_info.first_name || '',
                        last_name: details.user_info.last_name || '',
                        phone: details.user_info.phone || card.user_phone || '',
                        address: details.user_info.address || '',
                        balance: details.account_details?.balance || card.balance || '',
                        card_uuid: card.uuid,
                    });
                }
            } else if (card.user_phone) {
                // Fallback: use card data when detailed info not available
                if (!usersMap.has(card.user_phone)) {
                    usersMap.set(card.user_phone, {
                        uuid: card.user_phone,
                        first_name: card.user_name?.split(' ')[0] || card.name_on_card?.split(' ')[0] || '',
                        last_name: card.user_name?.split(' ').slice(1).join(' ') || card.name_on_card?.split(' ').slice(1).join(' ') || '',
                        phone: card.user_phone,
                        address: '',
                        balance: card.balance || '',
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

        // Find card by user_phone (since user_info might not be in list response)
        const card = cards.find(c => c.user_phone === identifier);

        if (card) {
            // Try to fetch detailed card info
            try {
                const infoResponse = await cardsApi.getInfo({ card_uuid: card.uuid });
                const cardInfo = infoResponse.data;

                if (cardInfo.user_info) {
                    return {
                        data: {
                            uuid: cardInfo.user_info.uuid,
                            first_name: cardInfo.user_info.first_name || '',
                            last_name: cardInfo.user_info.last_name || '',
                            phone: cardInfo.user_info.phone || card.user_phone || '',
                            address: cardInfo.user_info.address || '',
                            balance: cardInfo.account_details?.balance || card.balance || '',
                            card_uuid: card.uuid,
                        }
                    };
                }
            } catch (error) {
                // Fallback to basic card data
            }

            // Fallback: return user from basic card data
            return {
                data: {
                    uuid: card.user_phone || card.uuid,
                    first_name: card.user_name?.split(' ')[0] || card.name_on_card?.split(' ')[0] || '',
                    last_name: card.user_name?.split(' ').slice(1).join(' ') || card.name_on_card?.split(' ').slice(1).join(' ') || '',
                    phone: card.user_phone || '',
                    address: '',
                    balance: card.balance || '',
                    card_uuid: card.uuid,
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
