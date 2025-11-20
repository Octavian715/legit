<!-- components/features/ecommerce/settings/tabs/CompanyDetailsTab.vue -->
<template>
    <div class="company-details-tab">
        <!-- Loading State -->
        <div v-if="isLoading || !staticDataLoaded" class="flex justify-center items-center p-8">
            <span class="loader"></span>
            <span v-if="!staticDataLoaded" class="ml-3 text-gray-600">
                {{ $t('loading.staticData', 'Loading options...') }}
            </span>
        </div>

        <!-- Form -->
        <form v-else class="space-y-3" novalidate @submit.prevent="handleSubmit">
            <!-- Company Information Section -->
            <div class="grid gap-3">
                <h2 class="text-subtitle3 text-gray-800">
                    {{ $t('companyDetails.companyInformation', 'Company Information') }}
                </h2>

                <!-- Legal Name -->
                <Input
                    v-model="formData.legalName"
                    :label="$t('companyDetails.legalName', 'Legal Name')"
                    name="legalName"
                    background="bg-white"
                    :error="!!errors.legalName"
                    :error-message="errors.legalName"
                    required
                    @input="handleFieldChange('legalName')"
                />

                <!-- Business Type -->
                <Select
                    v-model="formData.businessTypeId"
                    :label="$t('companyDetails.businessType', 'Business Type')"
                    name="businessType"
                    background="bg-white"
                    :error="!!errors.businessTypeId"
                    :error-message="errors.businessTypeId"
                    :options="businessTypeOptions"
                    required
                    size="lg"
                    @update:model-value="handleFieldChange('businessTypeId')"
                />

                <!-- Registration Number & VAT Number -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        v-model="formData.registrationNumber"
                        :label="$t('companyDetails.registrationNumber', 'Registration Number')"
                        name="registrationNumber"
                        background="bg-white"
                        :error="!!errors.registrationNumber"
                        :error-message="errors.registrationNumber"
                        required
                        @input="handleFieldChange('registrationNumber')"
                    />

                    <Input
                        v-model="formData.vatNumber"
                        :label="$t('companyDetails.vatNumber', 'VAT Number')"
                        name="vatNumber"
                        background="bg-white"
                        :error="!!errors.vatNumber"
                        :error-message="errors.vatNumber"
                        required
                        @input="handleFieldChange('vatNumber')"
                    />
                </div>

                <!-- Year of Registration -->
                <Input
                    v-model.number="formData.yearOfRegistration"
                    :label="$t('companyDetails.yearOfRegistration', 'Year of Registration')"
                    name="yearOfRegistration"
                    type="number"
                    background="bg-white"
                    :error="!!errors.yearOfRegistration"
                    :error-message="errors.yearOfRegistration"
                    :min="1900"
                    :max="currentYear"
                    @input="handleFieldChange('yearOfRegistration')"
                />

                <!-- Spoken Languages -->
                <MultiSelect
                    v-model="formData.spokenLanguageIds"
                    :label="$t('companyDetails.spokenLanguages', 'Spoken Languages')"
                    name="spokenLanguages"
                    background="bg-white"
                    :options="languageOptions"
                    :error="!!errors.spokenLanguageIds"
                    :error-message="errors.spokenLanguageIds"
                    size="lg"
                    :placeholder="$t('companyDetails.selectLanguages', 'Select languages...')"
                    @update:model-value="handleFieldChange('spokenLanguageIds')"
                />

                <!-- Annual Revenue & Number of Employees -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        v-model="formData.annualRevenueId"
                        :label="$t('companyDetails.annualRevenue', 'Annual Revenue')"
                        name="annualRevenue"
                        background="bg-white"
                        :options="revenueRangeOptions"
                        :error="!!errors.annualRevenueId"
                        :error-message="errors.annualRevenueId"
                        size="lg"
                        @update:model-value="handleFieldChange('annualRevenueId')"
                    />

                    <Select
                        v-model="formData.numberOfEmployeesId"
                        :label="$t('companyDetails.numberOfEmployees', 'Number of Employees')"
                        name="numberOfEmployees"
                        background="bg-white"
                        :options="employeeRangeOptions"
                        :error="!!errors.numberOfEmployeesId"
                        :error-message="errors.numberOfEmployeesId"
                        size="lg"
                        @update:model-value="handleFieldChange('numberOfEmployeesId')"
                    />
                </div>

                <!-- Website URL -->
                <Input
                    v-model="formData.websiteUrl"
                    :label="$t('companyDetails.websiteUrl', 'Website URL')"
                    name="websiteUrl"
                    type="url"
                    background="bg-white"
                    :error="!!errors.websiteUrl"
                    :error-message="errors.websiteUrl"
                    placeholder="https://example.com"
                    @input="handleFieldChange('websiteUrl')"
                />
            </div>

            <!-- Location Section -->
            <div class="grid gap-3">
                <h2 class="text-subtitle3 text-gray-800">
                    {{ $t('companyDetails.location', 'Location') }}
                </h2>

                <!-- Country -->
                <Select
                    v-model="formData.countryId"
                    :label="$t('companyDetails.country', 'Country')"
                    name="country"
                    background="bg-white"
                    :options="countryOptions"
                    :error="!!errors.countryId"
                    :error-message="errors.countryId"
                    required
                    size="lg"
                    @update:model-value="handleFieldChange('countryId')"
                />

                <!-- State (Optional) -->
                <Input
                    v-model="formData.stateName"
                    :label="$t('companyDetails.state', 'State/Province')"
                    name="stateName"
                    background="bg-white"
                    :error="!!errors.stateName"
                    :error-message="errors.stateName"
                    @input="handleFieldChange('stateName')"
                />

                <!-- City -->
                <Input
                    v-model="formData.cityName"
                    :label="$t('companyDetails.city', 'City')"
                    name="cityName"
                    background="bg-white"
                    :error="!!errors.cityName"
                    :error-message="errors.cityName"
                    required
                    @input="handleFieldChange('cityName')"
                />

                <!-- Street Name & Street Number -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="md:col-span-2">
                        <Input
                            v-model="formData.streetName"
                            :label="$t('companyDetails.streetName', 'Street Name')"
                            name="streetName"
                            background="bg-white"
                            :error="!!errors.streetName"
                            :error-message="errors.streetName"
                            required
                            @input="handleFieldChange('streetName')"
                        />
                    </div>

                    <Input
                        v-model="formData.streetNumber"
                        :label="$t('companyDetails.streetNumber', 'Street Number')"
                        name="streetNumber"
                        background="bg-white"
                        :error="!!errors.streetNumber"
                        :error-message="errors.streetNumber"
                        required
                        @input="handleFieldChange('streetNumber')"
                    />
                </div>

                <!-- Postal Code -->
                <Input
                    v-model="formData.postalCode"
                    :label="$t('companyDetails.postalCode', 'Postal Code')"
                    name="postalCode"
                    background="bg-white"
                    :error="!!errors.postalCode"
                    :error-message="errors.postalCode"
                    required
                    @input="handleFieldChange('postalCode')"
                />
            </div>

            <!-- Categories Section -->
            <div v-if="!isLoading && staticDataLoaded" class="grid p-6 space-y-3">
                <h3 class="text-subtitle2 font-semibold text-gray-950">
                    {{ $t('companyDetails.categories', 'Categories/Topics') }}
                </h3>

                <p class="text-subtitle3 text-gray-800">
                    {{
                        $t(
                            'company.intrestingCategoriesInteres',
                            {
                                count: formData.categoryIds.length,
                                total: categoriesOptions.length,
                            },
                            'Categories which i am interested:'
                        )
                    }}
                </p>

                <!-- Categories Grid with Checkboxes -->
                <div class="flex flex-wrap gap-2">
                    <div
                        v-for="category in categoriesOptions"
                        :key="`cat-${category.value}-${formData.categoryIds.includes(category.value)}`"
                        class="flex items-center"
                    >
                        <Checkbox
                            :model-value="formData.categoryIds.includes(category.value)"
                            :label="category.label"
                            :name="`category-${category.value}`"
                            size="md"
                            class="rounded-sm p-1 pr-1.5"
                            :class="{
                                'bg-blue-100': formData.categoryIds.includes(category.value),
                                'bg-gray-400': !formData.categoryIds.includes(category.value),
                            }"
                            checked-label-color="text-blue-600"
                            @update:model-value="toggleCategory(category.value)"
                        />
                    </div>
                </div>

                <!-- Error Display -->
                <div v-if="errors.categoryIds" class="text-center">
                    <p class="text-caption1 text-red-500" role="alert">
                        {{ errors.categoryIds }}
                    </p>
                </div>
            </div>

            <!-- Contact Details Section -->
            <div class="grid gap-3">
                <h2 class="text-subtitle3 text-gray-800">
                    {{ $t('companyDetails.contactDetails', 'Contact Details') }}
                </h2>

                <!-- Contact Person Name -->
                <Input
                    v-model="formData.contactPersonName"
                    :label="$t('companyDetails.contactPersonName', 'Contact Person Name')"
                    name="contactPersonName"
                    background="bg-white"
                    :error="!!errors.contactPersonName"
                    :error-message="errors.contactPersonName"
                    required
                    @input="handleFieldChange('contactPersonName')"
                />

                <!-- Contact Email -->
                <Input
                    v-model="formData.contactEmail"
                    :label="$t('companyDetails.contactEmail', 'Contact Email')"
                    name="contactEmail"
                    type="email"
                    background="bg-white"
                    :error="!!errors.contactEmail"
                    :error-message="errors.contactEmail"
                    required
                    @input="handleFieldChange('contactEmail')"
                />

                <!-- Position -->
                <Select
                    v-model="formData.userContactPositionId"
                    :label="$t('companyDetails.position', 'Position')"
                    name="position"
                    background="bg-white"
                    :options="contactPositionOptions"
                    :error="!!errors.userContactPositionId"
                    :error-message="errors.userContactPositionId"
                    required
                    size="lg"
                    :placeholder="$t('companyDetails.selectPosition', 'Select position...')"
                    @update:model-value="handleFieldChange('userContactPositionId')"
                />

                <!-- Custom Position (if "Other" is selected) -->
                <Input
                    v-if="formData.userContactPositionId === 16"
                    v-model="formData.customPosition"
                    :label="$t('companyDetails.customPosition', 'Custom Position')"
                    name="customPosition"
                    background="bg-white"
                    :error="!!errors.customPosition"
                    :error-message="errors.customPosition"
                    @input="handleFieldChange('customPosition')"
                />

                <!-- Phone Numbers -->
                <div class="space-y-3">
                    <label class="block text-subtitle3 font-medium text-gray-950">
                        {{ $t('companyDetails.phoneNumbers', 'Phone Numbers') }}
                        <span class="text-red-600">*</span>
                    </label>

                    <div
                        v-for="(phone, index) in formData.phones"
                        :key="index"
                        class="flex gap-2 items-start"
                    >
                        <PhoneInput
                            v-model="phone.phoneNumber"
                            :name="`phone-${index}`"
                            background="bg-white"
                            size="lg"
                            class="flex-1"
                            :country-code="getCountryCodeById(phone.countryId)"
                            :error="getPhoneError(index)"
                            :placeholder="
                                $t('companyDetails.enterPhoneNumber', 'Enter phone number')
                            "
                            @input="handlePhoneInput(index)"
                            @update:is-valid="handlePhoneValidation(index, $event)"
                            @update:selected-country="handlePhoneCountryChange(index, $event)"
                        />

                        <ButtonClose
                            v-if="formData.phones.length > 1"
                            size="md"
                            icon-size="md"
                            :label="$t('remove')"
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
                        v-if="formData.phones.length < 5"
                        class="py-2"
                        :label="$t('companyDetails.addPhone', 'Add phone number')"
                        @click="addPhone"
                    />
                </div>

                <!-- Fax Number -->
                <PhoneInput
                    v-model="formData.faxNumber"
                    :label="$t('companyDetails.faxNumber', 'Fax Number (Optional)')"
                    name="fax"
                    background="bg-white"
                    size="lg"
                    :country-code="getCountryCodeById(formData.faxCountryId)"
                    :error="errors.faxNumber"
                    @input="handleFieldChange('faxNumber')"
                    @update:selected-country="handleFaxCountryChange"
                />
            </div>

            <!-- Hidden Submit Button (triggered by parent) -->
            <button ref="submitButtonRef" type="submit" class="hidden">Submit</button>
        </form>
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useCompanyDetailsForm } from '~/composables/useCompanyDetailsForm'
    import { useStaticData } from '~/composables/useStaticData'
    import {
        validateCompanyDetails,
        transformValidationErrors,
    } from '~/utils/validator/schemas/user/companyDetailsValidator'
    import { useToastNotification } from '~/composables/useToastNotification'

    const { t } = useI18n()
    const toast = useToastNotification()

    // Component mounted state
    const isMounted = ref(false)

    // Static data - use directly from useStaticData with correct names
    const {
        countries,
        // Pre-formatted options (already computed!)
        businessTypeOptions,
        languageOptions, // ✅ Already formatted!
        revenueRangeOptions, // ✅ Already formatted!
        employeeRangeOptions, // ✅ Already formatted!
        categoriesOptions, // ✅ Already formatted!
        contactPositionOptions, // ✅ Already formatted!
        countryOptions, // ✅ Already formatted!
        isLoaded: staticDataLoaded,
    } = useStaticData()

    const {
        formData,
        isLoading,
        isSaving,
        hasUnsavedChanges,
        canSubmit,
        loadUserData,
        saveCompanyDetails,
        resetForm,
        checkForChanges,
        addPhone,
        removePhone,
        handlePhoneValidation,
        handlePhoneCountryChange: handlePhoneCountryChangeComposable,
        getPhoneError,
    } = useCompanyDetailsForm()

    const submitButtonRef = ref<HTMLButtonElement>()
    const currentYear = new Date().getFullYear()

    // Validation errors
    const errors = reactive<Record<string, string>>({
        legalName: '',
        businessTypeId: '',
        registrationNumber: '',
        vatNumber: '',
        yearOfRegistration: '',
        spokenLanguageIds: '',
        annualRevenueId: '',
        numberOfEmployeesId: '',
        websiteUrl: '',
        countryId: '',
        stateName: '',
        cityName: '',
        streetName: '',
        streetNumber: '',
        postalCode: '',
        categoryIds: '',
        contactPersonName: '',
        contactEmail: '',
        userContactPositionId: '',
        customPosition: '',
        phones: '',
        faxNumber: '',
    })

    /**
     * Get country code by country ID
     */
    const getCountryCodeById = (countryId: number | null): string => {
        if (!countryId || !countries.value.length) return 'MD'
        const country = countries.value.find((c) => c.id === countryId)
        return country?.code || 'MD'
    }

    /**
     * Handle field change
     */
    const handleFieldChange = (field: string) => {
        if (errors[field]) {
            errors[field] = ''
        }
        checkForChanges()
    }

    /**
     * Handle phone input
     */
    const handlePhoneInput = (index: number) => {
        if (errors[`phones.${index}`]) {
            errors[`phones.${index}`] = ''
        }
        if (errors.phones) {
            errors.phones = ''
        }
        checkForChanges()
    }

    /**
     * Handle phone country change from composable
     */
    const handlePhoneCountryChange = (index: number, country: any) => {
        handlePhoneCountryChangeComposable(index, country)
        handleFieldChange('phones')
    }

    /**
     * Handle fax country change
     */
    const handleFaxCountryChange = (country: any) => {
        if (country && country.value) {
            formData.faxCountryId = country.value
            handleFieldChange('faxCountryId')
        }
    }

    /**
     * Toggle category selection
     */
    const toggleCategory = (categoryId: number) => {
        const index = formData.categoryIds.indexOf(categoryId)
        if (index > -1) {
            // Remove category
            formData.categoryIds.splice(index, 1)
        } else {
            // Add category
            formData.categoryIds.push(categoryId)
        }
        handleFieldChange('categoryIds')
    }

    /**
     * Clear all errors
     */
    const clearAllErrors = () => {
        Object.keys(errors).forEach((key) => {
            errors[key] = ''
        })
    }

    /**
     * Validate form
     */
    const validateForm = () => {
        clearAllErrors()

        const validationResult = validateCompanyDetails(formData)

        if (!validationResult.isValid) {
            console.log('inside')

            // Map validation errors to form errors
            const errorMap = transformValidationErrors(validationResult.errors)
            Object.assign(errors, errorMap)

            toast.error(
                t('validation.pleaseFixErrors', 'Please fix the validation errors'),
                t('error', 'Error')
            )

            return { isValid: false, errors }
        }

        return { isValid: true, errors }
    }

    /**
     * Handle form submit
     */
    const handleSubmit = async () => {
        if (!isMounted.value) {
            console.warn('[CompanyDetailsTab] Cannot submit - component not mounted')
            return
        }

        if (!validateForm().isValid) {
            return
        }

        const result = await saveCompanyDetails()

        if (result.success) {
            toast.success(
                t('companyDetails.savedSuccessfully', 'Company details saved successfully'),
                t('success', 'Success')
            )
        } else {
            toast.error(
                result.error || t('error.saveFailed', 'Failed to save changes'),
                t('error', 'Error')
            )
        }
    }

    /**
     * Public method for parent to trigger save
     * Returns boolean indicating save success
     */
    const save = async (): Promise<boolean> => {
        if (!isMounted.value) {
            console.warn('[CompanyDetailsTab] Cannot save - component not mounted')
            return false
        }

        // Validate form first
        const validation = validateForm()
        if (!validation.isValid) {
            return false
        }

        // Save and return the result
        const result = await saveCompanyDetails()
        return result.success
    }

    /**
     * Public method for parent to reset form
     */
    const reset = () => {
        resetForm()
        clearAllErrors()
    }

    /**
     * Public method to check for unsaved changes
     */
    const getHasUnsavedChanges = () => {
        return hasUnsavedChanges.value
    }

    /**
     * Public method for parent to validate form
     */
    const validate = () => {
        return validateForm()
    }

    // Expose methods for parent component
    defineExpose({
        save,
        reset,
        validate,
        getHasUnsavedChanges,
    })

    // Watch for changes (only when mounted)
    watch(
        () => ({ ...formData }),
        () => {
            if (isMounted.value) {
                checkForChanges()
            }
        },
        { deep: true }
    )

    // Lifecycle
    onMounted(async () => {
        try {
            await nextTick() // Wait for DOM to be ready
            isMounted.value = true

            // Wait for static data to load
            if (!staticDataLoaded.value) {
                // Wait max 5 seconds for static data
                let attempts = 0
                while (!staticDataLoaded.value && attempts < 50) {
                    await new Promise((resolve) => setTimeout(resolve, 100))
                    attempts++
                }

                if (!staticDataLoaded.value) {
                    console.warn('[CompanyDetailsTab] Static data not loaded after 5s')
                }
            }

            await loadUserData()

            // Wait a tick to ensure reactive updates
            await nextTick()
        } catch (error) {
            console.error('[CompanyDetailsTab] Error loading data:', error)
            toast.error(
                t('error.loadingFailed', 'Failed to load company details'),
                t('error', 'Error')
            )
        }
    })

    onBeforeUnmount(() => {
        isMounted.value = false
    })
</script>

<style scoped>
    .company-details-tab {
        @apply mb-20;
    }
</style>
