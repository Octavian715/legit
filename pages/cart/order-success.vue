<template>
    <div class="order-success-page px-4 md:px-0">
        <Breadcrumbs :items="breadcrumbItems" />

        <PageHeader :title="t('checkout.shoppingCart')" :subtitle="``" />

        <!-- Loading State -->
        <div v-if="isLoading" class="bg-white py-20">
            <div class="animate-pulse space-y-6">
                <div class="max-w-2xl mx-auto">
                    <div class="bg-gray-200 h-60 w-60 mx-auto mb-6 rounded"></div>
                    <div class="bg-gray-200 h-8 w-3/4 mx-auto mb-3 rounded"></div>
                    <div class="bg-gray-200 h-6 w-1/2 mx-auto mb-8 rounded"></div>
                    <div class="flex gap-4 justify-center">
                        <div class="bg-gray-200 h-12 w-40 rounded"></div>
                        <div class="bg-gray-200 h-12 w-40 rounded"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Success Content -->
        <div v-else class="bg-white px-4 py-20">
            <div class="max-w-2xl mx-auto">
                <!-- Success Card -->
                <div class="text-center">
                    <!-- Success Illustration -->
                    <div class="mb-6">
                        <div class="w-full h-h-full mx-auto relative">
                            <!-- <NuxtImg
                                src="/images/content/order-success.svg"
                                width="240"
                                height="240"
                                loading="lazy"
                                class="mx-auto"
                            /> -->
                            <img
                                src="/images/content/order-success.svg"
                                width="240px"
                                height="240px"
                                loading="lazy"
                                class="mx-auto"
                            />
                        </div>
                    </div>

                    <!-- Success Message -->
                    <h1 class="text-title1 font-bold text-gray-950 mb-2">
                        {{ t('checkout.orderHasBeenSubmitted') }}
                    </h1>

                    <p class="text-subtitle2 text-gray-700 mb-6 max-w-md mx-auto">
                        {{ t('checkout.manageOrdersInBackOffice') }}
                    </p>

                    <!-- Order Numbers Display -->
                    <!-- <div
                        v-if="orderNumbers.length > 0"
                        class="bg-gray-50 rounded-lg p-4 mb-6 max-w-md mx-auto"
                    >
                        <p class="text-caption1 text-gray-600 mb-2">
                            {{
                                orderNumbers.length === 1
                                    ? t('checkout.orderNumber')
                                    : t('checkout.orderNumbers')
                            }}:
                        </p>
                        <div class="space-y-1">
                            <p
                                v-for="number in orderNumbers"
                                :key="number"
                                class="text-subtitle3 font-semibold text-gray-950"
                            >
                                #{{ number }}
                            </p>
                        </div>
                    </div> -->

                    <!-- Action Buttons -->
                    <div class="flex flex-col sm:flex-row gap-3 justify-center px-6">
                        <Button
                            color="blue"
                            variant="filled"
                            size="lg"
                            :loading="isDownloading"
                            class="min-w-[200px]"
                            :label="t('checkout.downloadInvoice')"
                            @click="downloadInvoices"
                        />

                        <Button color="red" variant="filled" size="lg" @click="goToBackOffice">
                            {{ t('checkout.goToBackOffice') }}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, onMounted, computed } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useLocalePath, useRoute, navigateTo } from '#imports'
    import { useDocumentsStore } from '~/stores/documents'
    import { useCartStore } from '~/stores/cart'

    definePageMeta({
        layout: 'default',
    })

    const { t } = useI18n()
    const localePath = useLocalePath()
    const route = useRoute()
    const documentsStore = useDocumentsStore()
    const cartStore = useCartStore()

    // State
    const orderIds = ref<number[]>([])
    const orderNumbers = ref<string[]>([])
    const isLoading = ref(true)
    const isDownloading = ref(false)
    const hasInvoices = ref(false)

    // Breadcrumb items
    const breadcrumbItems = computed(() => [
        { label: t('home'), to: localePath('/marketplace') },
        { label: t('navigation.eCommerce'), to: localePath('/marketplace') },
        { label: t('checkout.shoppingCart'), to: localePath('/cart/order-success'), current: true },
    ])

    // Parse query parameters
    const parseQueryParams = () => {
        const ids = route.query.orderIds as string
        const numbers = route.query.orderNumbers as string

        if (ids) {
            orderIds.value = ids
                .split(',')
                .map((id) => parseInt(id, 10))
                .filter((id) => !isNaN(id))
        }

        if (numbers) {
            orderNumbers.value = numbers.split(',').filter(Boolean)
        }
    }

    // Download invoices
    const downloadInvoices = async () => {
        if (orderIds.value.length === 0) return

        isDownloading.value = true

        try {
            for (let i = 0; i < orderIds.value.length; i++) {
                const id = orderIds.value[i]
                const number = orderNumbers.value[i] || `order-${id}`
                await documentsStore.downloadPdf(id, `invoice-${number}.pdf`)

                // Small delay between downloads if multiple
                if (i < orderIds.value.length - 1) {
                    await new Promise((resolve) => setTimeout(resolve, 500))
                }
            }
        } catch (error) {
            console.error('Failed to download invoices:', error)
        } finally {
            isDownloading.value = false
        }
    }

    // Navigate to back office
    const goToBackOffice = () => {
        navigateTo(localePath('/buyer/documents/all'))
    }

    onMounted(async () => {
        parseQueryParams()

        // Clear cart
        if (cartStore && typeof cartStore.clearCart === 'function') {
            cartStore.clearCart()
        }

        isLoading.value = false
    })

    // SEO
    useSeoMeta({
        title: () => t('checkout.orderSuccess'),
        description: () => t('checkout.orderSuccessDescription'),
    })
</script>

<style scoped>
    .order-success-page {
        min-height: calc(100vh - 200px);
    }
</style>
