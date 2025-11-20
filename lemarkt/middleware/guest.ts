export default defineNuxtRouteMiddleware(async (to) => {
    const userStore = useUserStore()

    // Initialize user if not already done
    if (!userStore.isInitialized) {
        await userStore.initializeUser()
    }

    // Define public paths
    const publicPaths = ['/register', '/auth', '/login']
    const isPublicPath = publicPaths.some((path) => to.path.startsWith(path))

    // Handle authenticated users trying to access public paths
    if (isPublicPath && userStore.isAuthenticated) {
        // Special handling for registration flow
        if (to.path.startsWith('/register')) {
            // Allow access to email confirmation pages
            const confirmationPaths = ['/register/confirm', '/register/email-confirmation-success']
            if (confirmationPaths.some((path) => to.path.startsWith(path))) {
                return
            }

            // If registration is incomplete, allow access
            if (!userStore.isRegistrationComplete) {
                return
            }

            // For complete and verified users, redirect away
            if (userStore.isRegistrationComplete && userStore.isVerified) {
                const redirectPath = getUserDashboard(userStore)
                return navigateTo(redirectPath)
            }
        }

        // For login and auth paths, redirect if registration is complete
        if (
            (to.path.startsWith('/login') || to.path.startsWith('/auth')) &&
            userStore.isRegistrationComplete
        ) {
            const redirectPath = getUserDashboard(userStore)
            return navigateTo(redirectPath)
        }
    }

    // Skip further checks for unauthenticated users on public paths
    if (isPublicPath && !userStore.isAuthenticated) {
        return
    }

    // Check authentication for protected routes
    if (!isPublicPath && !userStore.isAuthenticated) {
        const loginUrl = `/login?next=${encodeURIComponent(to.fullPath)}`

        if (process.client) {
            const nuxtApp = useNuxtApp()
            const { error } = useToastNotification()
            error(nuxtApp.$i18n.t('auth.loginRequired', 'Please log in to access this page'))
        }

        return navigateTo(loginUrl)
    }

    // Check registration completion
    if (!isPublicPath && userStore.isAuthenticated && !userStore.isRegistrationComplete) {
        const registrationStore = useRegistrationStore()
        await registrationStore.initializeFromUser()

        const redirectPath = userStore.getRegistrationRedirectPath()

        if (!to.path.startsWith('/register')) {
            return navigateTo(redirectPath)
        }
    }
})

// Helper function to get user dashboard based on role
const getUserDashboard = (userStore: any): string => {
    return '/marketplace' // Default fallback to home
}
