// middleware/dashboard.ts - WITH ROLE HIERARCHY
import { storeToRefs } from 'pinia'
import type { UserRoleCode } from '~/types/auth'

export default defineNuxtRouteMiddleware(async (to) => {
    const userStore = useUserStore()
    const { roles, isAuthenticated, isRegistrationComplete } = storeToRefs(userStore)
    const localePath = useLocalePath()

    if (!isAuthenticated.value) {
        console.warn('[Dashboard Middleware] User not authenticated')
        return navigateTo(localePath(`/login?next=${encodeURIComponent(to.path)}`))
    }

    if (!isRegistrationComplete.value) {
        console.warn('[Dashboard Middleware] Registration incomplete')
        const redirectPath = userStore.getRegistrationRedirectPath()
        return navigateTo(localePath(redirectPath))
    }

    if (!roles.value || roles.value.length === 0) {
        console.error('[Dashboard Middleware] User has no roles')
        return navigateTo(localePath('/'))
    }

    const pathRole = extractRoleFromPath(to.path)

    if (!pathRole) {
        console.error('[Dashboard Middleware] No valid role found in path:', to.path)

        const allowedPath = getDefaultPathForUser(roles.value)

        if (allowedPath) {
            return navigateTo(localePath(allowedPath))
        }

        return navigateTo(localePath('/'))
    }

    const canAccessPath = canUserAccessRole(roles.value, pathRole)

    if (!canAccessPath) {
        console.warn(
            `[Dashboard Middleware] Access denied for '${pathRole}'. User roles:`,
            roles.value
        )

        const allowedPath = getDefaultPathForUser(roles.value)

        if (allowedPath) {
            return navigateTo(localePath(allowedPath))
        }

        console.warn('[Dashboard Middleware] No valid dashboard found. Redirecting to home.')
        return navigateTo(localePath('/'))
    }
})

const canUserAccessRole = (userRoles: UserRoleCode[], targetRole: string): boolean => {
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

const extractRoleFromPath = (path: string): 'supplier' | 'buyer' | 'admin' | null => {
    const cleanPath = path.toLowerCase()
    const segments = cleanPath.split('/').filter(Boolean)

    const validRoles = ['supplier', 'buyer', 'admin'] as const

    for (const segment of segments) {
        if (validRoles.includes(segment as any)) {
            return segment as 'supplier' | 'buyer' | 'admin'
        }
    }

    return null
}
