import { z } from 'zod';
import { safeValidateArray, safeValidate } from './schemas';

interface ApiOptions {
    credentials?: RequestCredentials;
    headers?: HeadersInit;
    method?: string;
    body?: any;
}

const defaultOptions: ApiOptions = {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
};

// Helper to extract array from paginated response
function extractArrayFromResponse(data: unknown): unknown[] {
    // If it's already an array, return it
    if (Array.isArray(data)) {
        return data;
    }

    // If it's a paginated DRF-style response { count, results, next, previous }
    if (data && typeof data === 'object' && 'results' in data && Array.isArray((data as any).results)) {
        return (data as any).results;
    }

    // If it's a FastAPI paginated response { items, total, page, size }
    if (data && typeof data === 'object' && 'items' in data && Array.isArray((data as any).items)) {
        return (data as any).items;
    }

    // If it's a simple object with data array
    if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as any).data)) {
        return (data as any).data;
    }

    // Unknown format, log and return empty array
    console.warn('Unknown response format, expected array:', data);
    return [];
}

// Generic API fetcher with validation
export async function fetchAndValidate<T>(
    url: string,
    schema: z.ZodSchema<T>,
    options: ApiOptions = defaultOptions
): Promise<T> {
    const response = await fetch(url, {
        ...defaultOptions,
        ...options,
        headers: { ...defaultOptions.headers, ...options.headers }
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const validated = safeValidate(schema, data);

    if (!validated.success) {
        console.error('Validation failed:', validated.error);
        throw new Error(`Invalid data received from ${url}`);
    }

    return validated.data;
}

// Fetch and validate array - handles paginated responses
export async function fetchAndValidateArray<T>(
    url: string,
    schema: z.ZodSchema<T>,
    options: ApiOptions = defaultOptions
): Promise<T[]> {
    const response = await fetch(url, {
        ...defaultOptions,
        ...options,
        headers: { ...defaultOptions.headers, ...options.headers }
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Log for debugging
    console.log(`📡 Response from ${url}:`, {
        type: Array.isArray(data) ? 'array' : 'object',
        keys: !Array.isArray(data) ? Object.keys(data) : null,
        dataSample: !Array.isArray(data) && data.results ? `${data.results.length} items in results` : null
    });

    // Extract the actual array from paginated response
    const arrayData = extractArrayFromResponse(data);

    console.log(`📊 Extracted array with ${arrayData.length} items`);

    const validated = safeValidateArray(schema, arrayData);

    if (!validated.success) {
        console.error('Validation failed:', validated.error);
        throw new Error(`Invalid array data received from ${url}`);
    }

    return validated.data;
}

// POST with validation
export async function postAndValidate<T>(
    url: string,
    schema: z.ZodSchema<T>,
    body: any,
    options: ApiOptions = defaultOptions
): Promise<T> {
    const response = await fetch(url, {
        ...defaultOptions,
        ...options,
        method: 'POST',
        body: JSON.stringify(body),
        headers: { ...defaultOptions.headers, ...options.headers }
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API Error: ${response.status}`);
    }

    const data = await response.json();
    const validated = safeValidate(schema, data);

    if (!validated.success) {
        console.error('Validation failed:', validated.error);
        throw new Error(`Invalid data received from ${url}`);
    }

    return validated.data;
}

// PUT with validation
export async function putAndValidate<T>(
    url: string,
    schema: z.ZodSchema<T>,
    body: any,
    options: ApiOptions = defaultOptions
): Promise<T> {
    const response = await fetch(url, {
        ...defaultOptions,
        ...options,
        method: 'PUT',
        body: JSON.stringify(body),
        headers: { ...defaultOptions.headers, ...options.headers }
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API Error: ${response.status}`);
    }

    const data = await response.json();
    const validated = safeValidate(schema, data);

    if (!validated.success) {
        console.error('Validation failed:', validated.error);
        throw new Error(`Invalid data received from ${url}`);
    }

    return validated.data;
}

// DELETE (no validation needed)
export async function deleteRequest(
    url: string,
    options: ApiOptions = defaultOptions
): Promise<void> {
    const response = await fetch(url, {
        ...defaultOptions,
        ...options,
        method: 'DELETE',
        headers: { ...defaultOptions.headers, ...options.headers }
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API Error: ${response.status}`);
    }
}