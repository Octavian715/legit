// types/i18n.ts
export interface LanguageOption {
    value: string
    label: string
    flag: string
    code: string
    name?: string
}

export interface LocaleConfig {
    code: string
    name: string
    file?: string
    iso?: string
    dir?: 'ltr' | 'rtl'
    domain?: string
}

export interface I18nConfig {
    locales: LocaleConfig[]
    defaultLocale: string
    strategy: 'prefix' | 'prefix_except_default' | 'prefix_and_default'
    detectBrowserLanguage?: {
        useCookie: boolean
        cookieKey: string
        redirectOn: 'root' | 'no prefix'
        alwaysRedirect?: boolean
        fallbackLocale?: string
    }
    lazy?: boolean
    langDir?: string
    vueI18n?: string
}

export type SupportedLocale = 'en' | 'ro' | 'ru' | 'de' | 'fr' | 'es' | 'it' | 'pl' | 'uk'

export interface LanguageConfig {
    name: string
    flag: string
    nativeName: string
}

export interface LanguageChangeEvent {
    from: string
    to: string
    timestamp: Date
}

export interface BrowserLanguageDetection {
    detected: string[]
    preferred: string | null
    supported: string[]
}
