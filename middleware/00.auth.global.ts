import { useStaticData } from '~/composables/useStaticData'

let serverCallCount = 0
const MAX_SERVER_CALLS = 5

export default defineNuxtRouteMiddleware(async (to, from) => {
    const { refetch } = useStaticData()

    const shouldShowToasts =
        process.client &&
        from.path !== '/' &&
        from.path !== to.path &&
        !to.path.includes('login') &&
        performance.now() > 1000

    if (process.server) {
        serverCallCount++

        if (serverCallCount > MAX_SERVER_CALLS) {
            console.error('🔴 LOOP DETECTED - ABORTING')
            serverCallCount = 0
            return abortNavigation()
        }

        setTimeout(() => {
            serverCallCount = 0
        }, 1000)
    }

    const userStore = useUserStore()
    const cartStore = useCartStore()

    if (to.path.includes('/register/confirm')) {
        return // Let the page handle everything
    }

    if (!userStore.isInitialized) {
        try {
            await userStore.initializeUser()
        } catch (error) {
            console.error('User init error:', error)
            return
        }
    }

    const publicPaths = ['/register', '/auth', '/login']
    const isPublicPath = publicPaths.some((path) => to.path.startsWith(path))

    if (isPublicPath && userStore.isAuthenticated) {
        if (to.path.startsWith('/register')) {
            const confirmationPaths = ['/register/email-confirmation-success']
            if (confirmationPaths.some((path) => to.path.startsWith(path))) {
                return
            }

            if (!userStore.isRegistrationComplete) {
                return
            }

            if (userStore.isRegistrationComplete && userStore.isVerified) {
                return navigateTo('/')
            }
        }

        if (
            (to.path.startsWith('/login') || to.path.startsWith('/auth')) &&
            userStore.isRegistrationComplete
        ) {
            return navigateTo('/')
        }

        return
    }

    if (isPublicPath && !userStore.isAuthenticated) {
        return
    }

    if (!isPublicPath && !userStore.isAuthenticated) {
        if (process.client && shouldShowToasts) {
            const nuxtApp = useNuxtApp()
            const { error } = useToastNotification()
            error(nuxtApp.$i18n.t('auth.loginRequired', 'Please log in to access this page'))
        }

        return navigateTo(`/login?next=${encodeURIComponent(to.fullPath)}`)
    }

    if (!isPublicPath && userStore.isAuthenticated && !userStore.isRegistrationComplete) {
        const registrationStore = useRegistrationStore()
        await registrationStore.initializeFromUser()

        const redirectPath = userStore.getRegistrationRedirectPath()
        await refetch(true)

        if (!to.path.startsWith('/register')) {
            return navigateTo(redirectPath)
        }
    }

    const isLiteSupplier = userStore?.currentPlan?.plan?.code === 'supplier-lite'

    if (
        userStore.isAuthenticated &&
        userStore.isRegistrationComplete &&
        userStore.isVerified &&
        !isLiteSupplier
    ) {
        if (!cartStore.isInitialized) {
            try {
                await cartStore.ensureInitialized()
            } catch (error) {
                console.error('[Cart Init] Failed:', error)
            }
        }
    }
})
