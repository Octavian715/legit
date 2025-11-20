<template>
    <div class="flex flex-col gap-3">
        <Breadcrumbs :items="breadcrumbs" />

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
                {{ t('network.errors.networkError') }}
            </h3>
            <p class="text-subtitle1 text-gray-700 mb-6">{{ error.message }}</p>
            <Button color="red" variant="filled" @click="handleRetry">
                {{ t('network.actions.refresh') }}
            </Button>
        </div>

        <div v-else class="network-overview-content space-y-3 mb-20">
            <ClientOnly>
                <NetworkOverviewCharts
                    ref="chartsRef"
                    :initial-stats-data="statsData"
                    :loading-states="chartLoadingStates"
                />
                <template #fallback>
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <ChartSkeleton v-for="i in 4" :key="i" />
                    </div>
                </template>
            </ClientOnly>

            <NetworkConnectionsTable
                :connections="connections"
                :meta="connectionsMeta"
                :selected-type="selectedConnectionType"
                :show-pagination="false"
                :current-page="currentPage"
                :loading="tableLoadingStates.connections"
                @type-change="handleConnectionTypeChange"
                @page-change="handlePageChange"
                @action="handleTableAction"
                @view-all="handleRedirectInvitation"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
    import { useRouter, useRoute } from 'vue-router'
    import { useI18n } from 'vue-i18n'
    import { useLocalePath } from '#imports'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { useNetwork } from '~/composables/useNetwork'
    import { useNetworkStore } from '~/stores/network'
    import { useConnections } from '~/composables/useConnections'
    import { useChat } from '~/composables/socket/useChat'
    import type {
        ConnectionType,
        StatsPeriod,
        NetworkStatsFilters,
        NetworkFilters,
    } from '~/types/network'

    definePageMeta({
        middleware: ['role'],
        layout: 'app',
    })

    const router = useRouter()
    const route = useRoute()
    const localePath = useLocalePath()
    const { t } = useI18n()
    const toast = useToastNotification()

    const networkStore = useNetworkStore()
    const {
        getConnectionsWithFilters,
        getConnectionStats,
        getFollowerStats,
        getDisconnectionStats,
        getUnfollowerStats,
        resetError,
        triggerRefresh,
    } = useNetwork()
    const { respondToConnectionRequest } = useConnections()
    const { loadingNewChat, handleStartChat } = useChat()

    const chartsRef = ref()
    const selectedConnectionType = ref<ConnectionType>('requests')
    const currentPage = ref(1)
    const isRetrying = ref(false)
    const hasLoadedOnce = ref(false)

    const chartLoadingStates = ref({
        connections: false,
        followers: false,
        disconnections: false,
        unfollowers: false,
    })

    const tableLoadingStates = ref({
        connections: false,
    })

    const userRole = computed(() => route.params.user as string)

    const breadcrumbs = computed(() => [
        { label: t('home'), to: localePath(`/${userRole.value}/dashboard`) },
        { label: t('navigation.network'), to: localePath(`/${userRole.value}/network/overview`) },
        { label: t('navigation.overview'), to: localePath(`/${userRole.value}/network/overview`) },
    ])

    const connections = computed(() => networkStore.connections)
    const connectionsMeta = computed(() => networkStore.connectionsMeta)
    const error = computed(() => networkStore.error)

    const statsData = computed(() => ({
        connections: networkStore.connectionStats,
        followers: networkStore.followerStats,
        disconnections: networkStore.disconnectionStats,
        unfollowers: networkStore.unfollowerStats,
    }))

    const fetchNetworkData = async () => {
        try {
            resetError()

            const statsFilters: NetworkStatsFilters = { period: 'last_month' }
            const connectionsFilters: NetworkFilters = {
                page: currentPage.value,
                per_page: 15,
            }

            tableLoadingStates.value.connections = true
            chartLoadingStates.value.connections = true
            chartLoadingStates.value.followers = true
            chartLoadingStates.value.disconnections = true
            chartLoadingStates.value.unfollowers = true

            await Promise.allSettled([
                getConnectionsWithFilters(selectedConnectionType.value, connectionsFilters),
                getConnectionStats(statsFilters),
                getFollowerStats(statsFilters),
                getDisconnectionStats(statsFilters),
                getUnfollowerStats(statsFilters),
            ])

            await nextTick()
            hasLoadedOnce.value = true
        } catch (error: any) {
            console.error('Network overview fetch error:', error)
            toast.error(error.message || t('network.errors.networkError'))
        } finally {
            tableLoadingStates.value.connections = false
            chartLoadingStates.value.connections = false
            chartLoadingStates.value.followers = false
            chartLoadingStates.value.disconnections = false
            chartLoadingStates.value.unfollowers = false
        }
    }

    const handleConnectionTypeChange = async (type: ConnectionType) => {
        selectedConnectionType.value = type
        currentPage.value = 1

        tableLoadingStates.value.connections = true
        try {
            await getConnectionsWithFilters(type, {
                page: currentPage.value,
                per_page: 15,
            })
        } finally {
            tableLoadingStates.value.connections = false
        }
    }

    const handlePageChange = async (page: number) => {
        currentPage.value = page

        tableLoadingStates.value.connections = true
        try {
            await getConnectionsWithFilters(selectedConnectionType.value, {
                page: currentPage.value,
                per_page: 15,
            })
        } finally {
            tableLoadingStates.value.connections = false
        }
    }

    const handleRetry = async () => {
        isRetrying.value = true
        hasLoadedOnce.value = false
        try {
            await fetchNetworkData()
        } finally {
            isRetrying.value = false
        }
    }

    const handleRedirectInvitation = () => {
        router.push(localePath(`/${userRole.value}/network/invitations`))
    }

    const handleTableAction = async (action: { type: string; row: any }) => {
        try {
            switch (action.type) {
                case 'accept':
                    await respondToConnectionRequest(action.row.id, 'accept')
                    await fetchNetworkData()
                    break
                case 'decline':
                    await respondToConnectionRequest(action.row.id, 'reject')
                    await fetchNetworkData()
                    break
                case 'show-profile':
                case 'show':
                    const user =
                        action?.row?.originalData?.user?.username ||
                        action?.row?.originalData?.user?.id
                    await navigateTo(localePath(`/profile/${user}`))
                    break
                case 'message':
                    await handleStartChat(action.row?.id, userRole.value)
                    break
                default:
                    console.warn('Unknown table action:', action.type)
            }
        } catch (error: any) {
            console.error('Table action error:', error)
            toast.error(error.message || t('network.errors.connectionFailed'))
        }
    }

    let refreshInterval: NodeJS.Timeout | null = null

    watch(
        () => triggerRefresh.value,
        async () => {
            await fetchNetworkData()
            await nextTick()
        }
    )

    onMounted(async () => {
        await fetchNetworkData()

        refreshInterval = setInterval(
            () => {
                if (hasLoadedOnce.value && !networkStore.isLoading) {
                    fetchNetworkData()
                }
            },
            5 * 60 * 1000
        )
    })

    onUnmounted(() => {
        if (refreshInterval) {
            clearInterval(refreshInterval)
            refreshInterval = null
        }
    })
</script>

<style scoped>
    .network-overview-content {
        @apply min-h-screen;
    }

    @media (max-width: 768px) {
        .network-overview-content {
            @apply space-y-4;
        }
    }
</style>
