import api from './index';
import { UserInfo, CardInfo, StorageEntry, Transaction } from './types';

// Types
export interface Account {
    uuid: string;
    balance: string;
    user_info?: UserInfo;
    card_info?: CardInfo;
    transactions?: Transaction[];
    storage_activities?: StorageEntry[];
    created?: string;
    updated?: string;
}

export interface AccountDetailsPayload {
    account_uuid: string;
}

export interface AccountDetailsResponse {
    uuid: string;
    balance: string;
    user_info: UserInfo;
    card_info: CardInfo;
    transactions: Transaction[];
    storage_activities: StorageEntry[];
}

export interface UpdateAccountPayload {
    balance?: string;
}

// Accounts API functions
export const accountsApi = {
    /**
     * Get account details with all transactions and storage activities
     */
    getDetails: (payload: AccountDetailsPayload) =>
        api.post<AccountDetailsResponse>('/api/accounts/details/', payload),

    /**
     * List all accounts
     */
    list: () =>
        api.get<Account[]>('/api/accounts/'),

    /**
     * Get specific account by ID
     */
    get: (id: number) =>
        api.get<Account>(`/api/accounts/${id}/`),

    /**
     * Update account details
     */
    update: (id: number, payload: UpdateAccountPayload) =>
        api.put<Account>(`/api/accounts/${id}/`, payload),

    /**
     * Delete an account
     */
    delete: (id: number) =>
        api.delete(`/api/accounts/${id}/`),
};

export default accountsApi;
