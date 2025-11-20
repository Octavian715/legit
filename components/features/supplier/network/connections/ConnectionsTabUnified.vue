<template>
    <ConnectionsTable
        :connections="connections"
        :meta="connectionsMeta"
        :loading="isLoading"
        :show-pagination="true"
        :show-disconnect="connectionType === 'accepted'"
        :show-cancel-disconnect="connectionType === 'my-requests' || connectionType === 'requests'"
        :show-accept="connectionType === 'requests'"
        :show-decline="connectionType === 'requests'"
        :current-page="currentPage"
        :items-per-page="itemsPerPage"
        :sort-by="sortBy"
        :sort-direction="sortDirection"
        @page-change="handlePageChange"
        @items-per-page-change="handleItemsPerPageChange"
        @sort-change="handleSortChange"
        @action="handleAction"
    />
</template>

<script setup lang="ts">
    import { ref, watch, onMounted, nextTick, computed } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useRoute, useRouter } from '#imports'
    import { useDebounceFn } from '@vueuse/core'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { useNetwork } from '~/composables/useNetwork'

    import type {
        NetworkFilters,
        ConnectionSortField,
        ConnectionType,
        ConnectionFilters,
    } from '~/types/network'
    import type { SortDirection } from '~/types/ui/table'

    interface Props {
        connectionType: ConnectionType
        filters: NetworkFilters
        refreshKey: number
        activeTabKey?: string
    }

    const props = withDefaults(defineProps<Props>(), {
        filters: () => ({
            search: '',
            business_type_ids: [],
            country_ids: [],
            spoken_language_ids: [],
        }),
        refreshKey: 0,
        activeTabKey: 'accepted',
    })

    const emit = defineEmits<{
        'open-filters': []
        'update-counts': [meta: any]
        action: [action: { type: string; connectionId: number; userName: string; userId?: number }]
    }>()

    const { t } = useI18n()
    const toast = useToastNotification()
    const route = useRoute()
    const router = useRouter()

    const {
        connections,
        connectionsMeta,
        isLoading,
        error,
        getConnectionsWithFilters,
        resetError,
    } = useNetwork()

    const totalItems = computed(() => connectionsMeta.value?.total || 0)

    interface TabPaginationState {
        currentPage: number
        itemsPerPage: number
        sortBy?: ConnectionSortField
        sortDirection?: SortDirection
    }

    const tabStates = ref<Record<ConnectionType, TabPaginationState>>({
        accepted: { currentPage: 1, itemsPerPage: 10 },
        'my-requests': { currentPage: 1, itemsPerPage: 10 },
        requests: { currentPage: 1, itemsPerPage: 10 },
        declined: { currentPage: 1, itemsPerPage: 10 },
    })

    // ✅ Get current tab state
    const currentTabState = computed(() => tabStates.value[props.connectionType])

    // ✅ Reactive refs that sync with current tab state
    const currentPage = computed({
        get: () => currentTabState.value.currentPage,
        set: (val) => {
            tabStates.value[props.connectionType].currentPage = val
        },
    })

    const itemsPerPage = computed({
        get: () => currentTabState.value.itemsPerPage,
        set: (val) => {
            tabStates.value[props.connectionType].itemsPerPage = val
        },
    })

    const sortBy = computed({
        get: () => currentTabState.value.sortBy,
        set: (val) => {
            tabStates.value[props.connectionType].sortBy = val
        },
    })

    const sortDirection = computed({
        get: () => currentTabState.value.sortDirection,
        set: (val) => {
            tabStates.value[props.connectionType].sortDirection = val
        },
    })

    const totalPages = computed(() => {
        if (totalItems.value === 0 || itemsPerPage.value === 0) return 1
        return Math.ceil(totalItems.value / itemsPerPage.value)
    })

    const isFetching = ref(false)
    const isInitialized = ref(false)
    let currentRequestId = 0

    // ✅ NEW: Sync state with URL
    const updateURL = async (skipNavigation = false) => {
        if (!isInitialized.value || skipNavigation) return

        // ✅ FIXED: Wait a tick to ensure parent has updated tab in URL first
        await nextTick()

        const query: Record<string, string> = {
            ...route.query,
            tab: props.activeTabKey || props.connectionType,
        }

        // Add pagination params for current tab
        if (currentPage.value > 1) {
            query.page = String(currentPage.value)
        } else {
            delete query.page
        }

        if (itemsPerPage.value !== 10) {
            query.per_page = String(itemsPerPage.value)
        } else {
            delete query.per_page
        }

        // Add sorting params if present
        if (sortBy.value) {
            query.sort_by = sortBy.value
            query.sort_direction = sortDirection.value || 'asc'
        } else {
            delete query.sort_by
            delete query.sort_direction
        }

        // Only push if query actually changed
        const currentQuery = JSON.stringify(route.query)
        const newQuery = JSON.stringify(query)

        if (currentQuery !== newQuery) {
            await router.replace({ query })
        }
    }

    // ✅ NEW: Read state from URL - only on initial mount
    const initializeFromURL = (isInitialMount: boolean = false) => {
        if (isInitialMount) {
            // Only read URL params on first mount
            const page = parseInt(route.query.page as string) || 1
            const perPage = parseInt(route.query.per_page as string) || 10
            const sortByParam = route.query.sort_by as ConnectionSortField | undefined
            const sortDirParam = route.query.sort_direction as SortDirection | undefined

            currentPage.value = page
            itemsPerPage.value = perPage
            sortBy.value = sortByParam
            sortDirection.value = sortDirParam
        }
        // On tab change, state is already correct from tabStates
        // Don't override with URL params

        isInitialized.value = true
    }

    const fetchConnections = async (): Promise<boolean> => {
        if (isFetching.value) {
            return false
        }

        const requestId = ++currentRequestId

        try {
            isFetching.value = true
            resetError()

            if (requestId !== currentRequestId) return false

            if (currentPage.value > totalPages.value && totalPages.value > 0) {
                currentPage.value = totalPages.value
            }

            // Transform NetworkFilters (from props) to ConnectionFilters format
            const connectionFilters: ConnectionFilters = {
                search: props.filters.search,
                businessTypeIds: props.filters.business_type_ids,
                countryIds: props.filters.country_ids,
                spokenLanguageIds: props.filters.spoken_language_ids,
                dateRange:
                    props.filters.start_date && props.filters.end_date
                        ? {
                              startDate: props.filters.start_date,
                              endDate: props.filters.end_date,
                          }
                        : undefined,
                page: currentPage.value,
                per_page: itemsPerPage.value,
                sortBy: sortBy.value,
                sortDirection: sortDirection.value,
            }

            // ✅ Use getConnectionsWithFilters from useNetwork
            const success = await getConnectionsWithFilters(props.connectionType, connectionFilters)

            if (requestId !== currentRequestId) return false

            if (success && connectionsMeta.value) {
                // Emit the entire meta to parent for counts_by_type extraction
                emit('update-counts', connectionsMeta.value)

                const newTotalPages =
                    Math.ceil((connectionsMeta.value.total || 0) / itemsPerPage.value) || 1
                if (currentPage.value > newTotalPages && newTotalPages > 0) {
                    currentPage.value = newTotalPages
                    await updateURL()
                    return fetchConnections()
                }
            }

            // ✅ Update URL after successful fetch
            await updateURL()

            return success
        } catch (error: any) {
            if (requestId !== currentRequestId) return false
            console.error(`[ConnectionsTabUnified] Failed to fetch ${props.connectionType}:`, error)
            toast.error(error.message || t('network.errors.fetchFailed'))
            return false
        } finally {
            if (requestId === currentRequestId) {
                isFetching.value = false
            }
        }
    }

    const debouncedFetch = useDebounceFn(fetchConnections, 300)

    const handlePageChange = async (page: number) => {
        if (currentPage.value === page || isFetching.value) return
        const maxPage = Math.max(1, totalPages.value)
        const validPage = Math.max(1, Math.min(page, maxPage))
        currentPage.value = validPage
        await nextTick()
        await fetchConnections()
    }

    const handleItemsPerPageChange = async (newItemsPerPage: number) => {
        if (itemsPerPage.value === newItemsPerPage || isFetching.value) return
        itemsPerPage.value = newItemsPerPage
        currentPage.value = 1
        await nextTick()
        await fetchConnections()
    }

    const handleSortChange = async (
        field: ConnectionSortField | undefined,
        direction: 'asc' | 'desc' | undefined
    ) => {
        if (isFetching.value) return
        sortBy.value = field || undefined
        sortDirection.value = direction
        currentPage.value = 1
        await nextTick()
        await fetchConnections()
    }

    const handleAction = (action: { type: string; row: any }) => {
        const connection = action.row
        const user = connection.user || {}

        emit('action', {
            type: action.type,
            connectionId: connection.id,
            userName: user.name || t('unknown'),
            userId: user.id,
        })
    }

    // ✅ Reset pagination to page 1 when filters change
    watch(
        () => props.filters,
        () => {
            currentPage.value = 1
            debouncedFetch()
        },
        { deep: true, immediate: false }
    )

    watch(
        () => props.refreshKey,
        (newKey, oldKey) => {
            if (newKey !== oldKey) fetchConnections()
        }
    )

    // ✅ When tab changes, restore state from URL or use defaults
    watch(
        () => props.connectionType,
        async (newType, oldType) => {
            if (newType !== oldType) {
                // Initialize from URL for the new tab
                initializeFromURL()
                await nextTick()
                await fetchConnections()
            }
        }
    )

    watch(error, (newError) => {
        if (newError?.message) {
            toast.error(newError.message)
            resetError()
        }
    })

    onMounted(() => {
        initializeFromURL()
        nextTick(() => {
            fetchConnections()
        })
    })
</script>
