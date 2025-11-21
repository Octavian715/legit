<!-- pages/register/company-details/topics.vue - Fixed Reactive Data -->
<template>
    <AuthContainer
        class="bg-gray-150"
        :full-height="false"
        content-class="max-w-4xl mx-auto"
        class-container="w-full"
        spacing
    >
        <template #header>
            <h2 class="font-bold text-gray-950 text-subtitle1 text-center mb-2">
                {{ $t('company.intrestingCategories', 'Interesting categories') }}
            </h2>
            <p class="text-subtitle3 text-gray-700 text-center">
                {{ $t('stepOf', { n: '4/6' }, `Step 4/6`) }}
            </p>
        </template>

        <div class="mt-3">
            <!-- Loading State -->
            <div v-if="isLoading" class="flex justify-center items-center p-8">
                <span class="loader"></span>
            </div>

            <!-- Topics Form -->
            <form
                v-else
                class="flex flex-col gap-4 w-full max-w-md mx-auto"
                novalidate
                @submit.prevent="handleSubmit"
            >
                <p class="text-subtitle3 text-gray-800">
                    {{
                        $t(
                            'company.intrestingCategoriesInteres',
                            {
                                count: form.interestingCategories.length,
                                total: categoryOptions.length,
                            },
                            'Categories which i am interested:'
                        )
                    }}</p
                >
                <!-- Categories Grid -->
                <div class="flex flex-wrap gap-2">
                    <div
                        v-for="category in categoryOptions"
                        :key="category.id"
                        class="flex items-center"
                    >
                        <Checkbox
                            :model-value="isSelected(category.id)"
                            :label="category.label"
                            :name="`category-${category.id}`"
                            :disabled="isSubmitting"
                            size="md"
                            class="rounded-sm p-1 pr-1.5"
                            :class="{
                                'bg-blue-100': isSelected(category.id),
                                'bg-gray-400': !isSelected(category.id),
                            }"
                            checked-label-color="text-blue-600"
                            @update:model-value="toggleCategory(category.id)"
                        />
                    </div>
                </div>
                <!-- Error Display -->
                <div v-if="errors.interestingCategories" class="text-center">
                    <p class="text-caption1 text-red-500" role="alert">
                        {{ errors.interestingCategories }}
                    </p>
                </div>

                <Select
                    v-if="false"
                    v-model="newSuggestion"
                    :label="$t('company.suggestOtherCategories')"
                    name="newSuggestion"
                    background="bg-gray-50"
                    multiple
                    size="lg"
                    class="flex-1"
                    :options="suggestedCategoryOptions"
                    searchable
                    taggable
                    :push-tags="true"
                    @update:model-value="handleSuggestionSelect"
                />

                <!-- Navigation Buttons -->
                <div class="flex flex-col sm:flex-row gap-3 justify-between mt-3">
                    <Button
                        type="button"
                        variant="filled"
                        color="gray"
                        :label="$t('prevStep', 'Previous Step')"
                        class="w-full"
                        :disabled="isSubmitting"
                        @click="handleGoBack"
                    />

                    <Button
                        type="submit"
                        variant="filled"
                        color="red"
                        :label="$t('nextStep', 'Next Step')"
                        class="w-full"
                        :loading="isSubmitting"
                        :disabled="!canSubmit"
                    />
                </div>
            </form>
        </div>
    </AuthContainer>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, onMounted, watch } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useLocalePath } from '#imports'
    import { useRouter } from 'vue-router'
    import { validateData } from '~/utils/validator'
    import { useRegistrationNavigation } from '~/composables/useRegistrationNavigation'
    import { useToastNotification } from '~/composables/useToastNotification'

    // Import the schema
    import {
        companyTopicsSchema,
        type CompanyTopicsFormData,
    } from '~/utils/validator/schemas/auth/registerSchema'

    definePageMeta({ middleware: ['registration'], layout: 'auth' })

    // Composables
    const { t } = useI18n({ useScope: 'global' })
    const localePath = useLocalePath()
    const router = useRouter()
    const {
        getStepData,
        updateStepData,
        initializeStep,
        isSavingCompanyDetails,
        goBack,
        canGoBack,
        getError,
        getFieldErrors,
        hasFieldErrors,
        clearError,
        completeCompanyTopics,
        loadAndPopulateFieldRegistration,
    } = useRegistrationNavigation()
    const toast = useToastNotification()

    // State
    const isLoading = ref(true)
    const newSuggestion = ref('')

    // Get current data
    const companyData = getStepData('companyDetails') as any

    // Helper function to extract plain values from reactive objects
    const extractPlainValues = (data: any): number[] => {
        if (!data || !Array.isArray(data)) return []

        return data
            .map((item) => {
                // Handle reactive proxy objects
                if (item && typeof item === 'object' && item._custom?.value) {
                    return item._custom.value.id || item._custom.value
                }
                // Handle plain objects
                if (item && typeof item === 'object' && item.id) {
                    return item.id
                }
                // Handle plain numbers
                if (typeof item === 'number') {
                    return item
                }
                // Fallback
                return parseInt(item) || 0
            })
            .filter((id) => id > 0) // Remove invalid IDs
    }

    const form = reactive<CompanyTopicsFormData>({
        // Extract plain values from potentially reactive objects
        interestingCategories: extractPlainValues(companyData?.topics?.interestingCategories || []),
        suggestedCategories: extractPlainValues(companyData?.topics?.suggestedCategories || []),
    })

    // Field errors
    const errors = reactive({
        interestingCategories: '',
        suggestedCategories: '',
    })

    // Enhanced backend error mapping
    const fieldMapping: Record<string, keyof typeof errors> = {
        interesting_categories: 'interestingCategories',
        suggested_categories: 'suggestedCategories',
        interestingCategories: 'interestingCategories',
        suggestedCategories: 'suggestedCategories',
    }

    // Computed Properties
    const isSubmitting = computed(() => isSavingCompanyDetails.value)

    const canSubmit = computed(() => {
        return (
            form.interestingCategories.length > 0 &&
            !Object.values(errors).some((error) => error) &&
            !isSubmitting.value
        )
    })

    const handleSuggestionSelect = (value: any) => {
        newSuggestion.value = value
    }

    const suggestedCategoryOptions = computed(() => [])

    // Categories options
    const categoryOptions = computed(() => [
        { id: 1, label: t('categories.frozenFoods', 'Frozen foods') },
        { id: 2, label: t('categories.fruitsVegetables', 'Fruits & vegetables') },
        { id: 3, label: t('categories.freshMeatPoultry', 'Fresh meat & poultry') },
        { id: 4, label: t('categories.fishSeafood', 'Fish & sea food') },
        { id: 5, label: t('categories.sausagesMeat', 'Sausages & meat prod.') },
        { id: 6, label: t('categories.dairyProducts', 'Dairy products') },
        { id: 7, label: t('categories.breadBakery', 'Bread & bakery') },
        { id: 8, label: t('categories.riceGrains', 'Rice & grains') },
        { id: 9, label: t('categories.cannedPrepFood', 'Canned & prep. food') },
        { id: 10, label: t('categories.spicesCondiments', 'Spices & condiments') },
        { id: 11, label: t('categories.oilsSauces', 'Oils & sauces') },
        { id: 12, label: t('categories.snacksChocolate', 'Snacks & chocolate') },
        { id: 13, label: t('categories.nutsSeeds', 'Nuts & seeds') },
        { id: 14, label: t('categories.coffeeTea', 'Coffee & tea') },
        { id: 15, label: t('categories.nonAlcoholicBeverages', 'Non Alcoholic beverages') },
        { id: 16, label: t('categories.alcoholicBeverages', 'Alcoholic beverages') },
        { id: 17, label: t('categories.tobacco', 'Tobacco') },
        { id: 18, label: t('categories.babyChildren', 'Baby & children') },
        { id: 19, label: t('categories.floral', 'Floral') },
    ])

    // Helper functions
    const isSelected = (categoryId: number): boolean => {
        return form.interestingCategories.includes(categoryId)
    }

    // Improved toggleCategory with proper array handling
    const toggleCategory = (categoryId: number) => {
        if (isSelected(categoryId)) {
            // Remove category - create new array
            form.interestingCategories = form.interestingCategories.filter(
                (id) => id !== categoryId
            )
        } else {
            // Add category - create new array
            form.interestingCategories = [...form.interestingCategories, categoryId]
        }
        clearFieldError('interestingCategories')
    }

    // Enhanced backend error mapping function
    const mapBackendErrorsToFields = (backendErrors: Record<string, string | string[]>) => {
        Object.entries(backendErrors).forEach(([backendField, messages]) => {
            const message = Array.isArray(messages) ? messages[0] : messages
            const frontendField = fieldMapping[backendField]

            if (frontendField && frontendField in errors) {
                errors[frontendField] = message as string
            }
        })
    }

    // Enhanced store error sync
    const syncStoreErrorsToFields = () => {
        const storeError = getError()
        const fieldErrors = getFieldErrors()

        if (hasFieldErrors() && fieldErrors) {
            mapBackendErrorsToFields(fieldErrors)
            return
        }

        if (storeError?.status === 422 && storeError.errors) {
            mapBackendErrorsToFields(storeError.errors)
            return
        }

        if (storeError && !hasFieldErrors()) {
            const errorMessage =
                storeError.message ||
                t('errors.generalSubmit', 'Failed to save topics. Please try again.')
            toast.error(errorMessage, t('error', 'Error'))
        }
    }

    // Form validation
    const validateForm = (): boolean => {
        const validationResult = validateData('companyTopics', companyTopicsSchema, form)

        if (!validationResult.isValid) {
            validationResult.errors.forEach((error) => {
                if (error.field in errors) {
                    errors[error.field as keyof typeof errors] = error.message
                }
            })
        }

        return validationResult.isValid
    }

    // Clear field error on user input
    const clearFieldError = (field: keyof typeof errors) => {
        if (errors[field]) {
            errors[field] = ''
        }
        clearError()
        updateCompanyTopicsData()
    }

    // Clear all field errors
    const clearAllErrors = () => {
        Object.keys(errors).forEach((key) => {
            errors[key as keyof typeof errors] = ''
        })
        clearError()
    }

    // Update store with plain values
    const updateCompanyTopicsData = () => {
        updateStepData('companyDetails', {
            section: 'topics',
            data: {
                interestingCategories: [...form.interestingCategories], // Plain array of numbers
                suggestedCategories: [...form.suggestedCategories],
            },
        })
    }

    // Enhanced submit handler
    const handleSubmit = async () => {
        clearAllErrors()

        if (!validateForm()) {
            return
        }

        try {
            // Ensure we're sending plain values, not reactive objects
            const submitData = {
                interestingCategories: [...form.interestingCategories],
                suggestedCategories: [...form.suggestedCategories],
            }

            const result = await completeCompanyTopics(submitData)

            if (result.success) {
                toast.success(
                    t('register.companyTopicsSaved', 'Categories saved successfully!'),
                    t('success', 'Success')
                )

                // Enhanced navigation logic
                if (result.nextStep && result.nextStep !== 'company-details') {
                    const stepRoutes: Record<string, string> = {
                        'production-details': '/register/production-details',
                        'factory-details': '/register/production-details',
                        'export-details': '/register/export-details',
                        certificates: '/register/company-certificates',
                        'company-certificates': '/register/company-certificates',
                        'business-certificates': '/register/business-certificates',
                        'profile-media': '/register/public-profile',
                        'public-profile': '/register/public-profile',
                    }

                    const nextRoute = stepRoutes[result.nextStep]
                    if (nextRoute) {
                        await router.push(localePath(nextRoute))
                    } else {
                        await router.push(localePath('/marketplace'))
                    }
                } else if (result.nextSubstep) {
                    // Continue to next substep within company-details
                    const substepRoutes: Record<number, string> = {
                        5: '/register/company-details/contacts',
                        6: '/register/company-details/banks',
                    }

                    const nextRoute = substepRoutes[result.nextSubstep]
                    if (nextRoute) {
                        await router.push(localePath(nextRoute))
                    } else {
                        await router.push(localePath('/register/company-details/contacts'))
                    }
                } else {
                    // Default: go to contacts
                    await router.push(localePath('/register/company-details/contacts'))
                }
            } else {
                syncStoreErrorsToFields()
            }
        } catch (error) {
            toast.error(
                t('errors.generalSubmit', 'Failed to save topics. Please try again.'),
                t('error', 'Error')
            )
        }
    }

    // Go back handler
    const handleGoBack = async () => {
        updateCompanyTopicsData()
        await router.push(localePath('/register/company-details/address'))
    }

    const loadUserCompanyTopicsData = async () => {
        try {
            const topics = await loadAndPopulateFieldRegistration('interesting_categories')

            if (topics) {
                // Extract plain values from API response
                const plainValues = extractPlainValues(topics)
                if (plainValues.length > 0) {
                    form.interestingCategories = plainValues
                }
            } else if (companyData?.topics?.interestingCategories) {
                // Use existing company data if available
                form.interestingCategories = extractPlainValues(
                    companyData.topics.interestingCategories
                )
            }

            if (companyData?.topics?.suggestedCategories) {
                form.suggestedCategories = extractPlainValues(
                    companyData.topics.suggestedCategories
                )
            }
        } catch (error) {
            // Silent error handling
        }
    }

    // Watch store errors and sync them to fields
    watch(
        () => [getError(), getFieldErrors(), hasFieldErrors()],
        ([newError, newFieldErrors, hasErrors]) => {
            if (newError || hasErrors) {
                syncStoreErrorsToFields()
            }
        },
        { immediate: true, deep: true }
    )

    // Watch form changes to update store
    watch(
        () => ({ ...form }),
        (newForm) => {
            updateStepData('companyDetails', {
                section: 'topics',
                data: {
                    interestingCategories: [...newForm.interestingCategories],
                    suggestedCategories: [...newForm.suggestedCategories],
                },
            })
        },
        { deep: true }
    )

    // Lifecycle
    onMounted(async () => {
        await loadUserCompanyTopicsData()
        initializeStep('companyDetails')
        isLoading.value = false

        // Check for any existing store errors
        syncStoreErrorsToFields()
    })
</script>

<style scoped>
    .space-y-4 > * + * {
        margin-top: 1rem;
    }
</style>
