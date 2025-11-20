<!-- ~/components/subscription/ExpiredSubscriptionModal.vue -->
<template>
    <div
        v-if="showModal"
        class="fixed inset-0 z-[9999] bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4"
        @click.self="handleBackdropClick"
    >
        <div class="bg-white rounded-lg max-w-lg w-full p-8 text-center shadow-2xl">
            <!-- Lock Icon -->
            <div class="text-red-500 mb-4">
                <svg
                    class="w-20 h-20 mx-auto"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        fill-rule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clip-rule="evenodd"
                    />
                </svg>
            </div>

            <!-- Title -->
            <h2 class="text-h3 font-bold text-gray-950 mb-3">
                {{ $t('subscription.expiredTitle') }}
            </h2>

            <!-- Message -->
            <p class="text-subtitle1 text-gray-700 mb-6">
                {{ $t('subscription.expiredMessage') }}
            </p>

            <!-- Benefits List -->
            <div class="bg-blue-50 rounded-lg p-5 mb-6 text-left">
                <h3 class="font-semibold text-gray-950 mb-3 text-center">
                    {{ $t('subscription.resubscribeTo') }}:
                </h3>
                <ul class="space-y-2 text-subtitle2 text-gray-800">
                    <li class="flex items-start">
                        <svg
                            class="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clip-rule="evenodd"
                            />
                        </svg>
                        <span>{{ $t('subscription.benefit.accessDashboard') }}</span>
                    </li>
                    <li class="flex items-start">
                        <svg
                            class="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clip-rule="evenodd"
                            />
                        </svg>
                        <span>{{ $t('subscription.benefit.reactivateProducts') }}</span>
                    </li>
                    <li class="flex items-start">
                        <svg
                            class="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clip-rule="evenodd"
                            />
                        </svg>
                        <span>{{ $t('subscription.benefit.accessMarketplace') }}</span>
                    </li>
                    <li class="flex items-start">
                        <svg
                            class="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clip-rule="evenodd"
                            />
                        </svg>
                        <span>{{ $t('subscription.benefit.premiumFeatures') }}</span>
                    </li>
                </ul>
            </div>

            <!-- Action Buttons -->
            <Button
                variant="filled"
                color="blue"
                size="lg"
                class="w-full mb-3"
                @click="goToSubscription"
            >
                {{ $t('subscription.choosePlan') }}
            </Button>

            <!-- Secondary Action -->
            <button
                class="text-subtitle3 text-gray-600 hover:text-gray-800 underline transition-colors"
                @click="logout"
            >
                {{ $t('subscription.logoutInstead') }}
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue'
    import { useRoute, useRouter } from 'vue-router'
    import { useI18n } from 'vue-i18n'
    import { useUserStore } from '~/stores/user'
    import Button from '~/components/ui/Button.vue'

    const route = useRoute()
    const router = useRouter()
    const { t } = useI18n()
    const userStore = useUserStore()

    // Show modal if expired query param is present
    const showModal = computed(() => {
        return route.query.expired === 'true'
    })

    /**
     * Navigate to subscription page
     */
    const goToSubscription = () => {
        router.push('/settings/subscription')
    }

    /**
     * Logout user
     */
    const logout = async () => {
        await userStore.logout()
        router.push('/login')
    }

    /**
     * Handle backdrop click (optional: allow close)
     */
    const handleBackdropClick = () => {
        // Don't allow closing by clicking backdrop
        // User MUST choose plan or logout
    }
</script>
