import api from './index';
import { Transaction } from './types';

// Re-export Transaction for backwards compatibility
export type { Transaction };

export interface TransactionsByCardPayload {
    card_uuid: string;
}

export interface TransactionsByCardResponse {
    card_uuid: string;
    card_name: string;
    total_transactions: number;
    transactions: Transaction[];
}

export interface CreateTransactionPayload {
    card_uuid: string;
    type: 'credit' | 'debit';
    amount: string;
    description?: string;
}

export interface UpdateTransactionPayload {
    description?: string;
}

// Transactions API functions
export const transactionsApi = {
    /**
     * Get all transactions for a specific card
     */
    getByCard: (payload: TransactionsByCardPayload) =>
        api.post<TransactionsByCardResponse>('/api/transactions/by_card/', payload),

    /**
     * List all transactions
     */
    list: () =>
        api.get<Transaction[]>('/api/transactions/'),

    /**
     * Get specific transaction by ID
     */
    get: (id: number) =>
        api.get<Transaction>(`/api/transactions/${id}/`),

    /**
     * Create a new transaction
     */
    create: (payload: CreateTransactionPayload) =>
        api.post<Transaction>('/api/transactions/', payload),

    /**
     * Update a transaction
     */
    update: (id: number, payload: UpdateTransactionPayload) =>
        api.put<Transaction>(`/api/transactions/${id}/`, payload),

    /**
     * Delete a transaction
     */
    delete: (id: number) =>
        api.delete(`/api/transactions/${id}/`),
};

export default transactionsApi;
