<template>
    <div class="charts-section space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Chart
                ref="connectionsChartRef"
                :title="t('network.chart.connections')"
                :main-value="connectionsData?.total"
                :chart-type="'bar'"
                :data="connectionsChartData"
                :chart-height="'140px'"
                :show-info="true"
                :default-period="'lastMonth'"
                :show-custom-option="true"
                :is-loading="loadingStates.connections"
                :empty-message="t('noData')"
                @period-change="handleConnectionsPeriodChange"
            />

            <Chart
                ref="followersChartRef"
                :title="t('network.chart.followers')"
                :main-value="followersData?.total"
                :chart-type="'line'"
                :data="followersChartData"
                :chart-height="'140px'"
                :show-info="true"
                :default-period="'lastMonth'"
                :show-custom-option="true"
                :is-loading="loadingStates.followers"
                :empty-message="t('noData')"
                @period-change="handleFollowersPeriodChange"
            />

            <Chart
                ref="disconnectionsChartRef"
                :title="t('network.chart.disconnections')"
                :main-value="disconnectionsData?.total"
                :chart-type="'bar'"
                :data="disconnectionsChartData"
                :chart-height="'140px'"
                :show-info="true"
                :default-period="'lastMonth'"
                :show-custom-option="true"
                :is-loading="loadingStates.disconnections"
                :empty-message="t('noData')"
                @period-change="handleDisconnectionsPeriodChange"
            />

            <Chart
                ref="unfollowersChartRef"
                :title="t('network.chart.unfollowers')"
                :main-value="unfollowersData?.total"
                :chart-type="'line'"
                :data="unfollowersChartData"
                :chart-height="'140px'"
                :show-info="true"
                :default-period="'lastMonth'"
                :show-custom-option="true"
                :is-loading="loadingStates.unfollowers"
                :empty-message="t('noData')"
                @period-change="handleUnfollowersPeriodChange"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, ref, watch } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { useChartConfig } from '~/composables/chart/useChartConfig'
    import { NetworkService } from '~/services/network'
    import type { NetworkStatsResponse, StatsPeriod, NetworkStatsFilters } from '~/types/network'
    import type { PeriodType, DateRange } from '~/types/chart'

    interface Props {
        initialStatsData?: {
            connections?: NetworkStatsResponse
            followers?: NetworkStatsResponse
            disconnections?: NetworkStatsResponse
            unfollowers?: NetworkStatsResponse
        }
        loadingStates?: {
            connections: boolean
            followers: boolean
            disconnections: boolean
            unfollowers: boolean
        }
    }

    const props = withDefaults(defineProps<Props>(), {
        loadingStates: () => ({
            connections: false,
            followers: false,
            disconnections: false,
            unfollowers: false,
        }),
    })

    const { t } = useI18n()
    const { transformNetworkStatsToChart, createSampleChartData } = useChartConfig()
    const networkService = new NetworkService()
    const toast = useToastNotification()

    const connectionsChartRef = ref()
    const followersChartRef = ref()
    const disconnectionsChartRef = ref()
    const unfollowersChartRef = ref()

    const connectionsData = ref<NetworkStatsResponse | undefined>(
        props.initialStatsData?.connections
    )
    const followersData = ref<NetworkStatsResponse | undefined>(props.initialStatsData?.followers)
    const disconnectionsData = ref<NetworkStatsResponse | undefined>(
        props.initialStatsData?.disconnections
    )
    const unfollowersData = ref<NetworkStatsResponse | undefined>(
        props.initialStatsData?.unfollowers
    )

    const connectionsChartData = computed(() => {
        if (!connectionsData.value) {
            return createSampleChartData('connections', 'bar')
        }

        return transformNetworkStatsToChart(connectionsData.value, 'connections', 'bar')
    })

    const followersChartData = computed(() => {
        if (!followersData.value) {
            return createSampleChartData('followers', 'line')
        }

        return transformNetworkStatsToChart(followersData.value, 'followers', 'line')
    })

    const disconnectionsChartData = computed(() => {
        if (!disconnectionsData.value) {
            return createSampleChartData('disconnections', 'bar')
        }

        return transformNetworkStatsToChart(disconnectionsData.value, 'disconnections', 'bar')
    })

    const unfollowersChartData = computed(() => {
        if (!unfollowersData.value) {
            return createSampleChartData('unfollowers', 'line')
        }

        return transformNetworkStatsToChart(unfollowersData.value, 'unfollowers', 'line')
    })

    const convertPeriodType = (period: PeriodType): StatsPeriod => {
        switch (period) {
            case 'today':
                return 'today'
            case 'lastMonth':
                return 'last_month'
            case 'lastYear':
                return 'last_year'
            case 'custom':
                return 'custom'
            default:
                return 'last_month'
        }
    }

    const buildStatsFilters = (period: StatsPeriod, dateRange?: DateRange): NetworkStatsFilters => {
        if (period === 'custom' && dateRange?.start && dateRange?.end) {
            return {
                start_date: dateRange.start,
                end_date: dateRange.end,
            }
        }
        return { period }
    }

    const fetchConnectionStats = async (period: StatsPeriod, dateRange?: DateRange) => {
        try {
            const filters = buildStatsFilters(period, dateRange)
            const response = await networkService.fetchTotalConnections(filters)
            connectionsData.value = response
        } catch (error: any) {
            console.error('Error fetching connection stats:', error)
            toast.error(t('network.errors.statsError'))
            connectionsData.value = undefined
        }
    }

    const fetchFollowerStats = async (period: StatsPeriod, dateRange?: DateRange) => {
        try {
            const filters = buildStatsFilters(period, dateRange)
            const response = await networkService.fetchTotalFollowers(filters)
            followersData.value = response
        } catch (error: any) {
            console.error('Error fetching follower stats:', error)
            toast.error(t('network.errors.statsError'))
            followersData.value = undefined
        }
    }

    const fetchDisconnectionStats = async (period: StatsPeriod, dateRange?: DateRange) => {
        try {
            const filters = buildStatsFilters(period, dateRange)
            const response = await networkService.fetchTotalDisconnections(filters)
            disconnectionsData.value = response
        } catch (error: any) {
            console.error('Error fetching disconnection stats:', error)
            toast.error(t('network.errors.statsError'))
            disconnectionsData.value = undefined
        }
    }

    const fetchUnfollowerStats = async (period: StatsPeriod, dateRange?: DateRange) => {
        try {
            const filters = buildStatsFilters(period, dateRange)
            const response = await networkService.fetchTotalUnfollowers(filters)
            unfollowersData.value = response
        } catch (error: any) {
            console.error('Error fetching unfollower stats:', error)
            toast.error(t('network.errors.statsError'))
            unfollowersData.value = undefined
        }
    }

    const handleConnectionsPeriodChange = (period: PeriodType, dateRange?: DateRange) => {
        const statsPeriod = convertPeriodType(period)
        fetchConnectionStats(statsPeriod, dateRange)
    }

    const handleFollowersPeriodChange = (period: PeriodType, dateRange?: DateRange) => {
        const statsPeriod = convertPeriodType(period)
        fetchFollowerStats(statsPeriod, dateRange)
    }

    const handleDisconnectionsPeriodChange = (period: PeriodType, dateRange?: DateRange) => {
        const statsPeriod = convertPeriodType(period)
        fetchDisconnectionStats(statsPeriod, dateRange)
    }

    const handleUnfollowersPeriodChange = (period: PeriodType, dateRange?: DateRange) => {
        const statsPeriod = convertPeriodType(period)
        fetchUnfollowerStats(statsPeriod, dateRange)
    }

    watch(
        () => props.initialStatsData?.connections,
        (newData) => {
            if (newData) {
                connectionsData.value = newData
            }
        },
        { deep: true }
    )

    watch(
        () => props.initialStatsData?.followers,
        (newData) => {
            if (newData) {
                followersData.value = newData
            }
        },
        { deep: true }
    )

    watch(
        () => props.initialStatsData?.disconnections,
        (newData) => {
            if (newData) {
                disconnectionsData.value = newData
            }
        },
        { deep: true }
    )

    watch(
        () => props.initialStatsData?.unfollowers,
        (newData) => {
            if (newData) {
                unfollowersData.value = newData
            }
        },
        { deep: true }
    )
</script>

<style scoped>
    .charts-section {
        @apply w-full;
    }

    @media (max-width: 1024px) {
        .charts-section .grid {
            @apply grid-cols-1;
        }
    }
</style>
