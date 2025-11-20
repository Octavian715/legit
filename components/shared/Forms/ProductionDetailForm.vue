<!-- components/forms/ProductionDetailForm.vue -->
<template>
    <div class="production-detail-form">
        <form novalidate @submit.prevent="handleSubmit">
            <div class="flex flex-col gap-3 px-5 mb-6">
                <!-- Factory Name -->
                <Input
                    v-model="form.name"
                    :label="$t('factory.name', 'Factory name')"
                    name="name"
                    background="bg-white"
                    :error="!!errors.name"
                    :error-message="errors.name"
                    required
                    autocomplete="organization"
                    @input="clearFieldError('name')"
                />

                <!-- Same as company name checkbox -->
                <div class="flex items-center gap-2">
                    <Checkbox
                        v-model="sameAsCompanyName"
                        :label="$t('company.sameAsCompanyName', 'Same as company name')"
                        @update:model-value="handleSameAsCompanyNameChange"
                    />
                </div>

                <!-- Choose factory size -->
                <Select
                    v-model="form.userFactorySizeId"
                    :label="$t('factory.chooseFactorySize', 'Choose factory size')"
                    name="userFactorySizeId"
                    background="bg-white"
                    :error="!!errors.userFactorySizeId"
                    :error-message="errors.userFactorySizeId"
                    required
                    size="lg"
                    :options="factorySizeOptions"
                    :disabled="!staticDataReady"
                    @update:model-value="clearFieldError('userFactorySizeId')"
                />

                <!-- Choose Country -->
                <Select
                    v-model="form.countryId"
                    :label="$t('company.chooseCountryOfRegistration', 'Choose country')"
                    name="countryId"
                    background="bg-white"
                    :error="!!errors.countryId"
                    :error-message="errors.countryId"
                    required
                    size="lg"
                    :options="countryOptions"
                    :disabled="!staticDataReady"
                    @update:model-value="clearFieldError('countryId')"
                />

                <!-- State -->
                <Input
                    v-model="form.stateName"
                    :label="t('company.chooseState')"
                    name="stateName"
                    background="bg-white"
                    :error="!!errors.stateName"
                    :error-message="errors.stateName"
                    @input="clearFieldError('stateName')"
                />

                <!-- Enter Your City -->
                <Input
                    v-model="form.cityName"
                    :label="$t('company.city', 'Enter your city')"
                    name="cityName"
                    background="bg-white"
                    :error="!!errors.cityName"
                    :error-message="errors.cityName"
                    required
                    @input="clearFieldError('cityName')"
                />

                <!-- Street -->
                <Input
                    v-model="form.streetName"
                    :label="$t('company.street', 'Street')"
                    name="streetName"
                    background="bg-white"
                    :error="!!errors.streetName"
                    :error-message="errors.streetName"
                    required
                    @input="clearFieldError('streetName')"
                />

                <!-- Number and Postal Code - Side by Side -->
                <div class="flex gap-3">
                    <!-- Number -->
                    <div class="flex-1">
                        <Input
                            v-model="form.streetNumber"
                            :label="$t('company.number', 'Number')"
                            name="streetNumber"
                            background="bg-white"
                            :error="!!errors.streetNumber"
                            :error-message="errors.streetNumber"
                            required
                            @input="clearFieldError('streetNumber')"
                        />
                    </div>

                    <!-- Postal Code -->
                    <div class="flex-1">
                        <Input
                            v-model="form.postalCode"
                            :label="$t('company.postalCode', 'Postal code')"
                            name="postalCode"
                            background="bg-white"
                            :error="!!errors.postalCode"
                            :error-message="errors.postalCode"
                            required
                            @input="clearFieldError('postalCode')"
                        />
                    </div>
                </div>
            </div>

            <!-- Actions (if showActions is true) -->
            <div v-if="showActions" class="flex gap-3 justify-center border-t border-gray-400 pt-4">
                <Button
                    type="button"
                    color="gray"
                    variant="filled"
                    :label="$t('cancel', 'Cancel')"
                    :disabled="isSubmitting"
                    @click="handleCancel"
                />

                <Button
                    type="submit"
                    color="blue"
                    :label="
                        editMode
                            ? $t('save', 'Update')
                            : $t('modal.addfactoryAccount', 'Add Factory')
                    "
                    :loading="isSubmitting"
                    :disabled="!canSubmit"
                />
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, onMounted, watch } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { validateData } from '~/utils/validator/index'
    import { useStaticData } from '~/composables/useStaticData'
    import { useRegistrationNavigation } from '~/useRegistrationNavigation'
    import { useToastNotification } from '~/composables/useToastNotification'

    import {
        productionDetailsSchema,
        type ProductionDetailsFormData,
    } from '~/utils/validator/schemas/auth/registerSchema'

    interface Props {
        initialData?: Partial<ProductionDetailsFormData> | null
        showActions?: boolean
        isSubmitting?: boolean
    }

    const props = withDefaults(defineProps<Props>(), {
        initialData: null,
        showActions: false,
        isSubmitting: false,
    })

    const emit = defineEmits<{
        (e: 'save', data: ProductionDetailsFormData): void
        (e: 'cancel'): void
    }>()

    // Composables
    const { t } = useI18n({ useScope: 'global' })
    const toast = useToastNotification()
    const { getStepData } = useRegistrationNavigation()
    const {
        countryOptions,
        factorySizeOptions,
        error: staticDataError,
        isLoaded: staticDataReady,
    } = useStaticData()

    // State
    const editMode = computed(() => !!props.initialData?.name)
    const sameAsCompanyName = ref(false)

    // Get company profile data for "same as company name" functionality
    const companyProfile = getStepData('companyDetails') as any

    // Form data - using exact schema field names
    const form = reactive<ProductionDetailsFormData>({
        name: props.initialData?.name || '',
        userFactorySizeId: props.initialData?.userFactorySizeId || 0,
        countryId: props.initialData?.countryId || 0,
        stateName: props.initialData?.stateName,
        cityName: props.initialData?.cityName || '',
        streetName: props.initialData?.streetName || '',
        streetNumber: props.initialData?.streetNumber || '',
        postalCode: props.initialData?.postalCode || '',
    })

    // Field errors
    const errors = reactive({
        name: '',
        userFactorySizeId: '',
        countryId: '',
        stateName: '',
        cityName: '',
        streetName: '',
        streetNumber: '',
        postalCode: '',
    })

    // Computed Properties
    const canSubmit = computed(() => {
        return (
            form.name &&
            form.userFactorySizeId > 0 &&
            form.countryId > 0 &&
            form.cityName &&
            form.streetName &&
            form.streetNumber &&
            form.postalCode &&
            !Object.values(errors).some((error) => error) &&
            !props.isSubmitting &&
            staticDataReady.value
        )
    })

    // Handle "Same as company name" checkbox
    const handleSameAsCompanyNameChange = (checked: boolean) => {
        if (checked) {
            form.name = useUserStore().user?.company_details?.legal_name || ''
        } else if (!checked) {
            form.name = ''
        }
        clearFieldError('name')
    }

    // Form validation
    const validateForm = (): boolean => {
        clearAllErrors()

        const validationResult = validateData('productionDetails', productionDetailsSchema, form)

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
    }

    // Clear all field errors
    const clearAllErrors = () => {
        Object.keys(errors).forEach((key) => {
            errors[key as keyof typeof errors] = ''
        })
    }

    // Handlers
    const handleSubmit = () => {
        if (!validateForm()) {
            return
        }

        emit('save', { ...form })
    }

    const handleCancel = () => {
        emit('cancel')
    }

    // Update form when initialData changes
    watch(
        () => props.initialData,
        (newData) => {
            if (newData) {
                Object.assign(form, {
                    name: newData.name || '',
                    userFactorySizeId: newData.userFactorySizeId || 0,
                    countryId: newData.countryId || 0,
                    stateName: newData.stateName,
                    cityName: newData.cityName || '',
                    streetName: newData.streetName || '',
                    streetNumber: newData.streetNumber || '',
                    postalCode: newData.postalCode || '',
                })
            }
        },
        { immediate: true, deep: true }
    )

    onMounted(() => {
        // Check for static data errors
        if (staticDataError.value) {
            toast.error(
                t('error.staticDataLoad', 'Failed to load application data'),
                t('error', 'Error')
            )
        }

        // Set sameAsCompanyName if the form name matches company name
        if (companyProfile?.profile?.legalName && form.name === companyProfile.profile.legalName) {
            sameAsCompanyName.value = true
        }
    })
</script>
