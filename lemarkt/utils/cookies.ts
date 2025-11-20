export interface CookieOptions {
    maxAge?: number
    path?: string
    sameSite?: 'lax' | 'strict' | 'none'
    secure?: boolean
    httpOnly?: boolean
}

const getDefaultOptions = (name: string): CookieOptions => ({
    path: '/',
    sameSite: 'lax',
    secure: process.client && window.location.protocol === 'https:',
    httpOnly: false,
    maxAge: name.includes('refresh') ? 60 * 60 * 24 * 30 : 60 * 60 * 24,
})

export const createCookie = <T = string | null>(name: string, options?: CookieOptions) => {
    return useCookie<T>(name, {
        ...getDefaultOptions(name),
        ...options,
    })
}

export const getCookieValue = <T = string | null>(name: string): T | null => {
    const cookie = createCookie<T>(name)
    return cookie.value
}

export const setCookieValue = <T = string>(
    name: string,
    value: T | null,
    options?: CookieOptions
) => {
    const cookie = createCookie<T>(name, options)
    cookie.value = value
}

export const removeCookie = (name: string) => {
    setCookieValue(name, null)
}
