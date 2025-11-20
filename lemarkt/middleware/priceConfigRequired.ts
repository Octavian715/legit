// middleware/priceConfigRequired.ts
export default defineNuxtRouteMiddleware(() => {
    if (process.server) return

    const userStore = useUserStore()
    const localePath = useLocalePath()

    const user = userStore.user

    if (!user) {
        return navigateTo(localePath('/login'))
    }

    const hasLocalCurrency = Boolean(user.default_local_currency?.id)
    const hasExportCurrency = Boolean(user.default_export_currency?.id)
    const doExport = userStore.doExport

    // User must have at least local currency configured
    if (!hasLocalCurrency) {
        if (process.client) {
            const toast = useToastNotification()
            toast.warning('Price configuration required. Redirecting to settings...')
        }
        return navigateTo(localePath('/settings?tab=currencies'))
    }

    // If user has export enabled but no export currency, redirect
    if (doExport && !hasExportCurrency) {
        if (process.client) {
            const toast = useToastNotification()
            toast.warning('Export price configuration required. Redirecting to settings...')
        }
        return navigateTo(localePath('/settings?tab=currencies'))
    }
})
