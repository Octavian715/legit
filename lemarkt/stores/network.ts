import { defineStore, acceptHMRUpdate } from 'pinia'
import { NetworkService } from '~/services/network'
import type {
    NetworkConnection,
    NetworkFollower,
    NetworkInvitation,
    NetworkListResponse,
    NetworkStatsResponse,
    NetworkFilterOptions,
    InvitationFilterOptions,
    ConnectionType,
    FollowerType,
    NetworkFilters,
    InvitationFilters,
    NetworkStatsFilters,
    ApiError,
} from '~/types/network'

export const useNetworkStore = defineStore('network', () => {
    const networkService = new NetworkService()

    const networkRefreshKey = ref(0)
    const connections = ref<NetworkConnection[]>([])
    const followers = ref<NetworkFollower[]>([])
    const invitations = ref<NetworkInvitation[]>([])
    const connectionsMeta = ref<NetworkListResponse<NetworkConnection>['meta'] | null>(null)
    const followersMeta = ref<NetworkListResponse<NetworkFollower>['meta'] | null>(null)
    const invitationsMeta = ref<NetworkListResponse<NetworkInvitation>['meta'] | null>(null)

    const connectionStats = ref<NetworkStatsResponse | null>(null)
    const followerStats = ref<NetworkStatsResponse | null>(null)
    const disconnectionStats = ref<NetworkStatsResponse | null>(null)
    const unfollowerStats = ref<NetworkStatsResponse | null>(null)

    const connectionFilters = ref<NetworkFilterOptions | null>(null)
    const followerFilters = ref<NetworkFilterOptions | null>(null)
    const invitationFilters = ref<InvitationFilterOptions | null>(null)

    const isLoading = ref<boolean>(false)
    const error = ref<ApiError | null>(null)

    const currentConnectionFilters = ref<NetworkFilters>({})
    const currentConnectionType = ref<ConnectionType>('accepted')

    const totalConnections = computed<number>(() => {
        return connectionsMeta.value?.total || 0
    })

    const totalFollowers = computed<number>(() => {
        return followersMeta.value?.total || 0
    })

    const totalInvitations = computed<number>(() => {
        return invitationsMeta.value?.total || 0
    })

    const hasConnections = computed<boolean>(() => {
        return Array.isArray(connections.value) && connections.value.length > 0
    })

    const hasFollowers = computed<boolean>(() => {
        return Array.isArray(followers.value) && followers.value.length > 0
    })

    const hasInvitations = computed<boolean>(() => {
        return Array.isArray(invitations.value) && invitations.value.length > 0
    })

    const getConnectionById = computed(() => {
        return (connectionId: number) => {
            if (!Array.isArray(connections.value)) return undefined
            return connections.value.find((connection) => connection.id === connectionId)
        }
    })

    const getFollowerById = computed(() => {
        return (followerId: number) => {
            if (!Array.isArray(followers.value)) return undefined
            return followers.value.find((follower) => follower.id === followerId)
        }
    })

    const getInvitationById = computed(() => {
        return (invitationId: number) => {
            if (!Array.isArray(invitations.value)) return undefined
            return invitations.value.find((invitation) => invitation.id === invitationId)
        }
    })

    const resetError = (): void => {
        error.value = null
    }

    const handleError = (e: any): void => {
        const apiError: ApiError = {
            message: e.data?.message || e.message || 'An error occurred',
            errors: e.data?.errors,
            statusCode: e.statusCode || 500,
        }
        error.value = apiError
        console.error('Network error:', apiError)
        throw apiError
    }

    const fetchConnections = async (
        type: ConnectionType,
        filters: NetworkFilters = {}
    ): Promise<NetworkListResponse<NetworkConnection> | undefined> => {
        if (isLoading.value) return

        isLoading.value = true
        resetError()

        try {
            const cleanFilters: NetworkFilters = {}

            if (filters.search?.trim()) cleanFilters.search = filters.search.trim()
            if (filters.business_type_ids?.length)
                cleanFilters.business_type_ids = filters.business_type_ids
            if (filters.country_ids?.length) cleanFilters.country_ids = filters.country_ids
            if (filters.spoken_language_ids?.length)
                cleanFilters.spoken_language_ids = filters.spoken_language_ids
            if (filters.start_date) cleanFilters.start_date = filters.start_date
            if (filters.end_date) cleanFilters.end_date = filters.end_date
            if (filters.page && filters.page > 0) cleanFilters.page = filters.page
            if (filters.per_page && filters.per_page > 0) cleanFilters.per_page = filters.per_page
            if (filters.sort_by) cleanFilters.sort_by = filters.sort_by
            if (filters.sort_direction) cleanFilters.sort_direction = filters.sort_direction

            const response = await networkService.fetchConnections(type, cleanFilters)

            connections.value = Array.isArray(response.data) ? response.data : []
            connectionsMeta.value = response.meta
            currentConnectionFilters.value = cleanFilters
            currentConnectionType.value = type

            return response
        } catch (e) {
            handleError(e)
            connections.value = []
            connectionsMeta.value = null
            return undefined
        } finally {
            isLoading.value = false
        }
    }

    const fetchConnectionFilters = async (): Promise<NetworkFilterOptions | null> => {
        if (isLoading.value) return connectionFilters.value

        isLoading.value = true
        resetError()

        try {
            const response = await networkService.fetchConnectionFilters()
            connectionFilters.value = response
            return connectionFilters.value
        } catch (e) {
            handleError(e)
            connectionFilters.value = null
            return null
        } finally {
            isLoading.value = false
        }
    }

    const fetchFollowers = async (
        type: FollowerType,
        filters: NetworkFilters = {}
    ): Promise<NetworkListResponse<NetworkFollower> | undefined> => {
        if (isLoading.value) return

        isLoading.value = true
        resetError()

        try {
            const cleanFilters: NetworkFilters = {}

            if (filters.search?.trim()) cleanFilters.search = filters.search.trim()
            if (filters.business_type_ids?.length)
                cleanFilters.business_type_ids = filters.business_type_ids
            if (filters.country_ids?.length) cleanFilters.country_ids = filters.country_ids
            if (filters.spoken_language_ids?.length)
                cleanFilters.spoken_language_ids = filters.spoken_language_ids
            if (filters.start_date) cleanFilters.start_date = filters.start_date
            if (filters.end_date) cleanFilters.end_date = filters.end_date
            if (filters.page && filters.page > 0) cleanFilters.page = filters.page
            if (filters.per_page && filters.per_page > 0) cleanFilters.per_page = filters.per_page
            if (filters.sort_by) cleanFilters.sort_by = filters.sort_by
            if (filters.sort_direction) cleanFilters.sort_direction = filters.sort_direction

            const response = await networkService.fetchFollowers(type, cleanFilters)

            followers.value = Array.isArray(response.data) ? response.data : []
            followersMeta.value = response.meta

            return response
        } catch (e) {
            handleError(e)
            followers.value = []
            followersMeta.value = null
            return undefined
        } finally {
            isLoading.value = false
        }
    }

    const fetchFollowerFilters = async (): Promise<NetworkFilterOptions | null> => {
        if (isLoading.value) return followerFilters.value

        isLoading.value = true
        resetError()

        try {
            followerFilters.value = await networkService.fetchFollowerFilters()
            return followerFilters.value
        } catch (e) {
            handleError(e)
            followerFilters.value = null
            return null
        } finally {
            isLoading.value = false
        }
    }

    const fetchInvitations = async (
        filters: InvitationFilters = {}
    ): Promise<NetworkListResponse<NetworkInvitation> | undefined> => {
        if (isLoading.value) return

        isLoading.value = true
        resetError()

        try {
            const cleanFilters: InvitationFilters = {}

            if (filters.search?.trim()) cleanFilters.search = filters.search.trim()

            // Handle status as array - ensure it's always an array if provided
            if (filters.status) {
                if (Array.isArray(filters.status) && filters.status.length > 0) {
                    cleanFilters.status = filters.status.filter(Boolean)
                } else if (typeof filters.status === 'string' && filters.status.trim()) {
                    // Backward compatibility for single status values
                    cleanFilters.status = [filters.status.trim()]
                }
            }

            if (filters.start_date) cleanFilters.start_date = filters.start_date
            if (filters.end_date) cleanFilters.end_date = filters.end_date
            if (filters.page && filters.page > 0) cleanFilters.page = filters.page
            if (filters.per_page && filters.per_page > 0) cleanFilters.per_page = filters.per_page
            if (filters.sort_by) cleanFilters.sort_by = filters.sort_by
            if (filters.sort_direction) cleanFilters.sort_direction = filters.sort_direction

            const response = await networkService.fetchInvitations(cleanFilters)

            invitations.value = Array.isArray(response.data) ? response.data : []
            invitationsMeta.value = response.meta

            return response
        } catch (e) {
            handleError(e)
            invitations.value = []
            invitationsMeta.value = null
            return undefined
        } finally {
            isLoading.value = false
        }
    }

    const fetchInvitationFilters = async (): Promise<InvitationFilterOptions | null> => {
        if (isLoading.value) return invitationFilters.value

        isLoading.value = true
        resetError()

        try {
            invitationFilters.value = await networkService.fetchInvitationFilters()
            return invitationFilters.value
        } catch (e) {
            handleError(e)
            invitationFilters.value = null
            return null
        } finally {
            isLoading.value = false
        }
    }

    const fetchConnectionStats = async (filters: NetworkStatsFilters = {}): Promise<void> => {
        if (isLoading.value) return

        isLoading.value = true
        resetError()

        try {
            connectionStats.value = await networkService.fetchTotalConnections(filters)
        } catch (e) {
            handleError(e)
            connectionStats.value = null
        } finally {
            isLoading.value = false
        }
    }

    const fetchFollowerStats = async (filters: NetworkStatsFilters = {}): Promise<void> => {
        if (isLoading.value) return

        isLoading.value = true
        resetError()

        try {
            followerStats.value = await networkService.fetchTotalFollowers(filters)
        } catch (e) {
            handleError(e)
            followerStats.value = null
        } finally {
            isLoading.value = false
        }
    }

    const fetchDisconnectionStats = async (filters: NetworkStatsFilters = {}): Promise<void> => {
        if (isLoading.value) return

        isLoading.value = true
        resetError()

        try {
            disconnectionStats.value = await networkService.fetchTotalDisconnections(filters)
        } catch (e) {
            handleError(e)
            disconnectionStats.value = null
        } finally {
            isLoading.value = false
        }
    }

    const fetchUnfollowerStats = async (filters: NetworkStatsFilters = {}): Promise<void> => {
        if (isLoading.value) return

        isLoading.value = true
        resetError()

        try {
            unfollowerStats.value = await networkService.fetchTotalUnfollowers(filters)
        } catch (e) {
            handleError(e)
            unfollowerStats.value = null
        } finally {
            isLoading.value = false
        }
    }

    const clearConnections = (): void => {
        connections.value = []
        connectionsMeta.value = null
        currentConnectionFilters.value = {}
    }

    const clearFollowers = (): void => {
        followers.value = []
        followersMeta.value = null
    }

    const clearInvitations = (): void => {
        invitations.value = []
        invitationsMeta.value = null
    }

    const clearStats = (): void => {
        connectionStats.value = null
        followerStats.value = null
        disconnectionStats.value = null
        unfollowerStats.value = null
    }

    const clearFilters = (): void => {
        connectionFilters.value = null
        followerFilters.value = null
        invitationFilters.value = null
        currentConnectionFilters.value = {}
    }

    const clearCache = (): void => {
        clearConnections()
        clearFollowers()
        clearInvitations()
        clearStats()
        clearFilters()
    }

    const getActiveFilters = computed((): number => {
        const filters = { ...currentConnectionFilters.value }

        delete filters.page
        delete filters.per_page
        delete filters.sort_by
        delete filters.sort_direction

        return Object.keys(filters).filter((key) => {
            const value = filters[key as keyof NetworkFilters]
            return (
                value !== undefined &&
                value !== null &&
                value !== '' &&
                !(Array.isArray(value) && value.length === 0)
            )
        }).length
    })

    return {
        // State
        connections: computed(() => (Array.isArray(connections.value) ? connections.value : [])),
        followers: computed(() => (Array.isArray(followers.value) ? followers.value : [])),
        invitations: computed(() => (Array.isArray(invitations.value) ? invitations.value : [])),
        networkRefreshKey,
        connectionsMeta,
        followersMeta,
        invitationsMeta,
        connectionStats,
        followerStats,
        disconnectionStats,
        unfollowerStats,
        connectionFilters,
        followerFilters,
        invitationFilters,
        isLoading,
        error,
        currentConnectionFilters,
        currentConnectionType,

        // Computed
        totalConnections,
        totalFollowers,
        totalInvitations,
        hasConnections,
        hasFollowers,
        hasInvitations,
        getConnectionById,
        getFollowerById,
        getInvitationById,
        getActiveFilters,

        // Actions
        fetchConnections,
        fetchConnectionFilters,
        fetchFollowers,
        fetchFollowerFilters,
        fetchInvitations,
        fetchInvitationFilters,
        fetchConnectionStats,
        fetchFollowerStats,
        fetchDisconnectionStats,
        fetchUnfollowerStats,
        clearConnections,
        clearFollowers,
        clearInvitations,
        clearStats,
        clearFilters,
        clearCache,
        resetError,
    }
})

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useNetworkStore, import.meta.hot))
}
