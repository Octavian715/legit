<template>
    <Teleport to="body">
        <Transition name="modal" appear>
            <div v-if="isOpen" class="modal-wrapper">
                <div class="modal-backdrop" @click.self="handleClose" />
                <div
                    ref="modalContent"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="product-search-modal"
                    class="modal-content"
                >
                    <header
                        class="px-5 py-3 flex justify-between items-center gap-2.5 border-b border-gray-400 h-[64px]"
                    >
                        <h2 id="product-search-modal" class="text-title3 font-bold text-gray-950">
                            {{ t('orders.productSearch.title') }}
                        </h2>
                        <ButtonClose aria-labelledby="product-search-modal" @click="handleClose" />
                    </header>

                    <section class="py-5 px-5 space-y-4 border-b border-gray-400">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <InputSearch
                                v-model="searchQuery"
                                :placeholder="t('orders.productSearch.searchLabel')"
                                size="lg"
                                :disabled="isLoading"
                                :show-clear-button="true"
                                @search="debouncedSearch"
                                @clear="handleClearSearch"
                            />
                            <Select
                                v-model="selectedBrand"
                                :options="brandOptions"
                                :label="t('orders.productSearch.brand')"
                                select-label="label"
                                :reduce="(option: any) => option.value"
                                size="lg"
                                clearable
                                :disabled="isLoading"
                                @update:model-value="handleFilterChange"
                            />
                        </div>

                        <div
                            class="flex items-center gap-1 text-caption sm:text-subtitle3 text-gray-700"
                        >
                            <svg class="h-4 w-4 flex-shrink-0">
                                <use xlink:href="/sprite.svg#info"></use>
                            </svg>
                            <span>{{ t('orders.productSearch.searchHint') }}</span>
                        </div>
                    </section>

                    <section
                        class="py-5 px-5 overflow-y-auto"
                        style="max-height: calc(90vh - 250px)"
                    >
                        <div v-if="isLoading" class="space-y-3">
                            <div
                                v-for="i in 4"
                                :key="`skeleton-${i}`"
                                class="flex items-start gap-3 p-3 sm:p-4 border border-gray-300 rounded"
                            >
                                <div
                                    class="w-20 h-20 sm:w-24 sm:h-24 bg-gray-300 rounded animate-pulse flex-shrink-0"
                                ></div>
                                <div class="flex-1 space-y-2 min-w-0">
                                    <div class="h-4 w-3/4 bg-gray-300 rounded animate-pulse"></div>
                                    <div class="h-3 w-1/2 bg-gray-300 rounded animate-pulse"></div>
                                    <div class="h-3 w-2/3 bg-gray-300 rounded animate-pulse"></div>
                                </div>
                            </div>
                        </div>

                        <div
                            v-else-if="error"
                            class="p-3 sm:p-4 bg-red-50 border border-red-200 rounded"
                        >
                            <div class="flex items-start gap-3">
                                <svg
                                    class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <div class="flex-1 min-w-0">
                                    <p class="text-subtitle3 text-red-900">{{ error }}</p>
                                    <button
                                        type="button"
                                        class="text-subtitle3 text-red-700 underline mt-2"
                                        @click="retryLoad"
                                    >
                                        {{ t('orders.productSearch.retry') }}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <NoDataPage
                            v-else-if="filteredProducts.length === 0 && hasSearched"
                            :title="t('orders.productSearch.noResults')"
                            :description="t('orders.productSearch.tryDifferent')"
                            :button-label="t('orders.productSearch.resetSearch')"
                            @action="handleClearSearch"
                        />

                        <div v-else-if="paginatedProducts.length > 0" class="space-y-3">
                            <article
                                v-for="product in paginatedProducts"
                                :key="product.id"
                                class="flex items-start gap-3 p-3 bg-white border border-gray-400 rounded hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
                                @click="handleSelectProduct(product)"
                            >
                                <div
                                    class="relative w-24 h-24 flex-shrink-0 bg-gray-100 rounded overflow-hidden border border-gray-400"
                                >
                                    <img
                                        v-if="product.primary_image"
                                        :src="product.primary_image"
                                        :alt="product.name_original"
                                        class="w-full h-full object-contain"
                                        loading="lazy"
                                    />
                                    <svg
                                        v-else
                                        class="w-full h-full text-gray-400 p-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                        />
                                    </svg>
                                </div>

                                <div class="flex-1 min-w-0 space-y-1.5">
                                    <h3
                                        class="text-subtitle2 font-bold text-gray-950 line-clamp-2 leading-tight"
                                    >
                                        {{ product.name_original }}
                                    </h3>

                                    <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-subtitle3">
                                        <div class="flex items-center gap-1.5">
                                            <span class="text-gray-800 flex-shrink-0">Brand:</span>
                                            <span class="text-gray-950 font-semibold truncate">{{
                                                product.brand_name || '-'
                                            }}</span>
                                        </div>

                                        <div class="flex items-center gap-1.5">
                                            <span class="text-gray-800 flex-shrink-0"
                                                >{{ t('sku', 0) }}:</span
                                            >
                                            <span class="text-gray-950 truncate">{{
                                                product.article_number || '-'
                                            }}</span>
                                        </div>

                                        <div class="flex items-center gap-1.5">
                                            <span class="text-gray-800 flex-shrink-0"
                                                >{{ t('table.weight') }}:</span
                                            >
                                            <span class="text-gray-950">{{
                                                formatWeight(product)
                                            }}</span>
                                        </div>

                                        <div class="flex items-center gap-1.5">
                                            <span class="text-gray-800 flex-shrink-0"
                                                >{{ t('table.vat') }}:</span
                                            >
                                            <span class="text-gray-950">{{
                                                formatVat(product.local_vat)
                                            }}</span>
                                        </div>

                                        <div class="flex items-center gap-1.5 col-span-2">
                                            <span class="text-gray-800 flex-shrink-0"
                                                >{{ t('table.eanProduct') }}:</span
                                            >
                                            <span
                                                class="text-gray-950 font-mono text-subtitle3 truncate"
                                                >{{ product.ean_product || '-' }}</span
                                            >
                                        </div>

                                        <div class="flex items-center gap-1.5 col-span-2">
                                            <span class="text-gray-800 flex-shrink-0"
                                                >{{ t('table.eanBox') }}:</span
                                            >
                                            <span
                                                class="text-gray-950 font-mono text-subtitle3 truncate"
                                                >{{ product.ean_box || '-' }}</span
                                            >
                                        </div>
                                    </div>

                                    <div
                                        v-if="product.prices && product.prices.length > 0"
                                        class="flex flex-wrap gap-1.5 pt-0.5"
                                    >
                                        <span
                                            v-for="(price, idx) in product.prices"
                                            :key="idx"
                                            class="inline-flex items-center gap-1.5 px-2 py-1 rounded text-subtitle2"
                                        >
                                            <span
                                                class="font-bold"
                                                :class="
                                                    idx === 0 ? 'text-blue-800' : 'text-gray-950'
                                                "
                                            >
                                                {{ formatPrice(price) }}
                                            </span>
                                            <span class="text-gray-800 capitalize text-subtitle4"
                                                >({{ price.price_type }})</span
                                            >
                                        </span>
                                    </div>
                                </div>

                                <svg
                                    class="w-5 h-5 text-gray-400 flex-shrink-0 mt-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </article>

                            <div v-if="canLoadMore" class="text-center pt-2">
                                <Button
                                    :label="t('orders.productSearch.loadMore')"
                                    size="md"
                                    color="blue"
                                    variant="outline"
                                    @click="loadMore"
                                />
                            </div>
                        </div>

                        <div v-else class="text-center py-8 sm:py-12">
                            <svg
                                class="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                            <p class="text-subtitle2 font-semibold text-gray-700">{{
                                t('orders.productSearch.startSearching')
                            }}</p>
                            <p class="text-subtitle3 text-gray-600 mt-2">{{
                                t('orders.productSearch.enterSearch')
                            }}</p>
                        </div>
                    </section>

                    <footer
                        class="flex gap-2.5 justify-between px-5 py-3 sm:px-5 border-t border-gray-500"
                    >
                        <p class="text-caption sm:text-subtitle3 text-gray-700 self-center">
                            {{
                                t('orders.productSearch.resultsCount', {
                                    count: filteredProducts.length,
                                })
                            }}
                        </p>
                        <Button
                            :label="t('cancel')"
                            size="lg"
                            color="gray"
                            variant="filled"
                            @click="handleClose"
                        />
                    </footer>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
    import type { UserProduct, ProductPrice } from '~/types/documents'

    interface Props {
        isOpen: boolean
        selectedCurrencyId?: number | null
    }

    const props = withDefaults(defineProps<Props>(), {
        selectedCurrencyId: null,
    })

    const emit = defineEmits<{
        'update:isOpen': [value: boolean]
        productSelected: [product: any]
        error: [message: string]
    }>()

    const { t } = useI18n()
    const { formatCurrency: formatUserCurrency } = useFormatters()
    const documentsStore = useDocumentsStore()

    const searchQuery = ref('')
    const selectedBrand = ref<string | null>(null)
    const hasSearched = ref(false)
    const currentPage = ref(1)
    const itemsPerPage = 20
    const modalContent = ref<HTMLElement | null>(null)

    const isLoading = computed(() => documentsStore.loadingProducts)
    const error = computed(() => documentsStore.productsError)
    const allProducts = computed(() => documentsStore.getUserProducts)

    const brandOptions = computed(() => {
        const brands = new Set<string>()

        allProducts.value.forEach((product) => {
            if (product.brand_name) {
                brands.add(product.brand_name)
            }
        })

        return [
            ...Array.from(brands)
                .sort()
                .map((brand) => ({ label: brand, value: brand })),
        ]
    })

    const filteredProducts = computed(() => {
        let results = [...allProducts.value]

        const trimmedQuery = searchQuery.value.trim().toLowerCase()
        if (trimmedQuery) {
            results = results.filter((product) => {
                const searchText = [
                    product.name_original,
                    product.article_number,
                    product.brand_name,
                    product.ean_product,
                    product.ean_box,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()

                return searchText.includes(trimmedQuery)
            })
        }

        if (selectedBrand.value) {
            results = results.filter((product) => product.brand_name === selectedBrand.value)
        }

        return results
    })

    const paginatedProducts = computed(() => {
        const start = 0
        const end = currentPage.value * itemsPerPage
        return filteredProducts.value.slice(start, end)
    })

    const canLoadMore = computed(
        () => paginatedProducts.value.length < filteredProducts.value.length
    )

    const formatPrice = (price: ProductPrice): string => {
        const priceValue = Number(price.price) || 0

        if (price.currency) {
            return `${price.currency.symbol}${priceValue.toFixed(2)}`
        }
        return formatUserCurrency(priceValue)
    }

    const formatVat = (vat: string | number): string => {
        const vatValue = Number(vat) || 0
        return `${vatValue}%`
    }

    const formatWeight = (product: UserProduct): string => {
        if (!product.weight_net || !product.weight_net_type) return '-'
        return `${product.weight_net}${product.weight_net_type.symbol}`
    }

    const extractPriceByType = (product: UserProduct, priceType: string): number => {
        const price = product.prices?.find((p) => p.price_type === priceType)
        return price ? Number(price.price) : 0
    }

    const loadMore = () => {
        currentPage.value += 1
    }

    const handleClearSearch = () => {
        searchQuery.value = ''
        currentPage.value = 1
        hasSearched.value = false
    }

    const handleFilterChange = () => {
        currentPage.value = 1
        hasSearched.value = true
    }

    let searchTimeout: NodeJS.Timeout
    const debouncedSearch = () => {
        clearTimeout(searchTimeout)
        searchTimeout = setTimeout(() => {
            currentPage.value = 1
            hasSearched.value = true
        }, 300)
    }

    const handleSelectProduct = (product: UserProduct) => {
        const localPrice = extractPriceByType(product, 'local')
        const exportPrice = extractPriceByType(product, 'export')

        const defaultPrice =
            localPrice || exportPrice || (product.prices?.[0] ? Number(product.prices[0].price) : 0)

        const formattedProduct = {
            id: product.id,
            productId: product.id,
            name: product.name_original,
            sku: product.article_number || '',
            ean: product.ean_product || '',
            bbd: '',
            eanBarcodeUrl: product.ean_product_url || '',
            price: defaultPrice,
            localPrice: localPrice || defaultPrice,
            exportPrice: exportPrice || defaultPrice,
            vatLocal: Number(product.local_vat) || 20,
            vatExport: Number(product.export_vat) || 0,
            weight:
                product.weight_net && product.weight_net_type
                    ? {
                          value: product.weight_net,
                          unit: product.weight_net_type.symbol,
                      }
                    : null,
            brandName: product.brand_name || '',
            image: product.primary_image || '',
        }

        emit('productSelected', formattedProduct)
        handleClose()
    }

    const handleClose = () => {
        emit('update:isOpen', false)
        searchQuery.value = ''
        selectedBrand.value = null
        hasSearched.value = false
        currentPage.value = 1
    }

    const retryLoad = async () => {
        documentsStore.clearProductsError()
        await documentsStore.fetchUserProducts(true)
    }

    const onKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && props.isOpen) {
            handleClose()
        }
    }

    watch(
        () => props.isOpen,
        async (newVal) => {
            if (newVal) {
                await documentsStore.fetchUserProducts()
                document.body.classList.add('overflow-hidden')
            } else {
                document.body.classList.remove('overflow-hidden')
            }
        }
    )

    onMounted(() => {
        window.addEventListener('keydown', onKeydown)
    })

    onUnmounted(() => {
        window.removeEventListener('keydown', onKeydown)
        document.body.classList.remove('overflow-hidden')
        clearTimeout(searchTimeout)
    })
</script>

<style scoped>
    .modal-wrapper {
        position: fixed;
        inset: 0;
        z-index: 50;
        display: flex;
        align-items: center;
        justify-content: center;
        will-change: opacity;
    }

    .modal-backdrop {
        position: absolute;
        inset: 0;
        background: rgb(243 244 246 / 0.8);
        backdrop-filter: blur(2px);
        -webkit-backdrop-filter: blur(2px);
        will-change: opacity;
    }

    .modal-content {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate3d(-50%, -50%, 0);
        background: white;
        border-radius: 0.25rem;
        box-shadow:
            0 25px 50px -12px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(0, 0, 0, 0.05);
        width: 90vw;
        max-width: 1024px;
        max-height: 90vh;
        z-index: 51;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .modal-enter-from,
    .modal-leave-to {
        opacity: 0;
    }

    .modal-enter-to,
    .modal-leave-from {
        opacity: 1;
    }

    .modal-enter-active .modal-backdrop,
    .modal-leave-active .modal-backdrop {
        transition: opacity 100ms ease-out;
    }

    .modal-enter-from .modal-backdrop,
    .modal-leave-to .modal-backdrop {
        opacity: 0;
    }

    .modal-enter-active .modal-content {
        transition:
            transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1),
            opacity 150ms ease-out;
        transition-delay: 50ms;
    }

    .modal-leave-active .modal-content {
        transition:
            transform 150ms cubic-bezier(0.4, 0, 1, 1),
            opacity 100ms ease-in;
    }

    .modal-enter-from .modal-content {
        transform: translate3d(-50%, -50%, 0) scale(0.95);
        opacity: 0;
    }

    .modal-leave-to .modal-content {
        transform: translate3d(-50%, -50%, 0) scale(0.98);
        opacity: 0;
    }

    .modal-enter-to .modal-content,
    .modal-leave-from .modal-content {
        transform: translate3d(-50%, -50%, 0) scale(1);
        opacity: 1;
    }

    @media (max-width: 640px) {
        .modal-content {
            max-height: calc(100vh - 2rem);
            width: 95vw;
        }

        .modal-enter-from .modal-content {
            transform: translate3d(-50%, -40%, 0) scale(0.9);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .modal-enter-active,
        .modal-leave-active,
        .modal-enter-active .modal-backdrop,
        .modal-leave-active .modal-backdrop,
        .modal-enter-active .modal-content,
        .modal-leave-active .modal-content {
            transition-duration: 0.01ms !important;
            transition-delay: 0ms !important;
        }
    }
</style>
