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
                {{ t('dashboardUser.errors.generic') }}
            </h3>
            <p class="text-subtitle1 text-gray-700 mb-6">{{ error.message }}</p>
            <Button color="red" variant="filled" @click="handleRetry">
                {{ t('dashboardUser.messages.tryAgain') }}
            </Button>
        </div>

        <div v-else class="bg-white rounded-sm">
            <div class="p-4 space-y-3">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-gray-950 font-bold text-title2">
                            {{ t('navigation.allBuyers') }}
                        </h1>
                        <p class="text-gray-800 text-subtitle3 mt-1">
                            {{
                                totalBuyers > 0
                                    ? t('allBuyersPage.buyersCount', { count: totalBuyers })
                                    : isLoading
                                      ? t('allBuyersPage.loadingBuyers')
                                      : t('allBuyersPage.noBuyers')
                            }}
                        </p>
                    </div>
                    <div class="flex items-center gap-2">
                        <InputSearch
                            v-model.trim="activeFilters.search"
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

                <TableSkeleton v-if="!hasLoadedOnce" :rows="10" :columns="6" />

                <AllBuyersTable
                    v-else
                    :buyers="buyers"
                    :meta="buyersMeta"
                    :loading="isLoading"
                    :actions="['show-profile']"
                    show-pagination
                    :current-page="currentPage"
                    :items-per-page="itemsPerPage"
                    :sort-by="sortBy"
                    :sort-direction="sortDirection"
                    @page-change="handlePageChange"
                    @items-per-page-change="handleItemsPerPageChange"
                    @sort-change="handleSortChange"
                />
            </div>
        </div>

        <ClientOnly>
            <AllBuyersFilterDrawer
                :is-open="isFilterDrawerOpen"
                :filters="activeFilters"
                @update:is-open="isFilterDrawerOpen = $event"
                @apply="handleApplyFilters"
                @reset="resetFilters"
            />
        </ClientOnly>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, nextTick, watch } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useLocalePath } from '#imports'
    import { useDebounceFn } from '@vueuse/core'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { useUserDashboardStore } from '~/stores/userDashboard'
    import type { DashboardFilters, DashboardSortField } from '~/types/userDashboard'
    import type { SortDirection } from '~/types/ui/table'

    definePageMeta({ middleware: ['supplier'], layout: 'app' })

    const { t } = useI18n()
    const localePath = useLocalePath()
    const toast = useToastNotification()
    const userDashboardStore = useUserDashboardStore()
    const { initialize } = useStaticData()

    const isFilterDrawerOpen = ref(false)
    const refreshKey = ref(0)
    const error = ref<Error | null>(null)
    const isRetrying = ref(false)
    const hasLoadedOnce = ref(false)

    const activeFilters = ref<DashboardFilters>({
        search: '',
        business_type_ids: [],
        country_ids: [],
        start_date: '',
        end_date: '',
        period: undefined,
        min_total_amount: undefined,
        max_total_amount: undefined,
    })

    const totalBuyers = computed(() => userDashboardStore.totalBuyers || 0)
    const totalItems = computed(() => userDashboardStore.buyersMeta?.total || 0)
    const totalPages = computed(() => {
        if (totalItems.value === 0 || itemsPerPage.value === 0) return 1
        return Math.ceil(totalItems.value / itemsPerPage.value)
    })

    const currentPage = ref(1)
    const itemsPerPage = ref(10)
    const sortBy = ref<DashboardSortField | undefined>(undefined)
    const sortDirection = ref<SortDirection | undefined>(undefined)
    const isFetching = ref(false)

    let currentRequestId = 0

    const buyers = computed(() => userDashboardStore.buyers)
    const buyersMeta = computed(() => userDashboardStore.buyersMeta)
    const isLoading = computed(() => userDashboardStore.isLoading)

    const activeFiltersCount = computed(() => {
        let count = 0

        if (
            Array.isArray(activeFilters.value.business_type_ids) &&
            activeFilters.value.business_type_ids.length > 0
        )
            count++
        if (
            Array.isArray(activeFilters.value.country_ids) &&
            activeFilters.value.country_ids.length > 0
        )
            count++
        if (activeFilters.value.start_date && activeFilters.value.end_date) count++
        if (activeFilters.value.period) count++
        if (
            activeFilters.value.min_total_amount !== undefined ||
            activeFilters.value.max_total_amount !== undefined
        )
            count++

        return count
    })

    const hasActiveFilters = computed(() => {
        return activeFiltersCount.value > 0 || activeFilters.value.search?.trim()?.length > 0
    })

    const breadcrumbs = computed(() => [
        { label: t('home'), to: localePath('/supplier/dashboard') },
        { label: t('navigation.buyers'), to: localePath('/supplier/buyers') },
        { label: t('navigation.allBuyers'), to: localePath('/supplier/buyers/all') },
    ])

    const transformFiltersForAPI = (filters: DashboardFilters) => {
        const apiFilters: any = { ...filters }

        if (Array.isArray(filters.business_type_ids) && filters.business_type_ids.length > 0) {
            apiFilters.business_type_ids = filters.business_type_ids
        } else {
            delete apiFilters.business_type_ids
        }

        if (Array.isArray(filters.country_ids) && filters.country_ids.length > 0) {
            apiFilters.country_ids = filters.country_ids
        } else {
            delete apiFilters.country_ids
        }

        if (!apiFilters.search?.trim()) {
            delete apiFilters.search
        }

        if (!apiFilters.start_date || !apiFilters.end_date) {
            delete apiFilters.start_date
            delete apiFilters.end_date
        }

        if (!apiFilters.period) {
            delete apiFilters.period
        }

        if (apiFilters.min_total_amount === undefined || apiFilters.min_total_amount === null) {
            delete apiFilters.min_total_amount
        }

        if (apiFilters.max_total_amount === undefined || apiFilters.max_total_amount === null) {
            delete apiFilters.max_total_amount
        }

        return apiFilters
    }

    const fetchBuyers = async () => {
        if (isFetching.value) {
            return false
        }

        const requestId = ++currentRequestId

        try {
            isFetching.value = true
            error.value = null

            if (requestId !== currentRequestId) {
                return false
            }

            if (currentPage.value > totalPages.value && totalPages.value > 0) {
                currentPage.value = totalPages.value
            }

            const apiFilters = transformFiltersForAPI(activeFilters.value)

            const filters: DashboardFilters = {
                ...apiFilters,
                page: currentPage.value,
                per_page: itemsPerPage.value,
                sort_by: sortBy.value,
                sort_direction: sortDirection.value,
            }

            const success = await userDashboardStore.fetchAllBuyers(filters)

            if (requestId !== currentRequestId) {
                return false
            }

            hasLoadedOnce.value = true

            // if (success && buyersMeta.value?.total !== undefined) {
            //     const newTotalPages = Math.ceil(buyersMeta.value.total / itemsPerPage.value) || 1
            //     if (currentPage.value > newTotalPages && newTotalPages > 0) {
            //         currentPage.value = newTotalPages
            //         return fetchBuyers()
            //     }
            // }

            return !!success
        } catch (err: any) {
            if (requestId !== currentRequestId) {
                return false
            }

            console.error('Failed to fetch buyers:', err)
            error.value = err
            toast.error(err.message || t('userDashboard.errors.fetchBuyersFailed'))
            return false
        } finally {
            if (requestId === currentRequestId) {
                isFetching.value = false
            }
        }
    }

    const handleRetry = async () => {
        isRetrying.value = true
        error.value = null
        hasLoadedOnce.value = false

        try {
            await fetchBuyers()
        } finally {
            isRetrying.value = false
        }
    }

    const debouncedFetch = useDebounceFn(fetchBuyers, 300)

    const handlePageChange = (page: number) => {
        if (currentPage.value === page || isFetching.value) {
            return
        }

        const maxPage = Math.max(1, totalPages.value)
        const validPage = Math.max(1, Math.min(page, maxPage))

        currentPage.value = validPage
        nextTick(() => {
            fetchBuyers()
        })
    }

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        if (itemsPerPage.value === newItemsPerPage || isFetching.value) {
            return
        }

        itemsPerPage.value = newItemsPerPage
        currentPage.value = 1
        nextTick(() => {
            fetchBuyers()
        })
    }

    const handleSortChange = (
        field: DashboardSortField | undefined,
        direction: 'asc' | 'desc' | undefined
    ) => {
        if (isFetching.value) {
            return
        }

        if (!field || direction === undefined) {
            sortBy.value = undefined
            sortDirection.value = undefined
        } else {
            sortBy.value = field
            sortDirection.value = direction
        }

        currentPage.value = 1
        nextTick(() => {
            fetchBuyers()
        })
    }

    const openFilters = () => {
        isFilterDrawerOpen.value = true
    }

    const handleApplyFilters = (filters: DashboardFilters) => {
        activeFilters.value = {
            search: filters.search || '',
            business_type_ids: Array.isArray(filters.business_type_ids)
                ? filters.business_type_ids
                : [],
            country_ids: Array.isArray(filters.country_ids) ? filters.country_ids : [],
            start_date: filters.start_date || '',
            end_date: filters.end_date || '',
            period: filters.period,
            min_total_amount: filters.min_total_amount,
            max_total_amount: filters.max_total_amount,
        }

        isFilterDrawerOpen.value = false
        currentPage.value = 1
        refreshKey.value++
        debouncedFetch()
    }

    const resetFilters = () => {
        activeFilters.value = {
            search: '',
            business_type_ids: [],
            country_ids: [],
            start_date: '',
            end_date: '',
            period: undefined,
            min_total_amount: undefined,
            max_total_amount: undefined,
        }

        currentPage.value = 1
        refreshKey.value++

        if (isFilterDrawerOpen.value) {
            isFilterDrawerOpen.value = false
        }

        debouncedFetch()
    }

    watch(
        () => activeFilters.value,
        () => {
            currentPage.value = 1
            debouncedFetch()
        },
        { deep: true }
    )

    watch(
        () => refreshKey.value,
        () => {
            fetchBuyers()
        }
    )

    onMounted(() => {
        nextTick(() => {
            initialize()
            fetchBuyers()
        })
    })
</script>
