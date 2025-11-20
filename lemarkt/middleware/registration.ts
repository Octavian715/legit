import { useGlobalStore } from '~/stores/global'
import { useUserStore } from '~/stores/user'

export default defineNuxtRouteMiddleware(async (to) => {
    const userStore = useUserStore()
    const globalStore = useGlobalStore()
    const registrationStore = useRegistrationStore()

    // Always initialize user if not initialized
    if (!userStore.isInitialized) {
        await userStore.initializeUser()
    }

    const publicPaths = ['/register', '/register/account-type', '/register/personal-info']
    const isPublicPath = publicPaths.includes(to.path)

    const confirmationPaths = ['/register/confirm', '/register/email-confirmation-success']
    const isConfirmationPath = confirmationPaths.some((path) => to.path.startsWith(path))

    if (isConfirmationPath) {
        return
    }

    const isNonPublicRegistrationPath =
        to.path.startsWith('/register') && !publicPaths.includes(to.path) && !isConfirmationPath

    if (isNonPublicRegistrationPath) {
        if (!globalStore.isStaticDataLoaded || globalStore.isStaticDataExpired()) {
            await globalStore.fetchStaticData(true)
        }
    }

    // Public paths - allow access
    if (isPublicPath) {
        return
    }

    // Authentication check
    if (!userStore.isAuthenticated) {
        return navigateTo('/login?next=' + encodeURIComponent(to.fullPath))
    }

    // Registration complete check
    if (userStore.isRegistrationComplete) {
        return navigateTo(userStore.resolvePostLoginRedirect(to))
    }

    // Initialize registration store
    if (!registrationStore.isInitialized) {
        await registrationStore.initializeFromUser()
    }

    // Validate step access
    if (!registrationStore.canAccessStep(to.path)) {
        const correctPath = registrationStore.getPathForCurrentStep()

        if (to.path !== correctPath) {
            return navigateTo(correctPath)
        }
    }
})
