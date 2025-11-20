// composables/useLanguage.ts
import { computed, watch, readonly } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCookie, useRouter, useRoute, navigateTo } from '#app'
import type { LanguageOption } from '~/types/i18n'
import { useLocalePath } from '#imports'

export const useLanguage = () => {
    // These must be called at the top level of the composable
    const { locale, locales, setLocale } = useI18n()
    const localePath = useLocalePath()
    const router = useRouter()
    const route = useRoute()

    // Persist language preference in cookie
    const languageCookie = useCookie('i18n_redirected', {
        default: () => locale.value,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        httpOnly: false, // Allow client-side access for language switching
    })

    // Language display configurations
    const languageConfigs = {
        en: { name: 'English', flag: '🇺🇸', nativeName: 'English' },
        ro: { name: 'Romanian', flag: '🇷🇴', nativeName: 'Română' },
        ru: { name: 'Russian', flag: '🇷🇺', nativeName: 'Русский' },
        de: { name: 'German', flag: '🇩🇪', nativeName: 'Deutsch' },
        fr: { name: 'French', flag: '🇫🇷', nativeName: 'Français' },
        es: { name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
        it: { name: 'Italian', flag: '🇮🇹', nativeName: 'Italiano' },
        pl: { name: 'Polish', flag: '🇵🇱', nativeName: 'Polski' },
        uk: { name: 'Ukrainian', flag: '🇺🇦', nativeName: 'Українська' },
    } as const

    // Available language options for dropdown
    const languageOptions = computed((): LanguageOption[] => {
        const availableLocales = Array.isArray(locales.value)
            ? locales.value
            : Object.values(locales.value || {})

        return availableLocales
            .map((localeItem: any) => {
                const code = typeof localeItem === 'string' ? localeItem : localeItem.code
                const config = languageConfigs[code as keyof typeof languageConfigs]

                return {
                    value: code,
                    label: config?.nativeName || config?.name || code.toUpperCase(),
                    flag: config?.flag || '🌐',
                    code,
                    name: config?.name || code,
                }
            })
            .filter(Boolean)
    })

    // Current language option
    const currentLanguage = computed((): LanguageOption | undefined => {
        return languageOptions.value.find((lang) => lang.code === locale.value)
    })

    // Current language display label for UI
    const currentLanguageLabel = computed((): string => {
        const current = currentLanguage.value
        return current?.label || locale.value.toUpperCase()
    })

    // Current language flag for UI
    const currentLanguageFlag = computed((): string => {
        return currentLanguage.value?.flag || '🌐'
    })

    // Get display name for a specific language code
    const getLanguageDisplayName = (code: string): string => {
        const config = languageConfigs[code as keyof typeof languageConfigs]
        return config?.nativeName || config?.name || code.toUpperCase()
    }

    // Get flag for a specific language code
    const getLanguageFlag = (code: string): string => {
        const config = languageConfigs[code as keyof typeof languageConfigs]
        return config?.flag || '🌐'
    }

    // Check if a language code is supported
    const isLanguageSupported = (code: string): boolean => {
        return languageOptions.value.some((lang) => lang.code === code)
    }

    // Change language with proper routing and persistence
    const changeLanguage = async (languageCode: string): Promise<void> => {
        if (languageCode === locale.value) {
            return
        }

        if (!isLanguageSupported(languageCode)) {
            console.warn(`[Language] Unsupported locale: ${languageCode}`)
            return
        }

        try {
            // Update locale first
            await setLocale(languageCode)

            // Save preference to cookie
            languageCookie.value = languageCode

            // Navigate to localized version of current route
            const currentPath = route.path
            const currentQuery = route.query
            const currentHash = route.hash

            // Generate localized path
            const localizedPath = localePath(
                {
                    path: currentPath,
                    query: currentQuery,
                    hash: currentHash,
                },
                languageCode
            )

            // Only navigate if the path actually changes
            if (localizedPath !== route.fullPath) {
                await navigateTo(localizedPath, {
                    replace: true,
                    external: false,
                })
            }

            // Update document language attribute for accessibility
            if (process.client && typeof document !== 'undefined') {
                document.documentElement.lang = languageCode
            }
        } catch (error) {
            console.error('[Language] Failed to change language:', error)
            throw new Error(`Failed to change language to ${languageCode}`)
        }
    }

    // Detect browser language preference
    const detectBrowserLanguage = (): string | null => {
        if (!process.client || typeof navigator === 'undefined') return null

        const browserLanguages = navigator.languages || [navigator.language]

        // Check exact matches first
        for (const lang of browserLanguages) {
            const code = lang.toLowerCase().split('-')[0]
            if (isLanguageSupported(code)) {
                return code
            }
        }

        return null
    }

    // Initialize language from cookie or browser preference
    const initializeLanguage = (): void => {
        if (!process.client) return

        try {
            // Check if we have a saved preference
            const savedLanguage = languageCookie.value

            if (
                savedLanguage &&
                savedLanguage !== locale.value &&
                isLanguageSupported(savedLanguage)
            ) {
                setLocale(savedLanguage)
                return
            }

            // Fallback to browser language detection
            const browserLanguage = detectBrowserLanguage()
            if (
                browserLanguage &&
                browserLanguage !== locale.value &&
                isLanguageSupported(browserLanguage)
            ) {
                setLocale(browserLanguage)
            }
        } catch (error) {
            console.error('[Language] Failed to initialize language:', error)
        }
    }

    // Sync cookie with current locale changes
    watch(
        locale,
        (newLocale) => {
            if (newLocale !== languageCookie.value) {
                languageCookie.value = newLocale
            }
        },
        { immediate: false }
    )

    return {
        // Reactive state
        locale: readonly(locale),
        languageOptions: readonly(languageOptions),
        currentLanguage: readonly(currentLanguage),
        currentLanguageLabel: readonly(currentLanguageLabel),
        currentLanguageFlag: readonly(currentLanguageFlag),

        // Methods
        changeLanguage,
        getLanguageDisplayName,
        getLanguageFlag,
        isLanguageSupported,
        initializeLanguage,

        // Utilities
        detectBrowserLanguage,
    }
}
