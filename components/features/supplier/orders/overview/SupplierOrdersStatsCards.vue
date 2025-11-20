<template>
    <div class="supplier-orders-stats-cards">
        <!-- Loading skeleton -->
        <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <div
                v-for="i in 6"
                :key="`skeleton-${i}`"
                class="animate-pulse bg-white rounded-md p-4 shadow-sm"
            >
                <div class="flex items-center justify-between">
                    <div class="space-y-2 flex-1">
                        <div class="h-4 bg-gray-200 rounded w-20"></div>
                        <div class="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div class="w-8 h-8 bg-gray-200 rounded"></div>
                </div>
            </div>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="bg-white rounded-md p-6 shadow-sm border border-red-200">
            <div class="text-center">
                <div class="text-red-500 mb-2">
                    <svg
                        class="w-12 h-12 mx-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">{{ t('error') }}</h3>
                <p class="text-sm text-gray-600 mb-4">{{ error }}</p>
                <button
                    class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    @click="handleRetry"
                >
                    {{ t('retry', 'Retry') }}
                </button>
            </div>
        </div>

        <!-- Stats cards -->
        <div v-else-if="hasStats" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <div
                v-for="stat in statsCards"
                :key="stat.statusKey"
                class="stats-card bg-white rounded-md p-4 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer group"
                :class="[
                    stat.statusKey === 'all' ? 'border-l-4 border-blue-500' : '',
                    getStatusCardColor(stat.statusKey),
                ]"
                @click="handleStatClick(stat)"
            >
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <p class="text-sm font-medium text-gray-600 truncate">
                            {{ getStatusLabel(stat.statusKey) }}
                        </p>
                        <p class="mt-1 text-2xl font-bold text-gray-900">
                            {{ formatNumber(stat.count) }}
                        </p>
                    </div>
                    <div class="ml-4">
                        <div
                            class="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors"
                        >
                            <svg
                                class="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Empty state -->
        <div v-else class="bg-white rounded-md p-6 shadow-sm">
            <div class="text-center">
                <div class="text-gray-600 mb-4">
                    <svg
                        class="w-12 h-12 mx-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">{{
                    t('ordersDashboard.empty.noData')
                }}</h3>
                <p class="text-sm text-gray-600">{{ t('ordersDashboard.empty.noOrders') }}</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import type { OrderStats } from '~/types/ordersDashboard'

    const emit = defineEmits<{
        'stat-click': [stat: OrderStats]
    }>()

    const { t } = useI18n()
    const { loadSupplierOrdersStats, formatOrderStatus } = useOrdersDashboard()

    const isLoading = ref(false)
    const statsData = ref<OrderStats[]>([])
    const error = ref<string | null>(null)

    const hasStats = computed(() => {
        return Array.isArray(statsData.value) && statsData.value.length > 0
    })

    const statsCards = computed(() => {
        if (!hasStats.value) return []

        // Sort stats to show "all" first, then others by count descending
        return [...statsData.value].sort((a, b) => {
            if (a.status_key === 'all') return -1
            if (b.status_key === 'all') return 1
            return b.count - a.count
        })
    })

    const getStatusLabel = (statusKey: string): string => {
        if (statusKey === 'all') {
            return t('ordersDashboard.status.all')
        }
        return formatOrderStatus(statusKey)
    }

    const getStatusCardColor = (statusKey: string): string => {
        const colorMap: Record<string, string> = {
            all: 'hover:border-blue-200',
            pending: 'hover:border-yellow-200',
            confirmed: 'hover:border-green-200',
            processing: 'hover:border-blue-200',
            shipped: 'hover:border-purple-200',
            delivered: 'hover:border-green-200',
            cancelled: 'hover:border-red-200',
            refunded: 'hover:border-orange-200',
        }
        return colorMap[statusKey] || 'hover:border-gray-200'
    }

    const formatNumber = (value: number): string => {
        if (value >= 1000000) {
            return `${(value / 1000000).toFixed(1)}M`
        }
        if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}k`
        }
        return new Intl.NumberFormat().format(value)
    }

    const loadStatsData = async () => {
        if (isLoading.value) return

        isLoading.value = true
        error.value = null

        try {
            const result = await loadSupplierOrdersStats()
            if (result) {
                statsData.value = Array.isArray(result) ? result : []
            } else {
                statsData.value = []
            }
        } catch (err: any) {
            console.error('Failed to load supplier orders stats:', err)
            error.value = err.message || t('ordersDashboard.statsError')
            statsData.value = []
        } finally {
            isLoading.value = false
        }
    }

    const handleStatClick = (stat: OrderStats) => {
        emit('stat-click', stat)
    }

    const handleRetry = () => {
        loadStatsData()
    }

    // Load initial data
    onMounted(() => {
        loadStatsData()
    })

    // Expose methods for parent component
    defineExpose({
        refresh: loadStatsData,
        error: readonly(error),
        retry: handleRetry,
    })
</script>

<style scoped>
    .stats-card {
        @apply transition-all duration-200;
    }

    .stats-card:hover {
        @apply transform translate-y-[-1px];
        box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.08);
    }
</style>
