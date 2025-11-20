export default defineNuxtRouteMiddleware(async (to) => {
    const userStore = useUserStore()

    if (!userStore.isInitialized) {
        await userStore.initializeUser()
    }

    if (!userStore.isAuthenticated) {
        return navigateTo(`/login?next=${encodeURIComponent(to.fullPath)}`)
    }

    if (!userStore.isRegistrationComplete) {
        return navigateTo(userStore.getRegistrationRedirectPath())
    }

    if (!userStore.isAdmin) {
        if (process.client) {
            const nuxtApp = useNuxtApp()
            const { error } = useToastNotification()
            error(nuxtApp.$i18n.t('auth.adminAccessRequired', 'Administrator access required'))
        }

        throw createError({
            statusCode: 403,
            statusMessage: 'Administrator Access Required',
        })
    }
})
