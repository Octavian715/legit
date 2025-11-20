export default defineNuxtRouteMiddleware(async (to) => {
    const userStore = useUserStore()
    const localePath = useLocalePath()

    const isTemplateRoute =
        to.path.includes('/templates') ||
        to.path.includes('/sales') ||
        // to.path.includes('/icons') ||
        to.path.includes('/inventory') ||
        to.path.includes('/guide') ||
        to.path.includes('/supplier/settings') ||
        to.path.includes('/buyer/settings') ||
        to.path.includes('/support')

    if (!isTemplateRoute) {
        return
    }

    if (process.client) {
        const nuxtApp = useNuxtApp()
        const { warning } = useToastNotification()
        warning(nuxtApp.$i18n.t('featureComingSoon'))
    }

    const { isSupplier, isBuyer, isServiceProvider } = userStore

    // if (isAdmin) {
    //     return navigateTo(localePath('/admin/dashboard'), { replace: true })
    // }

    if (isSupplier) {
        return navigateTo(localePath('/supplier/dashboard'), { replace: true })
    }

    if (isBuyer) {
        return navigateTo(localePath('/buyer/dashboard'), { replace: true })
    }

    if (isServiceProvider) {
        return navigateTo(localePath('/serviceProvider/dashboard'), { replace: true })
    }

    return navigateTo(localePath('/'), { replace: true })
})
