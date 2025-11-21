<!-- ~/components/settings/tabs/SubscriptionTab.vue -->
<template>
    <div class="w-full space-y-3">
        <!-- Cancelled Subscription Banner -->
        <CancelledSubscriptionBanner />

        <!-- Section Title -->
        <h2 class="text-subtitle3 text-gray-800">
            {{ $t('settings.subscription.title', 'Subscription') }}
        </h2>

        <!-- Your Subscription -->
        <section class="rounded border border-gray-600 p-3 space-y-3">
            <h3 class="text-body1 font-medium text-gray-950">
                {{ $t('settings.subscription.yourSubscription') }}
            </h3>

            <!-- Active Subscription -->
            <div
                v-if="hasActiveSubscription"
                class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
            >
                <!-- Plan Details -->
                <div class="space-y-1">
                    <h4 class="text-subtitle2 text-gray-800">
                        {{ currentPlan?.name || $t('settings.subscription.noPlan') }}
                    </h4>
                    <div class="flex items-baseline gap-1">
                        <span class="text-title2 font-bold text-blue-500">
                            {{ formatCurrency(currentPlan?.price || 0) }}
                        </span>
                        <span class="text-subtitle3 text-gray-800">
                            / {{ billingCycleLabel }}
                        </span>
                    </div>
                    <p class="text-subtitle3 text-gray-700">
                        {{ $t('settings.subscription.subscriptionEnds') }}: {{ formattedEndDate }}
                    </p>
                </div>

                <!-- Action Buttons -->
                <div class="flex gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        color="gray"
                        size="sm"
                        font-weight="normal"
                        :disabled="isLoading"
                        @click="handleCancelClick"
                    >
                        {{ $t('settings.subscription.cancelSubscription') }}
                    </Button>
                    <Button
                        variant="filled"
                        color="blue"
                        size="sm"
                        font-weight="normal"
                        :disabled="isLoading"
                        @click="handleUpgradeClick"
                    >
                        {{ $t('settings.subscription.upgradePlan') }}
                    </Button>
                </div>
            </div>

            <!-- No Subscription State -->
            <div v-else class="text-center py-4">
                <p class="text-subtitle3 text-gray-800 mb-3">
                    {{ $t('settings.subscription.noActiveSubscription') }}
                </p>
                <Button
                    variant="filled"
                    color="blue"
                    size="sm"
                    font-weight="normal"
                    @click="handleUpgradeClick"
                >
                    {{ $t('settings.subscription.choosePlan') }}
                </Button>
            </div>
        </section>

        <!-- Payment Information -->
        <!-- <section class="rounded border border-gray-600 p-3 space-y-3">
            <div class="flex justify-between items-center">
                <h3 class="text-body1 font-medium text-gray-950">
                    {{ $t('settings.subscription.paymentInformation') }}
                </h3>
                <button
                    class="text-blue-500 hover:text-blue-600 text-subtitle3 font-medium"
                    @click="handleEditPayment"
                >
                    {{ $t('settings.subscription.edit') }}
                </button>
            </div>

            <div v-if="defaultPaymentMethod" class="space-y-2">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <span class="text-subtitle3 text-gray-800">
                        {{ $t('settings.subscription.paymentMethod') }}:
                    </span>
                    <div class="flex items-center gap-3 md:col-span-2">
                        <label
                            v-for="method in paymentMethods"
                            :key="method.id"
                            class="relative flex items-center"
                        >
                            <input
                                type="radio"
                                name="paymentMethod"
                                :value="method.id"
                                :checked="method.is_default"
                                class="peer sr-only"
                            />
                            <div
                                class="flex items-center gap-2 px-2 py-1.5 border rounded cursor-pointer transition-all"
                                :class="
                                    method.is_default
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-300 hover:border-gray-400'
                                "
                            >
                                <span class="text-subtitle3 text-gray-800">
                                    ****{{ method.last_four }}
                                </span>
                            </div>
                        </label>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <span class="text-subtitle3 text-gray-800">
                        {{ $t('settings.subscription.billingEmail') }}:
                    </span>
                    <span class="text-subtitle3 text-gray-950 md:col-span-2">
                        {{ defaultPaymentMethod.billing_email }}
                    </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <span class="text-subtitle3 text-gray-800">
                        {{ $t('settings.subscription.billingAddress') }}:
                    </span>
                    <span class="text-subtitle3 text-gray-950 md:col-span-2">
                        {{ formatAddress(defaultPaymentMethod.billing_address) }}
                    </span>
                </div>
            </div>
        </section> -->

        <!-- Billing History -->
        <!-- <section class="rounded border border-gray-600 p-3 space-y-3">
            <h3 class="text-body1 font-medium text-gray-950">
                {{ $t('settings.subscription.billingHistory') }}
            </h3>

            <Table
                :columns="billingColumns"
                :rows="billingTableData"
                :loading="isLoading"
                :pagination="false"
                :show-column-borders="false"
                background="bg-transparent"
                wrapper-class="border-0"
            >
                <template #empty>
                    <div class="flex flex-col items-center justify-center py-6">
                        <svg class="w-12 h-12 text-gray-400 mb-2">
                            <use xlink:href="/sprite.svg#receipt" />
                        </svg>
                        <p class="text-gray-800 text-subtitle3">
                            {{ $t('settings.subscription.noBillingHistory') }}
                        </p>
                    </div>
                </template>
            </Table>
        </section> -->

        <!-- Expired Subscription Modal -->
        <ExpiredSubscriptionModal />
    </div>
</template>

<script setup lang="ts">
    import { computed, ref, nextTick } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useRouter } from 'vue-router'
    import { useUserStore } from '~/stores/user'
    import { useModalStore } from '~/stores/modal'
    import { useStaticData } from '~/composables/useStaticData'
    import { useDate } from '~/composables/useDate'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { useConfirmation } from '~/composables/useConfirmModal'
    import { useUpgradeModal } from '~/composables/useUpgradeModal'

    // Composables
    const { t } = useI18n()
    const router = useRouter()
    const modalStore = useModalStore()
    const userStore = useUserStore()
    const { formatDate } = useDate()
    const { success: successToast, error: errorToast } = useToastNotification()
    const { showConfirmation } = useConfirmation()
    const { userPlans } = useStaticData()
    const { openUpgradeModal } = useUpgradeModal()

    // User data
    const user = computed(() => userStore.user)
    const isLoading = computed(() => userStore.updateUserLoading)
    const primaryRole = computed(() => userStore.primaryRole)

    // Current plan from user store (user.current_plan)
    const userCurrentPlan = computed(() => userStore.currentPlan)

    // Current plan ID for modal
    const currentPlanId = computed(() => {
        return userCurrentPlan.value?.plan?.id || null
    })

    // Get full plan details from userPlans
    const currentPlan = computed(() => {
        if (!userCurrentPlan.value?.plan?.id) return null
        return userPlans.value.find((p) => p.id === userCurrentPlan.value!.plan.id) || null
    })

    // Plan dates from user.current_plan
    const planStartedAt = computed(() => userCurrentPlan.value?.started_at || null)
    const planExpiresAt = computed(() => userCurrentPlan.value?.expires_at || null)
    const planCancelledAt = computed(() => userCurrentPlan.value?.cancelled_at || null)

    // Subscription status
    const isSubscriptionCancelled = computed(() => {
        return !!planCancelledAt.value && !isSubscriptionExpired.value
    })

    const isSubscriptionExpired = computed(() => {
        if (!planExpiresAt.value) return false
        return new Date(planExpiresAt.value) < new Date()
    })

    const hasActiveSubscription = computed(() => {
        return !!currentPlan.value && currentPlan.value.is_active && !isSubscriptionExpired.value
    })

    // Is user on referral plan?
    const isReferralUser = computed(() => {
        return !!userCurrentPlan.value?.referral
    })

    // Billing cycle label
    const billingCycleLabel = computed(() => {
        if (!currentPlan.value?.billing_cycle) return ''

        // Map billing_cycle to translation key
        const cycleMap: Record<string, string> = {
            monthly: 'month',
            yearly: 'year',
            month: 'month',
            year: 'year',
        }

        const cycle = currentPlan.value.billing_cycle.toLowerCase()
        const key = cycleMap[cycle] || 'month'

        return t(key)
    })

    // Formatted subscription end date
    const formattedEndDate = computed(() => {
        if (!planExpiresAt.value) return ''
        return formatDate(planExpiresAt.value, 'PP') // Format: Jan 1, 2026
    })

    // ============================
    // Handlers
    // ============================

    /**
     * Handle upgrade/change plan click
     * Opens the GLOBAL upgrade modal from layout
     */
    const handleUpgradeClick = () => {
        // ✅ Use global modal from layout instead of local modal
        openUpgradeModal(undefined, 'upgrade')
    }

    /**
     * Handle cancel subscription click
     */
    const handleCancelClick = async () => {
        const confirmed = await showConfirmation({
            title: t('subscription.cancelSubscriptionTitle'),
            message: t('subscription.cancelSubscriptionMessage', {
                date: formattedEndDate.value,
            }),
            confirmText: t('subscription.cancelPlan'),
            cancelText: t('subscription.keepPlan'),
            type: 'warning',
        })

        if (!confirmed) return

        try {
            const success = await userStore.cancelPlan()

            if (success) {
                successToast(
                    t('subscription.cancelSuccess'),
                    t('subscription.cancelSuccessMessage', { date: formattedEndDate.value })
                )
            } else {
                const errorMessage = userStore.userFetchError?.message || t('error')
                errorToast(errorMessage, t('error'))
            }
        } catch (error) {
            console.error('Cancel subscription error:', error)
            errorToast(t('error'), t('subscription.cancelError'))
        }
    }

    // ============================
    // Utility Functions
    // ============================

    /**
     * Format currency (€ symbol + 2 decimals)
     * Accepts both string and number
     */
    const formatCurrency = (amount: string | number): string => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount
        return `€${num.toFixed(2)}`
    }
</script>
