export const buildStepRoute = (step: string, substep?: string | number): string => {
    const stepRoutes: Record<string, string> = {
        'account-type': '/register/account-type',
        'personal-info': '/register/personal-info',
        'email-verification': '/register/email-verification',
        'company-details': '/register/company-details',
        'factory-details': '/register/production-details',
        'production-details': '/register/production-details',
        'export-details': '/register/export-details',
        certificates: '/register/company-certificates',
        'company-certificates': '/register/company-certificates',
        'business-certificates': '/register/business-certificates',
        'general-certificates': '/register/business-certificates',
        'profile-media': '/register/public-profile',
        'public-profile': '/register/public-profile',
        plan: '/register/subscription',
        subscription: '/register/subscription',
    }

    const baseRoute = stepRoutes[step] || '/register/account-type'

    if (step === 'company-details' && substep) {
        const substepRoutes: Record<string | number, string> = {
            1: '/profile',
            2: '/detailed',
            3: '/address',
            4: '/topics',
            5: '/contacts',
            6: '/banks',
        }

        const substepPath = substepRoutes[substep]
        if (substepPath) {
            return baseRoute + substepPath
        }
    }

    return baseRoute
}

export const mapApiStepToStoreKey = (apiStep: string): string | null => {
    const mapping: Record<string, string> = {
        'account-type': 'accountType',
        'personal-info': 'personalInfo',
        'email-verification': 'emailVerification',
        'company-details': 'companyDetails',
        'factory-details': 'productionDetails',
        'production-details': 'productionDetails',
        'export-details': 'exportDetails',
        certificates: 'companyCertificates',
        'company-certificates': 'companyCertificates',
        'business-certificates': 'generalCertificates',
        'general-certificates': 'generalCertificates',
        'profile-media': 'publicProfile',
        'public-profile': 'publicProfile',
        plan: 'plan',
        subscription: 'plan',
    }

    return mapping[apiStep] || null
}
