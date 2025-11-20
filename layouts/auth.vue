<!-- layouts/auth.vue -->
<template>
    <div class="auth-layout-wrapper w-full h-screen relative">
        <!-- Background Image -->
        <div
            class="absolute inset-0 bg-lemarkt bg-contain bg-no-repeat bg-right-top bg-fixed -z-50 opacity-5 bg-clip-content"
        ></div>

        <!-- Main Container -->
        <div
            class="flex justify-center items-center flex-col max-w-screen-lg h-full py-20 container mx-auto"
        >
            <!-- Header Section -->
            <header v-if="!invalidRoutes.includes(route.path)" class="space-y-8 w-full mb-8 px-4">
                <!-- Logo -->
                <NuxtLink
                    class="flex justify-center items-center w-fit mx-auto"
                    :to="localePath(logoLinkPath)"
                >
                    <svg class="h-10 w-[230px] active:scale-95 transition-all duration-300">
                        <use xlink:href="/sprite.svg#logo_lg"></use>
                    </svg>
                </NuxtLink>

                <!-- Header Controls -->
                <div v-if="!isSubmitting" class="flex justify-between items-center w-full">
                    <!-- Back Button -->
                    <ButtonIcon
                        v-if="shouldShowBackButton"
                        v-tooltip="t('auth.back')"
                        :aria-labelledby="'back'"
                        icon="a_left"
                        size="lg"
                        icon-size="lg"
                        color="black"
                        variant="ghost"
                        @click="handleGoBack"
                    />
                    <div v-else class="w-12"></div>

                    <!-- Title Section -->
                    <div
                        v-if="!invalidTitleRoutes.includes(route.path)"
                        class="flex flex-col justify-center items-center gap-1"
                    >
                        <h1 class="text-title1 text-gray-950">
                            {{ getPageTitle() }}
                        </h1>
                        <p v-if="getPageSubtitle()" class="text-subtitle2 text-gray-800">
                            {{ getPageSubtitle() }}
                        </p>
                    </div>

                    <!-- Close Button -->
                    <ButtonClose
                        v-tooltip="t('close')"
                        :aria-labelledby="'close'"
                        size="lg"
                        icon-size="lg"
                        @click="handleClose"
                    />
                </div>

                <!-- Steps Component -->
                <div v-if="!isSubmitting && shouldShowSteps" class="w-full h-full sm:px-32">
                    <Steps
                        :steps="currentPhaseSteps"
                        :active-step="currentActiveStepIndex"
                        class="py-8 md:my-0"
                    />
                </div>
            </header>

            <!-- Main Content -->
            <Suspense>
                <template #default>
                    <Transition
                        :name="transitionName"
                        mode="out-in"
                        @before-enter="onBeforeEnter"
                        @enter="onEnter"
                        @leave="onLeave"
                    >
                        <main
                            :key="routeKey"
                            class="transition-wrapper w-full flex justify-center px-4"
                        >
                            <NuxtPage />
                        </main>
                    </Transition>
                </template>

                <template #fallback>
                    <main class="transition-wrapper w-full flex justify-center px-4">
                        <div class="flex justify-center items-center p-8">
                            <span class="loading-spinner"></span>
                        </div>
                    </main>
                </template>
            </Suspense>
        </div>

        <!-- Exit Confirmation Modal -->
        <ExitConfirmationModal
            v-model:is-open="showExitModal"
            :modal-title="modalConfiguration.title"
            :modal-message="modalConfiguration.message"
            :ok-text="modalConfiguration.okText"
            @update:is-open="showExitModal = $event"
            @confirm="handleModalConfirm"
            @cancel="handleExitCancel"
        />
    </div>
</template>

<script setup lang="ts">
    import { useRegistrationNavigation } from '~/useRegistrationNavigation'

    const route = useRoute()
    const router = useRouter()
    const { t } = useI18n()
    const localePath = useLocalePath()
    const userStore = useUserStore()
    const modalStore = useModalStore()

    // Use the refactored navigation composable (only for registration)

    // Get registration data when available
    const store = computed(() => registrationNavigation.value?.store)
    const formData = computed(() => store.value?.formData)
    const cookieUser = useCookie('account_type')

    const accountType = computed(() => {
        return formData.value?.accountType?.type || cookieUser?.value?.type || userStore.isSupplier
            ? 'supplier'
            : 'buyer'
    })

    // Flow detection
    const isRegistrationFlow = computed(() => route.path.startsWith('/register'))
    const isPasswordResetFlow = computed(() => route.path.startsWith('/auth/'))
    const isLoginFlow = computed(() => route.path === localePath('/login'))
    const registrationNavigation = computed(() => registrationNav)

    const registrationNav = isRegistrationFlow.value ? useRegistrationNavigation() : null

    const invalidRoutes = ['/login']
    const invalidTitleRoutes = ['/auth/forgot-password', '/auth/reset-password']

    // Modal state
    const showExitModal = ref(false)

    // Transition state management
    const currentStepIndex = ref<number>(0)
    const transitionDirection = ref<'forward' | 'backward'>('forward')
    const isSubmitting = ref(false)

    // Use a stable route key that doesn't cause hydration issues
    const routeKey = computed(() => route.path)

    // Logo link path based on flow
    const logoLinkPath = computed(() => {
        if (isPasswordResetFlow.value) {
            return '/login'
        }
        return '/login'
    })

    const modalConfiguration = computed(() => {
        if (isRegistrationFlow.value) {
            // Phase 1: Before email confirmation
            if (currentRegistrationPhase.value === 'phase1') {
                return {
                    title: t('modal.exitRegistration.title', 'Exit Registration?'),
                    message: t(
                        'modal.exitRegistration.messagePhase1',
                        'Are you sure you want to exit registration? You can continue later from where you left off.'
                    ),
                    okText: t('modal.exitRegistration.exit', 'Exit Registration'),
                    isLogout: false,
                }
            }
            // Phase 2: After email confirmation - OK button says "Logout"
            else if (currentRegistrationPhase.value === 'phase2') {
                return {
                    title: t('modal.exitRegistration.title', 'Exit Registration?'),
                    message: t(
                        'modal.exitRegistration.messagePhase2',
                        'You can continue your registration later. Your progress will be saved.'
                    ),
                    okText: t('auth.logout', 'Logout'),
                    isLogout: true,
                }
            }
        }

        // Default configuration for other flows
        return {
            title: t('modal.exitAuth.title', 'Exit Password Reset?'),
            message: t('modal.exitAuth.message', 'Are you sure you want to exit?'),
            okText: t('modal.exitAuth.exit', 'Exit'),
            isLogout: false,
        }
    })

    // Current registration phase detection
    const currentRegistrationPhase = computed(() => {
        const path = route.path

        // Phase 1: Pre-email confirmation
        const phase1Paths = [
            '/register/account-type',
            '/register/personal-info',
            '/register/email-confirmation-success',
            '/register/confirm',
        ]

        // Phase 2: Post-email confirmation
        const phase2Paths = [
            '/register/company-details',
            '/register/production-details',
            '/register/export-details',
            '/register/company-certificates',
            '/register/business-certificates',
            '/register/public-profile',
        ]

        if (phase1Paths.some((p) => path.includes(p))) {
            return 'phase1'
        } else if (phase2Paths.some((p) => path.includes(p))) {
            return 'phase2'
        }

        return 'phase1' // Default to phase 1
    })

    // Show steps component only for registration pages (excluding special pages)
    const shouldShowSteps = computed(() => {
        if (!isRegistrationFlow.value) return false

        const currentPath = route.path
        const hideStepsPaths = ['/register/confirm', '/register/email-confirmation-success']

        return !hideStepsPaths.some((path) => currentPath.includes(path))
    })

    // Get steps for current phase only
    const currentPhaseSteps = computed(() => {
        if (!shouldShowSteps.value) return []

        const accountType =
            registrationNavigation.value?.getStepData('accountType')?.type ||
            (userStore.isSupplier ? 'supplier' : userStore.isBuyer ? 'buyer' : 'service_provider')

        if (currentRegistrationPhase.value === 'phase1') {
            return [
                {
                    id: 1,
                    key: 'account-type',
                    title: t('register.accountType', 'Account Type'),
                    description: 'Choose your account type',
                    paths: ['/register/account-type'],
                },
                {
                    id: 2,
                    key: 'personal-info',
                    title: t('register.personalInfo', 'Personal Info'),
                    description: 'Your personal information',
                    paths: ['/register/personal-info'],
                },
            ]
        } else if (currentRegistrationPhase.value === 'phase2') {
            return getPhase2Steps(accountType)
        }

        return []
    })

    const handleModalConfirm = async () => {
        if (currentRegistrationPhase.value === 'phase2') {
            await handleLogout()
        } else {
            await handleExitConfirm()
        }
    }

    const getPhase2Steps = (accountType: string) => {
        const baseSteps = [
            {
                id: 1,
                key: 'company-details',
                title: t('register.companyDetails', 'Company Details'),
                description: 'Company information',
                paths: [
                    '/register/company-details/profile',
                    '/register/company-details/detailed',
                    '/register/company-details/address',
                    '/register/company-details/topics',
                    '/register/company-details/contacts',
                    '/register/company-details/banks',
                ],
            },
        ]

        if (accountType === 'supplier' || (userStore.user && userStore.isSupplier)) {
            return [
                ...baseSteps,
                {
                    id: 2,
                    key: 'production-details',
                    title: t('register.production', 'Production'),
                    description: 'Production details',
                    paths: ['/register/production-details'],
                },
                {
                    id: 3,
                    key: 'export-details',
                    title: t('register.export', 'Export'),
                    description: 'Export information',
                    paths: ['/register/export-details'],
                },
                {
                    id: 4,
                    key: 'certificates',
                    title: t('register.certificates', 'Certificates'),
                    description: 'Upload certificates',
                    paths: ['/register/company-certificates', '/register/business-certificates'],
                },
            ]
        } else {
            // Buyer and Service Provider
            return [
                ...baseSteps,
                {
                    id: 2,
                    key: 'certificates',
                    title: t('register.certificates', 'Certificates'),
                    description: 'Upload certificates',
                    paths: ['/register/company-certificates', '/register/business-certificates'],
                },
            ]
        }
    }

    // Use registration store's current step index
    const currentActiveStepIndex = computed(() => {
        if (!shouldShowSteps.value || !registrationNavigation.value) return 0

        // Sync the registration store with current path
        if (registrationNavigation.value.store?.syncStepWithPath) {
            registrationNavigation.value.store.syncStepWithPath(route.path)
        }

        const currentPath = route.path
        const storeCurrentStep = registrationNavigation.value.currentStep

        if (currentRegistrationPhase.value === 'phase1') {
            if (
                storeCurrentStep?.key === 'accountType' ||
                currentPath.includes('/register/account-type')
            )
                return 0
            if (
                storeCurrentStep?.key === 'personalInfo' ||
                currentPath.includes('/register/personal-info')
            )
                return 1
            return 0
        } else if (currentRegistrationPhase.value === 'phase2') {
            if (currentPath.includes('/register/company-details')) return 0
            if (currentPath.includes('/register/production-details')) return 1
            if (currentPath.includes('/register/export-details')) return 2
            if (
                currentPath.includes('/register/company-certificates') ||
                currentPath.includes('/register/business-certificates')
            )
                return 3
            if (currentPath.includes('/register/public-profile')) return 4
            return 0
        }

        return 0
    })

    // Navigation logic
    const canGoBack = computed(() => {
        if (isRegistrationFlow.value) {
            return registrationNavigation.value?.canGoBack ?? false
        }

        if (isPasswordResetFlow.value) {
            return getPasswordResetCanGoBack()
        }

        return false
    })

    const getPasswordResetCanGoBack = (): boolean => {
        return true
    }

    const getPasswordResetBackPath = (): string => {
        const currentPath = route.path

        if (currentPath.includes('/auth/reset-password')) {
            return '/auth/forgot-password'
        }

        return '/auth/forgot-password'
    }

    // Page title based on flow
    const getPageTitle = (): string => {
        if (isRegistrationFlow.value) {
            return t('register.message', 'Create Account')
        }

        if (isPasswordResetFlow.value) {
            const currentPath = route.path

            if (currentPath.includes('/auth/forgot-password')) {
                return t('auth.recoverPassword', 'Recover Password')
            }

            if (currentPath.includes('/auth/reset-password')) {
                return t('auth.setNewPassword', 'Set New Password')
            }
        }

        return t('auth.login', 'Login')
    }

    // Page subtitle
    const getPageSubtitle = (): string => {
        if (isRegistrationFlow.value && registrationNavigation.value) {
            const { currentStep, isFirstStep } = registrationNavigation.value
            const accountType = formData.value?.accountType?.type

            if (currentStep && !isFirstStep && accountType) {
                return t('register.asUser', { user: t(accountType) })
            }
        }

        if (isPasswordResetFlow.value) {
            const currentPath = route.path

            if (currentPath.includes('/auth/reset-password')) {
                return t('auth.chooseNewPassword', 'Choose your new password')
            }
        }

        return ''
    }

    // Enhanced transition name with direction detection
    const transitionName = computed(() => {
        const direction = transitionDirection.value

        if (isRegistrationFlow.value || isPasswordResetFlow.value || isLoginFlow.value) {
            return `step-${direction}`
        }

        return 'fade'
    })

    // Helper function to determine if back button should be shown
    const shouldShowBackButton = computed(() => {
        if (!isRegistrationFlow.value) return false

        const currentPath = route.path

        const noBackPaths = [
            '/register/account-type',
            '/register/confirm',
            '/register/email-confirmation-success',
            '/register/company-details/profile',
        ]

        const isNoBackPath = noBackPaths.some(
            (path) => currentPath === path || currentPath.includes(path)
        )

        return !isNoBackPath && canGoBack.value
    })

    // Transition event handlers
    const onBeforeEnter = (el: Element) => {
        // Clean transition setup
    }

    const onEnter = (el: Element, done: () => void) => {
        const direction = transitionDirection.value === 'forward' ? '50px' : '-50px'
        if (process.client) {
            document.documentElement.style.setProperty('--slide-direction', direction)
        }

        requestAnimationFrame(() => {
            done()
        })
    }

    const onLeave = (el: Element, done: () => void) => {
        requestAnimationFrame(() => {
            done()
        })
    }

    // Navigation handlers
    const handleGoBack = async () => {
        if (!canGoBack.value) return

        transitionDirection.value = 'backward'

        if (isRegistrationFlow.value && registrationNavigation.value) {
            const currentPath = route.path

            try {
                const noBackPaths = [
                    '/register/account-type',
                    '/register/confirm',
                    '/register/email-confirmation-success',
                    '/register/company-details/profile',
                ]

                const isNoBackPath = noBackPaths.some(
                    (path) => currentPath === path || currentPath.includes(path)
                )

                if (isNoBackPath) {
                    return
                }

                // Handle phase 1 navigation
                if (currentRegistrationPhase.value === 'phase1') {
                    if (currentPath.includes('/register/personal-info')) {
                        await router.push(localePath('/register/account-type'))
                    }
                    return
                }

                // Handle phase 2 navigation
                if (currentPath.includes('/register/company-details/')) {
                    const substepPath = currentPath.split('/').pop()

                    switch (substepPath) {
                        case 'detailed':
                            await router.push(localePath('/register/company-details/profile'))
                            break
                        case 'address':
                            await router.push(localePath('/register/company-details/detailed'))
                            break
                        case 'topics':
                            await router.push(localePath('/register/company-details/address'))
                            break
                        case 'contacts':
                            await router.push(localePath('/register/company-details/topics'))
                            break
                        case 'banks':
                            await router.push(localePath('/register/company-details/contacts'))
                            break
                        default:
                            await router.push(localePath('/register/company-details/profile'))
                    }
                } else if (currentPath.includes('/register/production-details')) {
                    await router.push(localePath('/register/company-details/banks'))
                } else if (currentPath.includes('/register/export-details')) {
                    await router.push(localePath('/register/production-details'))
                } else if (currentPath.includes('/register/company-certificates')) {
                    const accountType =
                        registrationNavigation.value.getStepData('accountType')?.type

                    if (accountType === 'supplier') {
                        await router.push(localePath('/register/export-details'))
                    } else {
                        await router.push(localePath('/register/company-details/banks'))
                    }
                } else if (currentPath.includes('/register/business-certificates')) {
                    await router.push(localePath('/register/company-certificates'))
                } else if (currentPath.includes('/register/public-profile')) {
                    await router.push(localePath('/register/business-certificates'))
                } else {
                    if (registrationNavigation.value.canGoBack) {
                        await registrationNavigation.value.goBack()
                    }
                }
            } catch (error) {
                console.error('[Navigation] Back navigation error:', error)
            }
        } else if (isPasswordResetFlow.value) {
            const backPath = getPasswordResetBackPath()
            await router.push(localePath(backPath))
        }
    }

    // Modal handlers
    const handleClose = () => {
        if (modalStore.isOpen && modalStore.modalType === 'verificationSuccess') {
            return // Ignore click
        }
        showExitModal.value = true
    }

    const handleExitConfirm = async () => {
        if (!showExitModal.value) return

        try {
            showExitModal.value = false
            transitionDirection.value = 'backward'
            await router.push(localePath('/login'))
        } catch (error) {
            console.error('[Layout] Navigation error:', error)
            if (process.client) {
                window.location.href = '/login'
            }
        }
    }

    const handleLogout = async () => {
        try {
            showExitModal.value = false

            await userStore.logout()

            await router.push(localePath('/login'))
        } catch (error) {
            console.error('[Layout] Logout error:', error)
            if (process.client) {
                window.location.href = '/login'
            }
        }
    }

    const handleExitCancel = () => {
        if (showExitModal.value) {
            showExitModal.value = false
        }
    }

    // Enhanced route watching with transition detection
    watch(
        () => route.path,
        (newPath, oldPath) => {
            // Handle transition to login page
            if (newPath === localePath('/login')) {
                transitionDirection.value = 'backward'
                return
            }

            // Set backward direction when leaving auth or registration flows
            if (
                (oldPath?.startsWith('/register') && !newPath.startsWith('/register')) ||
                (oldPath?.startsWith('/auth/') && !newPath.startsWith('/auth/'))
            ) {
                transitionDirection.value = 'backward'
                return
            }

            // Handle password reset flow transitions
            if (newPath.startsWith('/auth/') && oldPath?.startsWith('/auth/')) {
                const newStep = newPath.split('/').pop()
                const oldStep = oldPath.split('/').pop()

                const stepOrder = ['forgot-password', 'reset-password']
                const newIndex = stepOrder.indexOf(newStep || '')
                const oldIndex = stepOrder.indexOf(oldStep || '')

                if (newIndex !== -1 && oldIndex !== -1) {
                    transitionDirection.value = newIndex > oldIndex ? 'forward' : 'backward'
                }
                return
            }

            // For registration flows, determine direction based on step progression
            if (newPath.startsWith('/register/') && oldPath?.startsWith('/register/')) {
                const steps = currentPhaseSteps.value
                const newStepIndex = currentActiveStepIndex.value

                const oldStepIndex = steps.findIndex((step) =>
                    step.paths.some((path) => oldPath.includes(path))
                )

                if (newStepIndex !== -1 && oldStepIndex !== -1 && newStepIndex !== oldStepIndex) {
                    transitionDirection.value = newStepIndex > oldStepIndex ? 'forward' : 'backward'
                }
            }
        },
        { immediate: false }
    )

    watch(
        () => route.path,
        () => {
            // Force reactivity update for step index
            if (isRegistrationFlow.value && registrationNavigation.value?.store?.syncStepWithPath) {
                registrationNavigation.value.store.syncStepWithPath(route.path)
            }
        },
        { immediate: true }
    )

    watch(
        () => route.path,
        async () => {
            if (process.client) {
                await nextTick()
                window.scrollTo({ top: 0, left: 0 })
            }
        },
        { flush: 'post' }
    )

    // Initialize on mount
    onMounted(() => {
        if (isRegistrationFlow.value && registrationNavigation.value) {
            currentStepIndex.value = currentActiveStepIndex.value
        }
    })
</script>

<style scoped>
    /* Additional transition styles specific to auth layout */
    main {
        position: relative;
    }

    /* Ensure smooth transitions on mobile */
    @media (max-width: 768px) {
        main {
            min-height: 400px;
        }
    }

    /* Step transitions */
    .step-forward-enter-active,
    .step-forward-leave-active,
    .step-backward-enter-active,
    .step-backward-leave-active {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .step-forward-enter-from {
        opacity: 0;
        transform: translateX(50px);
    }

    .step-forward-leave-to {
        opacity: 0;
        transform: translateX(-50px);
    }

    .step-backward-enter-from {
        opacity: 0;
        transform: translateX(-50px);
    }

    .step-backward-leave-to {
        opacity: 0;
        transform: translateX(50px);
    }

    /* Fade transitions */
    .fade-enter-active,
    .fade-leave-active {
        transition: opacity 0.3s ease;
    }

    .fade-enter-from,
    .fade-leave-to {
        opacity: 0;
    }

    /* Loading spinner */
    .loading-spinner {
        @apply w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin;
    }
</style>
