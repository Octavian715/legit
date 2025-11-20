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

    if (!userStore.isBuyer && !userStore.isHybridUser && !userStore.isAdmin) {
        const redirectPath = getUserDashboard(userStore)
        if (redirectPath !== to.path) {
            // Prevent self-redirect loop
            return navigateTo(redirectPath)
        }
    }
})

function getUserDashboard(): string {
    return '/marketplace'
}
