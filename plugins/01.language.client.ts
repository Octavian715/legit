// plugins/01.language.client.ts
export default defineNuxtPlugin(() => {
    // Simple language initialization without composables
    if (process.client) {
        // Initialize language on client mount
        const initLanguage = () => {
            try {
                const languageCookie = document.cookie
                    .split('; ')
                    .find((row) => row.startsWith('i18n_redirected='))
                    ?.split('=')[1]

                if (languageCookie && document.documentElement.lang !== languageCookie) {
                    document.documentElement.lang = languageCookie
                }
            } catch (error) {
                console.warn('[Language Plugin] Failed to initialize language:', error)
            }
        }

        // Run immediately and on DOM ready
        initLanguage()

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initLanguage)
        }
    }
})
