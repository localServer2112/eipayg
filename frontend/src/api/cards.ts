import api from './index';
import { UserInfo, AccountDetails, StorageEntry } from './types';
import { Transaction } from './transactions';

// Types
export interface Card {
    uuid: string;
    name_on_card: string;
    is_blocked: boolean;
    user_info?: UserInfo;
    account_details?: AccountDetails;
    user_phone?: string;
    user_name?: string;
    balance?: string; // Optional, might not be returned in list
    created?: string;
    updated?: string;
}

export interface CreateAndAssignCardPayload {
    name_on_card: string;
    user_phone: string;
    initial_balance: string;
}

export interface CreateAndAssignCardResponse {
    message: string;
    card: Card;
}

export interface AssignCardPayload {
    card_uuid: string;
    user_phone: string;
    initial_balance?: string;
}

export interface TopUpCardPayload {
    card_uuid: string;
    amount: string;
    description?: string;
}

export interface TopUpCardResponse {
    message: string;
    card_uuid: string;
    new_balance: string;
    transaction: Transaction;
}

export interface BlockCardPayload {
    card_uuid: string;
    is_blocked: boolean;
}

export interface CardInfoPayload {
    card_uuid: string;
}

export interface CardInfoResponse {
    uuid: string;
    name_on_card: string;
    is_blocked: boolean;
    user_info: UserInfo;
    account_details: AccountDetails;
}

export interface UpdateCardPayload {
    name_on_card?: string;
}

export interface InitialCardSetupPayload {
    hex_id: string;
}

export interface InitialCardSetupResponse {
    uuid: string;
    hex_id: string;
    message: string;
    code: number;
}

// Re-export shared types for convenience
export type { UserInfo, AccountDetails, StorageEntry };

// Cards API functions
export const cardsApi = {
    /**
     * Initial card setup - registers a raw hex_id from RFID reader.
     * Creates a new unassigned/blocked card if it doesn't exist.
     * Returns the card UUID.
     */
    initialCardSetup: (payload: InitialCardSetupPayload) =>
        api.post<InitialCardSetupResponse>('/api/cards/initial_card_setup/', payload),

    /**
     * Create a new card and assign to user with initial balance
     */
    createAndAssign: (payload: CreateAndAssignCardPayload) =>
        api.post<CreateAndAssignCardResponse>('/api/cards/create_and_assign/', payload),

    /**
     * Assign existing card to a user
     */
    assign: (payload: AssignCardPayload) =>
        api.post('/api/cards/assign/', payload),

    /**
     * Top up card balance
     */
    topUp: (payload: TopUpCardPayload) =>
        api.post<TopUpCardResponse>('/api/cards/topup/', payload),

    /**
     * Block or unblock a card
     */
    block: (payload: BlockCardPayload) =>
        api.post('/api/cards/block/', payload),

    /**
     * Get complete card information including user, account, transactions, storage
     */
    getInfo: (payload: CardInfoPayload) =>
        api.post<CardInfoResponse>('/api/cards/info/', payload),

    /**
     * List all cards
     */
    list: () =>
        api.get<Card[]>('/api/cards/'),

    /**
     * Get specific card by ID
     */
    get: (id: number) =>
        api.get<Card>(`/api/cards/${id}/`),

    /**
     * Update card details
     */
    update: (id: number, payload: UpdateCardPayload) =>
        api.put<Card>(`/api/cards/${id}/`, payload),

    /**
     * Delete a card
     */
    delete: (id: number) =>
        api.delete(`/api/cards/${id}/`),
};

export default cardsApi;
