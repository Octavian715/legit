<template>
    <div class="flex flex-col space-y-5">
        <h3 class="text-gray-950 font-bold text-title3">{{ t('product.logistics') }}</h3>

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-4">
                <h4 class="text-gray-800 text-subtitle2">{{ t('capacity') }}</h4>

                <div class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
                    <Input
                        v-model="formData.piecesPerBox"
                        :label="t('product.piecesPerBox')"
                        name="piecesPerBox"
                        type="number"
                        size="lg"
                        background="bg-white"
                        class="flex-1"
                        :error-message="getFieldError('piecesPerBox')"
                        :min="1"
                        :max="9999"
                        required
                        @blur="handleFieldBlur('piecesPerBox')"
                        @input="debouncedEmitUpdate"
                    />
                    <Input
                        v-model="formData.boxesPerPalette"
                        :label="t('product.boxesPerPalette')"
                        name="boxesPerPalette"
                        type="number"
                        size="lg"
                        background="bg-white"
                        class="flex-1"
                        :error-message="getFieldError('boxesPerPalette')"
                        :min="1"
                        :max="9999"
                        required
                        @blur="handleFieldBlur('boxesPerPalette')"
                        @input="debouncedEmitUpdate"
                    />
                    <Input
                        v-model="formData.boxesPerRow"
                        :label="t('product.boxesPerRow')"
                        name="boxesPerRow"
                        type="number"
                        size="lg"
                        background="bg-white"
                        class="flex-1"
                        :error-message="getFieldError('boxesPerRow')"
                        :min="1"
                        :max="999"
                        required
                        @blur="handleFieldBlur('boxesPerRow')"
                        @input="debouncedEmitUpdate"
                    />
                    <Input
                        v-model="formData.rowsPerPalette"
                        :label="t('product.rowsPerPalette')"
                        name="rowsPerPalette"
                        type="number"
                        size="lg"
                        background="bg-white"
                        class="flex-1"
                        :error-message="getFieldError('rowsPerPalette')"
                        :min="1"
                        :max="999"
                        required
                        @blur="handleFieldBlur('rowsPerPalette')"
                        @input="debouncedEmitUpdate"
                    />
                </div>

                <h4 class="text-gray-800 text-subtitle2">{{ t('product.unitPackaging') }}</h4>

                <div class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
                    <div class="flex flex-1 flex-col md:flex-row gap-4 md:gap-2">
                        <Select
                            v-model="unitPackagingMaterialId"
                            :label="t('material')"
                            name="packagings.0.materialId"
                            size="lg"
                            background="bg-white"
                            class="flex-1"
                            :options="materialOptions"
                            :error-message="getArrayFieldError('packagings', 0, 'materialId')"
                            searchable
                            required
                            @update:model-value="
                                handleArrayFieldChange('packagings', 0, 'materialId')
                            "
                        />
                        <Input
                            v-model="unitPackagingWeight"
                            :label="t('product.weight')"
                            name="packagings.0.weight"
                            type="number"
                            size="lg"
                            background="bg-white"
                            class="flex-1"
                            :error-message="getArrayFieldError('packagings', 0, 'weight')"
                            :min="0.001"
                            :step="0.001"
                            required
                            @blur="handleArrayFieldBlur('packagings', 0, 'weight')"
                            @input="debouncedEmitUpdate"
                        />
                    </div>
                    <div class="flex flex-1 flex-col md:flex-row gap-4 md:gap-2">
                        <Select
                            v-model="unitPackagingQuantityTypeId"
                            :label="t('product.quantityType')"
                            name="packagings.0.quantityTypeId"
                            size="lg"
                            background="bg-white"
                            class="flex-1"
                            :options="quantityTypeOptions"
                            :error-message="getArrayFieldError('packagings', 0, 'quantityTypeId')"
                            required
                            @update:model-value="
                                handleArrayFieldChange('packagings', 0, 'quantityTypeId')
                            "
                        />
                        <div class="flex-1 hidden md:block" />
                    </div>
                </div>

                <h4 class="text-gray-800 text-subtitle2">{{ t('product.boxPackaging') }}</h4>

                <div class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
                    <div class="flex flex-1 flex-col md:flex-row gap-4 md:gap-2">
                        <Select
                            v-model="boxPackagingMaterialId"
                            :label="t('material')"
                            name="packagings.1.materialId"
                            size="lg"
                            background="bg-white"
                            class="flex-1"
                            :options="materialOptions"
                            :error-message="getArrayFieldError('packagings', 1, 'materialId')"
                            searchable
                            required
                            @update:model-value="
                                handleArrayFieldChange('packagings', 1, 'materialId')
                            "
                        />
                        <Input
                            v-model="boxPackagingWeight"
                            :label="t('product.weight')"
                            name="packagings.1.weight"
                            type="number"
                            size="lg"
                            background="bg-white"
                            class="flex-1"
                            :error-message="getArrayFieldError('packagings', 1, 'weight')"
                            :min="0.001"
                            :step="0.001"
                            required
                            @blur="handleArrayFieldBlur('packagings', 1, 'weight')"
                            @input="debouncedEmitUpdate"
                        />
                    </div>
                    <div class="flex flex-1 flex-col md:flex-row gap-4 md:gap-2">
                        <Select
                            v-model="boxPackagingQuantityTypeId"
                            :label="t('product.quantityType')"
                            name="packagings.1.quantityTypeId"
                            size="lg"
                            background="bg-white"
                            class="flex-1"
                            :options="quantityTypeOptions"
                            :error-message="getArrayFieldError('packagings', 1, 'quantityTypeId')"
                            required
                            @update:model-value="
                                handleArrayFieldChange('packagings', 1, 'quantityTypeId')
                            "
                        />
                        <div class="flex-1 hidden md:block" />
                    </div>
                </div>

                <h4 class="text-gray-800 text-subtitle2">{{ t('product.palletePackaging') }}</h4>

                <div class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
                    <div class="flex flex-1 flex-col md:flex-row gap-4 md:gap-2">
                        <Select
                            v-model="palettePackagingMaterialId"
                            :label="t('material')"
                            name="packagings.2.materialId"
                            size="lg"
                            background="bg-white"
                            class="flex-1"
                            :options="materialOptions"
                            :error-message="getArrayFieldError('packagings', 2, 'materialId')"
                            searchable
                            required
                            @update:model-value="
                                handleArrayFieldChange('packagings', 2, 'materialId')
                            "
                        />
                        <Input
                            v-model="palettePackagingWeight"
                            :label="t('product.weight')"
                            name="packagings.2.weight"
                            type="number"
                            size="lg"
                            background="bg-white"
                            class="flex-1"
                            :error-message="getArrayFieldError('packagings', 2, 'weight')"
                            :min="0.001"
                            :step="0.001"
                            required
                            @blur="handleArrayFieldBlur('packagings', 2, 'weight')"
                            @input="debouncedEmitUpdate"
                        />
                    </div>
                    <div class="flex flex-1 flex-col md:flex-row gap-4 md:gap-2">
                        <Select
                            v-model="palettePackagingQuantityTypeId"
                            :label="t('product.quantityType')"
                            name="packagings.2.quantityTypeId"
                            size="lg"
                            background="bg-white"
                            class="flex-1"
                            :options="quantityTypeOptions"
                            :error-message="getArrayFieldError('packagings', 2, 'quantityTypeId')"
                            required
                            @update:model-value="
                                handleArrayFieldChange('packagings', 2, 'quantityTypeId')
                            "
                        />
                        <div class="flex-1 hidden md:block" />
                    </div>
                </div>

                <h4 class="text-gray-800 text-subtitle2">{{
                    t('product.productDimensionalCharacteristics')
                }}</h4>

                <div class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
                    <Input
                        v-model="formData.productLengthCm"
                        :label="t('product.lengthCM')"
                        name="productLengthCm"
                        type="number"
                        size="lg"
                        class="flex-1"
                        background="bg-white"
                        :error-message="getFieldError('productLengthCm')"
                        :min="0.1"
                        :step="0.1"
                        required
                        @blur="handleFieldBlur('productLengthCm')"
                        @input="debouncedEmitUpdate"
                    />
                    <Input
                        v-model="formData.productWidthCm"
                        :label="t('product.widthCM')"
                        name="productWidthCm"
                        type="number"
                        size="lg"
                        class="flex-1"
                        background="bg-white"
                        :error-message="getFieldError('productWidthCm')"
                        :min="0.1"
                        :step="0.1"
                        required
                        @blur="handleFieldBlur('productWidthCm')"
                        @input="debouncedEmitUpdate"
                    />
                    <Input
                        v-model="formData.productHeightCm"
                        :label="t('product.heightCM')"
                        name="productHeightCm"
                        type="number"
                        size="lg"
                        class="flex-1"
                        background="bg-white"
                        :error-message="getFieldError('productHeightCm')"
                        :min="0.1"
                        :step="0.1"
                        required
                        @blur="handleFieldBlur('productHeightCm')"
                        @input="debouncedEmitUpdate"
                    />
                    <Input
                        v-model="formData.productGrossWeightG"
                        :label="t('product.grossWeightG')"
                        name="productGrossWeightG"
                        type="number"
                        size="lg"
                        background="bg-white"
                        class="flex-1"
                        :error-message="getFieldError('productGrossWeightG')"
                        :min="0.1"
                        :step="0.1"
                        required
                        @blur="handleFieldBlur('productGrossWeightG')"
                        @input="debouncedEmitUpdate"
                    />
                </div>

                <h4 class="text-gray-800 text-subtitle2">{{
                    t('product.cartonDimensionalCharacteristics')
                }}</h4>

                <div class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
                    <Input
                        v-model="formData.cartonLengthCm"
                        :label="t('product.lengthCM')"
                        name="cartonLengthCm"
                        type="number"
                        size="lg"
                        class="flex-1"
                        background="bg-white"
                        :error-message="getFieldError('cartonLengthCm')"
                        :min="0.1"
                        :step="0.1"
                        required
                        @blur="handleFieldBlur('cartonLengthCm')"
                        @input="debouncedEmitUpdate"
                    />
                    <Input
                        v-model="formData.cartonWidthCm"
                        :label="t('product.widthCM')"
                        name="cartonWidthCm"
                        type="number"
                        size="lg"
                        class="flex-1"
                        background="bg-white"
                        :error-message="getFieldError('cartonWidthCm')"
                        :min="0.1"
                        :step="0.1"
                        required
                        @blur="handleFieldBlur('cartonWidthCm')"
                        @input="debouncedEmitUpdate"
                    />
                    <Input
                        v-model="formData.cartonHeightCm"
                        :label="t('product.heightCM')"
                        name="cartonHeightCm"
                        type="number"
                        size="lg"
                        class="flex-1"
                        background="bg-white"
                        :error-message="getFieldError('cartonHeightCm')"
                        :min="0.1"
                        :step="0.1"
                        required
                        @blur="handleFieldBlur('cartonHeightCm')"
                        @input="debouncedEmitUpdate"
                    />
                    <Input
                        v-model="formData.cartonGrossWeightG"
                        :label="t('product.grossWeightG')"
                        name="cartonGrossWeightG"
                        type="number"
                        size="lg"
                        background="bg-white"
                        class="flex-1"
                        :error-message="getFieldError('cartonGrossWeightG')"
                        :min="0.1"
                        :step="0.1"
                        required
                        @blur="handleFieldBlur('cartonGrossWeightG')"
                        @input="debouncedEmitUpdate"
                    />
                </div>

                <h4 class="text-gray-800 text-subtitle2">{{
                    t('product.palleteDimensionalCharacteristics')
                }}</h4>

                <div class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
                    <Input
                        v-model="formData.paletteLengthCm"
                        :label="t('product.lengthCM')"
                        name="paletteLengthCm"
                        type="number"
                        size="lg"
                        class="flex-1"
                        background="bg-white"
                        :error-message="getFieldError('paletteLengthCm')"
                        :min="0.1"
                        :max="9999.99"
                        :step="0.01"
                        required
                        @blur="handleFieldBlur('paletteLengthCm')"
                        @input="debouncedEmitUpdate"
                    />
                    <Input
                        v-model="formData.paletteWidthCm"
                        :label="t('product.widthCM')"
                        name="paletteWidthCm"
                        type="number"
                        size="lg"
                        class="flex-1"
                        background="bg-white"
                        :error-message="getFieldError('paletteWidthCm')"
                        :min="0.1"
                        :step="0.1"
                        required
                        @blur="handleFieldBlur('paletteWidthCm')"
                        @input="debouncedEmitUpdate"
                    />
                    <Input
                        v-model="formData.paletteHeightCm"
                        :label="t('product.heightCM')"
                        name="paletteHeightCm"
                        type="number"
                        size="lg"
                        class="flex-1"
                        background="bg-white"
                        :error-message="getFieldError('paletteHeightCm')"
                        :min="0.1"
                        :step="0.1"
                        required
                        @blur="handleFieldBlur('paletteHeightCm')"
                        @input="debouncedEmitUpdate"
                    />
                    <Input
                        v-model="formData.paletteGrossWeightG"
                        :label="t('product.grossWeightG')"
                        name="paletteGrossWeightG"
                        type="number"
                        size="lg"
                        background="bg-white"
                        class="flex-1"
                        :error-message="getFieldError('paletteGrossWeightG')"
                        :min="0.1"
                        :step="0.1"
                        required
                        @blur="handleFieldBlur('paletteGrossWeightG')"
                        @input="debouncedEmitUpdate"
                    />
                </div>

                <!-- <div class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
                    <Checkbox
                        v-model="formData.showProductGrossWeight"
                        :label="t('product.showProductGrossWeight')"
                        name="showProductGrossWeight"
                        size="md"
                        @update:model-value="handleFieldChange('showProductGrossWeight')"
                    />
                </div> -->

                <div class="flex flex-col gap-4">
                    <h4 class="text-gray-800 text-subtitle2">{{ t('product.customs') }}</h4>
                </div>

                <div class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
                    <Input
                        v-model="formData.customsTariffNumber"
                        :label="t('product.customsTariffNumber')"
                        name="customsTariffNumber"
                        size="lg"
                        background="bg-white"
                        class="flex-1"
                        :error-message="getFieldError('customsTariffNumber')"
                        :maxlength="50"
                        @blur="handleFieldBlur('customsTariffNumber')"
                        @input="debouncedEmitUpdate"
                    />
                    <div class="flex-1 hidden md:block" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { useDebounceFn, useThrottleFn } from '@vueuse/core'
    import { toRaw, reactive, computed, watch, onMounted, readonly } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { validateData } from '~/utils/validator/index'
    import {
        productLogisticsSchema,
        type ProductLogisticsFormData,
    } from '~/utils/validator/schemas/products/product'
    import { useProductStaticData } from '~/composables/useProductStaticData'

    interface Props {
        stepData?: Partial<ProductLogisticsFormData>
        fieldErrors?: Record<string, string | string[]>
    }

    const props = withDefaults(defineProps<Props>(), {
        stepData: () => ({}),
        fieldErrors: () => ({}),
    })

    const emit = defineEmits<{
        update: [data: Partial<ProductLogisticsFormData>]
        'clear-error': [fieldName: string]
    }>()

    const { t } = useI18n()
    const { quantityTypeOptions, materialOptions } = useProductStaticData()

    const getDefaultFormData = (): ProductLogisticsFormData => ({
        piecesPerBox: null,
        boxesPerPalette: null,
        boxesPerRow: null,
        rowsPerPalette: null,
        packagings: [
            { type: 'unit', materialId: null, weight: null, quantityTypeId: null },
            { type: 'box', materialId: null, weight: null, quantityTypeId: null },
            { type: 'palette', materialId: null, weight: null, quantityTypeId: null },
        ],
        productLengthCm: null,
        productWidthCm: null,
        productHeightCm: null,
        productGrossWeightG: null,
        cartonLengthCm: null,
        cartonWidthCm: null,
        cartonHeightCm: null,
        cartonGrossWeightG: null,
        paletteLengthCm: null,
        paletteWidthCm: null,
        paletteHeightCm: null,
        paletteGrossWeightG: null,
        showProductGrossWeight: false,
        customsTariffNumber: '',
    })

    const formData = reactive<ProductLogisticsFormData>(getDefaultFormData())

    const unitPackagingMaterialId = computed({
        get: () => formData.packagings[0].materialId,
        set: (value) => {
            formData.packagings[0].materialId = value
        },
    })

    const unitPackagingWeight = computed({
        get: () => formData.packagings[0].weight,
        set: (value) => {
            formData.packagings[0].weight = value
        },
    })

    const unitPackagingQuantityTypeId = computed({
        get: () => formData.packagings[0].quantityTypeId,
        set: (value) => {
            formData.packagings[0].quantityTypeId = value
        },
    })

    const boxPackagingMaterialId = computed({
        get: () => formData.packagings[1].materialId,
        set: (value) => {
            formData.packagings[1].materialId = value
        },
    })

    const boxPackagingWeight = computed({
        get: () => formData.packagings[1].weight,
        set: (value) => {
            formData.packagings[1].weight = value
        },
    })

    const boxPackagingQuantityTypeId = computed({
        get: () => formData.packagings[1].quantityTypeId,
        set: (value) => {
            formData.packagings[1].quantityTypeId = value
        },
    })

    const palettePackagingMaterialId = computed({
        get: () => formData.packagings[2].materialId,
        set: (value) => {
            formData.packagings[2].materialId = value
        },
    })

    const palettePackagingWeight = computed({
        get: () => formData.packagings[2].weight,
        set: (value) => {
            formData.packagings[2].weight = value
        },
    })

    const palettePackagingQuantityTypeId = computed({
        get: () => formData.packagings[2].quantityTypeId,
        set: (value) => {
            formData.packagings[2].quantityTypeId = value
        },
    })

    const errorCache = ref(new Map<string, string | null>())

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

        errorCache.value.set(fieldName, error)
        return error
    }

    const getArrayFieldError = (
        arrayName: string,
        index: number,
        fieldName: string
    ): string | null => {
        const cacheKey = `${arrayName}.${index}.${fieldName}`

        if (errorCache.value.has(cacheKey)) {
            return errorCache.value.get(cacheKey) || null
        }

        const possibleKeys = [
            `${arrayName}.${index}.${fieldName}`,
            `${arrayName}[${index}].${fieldName}`,
        ]

        const snakeCaseArrayName = arrayName.replace(/([A-Z])/g, '_$1').toLowerCase()
        const snakeCaseFieldName = fieldName.replace(/([A-Z])/g, '_$1').toLowerCase()

        possibleKeys.push(
            `${snakeCaseArrayName}.${index}.${snakeCaseFieldName}`,
            `${snakeCaseArrayName}[${index}].${snakeCaseFieldName}`
        )

        let error = null
        for (const key of possibleKeys) {
            if (props.fieldErrors[key]) {
                error = Array.isArray(props.fieldErrors[key])
                    ? props.fieldErrors[key][0]
                    : props.fieldErrors[key]
                break
            }
        }

        errorCache.value.set(cacheKey, error)
        return error
    }

    const handleFieldBlur = (fieldName: string): void => {
        emit('clear-error', fieldName)
        errorCache.value.delete(fieldName)
    }

    const handleArrayFieldBlur = (arrayName: string, index: number, fieldName: string): void => {
        const errorKeys = [
            `${arrayName}.${index}.${fieldName}`,
            `${arrayName}[${index}].${fieldName}`,
        ]

        errorKeys.forEach((key) => {
            emit('clear-error', key)
            errorCache.value.delete(key)
        })
    }

    const debouncedEmitUpdate = useDebounceFn(
        (): void => {
            emit('update', { ...toRaw(formData) })
        },
        300,
        { maxWait: 1000 }
    )

    const handleFieldChange = useThrottleFn((fieldName: string): void => {
        emit('clear-error', fieldName)
        errorCache.value.delete(fieldName)
        debouncedEmitUpdate()
    }, 100)

    const handleArrayFieldChange = useThrottleFn(
        (arrayName: string, index: number, fieldName: string): void => {
            const errorKeys = [
                `${arrayName}.${index}.${fieldName}`,
                `${arrayName}[${index}].${fieldName}`,
            ]

            errorKeys.forEach((key) => {
                emit('clear-error', key)
                errorCache.value.delete(key)
            })

            debouncedEmitUpdate()
        },
        100
    )

    const validate = () => {
        return validateData('productLogistics', productLogisticsSchema, formData)
    }

    const initializeFormData = (): void => {
        const defaultData = getDefaultFormData()

        if (props.stepData && Object.keys(props.stepData).length > 0) {
            Object.assign(formData, { ...defaultData, ...props.stepData })
        }
    }

    watch(
        () => props.fieldErrors,
        (): void => {
            errorCache.value = new Map()
        },
        { deep: true }
    )

    watch(
        () => props.stepData,
        (): void => {
            initializeFormData()
        },
        { deep: true }
    )

    onMounted((): void => {
        initializeFormData()
    })

    defineExpose({
        validate,
        formData: readonly(formData),
    })
</script>
