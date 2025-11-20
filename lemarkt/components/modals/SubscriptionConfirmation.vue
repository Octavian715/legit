<template>
    <div class="px-5">
        <div class="flex flex-col items-center space-y-3">
            <div class="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-10 w-10 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </div>

            <div class="text-center space-y-3">
                <h3 class="text-subtitle1 font-bold text-gray-950">
                    {{ t('modal.subscriptionConfirmationTitle') }}
                </h3>

                <p class="text-subtitle3 text-gray-700 leading-relaxed">
                    {{ t('modal.subscriptionConfirmationMessage') }}
                </p>

                <div class="text-body bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                    <p class="text-amber-800 text-sm font-medium">
                        {{ t('modal.subscriptionValidationTime') }}
                    </p>
                    <p class="text-amber-700 text-xs mt-1">
                        {{ t('modal.subscriptionValidationNote') }}
                    </p>
                </div>
            </div>

            <div v-if="isLoading" class="flex items-center space-x-2 text-gray-500">
                <svg
                    class="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                    />
                    <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                </svg>
                <span class="text-sm">{{ t('modal.subscriptionProcessing') }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    interface Props {
        planId: number
        planTitle: string
        isLoading?: boolean
    }

    const props = defineProps<Props>()
    const { t } = useI18n()
</script>
