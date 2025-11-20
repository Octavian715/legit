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
                {{ t('documents.errors.loadFailed') }}
            </h3>
            <p class="text-subtitle1 text-gray-700 mb-6">{{ error.message }}</p>
            <Button color="red" variant="filled" class="mx-auto" @click="handleRetry">
                {{ t('retry') }}
            </Button>
        </div>

        <div v-else class="bg-white rounded-sm">
            <div class="p-4 space-y-3">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-gray-950 font-bold text-title2">
                            {{ t('documents.allDocuments') }}
                        </h1>
                        <p class="text-gray-800 text-subtitle3 mt-1">
                            {{
                                totalOrders
                                    ? `${totalOrders} ${t('documents.invoices')}`
                                    : t('documents.title')
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
                            :tooltip="t('documents.filters.title')"
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

                <TableSkeleton v-if="!hasLoadedOnce" :show-header="false" :rows="10" :columns="9" />
                <DocumentsTable
                    v-else
                    :documents="orders"
                    :meta="ordersMeta"
                    :loading="isLoading"
                    :current-page="currentPage"
                    :items-per-page="itemsPerPage"
                    :sort-by="sortBy"
                    :sort-direction="sortDirection"
                    :view-as="viewAs"
                    @page-change="handlePageChange"
                    @items-per-page-change="handleItemsPerPageChange"
                    @sort-change="handleSortChange"
                    @action="handleTableAction"
                />
            </div>
        </div>

        <ClientOnly>
            <DocumentsFilterDrawer
                :is-open="isFilterDrawerOpen"
                :filters="activeFilters"
                :filter-options="filterOptions"
                @update:is-open="isFilterDrawerOpen = $event"
                @apply="handleApplyFilters"
                @reset="resetFilters"
            />
        </ClientOnly>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, watch, nextTick } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useLocalePath, useRoute } from '#imports'
    import { useDebounceFn } from '@vueuse/core'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { useOrderTableDashboard } from '~/composables/useOrderTableDashboard'
    import { useDocumentsStore } from '~/stores/documents'
    import type { OrderTableFilters, OrderTableSortField } from '~/types/orderTableDashboard'
    import type { SortDirection } from '~/types/ui/table'

    definePageMeta({
        middleware: ['role', 'dashboard'],
        layout: 'app',
    })

    const { t } = useI18n()
    const localePath = useLocalePath()
    const route = useRoute()
    const toast = useToastNotification()
    const documentsStore = useDocumentsStore()

    const {
        isLoading,
        error,
        orders,
        ordersMeta,
        filterOptions,
        totalOrders,
        viewAs,
        getSupplierOrders,
        getBuyerOrders,
        getSupplierFilters,
        getBuyerFilters,
        resetError,
    } = useOrderTableDashboard()

    const isFilterDrawerOpen = ref(false)
    const isRetrying = ref(false)
    const hasLoadedOnce = ref(false)
    const searchQuery = ref('')
    const currentPage = ref(1)
    const itemsPerPage = ref(10)
    const sortBy = ref<OrderTableSortField | undefined>(undefined)
    const sortDirection = ref<SortDirection | undefined>(undefined)
    const isFetching = ref(false)

    const activeFilters = ref<OrderTableFilters>({
        search: '',
        type: undefined,
        status_ids: [],
        payment_status_ids: [],
        currency_ids: [],
        amount_min: undefined,
        amount_max: undefined,
        date_from: undefined,
        date_to: undefined,
    })

    let currentRequestId = 0

    const pathRole = computed(() => {
        const path = route.path
        if (path.includes('/supplier/')) return 'supplier'
        if (path.includes('/buyer/')) return 'buyer'
        return null
    })

    const breadcrumbItems = computed(() => [
        { label: t('home'), to: localePath(`/${pathRole.value}/dashboard`) },
        {
            label: t('navigation.allDocuments'),
            to: localePath(`/${pathRole.value}/documents/all`),
        },
    ])

    const totalPages = computed(() => {
        if (totalOrders.value === 0 || itemsPerPage.value === 0) return 1
        return Math.ceil(totalOrders.value / itemsPerPage.value)
    })

    const hasActiveFilters = computed(() => {
        return (
            activeFilters.value.status_ids?.length ||
            activeFilters.value.payment_status_ids?.length ||
            activeFilters.value.currency_ids?.length ||
            activeFilters.value.type ||
            activeFilters.value.amount_min !== undefined ||
            activeFilters.value.amount_max !== undefined ||
            activeFilters.value.date_from ||
            activeFilters.value.date_to ||
            searchQuery.value?.trim()
        )
    })

    const fetchDocuments = async () => {
        if (isFetching.value) return false

        const requestId = ++currentRequestId

        try {
            isFetching.value = true

            if (requestId !== currentRequestId) return false

            const filters: OrderTableFilters = {
                ...activeFilters.value,
                search: searchQuery.value?.trim() || undefined,
                page: currentPage.value,
                per_page: itemsPerPage.value,
                sort_by: sortBy.value,
                sort_order: sortDirection.value,
            }

            let success = false

            if (pathRole.value === 'supplier') {
                success = await getSupplierOrders(filters)
            } else if (pathRole.value === 'buyer') {
                success = await getBuyerOrders(filters)
            }

            if (requestId !== currentRequestId) return false

            if (success) {
                hasLoadedOnce.value = true
            }

            return success
        } catch (err: any) {
            if (requestId !== currentRequestId) return false
            console.error('Failed to fetch documents:', err)
            toast.error(err.message || t('documents.errors.loadFailed'))
            return false
        } finally {
            if (requestId === currentRequestId) {
                isFetching.value = false
            }
        }
    }

    const fetchFilters = async () => {
        try {
            if (pathRole.value === 'supplier') {
                await getSupplierFilters()
            } else if (pathRole.value === 'buyer') {
                await getBuyerFilters()
            }
        } catch (err: any) {
            console.error('Failed to fetch filters:', err)
        }
    }
    const handleDownloadOrder = async (orderId: number, number: string) => {
        try {
            const success = await documentsStore.downloadPdf(orderId, `document-${number}.pdf`)

            if (success) {
                toast.success(t('orders.notifications.downloadSuccess'))
            } else {
                toast.error(t('orders.notifications.downloadFailed'))
            }
        } catch (error) {
            console.error('Download order error:', error)
            toast.error(t('orders.notifications.downloadFailed'))
        }
    }
    const debouncedFetch = useDebounceFn(fetchDocuments, 300)

    const handlePageChange = (page: number) => {
        if (currentPage.value === page || isFetching.value) return

        const maxPage = Math.max(1, totalPages.value)
        const validPage = Math.max(1, Math.min(page, maxPage))

        currentPage.value = validPage
        nextTick(() => fetchDocuments())
    }

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        if (itemsPerPage.value === newItemsPerPage || isFetching.value) return

        itemsPerPage.value = newItemsPerPage
        currentPage.value = 1
        nextTick(() => fetchDocuments())
    }

    const handleSortChange = (
        field: OrderTableSortField | undefined,
        direction: 'asc' | 'desc' | undefined
    ) => {
        if (isFetching.value) return

        sortBy.value = field
        sortDirection.value = direction
        currentPage.value = 1
        nextTick(() => fetchDocuments())
    }

    const handleTableAction = async (action: { type: string; row: any }) => {
        switch (action.type) {
            case 'view-pdf':
                const { id, number } = action.row
                // Handle PDF view
                if (id) {
                    handleDownloadOrder(id, number)
                }
                break
            default:
                console.warn('Unknown action type:', action.type)
        }
    }

    const openFilters = () => {
        isFilterDrawerOpen.value = true
    }

    const handleApplyFilters = (filters: OrderTableFilters) => {
        activeFilters.value = { ...filters }
        isFilterDrawerOpen.value = false
        currentPage.value = 1
        debouncedFetch()
    }

    const resetFilters = () => {
        activeFilters.value = {
            search: '',
            type: undefined,
            status_ids: [],
            payment_status_ids: [],
            currency_ids: [],
            amount_min: undefined,
            amount_max: undefined,
            date_from: undefined,
            date_to: undefined,
        }
        searchQuery.value = ''
        currentPage.value = 1

        if (isFilterDrawerOpen.value) {
            isFilterDrawerOpen.value = false
        }

        debouncedFetch()
    }

    const handleRetry = async () => {
        isRetrying.value = true
        hasLoadedOnce.value = false
        resetError()
        try {
            await fetchDocuments()
            await fetchFilters()
        } finally {
            isRetrying.value = false
        }
    }

    watch(
        () => searchQuery.value,
        () => {
            currentPage.value = 1
            debouncedFetch()
        }
    )

    watch(
        () => pathRole.value,
        () => {
            hasLoadedOnce.value = false
            currentPage.value = 1
            fetchDocuments()
            fetchFilters()
        }
    )

    onMounted(async () => {
        await fetchDocuments()
    })
</script>
