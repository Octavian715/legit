import type {
    ConnectionType,
    FollowerType,
    NetworkFilters,
    NetworkStatsFilters,
    SortField,
    SortDirection,
    ConnectionFilters,
} from '~/types/network'

export const useNetwork = () => {
    const networkStore = useNetworkStore()

    const { t } = useI18n()
    const toast = useToastNotification()
    const { networkRefreshKey } = storeToRefs(networkStore)

    const triggerRefresh = ref(0)

    const transformConnectionFiltersToApi = (
        connectionFilters: ConnectionFilters
    ): NetworkFilters => {
        const apiFilters: NetworkFilters = {}

        if (connectionFilters.search?.trim()) {
            apiFilters.search = connectionFilters.search.trim()
        }

        if (connectionFilters.businessTypeIds?.length) {
            apiFilters.business_type_ids = connectionFilters.businessTypeIds
        }

        if (connectionFilters.countryIds?.length) {
            apiFilters.country_ids = connectionFilters.countryIds
        }

        if (connectionFilters.spokenLanguageIds?.length) {
            apiFilters.spoken_language_ids = connectionFilters.spokenLanguageIds
        }

        if (connectionFilters.dateRange) {
            apiFilters.start_date = connectionFilters.dateRange.startDate
            apiFilters.end_date = connectionFilters.dateRange.endDate
        }

        if (connectionFilters.sortBy) {
            apiFilters.sort_by = connectionFilters.sortBy
        }

        if (connectionFilters.sortDirection) {
            apiFilters.sort_direction = connectionFilters.sortDirection
        }

        if (connectionFilters.page) {
            apiFilters.page = connectionFilters.page
        }

        if (connectionFilters.per_page) {
            apiFilters.per_page = connectionFilters.per_page
        }

        return apiFilters
    }

    const transformApiFiltersToConnection = (apiFilters: NetworkFilters): ConnectionFilters => {
        const connectionFilters: ConnectionFilters = {}

        if (apiFilters.search?.trim()) {
            connectionFilters.search = apiFilters.search.trim()
        }

        if (apiFilters.business_type_ids?.length) {
            connectionFilters.businessTypeIds = apiFilters.business_type_ids
        }

        if (apiFilters.country_ids?.length) {
            connectionFilters.countryIds = apiFilters.country_ids
        }

        if (apiFilters.spoken_language_ids?.length) {
            connectionFilters.spokenLanguageIds = apiFilters.spoken_language_ids
        }

        if (apiFilters.start_date && apiFilters.end_date) {
            connectionFilters.dateRange = {
                startDate: apiFilters.start_date,
                endDate: apiFilters.end_date,
            }
        }

        if (apiFilters.sort_by) {
            connectionFilters.sortBy = apiFilters.sort_by
        }

        if (apiFilters.sort_direction) {
            connectionFilters.sortDirection = apiFilters.sort_direction
        }

        if (apiFilters.page) {
            connectionFilters.page = apiFilters.page
        }

        if (apiFilters.per_page) {
            connectionFilters.per_page = apiFilters.per_page
        }

        return connectionFilters
    }

    const validateConnectionFilters = (
        filters: ConnectionFilters
    ): { isValid: boolean; errors: string[] } => {
        const errors: string[] = []

        if (filters.search) {
            const trimmedSearch = filters.search.trim()
            if (trimmedSearch.length > 0 && trimmedSearch.length < 2) {
                errors.push(t('filters.searchTooShort'))
            }
            if (trimmedSearch.length > 100) {
                errors.push(t('filters.searchTooLong'))
            }
        }

        if (filters.spokenLanguageIds && filters.spokenLanguageIds.length > 10) {
            errors.push(t('filters.tooManyLanguages'))
        }

        if (filters.businessTypeIds && filters.businessTypeIds.length > 20) {
            errors.push(t('filters.tooManyBusinessTypes'))
        }

        if (filters.countryIds && filters.countryIds.length > 50) {
            errors.push(t('filters.tooManyCountries'))
        }

        if (filters.dateRange) {
            const startDate = new Date(filters.dateRange.startDate)
            const endDate = new Date(filters.dateRange.endDate)

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                errors.push(t('filters.invalidDates'))
            } else {
                if (startDate > endDate) {
                    errors.push(t('filters.invalidDateRange'))
                }

                const daysDifference =
                    Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                if (daysDifference > 365) {
                    errors.push(t('filters.dateRangeTooLarge'))
                }

                const now = new Date()
                if (startDate > now || endDate > now) {
                    errors.push(t('filters.futureDatesNotAllowed'))
                }
            }
        }

        if (filters.page !== undefined && filters.page < 1) {
            errors.push(t('filters.invalidPage'))
        }

        if (filters.per_page !== undefined && (filters.per_page < 1 || filters.per_page > 100)) {
            errors.push(t('filters.invalidPerPage'))
        }

        return {
            isValid: errors.length === 0,
            errors,
        }
    }

    const getConnectionsWithFilters = async (
        type: ConnectionType,
        filters: ConnectionFilters = {}
    ): Promise<boolean> => {
        try {
            const validation = validateConnectionFilters(filters)
            if (!validation.isValid) {
                validation.errors.forEach((error) => toast.error(error))
                return false
            }

            const apiFilters = transformConnectionFiltersToApi(filters)
            const result = await networkStore.fetchConnections(type, apiFilters)
            return !!result
        } catch (error: any) {
            const message =
                error.statusCode === 422
                    ? t('network.validationError')
                    : t('network.connectionsError')
            toast.error(error.message || message)
            return false
        }
    }

    const getFollowersWithFilters = async (
        type: FollowerType,
        filters: ConnectionFilters = {}
    ): Promise<boolean> => {
        try {
            const validation = validateConnectionFilters(filters)
            if (!validation.isValid) {
                validation.errors.forEach((error) => toast.error(error))
                return false
            }

            const apiFilters = transformConnectionFiltersToApi(filters)
            const result = await networkStore.fetchFollowers(type, apiFilters)
            return !!result
        } catch (error: any) {
            const message =
                error.statusCode === 422
                    ? t('network.validationError')
                    : t('network.followersError')
            toast.error(error.message || message)
            return false
        }
    }

    const getConnectionStats = async (filters: NetworkStatsFilters = {}): Promise<boolean> => {
        try {
            await networkStore.fetchConnectionStats(filters)
            return true
        } catch (error: any) {
            toast.error(error.message || t('network.statsError'))
            return false
        }
    }

    const getFollowerStats = async (filters: NetworkStatsFilters = {}): Promise<boolean> => {
        try {
            await networkStore.fetchFollowerStats(filters)
            return true
        } catch (error: any) {
            toast.error(error.message || t('network.statsError'))
            return false
        }
    }

    const getDisconnectionStats = async (filters: NetworkStatsFilters = {}): Promise<boolean> => {
        try {
            await networkStore.fetchDisconnectionStats(filters)
            return true
        } catch (error: any) {
            toast.error(error.message || t('network.statsError'))
            return false
        }
    }

    const getUnfollowerStats = async (filters: NetworkStatsFilters = {}): Promise<boolean> => {
        try {
            await networkStore.fetchUnfollowerStats(filters)
            return true
        } catch (error: any) {
            toast.error(error.message || t('network.statsError'))
            return false
        }
    }

    const loadConnectionFilters = async (): Promise<boolean> => {
        try {
            await networkStore.fetchConnectionFilters()
            return true
        } catch (error: any) {
            toast.error(error.message || t('network.filtersError'))
            return false
        }
    }

    const loadFollowerFilters = async (): Promise<boolean> => {
        try {
            await networkStore.fetchFollowerFilters()
            return true
        } catch (error: any) {
            toast.error(error.message || t('network.filtersError'))
            return false
        }
    }

    const buildFilters = (
        search?: string,
        businessTypeIds?: number[],
        countryIds?: number[],
        spokenLanguageIds?: number[],
        dateRange?: { startDate: string; endDate: string },
        pagination?: { page: number; perPage: number },
        sort?: { sortBy: SortField; sortDirection: SortDirection }
    ): NetworkFilters => {
        return {
            ...(search?.trim() && { search: search.trim() }),
            ...(businessTypeIds?.length && { business_type_ids: businessTypeIds }),
            ...(countryIds?.length && { country_ids: countryIds }),
            ...(spokenLanguageIds?.length && { spoken_language_ids: spokenLanguageIds }),
            ...(dateRange && {
                start_date: dateRange.startDate,
                end_date: dateRange.endDate,
            }),
            ...(pagination && {
                page: pagination.page,
                per_page: pagination.perPage,
            }),
            ...(sort && {
                sort_by: sort.sortBy,
                sort_direction: sort.sortDirection,
            }),
        }
    }

    const buildStatsFilters = (
        period?: 'today' | 'last_month' | 'last_year',
        customRange?: { startDate: string; endDate: string }
    ): NetworkStatsFilters => {
        if (customRange) {
            return {
                start_date: customRange.startDate,
                end_date: customRange.endDate,
            }
        }
        return period ? { period } : {}
    }

    const formatConnectionStatus = (status: string): string => {
        switch (status) {
            case 'pending':
                return t('network.status.pending')
            case 'accepted':
                return t('network.status.accepted')
            case 'rejected':
                return t('network.status.rejected')
            case 'declined':
                return t('network.status.declined')
            default:
                return status
        }
    }

    const formatMutualConnections = (count: number): string => {
        if (count === 0) return t('network.noMutualConnections')
        if (count === 1) return t('network.oneMutualConnection')
        return t('network.mutualConnections', { count })
    }

    const isConnectionPending = (connection: any): boolean => {
        return connection?.status === 'pending'
    }

    const isConnectionAccepted = (connection: any): boolean => {
        return connection?.status === 'accepted'
    }

    const isConnectionRejected = (connection: any): boolean => {
        return connection?.status === 'rejected' || connection?.status === 'declined'
    }

    const getConnectionsCount = computed(() => {
        return networkStore.totalConnections
    })

    const getFollowersCount = computed(() => {
        return networkStore.totalFollowers
    })

    const canLoadMore = computed(() => {
        const connectionsMeta = networkStore.connectionsMeta
        const followersMeta = networkStore.followersMeta

        return {
            connections: connectionsMeta
                ? connectionsMeta.current_page < connectionsMeta.last_page
                : false,
            followers: followersMeta ? followersMeta.current_page < followersMeta.last_page : false,
        }
    })

    /**
     * Map API meta.counts_by_type to tab structure
     * Example API response meta: { counts_by_type: { requests: 0, accepted: 5, "my-requests": 21, declined: 0 } }
     * Returns: { requests: 0, accepted: 5, "my-requests": 21, declined: 0 }
     */
    const mapMetaCountsToTabs = (meta: any): Record<string, number> => {
        const counts: Record<string, number> = {
            accepted: 0,
            'my-requests': 0,
            requests: 0,
            declined: 0,
        }

        if (meta?.counts_by_type) {
            Object.entries(meta.counts_by_type).forEach(([key, value]) => {
                if (key in counts) {
                    counts[key] = Number(value) || 0
                }
            })
        }

        return counts
    }
    watch(
        () => networkRefreshKey.value,
        async () => {
            await triggerRefresh.value++
        }
    )
    return {
        // State
        triggerRefresh,
        isLoading: computed(() => networkStore.isLoading),
        error: computed(() => networkStore.error),
        connections: computed(() => networkStore.connections),
        followers: computed(() => networkStore.followers),
        connectionsMeta: computed(() => networkStore.connectionsMeta),
        followersMeta: computed(() => networkStore.followersMeta),
        connectionStats: computed(() => networkStore.connectionStats),
        followerStats: computed(() => networkStore.followerStats),
        disconnectionStats: computed(() => networkStore.disconnectionStats),
        unfollowerStats: computed(() => networkStore.unfollowerStats),
        connectionFilters: computed(() => networkStore.connectionFilters),
        followerFilters: computed(() => networkStore.followerFilters),

        // Computed
        getConnectionsCount,
        getFollowersCount,
        canLoadMore,

        // Methods
        getConnectionsWithFilters,
        getFollowersWithFilters,
        getConnectionStats,
        getFollowerStats,
        getDisconnectionStats,
        getUnfollowerStats,
        loadConnectionFilters,
        loadFollowerFilters,
        buildFilters,
        buildStatsFilters,
        formatConnectionStatus,
        formatMutualConnections,
        isConnectionPending,
        isConnectionAccepted,
        isConnectionRejected,
        transformConnectionFiltersToApi,
        transformApiFiltersToConnection,
        validateConnectionFilters,
        mapMetaCountsToTabs,

        // Store actions
        clearConnections: networkStore.clearConnections,
        clearFollowers: networkStore.clearFollowers,
        clearStats: networkStore.clearStats,
        clearFilters: networkStore.clearFilters,
        clearCache: networkStore.clearCache,
        resetError: networkStore.resetError,
    }
}
