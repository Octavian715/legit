<template>
    <div class="flex flex-col space-y-5">
        <div class="flex items-center justify-between">
            <h3 class="text-gray-950 font-bold text-title3">{{ t('product.aiAssistent') }}</h3>
        </div>

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-4">
                <div class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
                    <div class="flex-1 flex flex-col gap-2">
                        <!-- Keywords Input -->
                        <TagInput
                            v-model="formData.keywords"
                            :label="t('keywords')"
                            :placeholder="t('product.addCustomKeyword')"
                            :suggestions="keywordSuggestions"
                            label-key="label"
                            value-key="value"
                            size="lg"
                            :disabled="isLoadingSuggestions"
                            :limit="20"
                            :min-chars="0"
                            :required="true"
                            :allow-duplicates="false"
                            :aria-busy="isLoadingSuggestions"
                            @update:model-value="handleKeywordsChange"
                            @add="handleAddCustomKeyword"
                        />
                    </div>

                    <div
                        class="flex-1 self-center flex items-center justify-center md:justify-start gap-3"
                    >
                        <!-- Select All Checkbox -->
                        <Checkbox
                            v-model="selectAllChecked"
                            :label="t('product.selectAllSuggestions')"
                            :indeterminate="isSomeSelected && !isAllSelected"
                            :disabled="
                                !hasLoadedSuggestions ||
                                keywordSuggestions.length === 0 ||
                                isLoadingSuggestions
                            "
                            size="md"
                            wrap
                            @change="handleSelectAllChange"
                        />

                        <!-- Refresh Button -->
                        <ButtonIcon
                            v-if="hasLoadedSuggestions || isEditMode"
                            icon="reset"
                            size="md"
                            variant="ghost"
                            color="blue"
                            :loading="isLoadingSuggestions"
                            :disabled="isLoadingSuggestions"
                            :title="t('product.refreshSuggestions')"
                            @click="handleRefreshSuggestions"
                        />
                    </div>
                </div>
                <!-- Loading State -->
                <div
                    v-if="isLoadingSuggestions"
                    class="flex items-center gap-2 text-blue-600 text-subtitle3"
                    role="status"
                    aria-live="polite"
                >
                    <svg
                        class="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            class="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            stroke-width="4"
                        ></circle>
                        <path
                            class="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                    <span>{{ t('product.loadingAiSuggestions') }}</span>
                </div>

                <!-- Success State -->
                <div
                    v-else-if="hasLoadedSuggestions && keywordSuggestions.length > 0"
                    class="flex items-center gap-2 text-green-600 text-subtitle3"
                >
                    <svg
                        class="h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                    <span>{{
                        t('product.aiSuggestionsLoaded', {
                            count: keywordSuggestions.length,
                        })
                    }}</span>
                </div>

                <!-- Edit Mode State -->
                <div
                    v-else-if="isEditMode && !hasLoadedSuggestions"
                    class="flex items-center gap-2 text-gray-600 text-subtitle3"
                >
                    <svg
                        class="h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <span>{{ t('product.editModeKeywordsLoaded') }}</span>
                </div>

                <div v-if="fieldErrors.keywords" class="text-red-500 text-caption1 mt-1">
                    {{ fieldErrors.keywords }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { validateData } from '~/utils/validator'
    import {
        productKeywordsSchema,
        type ProductKeywordsFormData,
    } from '~/utils/validator/schemas/products/product'
    import { useProductStore } from '~/stores/product'
    import TagInput from '~/components/ui/TagInput.vue'
    import ButtonIcon from '~/components/ui/ButtonIcon.vue'
    import Checkbox from '~/components/ui/Checkbox.vue'

    interface Props {
        stepData?: Partial<ProductKeywordsFormData>
        fieldErrors?: Record<string, string>
    }

    const props = withDefaults(defineProps<Props>(), {
        stepData: () => ({}),
        fieldErrors: () => ({}),
    })

    const emit = defineEmits<{
        update: [data: Partial<ProductKeywordsFormData>]
    }>()

    const productStore = useProductStore()
    const { t } = useI18n()
    const route = useRoute()

    const isLoadingSuggestions = ref(false)
    const hasLoadedSuggestions = ref(false)
    const isEditMode = computed(() => !!route.query.product && route.query.product !== 'new')

    const formData = ref<ProductKeywordsFormData>(getDefaultFormData())

    const keywordSuggestions = computed(() => {
        const suggestions = productStore.aiSuggestion ?? []

        if (!Array.isArray(suggestions)) {
            return []
        }

        return suggestions.map((keyword) => {
            if (typeof keyword === 'string') {
                return {
                    label: keyword,
                    value: keyword,
                }
            }

            if (typeof keyword === 'number') {
                return {
                    label: String(keyword),
                    value: keyword,
                }
            }

            return {
                label:
                    keyword.label || keyword.name || String(keyword.value || keyword.id || keyword),
                value: keyword.value || keyword.id || keyword,
            }
        })
    })

    // Check if all suggestions are selected
    const isAllSelected = computed(() => {
        if (keywordSuggestions.value.length === 0) return false
        if (formData.value.keywords.length === 0) return false

        return keywordSuggestions.value.every((suggestion) =>
            formData.value.keywords.includes(suggestion.value)
        )
    })

    // Check if some (but not all) suggestions are selected
    const isSomeSelected = computed(() => {
        if (formData.value.keywords.length === 0) return false

        return keywordSuggestions.value.some((suggestion) =>
            formData.value.keywords.includes(suggestion.value)
        )
    })

    // Sync checkbox state with selection
    const selectAllChecked = computed({
        get: () => isAllSelected.value,
        set: () => {}, // Handled by @change event
    })

    function getDefaultFormData(): ProductKeywordsFormData {
        return {
            keywords: [],
        }
    }

    const handleKeywordsChange = (newKeywords: any[]) => {
        formData.value.keywords = newKeywords.map((keyword) => {
            if (typeof keyword === 'string' || typeof keyword === 'number') {
                return keyword
            }
            return keyword.value || keyword.id || keyword
        })

        emitUpdate()
    }

    const handleSelectAllChange = (isChecked: boolean) => {
        if (isChecked) {
            // Select all suggestions
            const allSuggestionValues = keywordSuggestions.value.map((s) => s.value)
            const currentKeywords = formData.value.keywords || []

            // Merge current keywords with all suggestions (avoid duplicates)
            const uniqueKeywords = Array.from(new Set([...currentKeywords, ...allSuggestionValues]))

            formData.value.keywords = uniqueKeywords
        } else {
            // Deselect all suggestions (keep only custom keywords)
            const suggestionValues = new Set(keywordSuggestions.value.map((s) => s.value))
            formData.value.keywords = formData.value.keywords.filter(
                (keyword) => !suggestionValues.has(keyword)
            )
        }

        emitUpdate()
    }

    const handleRefreshSuggestions = async () => {
        const productId = route.query.product

        if (!productId || productId === 'new') {
            return
        }

        try {
            isLoadingSuggestions.value = true
            await productStore.getAiSuggestions(Number(productId))
            hasLoadedSuggestions.value = true
        } catch (error) {
            console.error('Failed to refresh AI suggestions:', error)
        } finally {
            isLoadingSuggestions.value = false
        }
    }

    const handleAddCustomKeyword = async (customKeyword: any) => {}

    const emitUpdate = () => {
        emit('update', { ...toRaw(formData.value) })
    }

    const validate = () => {
        return validateData('productKeywords', productKeywordsSchema, formData.value)
    }

    const initializeFormData = () => {
        const defaultData = getDefaultFormData()

        if (props.stepData && Object.keys(props.stepData).length > 0) {
            Object.keys(defaultData).forEach((key) => {
                if (props.stepData[key] !== undefined) {
                    formData.value[key] = props.stepData[key]
                }
            })
        }
    }

    watch(
        () => props.stepData,
        () => {
            initializeFormData()
        },
        { deep: true }
    )

    onMounted(async () => {
        const productId = route.query.product
        initializeFormData()

        if (isEditMode.value && formData.value.keywords && formData.value.keywords.length > 0) {
            hasLoadedSuggestions.value = true
            return
        }

        if (productId && productId !== 'new') {
            try {
                isLoadingSuggestions.value = true
                await productStore.getAiSuggestions(Number(productId))
                hasLoadedSuggestions.value = true
            } catch (error) {
                console.error('Failed to load AI suggestions:', error)
                hasLoadedSuggestions.value = false
            } finally {
                isLoadingSuggestions.value = false
            }
        }
    })

    onUnmounted(() => {
        productStore.resetAiSuggetions()
    })

    defineExpose({
        validate,
        formData: readonly(formData),
    })
</script>
