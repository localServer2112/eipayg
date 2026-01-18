import api from './index';
import { accountsApi, Account } from './accounts';
import { UserInfo } from './types';

// Types - extending UserInfo with additional fields
export interface User extends UserInfo {
    user_type?: 'ADMIN' | 'USER';
    created?: string;
    updated?: string;
    account_uuid?: string;
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
     * List all users by fetching accounts and extracting user info
     */
    list: async (): Promise<{ data: User[] }> => {
        console.log('usersApi.list: Fetching accounts...');
        const response = await accountsApi.list();
        console.log('usersApi.list: Accounts response:', response);
        // @ts-ignore
        const accounts: Account[] = Array.isArray(response.data) ? response.data : (response.data.results || []);
        console.log('usersApi.list: Accounts extracted:', accounts);

        // Extract unique users from accounts
        const usersMap = new Map<string, User>();
        accounts.forEach(account => {
            console.log('usersApi.list: Processing account:', account);
            if (account.user_info && account.user_info.uuid) {
                if (!usersMap.has(account.user_info.uuid)) {
                    usersMap.set(account.user_info.uuid, {
                        ...account.user_info,
                        account_uuid: account.uuid,
                        balance: account.balance,
                    });
                }
            }
        });

        const users = Array.from(usersMap.values());
        console.log('usersApi.list: Users extracted:', users);
        return { data: users };
    },

    /**
     * Get specific user by UUID from accounts
     */
    get: async (uuid: string): Promise<{ data: User | null }> => {
        const response = await accountsApi.list();
        // @ts-ignore
        const accounts: Account[] = Array.isArray(response.data) ? response.data : (response.data.results || []);

        const account = accounts.find(acc => acc.user_info?.uuid === uuid);
        if (account && account.user_info) {
            return {
                data: {
                    ...account.user_info,
                    account_uuid: account.uuid,
                    balance: account.balance,
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
