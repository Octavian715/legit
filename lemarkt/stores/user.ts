// stores/user.ts - UPDATED WITH PROFILE METHODS
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useCookie, navigateTo, useRuntimeConfig } from '#app'
import type { RouteLocationNormalized } from 'vue-router'
import { serializeToFormData } from '~/utils/form-data-serializer'

import {
    type ExtendedUser,
    type UserRoleCode,
    type PlanTier,
    type LoginResponse,
    type PasswordResetState,
    type CompanyDetails,
    type ExportDetails,
    type DeliveryLocation,
    hasRole,
    effectiveRoles,
    getPrimaryRole,
    isHybridUser,
    isRegistrationComplete as checkRegistrationComplete,
} from '~/types/auth'

import { featureAccessMap } from '~/constants/featureAccess'
import { buildStepRoute } from '~/utils/registrationHelpers'

interface UserStoreError {
    code:
        | 'NETWORK_ERROR'
        | 'AUTH_ERROR'
        | 'VALIDATION_ERROR'
        | 'API_ERROR'
        | 'UNKNOWN_ERROR'
        | 'RATE_LIMIT_ERROR'
    message: string
    details?: any
    timestamp: number
}

// ✅ CONNECTIONS & FOLLOWERS INTERFACES
interface ConnectionStatus {
    id: number | null
    exists: boolean
    status: 'pending' | 'accepted' | 'rejected' | null
}

interface CompanyUser {
    id: number
    email: string
    companyDetails: {
        legalName: string
        username: string
        websiteUrl: string
        country?: {
            code: string
            name: string
        }
    }
    phoneNumbers: Array<{
        countryCode: string
        phoneNumber: string
    }>
    social: {
        isFollowing: boolean
        connection: ConnectionStatus
        followersCount: number
        connectionsCount: number
        productsCount: number
    }
    picture: string | null
}

interface ConnectionsFilters {
    page?: number
    perPage?: number
    search?: string
    companyName?: string
    email?: string
    username?: string
    sortBy?: 'company_name' | 'products_count' | 'followers_count' | 'connections_count'
    sortOrder?: 'asc' | 'desc'
}

interface FollowersFilters extends ConnectionsFilters {
    type: 'followers' | 'following'
}

interface PaginationMeta {
    currentPage: number
    lastPage: number
    perPage: number
    total: number
    from: number
    to: number
    appliedFilters: Record<string, any>
}

interface ConnectionsResponse {
    data: CompanyUser[]
    meta: PaginationMeta
}

const createError = (
    code: UserStoreError['code'],
    message: string,
    details?: any
): UserStoreError => ({
    code,
    message,
    details,
    timestamp: Date.now(),
})

interface MinimalUser {
    id: number
    email: string
    verification_status?: string
    is_registration_complete: boolean
    register_step?: string
    register_substep?: string | number
    roles: Array<{ id: number; code: string }>
    name?: string
    company_details?: { legal_name?: string }
}

const normalizeAvatarUrl = (url: string | null | undefined): string => {
    if (!url) return ''

    try {
        // If it's a relative path, make it absolute
        const config = useRuntimeConfig()
        const apiBaseURL = config.public.apiBaseURL

        let fullUrl = url
        if (url.startsWith('/')) {
            // Remove /api from base if present and add the path
            const baseWithoutApi = apiBaseURL.replace(/\/api\/?$/, '')
            fullUrl = `${baseWithoutApi}${url}`
        }

        const urlObj = new URL(fullUrl)
        urlObj.searchParams.delete('expires')
        urlObj.searchParams.delete('signature')
        return urlObj.toString()
    } catch {
        return url || ''
    }
}
const normalizeUserData = (userData: ExtendedUser): ExtendedUser => {
    if (!userData) return userData
    return {
        ...userData,
        profile_media: userData.profile_media?.map((media) => ({
            ...media,
            file_path: normalizeAvatarUrl(media.file_path),
        })),
    }
}

export const useUserStore = defineStore(
    'user',
    () => {
        const user: Ref<ExtendedUser | null> = ref(null)
        const passwordResetState: Ref<PasswordResetState> = ref({
            email: null,
            token: null,
            isResetInProgress: false,
        })
        const isLoadingUser = ref(false)
        const userFetchError: Ref<UserStoreError | null> = ref(null)
        const isInitialized = ref(false)
        const lastFetchTime = ref<number>(0)
        const updateUserLoading = ref(false)

        // ✅ CONNECTIONS & FOLLOWERS STATE
        const connections = ref<CompanyUser[]>([])
        const connectionsMeta = ref<PaginationMeta | null>(null)
        const isLoadingConnections = ref(false)
        const connectionsError = ref<UserStoreError | null>(null)

        const followers = ref<CompanyUser[]>([])
        const followersMeta = ref<PaginationMeta | null>(null)
        const isLoadingFollowers = ref(false)
        const followersError = ref<UserStoreError | null>(null)

        const rolesCache = ref<UserRoleCode[]>([])
        const lastUserVersion = ref<string>('')
        const isRequestingPasswordReset = ref(false)
        const lastPasswordResetRequest = ref<number>(0)
        const isRequestingEmailLogin = ref(false)
        const lastEmailLoginRequest = ref<number>(0)

        const PASSWORD_RESET_COOLDOWN = 30000
        const EMAIL_LOGIN_COOLDOWN = 60000

        let refreshInterval: NodeJS.Timeout | null = null

        const getAuthToken = (): string | null => {
            if (process.server) {
                const event = useRequestEvent()
                const cookies = parseCookies(event)
                return cookies['auth.token'] || null
            } else {
                try {
                    const accessCookie = useCookie<string | null>('auth.token')
                    return accessCookie.value
                } catch (error) {
                    return null
                }
            }
        }

        const parseCookies = (event: any) => {
            const cookieHeader = event?.node?.req?.headers?.cookie || ''
            const cookies: Record<string, string> = {}
            cookieHeader.split(';').forEach((cookie) => {
                const [name, value] = cookie.trim().split('=')
                if (name && value) cookies[name] = decodeURIComponent(value)
            })
            return cookies
        }

        const getRefreshToken = (): string | null => {
            try {
                const refreshCookie = useCookie<string | null>('auth.refresh')
                return refreshCookie.value
            } catch (error) {
                return null
            }
        }

        const hasValidToken = (): boolean => {
            try {
                const accessCookie = useCookie<string | null>('auth.token')
                return !!accessCookie.value
            } catch (error) {
                return false
            }
        }

        const setTokens = (access: string, refresh?: string) => {
            try {
                const accessCookie = useCookie<string | null>('auth.token', {
                    httpOnly: false,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24,
                })
                const refreshCookie = useCookie<string | null>('auth.refresh', {
                    httpOnly: false,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 30,
                })
                const registrationTokenCookie = useCookie<string | null>('registration.token')

                accessCookie.value = access
                if (refresh) refreshCookie.value = refresh
                registrationTokenCookie.value = null
            } catch (error) {}
        }

        const clearTokens = () => {
            try {
                const accessCookie = useCookie<string | null>('auth.token')
                const refreshCookie = useCookie<string | null>('auth.refresh')
                const userDataCookie = useCookie<string | null>('user.minimal')
                const registrationTokenCookie = useCookie<string | null>('registration.token')

                accessCookie.value = null
                refreshCookie.value = null
                userDataCookie.value = null
                registrationTokenCookie.value = null
            } catch (error) {}
        }

        const saveMinimalUserToCookie = (userData: ExtendedUser) => {
            try {
                const minimalUser: MinimalUser = {
                    id: userData.id,
                    email: userData.email,
                    verification_status: userData.verification_status,
                    is_registration_complete: userData.is_registration_complete,
                    register_step: userData.register_step,
                    register_substep: userData.register_substep,
                    roles: userData.roles?.map((role) => ({ id: role.id, code: role.code })) || [],
                    name: userData.name,
                    company_details: userData.company_details
                        ? { legal_name: userData.company_details.legal_name }
                        : undefined,
                }

                const userDataCookie = useCookie<string | null>('user.minimal', {
                    httpOnly: false,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 7,
                })

                const cookieData = JSON.stringify(minimalUser)
                if (cookieData.length > 3500) {
                    const ultraMinimal = {
                        id: userData.id,
                        email: userData.email,
                        verification_status: userData.verification_status,
                        is_registration_complete: userData.is_registration_complete,
                        roles: userData.roles?.map((r) => r.code) || [],
                    }
                    userDataCookie.value = JSON.stringify(ultraMinimal)
                } else {
                    userDataCookie.value = cookieData
                }
            } catch (error) {}
        }

        const setUser = (userData: ExtendedUser | null) => {
            try {
                user.value = userData ? normalizeUserData(userData) : null

                if (userData && process.client) {
                    saveMinimalUserToCookie(userData)
                    lastFetchTime.value = Date.now()
                    lastUserVersion.value = ''
                    rolesCache.value = []
                } else {
                    const userDataCookie = useCookie<string | null>('user.minimal')
                    userDataCookie.value = null
                }
            } catch (error) {}
        }

        const updateUser = (userData: Partial<ExtendedUser>) => {
            try {
                if (user.value && userData) {
                    const normalizedUpdate = {
                        ...userData,
                        profile_media: userData.profile_media?.map((media) => ({
                            ...media,
                            file_path: normalizeAvatarUrl(media.file_path),
                        })),
                    }
                    Object.assign(user.value, normalizedUpdate)

                    if (process.client) {
                        saveMinimalUserToCookie(user.value)
                        lastFetchTime.value = Date.now()
                        lastUserVersion.value = ''
                        rolesCache.value = []
                    }
                }
            } catch (error) {}
        }

        const setInitialized = (value: boolean) => {
            try {
                isInitialized.value = value
            } catch (error) {}
        }

        const roles = computed<UserRoleCode[]>(() => {
            try {
                const currentUserVersion = user.value
                    ? `${user.value.id}-${user.value.updated_at || Date.now()}`
                    : ''
                if (currentUserVersion === lastUserVersion.value && rolesCache.value.length > 0) {
                    return rolesCache.value
                }
                const newRoles = effectiveRoles(user.value)
                rolesCache.value = newRoles
                lastUserVersion.value = currentUserVersion
                return newRoles
            } catch (error) {
                return []
            }
        })

        const primaryRole = computed<UserRoleCode | null>(() => {
            try {
                return getPrimaryRole(user.value)
            } catch (error) {
                return null
            }
        })

        const isLiteSupplier = computed<PlanTier>(() => {
            try {
                return user.value?.current_plan?.plan?.code === 'supplier-lite'
            } catch (error) {
                return 'referral'
            }
        })

        const plan = computed<PlanTier>(() => {
            try {
                return user.value?.current_plan?.plan?.name || 'referral'
            } catch (error) {
                return 'referral'
            }
        })
        // Current plan with full details (plan, started_at, expires_at, cancelled_at)
        const currentPlan = computed(() => {
            return user.value?.current_plan || null
        })

        const isAuthenticated = computed<boolean>(() => {
            try {
                const hasUser = !!user.value
                const hasToken = hasValidToken()
                if (!isInitialized.value && hasToken) return true
                return hasUser && hasToken
            } catch (error) {
                return false
            }
        })

        const isVerified = computed(() => user.value?.verification_status === 'verified')
        const isRejected = computed(() => user.value?.verification_status === 'rejected')
        const isPending = computed(() => user.value?.verification_status === 'pending')
        const isUnverified = computed(
            () =>
                !user.value?.verification_status ||
                user.value.verification_status === 'unverified' ||
                user.value.verification_status === 'draft'
        )
        const isAdmin = computed<boolean>(() => {
            try {
                return hasRole(user.value, 'admin')
            } catch (error) {
                return false
            }
        })
        const isSupplier = computed<boolean>(() => {
            try {
                return hasRole(user.value, 'supplier')
            } catch (error) {
                return false
            }
        })
        const isBuyer = computed<boolean>(() => {
            try {
                return hasRole(user.value, 'buyer')
            } catch (error) {
                return false
            }
        })
        const isServiceProvider = computed<boolean>(() => {
            try {
                return hasRole(user.value, 'serviceProvider')
            } catch (error) {
                return false
            }
        })
        const isHybridUserComputed = computed<boolean>(() => {
            try {
                return isHybridUser(user.value)
            } catch (error) {
                return false
            }
        })
        const isRegistrationComplete = computed<boolean>(() => {
            try {
                return checkRegistrationComplete(user.value)
            } catch (error) {
                return false
            }
        })
        const currentRegistrationStep = computed<string | null>(() => {
            try {
                return user.value?.register_step ?? null
            } catch (error) {
                return null
            }
        })
        const currentRegistrationSubstep = computed<string | null>(() => {
            try {
                const substep = user.value?.register_substep
                return substep ? String(substep) : null
            } catch (error) {
                return null
            }
        })

        const userDisplayName = computed<string>(() => {
            try {
                if (!user.value) return ''
                const extendedUser = user.value as ExtendedUser
                if (extendedUser.name) return extendedUser.name
                if (user.value.company_details?.legal_name)
                    return user.value.company_details.legal_name
                return user.value.email || 'User'
            } catch (error) {
                return 'User'
            }
        })
        const userName = computed<string>(() => {
            try {
                if (!user.value) return null

                if (user.value.company_details?.username) return user.value.company_details.username
            } catch (error) {
                return 'null'
            }
        })
        const userInitials = computed<string>(() => {
            try {
                if (!user.value) return 'U'
                const extendedUser = user.value as ExtendedUser

                if (extendedUser.name) {
                    const names = extendedUser.name.split(' ')
                    if (names.length >= 2) {
                        return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase()
                    }
                    return names[0].charAt(0).toUpperCase()
                }

                if (user.value.company_details?.legal_name) {
                    const words = user.value.company_details.legal_name.split(' ')
                    if (words.length >= 2) {
                        return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase()
                    }
                    return words[0].charAt(0).toUpperCase()
                }

                if (user.value.email) {
                    return user.value.email.charAt(0).toUpperCase()
                }

                return 'U'
            } catch (error) {
                return 'U'
            }
        })

        const userAvatar = computed<string | null>(() => {
            try {
                if (!user.value?.profile_media) return null
                const pictureMedia = user.value.profile_media.find(
                    (media) => media?.type === 'picture'
                )
                return pictureMedia?.url || null
            } catch (error) {
                console.error('[UserStore] Error getting user avatar:', error)
                return null
            }
        })

        const defaultCurrency = computed(() => {
            try {
                return user.value?.default_currency || null
            } catch (error) {
                return null
            }
        })

        const currencySymbol = computed<string>(() => {
            try {
                return user.value?.default_currency?.symbol || '$'
            } catch (error) {
                return '$'
            }
        })

        const currencyCode = computed<string>(() => {
            try {
                return user.value?.default_currency?.code || 'USD'
            } catch (error) {
                return 'USD'
            }
        })

        const canAccess = (feature: string): boolean => {
            try {
                return roles.value.some((role) => {
                    const allowed = featureAccessMap[role]?.[plan.value] ?? []
                    return allowed.includes('*') || allowed.includes(feature)
                })
            } catch (error) {
                return false
            }
        }

        const handleFetchError = (error: any): UserStoreError => {
            if (error?.statusCode === 401 || error?.response?.status === 401) {
                return createError(
                    'AUTH_ERROR',
                    'Authentication failed',
                    error.data || error.response?.data
                )
            }
            if (error?.statusCode === 403 || error?.response?.status === 403) {
                return createError(
                    'AUTH_ERROR',
                    'Access forbidden',
                    error.data || error.response?.data
                )
            }
            if (error?.statusCode === 429 || error?.response?.status === 429) {
                return createError(
                    'RATE_LIMIT_ERROR',
                    'Too many requests. Please wait before trying again.',
                    error.data || error.response?.data
                )
            }
            if (error?.code === 'ERR_NETWORK' || error?.type === 'FetchError') {
                return createError('NETWORK_ERROR', 'Network connection failed', error)
            }
            return createError(
                'UNKNOWN_ERROR',
                error?.message || 'An unexpected error occurred',
                error
            )
        }

        const initializeFromStorage = (): boolean => {
            try {
                const accessCookie = useCookie<string | null>('auth.token')
                const userDataCookie = useCookie<string | null>('user.minimal')

                const hasToken = !!accessCookie.value
                const storedUserData = userDataCookie.value
                const hasUserData = !!storedUserData

                if (hasToken && hasUserData) {
                    try {
                        const minimalUserData = JSON.parse(storedUserData)
                        if (minimalUserData && minimalUserData.id) {
                            const extendedMinimalUser: ExtendedUser =
                                minimalUserData as ExtendedUser
                            user.value = extendedMinimalUser
                            return true
                        }
                    } catch (parseError) {
                        console.error('[UserStore] Failed to parse stored user data:', parseError)
                    }
                }
                return false
            } catch (error) {
                console.error('[UserStore] Failed to initialize from storage:', error)
                return false
            }
        }

        const initializeUser = async (): Promise<void> => {
            try {
                if (!hasValidToken()) {
                    isInitialized.value = true
                    return
                }
                await fetchUser()
                isInitialized.value = true
            } catch (error) {
                console.error('[UserStore] User initialization failed:', error)
                isInitialized.value = true
            }
        }

        // ✅ FIXED: GET /user (no trailing slash)
        const fetchUser = async (skipIfRecent: boolean = false): Promise<ExtendedUser | null> => {
            const timeSinceLastFetch = Date.now() - lastFetchTime.value
            if (skipIfRecent && timeSinceLastFetch < 30000) return user.value
            if (isLoadingUser.value) return null

            try {
                isLoadingUser.value = true
                userFetchError.value = null

                const config = useRuntimeConfig()
                const apiBaseURL = config.public.apiBaseURL
                const token = getAuthToken()

                if (!token) throw createError('AUTH_ERROR', 'No authentication token found')

                const response = await $fetch<ExtendedUser>(`${apiBaseURL}/user`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                })

                if (response) {
                    setUser(response)
                    return user.value
                }

                throw createError('API_ERROR', 'Invalid response from server')
            } catch (error: any) {
                console.error('[UserStore] Failed to fetch user:', error)
                userFetchError.value = handleFetchError(error)

                if (error?.statusCode === 401 || error?.response?.status === 401) {
                    await logout()
                }
                throw error
            } finally {
                isLoadingUser.value = false
            }
        }

        const updateProfile = async (
            data: Record<string, any>,
            files?: Record<string, File | File[]>
        ): Promise<void> => {
            try {
                updateUserLoading.value = true

                const config = useRuntimeConfig()
                const apiBaseURL = config.public.apiBaseURL
                const token = getAuthToken()

                if (!token) throw createError('AUTH_ERROR', 'No authentication token')

                // ✅ CRITICAL: Use method spoofing for Laravel
                // Browsers don't support PATCH with FormData natively
                const formData = serializeToFormData(data, files, {
                    method: 'PATCH', // This adds _method: 'PATCH' to FormData
                })

                // ✅ IMPORTANT: Use POST, not PATCH!
                // Laravel will see _method=PATCH and treat it as PATCH
                const response = await $fetch<ExtendedUser>(`${apiBaseURL}/user`, {
                    method: 'POST', // ← Changed from PATCH to POST
                    headers: {
                        Authorization: `Bearer ${token}`,
                        // Don't set Content-Type - let browser set it with boundary
                    },
                    body: formData,
                })

                if (response) {
                    updateUser(response)
                }
            } catch (error: any) {
                console.error('[UserStore] Failed to update profile:', error)
                throw error
            } finally {
                updateUserLoading.value = false
            }
        }

        // ✅ Helper: Update currency
        const updateCurrency = async (currencyId: number): Promise<void> => {
            await updateProfile({ default_currency_id: currencyId })
        }

        // ✅ Alias for backward compatibility
        const updateUserCurrency = async (currencyId: number): Promise<void> => {
            await updateCurrency(currencyId)
        }

        // ✅ Helper: Update local currency
        const updateLocalCurrency = async (currencyId: number): Promise<void> => {
            await updateProfile({ default_local_currency_id: currencyId })
        }

        // ✅ Helper: Update export currency
        const updateExportCurrency = async (currencyId: number): Promise<void> => {
            await updateProfile({ default_export_currency_id: currencyId })
        }

        // ✅ Helper: Update company details
        const updateCompanyDetails = async (
            companyData: Partial<CompanyDetails>
        ): Promise<void> => {
            await updateProfile({ company_details: companyData })
        }

        // ✅ Helper: Update export details
        const updateExportDetails = async (exportData: Partial<ExportDetails>): Promise<void> => {
            await updateProfile({ export_details: exportData })
        }

        const uploadProfilePicture = async (file: File, existingId?: number): Promise<void> => {
            try {
                const data: Record<string, any> = {
                    profile_media: {
                        picture: existingId ? { id: existingId } : {},
                    },
                }

                const files = {
                    'profile_media[picture][file]': file,
                }

                await updateProfile(data, files)
            } catch (error: any) {
                console.error('[UserStore] Failed to upload profile picture:', error)
                throw error
            }
        }

        const uploadBanner = async (file: File, existingId?: number): Promise<void> => {
            try {
                const data: Record<string, any> = {
                    profile_media: {
                        banner: existingId ? { id: existingId } : {},
                    },
                }

                const files = {
                    'profile_media[banner][file]': file,
                }

                await updateProfile(data, files)
            } catch (error: any) {
                console.error('[UserStore] Failed to upload banner:', error)
                throw error
            }
        }

        /**
         * Update complete company profile including text data and media files
         */
        const updateCompanyProfile = async (profileData: {
            formData: {
                legal_name?: string
                username?: string
                description?: string
                email?: string
                website_url?: string
            }
            profilePicture?: File | null
            companyCover?: File | null
            gallery?: Array<{ file?: File; url?: string; id?: number }>
        }): Promise<void> => {
            try {
                const { formData, profilePicture, companyCover, gallery } = profileData

                // Build data payload
                const data: Record<string, any> = {}

                // Company details
                if (
                    formData.legal_name ||
                    formData.username ||
                    formData.description ||
                    formData.website_url
                ) {
                    data.company_details = {}
                    if (formData.legal_name) data.company_details.legal_name = formData.legal_name
                    if (formData.username) data.company_details.username = formData.username
                    if (formData.description)
                        data.company_details.description = formData.description
                    if (formData.website_url)
                        data.company_details.website_url = formData.website_url
                }

                // Contact email
                if (formData.email) {
                    data.contacts = [{ email: formData.email }]
                }

                // Profile media structure
                const existingPicture = user.value?.profile_media?.find((m) => m.type === 'picture')
                const existingBanner = user.value?.profile_media?.find((m) => m.type === 'banner')
                const existingGallery =
                    user.value?.profile_media?.filter((m) => m.type === 'gallery') || []

                // Gallery - determine changes FIRST
                const existingGalleryInDB =
                    user.value?.profile_media?.filter((m) => m.type === 'gallery') || []
                const hasNewGalleryImages = gallery && gallery.some((item) => item.file)
                const existingGalleryImages = gallery
                    ? gallery.filter((item) => item.id && !item.file)
                    : []

                // Determine if we need to send gallery data
                const hadGalleryBefore = existingGalleryInDB.length > 0
                const hasGalleryNow = existingGalleryImages.length > 0 || hasNewGalleryImages
                const deletedAllGallery = hadGalleryBefore && !hasGalleryNow

                // Only create profile_media object if we need it
                const hasProfileMediaChanges =
                    profilePicture ||
                    companyCover ||
                    hasNewGalleryImages ||
                    deletedAllGallery ||
                    existingGalleryImages.length > 0

                if (hasProfileMediaChanges) {
                    data.profile_media = {}

                    // Picture - only include if we have an existing id to preserve
                    if (profilePicture && existingPicture) {
                        data.profile_media.picture = { id: existingPicture.id }
                    }

                    // Banner/Cover - only include if we have an existing id to preserve
                    if (companyCover && existingBanner) {
                        data.profile_media.banner = { id: existingBanner.id }
                    }

                    // Gallery
                    if (deletedAllGallery) {
                        // Send empty array to delete all gallery images
                        data.profile_media.gallery = []
                    } else if (hasNewGalleryImages || existingGalleryImages.length > 0) {
                        // Send IDs for existing images that should be kept
                        data.profile_media.gallery = existingGalleryImages.map((item) => ({
                            id: item.id,
                        }))
                    }
                }

                // Build files object
                const files: Record<string, File> = {}

                if (profilePicture) {
                    files['profile_media[picture][file]'] = profilePicture
                }

                if (companyCover) {
                    files['profile_media[banner][file]'] = companyCover
                }

                // Gallery files - add ONLY new images
                if (hasNewGalleryImages && gallery) {
                    const newImages = gallery.filter((item) => item.file)
                    const existingCount = existingGalleryImages.length

                    newImages.forEach((item, newIndex) => {
                        if (item.file) {
                            // New images are added after existing images
                            const arrayIndex = existingCount + newIndex
                            files[`profile_media[gallery][${arrayIndex}][file]`] = item.file
                        }
                    })
                }

                // Call updateProfile with data and files
                await updateProfile(data, Object.keys(files).length > 0 ? files : undefined)
            } catch (error: any) {
                console.error('[UserStore] Failed to update company profile:', error)
                throw error
            }
        }

        const updateDeliveryLocation = async (
            locationData: Partial<DeliveryLocation> | Partial<DeliveryLocation>[]
        ): Promise<void> => {
            try {
                const locationsArray = Array.isArray(locationData) ? locationData : [locationData]

                await updateProfile({
                    delivery_locations: locationsArray,
                })
            } catch (error: any) {
                console.error('[UserStore] Failed to update delivery locations:', error)
                throw error
            }
        }

        const login = async (credentials: any): Promise<LoginResponse> => {
            try {
                const config = useRuntimeConfig()
                const apiBaseURL = config.public.apiBaseURL

                const response = await $fetch<LoginResponse>(`${apiBaseURL}/auth/login`, {
                    method: 'POST',
                    body: credentials,
                })

                if (response?.token && response?.user) {
                    setTokens(response.token, response.refresh)
                    setUser(response.user as ExtendedUser)

                    if (process.client) {
                        startPeriodicRefresh()
                    }

                    return response
                }

                throw createError('API_ERROR', 'Invalid login response')
            } catch (error: any) {
                console.error('[UserStore] Login failed:', error)
                throw error
            }
        }

        const logout = async () => {
            try {
                const config = useRuntimeConfig()
                const apiBaseURL = config.public.apiBaseURL
                const token = getAuthToken()

                if (token) {
                    await $fetch(`${apiBaseURL}/auth/logout`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                    }).catch(() => {})
                }
            } catch (error) {
                console.error('[UserStore] Logout API call failed:', error)
            } finally {
                stopPeriodicRefresh()
                user.value = null
                clearTokens()

                if (process.client) {
                    await navigateTo('/login')
                }
            }
        }

        const logoutExpired = async () => {
            try {
                stopPeriodicRefresh()
                user.value = null
                clearTokens()

                if (process.client) {
                    await navigateTo('/login?session=expired')
                }
            } catch (error) {
                console.error('[UserStore] Logout (expired) failed:', error)
            }
        }

        const resolvePostLoginRedirect = (route?: RouteLocationNormalized): string => {
            try {
                const redirectQuery = route?.query?.redirect as string | undefined

                if (redirectQuery) {
                    try {
                        const url = new URL(redirectQuery, window.location.origin)
                        if (url.origin === window.location.origin) return redirectQuery
                    } catch (error) {}
                }

                const role = primaryRole.value
                if (role === 'supplier') return '/supplier/dashboard'
                else if (role === 'buyer') return '/buyer/dashboard'
                else if (role === 'admin') return '/admin/dashboard'

                return '/'
            } catch (error) {
                return '/'
            }
        }

        const getRegistrationRedirectPath = (): string => {
            try {
                if (!user.value) return '/register/account-type'
                const step = user.value.register_step || 'account-type'
                const substep = user.value.register_substep
                return buildStepRoute(step, substep)
            } catch (error) {
                return '/register/account-type'
            }
        }

        const resolveLoginRedirect = (route?: RouteLocationNormalized): string => {
            try {
                if (!isRegistrationComplete.value) {
                    return getRegistrationRedirectPath()
                }
                return resolvePostLoginRedirect(route)
            } catch (error) {
                return '/'
            }
        }

        const requestPasswordReset = async (email: string): Promise<void> => {
            if (isRequestingPasswordReset.value) {
                throw new Error('A password reset request is already in progress')
            }

            const now = Date.now()
            const timeSinceLastRequest = now - lastPasswordResetRequest.value

            if (timeSinceLastRequest < PASSWORD_RESET_COOLDOWN) {
                const remainingSeconds = Math.ceil(
                    (PASSWORD_RESET_COOLDOWN - timeSinceLastRequest) / 1000
                )
                throw new Error(
                    `Please wait ${remainingSeconds} seconds before requesting another password reset`
                )
            }

            try {
                isRequestingPasswordReset.value = true
                lastPasswordResetRequest.value = now

                const config = useRuntimeConfig()
                const apiBaseURL = config.public.apiBaseURL

                const response = await $fetch<{ success: boolean }>(
                    `${apiBaseURL}/auth/password/forgot`,
                    {
                        method: 'POST',
                        body: { email },
                    }
                )

                if (response?.success) {
                    passwordResetState.value.email = email
                    passwordResetState.value.isResetInProgress = true
                    return Promise.resolve()
                }

                throw new Error('Failed to send password reset email')
            } catch (error: any) {
                console.error('[Auth] Password reset request failed:', error)

                if (error?.response?.status === 429 || error?.statusCode === 429) {
                    const retryAfter = error?.response?.headers?.['retry-after'] || 60
                    throw new Error(
                        `Too many password reset requests. Please try again in ${retryAfter} seconds.`
                    )
                }

                throw error
            } finally {
                isRequestingPasswordReset.value = false
            }
        }

        const resetPassword = async (token: string, password: string): Promise<void> => {
            try {
                const config = useRuntimeConfig()
                const apiBaseURL = config.public.apiBaseURL

                const response = await $fetch<{ success: boolean }>(
                    `${apiBaseURL}/auth/password/reset`,
                    {
                        method: 'POST',
                        body: { token, password },
                    }
                )

                if (response?.success) {
                    clearPasswordResetState()
                    return Promise.resolve()
                }

                throw new Error('Failed to reset password')
            } catch (error: any) {
                console.error('[Auth] Password reset failed:', error)

                if (error?.response?.status === 429 || error?.statusCode === 429) {
                    throw new Error('Too many password reset attempts. Please try again later.')
                }

                throw error
            }
        }

        const setPasswordResetToken = (token: string) => {
            passwordResetState.value.token = token
        }

        const clearPasswordResetState = () => {
            passwordResetState.value = {
                email: null,
                token: null,
                isResetInProgress: false,
            }
            lastPasswordResetRequest.value = 0
            isRequestingPasswordReset.value = false
        }

        const requestEmailLogin = async (email: string): Promise<void> => {
            if (isRequestingEmailLogin.value) {
                throw new Error('An email login request is already in progress')
            }

            const now = Date.now()
            const timeSinceLastRequest = now - lastEmailLoginRequest.value

            if (timeSinceLastRequest < EMAIL_LOGIN_COOLDOWN) {
                const remainingSeconds = Math.ceil(
                    (EMAIL_LOGIN_COOLDOWN - timeSinceLastRequest) / 1000
                )
                throw new Error(
                    `Please wait ${remainingSeconds} seconds before requesting another login link`
                )
            }

            try {
                isRequestingEmailLogin.value = true
                lastEmailLoginRequest.value = now

                const config = useRuntimeConfig()
                const apiBaseURL = config.public.apiBaseURL

                const response = await $fetch<{ success: boolean }>(
                    `${apiBaseURL}/auth/email-login/request`,
                    {
                        method: 'POST',
                        body: { email },
                    }
                )

                if (response?.success) {
                    return Promise.resolve()
                }

                throw new Error('Failed to send login link')
            } catch (error: any) {
                console.error('[Auth] Email login request failed:', error)

                if (error?.response?.status === 429 || error?.statusCode === 429) {
                    const retryAfter = error?.response?.headers?.['retry-after'] || 60
                    throw new Error(
                        `Too many login requests. Please try again in ${retryAfter} seconds.`
                    )
                }

                throw error
            } finally {
                isRequestingEmailLogin.value = false
            }
        }

        const verifyEmailLogin = async (token: string): Promise<void> => {
            try {
                const config = useRuntimeConfig()
                const apiBaseURL = config.public.apiBaseURL

                const response = await $fetch<LoginResponse>(
                    `${apiBaseURL}/auth/email-login/verify`,
                    {
                        method: 'POST',
                        body: { token },
                    }
                )

                if (response?.user && response?.token) {
                    setTokens(response.token, response.refresh)
                    setUser(response.user)
                    isInitialized.value = true

                    if (process.client) {
                        startPeriodicRefresh()
                    }

                    return Promise.resolve()
                }

                throw new Error('Invalid response from server')
            } catch (error: any) {
                console.error('[Auth] Email login verification failed:', error)
                throw error
            }
        }

        const clearEmailLoginState = () => {
            lastEmailLoginRequest.value = 0
            isRequestingEmailLogin.value = false
        }
        const shouldRefreshUser = (): boolean => {
            if (!process.client) return false
            const timeSinceLastFetch = Date.now() - lastFetchTime.value
            return timeSinceLastFetch > 5 * 60 * 1000
        }

        const startPeriodicRefresh = () => {
            if (!process.client || refreshInterval) return

            refreshInterval = setInterval(
                () => {
                    if (isAuthenticated.value && shouldRefreshUser()) {
                        fetchUser(true).catch(() => {})
                    }
                },
                5 * 60 * 1000
            )

            window.addEventListener('beforeunload', stopPeriodicRefresh)
        }

        const stopPeriodicRefresh = () => {
            if (!process.client || !refreshInterval) return

            clearInterval(refreshInterval)
            refreshInterval = null
            window.removeEventListener('beforeunload', stopPeriodicRefresh)
        }

        const doExport = computed<boolean>(() => {
            try {
                const result = user.value?.export_details?.id
                return Boolean(result)
            } catch (error) {
                return false
            }
        })

        // ✅ SUBSCRIPTION PLAN METHODS
        const changePlan = async (planId: number): Promise<boolean> => {
            try {
                updateUserLoading.value = true
                userFetchError.value = null

                const config = useRuntimeConfig()
                const apiBaseURL = config.public.apiBaseURL
                const token = getAuthToken()

                if (!token) {
                    throw new Error('Authentication token not found')
                }

                const response = await $fetch<{ success: boolean }>(
                    `${apiBaseURL}/user/plan/change`,
                    {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: { plan_id: planId },
                    }
                )

                if (response?.success) {
                    // Fetch updated user data
                    await fetchUser(true)
                    return true
                }

                return false
            } catch (error: any) {
                console.error('[User Store] Change plan failed:', error)

                userFetchError.value = createError(
                    'API_ERROR',
                    error?.response?._data?.message || 'Failed to change subscription plan',
                    error?.response?._data?.errors
                )

                return false
            } finally {
                updateUserLoading.value = false
            }
        }

        const cancelPlan = async (): Promise<boolean> => {
            try {
                updateUserLoading.value = true
                userFetchError.value = null

                const config = useRuntimeConfig()
                const apiBaseURL = config.public.apiBaseURL
                const token = getAuthToken()

                if (!token) {
                    throw new Error('Authentication token not found')
                }

                const response = await $fetch<{ success: boolean }>(
                    `${apiBaseURL}/user/plan/cancel`,
                    {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )

                if (response?.success) {
                    // Fetch updated user data
                    await fetchUser(true)
                    return true
                }

                return false
            } catch (error: any) {
                console.error('[User Store] Cancel plan failed:', error)

                userFetchError.value = createError(
                    'API_ERROR',
                    error?.response?._data?.message || 'Failed to cancel subscription plan',
                    error?.response?._data?.errors
                )

                return false
            } finally {
                updateUserLoading.value = false
            }
        }

        // ✅ CONNECTIONS & FOLLOWERS METHODS
        const transformCompanyUser = (apiData: any): CompanyUser => {
            return {
                id: apiData.id,
                email: apiData.email,
                companyDetails: {
                    legalName: apiData.company_details?.legal_name || '',
                    username: apiData.company_details?.username || '',
                    websiteUrl: apiData.company_details?.website_url || '',
                    country: apiData.company_details?.country
                        ? {
                              code: apiData.company_details.country.code,
                              name: apiData.company_details.country.name,
                          }
                        : undefined,
                },
                phoneNumbers: (apiData.phone_numbers || []).map((phone: any) => ({
                    countryCode: phone.country_code,
                    phoneNumber: phone.phone_number,
                })),
                social: {
                    isFollowing: apiData.social?.is_following || false,
                    connection: {
                        id: apiData.social?.connection?.id || null,
                        exists: apiData.social?.connection?.exists || false,
                        status: apiData.social?.connection?.status || null,
                    },
                    followersCount: apiData.social?.followers_count || 0,
                    connectionsCount: apiData.social?.connections_count || 0,
                    productsCount: apiData.social?.products_count || 0,
                },
                picture: apiData.picture || null,
            }
        }

        const fetchConnections = async (
            userIdentifier: string,
            filters: ConnectionsFilters = {}
        ): Promise<ConnectionsResponse | null> => {
            try {
                isLoadingConnections.value = true
                connectionsError.value = null

                const config = useRuntimeConfig()
                const apiBaseURL = config.public.apiBaseURL
                const token = getAuthToken()

                if (!token) {
                    throw new Error('Authentication token not found')
                }

                const params = new URLSearchParams()
                if (filters.page) params.append('page', filters.page.toString())
                if (filters.perPage) params.append('per_page', filters.perPage.toString())
                if (filters.search) params.append('search', filters.search)
                if (filters.companyName) params.append('company_name', filters.companyName)
                if (filters.email) params.append('email', filters.email)
                if (filters.username) params.append('username', filters.username)
                if (filters.sortBy) params.append('sort_by', filters.sortBy)
                if (filters.sortOrder) params.append('sort_order', filters.sortOrder)

                const queryString = params.toString()
                const url = `${apiBaseURL}/user/${userIdentifier}/connections${queryString ? `?${queryString}` : ''}`

                const response = await $fetch<any>(url, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    },
                })

                if (response?.data) {
                    const transformedData = response.data.map(transformCompanyUser)

                    connections.value = transformedData
                    connectionsMeta.value = {
                        currentPage: response.meta.current_page,
                        lastPage: response.meta.last_page,
                        perPage: response.meta.per_page,
                        total: response.meta.total,
                        from: response.meta.from,
                        to: response.meta.to,
                        appliedFilters: response.meta.applied_filters || {},
                    }

                    return {
                        data: transformedData,
                        meta: connectionsMeta.value,
                    }
                }

                return null
            } catch (error: any) {
                console.error('[User Store] Fetch connections failed:', error)

                connectionsError.value = createError(
                    'API_ERROR',
                    error?.data?.message || error?.message || 'Failed to fetch connections',
                    error?.data?.errors
                )

                return null
            } finally {
                isLoadingConnections.value = false
            }
        }

        const fetchFollowers = async (
            userIdentifier: string,
            filters: FollowersFilters
        ): Promise<ConnectionsResponse | null> => {
            try {
                isLoadingFollowers.value = true
                followersError.value = null

                const config = useRuntimeConfig()
                const apiBaseURL = config.public.apiBaseURL
                const token = getAuthToken()

                if (!token) {
                    throw new Error('Authentication token not found')
                }

                const params = new URLSearchParams()
                params.append('type', filters.type)
                if (filters.page) params.append('page', filters.page.toString())
                if (filters.perPage) params.append('per_page', filters.perPage.toString())
                if (filters.search) params.append('search', filters.search)
                if (filters.companyName) params.append('company_name', filters.companyName)
                if (filters.email) params.append('email', filters.email)
                if (filters.username) params.append('username', filters.username)
                if (filters.sortBy) params.append('sort_by', filters.sortBy)
                if (filters.sortOrder) params.append('sort_order', filters.sortOrder)

                const queryString = params.toString()
                const url = `${apiBaseURL}/user/${userIdentifier}/followers${queryString ? `?${queryString}` : ''}`

                const response = await $fetch<any>(url, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    },
                })

                if (response?.data) {
                    const transformedData = response.data.map(transformCompanyUser)

                    followers.value = transformedData
                    followersMeta.value = {
                        currentPage: response.meta.current_page,
                        lastPage: response.meta.last_page,
                        perPage: response.meta.per_page,
                        total: response.meta.total,
                        from: response.meta.from,
                        to: response.meta.to,
                        appliedFilters: response.meta.applied_filters || {},
                    }

                    return {
                        data: transformedData,
                        meta: followersMeta.value,
                    }
                }

                return null
            } catch (error: any) {
                console.error('[User Store] Fetch followers failed:', error)

                followersError.value = createError(
                    'API_ERROR',
                    error?.data?.message || error?.message || 'Failed to fetch followers',
                    error?.data?.errors
                )

                return null
            } finally {
                isLoadingFollowers.value = false
            }
        }

        return {
            user: computed(() => user.value),
            passwordResetState: computed(() => passwordResetState.value),
            isLoadingUser: computed(() => isLoadingUser.value),
            userFetchError: computed(() => userFetchError.value),
            isInitialized: computed(() => isInitialized.value),
            isRequestingPasswordReset: computed(() => isRequestingPasswordReset.value),

            getAuthToken,
            getRefreshToken,
            hasValidToken,

            roles,
            primaryRole,
            plan,
            currentPlan,
            isAuthenticated,
            isRegistrationComplete,
            doExport,
            currentRegistrationStep,
            currentRegistrationSubstep,
            canAccess,
            hasRole: (r: UserRoleCode) => hasRole(user.value, r),

            isVerified,
            isRejected,
            isPending,
            isUnverified,
            isAdmin,
            isSupplier,
            isBuyer,
            isServiceProvider,
            isLiteSupplier,
            isHybridUser: isHybridUserComputed,
            userDisplayName,
            userAvatar,
            userInitials,
            updateUserLoading,
            defaultCurrency,
            currencySymbol,
            currencyCode,
            userName,
            login,
            logout,
            logoutExpired,
            setTokens,
            clearTokens,
            initializeUser,
            updateUser,
            setUser,
            fetchUser,
            setInitialized,
            initializeFromStorage,

            // ✅ NEW PROFILE UPDATE METHODS
            updateProfile,
            updateCurrency,
            updateUserCurrency,
            updateLocalCurrency,
            updateExportCurrency,
            updateCompanyDetails,
            updateExportDetails,
            uploadProfilePicture,
            uploadBanner,
            updateCompanyProfile,
            updateDeliveryLocation,

            shouldRefreshUser,
            startPeriodicRefresh,
            stopPeriodicRefresh,

            getRegistrationRedirectPath,
            resolveLoginRedirect,
            resolvePostLoginRedirect,

            requestPasswordReset,
            resetPassword,
            setPasswordResetToken,
            clearPasswordResetState,
            requestEmailLogin,
            verifyEmailLogin,
            clearEmailLoginState,

            // Subscription methods
            changePlan,
            cancelPlan,

            // ✅ Connections & Followers
            connections: computed(() => connections.value),
            connectionsMeta: computed(() => connectionsMeta.value),
            isLoadingConnections: computed(() => isLoadingConnections.value),
            connectionsError: computed(() => connectionsError.value),

            followers: computed(() => followers.value),
            followersMeta: computed(() => followersMeta.value),
            isLoadingFollowers: computed(() => isLoadingFollowers.value),
            followersError: computed(() => followersError.value),

            fetchConnections,
            fetchFollowers,
        }
    },
    {
        persist: {
            storage: piniaPluginPersistedstate.localStorage(),
            pick: ['defaultCurrency', 'currencySymbol', 'currencyCode'],
        },
    }
)
