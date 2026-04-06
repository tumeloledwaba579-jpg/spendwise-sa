import { z } from 'zod';

// ============================================================
// Helper to transform any value to number (handles string OR number)
// ============================================================
const anyToNumber = z.any()
    .transform((val) => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
            const parsed = parseFloat(val);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    })
    .pipe(z.number());

// Helper for optional any to number
const optionalAnyToNumber = z.any()
    .optional()
    .transform((val) => {
        if (val === undefined || val === null) return undefined;
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
            const parsed = parseFloat(val);
            return isNaN(parsed) ? undefined : parsed;
        }
        return undefined;
    })
    .pipe(z.number().optional());

// Helper for nullable any to number
const nullableAnyToNumber = z.any()
    .nullable()
    .transform((val) => {
        if (val === null) return null;
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
            const parsed = parseFloat(val);
            return isNaN(parsed) ? null : parsed;
        }
        return null;
    })
    .pipe(z.number().nullable());

// Helper for UUID validation
const uuidString = z.string()
    .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid UUID format');

// Helper for enum fields that need case-insensitive handling
const caseInsensitiveEnum = <T extends readonly [string, ...string[]]>(values: T) => {
    return z.string()
        .transform(val => val.toUpperCase())
        .pipe(z.enum(values));
};

// Helper for lowercase enum (for transaction_type)
const lowercaseEnum = <T extends readonly [string, ...string[]]>(values: T) => {
    return z.string()
        .transform(val => val.toLowerCase())
        .pipe(z.enum(values));
};

// Helper for date strings (YYYY-MM-DD)
const dateString = z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .transform((val) => val);

// Helper for datetime strings - Python/PostgreSQL ISO format
const datetimeString = z.string()
    .regex(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/,
        'Invalid datetime format (expected ISO 8601)'
    )
    .transform((val) => val);

const optionalDatetimeString = datetimeString.optional();
const nullableDatetimeString = datetimeString.nullable();

// ============================================================
// ACCOUNT SCHEMAS
// ============================================================
export const AccountSchema = z.object({
    id: uuidString,
    name: z.string().min(1).max(100),
    account_type: caseInsensitiveEnum(['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'LOAN']),
    balance: anyToNumber,  // ✅ Handles both string and number
    currency: z.string().length(3),
    is_active: z.boolean(),
    created_at: optionalDatetimeString,
    updated_at: nullableDatetimeString,
});

export type Account = z.infer<typeof AccountSchema>;

// ============================================================
// TRANSACTION SCHEMAS - FIXED
// ============================================================
export const TransactionSchema = z.object({
    id: uuidString,
    amount: anyToNumber,  // ✅ Handles both string and number
    description: z.string().min(1).max(255),
    transaction_date: datetimeString,
    category_id: uuidString.nullable(),
    account_id: uuidString,
    notes: z.string().nullable().optional(),
    is_recurring: z.boolean(),
    // ✅ Handle transaction_type that might be missing or undefined
    transaction_type: z.any()
        .optional()
        .transform((val) => {
            if (val === undefined || val === null) return 'expense'; // Default to expense
            if (typeof val === 'string') return val.toLowerCase();
            return 'expense';
        })
        .pipe(z.enum(['income', 'expense'])),
    created_at: optionalDatetimeString,
});

export type Transaction = z.infer<typeof TransactionSchema>;

// ============================================================
// INCOME SOURCE SCHEMAS
// ============================================================
export const IncomeSourceSchema = z.object({
    id: uuidString,
    name: z.string().min(1).max(255),
    type: caseInsensitiveEnum(['SALARY', 'FREELANCE', 'INVESTMENT', 'PASSIVE', 'CUSTOM', 'OTHER']),
    frequency: caseInsensitiveEnum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
    amount: anyToNumber,
    is_recurring: z.boolean(),
    is_taxable: z.boolean(),
    is_active: z.boolean(),
    created_at: datetimeString,
    start_date: dateString,
    tax_rate: optionalAnyToNumber,
    notes: z.string().nullable().optional(),
});

// ============================================================
// EXPENSE SCHEMA - Alias for Transaction with type='expense'
// ============================================================
export const ExpenseSchema = TransactionSchema;

export type Expense = z.infer<typeof ExpenseSchema>;

// Optional: More specific expense schema if needed
export const ExpenseStrictSchema = z.object({
    id: uuidString,
    amount: anyToNumber,
    description: z.string().min(1).max(255),
    transaction_date: datetimeString,
    category_id: uuidString.nullable(),
    account_id: uuidString,
    notes: z.string().nullable().optional(),
    is_recurring: z.boolean(),
    transaction_type: z.literal('expense'),  // ✅ Strictly 'expense'
    created_at: optionalDatetimeString,
});

export type ExpenseStrict = z.infer<typeof ExpenseStrictSchema>;

export type IncomeSource = z.infer<typeof IncomeSourceSchema>;

// ============================================================
// INCOME HISTORY SCHEMAS
// ============================================================
export const IncomeHistorySchema = z.object({
    id: uuidString,
    income_source_id: uuidString,
    amount: anyToNumber,
    tax_amount: nullableAnyToNumber,
    received_date: dateString,
    is_manual_entry: z.boolean(),
    created_at: datetimeString,
    notes: z.string().nullable().optional(),
});

export type IncomeHistory = z.infer<typeof IncomeHistorySchema>;

// ============================================================
// INCOME STATS SCHEMA
// ============================================================
export const IncomeStatsSchema = z.object({
    total_annual_income: anyToNumber,
    average_monthly_income: anyToNumber,
    predicted_next_month: anyToNumber,
    total_tax_paid: anyToNumber,
    net_annual_income: anyToNumber,
    recurring_income_count: z.any()
        .transform((val) => {
            if (typeof val === 'number') return val;
            if (typeof val === 'string') {
                const parsed = parseInt(val, 10);
                return isNaN(parsed) ? 0 : parsed;
            }
            return 0;
        })
        .pipe(z.number().int().min(0)),
    one_time_income_count: z.any()
        .transform((val) => {
            if (typeof val === 'number') return val;
            if (typeof val === 'string') {
                const parsed = parseInt(val, 10);
                return isNaN(parsed) ? 0 : parsed;
            }
            return 0;
        })
        .pipe(z.number().int().min(0)),
    top_source_name: z.string(),
    top_source_amount: anyToNumber,
});

export type IncomeStats = z.infer<typeof IncomeStatsSchema>;

// ============================================================
// BUDGET SCHEMAS
// ============================================================
export const BudgetSchema = z.object({
    id: uuidString,
    name: z.string().min(1).max(100),
    amount: anyToNumber,
    currency: z.string().length(3),
    period: caseInsensitiveEnum(['MONTHLY', 'QUARTERLY', 'YEARLY', 'WEEKLY']),
    start_date: datetimeString,
    end_date: datetimeString.nullable(),
    is_active: z.boolean(),
    notifications_enabled: z.boolean(),
    notification_threshold: z.any()
        .transform((val) => {
            if (typeof val === 'number') return val;
            if (typeof val === 'string') {
                const parsed = parseFloat(val);
                return isNaN(parsed) ? 80 : parsed;
            }
            return 80;
        })
        .pipe(z.number().min(0).max(100)),
    created_at: datetimeString,
});

export type Budget = z.infer<typeof BudgetSchema>;

// ============================================================
// CATEGORY SCHEMAS
// ============================================================
export const CategorySchema = z.object({
    id: uuidString,
    name: z.string().min(1),
    category_type: caseInsensitiveEnum(['INCOME', 'EXPENSE', 'TRANSFER']),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    icon: z.string().optional(),
    is_active: z.boolean(),
});

export type Category = z.infer<typeof CategorySchema>;

// ============================================================
// MONTHLY SUMMARY SCHEMA
// ============================================================
export const MonthlySummarySchema = z.object({
    year: z.number().int(),
    month: z.number().int().min(1).max(12),
    total_income: anyToNumber,
    total_tax: anyToNumber,
    net_income: anyToNumber,
    recurring_income: anyToNumber,
    one_time_income: anyToNumber,
});

export type MonthlySummary = z.infer<typeof MonthlySummarySchema>;

// ============================================================
// VALIDATION UTILITIES
// ============================================================

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
    return schema.parse(data);
}

export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: z.ZodError } {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
}

export function validateArray<T>(schema: z.ZodSchema<T>, data: unknown): T[] {
    return z.array(schema).parse(data);
}

export function safeValidateArray<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T[] } | { success: false; error: z.ZodError } {
    const result = z.array(schema).safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
}
