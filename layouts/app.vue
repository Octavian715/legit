<template>
    <div :class="['layout', { 'layout--extend': !isCollapseSideBar }]">
        <ClientOnly>
            <div v-if="!isMobile" class="layout__sidebar">
                <AppSideBar @open-invite="handleInvitation" />
            </div>
        </ClientOnly>

        <div class="layout__topbar">
            <AppHeaderDashboard @open-invite="handleInvitation" />
        </div>

        <div ref="contentRef" class="layout__content">
            <main class="layout__main">
                <NuxtPage />
            </main>
        </div>

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
    import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
    import { useGlobalStore } from '~/stores/global'
    import { useModalStore } from '~/stores/modal'
    import { useUserStore } from '~/stores/user'
    import { storeToRefs } from 'pinia'
    import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'
    import { useUpgradeModal } from '~/composables/useUpgradeModal'
    import { useStaticData } from '~/composables/useStaticData'

    const globalStore = useGlobalStore()
    const modalStore = useModalStore()
    const userStore = useUserStore()
    const route = useRoute()
    const router = useRouter()
    const localePath = useLocalePath()
    const { t } = useI18n()
    const { $initializeNotifications, $isNotificationsInitialized } = useNuxtApp()

    const { isCollapseSideBar } = storeToRefs(globalStore)

    // Static data
    const { userPlans } = useStaticData()

    // Upgrade Modal State
    const {
        isModalOpen: isUpgradeModalOpen,
        requestedFeature,
        closeUpgradeModal,
    } = useUpgradeModal()

    const breakpoints = useBreakpoints(breakpointsTailwind)
    const isMobile = breakpoints.smaller('sm')
    const isMounted = ref(false)
    const contentRef = ref<HTMLElement | null>(null)

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

    const handleInvitation = () => {
        const InvitePartnerTypeModal = defineAsyncComponent(
            () => import('~/components/shared/modals/InvitePartnerTypeModal.vue')
        )

        modalStore.openModal(
            InvitePartnerTypeModal,
            'invite-partner-type',
            {},
            {
                title: t('navigation.invitePartener'),
                hideFooter: true,
                contentWidth: 'max-w-sm sm:max-w-2xl',
            }
        )
    }

    const handlePlanSelect = async (planId: number) => {
        try {
            const { success: successToast, error: errorToast } = useToastNotification()

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
                console.error('[App Layout] Plan change failed:', userStore.userFetchError)
                const errorMessage =
                    userStore.userFetchError?.message || t('error') || 'An error occurred'
                errorToast(errorMessage, t('error') || 'Error')
            }
        } catch (error) {
            console.error('[App Layout] Plan change error:', error)
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
                        console.error('[App Layout] Notifications initialization failed:', error)
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
        isMounted.value = true

        // Initialize app only on client after mount
        if (userStore.isAuthenticated && userStore.isRegistrationComplete && userStore.isVerified) {
            try {
                await initializeApp()
            } catch (error) {
                console.error('[App Layout] App initialization failed:', error)
            }
        }
    })
</script>

<style scoped lang="scss">
    .layout {
        @apply h-screen bg-gray-200 transition-all duration-300 max-h-screen;
        @apply flex flex-col overflow-hidden;

        @screen sm {
            display: grid;
            grid-template-columns: minmax(280px, 15%) 1fr;
            grid-template-rows: auto 1fr;
        }

        &--extend {
            @screen sm {
                @apply grid-cols-[80px_1fr];
            }
        }

        &__sidebar {
            @apply transition-all duration-300;

            @screen sm {
                @apply row-span-2 overflow-y-auto;
            }
        }

        &__topbar {
            @apply z-10 flex-shrink-0 sticky top-0 bg-white shadow-sm;

            @screen sm {
                @apply col-start-2 col-span-1 row-start-1;
            }
        }

        &__content {
            @apply flex-1 overflow-x-hidden py-5 px-6 overflow-y-auto transition-all duration-300;

            @screen sm {
                @apply col-start-2 col-span-1 row-start-2;
            }
        }

        &__main {
            @apply w-full h-full;
        }
    }

    @media (min-width: 640px) and (max-width: 1023px) {
        .layout {
            display: grid;
            grid-template-columns: minmax(230px, 12%) 1fr;
            grid-template-rows: auto 1fr;
        }

        .layout--extend {
            grid-template-columns: 80px 1fr;
        }

        .layout__sidebar {
            grid-row: 1 / 3;
            grid-column: 1;
        }

        .layout__topbar {
            grid-row: 1;
            grid-column: 2;
        }

        .layout__content {
            grid-row: 2;
            grid-column: 2;
        }
    }
</style>
