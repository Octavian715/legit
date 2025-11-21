import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRegistrationStore } from '~/stores/register'
import { useUserStore } from '~/stores/user'
import { useLocalePath } from '#imports'
import { storeToRefs } from 'pinia'

interface AccountTypeCookieData {
    id: number
    type: 'supplier' | 'buyer' | 'serviceProvider'
    label?: string
    referralCode?: string
    timestamp?: string
}

export const useRegistrationNavigation = () => {
    const store = useRegistrationStore()
    const userStore = useUserStore()
    const router = useRouter()
    const localePath = useLocalePath()
    const { user } = storeToRefs(userStore)

    const accountTypeCookie = useCookie<AccountTypeCookieData | null>('account_type', {
        default: () => null,
        maxAge: 60 * 60 * 24 * 30,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        httpOnly: false,
        serializer: {
            read: (value: string) => {
                try {
                    const parsed = JSON.parse(value)

                    if (typeof parsed === 'number') {
                        return {
                            id: parsed,
                            type: parsed === 1 ? 'supplier' : 'buyer',
                            timestamp: new Date().toISOString(),
                        }
                    }

                    if (parsed && typeof parsed === 'object' && parsed.id) {
                        return {
                            ...parsed,
                            timestamp: parsed.timestamp || new Date().toISOString(),
                        }
                    }

                    return null
                } catch (error) {
                    return null
                }
            },
            write: (value: AccountTypeCookieData | null) => {
                if (!value) return 'null'

                const cookieData = {
                    ...value,
                    timestamp: value.timestamp || new Date().toISOString(),
                }
                return JSON.stringify(cookieData)
            },
        },
    })

    const saveAccountType = (accountTypeData: AccountTypeCookieData): void => {
        store.updateFormData('accountType', accountTypeData)
        accountTypeCookie.value = accountTypeData
    }

    const getAccountType = (): AccountTypeCookieData => {
        const storeAccountType = store.formData.accountType
        if (storeAccountType?.id) {
            return {
                ...storeAccountType,
                id:
                    typeof storeAccountType.id === 'string'
                        ? parseInt(storeAccountType.id, 10)
                        : storeAccountType.id,
            }
        }

        const cookieValue = accountTypeCookie.value
        if (cookieValue?.id) {
            const normalizedData = {
                ...cookieValue,
                id:
                    typeof cookieValue.id === 'string'
                        ? parseInt(cookieValue.id, 10)
                        : cookieValue.id,
            }

            store.updateFormData('accountType', normalizedData)
            return normalizedData
        }

        if (userStore.primaryRole?.id) {
            const userRoleData = {
                id:
                    typeof userStore.primaryRole.id === 'string'
                        ? parseInt(userStore.primaryRole.id, 10)
                        : userStore.primaryRole.id,
                type: (userStore.primaryRole.name?.toLowerCase() || 'supplier') as any,
                timestamp: new Date().toISOString(),
            }

            saveAccountType(userRoleData)

            return userRoleData
        }

        const defaultAccountType = {
            id: 1,
            type: 'supplier' as const,
            timestamp: new Date().toISOString(),
        }
        saveAccountType(defaultAccountType)

        return defaultAccountType
    }

    const clearAccountTypeCookie = (): void => {
        accountTypeCookie.value = null

        const referralCodeCookie = useCookie('referral_code')
        if (referralCodeCookie.value) {
            referralCodeCookie.value = null
        }
    }

    const currentStep = computed(() => store.currentStep)
    const availableSteps = computed(() => store.availableSteps)
    const currentStepIndex = computed(() => store.currentStepIndex)
    const canGoBack = computed(() => store.canGoBack)
    const canGoForward = computed(() => store.canGoForward)
    const isFirstStep = computed(() => store.isFirstStep)
    const isLastStep = computed(() => store.isLastStep)
    const progress = computed(() => store.progress)
    const completedSteps = computed(() => store.completedSteps)
    const formData = computed(() => store.formData)

    const isSubmitting = computed(() => store.isSubmitting)
    const isLoading = computed(() => store.isLoading)
    const loadingStates = computed(() => store.loadingStates)

    const isSavingAccountType = computed(() => store.loadingStates.savingAccountType)
    const isSavingPersonalInfo = computed(() => store.loadingStates.savingPersonalInfo)
    const isSavingCompanyDetails = computed(() => store.loadingStates.savingCompanyDetails)
    const isSavingFactoryDetails = computed(() => store.loadingStates.savingFactoryDetails)
    const isSavingProductionDetails = computed(() => store.loadingStates.savingFactoryDetails)
    const isSavingExportDetails = computed(() => store.loadingStates.savingExportDetails)
    const isSavingCompanyCertificates = computed(
        () => store.loadingStates.savingCompanyCertificates
    )
    const isSavingGeneralCertificates = computed(
        () => store.loadingStates.savingGeneralCertificates
    )
    const isSavingPublicProfile = computed(() => store.loadingStates.savingPublicProfile)
    const isSavingPlan = computed(() => store.loadingStates.savingPlan)
    const isUploadingFiles = computed(() => store.loadingStates.uploadingFiles)
    const isResendingLink = computed(() => store.loadingStates.resendingLink)
    const isVerifyingPhone = computed(() => store.loadingStates.verifyingPhone)
    const isValidatingData = computed(() => store.loadingStates.validatingData)
    const isRequestingLink = computed(() => store.loadingStates.requestingLink)
    const isConfirmingEmail = computed(() => store.loadingStates.confirmingEmail)

    const hasError = computed(() => !!store.error)
    const errorMessage = computed(() => store.error?.message || '')
    const errorDetails = computed(() => store.error)

    const nextStep = (): boolean => {
        return store.nextStep()
    }

    const prevStep = (): boolean => {
        return store.prevStep()
    }

    const goToStep = (stepIndex: number): boolean => {
        return store.goToStep(stepIndex)
    }

    const goToStepByKey = (stepKey: string): boolean => {
        return store.goToStepByKey(stepKey)
    }

    const setRegisterToken = (token: string): void => {
        return store.setRegistrationToken(token)
    }

    const goBack = async (): Promise<void> => {
        if (store.canGoBack) {
            store.prevStep()
            const prevStep = store.currentStep
            if (prevStep) {
                await router.push(localePath(prevStep.path))
            }
        }
    }

    const getStepData = (stepKey: keyof typeof store.formData) => {
        return store.formData[stepKey] || useCookie('registration').value?.formData?.[stepKey] || {}
    }

    const updateStepData = (stepKey: keyof typeof store.formData, data: any): void => {
        store.clearError()
        store.updateFormData(stepKey, data)
    }

    const markStepCompleted = (stepKey: string): void => {
        store.markStepCompleted(stepKey)
    }

    const isStepCompleted = (stepKey: string): boolean => {
        return store.isStepCompleted(stepKey)
    }

    const getStepProgress = () => {
        return store.progress
    }

    const initializeStep = (stepKey: string): void => {
        const stepIndex = store.availableSteps.findIndex((step) => step.key === stepKey)
        if (stepIndex !== -1) {
            store.goToStep(stepIndex)
        }
        store.clearError()
    }

    const submitStep = async (stepKey: string, stepData: any): Promise<boolean> => {
        try {
            store.clearError()

            switch (stepKey) {
                case 'personalInfo':
                    const accountType = getAccountType()
                    let userRoleId = stepData.userRoleId || accountType.id

                    if (typeof userRoleId === 'string') {
                        userRoleId = parseInt(userRoleId, 10)
                    }

                    if (!Number.isInteger(userRoleId) || userRoleId < 1) {
                        userRoleId = 1
                    }

                    const success = await store.requestRegistrationLink(
                        stepData.email,
                        stepData.password,
                        userRoleId,
                        stepData.destinationType,
                        stepData.referralCode || accountType.referralCode
                    )

                    if (success) {
                        clearAccountTypeCookie()
                    }

                    return success

                case 'accountType':
                    saveAccountType(stepData)
                    return true

                case 'emailVerification':
                    const result = await store.confirmRegistration(stepData.code)
                    return !!result

                case 'companyDetails':
                    const companyResult = await store.completeCompanyDetails(
                        stepData.substep || 1,
                        stepData.companyDetails,
                        stepData.nextStep,
                        stepData.nextSubstep
                    )
                    return companyResult.success

                default:
                    return false
            }
        } catch (error) {
            return false
        }
    }

    const completeCompanyProfile = async (
        data: any
    ): Promise<{ success: boolean; nextStep?: string; nextSubstep?: number }> => {
        updateStepData('companyDetails', { section: 'profile', data })
        const result = await store.completeCompanyDetails(1, data)

        if (result.success && result?.data) {
            userStore.updateUser(result.data)
        }
        return result
    }

    const completeDetailedDetails = async (
        data: any
    ): Promise<{ success: boolean; nextStep?: string; nextSubstep?: number }> => {
        updateStepData('companyDetails', { section: 'detailed', data })
        const result = await store.completeCompanyDetails(2, data)
        if (result.success && result?.data) {
            userStore.updateUser(result.data)
        }
        return result
    }

    const completeCompanyAddress = async (
        data: any
    ): Promise<{ success: boolean; nextStep?: string; nextSubstep?: number }> => {
        updateStepData('companyDetails', { section: 'address', data })
        const result = await store.completeCompanyDetails(3, data)
        if (result.success && result?.data) {
            userStore.updateUser(result.data)
        }
        return result
    }

    const completeCompanyTopics = async (
        data: any
    ): Promise<{ success: boolean; nextStep?: string; nextSubstep?: number }> => {
        updateStepData('companyDetails', { section: 'topics', data })
        const result = await store.completeCompanyDetails(4, data)
        if (result.success && result?.data) {
            userStore.updateUser(result.data)
        }
        return result
    }

    const completeCompanyContacts = async (
        data: any
    ): Promise<{ success: boolean; nextStep?: string; nextSubstep?: number }> => {
        updateStepData('companyDetails', { section: 'contacts', data })

        const result = await store.completeCompanyDetails(5, { contact_details: { ...data } })
        if (result.success && result?.data) {
            userStore.updateUser(result.data)
        }
        return result
    }

    const completeBankDetails = async (
        data: any
    ): Promise<{ success: boolean; nextStep?: string; nextSubstep?: number }> => {
        updateStepData('companyDetails', { section: 'banks', data })
        const result = await store.completeCompanyDetails(6, data)
        if (result.success && result?.data) {
            userStore.updateUser(result.data)
        }
        return result
    }

    const completeCompanyDetails = async (
        substep: number,
        data: any,
        nextStep?: string,
        nextSubstep?: number
    ): Promise<{ success: boolean; nextStep?: string; nextSubstep?: number }> => {
        const result = await store.completeCompanyDetails(substep, data, nextStep, nextSubstep)
        if (result.success && result?.data) {
            userStore.updateUser(result.data)
        }
        return result
    }

    const completeProductionDetails = async (
        substep: number,
        data: any
    ): Promise<{ success: boolean; nextStep?: string; nextSubstep?: number }> => {
        updateStepData('productionDetails', data)
        return await store.completeProductionDetails(substep, data)
    }

    const completeFactoryDetails = async (
        substep: number,
        data: any
    ): Promise<{ success: boolean; nextStep?: string; nextSubstep?: number }> => {
        return await completeProductionDetails(substep, data)
    }

    const completeExportDetails = async (
        substep: number,
        data: any
    ): Promise<{ success: boolean; nextStep?: string; nextSubstep?: number }> => {
        updateStepData('exportDetails', data)
        return await store.completeExportDetails(substep, data)
    }

    const completeCompanyCertificates = async (
        certificates: Array<{ id?: number | null; file: File }>
    ): Promise<{ success: boolean; nextStep?: string; nextSubstep?: number }> => {
        updateStepData('companyCertificates', {
            certificates,
            completed: true,
        })

        const result = await store.uploadCompanyCertificates(certificates)

        if (!result.success) {
            // Handle error
        }
        return result
    }

    const completeGeneralCertificates = async (
        certificates: Array<{
            id?: number | null
            file?: File
            certificateNumber: string
            issueDate: string
            expiryDate: string
        }>
    ): Promise<{ success: boolean; nextStep?: string; nextSubstep?: number }> => {
        updateStepData('generalCertificates', {
            certificates,
            completed: true,
        })

        const result = await store.uploadGeneralCertificates(certificates)

        if (!result.success) {
            // Handle error
        }
        return result
    }

    const completeCompanyDocuments = async (
        data: any
    ): Promise<{ success: boolean; nextStep?: string; nextSubstep?: number }> => {
        const certificates = data.passport_images || data.company_registration_certificate || []
        const formattedCerts = certificates.map((file: File) => ({ file }))

        return await completeCompanyCertificates(formattedCerts)
    }

    const completeBusinessCertificates = async (
        data: any
    ): Promise<{ success: boolean; nextStep?: string; nextSubstep?: number }> => {
        const certificates = data || []

        return await completeGeneralCertificates(certificates)
    }

    const completeCertificates = async (
        substep: number,
        data: any
    ): Promise<{ success: boolean; nextStep?: string; nextSubstep?: number }> => {
        if (substep === 1) {
            return await completeCompanyDocuments(data)
        } else {
            return await completeBusinessCertificates(data)
        }
    }

    const completePublicProfile = async (
        substep: number,
        data: any
    ): Promise<{ success: boolean; nextStep?: string; nextSubstep?: number }> => {
        updateStepData('publicProfile', data)
        return await store.completePublicProfile(substep, data)
    }

    const completePlan = async (
        planData?: any
    ): Promise<{ success: boolean; nextStep?: string; nextSubstep?: number }> => {
        updateStepData('plan', {
            selectedPlan: planData?.selectedPlan,
            planId: planData?.planId,
            completed: true,
        })

        return await store.completePlan(planData)
    }

    const completeSubscription = async (
        planData?: any
    ): Promise<{ success: boolean; nextStep?: string; nextSubstep?: number }> => {
        return await completePlan(planData)
    }

    const requestPhoneVerification = async (phoneNumber: string): Promise<boolean> => {
        return await store.requestPhoneVerification(phoneNumber)
    }

    const verifyPhone = async (phoneId: string, code: string): Promise<boolean> => {
        return await store.verifyPhone(phoneId, code)
    }

    const resendConfirmationEmail = async (email: string): Promise<boolean> => {
        return await store.resendRegistrationLink(email)
    }

    const confirmEmail = async (token: string) => {
        return await store.confirmRegistration(token)
    }

    const getCurrentStepPath = (): string => {
        return store.currentStep?.path || '/register'
    }

    const getNextStepPath = (): string => {
        const nextStep = store.getNextStep()
        return nextStep?.path || '/'
    }

    const getPrevStepPath = (): string => {
        const prevStep = store.getPrevStep()
        return prevStep?.path || '/register'
    }

    const clearError = (): void => {
        store.clearError()
    }

    const getError = () => {
        return store.error
    }

    const getFieldErrors = () => {
        return store.error?.errors || {}
    }

    const hasFieldErrors = (): boolean => {
        const errors = getFieldErrors()
        return Object.keys(errors).length > 0
    }

    const getFormData = () => {
        return store.formData
    }

    const getPersonalInfo = () => {
        return store.formData.personalInfo
    }

    const getEmailVerification = () => {
        return store.formData.emailVerification
    }

    const getCompanyDetails = () => {
        return store.formData.companyDetails
    }

    const getProductionDetails = () => {
        return store.formData.productionDetails
    }

    const getExportDetails = () => {
        return store.formData.exportDetails
    }

    const getCompanyCertificates = () => {
        return store.formData.companyCertificates
    }

    const getGeneralCertificates = () => {
        return store.formData.generalCertificates
    }

    const getCertificates = () => {
        return {
            companyCertificates: store.formData.companyCertificates,
            generalCertificates: store.formData.generalCertificates,
        }
    }

    const getPublicProfile = () => {
        return store.formData.publicProfile
    }

    const getPlan = () => {
        return store.formData.plan
    }

    const getStepByKey = (stepKey: string) => {
        return store.getStepByKey(stepKey)
    }

    const getNextStep = () => {
        return store.getNextStep()
    }

    const getPrevStep = () => {
        return store.getPrevStep()
    }

    const resetRegistration = () => {
        store.resetRegistration()
    }

    const loadAndPopulateFieldRegistration = async (step: string, substep?: string | number) => {
        if (!user.value) {
            try {
                await userStore.fetchUser()

                if (!user.value) {
                    return null
                }
            } catch (error) {
                return null
            }
        }

        const userData = user.value as Record<string, any>
        const stepData = userData[step]

        if (!stepData) {
            return null
        }

        if (substep !== undefined) {
            const substepKey = typeof substep === 'number' ? substep.toString() : substep
            return stepData[substepKey] ?? null
        }

        return stepData
    }

    const accountTypeData = computed(() => {
        return getAccountType()
    })

    return {
        store,
        userStore,

        currentStep,
        availableSteps,
        currentStepIndex,
        canGoBack,
        canGoForward,
        isFirstStep,
        isLastStep,
        progress,
        completedSteps,
        formData,

        isSubmitting,
        isLoading,
        loadingStates,
        isSavingAccountType,
        isSavingPersonalInfo,
        isSavingCompanyDetails,
        isSavingFactoryDetails,
        isSavingProductionDetails,
        isSavingExportDetails,
        isSavingCompanyCertificates,
        isSavingGeneralCertificates,
        isSavingPublicProfile,
        isSavingPlan,
        isUploadingFiles,
        isResendingLink,
        isVerifyingPhone,
        isValidatingData,
        isRequestingLink,
        isConfirmingEmail,
        accountTypeData,

        hasError,
        errorMessage,
        errorDetails,

        nextStep,
        prevStep,
        goToStep,
        goToStepByKey,
        goBack,
        setRegisterToken,

        getStepData,
        updateStepData,
        markStepCompleted,
        isStepCompleted,
        getStepProgress,
        initializeStep,

        submitStep,

        completeCompanyProfile,
        completeDetailedDetails,
        completeCompanyAddress,
        completeCompanyTopics,
        completeCompanyContacts,
        completeBankDetails,
        completeCompanyDetails,

        completeProductionDetails,
        completeFactoryDetails,
        completeExportDetails,

        completeCompanyCertificates,
        completeGeneralCertificates,
        completeCompanyDocuments,
        completeBusinessCertificates,
        completeCertificates,

        completePublicProfile,
        completePlan,
        completeSubscription,

        requestPhoneVerification,
        verifyPhone,

        resendConfirmationEmail,
        confirmEmail,

        getCurrentStepPath,
        getNextStepPath,
        getPrevStepPath,
        resetRegistration,
        loadAndPopulateFieldRegistration,

        getStepByKey,
        getNextStep,
        getPrevStep,

        clearError,
        getError,
        getFieldErrors,
        hasFieldErrors,

        getFormData,
        getAccountType,
        saveAccountType,
        clearAccountTypeCookie,
        getPersonalInfo,
        getEmailVerification,
        getCompanyDetails,
        getProductionDetails,
        getExportDetails,
        getCompanyCertificates,
        getGeneralCertificates,
        getCertificates,
        getPublicProfile,
        getPlan,
    }
}
