// composables/useCompanyDetailsForm.ts
import { ref, reactive, computed } from 'vue'
import type {
    CompanyDetailsFormData,
    PhoneNumber,
} from '~/utils/validator/schemas/user/companyDetailsValidator'
import { useUserStore } from '~/stores/user'
import { useStaticData } from '~/composables/useStaticData'

/**
 * Transform API response (snake_case) to form data (camelCase)
 */
export const transformApiToFormData = (apiData: any): Partial<CompanyDetailsFormData> => {
    if (!apiData) return {}

    const companyDetails = apiData.company_details || {}
    const contacts = apiData.contacts?.[0] || {}

    // Transform phones from API format to form format
    const transformedPhones: PhoneNumber[] = contacts.phones?.map((phone: any) => ({
        countryId: phone.country?.id || phone.country_id,
        phoneNumber: phone.phone_number || '',
        verified: phone.verified || false,
    })) || [{ countryId: 373, phoneNumber: '', verified: false }]

    return {
        // Company Information
        legalName: companyDetails.legal_name || '',
        businessTypeId: companyDetails.business_type?.id || null,
        registrationNumber: companyDetails.registration_number || '',
        vatNumber: companyDetails.vat_number || '',
        yearOfRegistration: companyDetails.registration_year || null,
        spokenLanguageIds: apiData.spoken_languages?.map((lang: any) => lang.id) || [],
        annualRevenueId: companyDetails.revenue_range?.id || null,
        numberOfEmployeesId: companyDetails.employee_count_range?.id || null,
        websiteUrl: companyDetails.website_url || '',

        // Location
        countryId: companyDetails.country?.id || null,
        stateName: companyDetails.state_name || '',
        cityName: companyDetails.city_name || '',
        streetName: companyDetails.street_name || '',
        streetNumber: companyDetails.street_number || '',
        postalCode: companyDetails.postal_code || '',

        // Categories
        categoryIds: apiData.interesting_categories?.map((cat: any) => cat.id) || [],

        // Contact Details
        contactPersonName: contacts.name || '',
        contactEmail: contacts.email || '',
        userContactPositionId: contacts.position?.id || null,
        customPosition: contacts.custom_position || '',

        // Phone Numbers
        phones: transformedPhones,
        faxCountryId: contacts.fax_country?.id || null,
        faxNumber: contacts.fax_number || '',
    }
}

/**
 * Transform form data (camelCase) to API payload (snake_case)
 */
export const transformFormDataToApi = (formData: CompanyDetailsFormData) => {
    // Filter and transform phones
    const transformedPhones = formData.phones
        .filter((phone) => phone.phoneNumber && phone.phoneNumber.trim().length > 0)
        .map((phone) => ({
            country_id: phone.countryId,
            phone_number: phone.phoneNumber,
            verified: phone.verified || false,
        }))

    return {
        default_currency_id: null,
        default_local_currency_id: null,
        default_export_currency_id: null,
        company_details: {
            legal_name: formData.legalName.trim(),
            business_type_id: formData.businessTypeId,
            registration_number: formData.registrationNumber.trim(),
            vat_number: formData.vatNumber.trim(),
            registration_year: formData.yearOfRegistration,
            spoken_languages: formData.spokenLanguageIds,
            revenue_range_id: formData.annualRevenueId,
            employee_count_range_id: formData.numberOfEmployeesId,
            website_url: formData.websiteUrl?.trim() || null,
            country_id: formData.countryId,
            state_name: formData.stateName?.trim() || null,
            city_name: formData.cityName.trim(),
            street_name: formData.streetName.trim(),
            street_number: formData.streetNumber.trim(),
            postal_code: formData.postalCode.trim(),
            interesting_categories: formData.categoryIds,
            contact_details: {
                name: formData.contactPersonName.trim(),
                email: formData.contactEmail.trim(),
                user_contact_position_id: formData.userContactPositionId,
                custom_position: formData.customPosition?.trim() || null,
                phones: transformedPhones,
                fax_country_id: formData.faxCountryId || null,
                fax_number: formData.faxNumber?.trim() || null,
            },
        },
    }
}

/**
 * Composable for managing company details form
 */
export const useCompanyDetailsForm = () => {
    const userStore = useUserStore()
    const { countries, isLoaded: staticDataLoaded } = useStaticData()

    const isLoading = ref(false)
    const isSaving = ref(false)
    const hasUnsavedChanges = ref(false)

    // Form data with proper TypeScript typing
    const formData = reactive<CompanyDetailsFormData>({
        // Company Information
        legalName: '',
        businessTypeId: null,
        registrationNumber: '',
        vatNumber: '',
        yearOfRegistration: null,
        spokenLanguageIds: [],
        annualRevenueId: null,
        numberOfEmployeesId: null,
        websiteUrl: '',

        // Location
        countryId: null,
        stateName: '',
        cityName: '',
        streetName: '',
        streetNumber: '',
        postalCode: '',

        // Categories
        categoryIds: [],

        // Contact Details
        contactPersonName: '',
        contactEmail: '',
        userContactPositionId: null,
        customPosition: '',

        // Phone Numbers
        phones: [{ countryId: 373, phoneNumber: '', verified: false }],
        faxCountryId: null,
        faxNumber: '',
    })

    // Original data for comparison
    const originalData = ref<CompanyDetailsFormData | null>(null)

    // Phone-specific state
    const phoneValidations = ref<boolean[]>([false])
    const phoneErrors = ref<string[]>([''])

    /**
     * Load user data and populate form
     */
    const loadUserData = async () => {
        isLoading.value = true

        try {
            const userData = userStore.user

            if (userData) {
                const transformed = transformApiToFormData(userData)

                // Update form data
                Object.assign(formData, transformed)

                // Store original data for comparison
                originalData.value = JSON.parse(JSON.stringify(formData))

                // Initialize phone validation arrays
                phoneValidations.value = formData.phones.map(() => false)
                phoneErrors.value = formData.phones.map(() => '')
            }
        } catch (error) {
            console.error('[useCompanyDetailsForm] Error loading user data:', error)
            throw error
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Save company details
     */
    const saveCompanyDetails = async () => {
        isSaving.value = true

        try {
            const payload = transformFormDataToApi(formData)

            await userStore.updateProfile(payload)

            // Update original data after successful save
            originalData.value = JSON.parse(JSON.stringify(formData))
            hasUnsavedChanges.value = false

            return { success: true }
        } catch (error: any) {
            console.error('[useCompanyDetailsForm] Error saving:', error)
            return {
                success: false,
                error: error.message || 'Failed to save company details',
            }
        } finally {
            isSaving.value = false
        }
    }

    /**
     * Reset form to original data
     */
    const resetForm = () => {
        if (originalData.value) {
            Object.assign(formData, JSON.parse(JSON.stringify(originalData.value)))
            hasUnsavedChanges.value = false
        }
    }

    /**
     * Check if form has unsaved changes
     */
    const checkForChanges = () => {
        if (!originalData.value) {
            hasUnsavedChanges.value = false
            return
        }

        const current = JSON.stringify(formData)
        const original = JSON.stringify(originalData.value)

        hasUnsavedChanges.value = current !== original
    }

    /**
     * Add a new phone number
     */
    const addPhone = () => {
        if (formData.phones.length < 5) {
            formData.phones.push({ countryId: 373, phoneNumber: '', verified: false })
            phoneValidations.value.push(false)
            phoneErrors.value.push('')
            checkForChanges()
        }
    }

    /**
     * Remove a phone number
     */
    const removePhone = (index: number) => {
        if (formData.phones.length > 1) {
            formData.phones.splice(index, 1)
            phoneValidations.value.splice(index, 1)
            phoneErrors.value.splice(index, 1)
            checkForChanges()
        }
    }

    /**
     * Handle phone validation
     */
    const handlePhoneValidation = (index: number, isValid: boolean) => {
        phoneValidations.value[index] = isValid
        checkForChanges()
    }

    /**
     * Handle phone country change
     */
    const handlePhoneCountryChange = (index: number, country: any) => {
        if (country && country.value) {
            formData.phones[index].countryId = country.value
            checkForChanges()
        }
    }

    /**
     * Get phone error message
     */
    const getPhoneError = (index: number): string => {
        return phoneErrors.value[index] || ''
    }

    /**
     * Check if all phones are valid
     */
    const areAllPhonesValid = computed(() => {
        const filledPhones = formData.phones.filter(
            (phone) => phone.phoneNumber && phone.phoneNumber.trim().length > 0
        )

        if (filledPhones.length === 0) return false

        return filledPhones.every((_, index) => phoneValidations.value[index])
    })

    /**
     * Check if form can be submitted
     */
    const canSubmit = computed(() => {
        return (
            !isSaving.value &&
            formData.legalName.trim().length > 0 &&
            formData.businessTypeId !== null &&
            formData.registrationNumber.trim().length > 0 &&
            formData.vatNumber.trim().length > 0 &&
            formData.countryId !== null &&
            formData.cityName.trim().length > 0 &&
            formData.streetName.trim().length > 0 &&
            formData.streetNumber.trim().length > 0 &&
            formData.postalCode.trim().length > 0 &&
            formData.categoryIds.length > 0 &&
            formData.contactPersonName.trim().length > 0 &&
            formData.contactEmail.trim().length > 0 &&
            formData.userContactPositionId !== null &&
            areAllPhonesValid.value
        )
    })

    return {
        // State
        formData,
        isLoading,
        isSaving,
        hasUnsavedChanges,
        phoneValidations,
        phoneErrors,

        // Computed
        canSubmit,
        areAllPhonesValid,

        // Methods
        loadUserData,
        saveCompanyDetails,
        resetForm,
        checkForChanges,
        addPhone,
        removePhone,
        handlePhoneValidation,
        handlePhoneCountryChange,
        getPhoneError,
    }
}
