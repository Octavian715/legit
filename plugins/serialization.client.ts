// plugins/ssr-error-handler.client.ts
export default defineNuxtPlugin(() => {
    if (process.client) {
        // Handle hydration mismatches gracefully
        const originalConsoleError = console.error
        console.error = (...args) => {
            if (args[0] && args[0].includes('Hydration')) {
                console.warn('Hydration mismatch detected, continuing...')
                return
            }
            originalConsoleError.apply(console, args)
        }
    }
})
