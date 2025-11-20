<template>
    <Drawer
        :is-open="isOpen"
        position="right"
        :title="t('filters.title')"
        :sub-title="
            activeFiltersCount > 0
                ? t('filters.appliedCount', { count: activeFiltersCount })
                : t('filters.noFiltersApplied')
        "
        :width="'400px'"
        :show-default-footer="false"
        @update:is-open="$emit('update:isOpen', $event)"
    >
        <template #default>
            <div v-if="isInitializing" class="flex items-center justify-center mx-auto h-full">
                <div class="flex justify-center items-center p-8 rotate-90">
                    <span class="loader"></span>
                </div>
            </div>

            <div v-else-if="initializationError" class="p-4 bg-red-50 rounded-lg">
                <div class="flex">
                    <svg
                        class="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clip-rule="evenodd"
                        />
                    </svg>
                    <div>
                        <p class="text-sm font-medium text-red-800">{{ t('error') }}</p>
                        <p class="text-sm text-red-700 mt-1">{{ initializationError }}</p>
                        <Button
                            variant="outline"
                            color="red"
                            size="sm"
                            class="mt-2"
                            @click="initializeFilterData"
                        >
                            {{ t('retry') }}
                        </Button>
                    </div>
                </div>
            </div>

            <div v-else class="filters-container">
                <Collapse v-if="statusOptions && statusOptions.length > 0">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('filters.orderStatus')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <div v-if="isOrderStatusTab" class="text-subtitle4 text-gray-800 mb-2">
                            {{
                                t(
                                    'filters.orderStatusDisabledOnStatusTab',
                                    'Order Status filter is disabled because you are viewing a specific status tab'
                                )
                            }}
                        </div>
                        <div class="checkbox-group">
                            <div class="checkbox-grid">
                                <Checkbox
                                    v-for="status in statusOptions"
                                    :key="`status-${status.id}`"
                                    :model-value="selectedStatusIds.includes(status.id)"
                                    :label="getStatusName(status.code)"
                                    :name="`status-${status.id}`"
                                    :disabled="isOrderStatusTab"
                                    class="capitalize"
                                    @update:model-value="
                                        (checked) => toggleStatus(status.id, checked)
                                    "
                                />
                            </div>
                        </div>
                    </div>
                </Collapse>

                <Collapse v-if="paymentStatusOptions && paymentStatusOptions.length > 0">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('filters.paymentStatus')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <div v-if="isPaymentStatusTab" class="text-subtitle4 text-gray-800 mb-2">
                            {{
                                t(
                                    'filters.paymentStatusDisabledOnPaymentTab',
                                    'Payment Status filter is disabled because you are viewing a specific payment status tab'
                                )
                            }}
                        </div>
                        <div class="checkbox-group">
                            <div class="checkbox-grid">
                                <Checkbox
                                    v-for="paymentStatus in paymentStatusOptions"
                                    :key="`payment-status-${paymentStatus.id}`"
                                    :model-value="
                                        selectedPaymentStatusIds.includes(paymentStatus.id)
                                    "
                                    :label="getPaymentStatusName(paymentStatus.code)"
                                    :name="`payment-status-${paymentStatus.id}`"
                                    :disabled="isPaymentStatusTab"
                                    class="capitalize"
                                    @update:model-value="
                                        (checked) => togglePaymentStatus(paymentStatus.id, checked)
                                    "
                                />
                            </div>
                        </div>
                    </div>
                </Collapse>

                <Collapse v-if="currencyOptions && currencyOptions.length > 0">
                    <template #title>
                        <span class="text-subtitle font-medium">{{ t('filters.currency') }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="checkbox-group">
                            <div class="checkbox-grid">
                                <Checkbox
                                    v-for="currency in currencyOptions"
                                    :key="`currency-${currency.id}`"
                                    :model-value="selectedCurrencyIds.includes(currency.id)"
                                    :label="`${currency.code || t('unknown')} (${currency.symbol})`"
                                    :name="`currency-${currency.id}`"
                                    @update:model-value="
                                        (checked) => toggleCurrency(currency.id, checked)
                                    "
                                />
                            </div>
                        </div>
                    </div>
                </Collapse>

                <Collapse>
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('filters.totalAmount')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <RangeSlider
                            v-model="amountRangeModel"
                            :min="amountRange ? parseFloat(amountRange.min) : 0"
                            :max="amountRange ? parseFloat(amountRange.max) : 10000"
                            :step="sliderStep"
                            :show-inputs="true"
                            :show-range="false"
                            :show-selected-range="false"
                            :format-type="'currency'"
                            :currency="'EUR'"
                            :min-placeholder="t('filters.from')"
                            :max-placeholder="t('filters.to')"
                            input-size="md"
                            @change="handleAmountRangeChange"
                        />
                    </div>
                </Collapse>

                <Collapse>
                    <template #title>
                        <span class="text-subtitle font-medium">{{ t('filters.dateRange') }}</span>
                    </template>
                    <div class="filter-section">
                        <DatePicker
                            v-model="dateRangeModel"
                            :label="t('filters.chooseDateRange')"
                            :placeholder="t('filters.selectDateRange')"
                            :is-range-mode="true"
                            size="md"
                            date-format="yyyy-MM-dd"
                            @range-selected="onDateRangeSelect"
                        />
                    </div>
                </Collapse>
            </div>
        </template>

        <template #footer>
            <div class="filter-footer">
                <Button
                    variant="outline"
                    color="gray"
                    size="lg"
                    class="flex-1"
                    @click="resetFilters"
                >
                    <svg class="w-4 h-4 mr-2">
                        <use xlink:href="/sprite.svg#reset" />
                    </svg>
                    {{ t('filters.reset') }}
                </Button>
                <Button
                    variant="filled"
                    color="blue"
                    size="lg"
                    class="flex-1"
                    @click="applyFilters"
                >
                    <svg class="w-4 h-4 mr-2">
                        <use xlink:href="/sprite.svg#check" />
                    </svg>
                    {{ t('filters.apply') }}
                </Button>
            </div>
        </template>
    </Drawer>
</template>

<script setup lang="ts">
    import { ref, computed, watch, onMounted } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useRoute } from '#imports'
    import { useOrderTableDashboard } from '~/composables/useOrderTableDashboard'
    import { useStaticData } from '~/composables/useStaticData'
    import type { OrderTableFilters } from '~/types/orderTableDashboard'
    import type { DateRange } from '~/types/ui/datePicker'

    interface Props {
        isOpen: boolean
        filters?: OrderTableFilters
        activeTab?: string
    }

    const props = withDefaults(defineProps<Props>(), {
        filters: () => ({
            type: 'order',
            search: '',
            status_ids: [],
            payment_status_ids: [],
            currency_ids: [],
            amount_min: undefined,
            amount_max: undefined,
            date_from: undefined,
            date_to: undefined,
        }),
        activeTab: 'all',
    })

    const emit = defineEmits<{
        'update:isOpen': [value: boolean]
        apply: [filters: OrderTableFilters]
        reset: []
    }>()

    const { t } = useI18n()
    const route = useRoute()
    const { filterOptions, getSupplierFilters, getBuyerFilters } = useOrderTableDashboard()
    const { documentStatuses, documentPaymentStatuses } = useStaticData()

    const initializationError = ref<string | null>(null)
    const isInitializing = ref(false)
    const isFiltersLoaded = ref(false)
    const searchQuery = ref('')
    const selectedStatusIds = ref<number[]>([])
    const selectedPaymentStatusIds = ref<number[]>([])
    const selectedCurrencyIds = ref<number[]>([])
    const dateRangeModel = ref<DateRange | null>(null)
    const amountRangeModel = ref<{ min: number | null; max: number | null }>({
        min: null,
        max: null,
    })

    const pathRole = computed<'supplier' | 'buyer' | null>(() => {
        const path = route.path
        if (path.includes('/supplier/')) return 'supplier'
        if (path.includes('/buyer/')) return 'buyer'
        return null
    })

    const defaultFilters: OrderTableFilters = {
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

    const localFilters = ref<OrderTableFilters>({ ...defaultFilters })

    const statusOptions = computed(() => {
        return (
            filterOptions.value?.statuses?.filter((item) => item && typeof item.id === 'number') ||
            []
        )
    })

    const paymentStatusOptions = computed(() => {
        return (
            filterOptions.value?.payment_statuses?.filter(
                (item) => item && typeof item.id === 'number'
            ) || []
        )
    })

    const currencyOptions = computed(() => {
        return (
            filterOptions.value?.currencies?.filter(
                (item) => item && typeof item.id === 'number'
            ) || []
        )
    })

    const amountRange = computed(() => filterOptions.value?.amount_range)

    const sliderStep = computed(() => {
        if (!amountRange.value) return 10
        const range = parseFloat(amountRange.value.max) - parseFloat(amountRange.value.min)
        return Math.max(1, Math.floor(range / 100))
    })

    const isAllOrdersTab = computed(() => {
        return props.activeTab === 'all'
    })

    const isPaymentStatusTab = computed(() => {
        return props.activeTab?.startsWith('payment_')
    })

    const isOrderStatusTab = computed(() => {
        return !isAllOrdersTab.value && !isPaymentStatusTab.value
    })

    const activeFiltersCount = computed(() => {
        let count = 0
        if (searchQuery.value?.trim()) count++
        // Count order status filters only if not on an order status tab
        if (!isOrderStatusTab.value && selectedStatusIds.value?.length > 0) count++
        // Count payment status filters only if not on a payment status tab
        if (!isPaymentStatusTab.value && selectedPaymentStatusIds.value?.length > 0) count++
        if (selectedCurrencyIds.value?.length > 0) count++
        if (amountRangeModel.value.min || amountRangeModel.value.max) count++
        if (dateRangeModel.value?.start && dateRangeModel.value?.end) count++
        return count
    })

    const getStatusName = (code: string): string => {
        const status = documentStatuses.value.find((s) => s.code === code)
        return status?.name || code.replace(/_/g, ' ')
    }

    const getPaymentStatusName = (code: string): string => {
        const status = documentPaymentStatuses.value.find((s) => s.code === code)
        return status?.name || code.replace(/_/g, ' ')
    }

    const initializeFilterData = async (): Promise<void> => {
        if (isInitializing.value) return

        isInitializing.value = true
        initializationError.value = null

        try {
            let success = false

            if (pathRole.value === 'supplier') {
                success = await getSupplierFilters()
            } else if (pathRole.value === 'buyer') {
                success = await getBuyerFilters()
            }

            if (!success) {
                throw new Error(t('filters.loadError'))
            }

            isFiltersLoaded.value = true
        } catch (error: any) {
            console.error('[OrdersFilterDrawer] Failed to initialize filter data:', error)
            initializationError.value = error.message || t('filters.loadError')
        } finally {
            isInitializing.value = false
        }
    }

    const handleAmountRangeChange = (value: { min: number | null; max: number | null }) => {
        amountRangeModel.value = value
    }

    const toggleStatus = (statusId: number, checked: boolean) => {
        if (typeof statusId !== 'number' || statusId <= 0) return

        if (checked) {
            if (!selectedStatusIds.value.includes(statusId)) {
                selectedStatusIds.value.push(statusId)
            }
        } else {
            const index = selectedStatusIds.value.indexOf(statusId)
            if (index > -1) {
                selectedStatusIds.value.splice(index, 1)
            }
        }
    }

    const togglePaymentStatus = (paymentStatusId: number, checked: boolean) => {
        if (typeof paymentStatusId !== 'number' || paymentStatusId <= 0) return

        if (checked) {
            if (!selectedPaymentStatusIds.value.includes(paymentStatusId)) {
                selectedPaymentStatusIds.value.push(paymentStatusId)
            }
        } else {
            const index = selectedPaymentStatusIds.value.indexOf(paymentStatusId)
            if (index > -1) {
                selectedPaymentStatusIds.value.splice(index, 1)
            }
        }
    }

    const toggleCurrency = (currencyId: number, checked: boolean) => {
        if (typeof currencyId !== 'number' || currencyId <= 0) return

        if (checked) {
            if (!selectedCurrencyIds.value.includes(currencyId)) {
                selectedCurrencyIds.value.push(currencyId)
            }
        } else {
            const index = selectedCurrencyIds.value.indexOf(currencyId)
            if (index > -1) {
                selectedCurrencyIds.value.splice(index, 1)
            }
        }
    }

    const onDateRangeSelect = (range: DateRange) => {
        dateRangeModel.value = range

        if (range && range.start && range.end) {
            localFilters.value.date_from = range.start
            localFilters.value.date_to = range.end
        } else {
            localFilters.value.date_from = undefined
            localFilters.value.date_to = undefined
        }
    }

    const applyFilters = () => {
        const orderFilters: OrderTableFilters = { type: 'order' }

        if (searchQuery.value?.trim()) {
            orderFilters.search = searchQuery.value.trim()
        }

        // Apply order status filters only if NOT on an order status tab
        if (!isOrderStatusTab.value && selectedStatusIds.value?.length > 0) {
            orderFilters.status_ids = [...selectedStatusIds.value]
        }

        // Apply payment status filters only if NOT on a payment status tab
        if (!isPaymentStatusTab.value && selectedPaymentStatusIds.value?.length > 0) {
            orderFilters.payment_status_ids = [...selectedPaymentStatusIds.value]
        }

        if (selectedCurrencyIds.value?.length > 0) {
            orderFilters.currency_ids = [...selectedCurrencyIds.value]
        }

        if (amountRangeModel.value.min !== null) {
            orderFilters.amount_min = amountRangeModel.value.min
        }

        if (amountRangeModel.value.max !== null) {
            orderFilters.amount_max = amountRangeModel.value.max
        }

        if (localFilters.value.date_from) {
            orderFilters.date_from = localFilters.value.date_from
        }

        if (localFilters.value.date_to) {
            orderFilters.date_to = localFilters.value.date_to
        }

        emit('apply', orderFilters)
    }

    const resetFilters = () => {
        searchQuery.value = ''
        selectedStatusIds.value = []
        selectedPaymentStatusIds.value = []
        selectedCurrencyIds.value = []
        dateRangeModel.value = null
        amountRangeModel.value = { min: null, max: null }
        localFilters.value = { ...defaultFilters }

        emit('reset')
    }

    const syncFiltersFromProps = () => {
        if (props.filters) {
            localFilters.value = {
                ...defaultFilters,
                ...props.filters,
            }

            searchQuery.value = props.filters.search || ''
            selectedStatusIds.value = [...(props.filters.status_ids || [])]
            selectedPaymentStatusIds.value = [...(props.filters.payment_status_ids || [])]
            selectedCurrencyIds.value = [...(props.filters.currency_ids || [])]

            amountRangeModel.value = {
                min: props.filters.amount_min || null,
                max: props.filters.amount_max || null,
            }

            if (props.filters.date_from && props.filters.date_to) {
                dateRangeModel.value = {
                    start: props.filters.date_from,
                    end: props.filters.date_to,
                }
            } else {
                dateRangeModel.value = null
            }
        }
    }

    watch(
        () => props.filters,
        () => syncFiltersFromProps(),
        { immediate: true, deep: true }
    )

    watch(
        () => props.activeTab,
        (newTab, oldTab) => {
            if (newTab !== oldTab && oldTab !== undefined) {
                // Clear order status filters when switching to an order status tab
                if (newTab !== 'all' && !newTab?.startsWith('payment_')) {
                    selectedStatusIds.value = []
                }
                // Clear payment status filters when switching to a payment status tab
                if (newTab?.startsWith('payment_')) {
                    selectedPaymentStatusIds.value = []
                }
            }
        }
    )

    watch(
        () => props.isOpen,
        async (val) => {
            if (val && !isFiltersLoaded.value) {
                await initializeFilterData()
            }
        },
        { immediate: true }
    )

    watch(
        () => pathRole.value,
        () => {
            isFiltersLoaded.value = false
            if (props.isOpen) {
                initializeFilterData()
            }
        }
    )

    onMounted(() => {
        if (props.isOpen && !isFiltersLoaded.value) {
            initializeFilterData()
        }
    })
</script>

<style scoped lang="scss">
    .filters-container {
        @apply space-y-2;
    }

    .filter-section {
        @apply py-2;
    }

    .checkbox-grid {
        @apply grid grid-cols-2 gap-2;
    }

    .filter-footer {
        @apply flex gap-3 px-4;
    }

    .loader {
        @apply border-2 border-gray-300 border-t-blue-600 rounded-full w-4 h-4 animate-spin;
    }
</style>
