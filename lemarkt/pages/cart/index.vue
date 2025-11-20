<template>
    <div class="cart-page pb-20 px-4 md:px-0">
        <Breadcrumbs :items="breadcrumbItems" />

        <PageHeader :title="t('cart.shoppingCart')" :subtitle="getSubtitle">
            <template #right>
                <NuxtLink :to="localePath('/buyer/orders/all')">
                    <Button color="blue" variant="filled" size="md">
                        {{ t('orders.orders') }}
                    </Button>
                </NuxtLink>
            </template>
        </PageHeader>

        <div class="bg-white px-4 py-6 rounded-b-sm">
            <div v-if="isInitialLoading" class="space-y-3">
                <CartCollapseSkeleton v-for="i in 3" :key="i" :items-count="2" />
            </div>

            <div v-else-if="error" class="text-center py-16">
                <div class="mx-auto w-24 h-24 text-red-500 mb-4">
                    <svg class="w-full h-full">
                        <use xlink:href="/sprite.svg#alert"></use>
                    </svg>
                </div>
                <h3 class="text-title1 font-bold text-gray-950 mb-2">{{ t('error') }}</h3>
                <p class="text-subtitle1 text-gray-700 mb-8">
                    {{ error.message || t('cart.loadError') }}
                </p>
                <Button color="red" variant="filled" class="mx-auto" @click="handleRetry">
                    {{ t('retry') }}
                </Button>
            </div>

            <div v-else-if="isCartEmpty" class="text-center py-16">
                <div class="mx-auto mb-8">
                    <img
                        src="/images/content/empty-cart.svg"
                        alt="Shopping cart is empty"
                        class="w-64 h-64 mx-auto"
                        loading="lazy"
                    />
                </div>
                <h3 class="text-title1 font-bold text-gray-950 mb-2">
                    {{ t('cart.emptyMessage') }}
                </h3>
                <p class="text-subtitle1 text-gray-700 mb-8">
                    {{ t('cart.startShopping') }}
                </p>
                <NuxtLink :to="localePath('/marketplace')">
                    <Button color="red" variant="filled" size="md" class="mx-auto">
                        {{ t('cart.startShoppingButton') }}
                    </Button>
                </NuxtLink>
            </div>

            <div v-else class="space-y-3">
                <Collapse
                    v-for="group in supplierGroups"
                    :key="group.supplier.id"
                    :default-open="true"
                >
                    <template #title>
                        <div class="flex items-center justify-between w-full">
                            <h3 class="text-title3 font-bold text-gray-950">
                                {{ group.supplier.legal_name || group.supplier.name }}
                            </h3>
                            <div class="flex items-center gap-3">
                                <p class="text-body">
                                    {{ t('totalAmount') }}:
                                    <strong>{{ formatSupplierTotal(group.totals) }}</strong>
                                </p>
                                <Button
                                    color="red"
                                    variant="ghost"
                                    size="sm"
                                    font-weight="normal"
                                    container-classes="w-6 h-6 md:w-auto md:h-auto"
                                    :disabled="isLoading"
                                    @click.stop="handleRemoveSupplierGroup(group.supplier.id)"
                                >
                                    <div class="flex gap-1 items-center">
                                        <svg class="w-4 h-4 text-red-500">
                                            <use xlink:href="/sprite.svg#delete"></use>
                                        </svg>
                                        <span class="hidden md:block">
                                            {{ t('cart.removeAll') }}
                                        </span>
                                    </div>
                                </Button>
                            </div>
                        </div>
                    </template>

                    <div class="space-y-4">
                        <div
                            v-if="hasSupplierDiscount(group)"
                            class="px-4 py-3 bg-red-50 border border-red-100 rounded-lg"
                        >
                            <div class="flex items-center gap-2">
                                <svg class="w-4 h-4 text-red-500">
                                    <use xlink:href="/sprite.svg#discount"></use>
                                </svg>
                                <span class="text-sm font-medium text-red-700">
                                    {{ t('product.discount') }}
                                </span>
                            </div>
                        </div>

                        <div class="divide-y divide-gray-200">
                            <ProductCard
                                v-for="item in group.items"
                                :key="item.id"
                                class="!px-0 first:!pt-0"
                                mode="cart"
                                :product="item.product"
                                :disabled="isLoading"
                            />
                        </div>
                    </div>
                </Collapse>

                <ClientOnly>
                    <NuxtLink
                        :to="localePath('/cart/checkout')"
                        :class="[
                            'block',
                            { 'pointer-events-none opacity-50': !canCheckout || isLoading },
                        ]"
                    >
                        <Button
                            color="blue"
                            variant="filled"
                            size="md"
                            class="mx-auto"
                            :disabled="!canCheckout || isLoading"
                        >
                            <div class="flex gap-1 items-center">
                                <svg class="w-4 h-4">
                                    <use xlink:href="/sprite.svg#cart2"></use>
                                </svg>
                                {{ t('checkout.shopNow') }}
                            </div>
                        </Button>
                    </NuxtLink>
                </ClientOnly>
            </div>
        </div>

        <Teleport to="body">
            <div
                v-if="showSuccessModal"
                class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50"
                @click="closeSuccessModal"
            >
                <div class="bg-white rounded-lg p-8 max-w-md mx-4 text-center" @click.stop>
                    <div class="mx-auto mb-6">
                        <img
                            src="/images/content/order-success.svg"
                            alt="Order submitted"
                            class="w-48 h-48 mx-auto"
                            loading="lazy"
                        />
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900 mb-2">
                        {{ t('success') }}
                    </h3>
                    <p class="text-gray-600 mb-6">
                        {{ t('orders.orderPlacedSuccessfully') }}
                    </p>
                    <Button
                        color="red"
                        variant="filled"
                        size="lg"
                        class="w-full"
                        @click="goToOrders"
                    >
                        {{ t('orders.viewOrders') }}
                    </Button>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
    import type { CartSupplierGroup } from '~/types/cart'

    definePageMeta({
        layout: 'default',
        scrollToTop: true,
    })

    const { t } = useI18n()
    const localePath = useLocalePath()
    const { formatCurrency } = useFormatters()
    const toast = useToastNotification()
    const cartStore = useCartStore()
    const userStore = useUserStore()

    const {
        supplierGroups,
        totalItemsCount,
        isLoading,
        error,
        canCheckout,
        // quickRemoveItem,
        // findCartItemByProduct,
        quickRemoveSupplierIdCart,
    } = useCart()

    const showSuccessModal = ref(false)
    const isRetrying = ref(false)

    const isInitialLoading = computed(() => {
        return (isLoading.value && !cartStore.isInitialized) || isRetrying.value
    })

    const isCartEmpty = computed(() => {
        return !isInitialLoading.value && !error.value && totalItemsCount.value === 0
    })

    const getSubtitle = computed(() => {
        if (isInitialLoading.value) {
            return t('cart.loading')
        }
        if (isCartEmpty.value) {
            return t('cart.emptyMessage')
        }
        return t('cart.viewShoppingCart')
    })

    const breadcrumbItems = computed(() => [
        { label: t('home'), to: localePath('/marketplace') },
        { label: t('navigation.eCommerce'), to: localePath('/marketplace') },
        { label: t('cart.shoppingCart'), to: localePath('/cart'), current: true },
    ])

    const formatSupplierTotal = (totals: any) => {
        if (!totals?.user_currency) {
            return '€0.00'
        }
        return formatCurrency(
            totals.user_currency.amount,
            totals.user_currency.currency?.symbol || '€'
        )
    }

    const hasSupplierDiscount = (group: CartSupplierGroup) => {
        if (!group?.items || !Array.isArray(group.items)) {
            return false
        }

        return group.items.some((item) => {
            const pricing = item?.product?.pricing || item?.product?.price
            return pricing?.user_currency?.has_discount || pricing?.product_currency?.has_discount
        })
    }

    const handleRemoveSupplierGroup = async (supplierId: number) => {
        if (isLoading.value) return

        try {
            await quickRemoveSupplierIdCart(supplierId)
        } catch (err: any) {
            console.error('[Cart] Remove supplier failed:', err)
            toast.error(err.message || t('cart.removeSupplierError'))
        }
    }

    const handleRetry = async () => {
        if (isRetrying.value) return

        isRetrying.value = true
        cartStore.resetError()

        try {
            await cartStore.fetchCart(true)
            toast.success(t('cart.reloaded'))
        } catch (err: any) {
            console.error('[Cart] Retry failed:', err)
            toast.error(t('cart.retryError'))
        } finally {
            isRetrying.value = false
        }
    }

    const closeSuccessModal = () => {
        showSuccessModal.value = false
    }

    const goToOrders = () => {
        showSuccessModal.value = false
        navigateTo(localePath('/buyers/orders/all'))
    }

    onMounted(async () => {
        if (userStore.isAuthenticated && userStore.isRegistrationComplete && userStore.isVerified) {
            if (!cartStore.isInitialized) {
                try {
                    await cartStore.ensureInitialized()
                } catch (err) {
                    console.error('[Cart Page] Initialization failed:', err)
                }
            }
        }
    })

    useSeoMeta({
        title: () => t('cart.shoppingCart'),
        description: () => t('cart.viewShoppingCart'),
    })
</script>

<style scoped>
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes bounceError {
        0%,
        20%,
        50%,
        80%,
        100% {
            transform: translateY(0);
        }
        40% {
            transform: translateY(-10px);
        }
        60% {
            transform: translateY(-5px);
        }
    }

    .animate-fade-in {
        animation: fadeIn 0.6s ease-out;
    }

    .animate-bounce-error {
        animation: bounceError 0.6s ease-in-out;
    }

    @media (prefers-reduced-motion: reduce) {
        .animate-fade-in,
        .animate-bounce-error {
            animation: none;
        }
    }
</style>
