<!-- ~/components/subscription/CancelledSubscriptionBanner.vue -->
<template>
    <div v-if="showBanner" class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-md mb-6">
        <div class="flex items-start justify-between gap-4">
            <div class="flex items-start flex-1">
                <!-- Warning Icon -->
                <div class="flex-shrink-0">
                    <svg
                        class="h-6 w-6 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clip-rule="evenodd"
                        />
                    </svg>
                </div>

                <!-- Content -->
                <div class="ml-3 flex-1">
                    <h3 class="text-subtitle2 font-semibold text-yellow-800">
                        {{ $t('subscription.cancelledTitle') }}
                    </h3>
                    <p class="text-subtitle3 text-yellow-700 mt-1">
                        {{
                            $t('subscription.cancelledMessage', {
                                date: formattedExpiresAt,
                            })
                        }}
                    </p>

                    <!-- Reactivate Button -->
                    <div class="mt-3">
                        <Button
                            variant="filled"
                            color="yellow"
                            size="sm"
                            :loading="isReactivating"
                            :disabled="isReactivating"
                            @click="handleReactivate"
                        >
                            <template #icon-left>
                                <svg
                                    v-if="!isReactivating"
                                    class="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                            </template>
                            {{ $t('subscription.reactivateSubscription') }}
                        </Button>
                    </div>
                </div>
            </div>

            <!-- Close Button (Optional) -->
            <!-- <button
                type="button"
                class="flex-shrink-0 text-yellow-400 hover:text-yellow-600 transition-colors"
                @click="hideBanner"
            >
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fill-rule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clip-rule="evenodd"
                    />
                </svg>
            </button> -->
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, ref } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useUserStore } from '~/stores/user'
    import { useDate } from '~/composables/useDate'
    import { useToastNotification } from '~/composables/useToastNotification'

    // Composables
    const { t } = useI18n()
    const userStore = useUserStore()
    const { formatDate } = useDate()
    const { success: successToast, error: errorToast } = useToastNotification()

    // State
    const isReactivating = ref(false)

    // Current plan data
    const currentPlan = computed(() => userStore.currentPlan)
    const cancelledAt = computed(() => currentPlan.value?.cancelled_at)
    const expiresAt = computed(() => currentPlan.value?.expires_at)

    // Status checks
    const isCancelled = computed(() => !!cancelledAt.value)

    const isExpired = computed(() => {
        if (!expiresAt.value) return false
        return new Date(expiresAt.value) < new Date()
    })

    // Show banner only if cancelled AND not expired
    const showBanner = computed(() => {
        return isCancelled.value && !isExpired.value
    })

    // Formatted expiration date
    const formattedExpiresAt = computed(() => {
        if (!expiresAt.value) return ''
        return formatDate(expiresAt.value, 'PPP') // "November 10th, 2026"
    })

    /**
     * Handle reactivate subscription
     * Uses changePlan with current plan ID to reactivate
     */
    const handleReactivate = async () => {
        // Get current plan ID
        const planId = currentPlan.value?.plan?.id

        if (!planId) {
            errorToast(t('error'), t('subscription.noPlanFound'))
            return
        }

        isReactivating.value = true

        try {
            // Reactivate by "changing" to the same plan
            const success = await userStore.changePlan(planId)

            if (success) {
                successToast(
                    t('subscription.reactivateSuccess'),
                    t('subscription.reactivateSuccessMessage')
                )
            } else {
                const errorMessage = userStore.userFetchError?.message || t('error')
                errorToast(t('error'), errorMessage)
            }
        } catch (error) {
            console.error('Reactivate subscription error:', error)
            errorToast(t('error'), t('subscription.reactivateError'))
        } finally {
            isReactivating.value = false
        }
    }
</script>
