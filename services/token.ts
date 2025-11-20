import { createCookie, getCookieValue, setCookieValue, removeCookie } from '~/utils/cookies'
import type { AppError } from '~/utils/errors'

export class TokenService {
    private static readonly AUTH_TOKEN = 'auth.token'
    private static readonly REFRESH_TOKEN = 'auth.refresh'
    private static readonly REGISTRATION_TOKEN = 'registration.token'

    static getAuthToken = (): string | null => {
        return getCookieValue<string>(this.AUTH_TOKEN)
    }

    static getRefreshToken = (): string | null => {
        return getCookieValue<string>(this.REFRESH_TOKEN)
    }

    static getRegistrationToken = (): string | null => {
        return getCookieValue<string>(this.REGISTRATION_TOKEN)
    }

    static getActiveToken = (context?: 'registration' | 'auth'): string | null => {
        if (context === 'registration') {
            return this.getRegistrationToken() || this.getAuthToken()
        }
        return this.getAuthToken() || this.getRegistrationToken()
    }

    static setAuthTokens = (access: string, refresh?: string) => {
        setCookieValue(this.AUTH_TOKEN, access)
        if (refresh) {
            setCookieValue(this.REFRESH_TOKEN, refresh)
        }
        removeCookie(this.REGISTRATION_TOKEN)
    }

    static setRegistrationToken = (token: string) => {
        setCookieValue(this.REGISTRATION_TOKEN, token)
    }

    static clearAllTokens = () => {
        removeCookie(this.AUTH_TOKEN)
        removeCookie(this.REFRESH_TOKEN)
        removeCookie(this.REGISTRATION_TOKEN)
        removeCookie('user')
    }

    static hasValidToken = (): boolean => {
        return !!this.getAuthToken()
    }

    static getRequestHeaders = (): HeadersInit => {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        }

        if (process.server) {
            const cookieHeader = useRequestHeaders(['cookie'])
            if (cookieHeader.cookie) {
                headers.Cookie = cookieHeader.cookie
            }
        }

        const token = this.getActiveToken()
        if (token) {
            headers.Authorization = `Bearer ${token}`
        }

        return headers
    }
}
