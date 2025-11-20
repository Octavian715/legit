<template>
    <div class="layout">
        <div class="layout__header">
            <AppHeader />
            <DesktopMenu />
        </div>

        <div ref="contentRef" class="layout__content">
            <main class="container mx-auto py-5">
                <NuxtPage />
            </main>
        </div>

        <CartWidget />

        <!-- Upgrade/Plan Selection Modal -->
        <Teleport to="body">
            <div
                v-if="isUpgradeModalOpen"
                class="fixed inset-0 z-[999] flex items-center justify-center bg-white/80 backdrop-blur p-4"
                @click.self="closeUpgradeModal"
            >
                <PlanSelectionModal
                    :available-plans="availablePlansForModal"
                    :current-plan-id="currentPlanId"
                    :user-role="primaryRole || 'buyer'"
                    :is-referral-user="isReferralUser"
                    :requested-feature="requestedFeature"
                    @select="handlePlanSelect"
                    @cancel="closeUpgradeModal"
                />
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, onUnmounted } from 'vue'
    import { useUserStore } from '~/stores/user'
    import { useUpgradeModal } from '~/composables/useUpgradeModal'
    import { useStaticData } from '~/composables/useStaticData'
    import { useToastNotification } from '~/composables/useToastNotification'

    const userStore = useUserStore()
    const route = useRoute()
    const router = useRouter()
    const localePath = useLocalePath()
    const { t } = useI18n()
    const { $initializeNotifications, $isNotificationsInitialized } = useNuxtApp()
    const contentRef = ref<HTMLElement | null>(null)

    // Static data
    const { userPlans } = useStaticData()

    // Upgrade Modal State
    const {
        isModalOpen: isUpgradeModalOpen,
        requestedFeature,
        closeUpgradeModal,
    } = useUpgradeModal()
    const { success: successToast, error: errorToast } = useToastNotification()

    // User data for modal
    const primaryRole = computed(() => userStore.primaryRole)
    const currentPlanId = computed(() => userStore.currentPlan?.plan?.id || null)
    const isReferralUser = computed(() => !!userStore.currentPlan?.referral)

    // Available plans for modal - ALL ACTIVE PLANS from static data
    const availablePlansForModal = computed(() => {
        // Return ALL active plans - PlanSelectionModal will filter by role
        return userPlans.value.filter((plan) => plan.is_active)
    })

    /**
     * Handle ESC key to close modal
     */
    const handleEscapeKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && isUpgradeModalOpen.value) {
            closeUpgradeModal()
        }
    }

    // Watch modal state to add/remove ESC listener
    watch(
        () => isUpgradeModalOpen.value,
        (isOpen) => {
            if (import.meta.client) {
                if (isOpen) {
                    // Add ESC listener when modal opens
                    document.addEventListener('keydown', handleEscapeKey)
                } else {
                    // Remove ESC listener when modal closes
                    document.removeEventListener('keydown', handleEscapeKey)
                }
            }
        }
    )

    // Cleanup on unmount
    onUnmounted(() => {
        if (import.meta.client) {
            document.removeEventListener('keydown', handleEscapeKey)
        }
    })

    const handlePlanSelect = async (planId: number) => {
        try {
            // Call changePlan from userStore
            const success = await userStore.changePlan(planId)

            if (success) {
                // ✅ CRITICAL: Force fetch without skipping (false = always fetch)
                await userStore.fetchUser(false)

                // ✅ Extra delay to ensure backend has fully processed
                await new Promise((resolve) => setTimeout(resolve, 300))
                // Additional tick for deep reactive updates
                await nextTick()

                // Close modal
                closeUpgradeModal()

                // Show success toast
                successToast(
                    t('subscription.planChangeSuccess') || 'Plan changed successfully!',
                    t('subscription.planChangeSuccessMessage') ||
                        'Your subscription has been updated.'
                )
            } else {
                console.error('[Default Layout] Plan change failed:', userStore.userFetchError)
                const errorMessage =
                    userStore.userFetchError?.message || t('error') || 'An error occurred'
                errorToast(errorMessage, t('error') || 'Error')
            }
        } catch (error) {
            console.error('[Default Layout] Plan change error:', error)
            const { error: errorToast } = useToastNotification()
            errorToast(
                t('subscription.planChangeError') || 'Failed to change plan',
                t('error') || 'Error'
            )
        }
    }

    const { initializeApp, reinitializeOnAuthChange } = useAppInitialization()

    if (process.client && $initializeNotifications) {
        watch(
            () => userStore.isAuthenticated,
            async (isAuth) => {
                if (isAuth && userStore.isRegistrationComplete && userStore.isVerified) {
                    try {
                        if (!$isNotificationsInitialized()) {
                            await $initializeNotifications()
                        }
                    } catch (error) {
                        console.error(
                            '[Default Layout] Notifications initialization failed:',
                            error
                        )
                    }
                }
            },
            { immediate: true }
        )
    }

    watch(() => userStore.isAuthenticated, reinitializeOnAuthChange)

    watch(
        () => route.path,
        async () => {
            if (process.client) {
                await nextTick()
                if (contentRef.value) {
                    contentRef.value.scrollTop = 0
                }
            }
        },
        { flush: 'post' }
    )

    onMounted(async () => {
        // Initialize app only on client after mount
        if (userStore.isAuthenticated && userStore.isRegistrationComplete && userStore.isVerified) {
            try {
                await initializeApp()
            } catch (error) {
                console.error('[Default Layout] App initialization failed:', error)
            }
        }
    })
</script>

<style scoped lang="scss">
    .layout {
        @apply h-screen flex flex-col overflow-hidden bg-gray-200;

        &__header {
            @apply flex-shrink-0 sticky top-0 z-40 bg-white shadow-sm;
        }

        &__content {
            @apply block flex-1 overflow-y-auto overflow-x-hidden;
        }
    }
</style>
