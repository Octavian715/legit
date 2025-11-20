<template>
    <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div class="bg-gradient-to-r from-green-500 to-green-600 p-8 text-center">
            <div class="mb-4">
                <div
                    class="w-20 h-20 bg-white/20 backdrop-blur rounded-full mx-auto flex items-center justify-center animate-bounce-slow"
                >
                    <svg
                        class="w-12 h-12 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2.5"
                            d="M5 13l4 4L19 7"
                        ></path>
                    </svg>
                </div>
            </div>

            <h1 class="text-2xl lg:text-3xl font-bold text-white mb-2">
                {{ $t('checkout.orderSubmitted') }}
            </h1>

            <p class="text-white/90 text-lg">
                {{ $t('checkout.thankYouForOrder') }}
            </p>
        </div>

        <div class="p-6 lg:p-8">
            <div v-if="orderNumbers.length > 0" class="bg-gray-50 rounded-xl p-5 mb-6">
                <div class="flex items-start justify-between">
                    <div>
                        <p class="text-caption1 text-gray-600 mb-2">
                            {{
                                orderNumbers.length === 1
                                    ? $t('checkout.orderNumber')
                                    : $t('checkout.orderNumbers')
                            }}
                        </p>
                        <div class="space-y-1">
                            <p
                                v-for="number in orderNumbers"
                                :key="number"
                                class="text-subtitle2 font-semibold text-gray-950"
                            >
                                #{{ number }}
                            </p>
                        </div>
                    </div>

                    <div v-if="orderDocuments.length > 0" class="flex items-center gap-2">
                        <div v-for="doc in orderDocuments" :key="doc.id" class="flex gap-2">
                            <button
                                :disabled="loadingStates.viewingPdf[doc.id]"
                                class="inline-flex items-center px-3 py-2 bg-white border border-gray-200 rounded-lg text-caption1 font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                :title="$t('checkout.viewInvoice')"
                                @click="$emit('view-invoice', doc.id)"
                            >
                                <svg
                                    v-if="!loadingStates.viewingPdf[doc.id]"
                                    class="w-4 h-4 mr-1.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    ></path>
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    ></path>
                                </svg>
                                <Spinner v-else class="w-4 h-4 mr-1.5" />
                                <span class="hidden sm:inline">{{ $t('checkout.view') }}</span>
                            </button>

                            <button
                                :disabled="loadingStates.downloadingPdf[doc.id]"
                                class="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg text-caption1 font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                :title="$t('checkout.downloadInvoice')"
                                @click="$emit('download-invoice', doc.id)"
                            >
                                <svg
                                    v-if="!loadingStates.downloadingPdf[doc.id]"
                                    class="w-4 h-4 mr-1.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    ></path>
                                </svg>
                                <Spinner v-else class="w-4 h-4 mr-1.5" />
                                <span class="hidden sm:inline">{{ $t('checkout.invoice') }}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex items-center justify-center mb-8">
                <div class="flex items-center bg-blue-50 text-blue-700 px-4 py-3 rounded-lg">
                    <svg class="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"
                        ></path>
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                    </svg>
                    <p class="text-caption1 font-medium">
                        {{ $t('checkout.confirmationEmailSent') }}
                    </p>
                </div>
            </div>

            <div class="grid sm:grid-cols-2 gap-3">
                <Button
                    color="blue"
                    variant="filled"
                    size="lg"
                    class="w-full justify-center"
                    @click="$emit('go-to-documents')"
                >
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        ></path>
                    </svg>
                    {{ $t('checkout.goToBackOffice') }}
                </Button>

                <Button
                    color="gray"
                    variant="outline"
                    size="lg"
                    class="w-full justify-center"
                    @click="$emit('continue-shopping')"
                >
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        ></path>
                    </svg>
                    {{ $t('checkout.continueShopping') }}
                </Button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import type { Document } from '~/types/documents'

    interface Props {
        orderIds: number[]
        orderNumbers: string[]
        orderDocuments: Document[]
        loadingStates: {
            downloadingPdf: Record<number, boolean>
            viewingPdf: Record<number, boolean>
        }
    }

    defineProps<Props>()

    defineEmits<{
        'download-invoice': [documentId: number]
        'view-invoice': [documentId: number]
        'go-to-documents': []
        'continue-shopping': []
    }>()
</script>

<style scoped>
    @keyframes bounce-slow {
        0%,
        100% {
            transform: translateY(0);
        }
        50% {
            transform: translateY(-10px);
        }
    }

    .animate-bounce-slow {
        animation: bounce-slow 2s ease-in-out infinite;
    }
</style>
