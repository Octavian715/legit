import { buildStepRoute } from '~/utils/registrationHelpers'

export const useAuthNavigation = () => {
    const router = useRouter()
    const route = useRoute()
    const localePath = useLocalePath()
    const userStore = useUserStore()
    const { t } = useI18n()

    const handleIncompleteRegistration = async (): Promise<void> => {
        const step = userStore.currentRegistrationStep
        const substep = userStore.currentRegistrationSubstep

        // Always redirect to account-type for incomplete registrations
        // This ensures users go through the proper flow rather than jumping to plan
        if (!step || step === 'plan') {
            await router.push(localePath('/register/account-type'))
            return
        }

        const registrationRoute = buildStepRoute(step, substep)
        await router.push(localePath(registrationRoute))
    }

    const handleCompleteRegistration = async (): Promise<void> => {
        const nextParam = route.query.next as string | undefined

        if (nextParam && isValidRedirectUrl(nextParam)) {
            await router.replace(localePath(nextParam))
            return
        }

        const redirectPath = '/'
        await router.replace(localePath(redirectPath))
    }

    const getRoleBasedDashboard = (): string => {
        const primaryRole = userStore.primaryRole

        switch (primaryRole) {
            default:
                return '/'
        }
    }

    const isValidRedirectUrl = (url: string): boolean => {
        try {
            if (url.startsWith('/')) {
                const blockedPaths = ['/login', '/register', '/auth/']
                const isBlocked = blockedPaths.some((path) => url.startsWith(path))

                if (isBlocked && userStore.isRegistrationComplete) {
                    return false
                }
                return true
            }

            if (process.client) {
                const parsed = new URL(url)
                const currentHost = window.location.hostname
                return parsed.hostname === currentHost
            }

            return false
        } catch {
            return false
        }
    }

    const redirectToLogin = async (returnUrl?: string): Promise<void> => {
        const loginUrl = returnUrl ? `/login?next=${encodeURIComponent(returnUrl)}` : '/login'
        await router.push(localePath(loginUrl))
    }

    const redirectToRegistration = async (step?: string, substep?: string): Promise<void> => {
        const registrationUrl = step ? buildStepRoute(step, substep) : '/register'
        await router.push(localePath(registrationUrl))
    }

    const getRegistrationProgressMessage = (step?: string | null): string => {
        if (!step) {
            return t('auth.startRegistration', 'Please start your registration')
        }

        const messages: Record<string, string> = {
            'account-type': t('auth.selectAccountType', 'Please select your account type'),
            'personal-info': t(
                'auth.completePersonalInfo',
                'Please complete your personal information'
            ),
            'email-verification': t('auth.verifyEmail', 'Please verify your email address'),
            'company-details': t(
                'auth.completeCompanyDetails',
                'Please complete your company details'
            ),
            'factory-details': t(
                'auth.completeProductionDetails',
                'Please complete your production details'
            ),
            'production-details': t(
                'auth.completeProductionDetails',
                'Please complete your production details'
            ),
            'export-details': t(
                'auth.completeExportDetails',
                'Please complete your export details'
            ),
            certificates: t('auth.uploadCertificates', 'Please upload your certificates'),
            'company-certificates': t('auth.uploadCertificates', 'Please upload your certificates'),
            'business-certificates': t(
                'auth.uploadBusinessCertificates',
                'Please upload your business certificates'
            ),
            'general-certificates': t(
                'auth.uploadBusinessCertificates',
                'Please upload your business certificates'
            ),
            'profile-media': t('auth.completeProfile', 'Please complete your profile'),
            'public-profile': t('auth.completeProfile', 'Please complete your profile'),
            plan: t('auth.selectSubscriptionPlan', 'Please select your subscription plan'),
            subscription: t('auth.selectSubscriptionPlan', 'Please select your subscription plan'),
        }

        return messages[step] || t('auth.continueRegistration', 'Please continue your registration')
    }

    const getVerificationStatusMessage = (verificationStatus?: string): string => {
        switch (verificationStatus) {
            case 'verified':
                return t('auth.accountVerified', 'Your account is verified')
            case 'pending':
                return t('auth.verificationPending', 'Your account verification is pending')
            case 'rejected':
                return t('auth.verificationRejected', 'Your account verification was rejected')
            case 'unverified':
            case 'draft':
            default:
                return t('auth.verificationRequired', 'Account verification required')
        }
    }

    return {
        handleIncompleteRegistration,
        handleCompleteRegistration,
        redirectToLogin,
        redirectToRegistration,
        getRoleBasedDashboard,
        isValidRedirectUrl,
        getRegistrationProgressMessage,
        getVerificationStatusMessage,
    }
}
