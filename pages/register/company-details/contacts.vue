<!-- Updated contact.vue using same validation pattern as detailed.vue -->
<template>
    <AuthContainer
        class="bg-gray-150"
        :full-height="false"
        content-class="max-w-4xl mx-auto"
        class-container="w-full"
        spacing
    >
        <template #header>
            <h2 class="font-bold text-gray-950 text-subtitle1 text-center">
                {{ $t('register.contactDetails', 'Contact details') }}
            </h2>
            <p class="text-subtitle3 text-gray-700 text-center mt-2">
                {{ $t('stepOf', { n: '5/6' }, `Step 5/6`) }}
            </p>
        </template>

        <div class="mt-3">
            <!-- Loading State -->
            <div v-if="isLoading" class="flex justify-center items-center p-8">
                <span class="loader"></span>
            </div>

            <!-- Static Data Error -->
            <!-- <div v-else-if="staticDataError" class="flex flex-col items-center p-8 text-red-600">
                <p>{{ $t('error.staticDataLoad', 'Failed to load application data') }}</p>
                <Button
                    variant="filled"
                    color="blue"
                    :label="$t('retry', 'Retry')"
                    class="mt-2"
                    @click="retryStaticData"
                />
            </div> -->

            <!-- Contact Details Form -->
            <form
                v-else
                class="flex flex-col gap-3 w-full md:w-1/2 mx-auto"
                novalidate
                @submit.prevent="handleSubmit"
            >
                <!-- Contact Person -->
                <Input
                    v-model="form.name"
                    :label="$t('contact.contactPerson', 'Contact person')"
                    name="contactPerson"
                    background="bg-white"
                    :error="!!errors.name"
                    :error-message="errors.name"
                    required
                    autocomplete="name"
                    @input="clearFieldError('name')"
                />

                <!-- E-Mail Address -->
                <Input
                    v-model="form.email"
                    :label="$t('contact.emailAddress', 'E-Mail address')"
                    name="email"
                    background="bg-white"
                    :error="!!errors.email"
                    :error-message="errors.email"
                    required
                    type="email"
                    autocomplete="email"
                    @input="clearFieldError('email')"
                />

                <!-- Choose Position -->
                <Select
                    v-model="form.userContactPositionId"
                    :label="$t('contact.choosePosition', 'Choose Position')"
                    name="position"
                    background="bg-white"
                    :error="!!errors.userContactPositionId"
                    :error-message="errors.userContactPositionId"
                    required
                    size="lg"
                    :options="contactPositionOptions"
                    @update:model-value="clearFieldError('userContactPositionId')"
                />

                <!-- Other Position (shown when "Other" is selected) -->
                <Input
                    v-if="form.userContactPositionId === 16"
                    v-model="form.customPosition"
                    :label="$t('contact.otherPosition', 'Other position')"
                    name="customPosition"
                    background="bg-white"
                    :error="!!errors.customPosition"
                    :error-message="errors.customPosition"
                    @input="clearFieldError('customPosition')"
                />

                <!-- Phone Numbers Section -->
                <div class="space-y-3">
                    <div
                        v-for="(phone, index) in form.phones"
                        :key="index"
                        class="flex gap-2 items-start"
                    >
                        <!-- Phone Input with proper validation -->
                        <PhoneInput
                            v-model="phone.phoneNumber"
                            :name="`phone-${index}`"
                            :label="getPhoneLabel(index)"
                            background="bg-white"
                            size="lg"
                            class="flex-1"
                            country-code="MD"
                            :error="getPhoneError(index)"
                            @input="handlePhoneInput(index, $event)"
                            @update:is-valid="handlePhoneValidation(index, $event)"
                            @update:selected-country="handleCountryChange(index, $event)"
                        />

                        <!-- Remove Phone Button -->
                        <ButtonClose
                            v-if="form.phones.length > 1"
                            size="md"
                            icon-size="md"
                            :label="$t('close')"
                            class="mt-3"
                            @click="removePhone(index)"
                        />
                    </div>

                    <!-- General Phone Error -->
                    <p v-if="errors.phones" class="text-caption1 text-red-600" role="alert">
                        {{ errors.phones }}
                    </p>

                    <!-- Add Phone Button -->
                    <ButtonAction
                        v-if="form.phones.length < 5"
                        class="py-2"
                        :label="$t('addATemplate', { template: $t('phoneNumber').toLowerCase() })"
                        @click="addPhone"
                    />
                </div>

                <PhoneInput
                    v-model="form.faxNumber"
                    name="fax"
                    :label="$t('contact.faxNumber', 'Fax number')"
                    background="bg-white"
                    size="lg"
                    country-code="MD"
                    :error="errors.faxNumber"
                    @input="clearFieldError('faxNumber')"
                    @update:is-valid="faxValidation = $event"
                    @update:selected-country="handleFaxCountryChange($event)"
                />

                <!-- Navigation Buttons -->
                <div class="flex flex-col sm:flex-row gap-3 justify-between mt-3">
                    <Button
                        type="button"
                        variant="filled"
                        color="gray"
                        :label="$t('prevStep', 'Previous step')"
                        class="w-full"
                        :disabled="isSubmitting"
                        @click="handleGoBack"
                    />

                    <Button
                        type="submit"
                        variant="filled"
                        color="red"
                        :label="$t('nextStep', 'Next step')"
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
    import { useRegistrationNavigation } from '~/useRegistrationNavigation'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { useStaticData } from '~/composables/useStaticData'

    // Import PhoneInput component
    import PhoneInput from '~/components/ui/PhoneInput.vue'

    import {
        companyContactsSchema,
        type CompanyContactsFormData,
    } from '~/utils/validator/schemas/auth/registerSchema'

    definePageMeta({ middleware: ['registration'], layout: 'auth' })

    // Composables
    const { t } = useI18n({ useScope: 'global' })
    const localePath = useLocalePath()
    const router = useRouter()
    const {
        getStepData,
        updateStepData,
        completeCompanyContacts,
        isSavingCompanyDetails,
        goBack,
        canGoBack,
        getError,
        getFieldErrors,
        hasFieldErrors,
        clearError,
        loadAndPopulateFieldRegistration,
    } = useRegistrationNavigation()
    const toast = useToastNotification()

    // Static data
    const {
        contactPositionOptions,
        error: staticDataError,
        isLoaded: staticDataReady,
        refetch: refetchStaticData,
    } = useStaticData()

    // State
    const isLoading = ref(true)
    const phoneValidations = ref<boolean[]>([])
    const faxValidation = ref(false)

    // Get current data
    const companyData = getStepData('companyDetails') as any

    // Form data - using exact schema field names like in detailed.vue
    const form = reactive<CompanyContactsFormData>({
        name: companyData?.contacts?.name || '',
        email: companyData?.contacts?.email || '',
        userContactPositionId: companyData?.contacts?.userContactPositionId || null,
        customPosition: companyData?.contacts?.customPosition || '',
        phones:
            companyData?.contacts?.phones?.length > 0
                ? companyData.contacts.phones
                : [{ countryId: 373, phoneNumber: '', verified: false }], // Default to Moldova
        faxCountryId: companyData?.contacts?.faxCountryId || null,
        faxNumber: companyData?.contacts?.faxNumber || '',
    })

    // Field errors only - EXACTLY like detailed.vue
    const errors = reactive({
        name: '',
        email: '',
        userContactPositionId: '',
        customPosition: '',
        phones: '',
        faxCountryId: '',
        faxNumber: '',
    })

    // Phone-specific errors (additional to main errors)
    const phoneErrors = ref<string[]>([])

    // Enhanced backend error mapping - EXACTLY like detailed.vue
    const fieldMapping: Record<string, keyof typeof errors> = {
        // Snake case (API response)
        name: 'name',
        email: 'email',
        user_contact_position_id: 'userContactPositionId',
        custom_position: 'customPosition',
        phones: 'phones',
        fax_country_id: 'faxCountryId',
        fax_number: 'faxNumber',

        // Camel case (fallback)
        userContactPositionId: 'userContactPositionId',
        customPosition: 'customPosition',
        faxCountryId: 'faxCountryId',
        faxNumber: 'faxNumber',
    }

    // Computed Properties
    const isSubmitting = computed(() => isSavingCompanyDetails.value)

    const canSubmit = computed(() => {
        return (
            form.name &&
            form.name.length >= 2 &&
            form.email &&
            form.email.includes('@') &&
            form.userContactPositionId &&
            form.phones?.length > 0 &&
            allPhonesValid.value &&
            !Object.values(errors).some((error) => error) &&
            !isSubmitting.value &&
            staticDataReady.value
        )
    })

    const allPhonesValid = computed(() => {
        return form.phones.every((phone, index) => {
            return (
                phone.phoneNumber &&
                phone.phoneNumber.trim().length > 0 &&
                phoneValidations.value[index] !== false
            )
        })
    })

    // Phone management functions
    const getPhoneLabel = (index: number): string => {
        if (index === 0) return t('contact.primaryPhone', 'Primary phone number')
        return t('contact.additionalPhone', `Additional phone number ${index + 1}`)
    }

    const getPhoneError = (index: number): string => {
        return phoneErrors.value[index] || ''
    }

    const addPhone = () => {
        if (form.phones.length < 5) {
            form.phones.push({ countryId: 373, phoneNumber: '', verified: false }) // Default to Moldova
            phoneValidations.value.push(false)
            phoneErrors.value.push('')
        }
    }

    const removePhone = (index: number) => {
        if (form.phones.length > 1) {
            form.phones.splice(index, 1)
            phoneValidations.value.splice(index, 1)
            phoneErrors.value.splice(index, 1)
            clearFieldError('phones')
        }
    }

    const handlePhoneInput = (index: number, value: string) => {
        // Clear phone-specific error when user types
        if (phoneErrors.value[index]) {
            phoneErrors.value[index] = ''
        }
        clearFieldError('phones')
    }

    const handlePhoneValidation = (index: number, isValid: boolean) => {
        phoneValidations.value[index] = isValid

        // Set phone-specific error message
        if (!isValid && form.phones[index].phoneNumber) {
            phoneErrors.value[index] = t(
                'validation.invalidPhoneFormat',
                'Invalid phone number format'
            )
        } else {
            phoneErrors.value[index] = ''
        }
    }
    const handleFaxCountryChange = (country: any) => {
        form.faxCountryId = country.value
    }
    const handleCountryChange = (index: number, country: any) => {
        if (country && country.value) {
            form.phones[index].countryId = country.value
        }
    }

    // Retry static data loading
    const retryStaticData = async () => {
        await refetchStaticData(true)
    }

    // Enhanced backend error mapping function - EXACTLY like detailed.vue
    const mapBackendErrorsToFields = (backendErrors: Record<string, string | string[]>) => {
        Object.entries(backendErrors).forEach(([backendField, messages]) => {
            const message = Array.isArray(messages) ? messages[0] : messages
            const frontendField = fieldMapping[backendField]

            if (frontendField && frontendField in errors) {
                errors[frontendField] = message as string
            }
        })
    }

    // Enhanced store error sync - EXACTLY like detailed.vue
    const syncStoreErrorsToFields = () => {
        const storeError = getError()
        const fieldErrors = getFieldErrors()

        // Priority 1: Check for field-specific errors from store
        if (hasFieldErrors() && fieldErrors) {
            mapBackendErrorsToFields(fieldErrors)
            return
        }

        // Priority 2: Check for 422 validation errors in store error
        if (storeError?.status === 422 && storeError.errors) {
            mapBackendErrorsToFields(storeError.errors)
            return
        }

        // Priority 3: Handle other error types with toasts
        if (storeError && !hasFieldErrors()) {
            const errorMessage =
                storeError.message ||
                t('error.generalSubmit', 'Failed to save contact details. Please try again.')
            toast.error(errorMessage, t('error', 'Error'))
        }
    }

    // Form validation - EXACTLY like detailed.vue
    const validateForm = (): boolean => {
        const validationResult = validateData('companyContacts', companyContactsSchema, form)

        if (!validationResult.isValid) {
            validationResult.errors.forEach((error) => {
                if (error.field in errors) {
                    errors[error.field as keyof typeof errors] = error.message
                }
            })
        }

        // Additional phone validation
        if (form.phones.length === 0) {
            errors.phones = t('validation.phoneRequired', 'At least one phone number is required')
            return false
        }

        // Check each phone individually
        let hasValidPhone = false
        form.phones.forEach((phone, index) => {
            if (phone.phoneNumber && phone.phoneNumber.trim().length > 0) {
                if (phoneValidations.value[index] !== false) {
                    hasValidPhone = true
                } else {
                    phoneErrors.value[index] = t(
                        'validation.invalidPhoneFormat',
                        'Invalid phone number format'
                    )
                }
            }
        })

        if (!hasValidPhone) {
            errors.phones = t(
                'validation.validPhoneRequired',
                'Please provide at least one valid phone number'
            )
            return false
        }

        return validationResult.isValid && hasValidPhone
    }

    // Clear field error on user input - EXACTLY like detailed.vue
    const clearFieldError = (field: keyof typeof errors) => {
        if (errors[field]) {
            errors[field] = ''
        }
        clearError()
        updateCompanyContactData()
    }

    const clearAllErrors = () => {
        Object.keys(errors).forEach((key) => {
            errors[key as keyof typeof errors] = ''
        })

        // Clear phone-specific errors
        phoneErrors.value = phoneErrors.value.map(() => '')

        clearError()
    }

    // Update store
    const updateCompanyContactData = () => {
        updateStepData('companyDetails', {
            section: 'contacts',
            data: { ...form },
        })
    }

    const handleSubmit = async () => {
        clearAllErrors()

        if (!validateForm()) {
            return
        }
        try {
            const formData = toRaw(form)

            // Prepare phones data for backend
            const phonesData = formData.phones
                .filter((phone) => phone.phoneNumber && phone.phoneNumber.trim().length > 0)
                .map((phone) => ({
                    country_id: phone.countryId,
                    phone_number: phone.phoneNumber,
                    verified: phone.verified || false,
                }))

            const payload = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                user_contact_position_id: formData.userContactPositionId,
                custom_position: formData.customPosition?.trim() || null,
                phones: phonesData,
                fax_country_id: formData.faxCountryId || null,
                fax_number: formData.faxNumber?.trim() || null,
            }

            // Use specific method for contact details (substep 5)
            const { success } = await completeCompanyContacts(payload)

            if (success) {
                toast.success(
                    t('register.contactDetailsSaved', 'Contact details saved successfully!'),
                    t('success', 'Success')
                )

                await router.push(localePath('/register/company-details/banks'))
            } else {
                syncStoreErrorsToFields()
            }
        } catch (error) {
            console.error('Submit error:', error)
            toast.error(
                t('error.generalSubmit', 'Failed to save contact details. Please try again.'),
                t('error', 'Error')
            )
        }
    }
    const handleGoBack = async () => {
        updateCompanyContactData()

        await router.push(localePath('/register/company-details/topics'))
    }

    const loadUserCompanyContactsData = async () => {
        try {
            const userCompanyContacts = await loadAndPopulateFieldRegistration('contacts')
            const hasContacts = userCompanyContacts && userCompanyContacts.length > 0

            if (hasContacts) {
                const contactData = userCompanyContacts[0]

                // Load basic contact info
                form.name = companyData?.contacts?.name || contactData.name || ''
                form.email = companyData?.contacts?.email || contactData.email || ''
                form.userContactPositionId =
                    companyData?.contacts?.userContactPositionId ||
                    contactData?.position?.id ||
                    null
                form.customPosition =
                    companyData?.contacts?.customPosition || contactData?.custom_position || ''
                form.faxCountryId =
                    companyData?.contacts?.faxCountryId || contactData?.fax_country_id || null
                form.faxNumber = companyData?.contacts?.faxNumber || contactData?.fax_number || ''

                // Fix phone loading - handle both store format and API format
                if (companyData?.contacts?.phones?.length > 0) {
                    // Load from store format
                    form.phones = companyData.contacts.phones.map((phone) => ({
                        countryId: phone.countryId || phone.country_id,
                        phoneNumber: phone.phoneNumber || phone.phone_number,
                        verified: phone.verified || false,
                    }))
                } else if (contactData?.phones?.length > 0) {
                    // Load from API format
                    form.phones = contactData.phones.map((phone) => ({
                        countryId: phone.country?.id || phone.country_id,
                        phoneNumber: phone.phone_number,
                        verified: phone.verified || false,
                    }))
                } else {
                    // Default phone
                    form.phones = [{ countryId: 373, phoneNumber: '', verified: false }]
                }

                // Initialize validation arrays
                phoneValidations.value = form.phones.map(() => true)
                phoneErrors.value = form.phones.map(() => '')
            }
        } catch (error) {
            console.error('[CompanyForm] Error loading user company data:', error)
        }
    }
    watch(
        () => [getError(), getFieldErrors(), hasFieldErrors()],
        ([newError, newFieldErrors, hasErrors]) => {
            if (newError || hasErrors) {
                syncStoreErrorsToFields()
            }
        },
        { immediate: true, deep: true }
    )

    // Watch form changes to update store - EXACTLY like detailed.vue
    watch(
        () => ({ ...form }),
        (newForm) => {
            updateStepData('companyDetails', {
                section: 'contact',
                data: newForm,
            })
        },
        { deep: true }
    )

    // Watch phones array length
    watch(
        () => form.phones.length,
        (newLength) => {
            // Ensure validation arrays match phones array length
            while (phoneValidations.value.length < newLength) {
                phoneValidations.value.push(false)
                phoneErrors.value.push('')
            }

            if (phoneValidations.value.length > newLength) {
                phoneValidations.value = phoneValidations.value.slice(0, newLength)
                phoneErrors.value = phoneErrors.value.slice(0, newLength)
            }
        },
        { immediate: true }
    )

    // Lifecycle - EXACTLY like detailed.vue
    onMounted(async () => {
        await loadUserCompanyContactsData()
        nextTick(() => {
            form.phones.forEach((phone, index) => {
                if (phone.phoneNumber && phone.phoneNumber.trim().length > 0) {
                    // Simulează validarea pentru numărul existent
                    handlePhoneValidation(index, true) // Presupunem că e valid dacă există
                }
            })
        })

        isLoading.value = false
        syncStoreErrorsToFields()
    })
</script>

<style scoped>
    .space-y-3 > * + * {
        margin-top: 0.75rem;
    }
</style>
