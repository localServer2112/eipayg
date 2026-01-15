// Shared types used across multiple API modules

export interface Transaction {
    uuid: string;
    type: 'credit' | 'debit';
    amount: string;
    description: string;
    balance_after: string;
    created_at: string;
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
    commodity: string;
    weight: string;
    check_in: string;
    check_out: string | null;
    estimated_check_out?: string;
    hourly_rate: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface AccountDetails {
    uuid: string;
    balance: string;
    transactions: Transaction[];
    storage_activities: StorageEntry[];
}
