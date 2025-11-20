<template>
    <div class="flex flex-col space-y-5">
        <h3 class="text-gray-950 font-bold text-title3">{{ t('product.productDescription') }}</h3>

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-4">
                <div class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
                    <div class="flex flex-1 flex-col md:flex-row gap-4 md:gap-2">
                        <Input
                            v-model="formData.shelfLifeDays"
                            :label="t('product.shelfLifeInDays')"
                            name="shelfLifeDays"
                            type="number"
                            size="lg"
                            background="bg-white"
                            class="flex-1"
                            :error-message="getFieldError('shelfLifeDays')"
                            :min="1"
                            :max="9999"
                            required
                            @blur="handleFieldBlur('shelfLifeDays')"
                            @input="debouncedEmitUpdate"
                        />
                        <div class="flex-1 hidden md:block" />
                    </div>
                    <div class="flex-1 hidden md:block" />
                </div>

                <h4 class="text-gray-800 text-subtitle2">{{ t('product.storageConditions') }}</h4>

                <div class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
                    <div class="flex flex-1 flex-col md:flex-row gap-4 md:gap-2">
                        <Select
                            v-model="formData.storageConditionId"
                            :label="t('product.symbol')"
                            name="storageConditionId"
                            size="lg"
                            background="bg-white"
                            class="flex-1"
                            :options="storageConditionOptions"
                            :error-message="getFieldError('storageConditionId')"
                            required
                            @update:model-value="handleFieldChange('storageConditionId')"
                        />
                        <Input
                            v-model="formData.temperatureMin"
                            :label="t('product.minTemp')"
                            name="temperatureMin"
                            type="number"
                            size="lg"
                            background="bg-white"
                            class="flex-1"
                            :error-message="getFieldError('temperatureMin')"
                            :min="-50"
                            :max="50"
                            :step="0.1"
                            :allow-negative="true"
                            :strict-number="true"
                            placeholder="0"
                            @blur="handleFieldBlur('temperatureMin')"
                            @input="debouncedEmitUpdate"
                        />
                    </div>
                    <div class="flex flex-1 flex-col md:flex-row gap-4 md:gap-2">
                        <Input
                            v-model="formData.temperatureMax"
                            :label="t('product.maxTemp')"
                            name="temperatureMax"
                            type="number"
                            size="lg"
                            background="bg-white"
                            class="flex-1"
                            :error-message="getFieldError('temperatureMax')"
                            :min="-150"
                            :max="150"
                            :allow-negative="true"
                            :strict-number="true"
                            :step="0.1"
                            placeholder="0"
                            @blur="handleFieldBlur('temperatureMax')"
                            @input="debouncedEmitUpdate"
                        />
                        <div class="flex-1 hidden md:block" />
                    </div>
                </div>

                <h4 class="text-gray-800 text-subtitle2">{{ t('product.labelTranslations') }}</h4>

                <div
                    v-for="(label, index) in formData.labelTranslations"
                    :key="`label-${index}`"
                    class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0"
                >
                    <div class="flex flex-1 flex-col md:flex-row gap-4 md:gap-2">
                        <Select
                            v-model="label.languageId"
                            :label="t('language')"
                            name="languageId"
                            size="lg"
                            background="bg-white"
                            :options="getAvailableLanguageOptions(index)"
                            :error-message="
                                getArrayFieldError('labelTranslations', index, 'languageId')
                            "
                            searchable
                            class="flex-1"
                            required
                            @update:model-value="
                                handleArrayFieldChange('labelTranslations', index, 'languageId')
                            "
                        />
                        <Input
                            v-model="label.label"
                            :label="t('product.productName')"
                            name="label"
                            size="lg"
                            background="bg-white"
                            class="flex-1"
                            :error-message="getArrayFieldError('labelTranslations', index, 'label')"
                            required
                            @blur="() => handleArrayFieldBlur('labelTranslations', index, 'label')"
                            @input="debouncedEmitUpdate"
                        />
                    </div>
                    <div v-if="index === 0" class="flex flex-1 flex-col md:flex-row gap-4 md:gap-2">
                        <Checkbox
                            v-model="formData.labelTranslationsOnRequest"
                            :label="t('product.otherLanguagesAaviableOnRequest')"
                            name="labelTranslationsOnRequest"
                            size="md"
                            @update:model-value="handleFieldChange('labelTranslationsOnRequest')"
                        />
                        <div class="flex-1 hidden md:block" />
                    </div>
                    <div
                        v-else
                        class="flex flex-1 flex-col md:flex-row gap-4 md:gap-2 justify-center items-center"
                    >
                        <ButtonClose
                            size="md"
                            icon-size="md"
                            :label="$t('close')"
                            @click="removeLabelTranslation(index)"
                        />
                        <div class="flex-1 hidden md:block" />
                    </div>
                </div>

                <div class="flex flex-col md:flex-row md:space-x-2">
                    <div class="flex-1 flex md:items-start items-center space-x-2">
                        <ButtonAction
                            class="py-2 flex-0"
                            :label="t('addATemplate', { template: t('language').toLowerCase() })"
                            @click="addLabelTranslation"
                        />
                    </div>
                </div>

                <div class="flex flex-col md:flex-row md:space-x-2">
                    <MultiSelect
                        v-model="formData.businessTypeIds"
                        :label="t('product.typeBusiness')"
                        name="businessTypeIds"
                        size="lg"
                        background="bg-white"
                        class="flex-1"
                        :options="businessTypeOptions"
                        :error="!!getFieldError('businessTypeIds')"
                        :error-message="getFieldError('businessTypeIds')"
                        :placeholder="t('multiSelect.placeholder')"
                        :search-placeholder="t('multiSelect.searchPlaceholder')"
                        :no-results-text="t('multiSelect.noResultsText')"
                        required
                        @update:model-value="handleFieldChange('businessTypeIds')"
                    />
                    <div class="flex-1 hidden md:block" />
                </div>
            </div>

            <h3 class="text-gray-950 font-bold text-title3">{{ t('other') }}</h3>

            <div class="flex flex-col gap-4">
                <div class="flex flex-col md:flex-row md:space-x-2">
                    <MultiSelect
                        v-model="formData.allergenIds"
                        :label="t('allergens', { n: 0 })"
                        name="allergenIds"
                        size="lg"
                        background="bg-white"
                        class="flex-1"
                        :options="allergenOptions"
                        :error="!!getFieldError('allergenIds')"
                        :error-message="getFieldError('allergenIds')"
                        :placeholder="t('multiSelect.placeholder')"
                        :search-placeholder="t('multiSelect.searchPlaceholder')"
                        :no-results-text="t('multiSelect.noResultsText')"
                        @update:model-value="handleFieldChange('allergenIds')"
                    />
                    <div class="flex-1 flex items-center space-x-2">
                        <!-- <ButtonAction
                            class="py-2 flex-0"
                            :label="
                                t('addATemplate', {
                                    n: 2,
                                    template: t('allergens', { n: 0 }).toLowerCase(),
                                })
                            "
                            :disabled="true"
                        /> -->
                    </div>
                </div>

                <div class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
                    <MultiSelect
                        v-model="formData.typeIds"
                        :label="t('product.productType')"
                        name="typeIds"
                        size="lg"
                        background="bg-white"
                        class="flex-1"
                        :options="productTypeOptions"
                        :error="!!getFieldError('typeIds')"
                        :error-message="getFieldError('typeIds')"
                        :placeholder="t('multiSelect.placeholder')"
                        :search-placeholder="t('multiSelect.searchPlaceholder')"
                        :no-results-text="t('multiSelect.noResultsText')"
                        required
                        @update:model-value="handleFieldChange('typeIds')"
                    />
                    <div class="flex-1 hidden md:block" />
                </div>
            </div>

            <template v-if="validLanguages.length > 0">
                <div>
                    <h3 class="text-gray-950 font-bold text-title3 py-3 mb-4">
                        {{ t('product.productIngredients') }}
                    </h3>

                    <div class="flex flex-col gap-4">
                        <div class="w-full">
                            <Tabs2
                                v-model="activeIngredientTab"
                                :tabs="ingredientTabs"
                                variant="underline"
                                size="md"
                                transition="none"
                                @select-tab="onIngredientTabSelect"
                            >
                                <template
                                    v-for="language in validLanguages"
                                    :key="`ingredient-${language.id}`"
                                    v-slot:[`ingredient-tab-${language.id}`]
                                >
                                    <div class="flex flex-col md:flex-row md:space-x-2">
                                        <Textarea
                                            v-model="getOrCreateIngredient(language.id).content"
                                            :label="t('product.ingredients')"
                                            :name="`ingredients-${language.id}`"
                                            size="lg"
                                            background="bg-white"
                                            class="flex-1"
                                            :max-length="2000"
                                            :rows="4"
                                            :placeholder="
                                                t(
                                                    'product.enterIngredients',
                                                    'Enter product ingredients...'
                                                )
                                            "
                                            required
                                            @blur="() => handleIngredientBlur(language.id)"
                                            @update:modelValue="
                                                updateIngredientContent(language.id, $event)
                                            "
                                        />
                                        <div class="flex-1 hidden md:block" />
                                    </div>
                                </template>
                            </Tabs2>
                            <div>
                                <p
                                    v-if="hasIngredientsError"
                                    class="helper error flex gap-1 text-red-500"
                                >
                                    <svg class="w-3 h-3">
                                        <use xlink:href="/sprite.svg#warn-error"></use>
                                    </svg>
                                    {{ t('validation.stringMinLength', { min: 1 }) }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <template v-if="validLanguages.length > 0">
                <div>
                    <h3 class="text-gray-950 font-bold text-title3 py-3 mb-4">
                        {{ t('product.productDescription', { n: 0 }) }}
                    </h3>

                    <div class="flex flex-col gap-4">
                        <div class="w-full">
                            <Tabs2
                                v-model="activeDescriptionTab"
                                :tabs="descriptionTabs"
                                variant="underline"
                                size="md"
                                transition="none"
                                @select-tab="onDescriptionTabSelect"
                            >
                                <template
                                    v-for="language in validLanguages"
                                    :key="`description-${language.id}`"
                                    v-slot:[`description-tab-${language.id}`]
                                >
                                    <div class="flex flex-col md:flex-row md:space-x-2">
                                        <Textarea
                                            v-model="getOrCreateDescription(language.id).content"
                                            :label="t('product.productDescription')"
                                            :name="`description-${language.id}`"
                                            size="lg"
                                            background="bg-white"
                                            class="flex-1"
                                            :max-length="500"
                                            :rows="4"
                                            :placeholder="
                                                t(
                                                    'product.enterProductDescription',
                                                    'Enter product description...'
                                                )
                                            "
                                            required
                                            @blur="() => handleDescriptionBlur(language.id)"
                                            @update:modelValue="
                                                updateDescriptionContent(language.id, $event)
                                            "
                                        />
                                        <div class="flex-1 hidden md:block" />
                                    </div>
                                </template>
                            </Tabs2>

                            <div>
                                <p
                                    v-if="hasDescriptionError"
                                    class="helper error flex gap-1 text-red-500"
                                >
                                    <svg class="w-3 h-3">
                                        <use xlink:href="/sprite.svg#warn-error"></use>
                                    </svg>
                                    {{ t('validation.stringMinLength', { min: 1 }) }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { shallowRef, toRaw } from 'vue'
    import { useDebounceFn, useThrottleFn, watchDebounced, useRefHistory } from '@vueuse/core'
    import { validateData } from '~/utils/validator'
    import {
        productDescriptionsSchema,
        type ProductDescriptionsFormData,
    } from '~/utils/validator/schemas/products/product'
    import { useStaticData } from '~/composables/useStaticData'
    import { useProductStaticData } from '~/composables/useProductStaticData'

    interface Props {
        stepData?: Partial<ProductDescriptionsFormData>
        fieldErrors?: Record<string, string | string[]>
    }

    const props = withDefaults(defineProps<Props>(), {
        stepData: () => ({}),
        fieldErrors: () => ({}),
    })

    const emit = defineEmits<{
        update: [data: Partial<ProductDescriptionsFormData>]
        'clear-error': [fieldName: string]
    }>()

    const { t } = useI18n()
    const { languageOptions, businessTypeOptions } = useStaticData()
    const { allergenOptions, storageConditionOptions, productTypeOptions } = useProductStaticData()

    const activeIngredientTab = ref(0)
    const activeDescriptionTab = ref(0)

    const getDefaultFormData = (): ProductDescriptionsFormData => {
        const englishLang = languageOptions.value.find((lang) => lang.code === 'en')
        const defaultLangId = englishLang?.id || 1

        return {
            shelfLifeDays: null,
            storageConditionId: null,
            temperatureMin: null,
            temperatureMax: null,
            labelTranslations: [{ languageId: defaultLangId, label: '' }],
            labelTranslationsOnRequest: false,
            businessTypeIds: [],
            allergenIds: [],
            typeIds: [],
            ingredients: [{ languageId: defaultLangId, content: '' }],
            descriptions: [{ languageId: defaultLangId, content: '' }],
        }
    }

    const formData = reactive<ProductDescriptionsFormData>(getDefaultFormData())

    const { history, undo, redo, canUndo, canRedo } = useRefHistory(
        toRef(() => formData),
        {
            deep: true,
            capacity: 10,
            clone: true,
        }
    )

    const errorCache = shallowRef(new Map<string, string | null>())

    const validLanguages = computed(() => {
        return formData.labelTranslations
            .filter((label) => label.languageId && label.label?.trim())
            .map((label) => {
                const lang = languageOptions.value.find((l) => l.value === label.languageId)
                return {
                    id: label.languageId!,
                    name: lang?.label || `Language ${label.languageId}`,
                    code: lang?.code || '',
                }
            })
    })

    const ingredientTabs = computed(() =>
        validLanguages.value.map((lang) => ({
            id: `ingredient-tab-${lang.id}`,
            name: `ingredient-tab-${lang.id}`,
            label: lang.name,
            active: true,
        }))
    )

    const descriptionTabs = computed(() =>
        validLanguages.value.map((lang) => ({
            id: `description-tab-${lang.id}`,
            name: `description-tab-${lang.id}`,
            label: lang.name,
            active: true,
        }))
    )

    const hasIngredientsError = computed(() => {
        if (!props.fieldErrors || Object.keys(props.fieldErrors).length === 0) {
            return false
        }

        const errorKeys = Object.keys(props.fieldErrors)
        return errorKeys.some((key) => key.includes('ingredients'))
    })

    const hasDescriptionError = computed(() => {
        if (!props.fieldErrors || Object.keys(props.fieldErrors).length === 0) {
            return false
        }

        const errorKeys = Object.keys(props.fieldErrors)
        return errorKeys.some((key) => key.includes('descriptions'))
    })

    const getAvailableLanguageOptions = (currentIndex: number) => {
        const selectedLanguageIds = formData.labelTranslations
            .map((item, index) => (index !== currentIndex ? item.languageId : null))
            .filter(Boolean)

        return languageOptions.value.filter((option) => !selectedLanguageIds.includes(option.value))
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

    const handleIngredientBlur = (languageId: number) => {
        const index = formData.ingredients.findIndex((ing) => ing.languageId === languageId)
        if (index !== -1) {
            handleArrayFieldBlur('ingredients', index, 'content')
        }
    }

    const handleDescriptionBlur = (languageId: number) => {
        const index = formData.descriptions.findIndex((desc) => desc.languageId === languageId)
        if (index !== -1) {
            handleArrayFieldBlur('descriptions', index, 'content')
        }
    }

    const debouncedEmitUpdate = useDebounceFn(
        () => {
            emit('update', { ...toRaw(formData) })
        },
        300,
        { maxWait: 1000 }
    )

    const handleFieldChange = useThrottleFn((fieldName: string) => {
        emit('clear-error', fieldName)
        errorCache.value.delete(fieldName)
        debouncedEmitUpdate()
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

            debouncedEmitUpdate()
        },
        100
    )

    const addLabelTranslation = () => {
        formData.labelTranslations.push({ languageId: null, label: '' })
        debouncedEmitUpdate()
    }

    const removeLabelTranslation = (index: number) => {
        const removedTranslation = formData.labelTranslations[index]
        formData.labelTranslations.splice(index, 1)

        if (removedTranslation.languageId) {
            formData.ingredients = formData.ingredients.filter(
                (ing) => ing.languageId !== removedTranslation.languageId
            )
            formData.descriptions = formData.descriptions.filter(
                (desc) => desc.languageId !== removedTranslation.languageId
            )
        }

        debouncedEmitUpdate()
    }

    const getOrCreateIngredient = (languageId: number) => {
        let ingredient = formData.ingredients.find((ing) => ing.languageId === languageId)
        if (!ingredient) {
            ingredient = { languageId, content: '' }
            formData.ingredients.push(ingredient)
        }
        return ingredient
    }

    const getOrCreateDescription = (languageId: number) => {
        let description = formData.descriptions.find((desc) => desc.languageId === languageId)
        if (!description) {
            description = { languageId, content: '' }
            formData.descriptions.push(description)
        }
        return description
    }

    const updateIngredientContent = useDebounceFn((languageId: number, value: string) => {
        const ingredient = getOrCreateIngredient(languageId)
        ingredient.content = value
        debouncedEmitUpdate()
    }, 300)

    const updateDescriptionContent = useDebounceFn((languageId: number, value: string) => {
        const description = getOrCreateDescription(languageId)
        description.content = value
        debouncedEmitUpdate()
    }, 300)

    const onIngredientTabSelect = (index: number) => {
        activeIngredientTab.value = index
    }

    const onDescriptionTabSelect = (index: number) => {
        activeDescriptionTab.value = index
    }

    const validate = () => {
        const result = validateData('productDescriptions', productDescriptionsSchema, formData)
        return result
    }

    const initializeFormData = () => {
        const defaultData = getDefaultFormData()

        if (props.stepData && Object.keys(props.stepData).length > 0) {
            Object.keys(defaultData).forEach((key) => {
                const typedKey = key as keyof ProductDescriptionsFormData
                if (props.stepData[typedKey] !== undefined) {
                    ;(formData as any)[typedKey] = props.stepData[typedKey]
                }
            })
        }

        nextTick(() => {
            validLanguages.value.forEach((language) => {
                getOrCreateIngredient(language.id)
                getOrCreateDescription(language.id)
            })
        })
    }

    watchDebounced(
        () => props.fieldErrors,
        () => {
            errorCache.value = new Map()
        },
        { debounce: 100, maxWait: 500, deep: true }
    )

    watch(
        () => formData.labelTranslations,
        (newTranslations, oldTranslations) => {
            const newValidTranslations = newTranslations.filter(
                (label) => label.languageId && label.label?.trim()
            )

            newValidTranslations.forEach((translation) => {
                if (translation.languageId) {
                    getOrCreateIngredient(translation.languageId)
                    getOrCreateDescription(translation.languageId)
                }
            })

            if (oldTranslations && oldTranslations.length > 0) {
                const currentLanguageIds = newValidTranslations
                    .map((t) => t.languageId)
                    .filter(Boolean)
                const oldLanguageIds = oldTranslations
                    .filter((label) => label.languageId && label.label?.trim())
                    .map((t) => t.languageId)
                    .filter(Boolean)

                const removedLanguageIds = oldLanguageIds.filter(
                    (id) => !currentLanguageIds.includes(id)
                )

                if (removedLanguageIds.length > 0) {
                    formData.ingredients = formData.ingredients.filter(
                        (ingredient) => !removedLanguageIds.includes(ingredient.languageId)
                    )
                    formData.descriptions = formData.descriptions.filter(
                        (description) => !removedLanguageIds.includes(description.languageId)
                    )
                }
            }

            debouncedEmitUpdate()
        },
        { deep: true }
    )

    watch(
        () => props.stepData,
        () => {
            initializeFormData()
        },
        { deep: true }
    )

    onMounted(() => {
        initializeFormData()
    })

    defineExpose({
        validate,
        formData: readonly(formData),
        undo,
        redo,
        canUndo,
        canRedo,
    })
</script>
