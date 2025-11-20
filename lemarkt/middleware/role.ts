// middleware/role.ts - WITH ROLE HIERARCHY
import type { UserRoleCode } from '~/types/auth'
import { storeToRefs } from 'pinia'

export default defineNuxtRouteMiddleware(async (to) => {
    const userStore = useUserStore()
    const localePath = useLocalePath()

    if (!userStore.isInitialized) {
        await userStore.initializeUser()
    }

    if (!userStore.isAuthenticated) {
        return navigateTo(localePath(`/login?next=${encodeURIComponent(to.fullPath)}`))
    }

    if (!userStore.isRegistrationComplete) {
        return navigateTo(localePath(userStore.getRegistrationRedirectPath()))
    }

    const { roles } = storeToRefs(userStore)

    const pathRole = extractRoleFromPath(to.path)

    if (pathRole) {
        const canAccessPath = canUserAccessRole(roles.value, pathRole)

        if (!canAccessPath) {
            console.warn(
                `[Role Middleware] User cannot access '${pathRole}' functionality. User roles:`,
                roles.value
            )

            const allowedPath = getDefaultPathForUser(roles.value)

            if (allowedPath) {
                return navigateTo(localePath(allowedPath))
            }

            if (process.client) {
                const nuxtApp = useNuxtApp()
                const { error } = useToastNotification()
                error(nuxtApp.$i18n.t('auth.noAccess', 'You do not have access to this section'))
            }

            return navigateTo(localePath('/'))
        }
    }

    const requiredRoles = to.meta?.roles as UserRoleCode[] | undefined

    if (!requiredRoles || requiredRoles.length === 0) {
        return
    }

    const hasRequiredRole = requiredRoles.some(
        (role) => userStore.hasRole(role) || userStore.isHybridUser
    )

    if (!hasRequiredRole) {
        console.warn('[Role Middleware] Access denied. Required roles:', requiredRoles)

        if (process.client) {
            const nuxtApp = useNuxtApp()
            const { error } = useToastNotification()
            error(
                nuxtApp.$i18n.t(
                    'auth.accessDenied',
                    'You do not have permission to access this page'
                )
            )
        }

        throw createError({
            statusCode: 403,
            statusMessage: 'Access Denied',
        })
    }
})

const canUserAccessRole = (userRoles: UserRoleCode[], targetRole: UserRoleCode): boolean => {
    if (userRoles.includes('admin')) {
        return true
    }

    if (targetRole === 'supplier' && userRoles.includes('supplier')) {
        return true
    }

    if (targetRole === 'buyer') {
        if (userRoles.includes('supplier') || userRoles.includes('buyer')) {
            return true
        }
    }

    if (targetRole === 'serviceProvider' && userRoles.includes('serviceProvider')) {
        return true
    }

    return false
}

const getDefaultPathForUser = (userRoles: UserRoleCode[]): string | null => {
    if (userRoles.includes('admin')) {
        return '/admin/dashboard'
    }

    if (userRoles.includes('supplier')) {
        return '/supplier/dashboard'
    }

    if (userRoles.includes('buyer')) {
        return '/buyer/dashboard'
    }

    if (userRoles.includes('serviceProvider')) {
        return '/serviceProvider/dashboard'
    }

    return null
}

const extractRoleFromPath = (path: string): UserRoleCode | null => {
    const cleanPath = path.toLowerCase()
    const segments = cleanPath.split('/').filter(Boolean)

    const roleMap: Record<string, UserRoleCode> = {
        supplier: 'supplier',
        buyer: 'buyer',
        serviceprovider: 'serviceProvider',
        admin: 'admin',
    }

    for (const segment of segments) {
        const normalizedSegment = segment.toLowerCase()
        if (roleMap[normalizedSegment]) {
            return roleMap[normalizedSegment]
        }
    }

    return null
}
