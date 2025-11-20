import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { camelToSnake } from '~/utils/case-converter'

interface StepDefinition {
    key: string
    label: string
    path: string
    isRequired: boolean
    dependsOn?: string[]
    requiresAuth: boolean
    accountTypes?: string[]
    substeps?: SubstepDefinition[]
}

interface SubstepDefinition {
    key: string
    path: string
    label: string
    substepNumber: number
}

interface RegistrationFormData {
    accountType: {
        id: number
        type: 'supplier' | 'buyer' | 'serviceProvider'
        referralCode?: string
        timestamp?: string
    } | null
    personalInfo: {
        email: string
        password: string
        confirmPassword: string
        destinationType: string
        terms: boolean
        subscribeToNewsletter?: boolean
    } | null
    emailVerification: {
        code: string
        verified: boolean
    } | null
    companyDetails: {
        profile: any
        detailed: any
        address: any
        topics: any
        contacts: any
        banks: any
    } | null
    productionDetails: any | null
    exportDetails: any | null
    companyCertificates: {
        certificates: Array<{
            id?: number | null
            file: File
        }>
        completed?: boolean
    } | null
    generalCertificates: {
        certificates: Array<{
            id?: number | null
            file?: File
            certificateNumber: string
            issueDate: string
            expiryDate: string
        }>
        completed?: boolean
    } | null
    publicProfile: any | null
    plan: {
        selectedPlan?: string
        planId?: number
        completed?: boolean
    } | null
}

interface ApiError {
    message: string
    status?: number
    errors?: Record<string, string[]>
}

interface EmailVerificationResponse {
    token: string
    user: any
}

export const useRegistrationStore = defineStore('registration', () => {
    const api = useApi()
    const userStore = useUserStore()

    let t: any
    try {
        if (import.meta.client && getCurrentInstance()) {
            const { t: i18nT } = useI18n()
            t = i18nT
        } else {
            t = (key: string, fallback?: string) => fallback || key
        }
    } catch (e) {
        t = (key: string, fallback?: string) => fallback || key
    }

    const currentStepIndex = ref(0)
    const completedSteps = ref<string[]>([])
    const error = ref<ApiError | null>(null)
    const lastSavedStep = ref<string | null>(null)
    const registrationToken = ref<string | null>(null)
    const isInitialized = ref(false)

    const loadingStates = ref({
        requestingLink: false,
        resendingLink: false,
        confirmingEmail: false,
        savingAccountType: false,
        savingPersonalInfo: false,
        savingCompanyDetails: false,
        savingFactoryDetails: false,
        savingExportDetails: false,
        savingCompanyCertificates: false,
        savingGeneralCertificates: false,
        savingPublicProfile: false,
        savingPlan: false,
        uploadingFiles: false,
        validatingData: false,
        verifyingPhone: false,
        initializingFromUser: false,
    })

    const isLoading = computed(() => {
        return Object.values(loadingStates.value).some((state) => state)
    })

    const isSubmitting = computed(() => {
        return (
            loadingStates.value.requestingLink ||
            loadingStates.value.confirmingEmail ||
            loadingStates.value.savingAccountType ||
            loadingStates.value.savingPersonalInfo ||
            loadingStates.value.savingCompanyDetails ||
            loadingStates.value.savingFactoryDetails ||
            loadingStates.value.savingExportDetails ||
            loadingStates.value.savingCompanyCertificates ||
            loadingStates.value.savingGeneralCertificates ||
            loadingStates.value.savingPublicProfile ||
            loadingStates.value.savingPlan
        )
    })

    const formData = ref<RegistrationFormData>({
        accountType: null,
        personalInfo: null,
        emailVerification: null,
        companyDetails: null,
        productionDetails: null,
        exportDetails: null,
        companyCertificates: null,
        generalCertificates: null,
        publicProfile: null,
        plan: null,
    })

    const stepDefinitions: StepDefinition[] = [
        {
            key: 'accountType',
            label: 'Account Type',
            path: '/register/account-type',
            isRequired: true,
            requiresAuth: false,
        },
        {
            key: 'personalInfo',
            label: 'Personal Information',
            path: '/register/personal-info',
            isRequired: true,
            dependsOn: ['accountType'],
            requiresAuth: false,
        },
        {
            key: 'companyDetails',
            label: 'Company Details',
            path: '/register/company-details',
            isRequired: true,
            dependsOn: ['personalInfo'],
            requiresAuth: true,
            substeps: [
                {
                    key: 'profile',
                    path: '/register/company-details/profile',
                    label: 'Company Profile',
                    substepNumber: 1,
                },
                {
                    key: 'detailed',
                    path: '/register/company-details/detailed',
                    label: 'Other Details',
                    substepNumber: 2,
                },
                {
                    key: 'address',
                    path: '/register/company-details/address',
                    label: 'Company Address',
                    substepNumber: 3,
                },
                {
                    key: 'topics',
                    path: '/register/company-details/topics',
                    label: 'Business Topics',
                    substepNumber: 4,
                },
                {
                    key: 'contacts',
                    path: '/register/company-details/contacts',
                    label: 'Contact Details',
                    substepNumber: 5,
                },
                {
                    key: 'banks',
                    path: '/register/company-details/banks',
                    label: 'Bank Information',
                    substepNumber: 6,
                },
            ],
        },
        {
            key: 'productionDetails',
            label: 'Production Details',
            path: '/register/production-details',
            isRequired: false,
            dependsOn: ['companyDetails'],
            requiresAuth: true,
            accountTypes: ['supplier', 'buyer'],
        },
        {
            key: 'exportDetails',
            label: 'Export Details',
            path: '/register/export-details',
            isRequired: false,
            dependsOn: ['productionDetails'],
            requiresAuth: true,
            accountTypes: ['supplier', 'buyer'],
        },
        {
            key: 'certificates', // ✅ Changed from 'companyCertificates'
            label: 'Certificates',
            path: '/register/company-certificates',
            isRequired: true,
            dependsOn: ['companyDetails'],
            requiresAuth: true,
            substeps: [
                {
                    key: 'company',
                    path: '/register/company-certificates',
                    label: 'Company Documents',
                    substepNumber: 1,
                },
                {
                    key: 'general',
                    path: '/register/business-certificates',
                    label: 'Business Certificates',
                    substepNumber: 2,
                },
            ],
        },
        {
            key: 'publicProfile',
            label: 'Public Profile',
            path: '/register/public-profile',
            isRequired: false,
            dependsOn: ['certificates'],
            requiresAuth: true,
        },
        {
            key: 'plan',
            label: 'Subscription Plan',
            path: '/register/subscription',
            isRequired: true,
            dependsOn: ['publicProfile'],
            requiresAuth: true,
        },
    ]

    const mapApiStepToStoreKey = (apiStep: string): string | null => {
        const mapping: Record<string, string> = {
            'account-type': 'accountType',
            'personal-info': 'personalInfo',
            'email-verification': 'emailVerification',
            'company-details': 'companyDetails',
            'factory-details': 'productionDetails',
            'production-details': 'productionDetails',
            'export-details': 'exportDetails',
            certificates: 'certificates',
            'company-certificates': 'certificates', // ✅ Changed
            'business-certificates': 'certificates', // ✅ Changed
            'general-certificates': 'certificates', // ✅ Changed
            'profile-media': 'publicProfile',
            'public-profile': 'publicProfile',
            plan: 'plan',
            subscription: 'plan',
        }
        return mapping[apiStep] || null
    }

    const initializeFromUser = async (): Promise<void> => {
        if (isInitialized.value) {
            return
        }

        try {
            setLoadingState('initializingFromUser', true)

            if (userStore.isAuthenticated || getRegistrationToken()) {
                await userStore.fetchUser()
            }

            if (!userStore.user) {
                return
            }

            if (userStore.isRegistrationComplete) {
                isInitialized.value = true
                return
            }

            if (userStore.currentRegistrationStep) {
                const storeKey = mapApiStepToStoreKey(userStore.currentRegistrationStep)

                if (storeKey) {
                    const stepIndex = availableSteps.value.findIndex((s) => s.key === storeKey)

                    if (stepIndex !== -1) {
                        currentStepIndex.value = stepIndex

                        for (let i = 0; i < stepIndex; i++) {
                            const step = availableSteps.value[i]
                            if (step && !completedSteps.value.includes(step.key)) {
                                completedSteps.value.push(step.key)
                            }
                        }
                    }
                }
            }

            if (userStore.user.email) {
                formData.value.personalInfo = {
                    email: userStore.user.email,
                    password: '',
                    confirmPassword: '',
                    destinationType: '',
                    terms: true,
                    subscribeToNewsletter: false,
                }
            }

            if (userStore.user.roles && userStore.user.roles.length > 0) {
                const role = userStore.user.roles[0]
                formData.value.accountType = {
                    id: role.id,
                    type: role.code as 'supplier' | 'buyer' | 'serviceProvider',
                    timestamp: new Date().toISOString(),
                }
            }

            isInitialized.value = true
        } catch (error) {
            // Silent error handling
        } finally {
            setLoadingState('initializingFromUser', false)
        }
    }

    const availableSteps = computed((): StepDefinition[] => {
        const accountType = formData.value.accountType?.type || 'supplier'

        return stepDefinitions.filter((step) => {
            if (step.accountTypes && step.accountTypes.length > 0) {
                return step.accountTypes.includes(accountType)
            }
            return true
        })
    })

    const currentStep = computed((): StepDefinition | null => {
        return availableSteps.value[currentStepIndex.value] || null
    })

    const canGoBack = computed((): boolean => {
        return currentStepIndex.value > 0
    })

    const canGoForward = computed((): boolean => {
        return currentStepIndex.value < availableSteps.value.length - 1
    })

    const isFirstStep = computed((): boolean => {
        return currentStepIndex.value === 0
    })

    const isLastStep = computed((): boolean => {
        return currentStepIndex.value === availableSteps.value.length - 1
    })

    const progress = computed(() => {
        const steps = availableSteps.value.map((step, index) => ({
            key: step.key,
            label: step.label,
            path: step.path,
            isActive: index === currentStepIndex.value,
            isCompleted: completedSteps.value.includes(step.key),
            canAccess: index <= currentStepIndex.value || completedSteps.value.includes(step.key),
        }))

        return {
            steps,
            completedSteps: completedSteps.value,
            totalSteps: availableSteps.value.length,
            currentStep: currentStepIndex.value + 1,
            percentage: Math.round(
                ((currentStepIndex.value + 1) / availableSteps.value.length) * 100
            ),
        }
    })

    const nextStep = (): boolean => {
        if (canGoForward.value) {
            currentStepIndex.value++
            return true
        }
        return false
    }

    const prevStep = (): boolean => {
        if (canGoBack.value) {
            currentStepIndex.value--
            return true
        }
        return false
    }

    const goToStep = (stepIndex: number): boolean => {
        if (stepIndex >= 0 && stepIndex < availableSteps.value.length) {
            currentStepIndex.value = stepIndex
            return true
        }
        return false
    }

    const goToStepByKey = (stepKey: string): boolean => {
        const stepIndex = availableSteps.value.findIndex((step) => step.key === stepKey)
        return goToStep(stepIndex)
    }

    const setRegistrationToken = (token: string): void => {
        const registrationTokenCookie = useCookie('registration.token', {
            path: '/',
            sameSite: 'lax',
            secure: import.meta.client && window.location.protocol === 'https:',
            maxAge: 60 * 60 * 24 * 7,
        })

        registrationTokenCookie.value = token
        registrationToken.value = token
    }

    const clearRegistrationToken = (): void => {
        const registrationTokenCookie = useCookie<string | null>('registration.token', {
            path: '/',
            sameSite: 'lax',
        })

        registrationTokenCookie.value = null
        registrationToken.value = null
    }

    const getRegistrationToken = (): string | null => {
        if (registrationToken.value) {
            return registrationToken.value
        }

        const registrationTokenCookie = useCookie<string | null>('registration.token')
        if (registrationTokenCookie.value) {
            registrationToken.value = registrationTokenCookie.value
            return registrationTokenCookie.value
        }

        return null
    }

    const markStepCompleted = (stepKey: string): void => {
        if (!completedSteps.value.includes(stepKey)) {
            completedSteps.value.push(stepKey)
        }
    }

    const isStepCompleted = (stepKey: string): boolean => {
        return completedSteps.value.includes(stepKey)
    }

    const updateFormData = (stepKey: keyof RegistrationFormData, data: any): void => {
        if (stepKey === 'companyDetails' && typeof data === 'object' && data.section) {
            if (!formData.value.companyDetails) {
                formData.value.companyDetails = {
                    profile: null,
                    detailed: null,
                    address: null,
                    topics: null,
                    contacts: null,
                    banks: null,
                }
            }
            formData.value.companyDetails[data.section] = data.data
        } else {
            formData.value[stepKey] = data
        }
    }

    const clearError = (): void => {
        error.value = null
    }

    const setLoadingState = (operation: keyof typeof loadingStates.value, state: boolean): void => {
        loadingStates.value[operation] = state
    }

    const clearAllLoadingStates = (): void => {
        Object.keys(loadingStates.value).forEach((key) => {
            loadingStates.value[key as keyof typeof loadingStates.value] = false
        })
    }

    const setError = (err: ApiError): void => {
        error.value = err
    }

    const handleApiError = (err: any): ApiError => {
        const apiError: ApiError = {
            message: err.data?.message || err.statusMessage || t('errors.generalSubmit'),
            status: err.statusCode || 0,
            errors: err.data?.errors || err.errors || {},
        }

        setError(apiError)
        return apiError
    }

    const getNextStepInfo = (
        currentStep: string,
        currentSubstep?: number
    ): { step?: string; substep?: number } => {
        if (currentStep === 'company-details') {
            switch (currentSubstep) {
                case 1:
                    return { step: 'company-details', substep: 2 }
                case 2:
                    return { step: 'company-details', substep: 3 }
                case 3:
                    return { step: 'company-details', substep: 4 }
                case 4:
                    return { step: 'company-details', substep: 5 }
                case 5:
                    return { step: 'company-details', substep: 6 }
                case 6:
                    const accountType = formData.value.accountType?.type
                    if (accountType === 'supplier') {
                        return { step: 'factory-details', substep: 1 }
                    } else {
                        return { step: 'certificates', substep: 1 }
                    }
                default:
                    return { step: 'company-details', substep: 1 }
            }
        }

        if (currentStep === 'production-details' || currentStep === 'factory-details') {
            switch (currentSubstep) {
                case 1:
                    return { step: 'export-details', substep: 1 }
                default:
                    return { step: 'export-details', substep: 1 }
            }
        }

        if (currentStep === 'export-details') {
            switch (currentSubstep) {
                case 1:
                    return { step: 'certificates', substep: 1 }
                default:
                    return { step: 'certificates', substep: 1 }
            }
        }

        if (currentStep === 'certificates') {
            switch (currentSubstep) {
                case 1:
                    return { step: 'certificates', substep: 2 }
                case 2:
                    return { step: 'profile-media', substep: 1 }
                default:
                    return { step: 'certificates', substep: 2 }
            }
        }

        if (currentStep === 'profile-media') {
            switch (currentSubstep) {
                case 1:
                    return { step: 'plan', substep: 1 }
                default:
                    return { step: 'plan', substep: 1 }
            }
        }

        if (currentStep === 'plan') {
            switch (currentSubstep) {
                case 1:
                    return {}
                default:
                    return {}
            }
        }

        return {}
    }

    const requestRegistrationLink = async (
        email: string,
        password: string,
        userRoleId: string | number,
        destinationType: string,
        referralCode: string | undefined = undefined
    ): Promise<boolean> => {
        try {
            clearError()
            setLoadingState('requestingLink', true)

            const response = await api.post('/auth/register/request', {
                user_role_id: userRoleId,
                destination_type: destinationType,
                email,
                password,
                referral_code: referralCode,
            })

            if (response.success) {
                updateFormData('personalInfo', {
                    email,
                    password,
                    destinationType,
                    confirmPassword: password,
                    terms: true,
                    referralCode,
                    subscribeToNewsletter: false,
                })

                markStepCompleted('personalInfo')
                return true
            }
            return false
        } catch (err: any) {
            handleApiError(err)
            return false
        } finally {
            setLoadingState('requestingLink', false)
        }
    }

    const resendRegistrationLink = async (email: string): Promise<boolean> => {
        try {
            clearError()
            setLoadingState('resendingLink', true)

            const response = await api.post('/auth/register/resend', {
                email,
            })

            if (response?.data?.success || response?.success) {
                return true
            }

            if (response && !response.error) {
                return true
            }

            return false
        } catch (err: any) {
            if (err.statusCode === 429 || err.response?.status === 429) {
                const apiError: ApiError = {
                    message: t(
                        'auth.tooManyResendAttempts',
                        'Please wait before requesting another link'
                    ),
                    status: 429,
                    errors: {},
                }
                setError(apiError)
                return false
            }

            const apiError = handleApiError(err)
            return false
        } finally {
            setLoadingState('resendingLink', false)
        }
    }

    const confirmRegistration = async (
        token: string
    ): Promise<EmailVerificationResponse | null> => {
        try {
            clearError()
            setLoadingState('confirmingEmail', true)

            const response = await api.post<EmailVerificationResponse>('/auth/register/confirm', {
                token,
            })

            if (response.data?.token && response.data?.user) {
                userStore.setUser(response.data.user)
                userStore.setInitialized(true)

                setRegistrationToken(response.data.token)

                updateFormData('emailVerification', {
                    code: token,
                    verified: true,
                })

                markStepCompleted('emailVerification')
                return response.data
            }

            return null
        } catch (err: any) {
            handleApiError(err)
            return null
        } finally {
            setLoadingState('confirmingEmail', false)
        }
    }

    const completeCompanyDetails = async (
        substep: number,
        companyDetails: any,
        nextStep?: string,
        nextSubstep?: number
    ): Promise<{ success: boolean; nextStep?: string; nextSubstep?: number; data?: any }> => {
        try {
            clearError()
            setLoadingState('savingCompanyDetails', true)

            if (!nextStep && !nextSubstep) {
                const nextStepInfo = getNextStepInfo('company-details', substep)
                nextStep = nextStepInfo.step
                nextSubstep = nextStepInfo.substep
            }

            const payload = {
                step: 'company-details',
                substep,
                next_step: nextStep,
                next_substep: nextSubstep,
                company_details: camelToSnake(companyDetails),
            }

            if (Object.keys(companyDetails).length === 0) {
                delete payload.company_details
            }

            const response = await api.patch('/user/complete-register', payload)

            if (response.data) {
                lastSavedStep.value = `company-details-${substep}`
                markStepCompleted('companyDetails')

                await userStore.fetchUser()

                return {
                    success: true,
                    data: response.data,
                    nextStep: response.data.step,
                    nextSubstep: response.data.substep,
                }
            }
            return { success: false }
        } catch (err: any) {
            handleApiError(err)
            return { success: false }
        } finally {
            setLoadingState('savingCompanyDetails', false)
        }
    }

    const completeProductionDetails = async (
        substep: number,
        productionDetails: any,
        nextStep?: string,
        nextSubstep?: number
    ): Promise<{ success: boolean; nextStep?: string; nextSubstep?: number }> => {
        try {
            clearError()
            setLoadingState('savingFactoryDetails', true)

            if (!nextStep && !nextSubstep) {
                const nextStepInfo = getNextStepInfo('factory-details', substep)
                nextStep = nextStepInfo.step
                nextSubstep = nextStepInfo.substep
            }

            const payload = {
                step: 'factory-details',
                substep,
                next_step: nextStep,
                next_substep: nextSubstep,
                factory_details: productionDetails,
            }

            if (Object.keys(productionDetails).length === 0) {
                delete payload.factory_details
            }

            const response = await api.patch('/user/complete-register', payload)

            if (response.data) {
                lastSavedStep.value = `factory-details-${substep}`
                markStepCompleted('productionDetails')

                await userStore.fetchUser()

                return {
                    success: true,
                    nextStep: response.data.step,
                    nextSubstep: response.data.substep,
                }
            }
            return { success: false }
        } catch (err: any) {
            handleApiError(err)
            return { success: false }
        } finally {
            setLoadingState('savingFactoryDetails', false)
        }
    }

    const canAccessStep = (path: string): boolean => {
        let cleanPath = path.replace(/^\/[a-z]{2}(-[A-Z]{2})?\//, '/') || path

        if (cleanPath === path && !path.startsWith('/')) {
            cleanPath = '/' + path
        }

        const publicPaths = ['/register/account-type', '/register/personal-info']

        if (publicPaths.some((p) => cleanPath.startsWith(p))) {
            return true
        }

        if (!userStore.isAuthenticated) {
            return false
        }

        if (userStore.isRegistrationComplete) {
            return false
        }

        const pathMapping: Record<string, { stepKey: string; substep?: number }> = {
            '/register/company-details/profile': { stepKey: 'companyDetails', substep: 1 },
            '/register/company-details/detailed': { stepKey: 'companyDetails', substep: 2 },
            '/register/company-details/address': { stepKey: 'companyDetails', substep: 3 },
            '/register/company-details/topics': { stepKey: 'companyDetails', substep: 4 },
            '/register/company-details/contacts': { stepKey: 'companyDetails', substep: 5 },
            '/register/company-details/banks': { stepKey: 'companyDetails', substep: 6 },
            '/register/company-details': { stepKey: 'companyDetails', substep: 1 },
            '/register/production-details': { stepKey: 'productionDetails', substep: 1 },
            '/register/export-details': { stepKey: 'exportDetails', substep: 1 },
            '/register/company-certificates': { stepKey: 'certificates', substep: 1 }, // ✅ Changed
            '/register/business-certificates': { stepKey: 'certificates', substep: 2 }, // ✅ Changed
            '/register/public-profile': { stepKey: 'publicProfile', substep: 1 },
            '/register/subscription': { stepKey: 'plan', substep: 1 },
        }

        let pathConfig = null
        for (const [pathPattern, config] of Object.entries(pathMapping)) {
            if (cleanPath.startsWith(pathPattern)) {
                pathConfig = config
                break
            }
        }

        if (!pathConfig) {
            return false
        }

        const { stepKey, substep } = pathConfig

        const currentApiStep = userStore.currentRegistrationStep
        const currentApiSubstep = userStore.currentRegistrationSubstep

        const currentStoreKey = currentApiStep ? mapApiStepToStoreKey(currentApiStep) : null

        if (stepKey === currentStoreKey) {
            if (substep && currentApiSubstep) {
                const currentSubstepNum =
                    typeof currentApiSubstep === 'string'
                        ? parseInt(currentApiSubstep)
                        : currentApiSubstep

                const canAccessSubstep = substep <= currentSubstepNum
                return canAccessSubstep
            }
            return true
        }

        const stepIndex = availableSteps.value.findIndex((s) => s.key === stepKey)
        const currentStepIndex = currentStoreKey
            ? availableSteps.value.findIndex((s) => s.key === currentStoreKey)
            : -1

        if (stepIndex === -1) {
            return false
        }

        if (stepIndex < currentStepIndex) {
            const isCompleted = completedSteps.value.includes(stepKey)
            return isCompleted
        }

        return false
    }

    const completeExportDetails = async (
        substep: number,
        exportDetails: any,
        nextStep?: string,
        nextSubstep?: number
    ): Promise<{ success: boolean; nextStep?: string; nextSubstep?: number }> => {
        try {
            clearError()
            setLoadingState('savingExportDetails', true)

            if (!nextStep && !nextSubstep) {
                const nextStepInfo = getNextStepInfo('export-details', substep)
                nextStep = nextStepInfo.step
                nextSubstep = nextStepInfo.substep
            }

            const payload = {
                step: 'export-details',
                substep,
                next_step: nextStep,
                next_substep: nextSubstep,
                export_details: exportDetails,
            }

            if (Object.keys(exportDetails).length === 0) {
                delete payload.export_details
            }

            const response = await api.patch('/user/complete-register', payload)

            if (response.data) {
                lastSavedStep.value = `export-details-${substep}`
                markStepCompleted('exportDetails')

                await userStore.fetchUser()

                return {
                    success: true,
                    nextStep: response.data.step,
                    nextSubstep: response.data.substep,
                }
            }
            return { success: false }
        } catch (err: any) {
            handleApiError(err)
            return { success: false }
        } finally {
            setLoadingState('savingExportDetails', false)
        }
    }

    const uploadCompanyCertificates = async (
        certificates: Array<{ id?: number | null; file: File }>
    ): Promise<{ success: boolean; nextStep?: string; nextSubstep?: number }> => {
        try {
            clearError()
            setLoadingState('savingCompanyCertificates', true)

            const nextStepInfo = getNextStepInfo('certificates', 1)

            const formData = new FormData()
            formData.append('_method', 'PATCH')
            formData.append('step', 'certificates')
            formData.append('substep', '1')
            formData.append('next_step', nextStepInfo.step || 'certificates')
            formData.append('next_substep', nextStepInfo.substep?.toString() || '2')

            certificates.forEach((cert, index) => {
                if (cert.file instanceof File) {
                    formData.append(`company_certificates[${index}][file]`, cert.file)
                    if (cert.id) {
                        formData.append(`company_certificates[${index}][id]`, cert.id.toString())
                    }
                } else {
                    formData.append(`company_certificates[${index}][id]`, cert.id!.toString())
                }
            })

            const response = await api.postFormData('/user/complete-register', formData)

            if (response.data) {
                lastSavedStep.value = 'certificates-1'
                markStepCompleted('certificates') // ✅ Changed from 'companyCertificates'

                await userStore.fetchUser()

                return {
                    success: true,
                    nextStep: response.data.step,
                    nextSubstep: response.data.substep,
                }
            }

            return { success: false }
        } catch (err: any) {
            handleApiError(err)
            return { success: false }
        } finally {
            setLoadingState('savingCompanyCertificates', false)
        }
    }
    const uploadGeneralCertificates = async (
        certificates: Array<{
            id?: number | null
            file?: File
            certificateNumber: string
            issueDate: string
            expiryDate: string
        }>
    ): Promise<{ success: boolean; nextStep?: string; nextSubstep?: number }> => {
        try {
            clearError()
            setLoadingState('savingGeneralCertificates', true)

            const formData = new FormData()
            formData.append('_method', 'PATCH')
            formData.append('step', 'certificates')
            formData.append('substep', '2')
            formData.append('next_step', 'profile-media')
            formData.append('next_substep', '1')

            certificates.forEach((cert, index) => {
                formData.append(
                    `general_certificates[${index}][certificate_number]`,
                    cert.certificateNumber
                )
                formData.append(`general_certificates[${index}][issue_date]`, cert.issueDate)
                formData.append(`general_certificates[${index}][expiry_date]`, cert.expiryDate)

                if (cert.file instanceof File) {
                    formData.append(`general_certificates[${index}][file]`, cert.file)
                }

                if (cert.id) {
                    formData.append(`general_certificates[${index}][id]`, cert.id.toString())
                }
            })

            const response = await api.postFormData('/user/complete-register', formData)

            if (response.data) {
                lastSavedStep.value = 'certificates-2'
                markStepCompleted('generalCertificates')

                await userStore.fetchUser()

                return {
                    success: true,
                    nextStep: response.data.step,
                    nextSubstep: response.data.substep,
                }
            }

            return { success: false }
        } catch (err: any) {
            handleApiError(err)
            return { success: false }
        } finally {
            setLoadingState('savingGeneralCertificates', false)
        }
    }

    const completePublicProfile = async (
        substep: number,
        profileData: any
    ): Promise<{ success: boolean; nextStep?: string; nextSubstep?: number }> => {
        try {
            clearError()
            setLoadingState('savingPublicProfile', true)

            const formData = new FormData()
            formData.append('_method', 'PATCH')
            formData.append('step', 'profile-media')
            formData.append('substep', substep.toString())
            formData.append('next_step', 'plan')
            formData.append('next_substep', '1')

            if (profileData.picture && profileData.picture.length > 0) {
                profileData.picture.forEach((item: any) => {
                    if (item.file instanceof File) {
                        formData.append(`profile_media[picture][file]`, item.file)
                    }
                    if (item.id) {
                        formData.append(`profile_media[picture][id]`, item.id.toString())
                    }
                })
            }

            if (profileData.banner && profileData.banner.length > 0) {
                profileData.banner.forEach((item: any) => {
                    if (item.file instanceof File) {
                        formData.append(`profile_media[banner][file]`, item.file)
                    }
                    if (item.id) {
                        formData.append(`profile_media[banner][id]`, item.id.toString())
                    }
                })
            }

            if (profileData.gallery && profileData.gallery.length > 0) {
                profileData.gallery.forEach((item: any, index: number) => {
                    if (item.file instanceof File) {
                        formData.append(`profile_media[gallery][${index}][file]`, item.file)
                    }
                    if (item.id) {
                        formData.append(`profile_media[gallery][${index}][id]`, item.id.toString())
                    }
                })
            }

            const response = await api.postFormData('/user/complete-register', formData)

            if (response.data) {
                lastSavedStep.value = `profile-media-${substep}`
                markStepCompleted('publicProfile')

                await userStore.fetchUser()

                return {
                    success: true,
                    nextStep: response.data.step,
                    nextSubstep: response.data.substep,
                }
            }
            return { success: false }
        } catch (err: any) {
            handleApiError(err)
            return { success: false }
        } finally {
            setLoadingState('savingPublicProfile', false)
        }
    }

    const completePlan = async (
        planData?: any
    ): Promise<{
        success: boolean
        nextStep?: string
        nextSubstep?: number
    }> => {
        try {
            clearError()
            setLoadingState('savingPlan', true)

            const payload: any = {
                step: 'plan',
                substep: 1,
            }

            if (planData) {
                payload.plan_details = planData
            }

            const response = await api.patch('/user/complete-register', payload)

            if (response.data) {
                lastSavedStep.value = 'plan-1'
                markStepCompleted('plan')

                updateFormData('plan', {
                    selectedPlan: planData?.selectedPlan,
                    planId: planData?.planId,
                    completed: true,
                })

                await userStore.logout()

                return {
                    success: true,
                    nextStep: response.data.step,
                    nextSubstep: response.data.substep,
                }
            }
            return { success: false }
        } catch (err: any) {
            handleApiError(err)
            return { success: false }
        } finally {
            setLoadingState('savingPlan', false)
        }
    }

    const completeRegistration = async (): Promise<{
        success: boolean
        nextStep?: string
        nextSubstep?: number
    }> => {
        return await completePlan()
    }

    const verifyPhone = async (phoneId: string, code: string): Promise<boolean> => {
        try {
            clearError()
            setLoadingState('verifyingPhone', true)

            const response = await api.post('/auth/verify-phone', {
                phone_id: phoneId,
                verification_code: code,
            })

            return response.data?.success || false
        } catch (err: any) {
            handleApiError(err)
            return false
        } finally {
            setLoadingState('verifyingPhone', false)
        }
    }

    const requestPhoneVerification = async (phoneNumber: string): Promise<boolean> => {
        try {
            clearError()
            setLoadingState('verifyingPhone', true)

            const response = await api.post('/auth/request-phone-verification', {
                phone: phoneNumber,
            })

            return response.data?.success || false
        } catch (err: any) {
            handleApiError(err)
            return false
        } finally {
            setLoadingState('verifyingPhone', false)
        }
    }

    const completeFactoryDetails = async (
        substep: number,
        data: any
    ): Promise<{ success: boolean; nextStep?: string; nextSubstep?: number }> => {
        return await completeProductionDetails(substep, data)
    }

    const setSubmitting = (value: boolean): void => {
        setLoadingState('savingPersonalInfo', value)
    }

    const setLoading = (value: boolean): void => {
        setLoadingState('validatingData', value)
    }

    const getStepByKey = (stepKey: string): StepDefinition | undefined => {
        return availableSteps.value.find((step) => step.key === stepKey)
    }

    const getNextStep = (): StepDefinition | null => {
        return availableSteps.value[currentStepIndex.value + 1] || null
    }

    const getPrevStep = (): StepDefinition | null => {
        return availableSteps.value[currentStepIndex.value - 1] || null
    }

    const resetRegistration = (): void => {
        currentStepIndex.value = 0
        completedSteps.value = []
        clearAllLoadingStates()
        error.value = null
        lastSavedStep.value = null
        clearRegistrationToken()
        isInitialized.value = false
        formData.value = {
            accountType: null,
            personalInfo: null,
            emailVerification: null,
            companyDetails: null,
            productionDetails: null,
            exportDetails: null,
            companyCertificates: null,
            generalCertificates: null,
            publicProfile: null,
            plan: null,
        }
    }

    const syncStepWithPath = (path: string): void => {
        const cleanPath = path || path.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, '')

        const pathToStep: Record<string, string> = {
            '/register/account-type': 'accountType',
            '/register/personal-info': 'personalInfo',
            '/register/company-details': 'companyDetails',
            '/register/production-details': 'productionDetails',
            '/register/export-details': 'exportDetails',
            '/register/company-certificates': 'companyCertificates',
            '/register/business-certificates': 'generalCertificates',
            '/register/public-profile': 'publicProfile',
            '/register/subscription': 'plan',
        }

        for (const [pathPattern, stepKey] of Object.entries(pathToStep)) {
            if (cleanPath.startsWith(pathPattern)) {
                const stepIndex = availableSteps.value.findIndex((s) => s.key === stepKey)

                if (stepIndex !== -1 && stepIndex !== currentStepIndex.value) {
                    currentStepIndex.value = stepIndex
                }
                break
            }
        }
    }

    const getPathForCurrentStep = (): string => {
        const step = currentStep.value

        if (!step) {
            return '/register/account-type'
        }

        const substep = userStore.currentRegistrationSubstep

        const stepPaths: Record<string, string> = {
            accountType: '/register/account-type',
            personalInfo: '/register/personal-info',
            companyDetails: '/register/company-details',
            productionDetails: '/register/production-details',
            exportDetails: '/register/export-details',
            certificates: '/register/company-certificates',
            publicProfile: '/register/public-profile',
            plan: '/register/subscription',
        }

        let basePath = stepPaths[step.key] || '/register/account-type'

        if (step.key === 'companyDetails' && substep) {
            const substepPaths: Record<number, string> = {
                1: '/profile',
                2: '/detailed',
                3: '/address',
                4: '/topics',
                5: '/contacts',
                6: '/banks',
            }

            const substepNumber = typeof substep === 'string' ? parseInt(substep) : substep
            const substepPath = substepPaths[substepNumber]

            if (substepPath) {
                basePath += substepPath
            } else {
                basePath += '/profile'
            }
        }
        if (step.key === 'certificates' && substep) {
            const substepNumber = typeof substep === 'string' ? parseInt(substep) : substep
            if (substepNumber === 2) {
                basePath = '/register/business-certificates'
            }
        }
        return basePath
    }

    const validateStepAccess = (stepKey: string): boolean => {
        const stepIndex = availableSteps.value.findIndex((s) => s.key === stepKey)

        if (stepIndex === -1) {
            return false
        }

        if (stepIndex === currentStepIndex.value) {
            return true
        }

        if (stepIndex < currentStepIndex.value) {
            return completedSteps.value.includes(stepKey)
        }

        return false
    }

    const getStepProgress = (): {
        current: number
        total: number
        percentage: number
        completedCount: number
    } => {
        const total = availableSteps.value.length
        const current = currentStepIndex.value + 1
        const completedCount = completedSteps.value.length
        const percentage = Math.round((current / total) * 100)

        return {
            current,
            total,
            percentage,
            completedCount,
        }
    }

    return {
        currentStepIndex,
        completedSteps,
        loadingStates,
        isLoading,
        isSubmitting,
        error,
        lastSavedStep,
        registrationToken,
        formData,
        stepDefinitions,
        isInitialized: computed(() => isInitialized.value),

        availableSteps,
        currentStep,
        canGoBack,
        canGoForward,
        isFirstStep,
        isLastStep,
        progress,

        canAccessStep,
        syncStepWithPath,
        getPathForCurrentStep,
        validateStepAccess,
        getStepProgress,

        nextStep,
        prevStep,
        goToStep,
        goToStepByKey,
        markStepCompleted,
        isStepCompleted,
        updateFormData,

        setLoadingState,
        clearAllLoadingStates,

        clearError,
        setError,
        handleApiError,

        getNextStepInfo,

        setRegistrationToken,
        clearRegistrationToken,
        getRegistrationToken,

        initializeFromUser,
        mapApiStepToStoreKey,

        requestRegistrationLink,
        resendRegistrationLink,
        confirmRegistration,

        completeCompanyDetails,
        completeProductionDetails,
        completeExportDetails,
        uploadCompanyCertificates,
        uploadGeneralCertificates,
        completePublicProfile,
        completePlan,
        completeRegistration,

        verifyPhone,
        requestPhoneVerification,

        completeFactoryDetails,
        setSubmitting,
        setLoading,
        getStepByKey,
        getNextStep,
        getPrevStep,
        resetRegistration,
    }
})
if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useRegistrationStore, import.meta.hot)) // Fixed: Correct store reference
}
