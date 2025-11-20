<template>
    <div class="flex flex-col space-y-5">
        <h3 class="text-gray-950 font-bold text-title3">{{ t('product.productDetails') }}</h3>

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-4">
                <h4 class="text-gray-800 text-subtitle2">{{ t('product.productName') }}</h4>

                <div class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
                    <Input
                        v-model="formData.brandName"
                        :label="t('product.brandName')"
                        name="brandName"
                        size="lg"
                        class="flex-1"
                        background="bg-white"
                        :error-message="getFieldError('brandName')"
                        required
                        @blur="handleFieldBlur('brandName')"
                        @input="debouncedEmitUpdate"
                    />
                    <div class="flex-1 flex items-start pt-4">
                        <Checkbox
                            v-model="formData.privateLabelAvailable"
                            :label="t('product.privateLabelAvailable')"
                            name="privateLabelAvailable"
                            info
                            :info-message="t('company.allowPriveteLabel')"
                            icon="label"
                            size="md"
                            @update:model-value="handleFieldChange('privateLabelAvailable')"
                        />
                    </div>
                </div>

                <div class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
                    <Input
                        v-model="formData.articleNumber"
                        :label="t('product.articleNumber', { n: 2 })"
                        name="articleNumber"
                        size="lg"
                        background="bg-white"
                        class="flex-1"
                        :error-message="getFieldError('articleNumber')"
                        required
                        @blur="handleFieldBlur('articleNumber')"
                        @input="debouncedEmitUpdate"
                    />
                    <div class="flex-1 hidden md:block" />
                </div>

                <div class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
                    <Input
                        v-model="productNameEnglish"
                        :label="t('product.productNameEnglish')"
                        name="productNameEnglish"
                        size="lg"
                        background="bg-white"
                        class="flex-1"
                        :error-message="getArrayFieldError('names', 0, 'name')"
                        required
                        @blur="() => handleArrayFieldBlur('names', 0, 'name')"
                        @input="handleProductNameEnglishChange"
                    />
                    <div class="flex-1 flex items-start pt-4">
                        <Checkbox
                            v-model="sameNameAsEnglish"
                            :label="t('product.sameNameAsEnglish')"
                            name="sameNameAsEnglish"
                            size="md"
                            @update:model-value="handleSameNameChange"
                        />
                    </div>
                </div>

                <div class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
                    <Input
                        v-model="formData.nameOriginal"
                        :label="t('product.productNameOriginal')"
                        name="nameOriginal"
                        size="lg"
                        background="bg-white"
                        class="flex-1"
                        :error-message="getFieldError('nameOriginal')"
                        :disabled="sameNameAsEnglish"
                        required
                        @blur="handleFieldBlur('nameOriginal')"
                        @input="debouncedEmitUpdate"
                    />
                    <div class="flex-1 flex md:items-center items-center space-x-2">
                        <ButtonAction
                            class="py-2 flex-0"
                            :label="t('addATemplate', { template: t('language').toLowerCase() })"
                            @click="addName"
                        />
                        <div class="flex flex-1 items-center gap-2">
                            <svg
                                v-tooltip="t('product.languageHint')"
                                class="w-5 h-5 text-gray-950 hover:text-blue-500 hover:scale-105 duration-150 cursor-help"
                            >
                                <use :xlink:href="`/sprite.svg#info`" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div
                    v-for="(item, index) in additionalNames"
                    :key="`name-${index}`"
                    class="flex flex-col md:flex-row md:space-x-2 space-y-4 md:space-y-0"
                >
                    <div class="flex flex-1 flex-col md:flex-row gap-4 md:gap-2">
                        <Select
                            v-model="item.languageId"
                            :label="t('language')"
                            name="languageId"
                            size="lg"
                            background="bg-white"
                            :options="availableLanguageOptions(index)"
                            :error-message="getArrayFieldError('names', index + 1, 'languageId')"
                            searchable
                            class="flex-1"
                            required
                            @update:model-value="
                                handleArrayFieldChange('names', index + 1, 'languageId')
                            "
                        />
                        <Input
                            v-model="item.name"
                            :label="t('product.productName')"
                            name="name"
                            size="lg"
                            background="bg-white"
                            class="flex-1"
                            :error-message="getArrayFieldError('names', index + 1, 'name')"
                            required
                            @blur="() => handleArrayFieldBlur('names', index + 1, 'name')"
                            @input="debouncedEmitUpdate"
                        />
                    </div>
                    <div class="flex-1 flex items-center space-x-2">
                        <ButtonClose
                            color="red"
                            size="sm"
                            icon-size="sm"
                            @click="removeName(index)"
                        />
                    </div>
                </div>

                <div class="flex flex-col md:flex-row md:space-x-2 space-y-4 md:space-y-0">
                    <div class="flex flex-1 flex-col md:flex-row gap-4 md:gap-2">
                        <Input
                            v-model.number="formData.weightNet"
                            :label="t('netWeight')"
                            name="weightNet"
                            type="number"
                            size="lg"
                            background="bg-white"
                            :error-message="getFieldError('weightNet')"
                            :step="0.001"
                            :min="0.001"
                            required
                            class="flex-1"
                            @blur="handleFieldBlur('weightNet')"
                            @input="debouncedEmitUpdate"
                        />
                        <Select
                            v-model="formData.weightNetTypeId"
                            :label="t('product.quantityType')"
                            name="weightNetTypeId"
                            size="lg"
                            background="bg-white"
                            :options="quantityTypeOptions"
                            :error-message="getFieldError('weightNetTypeId')"
                            required
                            class="flex-1"
                            @update:model-value="handleFieldChange('weightNetTypeId')"
                        />
                    </div>
                    <div class="flex-1 hidden md:block" />
                </div>

                <div class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
                    <Input
                        v-model="formData.eanProduct"
                        :label="t('product.eanCodeProduct')"
                        name="eanProduct"
                        size="lg"
                        background="bg-white"
                        class="flex-1"
                        required
                        :error-message="getFieldError('eanProduct')"
                        @blur="handleFieldBlur('eanProduct')"
                        @input="debouncedEmitUpdate"
                    />
                    <div class="flex-1 hidden md:block" />
                </div>

                <div class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
                    <Input
                        v-model="formData.eanBox"
                        :label="t('product.eanCodeBox')"
                        name="eanBox"
                        size="lg"
                        class="flex-1"
                        background="bg-white"
                        :error-message="getFieldError('eanBox')"
                        required
                        @blur="handleFieldBlur('eanBox')"
                        @input="debouncedEmitUpdate"
                    />
                    <div class="flex-1 hidden md:block" />
                </div>

                <h4 class="text-gray-800 text-subtitle2">{{ t('country', 0) }}</h4>

                <div class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
                    <Select
                        v-model="formData.countryOriginId"
                        :label="t('product.countryOfOrigin')"
                        name="countryOriginId"
                        size="lg"
                        background="bg-white"
                        class="flex-1"
                        :options="countryOptions"
                        :error-message="getFieldError('countryOriginId')"
                        searchable
                        required
                        @update:model-value="handleFieldChange('countryOriginId')"
                    />
                    <div class="flex-1 hidden md:block" />
                </div>

                <h4 class="text-gray-800 text-subtitle2">{{ t('register.destinationType') }}</h4>

                <div class="flex flex-col gap-4">
                    <div class="flex gap-4">
                        <Radiobox
                            v-model="formData.destinationType"
                            :label="t('register.destinationBoth')"
                            name="destinationType"
                            value="both"
                            @update:model-value="handleFieldChange('destinationType')"
                        />
                        <Radiobox
                            v-model="formData.destinationType"
                            :label="t('register.destinationHoreca')"
                            name="destinationType"
                            value="horeca"
                            @update:model-value="handleFieldChange('destinationType')"
                        />
                        <Radiobox
                            v-model="formData.destinationType"
                            :label="t('register.destinationRetail')"
                            name="destinationType"
                            value="retail"
                            @update:model-value="handleFieldChange('destinationType')"
                        />
                    </div>
                    <div
                        v-if="!!getFieldError('destinationType')"
                        class="flex items-center gap-1 text-caption1 mx-1 text-red-500"
                    >
                        <svg class="w-3 h-3 mt-0.5 flex-shrink-0">
                            <use xlink:href="/sprite.svg#warn-error"></use>
                        </svg>

                        <span class="break-words">
                            {{ getFieldError('destinationType') }}
                        </span>
                    </div>
                </div>

                <h4 class="flex gap-2 items-center text-gray-800 text-subtitle2"
                    >{{ t('product.vat') }} (%)
                    <div class="flex flex-1 items-center">
                        <svg
                            v-tooltip="t('product.vatHint')"
                            class="w-5 h-5 text-gray-950 hover:text-blue-500 hover:scale-105 duration-150 cursor-help"
                        >
                            <use :xlink:href="`/sprite.svg#info`" />
                        </svg> </div
                ></h4>

                <div class="flex flex-col md:flex-row md:space-x-2 space-y-4 md:space-y-0">
                    <div class="flex flex-1 flex-col md:flex-row md:gap-2 gap-4">
                        <Input
                            v-model="formData.localVat"
                            :label="`${t('product.localVat')} (%)`"
                            name="localVat"
                            type="number"
                            size="lg"
                            background="bg-white"
                            class="flex-1"
                            :step="0.001"
                            :min="0"
                            :max="100"
                            :error-message="getFieldError('localVat')"
                            @blur="handleFieldBlur('localVat')"
                            @input="debouncedEmitUpdate"
                        />
                        <Input
                            v-if="doExport"
                            v-model="formData.exportVat"
                            :label="`${t('product.exportVat')} (%)`"
                            name="exportVat"
                            type="number"
                            size="lg"
                            background="bg-white"
                            class="flex-1"
                            :step="0.001"
                            :min="0"
                            :max="100"
                            :error-message="getFieldError('exportVat')"
                            @blur="handleFieldBlur('exportVat')"
                            @input="debouncedEmitUpdate"
                        />
                    </div>
                    <div class="flex flex-1 justify-center"> </div>
                </div>

                <div class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
                    <Select
                        v-model="formData.categoryId"
                        :label="t('product.category')"
                        name="categoryId"
                        size="lg"
                        class="flex-1"
                        background="bg-white"
                        :options="categoryOptions"
                        :error-message="getFieldError('categoryId')"
                        searchable
                        required
                        @update:model-value="handleFieldChange('categoryId')"
                    />
                    <div class="flex-1 hidden md:block" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { shallowRef, toRaw } from 'vue'
    import { storeToRefs } from 'pinia'
    import { useDebounceFn, useThrottleFn, computedWithControl } from '@vueuse/core'
    import { validateData } from '~/utils/validator/index'
    import {
        productBasicInfoSchema,
        type ProductBasicInfoFormData,
    } from '~/utils/validator/schemas/products/product'
    import { useStaticData } from '~/composables/useStaticData'
    import { useProductStaticData } from '~/composables/useProductStaticData'
    import { useUserStore } from '~/stores/user'

    interface Props {
        stepData?: Partial<ProductBasicInfoFormData>
        fieldErrors?: Record<string, string | string[]>
    }

    const props = withDefaults(defineProps<Props>(), {
        stepData: () => ({}),
        fieldErrors: () => ({}),
    })

    const emit = defineEmits<{
        update: [data: Partial<ProductBasicInfoFormData>]
        'clear-error': [fieldName: string]
    }>()

    const { t } = useI18n()
    const userStore = useUserStore()
    const { doExport } = storeToRefs(userStore)
    const { countryOptions, languageOptions } = useStaticData()
    const { quantityTypeOptions, categories } = useProductStaticData()

    const hasInitialized = ref(false)
    const englishLanguageId = computed(() => {
        const eng = languageOptions.value.find((lang) => lang.code === 'en')
        return eng?.value || 1
    })

    const productNameEnglish = ref('')
    const sameNameAsEnglish = ref(false)

    // Transform categories from productStaticData to select options
    const categoryOptions = computed(() => {
        if (!categories.value || categories.value.length === 0) return []

        return categories.value.map((cat) => ({
            value: cat.id,
            label: cat.name,
            code: cat.id.toString(),
        }))
    })

    const getDefaultFormData = (): ProductBasicInfoFormData => ({
        privateLabelAvailable: false,
        articleNumber: '',
        brandName: '',
        nameOriginal: '',
        names: [{ languageId: englishLanguageId.value, name: '' }],
        weightNet: null,
        weightNetTypeId: null,
        eanProduct: '',
        eanBox: '',
        localVat: null,
        exportVat: null,
        categoryId: null,
        countryOriginId: null,
        destinationType: 'both',
    })

    const formData = reactive<ProductBasicInfoFormData>(getDefaultFormData())
    const additionalNames = computed(() => formData.names.slice(1))

    const availableLanguageOptions = computedWithControl(
        () => [formData.names],
        () => {
            return (currentIndex: number) => {
                const selectedLanguageIds = formData.names
                    .map((item, index) => (index !== currentIndex + 1 ? item.languageId : null))
                    .filter(Boolean)

                return languageOptions.value.filter(
                    (option) => !selectedLanguageIds.includes(option.value)
                )
            }
        }
    )

    const errorCache = shallowRef(new Map<string, string | null>())

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

        errorCache.value = new Map(errorCache.value).set(cacheKey, error)
        return error
    }

    const handleFieldBlur = (fieldName: string) => {
        emit('clear-error', fieldName)
        errorCache.value.delete(fieldName)
    }

    const handleArrayFieldBlur = (arrayName: string, index: number, fieldName: string) => {
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
        () => {
            emit('update', { ...toRaw(formData) })
        },
        300,
        { maxWait: 1000 }
    )

    const emitUpdate = useDebounceFn(
        () => {
            emit('update', { ...toRaw(formData) })
        },
        200,
        { maxWait: 1000 }
    )

    const handleFieldChange = useThrottleFn((fieldName: string) => {
        emit('clear-error', fieldName)
        errorCache.value.delete(fieldName)
        emitUpdate()
    }, 100)

    const handleArrayFieldChange = useThrottleFn(
        (arrayName: string, index: number, fieldName: string) => {
            const errorKeys = [
                `${arrayName}.${index}.${fieldName}`,
                `${arrayName}[${index}].${fieldName}`,
            ]

            errorKeys.forEach((key) => {
                emit('clear-error', key)
                errorCache.value.delete(key)
            })

            emitUpdate()
        },
        100
    )

    const addName = () => {
        formData.names.push({
            languageId: null,
            name: '',
        })
        emitUpdate()
    }

    const removeName = (index: number) => {
        formData.names.splice(index + 1, 1)
        emitUpdate()
    }

    const handleProductNameEnglishChange = useDebounceFn(() => {
        handleArrayFieldChange('names', 0, 'name')

        if (!productNameEnglish.value.trim()) {
            formData.names[0] = {
                languageId: englishLanguageId.value,
                name: '',
            }
            if (sameNameAsEnglish.value) {
                formData.nameOriginal = ''
            }
        } else {
            formData.names[0] = {
                languageId: englishLanguageId.value,
                name: productNameEnglish.value,
            }
            if (sameNameAsEnglish.value) {
                formData.nameOriginal = productNameEnglish.value
            }
        }
        emitUpdate()
    }, 300)

    const handleSameNameChange = (value: boolean) => {
        sameNameAsEnglish.value = value
        if (value && productNameEnglish.value) {
            formData.nameOriginal = productNameEnglish.value
            handleFieldChange('nameOriginal')
        }
        emitUpdate()
    }

    const validate = () => {
        return validateData('productBasicInfo', productBasicInfoSchema, formData)
    }

    const initializeFormData = async (): Promise<void> => {
        if (hasInitialized.value) return

        if (!props.stepData || Object.keys(props.stepData).length === 0) {
            return
        }

        const defaultData = getDefaultFormData()

        // Copy all data directly (no special handling needed)
        Object.keys(defaultData).forEach((key) => {
            const typedKey = key as keyof ProductBasicInfoFormData
            if (props.stepData[typedKey] !== undefined) {
                ;(formData as any)[typedKey] = props.stepData[typedKey]
            }
        })

        // English name
        if (props.stepData.names?.[0]?.name) {
            productNameEnglish.value = props.stepData.names[0].name
        }

        hasInitialized.value = true
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
        (newData): void => {
            if (newData && Object.keys(newData).length > 0 && !hasInitialized.value) {
                initializeFormData()
            }
        },
        { deep: true, immediate: true }
    )

    watch(
        () => productNameEnglish.value,
        (newValue) => {
            if (sameNameAsEnglish.value) {
                formData.nameOriginal = newValue
            }
        }
    )

    onMounted(async (): void => {
        await initializeFormData()
    })

    defineExpose({
        validate,
        formData: computed(() => toRaw(formData)),
    })
</script>
