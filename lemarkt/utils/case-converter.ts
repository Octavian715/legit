export const camelToSnake = (obj: any): any => {
    if (obj === null || obj === undefined) {
        return obj
    }

    if (obj instanceof FormData) {
        return obj
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => camelToSnake(item))
    }

    if (typeof obj === 'object' && obj.constructor === Object) {
        return Object.keys(obj).reduce((acc, key) => {
            const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
            acc[snakeKey] = camelToSnake(obj[key])
            return acc
        }, {} as any)
    }

    return obj
}

export const snakeToCamel = (obj: any): any => {
    if (obj === null || obj === undefined) {
        return obj
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => snakeToCamel(item))
    }

    if (typeof obj === 'object' && obj.constructor === Object) {
        return Object.keys(obj).reduce((acc, key) => {
            const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
            acc[camelKey] = snakeToCamel(obj[key])
            return acc
        }, {} as any)
    }

    return obj
}
