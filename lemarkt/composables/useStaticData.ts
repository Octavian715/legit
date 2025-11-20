import { computed } from 'vue'
import { useGlobalStore } from '@/stores/global'
import { useSelectOptions } from '@/composables/useSelectOptions'

export const useStaticData = () => {
    const globalStore = useGlobalStore()
    const {
        formatCountryOptions,
        formatCountryWithPhoneOptions,
        formatPhoneCodeOptions,
        formatBusinessTypeOptions,
        formatCurrencyOptions,
        formatContactPositionOptions,
        formatDocumentStatusOptions,
        formatDocumentPaymentStatusOptions,
    } = useSelectOptions()

    const continents = computed(() => globalStore.getContinents)
    const countries = computed(() => globalStore.getCountries)
    const businessTypes = computed(() => globalStore.getBusinessTypes)
    const currencies = computed(() => globalStore.getCurrencies)
    const languages = computed(() => globalStore.getLanguages)
    const contactPositions = computed(() => globalStore.getContactPositions)
    const employeeRanges = computed(() => globalStore.getEmployeeRanges)
    const revenueRanges = computed(() => globalStore.getRevenueRanges)
    const exportPercentages = computed(() => globalStore.getExportPercentages)
    const factorySizes = computed(() => globalStore.getFactorySizes)
    const userPlans = computed(() => globalStore.getUserPlans)
    const userRoles = computed(() => globalStore.getUserRoles)
    const categories = computed(() => globalStore.getCategories)
    const documentStatuses = computed(() => globalStore.getDocumentStatuses)
    const documentPaymentStatuses = computed(() => globalStore.getDocumentPaymentStatuses)

    const isLoading = computed(() => globalStore.isStaticDataLoading)
    const error = computed(() => globalStore.staticDataError)
    const isLoaded = computed(() => globalStore.isStaticDataLoaded)

    const countryOptions = computed(() => formatCountryOptions(countries.value))
    const countryWithPhoneOptions = computed(() => formatCountryWithPhoneOptions(countries.value))
    const phoneCodeOptions = computed(() => formatPhoneCodeOptions(countries.value))

    const businessTypeOptions = computed(() => formatBusinessTypeOptions(businessTypes.value))
    const currencyOptions = computed(() => formatCurrencyOptions(currencies.value))
    const contactPositionOptions = computed(() =>
        formatContactPositionOptions(contactPositions.value)
    )
    const documentStatusOptions = computed(() =>
        formatDocumentStatusOptions(documentStatuses.value)
    )
    const documentPaymentStatusOptions = computed(() =>
        formatDocumentPaymentStatusOptions(documentPaymentStatuses.value)
    )

    const continentOptions = computed(() =>
        continents.value.map((continent) => ({
            code: continent.code,
            label: continent.name,
            value: continent.id,
        }))
    )

    const categoriesOptions = computed(() =>
        categories.value.map((category) => ({
            code: category.slug,
            label: category.name,
            value: category.id,
        }))
    )

    const languageOptions = computed(() =>
        languages.value.map((language) => ({
            code: language.code,
            label: language.native_name,
            value: language.id,
        }))
    )

    const employeeRangeOptions = computed(() =>
        employeeRanges.value.map((range) => ({
            code: range.code,
            label: range.name,
            value: range.id,
        }))
    )

    const revenueRangeOptions = computed(() =>
        revenueRanges.value.map((range) => ({
            code: range.code,
            label: range.name,
            value: range.id,
        }))
    )

    const exportPercentageOptions = computed(() =>
        exportPercentages.value.map((percentage) => ({
            code: percentage.code,
            label: percentage.name,
            value: percentage.id,
        }))
    )

    const factorySizeOptions = computed(() =>
        factorySizes.value.map((size) => ({
            code: size.code,
            label: size.name,
            value: size.id,
        }))
    )

    const userPlanOptions = computed(() =>
        userPlans.value.map((plan) => ({
            code: plan.code,
            label: `${plan.name} - ${plan.price}€/${plan.billing_cycle}`,
            value: plan.id,
            price: plan.price,
            billingCycle: plan.billing_cycle,
            isActive: plan.is_active,
        }))
    )

    const activePlanOptions = computed(() => userPlanOptions.value.filter((plan) => plan.isActive))

    const userRoleOptions = computed(() =>
        userRoles.value.map((role) => ({
            code: role.code,
            label: role.name,
            value: role.id,
        }))
    )

    const findCountryByCode = (code: string) => globalStore.getCountryByCode(code)
    const findCountryByPhoneCode = (phoneCode: string) =>
        globalStore.getCountryByPhoneCode(phoneCode)
    const findStatesByCountryId = (countryId: number) => globalStore.getStatesByCountryId(countryId)
    const findCurrencyByCode = (code: string) => globalStore.getCurrencyByCode(code)
    const findLanguageByCode = (code: string) => globalStore.getLanguageByCode(code)
    const findBusinessTypeByCode = (code: string) => globalStore.getBusinessTypeByCode(code)
    const findUserRoleByCode = (code: string) => globalStore.getUserRoleByCode(code)
    const findDocumentStatusByCode = (code: string) => globalStore.getDocumentStatusByCode(code)
    const findDocumentPaymentStatusByCode = (code: string) =>
        globalStore.getDocumentPaymentStatusByCode(code)

    const getStateOptionsByCountryId = (countryId: number) => {
        const states = findStatesByCountryId(countryId)
        return states.map((state) => ({
            code: state.code,
            label: state.name,
            value: state.id,
        }))
    }

    const getStateOptionsByCountryCode = (countryCode: string) => {
        const country = findCountryByCode(countryCode)
        if (!country) return []

        return country.states.map((state) => ({
            code: state.code,
            label: state.name,
            value: state.id,
        }))
    }

    const refetch = async (forceRefresh = false) => {
        await globalStore.fetchStaticData(forceRefresh)
    }

    const isExpired = computed(() => globalStore.isStaticDataExpired())
    const lastFetchedAt = computed(() => globalStore.staticDataFetchedAt)

    const initialize = async () => {
        if (!globalStore.isStaticDataLoaded || globalStore.isStaticDataExpired()) {
            await globalStore.fetchStaticData()
        }
    }

    return {
        continents,
        countries,
        businessTypes,
        currencies,
        languages,
        contactPositions,
        employeeRanges,
        revenueRanges,
        exportPercentages,
        factorySizes,
        userPlans,
        userRoles,
        categories,
        documentStatuses,
        documentPaymentStatuses,

        isLoading,
        error,
        isLoaded,

        findCountryByCode,
        findCountryByPhoneCode,
        findStatesByCountryId,
        findCurrencyByCode,
        findLanguageByCode,
        findBusinessTypeByCode,
        findUserRoleByCode,
        findDocumentStatusByCode,
        findDocumentPaymentStatusByCode,

        countryOptions,
        countryWithPhoneOptions,
        phoneCodeOptions,
        businessTypeOptions,
        currencyOptions,
        contactPositionOptions,
        continentOptions,
        categoriesOptions,
        languageOptions,
        employeeRangeOptions,
        revenueRangeOptions,
        exportPercentageOptions,
        factorySizeOptions,
        userPlanOptions,
        activePlanOptions,
        userRoleOptions,
        documentStatusOptions,
        documentPaymentStatusOptions,

        getStateOptionsByCountryId,
        getStateOptionsByCountryCode,

        refetch,
        initialize,
        isExpired,
        lastFetchedAt,
    }
}
