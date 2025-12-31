/**
 * PostgREST filter operators
 * Reference: https://postgrest.org/en/v10/api.html#operators
 */

/**
 * PostgREST comparison operators
 */
export type PostgrestOperator =
    | "eq" // Equal to
    | "neq" // Not equal to
    | "gt" // Greater than
    | "gte" // Greater than or equal to
    | "lt" // Less than
    | "lte" // Less than or equal to
    | "like" // Case-sensitive pattern matching (SQL LIKE)
    | "ilike" // Case-insensitive pattern matching (SQL ILIKE)
    | "in" // Matches any value in a list
    | "is" // Checks for exact matches, including NULL
    | "fts" // Full-text search
    | "cs" // Contains (array/JSON)
    | "cd" // Contained by (array/JSON)
    | "ov" // Overlaps (array)
    | "sl" // Strictly left of (range)
    | "sr" // Strictly right of (range)
    | "nxr" // Does not extend to the right of (range)
    | "nxl" // Does not extend to the left of (range)
    | "adj"; // Adjacent to (range)

/**
 * Creates a PostgREST filter value with operator
 * @param operator The PostgREST operator
 * @param value The value to filter by
 * @returns Formatted filter string (e.g., "eq.station", "like.John*")
 */
export function postgrestFilter(
    operator: PostgrestOperator,
    value: string | number | boolean
): string {
    return `${operator}.${value}`;
}

/**
 * Helper functions for common operators
 */
export const PostgrestFilters = {
    eq: (value: string | number | boolean) => postgrestFilter("eq", value),
    neq: (value: string | number | boolean) => postgrestFilter("neq", value),
    gt: (value: string | number | boolean) => postgrestFilter("gt", value),
    gte: (value: string | number | boolean) => postgrestFilter("gte", value),
    lt: (value: string | number | boolean) => postgrestFilter("lt", value),
    lte: (value: string | number | boolean) => postgrestFilter("lte", value),
    like: (value: string) => postgrestFilter("like", value),
    ilike: (value: string) => postgrestFilter("ilike", value),
    in: (values: (string | number | boolean)[]) => postgrestFilter("in", `(${values.join(",")})`),
    is: (value: string | "null" | "true" | "false") => postgrestFilter("is", value),
    fts: (value: string) => postgrestFilter("fts", value),
};

/**
 * Type helper to ensure a string contains a PostgREST operator
 * This enforces that filter values must use operators
 */
export type PostgrestFilterValue<T extends string = string> =
    T extends `${PostgrestOperator}.${infer _}` ? T : never;

/**
 * Type helper for PostgREST query parameters
 * Ensures filter fields use PostgREST operators
 */
export type PostgrestQueryParams<T extends Record<string, unknown>> = {
    [K in keyof T]: T[K] extends string | number | boolean | null | undefined
        ? T[K] extends `${PostgrestOperator}.${infer _}`
            ? T[K] // Already has operator, keep as is
            : T[K] extends number | boolean | null | undefined
              ? T[K] // Allow numbers, booleans, null, undefined for limit, offset, etc.
              : `${PostgrestOperator}.${string}` | T[K] // String must have operator or be non-filter field
        : T[K];
};
