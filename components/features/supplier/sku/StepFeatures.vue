<template>
    <div class="flex flex-col space-y-5">
        <h3 class="text-gray-950 font-bold text-title3">{{ t('product.stocksAndFeatures') }}</h3>

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-4">
                <h4 class="text-gray-800 text-subtitle2">
                    {{ t('product.addFeatureSelectUpTo', { n: 4 }) }}
                </h4>

                <div class="flex flex-col md:flex-row gap-3">
                    <div class="flex items-center flex-1 gap-4">
                        <div
                            class="border px-3 py-3.5 flex flex-1 w-full justify-between gap-2"
                            :class="
                                isNewProduct ? 'border-green-500 bg-green-50' : 'border-gray-600'
                            "
                        >
                            <div class="flex gap-2">
                                <svg class="w-5 h-4 bg-green-500 text-white rounded-lg">
                                    <use :xlink:href="`/sprite.svg#new_product`"></use>
                                </svg>
                                <p class="text-subtitle2 text-gray-950">{{ t('product.new') }}</p>
                            </div>
                            <Checkbox
                                v-model="featureNew"
                                :label="''"
                                name="new"
                                size="md"
                                :disabled="isNewProduct"
                                @update:model-value="handleMainFeatureChange('new', $event)"
                            />
                        </div>
                        <div
                            class="flex items-center gap-2 text-subtitle2 text-wrap text-gray-800 flex-1"
                        >
                            <svg class="w-4 h-4 flex-shrink-0">
                                <use :xlink:href="`/sprite.svg#info`"></use>
                            </svg>
                            {{
                                isNewProduct
                                    ? t('product.automaticallyFor2Weeks')
                                    : t('product.featureInfo')
                            }}
                        </div>
                    </div>
                    <div class="flex-1 hidden md:block" />
                </div>

                <div class="flex flex-col md:flex-row gap-2 md:items-center">
                    <div class="flex items-start flex-1 gap-4">
                        <div
                            class="border border-gray-600 px-3 py-3.5 flex flex-1 justify-between gap-2"
                        >
                            <div class="flex gap-2">
                                <svg class="w-5 h-4 bg-red-50 text-red-500 rounded-lg px-1 py-0.5">
                                    <use :xlink:href="`/sprite.svg#discount`"></use>
                                </svg>
                                <p class="text-subtitle2 text-gray-950">{{
                                    t('product.discountLocal')
                                }}</p>
                            </div>
                            <Checkbox
                                v-model="hasLocalDiscount"
                                :label="''"
                                name="localDiscount"
                                size="md"
                                @update:model-value="handleLocalDiscountToggle"
                            />
                        </div>

                        <DatePicker
                            v-if="hasLocalDiscount && !unlimitedLocalDiscount"
                            v-model="localDiscountDateRange"
                            :label="t('product.discountPeriod')"
                            :placeholder="t('selectDateRange')"
                            :is-range-mode="true"
                            :future-ranges="true"
                            :min-date="new Date()"
                            size="lg"
                            class="flex-1"
                            :error="
                                !!getFieldError('discounts.0.startDate') ||
                                !!getFieldError('discounts.0.endDate')
                            "
                            :error-message="
                                getFieldError('discounts.0.startDate') ||
                                getFieldError('discounts.0.endDate') ||
                                ''
                            "
                            required
                            @update:model-value="handleLocalDiscountDateRangeChange"
                            @blur="handleDiscountDateBlur"
                        />

                        <DatePicker
                            v-else-if="hasLocalDiscount && unlimitedLocalDiscount"
                            v-model="localDiscountStartDate"
                            :label="t('product.discountStartDate')"
                            :placeholder="t('selectDate')"
                            :is-range-mode="false"
                            :min-date="new Date()"
                            size="lg"
                            class="flex-1"
                            :error="!!getFieldError('discounts.0.startDate')"
                            :error-message="getFieldError('discounts.0.startDate') || ''"
                            required
                            @update:model-value="handleLocalDiscountStartDateChange"
                            @blur="handleDiscountDateBlur"
                        />
                        <div v-else class="flex-1 hidden md:block" />
                    </div>

                    <div class="flex-1 md:self-center">
                        <Checkbox
                            v-if="hasLocalDiscount"
                            v-model="unlimitedLocalDiscount"
                            :label="t('unlimited')"
                            name="unlimitedLocalDiscount"
                            size="md"
                            @update:model-value="handleUnlimitedLocalDiscountChange"
                        />
                    </div>
                </div>

                <div v-if="hasLocalDiscount" class="flex flex-col md:flex-row gap-2 items-center">
                    <div class="flex flex-1 flex-col md:flex-row gap-4 md:gap-2">
                        <Input
                            v-model="localDiscountPercentage"
                            :label="`${t('product.discountPercentage')} (%)`"
                            name="localDiscountPercentage"
                            type="number"
                            size="lg"
                            background="bg-white"
                            class="flex-1"
                            :error-message="getFieldError('discounts.0.percentage')"
                            :min="0.01"
                            :max="100"
                            :step="0.01"
                            :decimal-places="2"
                            :allow-negative="false"
                            :strict-number="true"
                            required
                            @blur="handleDiscountPercentageBlur"
                            @input="handleLocalDiscountPercentageChange"
                        />
                    </div>
                    <div class="flex-1 hidden md:block" />
                </div>

                <div v-if="doExport" class="flex flex-col md:flex-row gap-2 md:items-center">
                    <div class="flex items-start flex-1 gap-4">
                        <div
                            class="border border-gray-600 px-3 py-3.5 flex flex-1 justify-between gap-2"
                        >
                            <div class="flex gap-2">
                                <svg class="w-5 h-4 bg-red-50 text-red-500 rounded-lg px-1 py-0.5">
                                    <use :xlink:href="`/sprite.svg#discount`"></use>
                                </svg>
                                <p class="text-subtitle2 text-gray-950">{{
                                    t('product.discountExport')
                                }}</p>
                            </div>
                            <Checkbox
                                v-model="hasExportDiscount"
                                :label="''"
                                name="exportDiscount"
                                size="md"
                                @update:model-value="handleExportDiscountToggle"
                            />
                        </div>

                        <DatePicker
                            v-if="hasExportDiscount && !unlimitedExportDiscount"
                            v-model="exportDiscountDateRange"
                            :label="t('product.discountPeriod')"
                            :placeholder="t('selectDateRange')"
                            :is-range-mode="true"
                            :future-ranges="true"
                            :min-date="new Date()"
                            size="lg"
                            class="flex-1"
                            :error="
                                !!getFieldError('discounts.1.startDate') ||
                                !!getFieldError('discounts.1.endDate')
                            "
                            :error-message="
                                getFieldError('discounts.1.startDate') ||
                                getFieldError('discounts.1.endDate') ||
                                ''
                            "
                            required
                            @update:model-value="handleExportDiscountDateRangeChange"
                            @blur="handleDiscountDateBlur"
                        />

                        <DatePicker
                            v-else-if="hasExportDiscount && unlimitedExportDiscount"
                            v-model="exportDiscountStartDate"
                            :label="t('product.discountStartDate')"
                            :placeholder="t('selectDate')"
                            :is-range-mode="false"
                            :min-date="new Date()"
                            size="lg"
                            class="flex-1"
                            :error="!!getFieldError('discounts.1.startDate')"
                            :error-message="getFieldError('discounts.1.startDate') || ''"
                            required
                            @update:model-value="handleExportDiscountStartDateChange"
                            @blur="handleDiscountDateBlur"
                        />
                        <div v-else class="flex-1 hidden md:block" />
                    </div>
                    <div class="flex-1">
                        <Checkbox
                            v-if="hasExportDiscount"
                            v-model="unlimitedExportDiscount"
                            :label="t('unlimited')"
                            name="unlimitedExportDiscount"
                            size="md"
                            @update:model-value="handleUnlimitedExportDiscountChange"
                        />
                    </div>
                </div>

                <div
                    v-if="doExport && hasExportDiscount"
                    class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0"
                >
                    <div class="flex flex-1 flex-col md:flex-row gap-4">
                        <Input
                            v-model="exportDiscountPercentage"
                            :label="`${t('product.discountPercentage')} (%)`"
                            name="exportDiscountPercentage"
                            type="number"
                            size="lg"
                            background="bg-white"
                            class="flex-1"
                            :decimal-places="2"
                            :allow-negative="false"
                            :strict-number="true"
                            :error-message="getFieldError('discounts.1.percentage')"
                            :min="0.01"
                            :max="100"
                            :step="0.01"
                            required
                            @blur="handleDiscountPercentageBlur"
                            @input="handleExportDiscountPercentageChange"
                        />
                    </div>
                    <div class="flex-1 hidden md:block" />
                </div>

                <h4 class="text-gray-800 text-subtitle2">{{ t('product.additionalFeatures') }}</h4>

                <div
                    v-for="(row, rowIndex) in additionalFeatureRows"
                    :key="rowIndex"
                    class="flex flex-col md:flex-row gap-2"
                >
                    <div class="flex flex-col md:flex-row flex-1 gap-3">
                        <div
                            v-for="feature in row"
                            :key="feature.code"
                            class="border border-gray-600 flex-1 rounded px-3 py-3.5 bg-white"
                        >
                            <Checkbox
                                :model-value="isAdditionalFeatureSelected(feature.value)"
                                :label="feature.label"
                                :name="feature.code"
                                size="md"
                                @update:model-value="
                                    handleAdditionalFeatureChange(feature.value, $event)
                                "
                            />
                        </div>
                        <div
                            v-if="row.length === 1"
                            class="px-3 py-3.5 bg-white flex-1 hidden md:flex"
                        ></div>
                    </div>

                    <div v-if="rowIndex === 0" class="hidden flex-1 items-center md:flex">
                        <div class="rounded md:py-3.5 bg-white w-full">
                            <Checkbox
                                v-model="selectAllFeatures"
                                :label="t('selectAll')"
                                name="selectAllFeatures"
                                size="md"
                                @update:model-value="handleSelectAllFeatures"
                            />
                        </div>
                    </div>
                    <div v-else class="flex-1 hidden md:block" />
                </div>
                <Checkbox
                    v-model="selectAllFeatures"
                    :label="t('selectAll')"
                    name="selectAllFeatures"
                    size="md"
                    class="md:hidden"
                    @update:model-value="handleSelectAllFeatures"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { shallowRef, toRaw } from 'vue'
    import { useDebounceFn, useThrottleFn, watchDebounced } from '@vueuse/core'
    import { validateData } from '~/utils/validator'
    import {
        productFeaturesSchema,
        type ProductFeaturesFormData,
    } from '~/utils/validator/schemas/products/product'
    import { useProductStaticData } from '~/composables/useProductStaticData'
    import { useProductStore } from '~/stores/product'
    import { useUserStore } from '~/stores/user'
    import { storeToRefs } from 'pinia'
    import { format, addDays, differenceInDays, parseISO } from 'date-fns'

    interface DateRange {
        start: string
        end: string
    }

    interface Props {
        stepData?: Partial<ProductFeaturesFormData>
        fieldErrors?: Record<string, string | string[]>
    }

    const props = withDefaults(defineProps<Props>(), {
        stepData: () => ({}),
        fieldErrors: () => ({}),
    })

    const emit = defineEmits<{
        update: [data: Partial<ProductFeaturesFormData>]
        'clear-error': [fieldName: string]
    }>()

    const { additionalFeatureOptions } = useProductStaticData()
    const productStore = useProductStore()
    const userStore = useUserStore()
    const { doExport } = storeToRefs(userStore)
    const { t } = useI18n()

    const featureNew = ref(false)
    const featurePopular = ref(false)
    const selectAllFeatures = ref(false)
    const isInitializing = ref(true)

    const hasLocalDiscount = ref(false)
    const unlimitedLocalDiscount = ref(false)
    const localDiscountDateRange = ref<DateRange>({ start: '', end: '' })
    const localDiscountStartDate = ref('')
    const localDiscountPercentage = ref<number>(0)

    const hasExportDiscount = ref(false)
    const unlimitedExportDiscount = ref(false)
    const exportDiscountDateRange = ref<DateRange>({ start: '', end: '' })
    const exportDiscountStartDate = ref('')
    const exportDiscountPercentage = ref<number>(0)

    const FEATURE_IDS = {
        new: 1,
        popular: 2,
        topRated: 3,
    }

    const errorCache = shallowRef(new Map<string, string | null>())

    const productCreatedAt = computed((): string | null => {
        return productStore.currentProduct?.created_at || null
    })

    const isNewProduct = computed((): boolean => {
        const createdAt = productCreatedAt.value
        if (!createdAt) return false

        try {
            const createdDate = parseISO(createdAt)
            const daysSinceCreation = differenceInDays(new Date(), createdDate)
            return daysSinceCreation <= 14
        } catch (error) {
            console.error('Error parsing createdAt date:', error)
            return false
        }
    })

    const getDefaultFormData = (): ProductFeaturesFormData => {
        return {
            featureIds: [],
            discounts: undefined,
            additionalFeatureIds: [],
        }
    }

    const formData = reactive<ProductFeaturesFormData>(getDefaultFormData())

    const additionalFeatureRows = computed(() => {
        const rows = []
        const itemsPerRow = 2

        for (let i = 0; i < additionalFeatureOptions.value.length; i += itemsPerRow) {
            rows.push(additionalFeatureOptions.value.slice(i, i + itemsPerRow))
        }

        return rows
    })

    const isAdditionalFeatureSelected = (featureId: number): boolean => {
        return formData.additionalFeatureIds?.includes(featureId) || false
    }

    const getFieldError = (fieldName: string): string | null => {
        if (errorCache.value.has(fieldName)) {
            return errorCache.value.get(fieldName) || null
        }

        let error = null

        if (props.fieldErrors[fieldName]) {
            error = Array.isArray(props.fieldErrors[fieldName])
                ? props.fieldErrors[fieldName][0]
                : props.fieldErrors[fieldName]
        } else {
            const snakeCaseField = fieldName.replace(/([A-Z])/g, '_$1').toLowerCase()
            if (props.fieldErrors[snakeCaseField]) {
                error = Array.isArray(props.fieldErrors[snakeCaseField])
                    ? props.fieldErrors[snakeCaseField][0]
                    : props.fieldErrors[snakeCaseField]
            }
        }

        errorCache.value = new Map(errorCache.value).set(fieldName, error)
        return error
    }

    const clearDiscountDateErrors = (
        discountIndex: number,
        dateType: 'startDate' | 'endDate' | 'both'
    ): void => {
        const errorFields: string[] = []

        if (dateType === 'startDate' || dateType === 'both') {
            errorFields.push(
                `discounts.${discountIndex}.startDate`,
                `discounts[${discountIndex}].startDate`,
                `discounts[${discountIndex}][start_date]`
            )
        }

        if (dateType === 'endDate' || dateType === 'both') {
            errorFields.push(
                `discounts.${discountIndex}.endDate`,
                `discounts[${discountIndex}].endDate`,
                `discounts[${discountIndex}][end_date]`
            )
        }

        errorFields.forEach((field) => {
            emit('clear-error', field)
            errorCache.value.delete(field)
        })
    }

    const handleDiscountPercentageBlur = (): void => {
        const errorKeys = [
            'discounts.0.percentage',
            'discounts.1.percentage',
            'discounts[0].percentage',
            'discounts[1].percentage',
            'discounts[0][percentage]',
            'discounts[1][percentage]',
        ]

        errorKeys.forEach((key) => {
            emit('clear-error', key)
            errorCache.value.delete(key)
        })
    }

    const handleDiscountDateBlur = (): void => {
        const errorKeys = [
            'discounts.0.startDate',
            'discounts.0.endDate',
            'discounts.1.startDate',
            'discounts.1.endDate',
            'discounts[0].startDate',
            'discounts[0].endDate',
            'discounts[1].startDate',
            'discounts[1].endDate',
            'discounts[0][start_date]',
            'discounts[0][end_date]',
            'discounts[1][start_date]',
            'discounts[1][end_date]',
        ]

        errorKeys.forEach((key) => {
            emit('clear-error', key)
            errorCache.value.delete(key)
        })
    }
    const convertToISOFormat = (dateString: string): string => {
        if (!dateString || dateString === '') return ''

        try {
            const date = parseISO(dateString)
            return format(date, 'yyyy-MM-dd')
        } catch (error) {
            console.error('Error converting date to ISO:', error)
            return dateString
        }
    }
    const buildDiscountArray = (): ProductFeaturesFormData['discounts'] => {
        const discounts: Array<{
            priceType: 'local' | 'export'
            percentage: number
            startDate: string
            endDate?: string
        }> = []

        if (hasLocalDiscount.value) {
            const percentage = Number(localDiscountPercentage.value)

            if (unlimitedLocalDiscount.value) {
                if (localDiscountStartDate.value && localDiscountStartDate.value !== '') {
                    discounts.push({
                        priceType: 'local',
                        percentage,
                        startDate: convertToISOFormat(localDiscountStartDate.value),
                    })
                }
            } else {
                if (
                    localDiscountDateRange.value.start &&
                    localDiscountDateRange.value.start !== '' &&
                    localDiscountDateRange.value.end &&
                    localDiscountDateRange.value.end !== ''
                ) {
                    discounts.push({
                        priceType: 'local',
                        percentage,
                        startDate: convertToISOFormat(localDiscountDateRange.value.start),
                        endDate: convertToISOFormat(localDiscountDateRange.value.end),
                    })
                }
            }
        }

        if (doExport.value && hasExportDiscount.value) {
            const percentage = Number(exportDiscountPercentage.value)

            if (unlimitedExportDiscount.value) {
                if (exportDiscountStartDate.value && exportDiscountStartDate.value !== '') {
                    discounts.push({
                        priceType: 'export',
                        percentage,
                        startDate: convertToISOFormat(exportDiscountStartDate.value),
                    })
                }
            } else {
                if (
                    exportDiscountDateRange.value.start &&
                    exportDiscountDateRange.value.start !== '' &&
                    exportDiscountDateRange.value.end &&
                    exportDiscountDateRange.value.end !== ''
                ) {
                    discounts.push({
                        priceType: 'export',
                        percentage,
                        startDate: convertToISOFormat(exportDiscountDateRange.value.start),
                        endDate: convertToISOFormat(exportDiscountDateRange.value.end),
                    })
                }
            }
        }

        return discounts.length > 0 ? discounts : undefined
    }
    const debouncedEmitUpdate = useDebounceFn(
        (): void => {
            const cleanData: any = {}

            if (formData.featureIds && formData.featureIds.length > 0) {
                cleanData.featureIds = formData.featureIds
            }

            if (formData.additionalFeatureIds && formData.additionalFeatureIds.length > 0) {
                cleanData.additionalFeatureIds = formData.additionalFeatureIds
            }

            const discounts = buildDiscountArray()
            if (discounts) {
                cleanData.discounts = discounts
            }

            formData.discounts = discounts

            emit('update', { ...toRaw(cleanData) })
        },
        300,
        { maxWait: 1000 }
    )

    const handleMainFeatureChange = useThrottleFn(
        (featureCode: 'new' | 'popular' | 'topRated', value: boolean): void => {
            if (featureCode === 'new' && isNewProduct.value) {
                return
            }

            const featureId = FEATURE_IDS[featureCode]

            if (!formData.featureIds) {
                formData.featureIds = []
            }

            if (value) {
                if (formData.featureIds.length >= 4) {
                    if (featureCode === 'new') featureNew.value = false
                    if (featureCode === 'popular') featurePopular.value = false
                    return
                }
                if (!formData.featureIds.includes(featureId)) {
                    formData.featureIds.push(featureId)
                }
            } else {
                formData.featureIds = formData.featureIds.filter((id) => id !== featureId)
            }

            debouncedEmitUpdate()
        },
        100
    )

    const handleLocalDiscountToggle = (value: boolean): void => {
        hasLocalDiscount.value = value

        if (value) {
            const startDate = format(new Date(), 'yyyy-MM-dd')
            const endDate = format(addDays(new Date(), 30), 'yyyy-MM-dd')

            localDiscountPercentage.value = 0
            localDiscountDateRange.value = { start: startDate, end: endDate }
            unlimitedLocalDiscount.value = false
            localDiscountStartDate.value = ''
        } else {
            unlimitedLocalDiscount.value = false
            localDiscountDateRange.value = { start: '', end: '' }
            localDiscountStartDate.value = ''
            localDiscountPercentage.value = 0
            handleDiscountPercentageBlur()
            handleDiscountDateBlur()
        }

        nextTick(() => {
            debouncedEmitUpdate()
        })
    }

    const handleExportDiscountToggle = (value: boolean): void => {
        hasExportDiscount.value = value

        if (value) {
            const startDate = format(new Date(), 'yyyy-MM-dd')
            const endDate = format(addDays(new Date(), 30), 'yyyy-MM-dd')

            exportDiscountPercentage.value = 0
            exportDiscountDateRange.value = { start: startDate, end: endDate }
            unlimitedExportDiscount.value = false
            exportDiscountStartDate.value = ''
        } else {
            unlimitedExportDiscount.value = false
            exportDiscountDateRange.value = { start: '', end: '' }
            exportDiscountStartDate.value = ''
            exportDiscountPercentage.value = 0
            handleDiscountPercentageBlur()
            handleDiscountDateBlur()
        }

        nextTick(() => {
            debouncedEmitUpdate()
        })
    }

    const handleLocalDiscountPercentageChange = useDebounceFn((): void => {
        debouncedEmitUpdate()
    }, 300)

    const handleExportDiscountPercentageChange = useDebounceFn((): void => {
        debouncedEmitUpdate()
    }, 300)

    const handleLocalDiscountDateRangeChange = useDebounceFn((range: DateRange): void => {
        localDiscountDateRange.value = range
        unlimitedLocalDiscount.value = false

        if (range.start && range.end) {
            clearDiscountDateErrors(0, 'both')
        } else if (range.start) {
            clearDiscountDateErrors(0, 'startDate')
        } else if (range.end) {
            clearDiscountDateErrors(0, 'endDate')
        }

        debouncedEmitUpdate()
    }, 300)

    const handleExportDiscountDateRangeChange = useDebounceFn((range: DateRange): void => {
        exportDiscountDateRange.value = range
        unlimitedExportDiscount.value = false

        if (range.start && range.end) {
            clearDiscountDateErrors(1, 'both')
        } else if (range.start) {
            clearDiscountDateErrors(1, 'startDate')
        } else if (range.end) {
            clearDiscountDateErrors(1, 'endDate')
        }

        debouncedEmitUpdate()
    }, 300)

    const handleLocalDiscountStartDateChange = useDebounceFn((date: string): void => {
        localDiscountStartDate.value = date

        if (date) {
            clearDiscountDateErrors(0, 'startDate')
        }

        debouncedEmitUpdate()
    }, 300)

    const handleExportDiscountStartDateChange = useDebounceFn((date: string): void => {
        exportDiscountStartDate.value = date

        if (date) {
            clearDiscountDateErrors(1, 'startDate')
        }

        debouncedEmitUpdate()
    }, 300)

    const handleUnlimitedLocalDiscountChange = (value: boolean): void => {
        unlimitedLocalDiscount.value = value

        if (value) {
            const newStartDate =
                localDiscountDateRange.value.start || format(new Date(), 'yyyy-MM-dd')
            localDiscountStartDate.value = newStartDate
            localDiscountDateRange.value = { start: '', end: '' }
        } else {
            const newStartDate = localDiscountStartDate.value || format(new Date(), 'yyyy-MM-dd')
            const newEndDate = format(addDays(parseISO(newStartDate), 30), 'yyyy-MM-dd')
            localDiscountDateRange.value = { start: newStartDate, end: newEndDate }
            localDiscountStartDate.value = ''
        }

        debouncedEmitUpdate()
    }

    const handleUnlimitedExportDiscountChange = (value: boolean): void => {
        unlimitedExportDiscount.value = value

        if (value) {
            const newStartDate =
                exportDiscountDateRange.value.start || format(new Date(), 'yyyy-MM-dd')
            exportDiscountStartDate.value = newStartDate
            exportDiscountDateRange.value = { start: '', end: '' }
        } else {
            const newStartDate = exportDiscountStartDate.value || format(new Date(), 'yyyy-MM-dd')
            const newEndDate = format(addDays(parseISO(newStartDate), 30), 'yyyy-MM-dd')
            exportDiscountDateRange.value = { start: newStartDate, end: newEndDate }
            exportDiscountStartDate.value = ''
        }

        debouncedEmitUpdate()
    }

    const handleAdditionalFeatureChange = useThrottleFn(
        (featureId: number, value: boolean): void => {
            if (!formData.additionalFeatureIds) {
                formData.additionalFeatureIds = []
            }

            if (value) {
                if (!formData.additionalFeatureIds.includes(featureId)) {
                    formData.additionalFeatureIds.push(featureId)
                }
            } else {
                formData.additionalFeatureIds = formData.additionalFeatureIds.filter(
                    (id) => id !== featureId
                )
            }

            selectAllFeatures.value =
                formData.additionalFeatureIds.length === additionalFeatureOptions.value.length

            debouncedEmitUpdate()
        },
        100
    )

    const handleSelectAllFeatures = (value: boolean): void => {
        selectAllFeatures.value = value

        if (value) {
            formData.additionalFeatureIds = additionalFeatureOptions.value.map((f) => f.value)
        } else {
            formData.additionalFeatureIds = []
        }

        debouncedEmitUpdate()
    }

    const validate = () => {
        const errors: Array<{ field: string; message: string }> = []

        if (hasLocalDiscount.value) {
            const percentage = Number(localDiscountPercentage.value)

            if (!percentage || percentage <= 0) {
                errors.push({
                    field: 'discounts.0.percentage',
                    message: t('validation.percentageRequired'),
                })
            } else if (percentage < 0.01 || percentage > 100) {
                errors.push({
                    field: 'discounts.0.percentage',
                    message: t('validation.percentageRange'),
                })
            }

            if (unlimitedLocalDiscount.value) {
                if (!localDiscountStartDate.value || localDiscountStartDate.value === '') {
                    errors.push({
                        field: 'discounts.0.startDate',
                        message: t('validation.startDateRequired'),
                    })
                }
            } else {
                if (
                    !localDiscountDateRange.value.start ||
                    localDiscountDateRange.value.start === ''
                ) {
                    errors.push({
                        field: 'discounts.0.startDate',
                        message: t('validation.startDateRequired'),
                    })
                }
                if (!localDiscountDateRange.value.end || localDiscountDateRange.value.end === '') {
                    errors.push({
                        field: 'discounts.0.endDate',
                        message: t('validation.endDateRequired'),
                    })
                }
            }
        }

        if (doExport.value && hasExportDiscount.value) {
            const percentage = Number(exportDiscountPercentage.value)

            if (!percentage || percentage <= 0) {
                errors.push({
                    field: 'discounts.1.percentage',
                    message: t('validation.percentageRequired'),
                })
            } else if (percentage < 0.01 || percentage > 100) {
                errors.push({
                    field: 'discounts.1.percentage',
                    message: t('validation.percentageRange'),
                })
            }

            if (unlimitedExportDiscount.value) {
                if (!exportDiscountStartDate.value || exportDiscountStartDate.value === '') {
                    errors.push({
                        field: 'discounts.1.startDate',
                        message: t('validation.startDateRequired'),
                    })
                }
            } else {
                if (
                    !exportDiscountDateRange.value.start ||
                    exportDiscountDateRange.value.start === ''
                ) {
                    errors.push({
                        field: 'discounts.1.startDate',
                        message: t('validation.startDateRequired'),
                    })
                }
                if (
                    !exportDiscountDateRange.value.end ||
                    exportDiscountDateRange.value.end === ''
                ) {
                    errors.push({
                        field: 'discounts.1.endDate',
                        message: t('validation.endDateRequired'),
                    })
                }
            }
        }

        const dataToValidate = {
            ...formData,
            featureIds: formData.featureIds || [],
            additionalFeatureIds: formData.additionalFeatureIds || [],
        }

        const schemaResult = validateData('productFeatures', productFeaturesSchema, dataToValidate)

        const allErrors = [...errors, ...(schemaResult.errors || [])]

        return {
            isValid: allErrors.length === 0,
            errors: allErrors,
            data: dataToValidate,
        }
    }
    const initializeFormData = (): void => {
        const defaultData = getDefaultFormData()

        if (props.stepData && Object.keys(props.stepData).length > 0) {
            Object.keys(defaultData).forEach((key) => {
                if (props.stepData[key] !== undefined) {
                    formData[key] = props.stepData[key]
                }
            })

            if (props.stepData.featureIds) {
                featureNew.value = props.stepData.featureIds.includes(FEATURE_IDS.new)
                featurePopular.value = props.stepData.featureIds.includes(FEATURE_IDS.popular)
            }

            if (props.stepData.discounts && props.stepData.discounts.length > 0) {
                const localDiscount = props.stepData.discounts.find((d) => d.priceType === 'local')
                const exportDiscount = props.stepData.discounts.find(
                    (d) => d.priceType === 'export'
                )

                if (localDiscount) {
                    hasLocalDiscount.value = true
                    localDiscountPercentage.value = localDiscount.percentage

                    try {
                        const startDate = localDiscount.startDate
                            ? format(parseISO(localDiscount.startDate), 'yyyy-MM-dd')
                            : ''

                        if (!localDiscount.endDate || localDiscount.endDate === '') {
                            unlimitedLocalDiscount.value = true
                            localDiscountStartDate.value = startDate
                            localDiscountDateRange.value = { start: '', end: '' }
                        } else {
                            unlimitedLocalDiscount.value = false
                            const endDate = format(parseISO(localDiscount.endDate), 'yyyy-MM-dd')
                            localDiscountDateRange.value = {
                                start: startDate,
                                end: endDate,
                            }
                            localDiscountStartDate.value = ''
                        }
                    } catch (error) {
                        console.error('Error parsing local discount dates:', error)
                    }
                }

                if (exportDiscount) {
                    hasExportDiscount.value = true
                    exportDiscountPercentage.value = exportDiscount.percentage

                    try {
                        const startDate = exportDiscount.startDate
                            ? format(parseISO(exportDiscount.startDate), 'yyyy-MM-dd')
                            : ''

                        if (!exportDiscount.endDate || exportDiscount.endDate === '') {
                            unlimitedExportDiscount.value = true
                            exportDiscountStartDate.value = startDate
                            exportDiscountDateRange.value = { start: '', end: '' }
                        } else {
                            unlimitedExportDiscount.value = false
                            const endDate = format(parseISO(exportDiscount.endDate), 'yyyy-MM-dd')
                            exportDiscountDateRange.value = {
                                start: startDate,
                                end: endDate,
                            }
                            exportDiscountStartDate.value = ''
                        }
                    } catch (error) {
                        console.error('Error parsing export discount dates:', error)
                    }
                }
            }

            if (props.stepData.additionalFeatureIds) {
                selectAllFeatures.value =
                    props.stepData.additionalFeatureIds.length ===
                    additionalFeatureOptions.value.length
            }
        }

        if (isNewProduct.value) {
            featureNew.value = true
            if (!formData.featureIds) {
                formData.featureIds = []
            }
            if (!formData.featureIds.includes(FEATURE_IDS.new)) {
                formData.featureIds.push(FEATURE_IDS.new)
            }
        }
    }

    watch(
        () => doExport.value,
        (newValue) => {
            if (!newValue && hasExportDiscount.value) {
                hasExportDiscount.value = false
                exportDiscountPercentage.value = 0
                exportDiscountDateRange.value = { start: '', end: '' }
                exportDiscountStartDate.value = ''
                unlimitedExportDiscount.value = false
            }
            debouncedEmitUpdate()
        }
    )

    watchDebounced(
        () => props.fieldErrors,
        (): void => {
            errorCache.value = new Map()
        },
        { debounce: 100, maxWait: 500, deep: true }
    )

    watch(
        () => props.stepData,
        (newData): void => {
            if (isInitializing.value && newData && Object.keys(newData).length > 0) {
                initializeFormData()
                nextTick(() => {
                    isInitializing.value = false
                })
            }
        },
        { deep: true, immediate: true }
    )

    watch(productCreatedAt, (): void => {
        if (isNewProduct.value) {
            featureNew.value = true
            if (!formData.featureIds) {
                formData.featureIds = []
            }
            if (!formData.featureIds.includes(FEATURE_IDS.new)) {
                formData.featureIds.push(FEATURE_IDS.new)
                debouncedEmitUpdate()
            }
        }
    })

    onMounted((): void => {
        initializeFormData()
    })

    defineExpose({
        validate,
        formData: readonly(formData),
    })
</script>
