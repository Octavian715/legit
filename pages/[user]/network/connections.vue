<template>
    <div class="flex flex-col gap-3">
        <Breadcrumbs :items="breadcrumbItems" />

        <div v-if="error && !isRetrying" class="bg-white rounded-sm shadow p-8 text-center">
            <div class="mx-auto w-16 h-16 text-red-500 mb-4">
                <svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
            </div>
            <h3 class="text-title1 font-bold text-gray-950 mb-2">
                {{ t('network.errors.loadFailed') }}
            </h3>
            <p class="text-subtitle1 text-gray-700 mb-6">{{ error.message }}</p>
            <Button color="red" variant="filled" @click="handleRetry">
                {{ t('retry') }}
            </Button>
        </div>

        <div v-else class="bg-white rounded-sm">
            <div class="p-4 space-y-3">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-gray-950 font-bold text-title2">
                            {{ t('network.connections.title') }}
                        </h1>
                        <p class="text-gray-800 text-subtitle3 mt-1">
                            {{
                                totalConnections
                                    ? t('countResults', { count: totalConnections })
                                    : t('network.connections.subtitle')
                            }}
                        </p>
                    </div>
                    <div class="flex items-center gap-2">
                        <InputSearch
                            v-model.trim="searchQuery"
                            :placeholder="t('filters.searchPlaceholder')"
                            size="md"
                            background="bg-gray-150 hidden md:block"
                            container-classes="rounded-sm"
                        />
                        <Button
                            variant="ghost"
                            color="gray"
                            size="lg"
                            square
                            container-classes="!p-1 relative"
                            :tooltip="t('filters.title')"
                            @click="openFilters"
                        >
                            <svg class="w-4 h-4 flex-1">
                                <use xlink:href="/sprite.svg#filter" />
                            </svg>
                            <span
                                v-if="hasActiveFilters"
                                class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"
                                aria-label="Active filters"
                            ></span>
                        </Button>
                    </div>
                </div>

                <Tabs2
                    ref="tabsRef"
                    v-model="activeTabIndex"
                    :tabs="tabs"
                    variant="underline"
                    size="md"
                    :lazy="true"
                    @select-tab="handleTabChange"
                >
                    <template
                        v-for="(config, index) in tabConfig"
                        :key="config.key"
                        #[`tab-${index}`]
                    >
                        <TableSkeleton v-if="isLoadingTab" :rows="5" :columns="6" />
                        <ConnectionsTabUnified
                            v-else-if="hasTabBeenSelected[index]"
                            :connection-type="config.type"
                            :filters="connectionsFilters"
                            :refresh-key="refreshKey"
                            :active-tab-key="activeTabKey"
                            @open-filters="openFilters"
                            @update-counts="handleUpdateCounts"
                            @action="handleConnectionAction"
                        />
                    </template>
                </Tabs2>
            </div>
        </div>

        <ClientOnly>
            <ConnectionsFilterDrawer
                v-if="isComponentsReady"
                v-model:open="isFilterDrawerOpen"
                :active-filters="activeFilters"
                @apply-filters="handleApplyFilters"
                @reset-filters="handleResetFilters"
            />
        </ClientOnly>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, onMounted, nextTick, defineAsyncComponent } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useLocalePath, useRoute, useRouter } from '#imports'
    import { useNetwork } from '~/composables/useNetwork'
    import { useConnections } from '~/composables/useConnections'
    import type { NetworkFilters, ConnectionType } from '~/types/network'

    const ConnectionsTabUnified = defineAsyncComponent(
        () => import('~/components/features/supplier/network/connections/ConnectionsTabUnified.vue')
    )
    const ConnectionsFilterDrawer = defineAsyncComponent(
        () =>
            import('~/components/features/supplier/network/connections/ConnectionsFilterDrawer.vue')
    )

    definePageMeta({
        middleware: ['role'],
        layout: 'app',
    })

    const { t } = useI18n()
    const localePath = useLocalePath()
    const route = useRoute()
    const router = useRouter()

    // Data management from useNetwork
    const {
        error,
        resetError,
        getConnectionsCount: totalConnections,
        loadConnectionFilters: getConnectionFilters,
        mapMetaCountsToTabs,
        triggerRefresh,
    } = useNetwork()

    // Actions from useConnections
    const { acceptConnectionRequest, showRemoveConnectionConfirmation } = useConnections()

    // Tab configuration with ConnectionType
    const tabConfig = computed<
        Array<{
            key: string
            type: ConnectionType
            labelKey: string
        }>
    >(() => [
        {
            key: 'accepted',
            type: 'accepted',
            labelKey: 'network.connections.tabs.connections',
        },
        {
            key: 'my-requests',
            type: 'my-requests',
            labelKey: 'network.connections.tabs.myRequests',
        },
        {
            key: 'requests',
            type: 'requests',
            labelKey: 'network.connections.tabs.requests',
        },
        {
            key: 'declined',
            type: 'declined',
            labelKey: 'network.connections.tabs.declined',
        },
    ])

    // ✅ FIXED: Initialize activeTabIndex from URL immediately to prevent double mount
    const getInitialTabIndex = (): number => {
        const queryTab = route.query.tab as string | undefined
        if (queryTab) {
            const index = tabConfig.value.findIndex((config) => config.key === queryTab)
            if (index !== -1) return index
        }
        return 0
    }

    const tabsRef = ref()
    const activeTabIndex = ref(getInitialTabIndex())
    const hasTabBeenSelected = ref<Record<number, boolean>>({
        [getInitialTabIndex()]: true,
    })
    const isFilterDrawerOpen = ref(false)
    const refreshKey = ref(0)
    const isComponentsReady = ref(false)
    const isRetrying = ref(false)
    const isLoadingTab = ref(true)
    const searchQuery = ref('')

    const activeFilters = ref<NetworkFilters>({
        search: '',
        business_type_ids: [],
        country_ids: [],
        spoken_language_ids: [],
        start_date: undefined,
        end_date: undefined,
    })

    const tabCounts = ref<Record<string, number>>({
        accepted: 0,
        'my-requests': 0,
        requests: 0,
        declined: 0,
    })

    const pathRole = computed(() => {
        const path = route.path
        if (path.includes('/supplier/')) return 'supplier'
        if (path.includes('/buyer/')) return 'buyer'
        return null
    })

    const breadcrumbItems = computed(() => [
        {
            label: t('home'),
            to: localePath(`/${pathRole.value}/dashboard`),
        },
        {
            label: t('network.connections.title'),
        },
    ])

    const tabs = computed(() => {
        return tabConfig.value.map((config) => {
            const count = tabCounts.value[config.key] ?? 0
            return {
                label: t(config.labelKey),
                badge: count,
            }
        })
    })

    const activeTabKey = computed(() => {
        return tabConfig.value[activeTabIndex.value]?.key || 'accepted'
    })

    const connectionsFilters = computed<NetworkFilters>(() => {
        return {
            search: searchQuery.value || activeFilters.value.search || '',
            business_type_ids: activeFilters.value.business_type_ids || [],
            country_ids: activeFilters.value.country_ids || [],
            spoken_language_ids: activeFilters.value.spoken_language_ids || [],
            start_date: activeFilters.value.start_date,
            end_date: activeFilters.value.end_date,
        }
    })

    const hasActiveFilters = computed(() => {
        const filters = activeFilters.value
        return !!(
            (filters.business_type_ids && filters.business_type_ids.length > 0) ||
            (filters.country_ids && filters.country_ids.length > 0) ||
            (filters.spoken_language_ids && filters.spoken_language_ids.length > 0) ||
            filters.start_date ||
            filters.end_date
        )
    })

    const handleTabChange = async (index: number) => {
        if (!hasTabBeenSelected.value[index]) {
            isLoadingTab.value = true
            await nextTick()
            hasTabBeenSelected.value[index] = true
            await nextTick()
            isLoadingTab.value = false
        }
        const tabKey = tabConfig.value[index]?.key
        if (tabKey && route.query.tab !== tabKey) {
            // ✅ FIXED: Only update tab param, let child handle pagination params
            await router.replace({
                query: { tab: tabKey },
            })
        }
    }

    const openFilters = () => {
        isFilterDrawerOpen.value = true
    }

    /**
     * Handle counts update from meta.counts_by_type
     * Structure: { requests: 0, accepted: 5, my-requests: 21, declined: 0 }
     */
    const handleUpdateCounts = (meta: any) => {
        if (meta?.counts_by_type) {
            const counts = mapMetaCountsToTabs(meta)
            tabCounts.value = counts
        }
    }

    const handleApplyFilters = (filters: NetworkFilters) => {
        activeFilters.value = {
            search: filters.search || '',
            business_type_ids: filters.business_type_ids || [],
            country_ids: filters.country_ids || [],
            spoken_language_ids: filters.spoken_language_ids || [],
            start_date: filters.start_date,
            end_date: filters.end_date,
        }
        isFilterDrawerOpen.value = false
        refreshKey.value++
    }

    const handleResetFilters = () => {
        activeFilters.value = {
            search: '',
            business_type_ids: [],
            country_ids: [],
            spoken_language_ids: [],
            start_date: undefined,
            end_date: undefined,
        }
        searchQuery.value = ''
        refreshKey.value++
    }

    const handleConnectionAction = async (action: {
        type: string
        connectionId: number
        userName: string
        userId?: number
    }) => {
        let success = false

        switch (action.type) {
            case 'accept':
                success = await acceptConnectionRequest(action.connectionId, action.userName)
                break

            case 'decline':
                success = await showRemoveConnectionConfirmation(
                    action.userName,
                    action.connectionId,
                    action.userId,
                    false
                )
                break

            case 'disconnect':
                success = await showRemoveConnectionConfirmation(
                    action.userName,
                    action.connectionId,
                    action.userId,
                    false
                )
                break

            case 'cancel':
            case 'cancel-disconnect':
                success = await showRemoveConnectionConfirmation(
                    action.userName,
                    action.connectionId,
                    action.userId,
                    true
                )
                break

            default:
                console.warn(`Unknown action type: ${action.type}`)
                return
        }

        if (success) {
            refreshKey.value++
        }
    }

    const handleRetry = async () => {
        isRetrying.value = true
        resetError()
        await loadInitialData()
        isRetrying.value = false
    }

    const loadInitialData = async () => {
        try {
            await getConnectionFilters()
        } catch (error: any) {
            console.error('[Connections] Failed to load filters:', error)
        }
    }

    const initializeFromQuery = () => {
        // Already initialized in getInitialTabIndex()
        // Just ensure the current tab is marked as selected
        hasTabBeenSelected.value[activeTabIndex.value] = true
    }

    watch(
        () => searchQuery.value || triggerRefresh.value,
        () => {
            refreshKey.value++
        }
    )

    onMounted(async () => {
        await loadInitialData()
        initializeFromQuery()
        await nextTick()
        isComponentsReady.value = true
        isLoadingTab.value = false
    })
</script>
