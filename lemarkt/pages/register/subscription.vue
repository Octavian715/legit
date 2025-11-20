<!-- ~/pages/register/subscription.vue -->
<template>
    <div class="flex flex-col h-full">
        <!-- Scrollable Content Area -->
        <div class="flex-1 overflow-y-auto">
            <!-- Plans Grid -->
            <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <!-- Loading State -->
                <div v-if="isLoadingPlans" class="flex justify-center items-center py-12">
                    <div
                        class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"
                    ></div>
                </div>

                <!-- Flex Layout for 1-2 Plans (Centered) -->
                <div
                    v-else-if="useFlexLayout && displayPlans.length > 0"
                    class="flex gap-8 max-w-6xl mx-auto"
                    :class="flexClasses"
                >
                    <PlanCard
                        v-for="plan in displayPlans"
                        :key="plan.id"
                        :plan="plan"
                        :is-selected="selectedPlanId === plan.id"
                        :is-current="currentPlanId === plan.id"
                        :button-label="getButtonLabel(plan)"
                        :disabled="isProcessingSubscription"
                        class="w-full md:max-w-md"
                        @select-plan="selectPlan"
                    />
                </div>

                <!-- Grid Layout for 3+ Plans -->
                <div
                    v-else-if="!useFlexLayout && displayPlans.length > 0"
                    class="grid grid-cols-1 gap-8 items-stretch max-w-6xl mx-auto"
                    :class="gridClasses"
                >
                    <PlanCard
                        v-for="plan in displayPlans"
                        :key="plan.id"
                        :plan="plan"
                        :is-selected="selectedPlanId === plan.id"
                        :is-current="currentPlanId === plan.id"
                        :button-label="getButtonLabel(plan)"
                        :disabled="isProcessingSubscription"
                        @select-plan="selectPlan"
                    />
                </div>

                <!-- No Plans State -->
                <div v-else class="text-center py-12">
                    <p class="text-subtitle1 text-gray-800">
                        {{ $t('settings.subscription.noActiveSubscription') }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, ref, onMounted } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useLocalePath } from '#imports'
    import { useModalStore } from '~/stores/modal'
    import { useUserStore } from '~/stores/user'
    import { useRegistrationStore } from '~/stores/register'
    import { useStaticData } from '~/composables/useStaticData'
    import { useToastNotification } from '~/composables/useToastNotification'
    import type { PlanCard as PlanCardType } from '~/types/ui/planCard'

    // Layout
    definePageMeta({
        layout: 'empty',
        middleware: ['registration'],
    })

    // Meta and SEO
    useSeoMeta({
        title: 'Choose Your Plan - LeMarkt',
        ogTitle: 'Choose Your Plan - LeMarkt',
        description:
            'Select the perfect subscription plan for your business needs. Compare features and pricing.',
        ogDescription:
            'Select the perfect subscription plan for your business needs. Compare features and pricing.',
    })

    const { t } = useI18n()
    const modalStore = useModalStore()
    const userStore = useUserStore()
    const router = useRouter()
    const localePath = useLocalePath()
    const { success: successToast, error: errorToast } = useToastNotification()
    const { userPlans, activePlanOptions, isLoading: isLoadingStaticData } = useStaticData()

    // Reactive state
    const selectedPlanId = ref<number | null>(null)
    const isProcessingSubscription = ref(false)

    // Get user data
    const user = computed(() => userStore.user)
    const primaryRole = computed(() => userStore.primaryRole)

    // Check if user is referral - new structure
    const isReferralUser = computed(() => {
        return user.value?.current_plan?.referral === true
    })

    const currentPlanMap = computed(() => {
        if (!user.value?.plan_maps || user.value.plan_maps.length === 0) return null
        return user.value.plan_maps[0]
    })
    const currentPlanId = computed(() => currentPlanMap.value?.id || null)

    // Loading state
    const isLoadingPlans = computed(() => isLoadingStaticData.value)

    // Transform API plans to PlanCard format
    const transformPlanToPlanCard = (apiPlan: any): PlanCardType => {
        const planCode = apiPlan.code?.toLowerCase() || ''

        // Determine if recommended (middle tier for role)
        const isRecommended =
            (primaryRole.value === 'supplier' && planCode === 'supplier-professional') ||
            (primaryRole.value === 'buyer' && planCode === 'buyer-premium')

        // Determine label - using simple uppercase text, no translation needed
        let label: string | null = null
        if (isRecommended) {
            label = 'RECOMMENDED' // Simple text, no translation
        } else if (parseFloat(apiPlan.price) === 0) {
            label = 'FREE' // Simple text, no translation
        }

        return {
            id: apiPlan.id,
            title: apiPlan.name,
            currency: '€',
            monthlyPrice: parseFloat(apiPlan.price || '0'),
            discountedPrice: 0,
            highlighted: isRecommended,
            label,
            features: (apiPlan.features || []).map((f: any) => ({
                title: f.label,
                text: f.description, // Use name as text
                included: f.is_enabled,
                hint: null,
            })),
        }
    }

    // Filter plans based on user role and referral status
    const displayPlans = computed(() => {
        if (!primaryRole.value || !userPlans.value.length) return []

        // Filter plans for current role - userPlans has features!
        const rolePrefix = primaryRole.value.toLowerCase()
        const rolePlans = userPlans.value.filter((plan) => {
            const planCode = plan.code?.toLowerCase() || ''
            const matchesRole = planCode.startsWith(rolePrefix) && plan.is_active

            // Check if this is a referral plan
            const isReferralPlan = planCode.includes('referral')

            // For buyer role:
            // - If user is referral (current_plan.referral === true), show all plans including referral
            // - If user is NOT referral, hide referral plans
            if (primaryRole.value === 'buyer' && isReferralPlan) {
                return matchesRole && isReferralUser.value
            }

            // For other cases (supplier or non-referral plans), show if matches role
            return matchesRole
        })

        // Transform to PlanCard format
        return rolePlans.map(transformPlanToPlanCard)
    })

    // Plan count for dynamic layout
    const planCount = computed(() => displayPlans.value.length)

    // Use flex for 1-2 cards (proper centering), grid for 3+ cards
    const useFlexLayout = computed(() => planCount.value <= 2)

    // Flex classes for 1-2 cards (proper centering)
    const flexClasses = computed(() => {
        return 'flex-col md:flex-row justify-center items-stretch'
    })

    // Grid classes for 3+ cards
    const gridClasses = computed(() => {
        const count = planCount.value
        // 3 plans: perfect 3-column layout
        if (count === 3) return 'md:grid-cols-3'
        // 4 plans: 2 columns on medium, 4 columns on large screens
        if (count === 4) return 'md:grid-cols-2 lg:grid-cols-4'
        // 5+ plans: 3 columns on medium, 4 columns on large (rare case)
        return 'md:grid-cols-3 lg:grid-cols-4'
    })

    // Select plan handler
    const selectPlan = async (plan: any) => {
        try {
            // Dynamic import of modal component
            const moduleImport = await import('~/components/modals/SubscriptionConfirmation.vue')
            const SubscriptionConfirmation = moduleImport.default

            // Open modal first
            modalStore.openModal(
                SubscriptionConfirmation,
                'subscription',
                {
                    planId: plan.id,
                    planTitle: plan.title,
                    isLoading: isProcessingSubscription.value,
                },
                {
                    title: t('modal.successRegistrationTitle'),
                    hideClose: true,
                    persistent: true,
                    hideHeader: false,
                    contentWidth: 'max-w-lg',
                    onOk: async () => {
                        // 1. TRIMITE PLANUL ÎNAINTE!
                        const success = await userStore.changePlan(plan.id)

                        if (success) {
                            const registrationStore = useRegistrationStore()
                            const { success: regSuccess } =
                                await registrationStore.completeRegistration()

                            if (regSuccess) {
                                // Close modal
                                modalStore.closeModal()

                                await router.push(localePath('/login'))
                            }
                        } else {
                            // Handle error, maybe show a message and keep the modal open?
                            console.error('Failed to change plan')
                        }
                    },
                }
            )
        } catch (error) {
            console.error('Failed to load subscription modal:', error)
        }
    }

    const getButtonLabel = (plan: PlanCardType) => {
        if (currentPlanId.value === plan.id) {
            return 'settings.subscription.yourSubscription' // "Your Subscription"
        }
        if (selectedPlanId.value === plan.id) {
            return 'currentPlan' // "Selected"
        }
        return 'selectPlan' // "Upgrade Plan"
    }

    // Initialize on mount
    onMounted(() => {
        // Redirect if no user or role
        if (!user.value || !primaryRole.value) {
            router.push(localePath('/login'))
        }
    })
</script>
