<!-- ~/components/modals/PlanSelectionModal.vue -->
<template>
    <div
        class="w-full max-w-7xl bg-white rounded-lg overflow-hidden scrollbar-hide max-h-[85vh] overflow-y-auto shadow-2xl p-6 relative"
    >
        <!-- Close Button - FIXED position -->
        <div class="absolute top-3 right-3 z-10">
            <ButtonClose size="lg" @click="$emit('cancel')" />
        </div>

        <!-- Logo LeMarkt -->
        <div class="flex justify-center py-6">
            <svg class="w-48 h-12">
                <use xlink:href="/sprite.svg#logo_lg"></use>
            </svg>
        </div>

        <!-- Header -->
        <div class="text-center px-6 pb-6">
            <h2 class="text-h3 font-bold text-gray-950 mb-2">
                {{ $t('chooseYourPlan') }}
            </h2>
            <p class="text-subtitle2 text-gray-700">
                {{ roleSubtitle }}
            </p>
        </div>

        <!-- Role Switcher (Buyer/Supplier) - ONLY for buyers using SegmentedButtons -->
        <div v-if="props.userRole === 'buyer'" class="px-6 pb-6">
            <SegmentedButtons
                :options="roleOptions"
                :default-active="selectedRole"
                size="md"
                border-radius="rounded-lg"
                @change="handleRoleChange"
            />
        </div>

        <!-- Plans Grid using PlanCard Component -->
        <div class="px-6 pb-8">
            <!-- Empty State -->
            <div
                v-if="planCount === 0"
                class="flex flex-col items-center justify-center py-12 text-center"
            >
                <svg class="w-16 h-16 text-gray-400 mb-3">
                    <use xlink:href="/sprite.svg#info-circle" />
                </svg>
                <p class="text-subtitle1 text-gray-800 mb-1">
                    {{ $t('subscription.noPlansAvailable') }}
                </p>
                <p class="text-subtitle3 text-gray-700">
                    {{ $t('subscription.contactSupport') }}
                </p>
            </div>

            <!-- Flex Layout for 1-2 Plans (Centered) -->
            <div
                v-else-if="useFlexLayout"
                class="flex gap-6 max-w-6xl mx-auto"
                :class="flexClasses"
            >
                <PlanCard
                    v-for="plan in transformedPlans"
                    :key="plan.id"
                    :plan="plan"
                    :is-selected="selectedPlanId === plan.id"
                    :is-current="currentPlanId === plan.id"
                    class="w-full md:max-w-md"
                    @select-plan="handleSelectPlan"
                />
            </div>

            <!-- Grid Layout for 3+ Plans -->
            <div v-else class="grid gap-6 max-w-6xl mx-auto" :class="gridClasses">
                <PlanCard
                    v-for="plan in transformedPlans"
                    :key="plan.id"
                    :plan="plan"
                    :is-selected="selectedPlanId === plan.id"
                    :is-current="currentPlanId === plan.id"
                    @select-plan="handleSelectPlan"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, ref } from 'vue'
    import { useI18n } from 'vue-i18n'

    import type { PlanCard as PlanCardType } from '~/types/ui/planCard'
    import type { SegmentButtonOption } from '~/types/ui/segmentedButtons'

    // API Plan structure (from backend)
    interface ApiPlanFeature {
        is_enabled: boolean
        label: string
        description: string
    }

    interface ApiPlan {
        id: number
        code?: string
        name: string
        price: string
        old_price?: string | null
        billing_cycle: string
        duration_months: number
        is_active: boolean
        features?: ApiPlanFeature[]
    }

    interface Props {
        availablePlans: ApiPlan[]
        currentPlanId: number | null
        userRole: string
        isReferralUser?: boolean
    }

    const props = withDefaults(defineProps<Props>(), {
        isReferralUser: false,
    })
    const emit = defineEmits(['select', 'cancel'])

    const { t } = useI18n()

    // Selected role for filtering plans
    const selectedRole = ref<string>(props.userRole || 'buyer')
    const selectedPlanId = ref<number | null>(null)

    // Current plan ID
    const currentPlanId = computed(() => props.currentPlanId)

    // Role subtitle
    const roleSubtitle = computed(() => {
        const role = selectedRole.value === 'buyer' ? t('buyer') : t('supplier')
        return `As a ${role.toLowerCase()} you have to choose one of subscription plans`
    })

    // Role options for SegmentedButtons
    const roleOptions = computed<SegmentButtonOption[]>(() => [
        {
            value: 'buyer',
            label: t('buyer'),
            active: true,
        },
        {
            value: 'supplier',
            label: t('supplier'),
            active: true,
        },
    ])

    // Recommended plan code based on role
    const recommendedPlanCode = computed(() => {
        if (selectedRole.value === 'buyer') return 'buyer-premium'
        return 'supplier-professional'
    })

    // Helper function to calculate discount percentage
    const calculateDiscountPercentage = (price: number, oldPrice: number): number => {
        if (!oldPrice || oldPrice <= 0 || oldPrice <= price) return 0
        return Math.round(((oldPrice - price) / oldPrice) * 100)
    }

    // Filtered plans based on selected role
    const filteredPlans = computed(() => {
        return props.availablePlans.filter((plan) => {
            // Filter by role
            const planRole = plan.code?.split('-')[0] || ''
            if (planRole !== selectedRole.value) return false

            // If user is NOT referral, exclude referral/free plans
            if (!props.isReferralUser) {
                const planCode = plan.code?.toLowerCase() || ''
                // Exclude plans with "referral" or "free" in code
                // BUT allow "startup" and "trial" plans (promotional free plans)
                if (
                    planCode.includes('referral') ||
                    planCode.includes('free') ||
                    (parseFloat(plan.price) === 0 &&
                        !planCode.includes('trial') &&
                        !planCode.includes('startup'))
                ) {
                    return false
                }
            }

            return true
        })
    })

    // Transform API plans to PlanCard format
    const transformApiPlanToPlanCard = (apiPlan: ApiPlan): PlanCardType => {
        const planCode = apiPlan.code?.toLowerCase() || ''
        const isRecommended = planCode === recommendedPlanCode.value
        const currentPrice = parseFloat(apiPlan.price || '0')
        const oldPrice = apiPlan.old_price ? parseFloat(apiPlan.old_price) : null

        // Calculate discount percentage
        const discountPercentage =
            oldPrice && oldPrice > 0 ? calculateDiscountPercentage(currentPrice, oldPrice) : 0

        // Determine label
        let label: string | null = null
        if (isRecommended) {
            label = 'RECOMMENDED'
        } else if (currentPrice === 0) {
            label = 'FREE'
        }

        return {
            id: apiPlan.id,
            title: apiPlan.name,
            currency: '€',
            monthlyPrice: currentPrice,
            oldPrice: oldPrice, // NEW
            discountPercentage: discountPercentage, // NEW
            highlighted: isRecommended,
            label,
            features: (apiPlan.features || []).map((f) => ({
                title: f.label,
                text: f.description,
                included: f.is_enabled,
                hint: null,
            })),
        }
    }

    // Transformed plans ready for PlanCard component
    const transformedPlans = computed(() => {
        return filteredPlans.value.map(transformApiPlanToPlanCard)
    })

    // Plan count for dynamic grid layout
    const planCount = computed(() => transformedPlans.value.length)

    // Use flex for 1-2 cards (proper centering), grid for 3+ cards
    const useFlexLayout = computed(() => planCount.value <= 2)

    // Dynamic grid classes based on plan count (for 3+ cards)
    const gridClasses = computed(() => {
        const count = planCount.value

        // 3 plans: perfect 3-column layout
        if (count === 3) return 'grid-cols-1 md:grid-cols-3'

        // 4 plans: 2 columns on medium, 4 columns on large screens
        if (count === 4) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'

        // 5+ plans: 3 columns on medium, 4 columns on large (rare case)
        return 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4'
    })

    // Flex classes for 1-2 cards (proper centering)
    const flexClasses = computed(() => {
        const count = planCount.value
        // 1 card: single centered card
        if (count === 1) return 'flex-col md:flex-row justify-center items-stretch'
        // 2 cards: side by side, centered
        return 'flex-col md:flex-row justify-center items-stretch'
    })

    // Handle role change from SegmentedButtons
    const handleRoleChange = (role: string) => {
        selectedRole.value = role
        selectedPlanId.value = null
    }

    // Handle plan selection
    const handleSelectPlan = (plan: PlanCardType) => {
        if (currentPlanId.value === plan.id) return
        selectedPlanId.value = plan.id
        emit('select', plan.id)
    }
</script>
