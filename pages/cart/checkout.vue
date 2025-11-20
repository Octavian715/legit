<template>
    <div class="checkout-page pb-20 px-4 md:px-0">
        <Breadcrumbs :items="breadcrumbItems" />

        <PageHeader :title="t('navigation.checkout')" :subtitle="''" />

        <div v-if="isInitialLoading" class="bg-white px-4 py-6">
            <div class="animate-pulse space-y-6">
                <div class="space-y-4">
                    <div class="h-8 bg-gray-300 rounded w-1/4"></div>
                    <div class="h-12 bg-gray-300 rounded"></div>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 space-y-4">
                        <div class="h-8 bg-gray-300 rounded w-1/4"></div>
                        <div class="space-y-3">
                            <div class="h-24 bg-gray-300 rounded"></div>
                            <div class="h-24 bg-gray-300 rounded"></div>
                            <div class="h-24 bg-gray-300 rounded"></div>
                        </div>
                    </div>
                    <div>
                        <div class="h-48 bg-gray-300 rounded"></div>
                    </div>
                </div>
            </div>
        </div>

        <div v-else-if="isCartEmpty" class="text-center py-16 bg-white">
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
            <p class="text-subtitle1 text-gray-700 mb-8">{{ t('cart.startShopping') }}</p>
            <NuxtLink :to="localePath('/marketplace')">
                <Button color="red" variant="filled" size="md" class="mx-auto">
                    {{ t('cart.startShoppingButton') }}
                </Button>
            </NuxtLink>
        </div>

        <form v-else class="bg-white px-4 py-5" @submit.prevent="handleSubmit">
            <div class="space-y-4">
                <section>
                    <h2 class="text-title3 font-bold text-gray-950 mb-3">
                        {{ t('product.delivery') }}
                    </h2>

                    <AddressSelector
                        v-model="formData.selectedAddressId"
                        :addresses="userDeliveryAddresses"
                        :loading="isLoadingAddresses"
                        :errors="formErrors"
                    />

                    <div class="mt-3">
                        <NuxtLink :to="localePath('/settings?tab=delivery-address')">
                            <ButtonAction :label="t('checkout.addNewDeliveryAddress')" />
                        </NuxtLink>
                    </div>
                </section>

                <section class="space-y-4">
                    <h2 class="text-title3 font-bold text-gray-950">
                        {{ t('products') }}
                    </h2>

                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
                        <div class="lg:col-span-2">
                            <div class="space-y-3 border border-gray-600 rounded-sm p-3">
                                <div v-for="group in supplierGroups" :key="group.supplier.id">
                                    <!-- Product Cards -->
                                    <div class="space-y-3">
                                        <div v-for="item in group.items" :key="item.id">
                                            <div class="flex flex-col md:flex-row gap-2">
                                                <!-- Product Image -->
                                                <div
                                                    class="flex-shrink-0 border border-gray-600 rounded-sm overflow-hidden"
                                                >
                                                    <!-- <NuxtImg
                                                        v-if="item.product.images?.primary"
                                                        :src="item.product.images.primary"
                                                        :alt="
                                                            item.product.name_original ||
                                                            item.product.name_en
                                                        "
                                                        class="w-28 h-28 object-contain rounded"
                                                        loading="lazy"
                                                    /> -->
                                                    <img
                                                        v-if="item.product.images?.primary"
                                                        :src="item.product.images.primary"
                                                        :alt="
                                                            item.product.name_original ||
                                                            item.product.name_en
                                                        "
                                                        class="w-full h-full md:w-28 md:max-h-28 object-contain rounded-sm aspect-square"
                                                        loading="lazy"
                                                    />
                                                    <div
                                                        v-else
                                                        class="w-full h-full md:w-28 md:h-28 bg-gray-100 flex items-center justify-center"
                                                    >
                                                        <svg class="w-8 h-8 text-gray-400">
                                                            <use
                                                                xlink:href="/sprite.svg#image"
                                                            ></use>
                                                        </svg>
                                                    </div>
                                                </div>

                                                <!-- Product Details -->
                                                <div
                                                    class="flex-1 min-w-0 border border-gray-600 rounded py-3 px-2 space-y-1"
                                                >
                                                    <div
                                                        class="flex items-start justify-between gap-2"
                                                    >
                                                        <div class="flex gap-2">
                                                            <div
                                                                class="text-subtitle4 text-gray-800 md:w-28"
                                                            >
                                                                {{ t('product.trademark') }}:
                                                            </div>
                                                            <div
                                                                class="text-subtitle4 font-bold text-gray-950"
                                                            >
                                                                {{ item.product.brand }}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div class="flex gap-2">
                                                        <span
                                                            class="text-subtitle4 text-gray-800 md:w-28"
                                                        >
                                                            {{ t('product.originalTitle') }}:
                                                        </span>
                                                        <Link
                                                            :title="
                                                                item.product.name_original ||
                                                                item.product.name_en
                                                            "
                                                            class="text-subtitle4 font-bold"
                                                            :to="`/marketplace/product/${item.product.id}`"
                                                        />
                                                    </div>

                                                    <div class="flex gap-2">
                                                        <span
                                                            class="text-subtitle4 text-gray-800 md:w-28"
                                                        >
                                                            {{ t('category') }}:
                                                        </span>

                                                        <Link
                                                            :title="
                                                                item.product.category?.name ||
                                                                'Uncategorized'
                                                            "
                                                            class="text-subtitle4 font-bold"
                                                            :to="`/marketplace/category/${item.product.category?.slug}`"
                                                        />
                                                    </div>
                                                    <div class="flex gap-2">
                                                        <div class="flex gap-2">
                                                            <div
                                                                class="text-subtitle4 text-gray-800 md:w-28"
                                                            >
                                                                {{ t('quantity') }}:
                                                            </div>
                                                            <div
                                                                class="text-subtitle4 font-bold text-gray-950"
                                                            >
                                                                {{
                                                                    Number(item.product.quantity) ||
                                                                    0
                                                                }}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="flex gap-2">
                                                        <div class="flex gap-2">
                                                            <div
                                                                class="text-subtitle4 text-gray-800 md:w-28"
                                                            >
                                                                {{ t('totalPrice') }}:
                                                            </div>
                                                            <div
                                                                class="text-subtitle4 font-bold text-gray-950"
                                                            >
                                                                {{ getFormattedPrice(item) }}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Order Summary Column -->
                        <div class="lg:col-span-1 space-y-3">
                            <div class="bg-white border border-gray-600 rounded-sm p-3 space-y-3">
                                <div
                                    class="flex justify-between items-center text-subtitle1 font-bold text-gray-950"
                                >
                                    <span>
                                        {{ t('subtotal') }} ({{ getTotalItemCount() }}
                                        {{ t('items') }})
                                    </span>
                                    <span v-if="!userStore.updateUserLoading">
                                        {{ formatTotalAmount() }}
                                    </span>
                                    <div v-else class="h-5 flex items-center">
                                        <div class="loader-btn !bg-gray-950 h-4 w-16"></div>
                                    </div>
                                </div>

                                <!-- <div>
                                    <div
                                        class="flex justify-between items-center text-subtitle3 text-gray-950"
                                    >
                                        <span>
                                            {{ t('product.vat') }}
                                        </span>
                                        <span>
                                            {{ calculateVAT() }}
                                        </span>
                                    </div>
                                </div> -->
                            </div>

                            <div class="bg-white border border-gray-600 rounded-sm p-3">
                                <div
                                    class="flex justify-between items-center text-subtitle1 font-bold text-gray-950"
                                >
                                    <span>
                                        {{ t('total') }}
                                    </span>
                                    <span v-if="!userStore.updateUserLoading">
                                        {{ formatTotalAmount() }}
                                    </span>
                                    <div v-else class="h-5 flex items-center">
                                        <div class="loader-btn !bg-gray-950 h-4 w-16"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div class="flex justify-center pt-6 border-t border-gray-200">
                    <Button
                        type="submit"
                        color="blue"
                        variant="filled"
                        size="lg"
                        class="w-full sm:w-auto px-12"
                        :disabled="isSubmitting"
                    >
                        <div class="flex gap-2 items-center justify-center">
                            <svg v-if="!isSubmitting" class="w-5 h-5">
                                <use xlink:href="/sprite.svg#shopping-cart"></use>
                            </svg>
                            <span v-if="isSubmitting">{{ t('processing') }}...</span>
                            <span v-else>{{ t('checkout.placeOrder') }}</span>
                        </div>
                    </Button>
                </div>
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
    import { useI18n } from 'vue-i18n'
    import { useLocalePath } from '#imports'
    import { useCart } from '~/composables/useCart'
    import { useStaticData } from '~/composables/useStaticData'
    import { useFormatters } from '~/composables/useFormatters'
    import Link from '~/components/ui/Link.vue'
    import AddressSelector from '~/components/features/ecommerce/checkout/AddressSelector.vue'
    import type { CheckoutFormData, DeliveryLocation } from '~/types/checkout'

    definePageMeta({
        layout: 'default',
    })

    const { t } = useI18n()
    const localePath = useLocalePath()
    const router = useRouter()
    const { formatWithUserCurrency } = useFormatters()
    const toast = useToastNotification()
    const userStore = useUserStore()
    const cartStore = useCartStore()
    const { user } = storeToRefs(userStore)

    const { supplierGroups, summary, createOrderFromCart } = useCart()

    const { countryOptions, isLoaded } = useStaticData()

    const isLiteSupplier = computed(() => userStore?.currentPlan?.plan?.code === 'supplier-lite')

    if (
        userStore.isAuthenticated &&
        userStore.isRegistrationComplete &&
        userStore.isVerified &&
        !isLiteSupplier
    ) {
        await callOnce('cart-init', () => cartStore.ensureInitialized())
    }

    const formData = ref<CheckoutFormData>({
        selectedAddressId: null,
        contact_person: {
            company_name: '',
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
        },
    })

    const showNewAddressForm = ref(false)
    const newAddress = ref<DeliveryLocation>({
        contact_name: '',
        phone_number: '',
        phone_country_id: 1,
        country_id: null,
        state_name: '',
        city_name: '',
        street_name: '',
        street_number: '',
        postal_code: '',
    })

    const formErrors = ref<Record<string, string>>({})
    const isSubmitting = ref(false)
    const isLoadingAddresses = ref(false)

    const isInitialLoading = computed(() => {
        return cartStore.isLoading && !cartStore.isInitialized
    })

    const userDeliveryAddresses = computed(() => {
        return user.value?.delivery_locations || []
    })

    const isCartEmpty = computed(() => {
        return (
            !isInitialLoading.value && (!supplierGroups.value || supplierGroups.value.length === 0)
        )
    })

    const breadcrumbItems = computed(() => [
        { label: t('home'), to: localePath('/marketplace') },
        { label: t('navigation.shoppingCart'), to: localePath('/cart') },
        { label: t('navigation.checkout'), to: localePath('/cart/checkout'), current: true },
    ])

    const formatCurrency = (amount: number, symbol: string) => {
        return `${symbol}${amount.toFixed(2)}`
    }

    const getTotalItemCount = () => {
        let count = 0
        supplierGroups.value?.forEach((group) => {
            group.items.forEach((item) => {
                count += Number(item.quantity) || 0
            })
        })
        return Math.floor(count)
    }

    const calculateSubtotal = () => {
        let total = 0
        supplierGroups.value?.forEach((group) => {
            total += group.totals?.user_currency?.amount || 0
        })
        return total
    }

    const calculateVAT = () => {
        const subtotal = calculateSubtotal()
        const vatRate = 0.19
        const vatAmount = subtotal - subtotal / (1 + vatRate)
        return formatWithUserCurrency(vatAmount, 2)
    }

    const formatTotalAmount = () => {
        const total = calculateSubtotal()
        return formatWithUserCurrency(total, 2)
    }

    const validateForm = (): boolean => {
        formErrors.value = {}
        let isValid = true

        if (!formData.value.selectedAddressId) {
            formErrors.value['address'] = t('checkout.selectDeliveryAddress')
            toast.error(t('checkout.selectDeliveryAddress'))
            isValid = false
        } else {
            const selectedAddress = userDeliveryAddresses.value.find(
                (addr) => addr.id === formData.value.selectedAddressId
            )

            if (!selectedAddress) {
                formErrors.value['address'] = t('checkout.addressNotFound')
                toast.error(t('checkout.addressNotFound'))
                isValid = false
            } else if (!selectedAddress.country?.id) {
                formErrors.value['address'] = t('checkout.addressMissingCountry')
                toast.error(t('checkout.addressMissingCountry'))
                isValid = false
            }
        }

        return isValid
    }

    const handleSubmit = async () => {
        if (!validateForm()) {
            toast.error(t('validation.formErrors'))
            return
        }

        if (!supplierGroups.value || supplierGroups.value.length === 0) {
            toast.error(t('cart.emptyMessage'))
            return
        }

        isSubmitting.value = true

        try {
            let deliveryDetail = null

            if (formData.value.selectedAddressId) {
                const selectedAddress = userDeliveryAddresses.value.find(
                    (addr) => addr.id === formData.value.selectedAddressId
                )

                if (selectedAddress && selectedAddress.country?.id) {
                    deliveryDetail = {
                        contact_name: selectedAddress.contact_name || '',
                        phone_number: selectedAddress.phone_number || '',
                        country_id: Number(selectedAddress.country.id),
                        state_name: selectedAddress.state_name || '',
                        phone_country_id: selectedAddress.country.id || '',
                        city_name: selectedAddress.city_name || '',
                        street_name: selectedAddress.street_name || '',
                        street_number: selectedAddress.street_number || '',
                        postal_code: selectedAddress.postal_code || '',
                    }
                }
            }

            const contactPerson = {
                company_name: user.value?.company_details?.legal_name || '',
                first_name: user.value?.name?.split(' ')[0] || '',
                last_name: user.value?.name?.split(' ').slice(1).join(' ') || '',
                email: user.value?.email || '',
                phone: user.value?.contacts?.[0]?.phones?.[0]?.phone_number || '',
            }

            const documentNotes = JSON.stringify({
                contact_person: contactPerson,
            })

            const orderPromises = supplierGroups.value.map((group) =>
                createOrderFromCart(group.supplier.id, documentNotes, deliveryDetail)
            )

            const orders = await Promise.all(orderPromises)

            toast.success(t('checkout.orderSuccess'))

            await router.push({
                path: localePath('/cart/order-success'),
                query: {
                    orderIds: orders.map((o) => o.id).join(','),
                    orderNumbers: orders.map((o) => o.number).join(','),
                },
            })
        } catch (error: any) {
            console.error('Checkout error:', error)

            if (error.response?.data?.errors?.country_id) {
                toast.error(t('checkout.addressMissingCountry'))
            } else {
                toast.error(
                    error.response?.data?.message || error.message || t('checkout.orderError')
                )
            }
        } finally {
            isSubmitting.value = false
        }
    }

    const getFormattedPrice = (item: any) => {
        const pricing = item.product?.pricing

        if (!pricing) {
            return formatCurrency(0, '$')
        }

        let price = 0
        let currencySymbol = '$'

        if (pricing.line_totals?.user_currency?.final != null) {
            price = pricing.line_totals.user_currency.final
            currencySymbol = pricing.line_totals.user_currency.currency?.symbol || '$'
        } else if (pricing.line_totals?.product_currency?.final != null) {
            price = pricing.line_totals.product_currency.final
            currencySymbol = pricing.line_totals.product_currency.currency?.symbol || '€'
        } else {
            const quantity = parseFloat(item.product?.quantity || '0')

            if (pricing.unit_price?.user_currency?.final != null) {
                price = pricing.unit_price.user_currency.final * quantity
                currencySymbol = pricing.unit_price.user_currency.currency?.symbol || '$'
            } else if (pricing.unit_price?.product_currency?.final != null) {
                price = pricing.unit_price.product_currency.final * quantity
                currencySymbol = pricing.unit_price.product_currency.currency?.symbol || '€'
            }
        }

        return formatWithUserCurrency(price, 2)
    }

    onMounted(async () => {
        if (!isLoaded.value) {
            await useStaticData().initialize()
        }

        if (userDeliveryAddresses.value.length > 0) {
            const defaultAddress = userDeliveryAddresses.value.find((addr) => addr.is_default)
            if (defaultAddress) {
                formData.value.selectedAddressId = defaultAddress.id
            }
        }
    })

    useSeoMeta({
        title: () => t('navigation.checkout'),
    })
</script>

<style scoped>
    .loader-btn {
        width: 1rem;
        height: 1rem;
        border: 2px solid #e5e7eb;
        border-top-color: currentColor;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
