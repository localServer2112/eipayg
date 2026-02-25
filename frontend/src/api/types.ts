// Shared types used across multiple API modules

export interface Transaction {
    uuid: string;
    account: string;
    transaction_type: 'credit' | 'debit' | 'C' | 'D';
    transaction_type_display?: string;
    amount: string;
    description: string;
    balance_after?: string; // Kept as optional, might be enriched by frontend or separate endpoint
    created: string; // Swagger uses 'created'
}

export interface UserInfo {
    uuid: string;
    first_name: string;
    last_name: string;
    phone: string;
    address: string;
}

export interface CardInfo {
    uuid: string;
    name_on_card: string;
    is_blocked: boolean;
}

export interface StorageEntry {
    uuid: string;
    account: string;
    account_uuid: string;
    account_balance?: string;
    user_name?: string;
    user_phone?: string;
    commodity: string;
    weight: string;
    check_in: string;
    check_out: string | null;
    estimated_check_out: string;
    hourly_rate: string;
    is_active: boolean;
    duration_hours?: number;
    created: string;
    updated: string;
}

export interface AccountDetails {
    uuid: string;
    balance: string;
    transactions: Transaction[];
    storage_activities: StorageEntry[];
}
