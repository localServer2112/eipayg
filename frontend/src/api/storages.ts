import api from './index';
import { StorageEntry } from './types';
import { Transaction } from './transactions';

// Types for requests/responses that aren't shared
export interface CreateStoragePayload {
    account_uuid: string;
    commodity: string;
    weight: string;
    check_in: string;
    estimated_check_out: string;
    hourly_rate: string;
}

export interface CheckoutStoragePayload {
    storage_uuid: string;
    check_out: string;
}

export interface CheckoutStorageResponse {
    message: string;
    storage: StorageEntry;
    duration_hours: number;
    total_cost: string;
    new_balance: string;
    transaction: Transaction;
}

export interface StorageByCardPayload {
    card_uuid: string;
}

export interface ActiveStorageResponse {
    total_active: number;
    storages: StorageEntry[];
}

export interface UpdateStoragePayload {
    commodity?: string;
    weight?: string;
    hourly_rate?: string;
    estimated_check_out?: string;
}

// Re-export StorageEntry for convenience
export type { StorageEntry };

// Storages API functions
export const storagesApi = {
    /**
     * Create a storage entry (check in)
     */
    create: (payload: CreateStoragePayload) =>
        api.post<StorageEntry>('/api/storages/', payload),

    /**
     * Check out from storage - calculates cost, deducts from account
     */
    checkout: (payload: CheckoutStoragePayload) =>
        api.post<CheckoutStorageResponse>('/api/storages/checkout/', payload),

    /**
     * Get storage entries by card UUID
     */
    getByCard: (payload: StorageByCardPayload) =>
        api.post<StorageEntry[]>('/api/storages/by_card/', payload),

    /**
     * Get all active storage entries (not checked out)
     */
    getActive: () =>
        api.get<ActiveStorageResponse>('/api/storages/active/'),

    /**
     * List all storage entries
     */
    list: () =>
        api.get<StorageEntry[]>('/api/storages/'),

    /**
     * Get specific storage entry by ID
     */
    get: (id: number) =>
        api.get<StorageEntry>(`/api/storages/${id}/`),

    /**
     * Update a storage entry
     */
    update: (id: number, payload: UpdateStoragePayload) =>
        api.put<StorageEntry>(`/api/storages/${id}/`, payload),

    /**
     * Delete a storage entry
     */
    delete: (id: number) =>
        api.delete(`/api/storages/${id}/`),
};

export default storagesApi;
