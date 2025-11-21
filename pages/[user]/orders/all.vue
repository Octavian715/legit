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
                {{ t('ordersDashboard.errors.loadFailed') }}
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
                            {{ t('ordersDashboard.status.all') }}
                        </h1>
                        <p class="text-gray-800 text-subtitle3 mt-1">
                            {{
                                totalOrders
                                    ? `${totalOrders} ${t('ordersDashboard.orders')}`
                                    : t('ordersDashboard.title')
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
                        <TableSkeleton v-if="isLoadingTab" :rows="10" :columns="9" />
                        <OrdersTab
                            v-else-if="hasTabBeenSelected[index]"
                            :filters="ordersFilters"
                            :refresh-key="refreshKey"
                            :view-as="pathRole"
                            :active-tab-key="activeTabKey"
                            @open-filters="openFilters"
                            @update-count="handleUpdateCount"
                            @meta-updated="handleMetaUpdated"
                            @download="handleDownloadOrder"
                            @delete="handleDeleteOrder"
                            @confirm="handleConfirmOrder"
                            @reject="handleRejectOrder"
                            @edit="handleEditOrder"
                            @request-feedback="handleRequestFeedback"
                            @reset="handleResetOrder"
                            @update-status="handleUpdateStatus"
                        />
                    </template>
                </Tabs2>
            </div>
        </div>

        <ClientOnly>
            <OrdersFilterDrawer
                v-if="isComponentsReady"
                :is-open="isFilterDrawerOpen"
                :filters="ordersFilters"
                :active-tab="activeTabKey"
                @update:is-open="isFilterDrawerOpen = $event"
                @apply="handleApplyFilters"
                @reset="resetFilters"
            />
        </ClientOnly>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, defineAsyncComponent, nextTick, watch } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useLocalePath, useRoute, useRouter } from '#imports'
    import { useDebounceFn } from '@vueuse/core'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { useOrderTableDashboard } from '~/composables/useOrderTableDashboard'
    import { useStaticData } from '~/composables/useStaticData'
    import { useConfirmation } from '~/composables/useConfirmModal'
    import type { OrderTableFilters, OrderTableMeta } from '~/types/orderTableDashboard'

    const OrdersTab = defineAsyncComponent(
        () => import('~/components/features/supplier/orders/all/tabs/OrdersTab.vue')
    )
    const OrdersFilterDrawer = defineAsyncComponent(
        () => import('~/components/features/supplier/orders/all/OrdersFilterDrawer.vue')
    )

    definePageMeta({
        middleware: ['role', 'dashboard'],
        layout: 'app',
    })

    const { t } = useI18n()
    const localePath = useLocalePath()
    const route = useRoute()
    const router = useRouter()
    const toast = useToastNotification()
    const documentsStore = useDocumentsStore()
    const { showConfirmation } = useConfirmation()
    const {
        documentStatusOptions,
        documentPaymentStatusOptions,
        documentStatuses,
        documentPaymentStatuses,
    } = useStaticData()

    const {
        getSupplierFilters,
        getBuyerFilters,
        error,
        resetError,
        mapMetaCountsToTabs,
        totalOrders,
        triggerRefresh,
    } = useOrderTableDashboard()

    const pathRole = computed<'supplier' | 'buyer' | null>(() => {
        const path = route.path
        if (path.includes('/supplier/')) return 'supplier'
        if (path.includes('/buyer/')) return 'buyer'
        return null
    })

    const tabConfig = computed(() => {
        const tabs: Array<{
            key: string
            labelKey?: string
            label?: string
            badge?: string | number
            statusId?: number
            paymentStatusId?: number
            isCustom: boolean
        }> = []

        tabs.push({
            key: 'all',
            labelKey: 'ordersDashboard.status.all',
            isCustom: true,
        })

        documentStatuses.value.forEach((status) => {
            tabs.push({
                key: status.code,
                label: status.name,
                statusId: status.id,
                isCustom: false,
            })
        })

        documentPaymentStatuses.value.forEach((paymentStatus) => {
            tabs.push({
                key: `payment_${paymentStatus.code}`,
                label: paymentStatus.name,
                paymentStatusId: paymentStatus.id,
                isCustom: false,
            })
        })

        return tabs
    })

    const tabsRef = ref()
    const activeTabIndex = ref(0)
    const hasTabBeenSelected = ref<Record<number, boolean>>({})
    const isFilterDrawerOpen = ref(false)
    const refreshKey = ref(triggerRefresh.value)
    const isComponentsReady = ref(false)
    const isRetrying = ref(false)
    const isLoadingTab = ref(true)
    const searchQuery = ref('')

    const activeFilters = ref<OrderTableFilters>({
        type: 'order',
        search: '',
        status_ids: [],
        payment_status_ids: [],
        currency_ids: [],
        amount_min: undefined,
        amount_max: undefined,
        date_from: undefined,
        date_to: undefined,
    })

    const tabCounts = ref<Record<string, number>>({})

    const ordersFilters = computed<OrderTableFilters>(() => {
        const filters: OrderTableFilters = {
            type: 'order',
            page: 1,
            per_page: 10,
        }

        if (searchQuery.value?.trim()) {
            filters.search = searchQuery.value.trim()
        }

        const currentTab = tabConfig.value[activeTabIndex.value]

        if (currentTab && !currentTab.isCustom) {
            if (currentTab.statusId) {
                filters.status_ids = [currentTab.statusId]
            }
            if (currentTab.paymentStatusId) {
                filters.payment_status_ids = [currentTab.paymentStatusId]
            }
        }

        // Merge order status filters from drawer
        // Available on: "all" tab OR payment status tabs (NOT on order status tabs)
        if (activeFilters.value?.status_ids?.length) {
            const isPaymentStatusTab = currentTab?.key?.startsWith('payment_')
            if (currentTab?.isCustom || isPaymentStatusTab) {
                filters.status_ids = [...activeFilters.value.status_ids]
            }
        }

        // Merge payment status filters from drawer
        // Available on: "all" tab OR order status tabs (NOT on payment status tabs)
        if (activeFilters.value?.payment_status_ids?.length) {
            const isPaymentStatusTab = currentTab?.key?.startsWith('payment_')
            const isOrderStatusTab = !currentTab?.isCustom && !isPaymentStatusTab
            if (currentTab?.isCustom || isOrderStatusTab) {
                filters.payment_status_ids = [...activeFilters.value.payment_status_ids]
            }
        }

        if (activeFilters.value?.currency_ids?.length) {
            filters.currency_ids = [...activeFilters.value.currency_ids]
        }

        if (activeFilters.value?.amount_min !== undefined) {
            filters.amount_min = activeFilters.value.amount_min
        }

        if (activeFilters.value?.amount_max !== undefined) {
            filters.amount_max = activeFilters.value.amount_max
        }

        if (activeFilters.value?.date_from) {
            filters.date_from = activeFilters.value.date_from
        }

        if (activeFilters.value?.date_to) {
            filters.date_to = activeFilters.value.date_to
        }

        return filters
    })

    const hasActiveFilters = computed(() => {
        return (
            activeFilters.value?.status_ids?.length ||
            activeFilters.value?.payment_status_ids?.length ||
            activeFilters.value?.currency_ids?.length ||
            activeFilters.value?.amount_min !== undefined ||
            activeFilters.value?.amount_max !== undefined ||
            activeFilters.value?.date_from ||
            activeFilters.value?.date_to ||
            searchQuery.value?.trim()
        )
    })

    const tabs = computed(() =>
        tabConfig.value.map((config) => ({
            id: config.key,
            badge: tabCounts.value[config.key],
            label: config.labelKey ? `${t(config.labelKey)}` : `${config.label} `,
        }))
    )

    const activeTabKey = computed(() => {
        return tabConfig.value[activeTabIndex.value]?.key || 'all'
    })

    const breadcrumbItems = computed(() => [
        { label: t('home'), to: localePath(`/${pathRole.value}/dashboard`) },
        {
            label: t('ordersDashboard.title'),
            to: localePath(`/${pathRole.value}/orders/all`),
        },
    ])

    const getTabIndexByKey = (tabKey: string): number => {
        return tabConfig.value.findIndex((config) => config.key === tabKey)
    }

    const handleTabChange = (index: number) => {
        hasTabBeenSelected.value[index] = true
        activeTabIndex.value = index
        isLoadingTab.value = false

        const tabKey = tabConfig.value[index]?.key
        if (tabKey) {
            const newQuery = { ...route.query }
            if (tabKey === 'all') {
                delete newQuery.tab
            } else {
                newQuery.tab = tabKey
            }

            router.replace({
                path: route.path,
                query: newQuery,
            })
        }
    }

    const openFilters = () => {
        isFilterDrawerOpen.value = true
    }

    const handleUpdateCount = (payload: { tabKey: string; count: number; meta: any }) => {
        if (typeof payload.count === 'number') {
            tabCounts.value[payload.tabKey] = payload.count
        }
    }

    const handleMetaUpdated = (meta: OrderTableMeta) => {
        if (meta) {
            const mappedCounts = mapMetaCountsToTabs(meta)

            Object.entries(mappedCounts).forEach(([tabKey, count]) => {
                if (typeof count === 'number') {
                    tabCounts.value[tabKey] = count
                }
            })

            isLoadingTab.value = false
        }
    }

    const debouncedRefreshKey = useDebounceFn(() => {
        refreshKey.value++
    }, 300)

    const handleApplyFilters = (filters: OrderTableFilters) => {
        activeFilters.value = {
            type: 'order',
            search: filters.search || '',
            status_ids: filters.status_ids || [],
            payment_status_ids: filters.payment_status_ids || [],
            currency_ids: filters.currency_ids || [],
            amount_min: filters.amount_min,
            amount_max: filters.amount_max,
            date_from: filters.date_from,
            date_to: filters.date_to,
        }

        isFilterDrawerOpen.value = false
        refreshKey.value++
    }

    const resetFilters = () => {
        activeFilters.value = {
            type: 'order',
            search: '',
            status_ids: [],
            payment_status_ids: [],
            currency_ids: [],
            amount_min: undefined,
            amount_max: undefined,
            date_from: undefined,
            date_to: undefined,
        }

        searchQuery.value = ''
        refreshKey.value++

        if (isFilterDrawerOpen.value) {
            isFilterDrawerOpen.value = false
        }
    }

    const handleDownloadOrder = async (orderId: number, orderData: any) => {
        try {
            const success = await documentsStore.downloadPdf(
                orderId,
                `order-${orderData.number || orderId}.pdf`
            )

            if (success) {
                toast.success(t('orders.notifications.downloadSuccess'))
            } else {
                toast.error(t('orders.notifications.downloadFailed'))
            }
        } catch (error) {
            toast.error(t('orders.notifications.downloadFailed'))
        }
    }

    const handleDeleteOrder = async (orderId: number, orderData: any) => {
        const confirmed = await showConfirmation({
            title: t('orders.modal.delete.title'),
            message: t('orders.modal.delete.message', {
                number: orderData?.number || `#${orderId}`,
            }),
            details: [
                {
                    label: t('orders.fields.orderNumber'),
                    value: orderData?.number || `#${orderId}`,
                },
                {
                    label: t('orders.fields.buyer'),
                    value: orderData?.buyer?.name || orderData?.buyer?.email || t('common.unknown'),
                },
            ],
            warningText: t('orders.modal.delete.warning'),
            confirmText: t('delete'),
            cancelText: t('cancel'),
            confirmColor: 'red',
            iconType: 'danger',
            showIcon: true,
            contentWidth: 'max-w-lg',
        })

        if (!confirmed) return

        try {
            const success = await documentsStore.deleteDocument(orderId)

            if (success) {
                toast.success(t('orders.notifications.deleteSuccess'))
                refreshKey.value++
            } else {
                toast.error(t('orders.notifications.deleteFailed'))
            }
        } catch (error) {
            toast.error(t('orders.notifications.deleteFailed'))
        }
    }

    const handleConfirmOrder = async (orderId: number, orderData: any) => {
        const confirmed = await showConfirmation({
            title: t('orders.modal.confirm.title'),
            message: t('orders.modal.confirm.message', {
                number: orderData?.number || `#${orderId}`,
            }),
            details: [
                {
                    label: t('orders.fields.orderNumber'),
                    value: orderData?.number || `#${orderId}`,
                },
                {
                    label: t('orders.fields.buyer'),
                    value: orderData?.buyer?.name || orderData?.buyer?.email || t('common.unknown'),
                },
                {
                    label: t('orders.fields.total'),
                    value: `${orderData?.total || 0} ${orderData?.currency?.symbol || '€'}`,
                },
            ],
            confirmText: t('orders.modal.confirm.confirm'),
            cancelText: t('cancel'),
            confirmColor: 'green',
            iconType: 'question',
            showIcon: true,
            contentWidth: 'max-w-lg',
        })

        if (!confirmed) return

        try {
            const success = await documentsStore.confirmDocument(orderId)

            if (success) {
                toast.success(t('orders.notifications.confirmSuccess'))
                refreshKey.value++
            } else {
                toast.error(t('orders.notifications.confirmFailed'))
            }
        } catch (error) {
            toast.error(t('orders.notifications.confirmFailed'))
        }
    }

    const handleRejectOrder = async (orderId: number, orderData: any) => {
        const confirmed = await showConfirmation({
            title: t('orders.modal.reject.title'),
            message: t('orders.modal.reject.message', {
                number: orderData?.number || `#${orderId}`,
            }),
            details: [
                {
                    label: t('orders.fields.orderNumber'),
                    value: orderData?.number || `#${orderId}`,
                },
                {
                    label: t('orders.fields.buyer'),
                    value: orderData?.buyer?.name || orderData?.buyer?.email || t('common.unknown'),
                },
                {
                    label: t('orders.fields.total'),
                    value: `${orderData?.total || 0} ${orderData?.currency?.symbol || '€'}`,
                },
            ],
            warningText: t('orders.modal.reject.warning'),
            confirmText: t('orders.modal.reject.confirm'),
            cancelText: t('cancel'),
            confirmColor: 'red',
            iconType: 'danger',
            showIcon: true,
            contentWidth: 'max-w-lg',
        })

        if (!confirmed) return

        try {
            const success = await documentsStore.rejectDocument(orderId)

            if (success) {
                toast.success(t('orders.notifications.rejectSuccess'))
                refreshKey.value++
            } else {
                toast.error(t('orders.notifications.rejectFailed'))
            }
        } catch (error) {
            toast.error(t('orders.notifications.rejectFailed'))
        }
    }

    const handleEditOrder = (orderId: number, orderData: any) => {
        router.push(localePath(`/${pathRole.value}/orders/${orderId}/edit`))
    }

    const handleRequestFeedback = async (orderId: number, orderData: any) => {
        toast.info(t('orders.notifications.feedbackRequested'))
    }

    const handleResetOrder = async (orderId: number, orderData: any) => {
        const confirmed = await showConfirmation({
            title: t('orders.modal.reset.title'),
            message: t('orders.modal.reset.message', {
                number: orderData?.number || `#${orderId}`,
            }),
            details: [
                {
                    label: t('orders.fields.orderNumber'),
                    value: orderData?.number || `#${orderId}`,
                },
            ],
            confirmText: t('orders.modal.reset.confirm'),
            cancelText: t('cancel'),
            confirmColor: 'blue',
            iconType: 'info',
            showIcon: true,
            contentWidth: 'max-w-lg',
        })

        if (!confirmed) return

        const activeStatusId =
            documentStatusOptions.value.find((s) => s.code === 'active')?.value || 1

        try {
            await documentsStore.updateDocument(orderId, {
                status_id: activeStatusId,
            })

            toast.success(t('orders.notifications.resetSuccess'))
            refreshKey.value++
        } catch (error) {
            toast.error(t('orders.notifications.resetFailed'))
        }
    }

    const handleUpdateStatus = async (payload: {
        orderId: number
        statusId?: number
        paymentStatusId?: number
        orderData: any
    }) => {
        try {
            const updateData: any = {}

            if (payload.statusId !== undefined) {
                const status = documentStatuses.value.find((s) => s.id === payload.statusId)
                if (status && ['pending', 'confirmed', 'rejected'].includes(status.code)) {
                    toast.error(
                        t(
                            'orders.error.cannotSetStatus',
                            'Cannot manually set this status. Use confirm/reject actions.'
                        )
                    )
                    return
                }
                updateData.status_id = payload.statusId
            }

            if (payload.paymentStatusId !== undefined) {
                updateData.payment_status_id = payload.paymentStatusId
            }

            await documentsStore.updateDocument(payload.orderId, updateData)

            toast.success(t('orders.notifications.updateSuccess'))
            refreshKey.value++
        } catch (error) {
            toast.error(t('orders.notifications.updateFailed'))
        }
    }

    const initializeFromRoute = () => {
        const tabFromQuery = route.query.tab as string
        const DEFAULT_TAB = 'pending'

        if (tabFromQuery) {
            const tabIndex = getTabIndexByKey(tabFromQuery)
            if (tabIndex !== -1) {
                activeTabIndex.value = tabIndex
                hasTabBeenSelected.value[tabIndex] = true
            } else {
                const defaultTabIndex = getTabIndexByKey(DEFAULT_TAB)
                if (defaultTabIndex !== -1) {
                    activeTabIndex.value = defaultTabIndex
                    hasTabBeenSelected.value[defaultTabIndex] = true

                    router.replace({
                        path: route.path,
                        query: { ...route.query, tab: DEFAULT_TAB },
                    })
                } else {
                    hasTabBeenSelected.value[0] = true
                }
            }
        } else {
            const defaultTabIndex = getTabIndexByKey(DEFAULT_TAB)
            if (defaultTabIndex !== -1) {
                activeTabIndex.value = defaultTabIndex
                hasTabBeenSelected.value[defaultTabIndex] = true

                router.replace({
                    path: route.path,
                    query: { ...route.query, tab: DEFAULT_TAB },
                })
            } else {
                hasTabBeenSelected.value[0] = true
            }
        }
    }

    const initializeFilters = async () => {
        try {
            if (pathRole.value === 'supplier') {
                await getSupplierFilters()
            } else if (pathRole.value === 'buyer') {
                await getBuyerFilters()
            }
        } catch (error: any) {
            toast.error(
                t('ordersDashboard.errors.initializationFailed', 'Failed to initialize page')
            )
        }
    }

    const handleRetry = async () => {
        isRetrying.value = true
        isLoadingTab.value = true
        resetError()

        try {
            await initializeFilters()
            refreshKey.value++
        } finally {
            isRetrying.value = false
        }
    }

    watch(
        () => searchQuery.value,
        () => {
            debouncedRefreshKey()
        }
    )

    watch(
        () => pathRole.value,
        async (newRole) => {
            if (newRole) {
                isLoadingTab.value = true
                await initializeFilters()
                refreshKey.value++
            }
        }
    )

    watch(error, (newError) => {
        if (newError?.message) {
            toast.error(newError.message)
            resetError()
        }
    })

    watch(
        () => triggerRefresh.value,
        () => {
            refreshKey.value++
        }
    )

    onMounted(async () => {
        await nextTick()

        initializeFromRoute()

        await nextTick()

        if (!hasTabBeenSelected.value[activeTabIndex.value]) {
            hasTabBeenSelected.value[activeTabIndex.value] = true
        }

        await initializeFilters()

        isComponentsReady.value = true
        isLoadingTab.value = false
    })

    useSeoMeta({
        title: () => t('ordersDashboard.status.all'),
        description: () => t('ordersDashboard.subtitle', 'Manage and track all your orders'),
    })
</script>

<style scoped lang="scss">
    .loader {
        @apply border-2 border-gray-300 border-t-blue-600 rounded-full w-4 h-4 animate-spin;
    }
</style>
