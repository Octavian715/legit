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
                <Collapse v-if="documentTypeOptions.length > 0">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('filters.documentType')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="filter-options">
                            <Checkbox
                                v-for="docType in documentTypeOptions"
                                :key="docType.value"
                                :model-value="selectedType === docType.value"
                                :name="`type-${docType.value}`"
                                size="md"
                                @update:model-value="
                                    (checked) => toggleDocumentType(docType.value, checked)
                                "
                            >
                                <template #default>
                                    <span class="text-body">{{ docType.label }}</span>
                                </template>
                            </Checkbox>
                        </div>
                    </div>
                </Collapse>

                <Collapse v-if="statusOptions.length > 0">
                    <template #title>
                        <span class="text-subtitle font-medium">{{ t('table.status') }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="filter-options">
                            <Checkbox
                                v-for="status in statusOptions"
                                :key="`status-${status.id}`"
                                :model-value="isStatusSelected(status.id)"
                                :name="`status-${status.id}`"
                                size="md"
                                @update:model-value="(checked) => toggleStatus(status.id, checked)"
                            >
                                <template #default>
                                    <span class="text-body">{{
                                        formatStatusName(status.code)
                                    }}</span>
                                </template>
                            </Checkbox>
                        </div>
                    </div>
                </Collapse>

                <Collapse v-if="paymentStatusOptions.length > 0">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('table.paymentStatus')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="filter-options">
                            <Checkbox
                                v-for="paymentStatus in paymentStatusOptions"
                                :key="`payment-${paymentStatus.id}`"
                                :model-value="isPaymentStatusSelected(paymentStatus.id)"
                                :name="`payment-${paymentStatus.id}`"
                                size="md"
                                @update:model-value="
                                    (checked) => togglePaymentStatus(paymentStatus.id, checked)
                                "
                            >
                                <template #default>
                                    <span class="text-body">{{
                                        formatStatusName(paymentStatus.code)
                                    }}</span>
                                </template>
                            </Checkbox>
                        </div>
                    </div>
                </Collapse>

                <Collapse v-if="currencyOptions.length > 0">
                    <template #title>
                        <span class="text-subtitle font-medium">{{ t('table.currency') }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="filter-options">
                            <Checkbox
                                v-for="currency in currencyOptions"
                                :key="`currency-${currency.id}`"
                                :model-value="isCurrencySelected(currency.id)"
                                :name="`currency-${currency.id}`"
                                size="md"
                                @update:model-value="
                                    (checked) => toggleCurrency(currency.id, checked)
                                "
                            >
                                <template #default>
                                    <span class="text-body"
                                        >{{ currency.code }} ({{ currency.symbol }})</span
                                    >
                                </template>
                            </Checkbox>
                        </div>
                    </div>
                </Collapse>

                <Collapse>
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('filters.amountRange')
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
    import { ref, computed, watch } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useRoute } from '#imports'
    import { useOrderTableDashboard } from '~/composables/useOrderTableDashboard'
    import type { OrderTableFilters } from '~/types/orderTableDashboard'
    import type { DateRange } from '~/types/ui/datePicker'

    interface Props {
        isOpen: boolean
        filters?: OrderTableFilters
    }

    const props = withDefaults(defineProps<Props>(), {
        filters: () => ({}),
    })

    const emit = defineEmits<{
        'update:isOpen': [value: boolean]
        apply: [filters: OrderTableFilters]
        reset: []
    }>()

    const { t } = useI18n()
    const route = useRoute()

    const { filterOptions, getSupplierFilters, getBuyerFilters } = useOrderTableDashboard()

    const isInitializing = ref(false)
    const initializationError = ref<string | null>(null)

    const defaultFilters: OrderTableFilters = {
        type: undefined,
        status_ids: [],
        payment_status_ids: [],
        currency_ids: [],
        amount_min: undefined,
        amount_max: undefined,
        date_from: undefined,
        date_to: undefined,
    }

    const localFilters = ref<OrderTableFilters>({ ...defaultFilters })
    const selectedType = ref<string | undefined>(undefined)
    const dateRangeModel = ref<DateRange | null>(null)
    const amountRangeModel = ref<{ min: number | null; max: number | null }>({
        min: null,
        max: null,
    })

    const pathRole = computed(() => {
        const path = route.path
        if (path.includes('/supplier/')) return 'supplier'
        if (path.includes('/buyer/')) return 'buyer'
        return null
    })

    const documentTypeOptions = computed(() => [
        { value: 'order', label: t('documents.types.order') },
        { value: 'offer', label: t('documents.types.offer') },
        { value: 'delivery_note', label: t('documents.types.deliveryNote') },
        { value: 'invoice', label: t('documents.types.invoice') },
        { value: 'correction_invoice', label: t('documents.types.correctionInvoice') },
    ])

    const statusOptions = computed(() => filterOptions.value?.statuses || [])
    const paymentStatusOptions = computed(() => filterOptions.value?.payment_statuses || [])
    const currencyOptions = computed(() => filterOptions.value?.currencies || [])
    const amountRange = computed(() => filterOptions.value?.amount_range)

    const sliderStep = computed(() => {
        if (!amountRange.value) return 10
        const range = parseFloat(amountRange.value.max) - parseFloat(amountRange.value.min)
        return Math.max(1, Math.floor(range / 100))
    })

    const activeFiltersCount = computed(() => {
        let count = 0

        if (selectedType.value) count++
        if (localFilters.value.status_ids?.length) count++
        if (localFilters.value.payment_status_ids?.length) count++
        if (localFilters.value.currency_ids?.length) count++
        if (amountRangeModel.value.min || amountRangeModel.value.max) count++
        if (dateRangeModel.value) count++

        return count
    })

    const formatStatusName = (code: string): string => {
        return code.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    }

    const initializeFilterData = async (): Promise<void> => {
        isInitializing.value = true
        initializationError.value = null

        try {
            if (pathRole.value === 'supplier') {
                await getSupplierFilters()
            } else if (pathRole.value === 'buyer') {
                await getBuyerFilters()
            } else {
                throw new Error('Invalid role')
            }

            if (!filterOptions.value) {
                initializationError.value = t('filters.loadError')
            }
        } catch (error: any) {
            console.error('[DocumentsFilterDrawer] Failed to initialize filter data:', error)
            initializationError.value = error.message || t('filters.loadError')
        } finally {
            isInitializing.value = false
        }
    }

    const toggleDocumentType = (typeValue: string, checked: boolean) => {
        selectedType.value = checked ? typeValue : undefined
    }

    const isStatusSelected = (statusId: number): boolean => {
        return localFilters.value.status_ids?.includes(statusId) || false
    }

    const toggleStatus = (statusId: number, checked: boolean) => {
        if (!localFilters.value.status_ids) {
            localFilters.value.status_ids = []
        }

        if (checked) {
            if (!localFilters.value.status_ids.includes(statusId)) {
                localFilters.value.status_ids.push(statusId)
            }
        } else {
            localFilters.value.status_ids = localFilters.value.status_ids.filter(
                (id) => id !== statusId
            )
        }
    }

    const isPaymentStatusSelected = (paymentStatusId: number): boolean => {
        return localFilters.value.payment_status_ids?.includes(paymentStatusId) || false
    }

    const togglePaymentStatus = (paymentStatusId: number, checked: boolean) => {
        if (!localFilters.value.payment_status_ids) {
            localFilters.value.payment_status_ids = []
        }

        if (checked) {
            if (!localFilters.value.payment_status_ids.includes(paymentStatusId)) {
                localFilters.value.payment_status_ids.push(paymentStatusId)
            }
        } else {
            localFilters.value.payment_status_ids = localFilters.value.payment_status_ids.filter(
                (id) => id !== paymentStatusId
            )
        }
    }

    const isCurrencySelected = (currencyId: number): boolean => {
        return localFilters.value.currency_ids?.includes(currencyId) || false
    }

    const toggleCurrency = (currencyId: number, checked: boolean) => {
        if (!localFilters.value.currency_ids) {
            localFilters.value.currency_ids = []
        }

        if (checked) {
            if (!localFilters.value.currency_ids.includes(currencyId)) {
                localFilters.value.currency_ids.push(currencyId)
            }
        } else {
            localFilters.value.currency_ids = localFilters.value.currency_ids.filter(
                (id) => id !== currencyId
            )
        }
    }

    const handleAmountRangeChange = (value: { min: number | null; max: number | null }) => {
        amountRangeModel.value = value
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
        const filtersToApply: OrderTableFilters = {
            type: selectedType.value as any,
            status_ids: localFilters.value.status_ids?.length
                ? localFilters.value.status_ids
                : undefined,
            payment_status_ids: localFilters.value.payment_status_ids?.length
                ? localFilters.value.payment_status_ids
                : undefined,
            currency_ids: localFilters.value.currency_ids?.length
                ? localFilters.value.currency_ids
                : undefined,
            amount_min: amountRangeModel.value.min || undefined,
            amount_max: amountRangeModel.value.max || undefined,
            date_from: localFilters.value.date_from,
            date_to: localFilters.value.date_to,
        }

        emit('apply', filtersToApply)
        emit('update:isOpen', false)
    }

    const resetFilters = () => {
        selectedType.value = undefined
        localFilters.value = { ...defaultFilters }
        dateRangeModel.value = null
        amountRangeModel.value = { min: null, max: null }

        emit('reset')
        emit('update:isOpen', false)
    }

    watch(
        () => props.isOpen,
        async (isOpen) => {
            if (isOpen && !filterOptions.value) {
                await initializeFilterData()
            }
        }
    )

    watch(
        () => props.filters,
        (newFilters) => {
            if (newFilters) {
                localFilters.value = {
                    ...defaultFilters,
                    ...newFilters,
                }
                selectedType.value = newFilters.type

                amountRangeModel.value = {
                    min: newFilters.amount_min || null,
                    max: newFilters.amount_max || null,
                }

                if (newFilters.date_from && newFilters.date_to) {
                    dateRangeModel.value = {
                        start: newFilters.date_from,
                        end: newFilters.date_to,
                    }
                } else {
                    dateRangeModel.value = null
                }
            }
        },
        { immediate: true, deep: true }
    )
</script>

<style scoped lang="scss">
    .filters-container {
        @apply space-y-2;
    }

    .filter-section {
        @apply py-2;
    }

    .filter-options {
        @apply grid grid-cols-2 gap-2;
    }

    .filter-footer {
        @apply flex gap-3 px-4;
    }

    .loader {
        @apply border-2 border-gray-300 border-t-blue-600 rounded-full w-4 h-4 animate-spin;
    }
</style>
