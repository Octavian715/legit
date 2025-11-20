// composables/usePasswordResetNavigation.ts
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLocalePath } from '#imports'

export const usePasswordResetNavigation = () => {
    const route = useRoute()
    const router = useRouter()
    const localePath = useLocalePath()

    // Flow detection
    const isPasswordResetFlow = computed(() => route.path.startsWith('/auth/'))

    // Current step detection (without confirm-code)
    const currentStep = computed(() => {
        const path = route.path

        if (path.includes('/auth/forgot-password')) {
            return 'forgot-password'
        }

        if (path.includes('/auth/reset-password')) {
            return 'reset-password'
        }

        return null
    })

    // Step definitions (excluded confirm-code step)
    const steps = [
        {
            key: 'forgot-password',
            path: '/auth/forgot-password',
            title: 'auth.recoverPassword',
            subtitle: 'auth.enterEmailToRecover',
            canGoBack: false,
        },
        {
            key: 'reset-password',
            path: '/auth/reset-password',
            title: 'auth.setNewPassword',
            subtitle: 'auth.chooseNewPassword',
            canGoBack: true,
        },
    ]

    // Current step index
    const currentStepIndex = computed(() => {
        const stepKey = currentStep.value
        return steps.findIndex((step) => step.key === stepKey)
    })

    // Current step data
    const currentStepData = computed(() => {
        const index = currentStepIndex.value
        return index !== -1 ? steps[index] : null
    })

    // Navigation capabilities
    const canGoBack = computed(() => {
        return currentStepData.value?.canGoBack ?? false
    })

    const canGoForward = computed(() => {
        return currentStepIndex.value < steps.length - 1
    })

    const isFirstStep = computed(() => {
        return currentStepIndex.value === 0
    })

    const isLastStep = computed(() => {
        return currentStepIndex.value === steps.length - 1
    })

    // Navigation methods
    const goBack = async (): Promise<void> => {
        if (!canGoBack.value) return

        const currentIndex = currentStepIndex.value
        if (currentIndex > 0) {
            const prevStep = steps[currentIndex - 1]
            await router.push(localePath(prevStep.path))
        }
    }

    const goToStep = async (stepKey: string): Promise<void> => {
        const step = steps.find((s) => s.key === stepKey)
        if (step) {
            await router.push(localePath(step.path))
        }
    }

    const goToLogin = async (): Promise<void> => {
        await router.push(localePath('/login'))
    }

    // Progress calculation
    const progress = computed(() => {
        const total = steps.length
        const current = Math.max(0, currentStepIndex.value)
        return {
            current: current + 1,
            total,
            percentage: Math.round(((current + 1) / total) * 100),
        }
    })

    // Navigation helpers
    const getBackPath = (): string => {
        const currentIndex = currentStepIndex.value
        if (currentIndex > 0) {
            return steps[currentIndex - 1].path
        }
        return '/login'
    }

    const getNextPath = (): string => {
        const currentIndex = currentStepIndex.value
        if (currentIndex < steps.length - 1) {
            return steps[currentIndex + 1].path
        }
        return '/login'
    }

    // Step validation
    const isValidStep = (stepKey: string): boolean => {
        return steps.some((step) => step.key === stepKey)
    }

    const isCurrentStep = (stepKey: string): boolean => {
        return currentStep.value === stepKey
    }

    // Handle successful step completion (without confirm-code)
    const handleStepSuccess = async (stepKey: string): Promise<void> => {
        switch (stepKey) {
            case 'forgot-password':
                // After successful email sent, go directly to reset password
                await goToStep('reset-password')
                break

            case 'reset-password':
                // After successful password reset, go to login
                await goToLogin()
                break
        }
    }

    // Handle errors
    const handleStepError = (stepKey: string, error: any): void => {
        // For password reset flow, errors are handled by individual pages
        // This is mainly for future extensions
        console.error(`Error in step ${stepKey}:`, error)
    }

    return {
        // State
        isPasswordResetFlow,
        currentStep,
        currentStepIndex,
        currentStepData,
        steps,

        // Navigation capabilities
        canGoBack,
        canGoForward,
        isFirstStep,
        isLastStep,

        // Progress
        progress,

        // Navigation methods
        goBack,
        goToStep,
        goToLogin,

        // Helpers
        getBackPath,
        getNextPath,
        isValidStep,
        isCurrentStep,

        // Event handlers
        handleStepSuccess,
        handleStepError,
    }
}
