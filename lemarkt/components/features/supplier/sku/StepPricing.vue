<template>
    <div class="flex flex-col space-y-5">
        <h3 class="text-gray-950 font-bold text-title3">{{ t('product.pricing') }}</h3>

        <div class="flex flex-col gap-6">
            <!-- Base Pricing Section with Table Component -->
            <div class="flex flex-col gap-3">
                <h4 class="text-gray-950 font-normal text-subtitle2">
                    {{ t('product.pricingFor1Unit') }}
                </h4>

                <Table
                    :columns="basePriceColumns"
                    :rows="basePriceRows"
                    :loading="false"
                    background="bg-white"
                    :selectable="false"
                    :pagination="false"
                    show-column-borders
                    @cell-edit="handleBasePriceCellEdit"
                />

                <div
                    v-if="localPriceError"
                    class="text-red-500 text-caption1 flex items-center gap-1"
                >
                    <svg class="w-3 h-3 flex-shrink-0">
                        <use :xlink:href="`/sprite.svg#info`"></use>
                    </svg>
                    {{ localPriceError }}
                </div>

                <div
                    v-if="exportPriceError && doExport"
                    class="text-red-500 text-caption1 flex items-center gap-1"
                >
                    <svg class="w-3 h-3 flex-shrink-0">
                        <use :xlink:href="`/sprite.svg#info`"></use>
                    </svg>
                    {{ exportPriceError }}
                </div>
            </div>

            <!-- Volume Discount System with Table -->
            <div class="flex flex-col gap-3">
                <h4 class="text-gray-950 font-normal text-subtitle2">
                    {{ t('product.volumeDiscountSystem') }}
                </h4>

                <Table
                    v-if="volumePriceRows.length > 0"
                    :columns="volumePriceColumns"
                    :rows="volumePriceRows"
                    :loading="false"
                    background="bg-white"
                    :selectable="false"
                    :pagination="false"
                    :actions="['delete']"
                    show-column-borders
                    @delete="handleDeleteVolumeTier"
                />

                <!-- <button
                    class="flex items-center gap-2 text-blue-500 hover:text-blue-700 text-subtitle2 font-medium"
                    @click="openVolumeDiscountModal"
                >
                    <svg class="w-4 h-4">
                        <use :xlink:href="`/sprite.svg#plus`"></use>
                    </svg>
                    {{ t('product.addQuantityDiscount') }}
                </button> -->

                <ButtonAction
                    :label="t('product.addQuantityDiscount')"
                    @click="openVolumeDiscountModal"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, nextTick, onMounted } from 'vue'
    import { validateData } from '~/utils/validator'
    import {
        getProductPricingSchema,
        type ProductPricingFormData,
    } from '~/utils/validator/schemas/products/product'
    import { useUserStore } from '~/stores/user'
    import { storeToRefs } from 'pinia'
    import { useVolumeDiscount } from '~/composables/useVolumeDiscount'
    import type { TableRow } from '~/types/ui/table'

    interface VolumePrice {
        id: string
        quantityFrom: number
        localPrice: number
        exportPrice: number | null
    }

    interface Props {
        stepData?: Partial<ProductPricingFormData>
        fieldErrors?: Record<string, string>
    }

    const props = withDefaults(defineProps<Props>(), {
        stepData: () => ({}),
        fieldErrors: () => ({}),
    })

    const emit = defineEmits<{
        update: [data: Partial<ProductPricingFormData>]
        'clear-error': [fieldName: string]
    }>()

    const userStore = useUserStore()
    const { user, doExport } = storeToRefs(userStore)
    const { t } = useI18n()
    const { showVolumeDiscountModal } = useVolumeDiscount()

    const hasInitialized = ref(false)
    const isInitializing = ref(false)
    const volumePrices = ref<VolumePrice[]>([])

    const userLocalCurrency = computed(() => {
        return user.value?.default_local_currency || null
    })

    const userExportCurrency = computed(() => {
        return user.value?.default_export_currency || null
    })

    const localCurrencyDisplay = computed(() => {
        if (!userLocalCurrency.value) return '—'

        const currency = userLocalCurrency.value
        const symbol = currency.symbol || '$'
        const code = currency.code || 'USD'
        const name = currency.name || code

        return `(${symbol}) ${name}`
    })

    const exportCurrencyDisplay = computed(() => {
        if (!userExportCurrency.value) return '—'

        const currency = userExportCurrency.value
        const symbol = currency.symbol || '€'
        const code = currency.code || 'EUR'
        const name = currency.name || code

        return `(${symbol}) ${name}`
    })

    const localCurrencyCode = computed(() => {
        return userLocalCurrency.value?.code || 'EUR'
    })

    const exportCurrencyCode = computed(() => {
        return userExportCurrency.value?.code || 'EUR'
    })

    const formatPrice = (price: number | null): string => {
        if (price === null || price === undefined) return '—'
        return price.toFixed(2)
    }

    const getFieldError = (fieldName: string): string | null => {
        if (props.fieldErrors[fieldName]) {
            return Array.isArray(props.fieldErrors[fieldName])
                ? props.fieldErrors[fieldName][0]
                : props.fieldErrors[fieldName]
        }

        const snakeCaseField = fieldName.replace(/([A-Z])/g, '_$1').toLowerCase()
        if (props.fieldErrors[snakeCaseField]) {
            return Array.isArray(props.fieldErrors[snakeCaseField])
                ? props.fieldErrors[snakeCaseField][0]
                : props.fieldErrors[snakeCaseField]
        }

        return null
    }

    const getDefaultFormData = (): ProductPricingFormData => {
        const defaultPrices = []

        if (userLocalCurrency.value) {
            defaultPrices.push({
                currencyId: userLocalCurrency.value.id,
                price: 0,
                priceType: 'local' as const,
            })
        }

        if (doExport.value && userExportCurrency.value) {
            defaultPrices.push({
                currencyId: userExportCurrency.value.id,
                price: 0,
                priceType: 'export' as const,
            })
        }

        return {
            prices: defaultPrices,
            volumePrices: [],
        }
    }

    const formData = ref<ProductPricingFormData>(getDefaultFormData())

    const localPriceError = computed(() => {
        const localIndex = formData.value.prices?.findIndex((p) => p.priceType === 'local') ?? -1
        if (localIndex < 0) return null

        const priceError =
            getFieldError(`prices.${localIndex}.price`) ||
            getFieldError(`prices[${localIndex}].price`)

        if (priceError) {
            const currentPrice = formData.value.prices[localIndex]
            if (!currentPrice?.price || currentPrice.price <= 0) {
                return `${t('local')} ${t('price').toLowerCase()}: ${t('validation.numberMinimum', { min: 0.01 })}`
            }
            return `${t('local')} ${t('price').toLowerCase()}: ${priceError}`
        }

        return null
    })

    const exportPriceError = computed(() => {
        const exportIndex = formData.value.prices?.findIndex((p) => p.priceType === 'export') ?? -1
        if (exportIndex < 0) return null

        const priceError =
            getFieldError(`prices.${exportIndex}.price`) ||
            getFieldError(`prices[${exportIndex}].price`)

        if (priceError) {
            const currentPrice = formData.value.prices[exportIndex]
            if (!currentPrice?.price || currentPrice.price <= 0) {
                return `${t('export')} ${t('price').toLowerCase()}: ${t('validation.numberMinimum', { min: 0.01 })}`
            }
            return `${t('export')} ${t('price').toLowerCase()}: ${priceError}`
        }

        return null
    })

    const basePriceColumns = computed(() => [
        {
            key: 'type',
            label: t('type'),
            width: '25%',
            minWidth: '120px',
            sortable: false,
            align: 'left',
            cellOptions: { classes: 'font-bold capitalize' },
            view: 'TableCellText',
        },
        {
            key: 'currency',
            label: t('currency'),
            width: '40%',
            minWidth: '200px',
            sortable: false,
            align: 'left',
            view: 'TableCellText',
            cellOptions: { classes: 'text-gray-700' },
        },
        {
            key: 'value',
            label: t('value'),
            width: '35%',
            minWidth: '120px',
            sortable: false,
            align: 'right',
            view: 'TableCellEditablePrice',
            cellOptions: {
                editable: true,
                currencySymbol: '',
            },
        },
    ])

    const volumePriceColumns = computed(() => {
        const columns = [
            {
                key: 'quantity',
                label: t('product.quantityTier'),
                width: doExport.value ? '30%' : '40%',
                minWidth: '120px',
                sortable: false,
                align: 'left',
                view: 'TableCellText',
            },
            {
                key: 'localPrice',
                label: t('product.localUnitPriceShort', { currency: localCurrencyCode.value }),
                width: doExport.value ? '30%' : '50%',
                minWidth: '120px',
                sortable: false,
                align: 'center',
                view: 'TableCellText',
            },
        ]

        if (doExport.value) {
            columns.push({
                key: 'exportPrice',
                label: t('product.exportUnitPriceShort', { currency: exportCurrencyCode.value }),
                width: '30%',
                minWidth: '120px',
                sortable: false,
                align: 'center',
                view: 'TableCellText',
            })
        }

        columns.push({
            key: 'actions',
            label: '',
            width: '10%',
            minWidth: '60px',
            sortable: false,
            align: 'center',
            view: 'TableCellActions',
        })

        return columns
    })

    const basePriceRows = computed(() => {
        const rows = []

        if (!formData.value.prices) {
            return rows
        }

        const localPrice = formData.value.prices.find((p) => p.priceType === 'local')

        if (localPrice && userLocalCurrency.value) {
            rows.push({
                id: 'local',
                row: [t('local'), localCurrencyDisplay.value, localPrice.price],
                originalData: {
                    priceType: 'local',
                    currencyId: localPrice.currencyId,
                    price: localPrice.price,
                    currencySymbol: userLocalCurrency.value.symbol,
                },
            })
        }

        if (doExport.value) {
            const exportPrice = formData.value.prices.find((p) => p.priceType === 'export')

            if (exportPrice && userExportCurrency.value) {
                rows.push({
                    id: 'export',
                    row: [t('export'), exportCurrencyDisplay.value, exportPrice.price],
                    originalData: {
                        priceType: 'export',
                        currencyId: exportPrice.currencyId,
                        price: exportPrice.price,
                        currencySymbol: userExportCurrency.value.symbol,
                    },
                })
            }
        }

        return rows
    })

    const volumePriceRows = computed(() => {
        return volumePrices.value.map((vp) => {
            const row = [`${vp.quantityFrom} ${t('product.box')}`, formatPrice(vp.localPrice)]

            if (doExport.value) {
                row.push(formatPrice(vp.exportPrice))
            }

            return {
                id: vp.id,
                row,
                originalData: vp,
            }
        })
    })

    const handleBasePriceCellEdit = (payload: {
        rowId: string
        column: string
        value: any
        row?: any
    }) => {
        if (!formData.value || !formData.value.prices || !Array.isArray(formData.value.prices)) {
            console.error('[StepPricing] formData.prices is not initialized')
            return
        }

        const priceType = payload.rowId as 'local' | 'export'
        const priceIndex = formData.value.prices.findIndex((p) => p.priceType === priceType)

        if (priceIndex === -1) {
            console.warn(`[StepPricing] Price entry not found for type: ${priceType}`)
            return
        }

        if (payload.column === 'value') {
            const numericValue =
                typeof payload.value === 'number'
                    ? payload.value
                    : parseFloat(String(payload.value).replace(/[^\d.-]/g, '')) || 0

            formData.value.prices[priceIndex].price = numericValue
            emit('clear-error', `prices.${priceIndex}.price`)
            emit('clear-error', `prices[${priceIndex}].price`)
        }

        emitUpdate()
    }

    const handleDeleteVolumeTier = (payload: { row: TableRow }) => {
        const tierId = payload.row.id
        const index = volumePrices.value.findIndex((vp) => vp.id === tierId)
        if (index !== -1) {
            volumePrices.value.splice(index, 1)
            emitUpdate()
        }
    }

    const openVolumeDiscountModal = async () => {
        const existingQuantities = volumePrices.value.map((vp) => vp.quantityFrom)

        const result = await showVolumeDiscountModal({
            localCurrency: localCurrencyCode.value,
            exportCurrency: exportCurrencyCode.value,
            hasExport: doExport.value,
            existingQuantities,
        })

        if (result) {
            addVolumeTier(result)
        }
    }

    const addVolumeTier = (data: any) => {
        const newTier: VolumePrice = {
            id: `volume-${Date.now()}-${Math.random()}`,
            quantityFrom: data.quantityFrom,
            localPrice: data.localPrice,
            exportPrice: doExport.value ? data.exportPrice : null,
        }

        volumePrices.value.push(newTier)
        volumePrices.value.sort((a, b) => a.quantityFrom - b.quantityFrom)
        emitUpdate()
    }

    const emitUpdate = () => {
        if (formData.value && formData.value.prices) {
            const volumePricesToSend = volumePrices.value
                .map((vp) => {
                    const localTier = {
                        currencyId: userLocalCurrency.value?.id || 0,
                        quantityFrom: vp.quantityFrom,
                        price: vp.localPrice,
                        priceType: 'local' as const,
                    }

                    const exportTier =
                        doExport.value && vp.exportPrice
                            ? {
                                  currencyId: userExportCurrency.value?.id || 0,
                                  quantityFrom: vp.quantityFrom,
                                  price: vp.exportPrice,
                                  priceType: 'export' as const,
                              }
                            : null

                    return exportTier ? [localTier, exportTier] : [localTier]
                })
                .flat()

            const dataToEmit: Partial<ProductPricingFormData> = {
                prices: formData.value.prices,
            }

            if (volumePricesToSend.length > 0) {
                dataToEmit.volumePrices = volumePricesToSend
            }

            emit('update', dataToEmit)
        }
    }

    const validate = () => {
        const validPrices = formData.value.prices?.filter((p) => p.price > 0) || []

        const hasValidLocal = validPrices.some((p) => p.priceType === 'local')

        if (!hasValidLocal) {
            return {
                isValid: false,
                errors: [
                    {
                        field: 'prices.0.price',
                        message: t('validation.required'),
                        code: 'required',
                    },
                ],
                data: undefined,
            }
        }

        if (doExport.value) {
            const hasValidExport = validPrices.some((p) => p.priceType === 'export')

            if (!hasValidExport) {
                return {
                    isValid: false,
                    errors: [
                        {
                            field: 'prices.1.price',
                            message: t('validation.required'),
                            code: 'required',
                        },
                    ],
                    data: undefined,
                }
            }
        }

        const volumePricesToSend = volumePrices.value
            .map((vp) => {
                const localTier = {
                    currencyId: userLocalCurrency.value?.id || 0,
                    quantityFrom: vp.quantityFrom,
                    price: vp.localPrice,
                    priceType: 'local' as const,
                }

                const exportTier =
                    doExport.value && vp.exportPrice
                        ? {
                              currencyId: userExportCurrency.value?.id || 0,
                              quantityFrom: vp.quantityFrom,
                              price: vp.exportPrice,
                              priceType: 'export' as const,
                          }
                        : null

                return exportTier ? [localTier, exportTier] : [localTier]
            })
            .flat()

        const dataToValidate: ProductPricingFormData = {
            prices: validPrices,
            volumePrices: volumePricesToSend,
        }

        const schema = getProductPricingSchema(doExport.value)
        const result = validateData('productPricing', schema, dataToValidate)

        return result
    }

    const syncCurrencyIds = () => {
        if (!formData.value.prices) return

        const localPriceIndex = formData.value.prices.findIndex((p) => p.priceType === 'local')
        if (localPriceIndex >= 0 && userLocalCurrency.value) {
            if (formData.value.prices[localPriceIndex].currencyId !== userLocalCurrency.value.id) {
                formData.value.prices[localPriceIndex].currencyId = userLocalCurrency.value.id
            }
        }

        const exportPriceIndex = formData.value.prices.findIndex((p) => p.priceType === 'export')
        if (exportPriceIndex >= 0 && userExportCurrency.value) {
            if (
                formData.value.prices[exportPriceIndex].currencyId !== userExportCurrency.value.id
            ) {
                formData.value.prices[exportPriceIndex].currencyId = userExportCurrency.value.id
            }
        }
    }

    const initializeFormData = () => {
        if (hasInitialized.value || isInitializing.value) return
        if (!userLocalCurrency.value) return

        isInitializing.value = true

        try {
            if (
                props.stepData?.prices &&
                Array.isArray(props.stepData.prices) &&
                props.stepData.prices.length > 0
            ) {
                const mappedPrices = props.stepData.prices.map((p: any) => {
                    const priceType = p.priceType as 'local' | 'export'
                    let currencyId = Number(p.currencyId)

                    if (priceType === 'local' && userLocalCurrency.value) {
                        currencyId = userLocalCurrency.value.id
                    } else if (priceType === 'export' && userExportCurrency.value) {
                        currencyId = userExportCurrency.value.id
                    }

                    return {
                        currencyId,
                        price: typeof p.price === 'number' ? p.price : parseFloat(p.price) || 0,
                        priceType,
                    }
                })

                formData.value = { prices: mappedPrices, volumePrices: [] }

                if (props.stepData.volumePrices && Array.isArray(props.stepData.volumePrices)) {
                    const groupedVolumePrices = new Map<number, VolumePrice>()

                    props.stepData.volumePrices.forEach((vp: any) => {
                        const quantity =
                            typeof vp.quantityFrom === 'number'
                                ? vp.quantityFrom
                                : parseFloat(vp.quantityFrom) || 1

                        if (!groupedVolumePrices.has(quantity)) {
                            groupedVolumePrices.set(quantity, {
                                id: `volume-${quantity}`,
                                quantityFrom: quantity,
                                localPrice: 0,
                                exportPrice: null,
                            })
                        }

                        const tier = groupedVolumePrices.get(quantity)!
                        const price =
                            typeof vp.price === 'number' ? vp.price : parseFloat(vp.price) || 0

                        if (vp.priceType === 'local') {
                            tier.localPrice = price
                        } else if (vp.priceType === 'export') {
                            tier.exportPrice = price
                        }
                    })

                    volumePrices.value = Array.from(groupedVolumePrices.values()).sort(
                        (a, b) => a.quantityFrom - b.quantityFrom
                    )
                }

                const hasLocal = formData.value.prices.some((p) => p.priceType === 'local')
                const hasExport = formData.value.prices.some((p) => p.priceType === 'export')

                if (!hasLocal && userLocalCurrency.value) {
                    formData.value.prices.unshift({
                        currencyId: userLocalCurrency.value.id,
                        price: 0,
                        priceType: 'local',
                    })
                }

                if (doExport.value && !hasExport && userExportCurrency.value) {
                    formData.value.prices.push({
                        currencyId: userExportCurrency.value.id,
                        price: 0,
                        priceType: 'export',
                    })
                }
            } else {
                formData.value = getDefaultFormData()
            }

            hasInitialized.value = true
            nextTick(() => {
                syncCurrencyIds()
                emitUpdate()
            })
        } finally {
            isInitializing.value = false
        }
    }

    watch(
        () => userLocalCurrency.value,
        (newCurrency, oldCurrency) => {
            if (!newCurrency) return

            if (!hasInitialized.value) {
                initializeFormData()
                return
            }

            if (oldCurrency?.id !== newCurrency.id && formData.value.prices) {
                const localPriceIndex = formData.value.prices.findIndex(
                    (p) => p.priceType === 'local'
                )
                if (localPriceIndex >= 0) {
                    formData.value.prices[localPriceIndex].currencyId = newCurrency.id
                    emitUpdate()
                }
            }
        },
        { immediate: true }
    )

    watch(
        () => userExportCurrency.value,
        (newCurrency, oldCurrency) => {
            if (!newCurrency) return
            if (!hasInitialized.value) return

            if (doExport.value && formData.value.prices) {
                const exportPriceIndex = formData.value.prices.findIndex(
                    (p) => p.priceType === 'export'
                )

                if (exportPriceIndex >= 0) {
                    if (oldCurrency?.id !== newCurrency.id) {
                        formData.value.prices[exportPriceIndex].currencyId = newCurrency.id
                        emitUpdate()
                    }
                } else {
                    formData.value.prices.push({
                        currencyId: newCurrency.id,
                        price: 0,
                        priceType: 'export',
                    })
                    emitUpdate()
                }
            }
        },
        { immediate: true }
    )

    watch(
        () => doExport.value,
        (newValue) => {
            if (!userLocalCurrency.value) return
            if (!formData.value.prices) {
                formData.value = getDefaultFormData()
                return
            }

            if (newValue && !formData.value.prices.find((p) => p.priceType === 'export')) {
                if (userExportCurrency.value) {
                    formData.value.prices.push({
                        currencyId: userExportCurrency.value.id,
                        price: 0,
                        priceType: 'export',
                    })
                }
            } else if (!newValue) {
                formData.value.prices = formData.value.prices.filter(
                    (p) => p.priceType !== 'export'
                )
                volumePrices.value.forEach((vp) => {
                    vp.exportPrice = null
                })
            }
            emitUpdate()
        }
    )

    watch(
        () => props.stepData,
        (newData) => {
            if (newData && Object.keys(newData).length > 0 && !hasInitialized.value) {
                initializeFormData()
            }
        },
        { immediate: true, deep: true }
    )

    onMounted(() => {
        nextTick(() => {
            if (userLocalCurrency.value) {
                initializeFormData()
            }
        })
    })

    defineExpose({
        validate,
        formData: readonly(formData),
    })
</script>
