// utils/payload-cleaner.ts

/**
 * Removes empty arrays and null/undefined values from payload
 * Only sends keys that have actual data
 */
export const cleanPayload = (data: any): any => {
    if (!data || typeof data !== 'object') {
        return data
    }

    if (data instanceof FormData) {
        return data
    }

    const cleaned: any = {}

    Object.keys(data).forEach((key) => {
        const value = data[key]

        // Skip null or undefined
        if (value === null || value === undefined) {
            return
        }

        // Skip empty arrays
        if (Array.isArray(value) && value.length === 0) {
            return
        }

        // Skip empty strings (optional - uncomment if needed)
        // if (typeof value === 'string' && value.trim() === '') {
        //     return
        // }

        // Recursively clean nested objects
        if (typeof value === 'object' && !Array.isArray(value)) {
            const cleanedNested = cleanPayload(value)
            if (Object.keys(cleanedNested).length > 0) {
                cleaned[key] = cleanedNested
            }
            return
        }

        // Keep the value
        cleaned[key] = value
    })

    return cleaned
}

/**
 * Removes empty arrays from an object
 * Useful for API payloads where empty arrays cause validation errors
 */
export const removeEmptyArrays = (obj: Record<string, any>): Record<string, any> => {
    const result: Record<string, any> = {}

    Object.keys(obj).forEach((key) => {
        const value = obj[key]

        if (Array.isArray(value)) {
            if (value.length > 0) {
                result[key] = value
            }
        } else {
            result[key] = value
        }
    })

    return result
}
