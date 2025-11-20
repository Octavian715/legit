/**
 * Serializes nested objects and arrays for Laravel FormData submission
 * with support for HTTP Method Spoofing
 *
 * Laravel Method Spoofing:
 * Since browsers don't natively support PATCH/PUT/DELETE with FormData,
 * Laravel uses method spoofing by adding _method field to POST requests.
 */

type FormDataValue = string | number | boolean | File | null | undefined

/**
 * Append a value to FormData with proper handling of different types
 */
const appendValue = (formData: FormData, key: string, value: FormDataValue): void => {
    if (value === null || value === undefined) {
        formData.append(key, '')
        return
    }

    if (value instanceof File) {
        formData.append(key, value)
        return
    }

    if (typeof value === 'boolean') {
        formData.append(key, value ? '1' : '0')
        return
    }

    formData.append(key, String(value))
}

/**
 * Recursively flatten nested objects and arrays for FormData
 */
const flattenObject = (formData: FormData, data: any, parentKey: string = ''): void => {
    if (data === null || data === undefined) {
        if (parentKey) {
            appendValue(formData, parentKey, null)
        }
        return
    }

    if (data instanceof File) {
        appendValue(formData, parentKey, data)
        return
    }

    if (Array.isArray(data)) {
        if (data.length === 0) {
            formData.append(`${parentKey}[]`, '')
            return
        }

        data.forEach((item, index) => {
            const key = `${parentKey}[${index}]`

            if (item === null || item === undefined) {
                appendValue(formData, key, null)
            } else if (typeof item === 'object' && !(item instanceof File)) {
                flattenObject(formData, item, key)
            } else {
                appendValue(formData, key, item)
            }
        })
        return
    }

    if (typeof data === 'object') {
        Object.entries(data).forEach(([key, value]) => {
            const formKey = parentKey ? `${parentKey}[${key}]` : key

            if (value === null || value === undefined) {
                appendValue(formData, formKey, null)
            } else if (typeof value === 'object' && !(value instanceof File)) {
                flattenObject(formData, value, formKey)
            } else {
                appendValue(formData, formKey, value as FormDataValue)
            }
        })
        return
    }

    if (parentKey) {
        appendValue(formData, parentKey, data)
    }
}

/**
 * Create FormData from an object with proper Laravel serialization
 *
 * @param data - The object to serialize
 * @param files - Optional separate files object (will be merged into FormData)
 * @param options - Additional options
 * @param options.method - HTTP method for Laravel method spoofing (PATCH, PUT, DELETE)
 * @returns FormData ready for submission
 */
export const serializeToFormData = (
    data: Record<string, any>,
    files?: Record<string, File | File[]>,
    options?: {
        method?: 'PATCH' | 'PUT' | 'DELETE'
    }
): FormData => {
    const formData = new FormData()

    if (options?.method) {
        formData.append('_method', options.method)
    }

    // Add all non-file data with proper flattening
    Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            flattenObject(formData, value, key)
        }
    })

    // Add files if provided
    if (files) {
        Object.entries(files).forEach(([key, file]) => {
            if (Array.isArray(file)) {
                file.forEach((f, index) => {
                    formData.append(`${key}[${index}]`, f)
                })
            } else {
                formData.append(key, file)
            }
        })
    }

    return formData
}
