const BASE_URL = '/api';

export const api = {
    get: async (endpoint: string, token?: string) => {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (token) headers['Authorization'] = `Token ${token}`;

        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'GET',
            headers,
        });
        return handleResponse(response);
    },

    post: async (endpoint: string, data: any, token?: string) => {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (token) headers['Authorization'] = `Token ${token}`;

        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    // Add put/delete as needed
};

async function handleResponse(response: Response) {
    if (!response.ok) {
        const errorText = await response.text();
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.message || 'API Error');
        } catch (e) {
            throw new Error(response.statusText || 'API Error');
        }
    }
    return response.json();
}
