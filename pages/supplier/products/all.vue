<template>
    <div class="flex flex-col gap-3">
        <Breadcrumbs :items="breadcrumbs" />

        <div class="bg-white rounded-sm">
            <div class="p-4 space-y-3">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-gray-950 font-bold text-title2">
                            {{ t('navigation.allProducts') }}
                        </h1>
                        <p class="text-gray-800 text-subtitle3 mt-1">
                            {{
                                totalProducts
                                    ? t('products', totalProducts)
                                    : t('productPrices.loadingProductsPrices')
                            }}
                        </p>
                    </div>
                    <div class="flex items-center gap-2">
                        <InputSearch
                            v-model.trim="searchQuery"
                            :placeholder="t('allProductsPage.searchPlaceholder')"
                            size="md"
                            background="bg-gray-150 hidden md:block"
                            container-classes="rounded-sm"
                            @search="handleSearchInput"
                            @clear="handleSearchClear"
                        />
                        <Button
                            variant="ghost"
                            color="gray"
                            size="lg"
                            square
                            container-classes="!p-1 relative"
                            :tooltip="t('filters.title')"
                            @click="openFilters"
                        >
                            <svg class="w-4 h-4 flex-1">
                                <use xlink:href="/sprite.svg#filter" />
                            </svg>
                            <span
                                v-if="hasActiveFilters"
                                class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"
                                :aria-label="t('allProductsPage.activeFiltersIndicator')"
                            ></span>
                        </Button>
                    </div>
                </div>

                <ClientOnly>
                    <AllProductsTable
                        :products="products"
                        :meta="productsMeta"
                        :loading="isLoading"
                        :show-pagination="canLoadMore.products || totalItems > itemsPerPage"
                        :current-page="currentPage"
                        :items-per-page="itemsPerPage"
                        :sort-by="sortBy"
                        :sort-direction="sortDirection"
                        @page-change="handlePageChange"
                        @items-per-page-change="handleItemsPerPageChange"
                        @sort-change="handleSortChange"
                        @action="handleTableAction"
                    />
                </ClientOnly>
            </div>
        </div>

        <ClientOnly>
            <AllProductsFilterDrawer
                :is-open="isFilterDrawerOpen"
                :filters="activeFilters"
                @update:is-open="isFilterDrawerOpen = $event"
                @apply="handleApplyFilters"
                @reset="resetFilters"
            />
        </ClientOnly>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, nextTick, watch } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useLocalePath } from '#imports'
    import { useDebounceFn } from '@vueuse/core'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { useDashboardProduct } from '~/composables/useDashboardProduct'
    import { useDashboardProductStore } from '~/stores/dashboardProduct'
    import { useModalStore } from '~/stores/modal'
    import { useProduct } from '~/composables/useProduct'
    import type { ProductFeaturesFilters, ProductFeaturesSort } from '~/types/dashboardProduct'
    import type { SortDirection } from '~/types/ui/table'
    import { useProductStaticData } from '~/composables/useProductStaticData'
    import { useProductStore } from '~/stores/product'
    definePageMeta({ middleware: ['supplier'], layout: 'app' })

    const { t } = useI18n()
    const localePath = useLocalePath()
    const toast = useToastNotification()
    const dashboardProductStore = useDashboardProductStore()
    const productStore = useProductStore()

    const modalStore = useModalStore()
    const { getAllDashboardProductsFiltered } = useDashboardProduct()
    const { initialize } = useProductStaticData()
    const { updateStatusOnly } = useProduct()

    const isFilterDrawerOpen = ref(false)
    const refreshKey = ref(0)
    const searchQuery = ref('')

    const activeFilters = ref<ProductFeaturesFilters>({
        search: '',
        brand_names: [],
        category_ids: [],
        status_ids: [],
        min_amount: undefined,
        max_amount: undefined,
    })

    const totalProducts = computed(() => dashboardProductStore.productFeaturesMeta?.total || 0)
    const totalItems = computed(() => dashboardProductStore.productFeaturesMeta?.total || 0)
    const totalPages = computed(() => {
        if (totalItems.value === 0 || itemsPerPage.value === 0) return 1
        return Math.ceil(totalItems.value / itemsPerPage.value)
    })

    const currentPage = ref(1)
    const itemsPerPage = ref(20)
    const sortBy = ref<ProductFeaturesSort | undefined>(undefined)
    const sortDirection = ref<SortDirection | undefined>(undefined)
    const isHandlingAction = ref(false)
    const isFetching = ref(false)

    let currentRequestId = 0

    const canLoadMore = computed(() => ({
        products: currentPage.value < totalPages.value,
    }))

    const products = computed(() => dashboardProductStore.productsWithFeatures)
    const productsMeta = computed(() => dashboardProductStore.productFeaturesMeta)
    const isLoading = computed(() => dashboardProductStore.isLoading)

    const activeFiltersCount = computed(() => {
        let count = 0

        if (
            Array.isArray(activeFilters.value.brand_names) &&
            activeFilters.value.brand_names.length > 0
        )
            count++
        if (
            Array.isArray(activeFilters.value.category_ids) &&
            activeFilters.value.category_ids.length > 0
        )
            count++
        if (
            Array.isArray(activeFilters.value.status_ids) &&
            activeFilters.value.status_ids.length > 0
        )
            count++
        if (activeFilters.value.min_amount !== undefined) count++
        if (activeFilters.value.max_amount !== undefined) count++

        return count
    })

    const hasActiveFilters = computed(() => {
        return activeFiltersCount.value > 0 || searchQuery.value?.trim()?.length > 0
    })

    const breadcrumbs = computed(() => [
        { label: t('home'), to: localePath('/supplier/dashboard') },
        { label: t('navigation.products'), to: localePath('/supplier/products/overview') },
        { label: t('navigation.allProducts'), to: localePath('/supplier/products/all') },
    ])

    const transformFiltersForAPI = (filters: ProductFeaturesFilters): ProductFeaturesFilters => {
        const apiFilters: ProductFeaturesFilters = { ...filters }

        if (Array.isArray(filters.brand_names) && filters.brand_names.length > 0) {
            apiFilters.brand_names = filters.brand_names
        } else {
            delete apiFilters.brand_names
        }

        if (Array.isArray(filters.category_ids) && filters.category_ids.length > 0) {
            apiFilters.category_ids = filters.category_ids
        } else {
            delete apiFilters.category_ids
        }

        if (Array.isArray(filters.status_ids) && filters.status_ids.length > 0) {
            apiFilters.status_ids = filters.status_ids
        } else {
            delete apiFilters.status_ids
        }

        if (!apiFilters.search?.trim()) {
            delete apiFilters.search
        }

        if (apiFilters.min_amount === undefined || apiFilters.min_amount === null) {
            delete apiFilters.min_amount
        }

        if (apiFilters.max_amount === undefined || apiFilters.max_amount === null) {
            delete apiFilters.max_amount
        }

        return apiFilters
    }

    const updateProductStatusLocally = (
        productId: number,
        statusData: { id: number; name: string }
    ): boolean => {
        if (!products.value || !statusData) {
            return false
        }

        const productIndex = products.value.findIndex(
            (p: any) => p.product_id === Number(productId)
        )
        if (productIndex === -1) {
            return false
        }

        // Update the status object with the new ID
        products.value[productIndex].status = {
            ...products.value[productIndex].status,
            id: statusData.id,
            name: statusData.name,
        }

        return true
    }

    const fetchProducts = async () => {
        if (isFetching.value) {
            return false
        }

        const requestId = ++currentRequestId

        try {
            isFetching.value = true

            if (requestId !== currentRequestId) {
                return false
            }

            if (currentPage.value > totalPages.value && totalPages.value > 0) {
                currentPage.value = totalPages.value
            }

            const apiFilters = transformFiltersForAPI(activeFilters.value)

            const filters: ProductFeaturesFilters = {
                ...apiFilters,
                page: currentPage.value,
                per_page: itemsPerPage.value,
                sort_by: sortBy.value,
                sort_direction: sortDirection.value,
            }

            const success = await getAllDashboardProductsFiltered(filters)

            if (requestId !== currentRequestId) {
                return false
            }

            if (success && productsMeta.value?.total !== undefined) {
                const newTotalPages = Math.ceil(productsMeta.value.total / itemsPerPage.value) || 1
                if (currentPage.value > newTotalPages && newTotalPages > 0) {
                    currentPage.value = newTotalPages
                    return fetchProducts()
                }
            }

            return !!success
        } catch (error: any) {
            if (requestId !== currentRequestId) {
                return false
            }

            console.error('Failed to fetch products:', error)
            toast.error(error.message || t('allProductsPage.errors.fetchFailed'))
            return false
        } finally {
            if (requestId === currentRequestId) {
                isFetching.value = false
            }
        }
    }

    const debouncedFetch = useDebounceFn(fetchProducts, 300)

    const handleSearchInput = (value: string) => {
        searchQuery.value = value?.trim() || ''
        activeFilters.value.search = searchQuery.value
        currentPage.value = 1
        debouncedFetch()
    }

    const handleSearchClear = () => {
        searchQuery.value = ''
        activeFilters.value.search = ''
        currentPage.value = 1
        debouncedFetch()
    }

    const showDeleteProductConfirmation = async (productData: any): Promise<boolean> => {
        return new Promise(async (resolve) => {
            try {
                const moduleImport = await import(
                    '~/components/features/supplier/products/modals/ProductConfirmationModal.vue'
                )
                const ProductConfirmationModal = moduleImport.default

                modalStore.openModal(
                    ProductConfirmationModal,
                    'deleteProductConfirmation',
                    {
                        productName: productData.product_original_name || productData.brand_name,
                        productId: productData.product_id,
                        productArticle: productData.article_number,
                        action: 'deleteProduct',
                    },
                    {
                        title: t('dashboardProduct.confirmDeleteTitle'),
                        contentWidth: 'max-w-sm sm:max-w-md',
                        hideFooter: true,
                        onOk: async () => {
                            const result = await productStore.deleteProduct(productData.product_id)

                            if (result) {
                                toast.success(t('product.deleteSuccess'))
                                await fetchProducts()
                            }

                            resolve(result)
                        },
                        onClose: () => resolve(false),
                    }
                )
            } catch (error) {
                toast.error(t('allProductsPage.errors.confirmationDialogFailed'))
                resolve(false)
            }
        })
    }
    const handlePageChange = (page: number) => {
        if (currentPage.value === page || isFetching.value) {
            return
        }

        const maxPage = Math.max(1, totalPages.value)
        const validPage = Math.max(1, Math.min(page, maxPage))

        currentPage.value = validPage
        nextTick(() => {
            fetchProducts()
        })
    }

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        if (itemsPerPage.value === newItemsPerPage || isFetching.value) {
            return
        }

        itemsPerPage.value = newItemsPerPage
        currentPage.value = 1
        nextTick(() => {
            fetchProducts()
        })
    }

    const handleSortChange = (
        field: ProductFeaturesSort | undefined,
        direction: 'asc' | 'desc' | undefined
    ) => {
        if (isFetching.value) {
            return
        }

        if (!field || direction === undefined) {
            sortBy.value = undefined
            sortDirection.value = undefined
        } else {
            sortBy.value = field
            sortDirection.value = direction
        }

        currentPage.value = 1
        nextTick(() => {
            fetchProducts()
        })
    }

    const handleTableAction = async (action: { type: string; row: any; value?: any }) => {
        if (isHandlingAction.value) return

        try {
            isHandlingAction.value = true

            const product = action.row.originalData || action.row

            if (!product) {
                toast.error(t('allProductsPage.errors.productNotFound'))
                return
            }

            switch (action.type) {
                case 'update-status':
                    try {
                        const statusId = action.value?.id || action.value

                        if (!statusId) {
                            toast.error(t('allProductsPage.errors.invalidStatus'))
                            return
                        }

                        // Pass the product_id (number) instead of the whole product object
                        const success = await updateStatusOnly(product, statusId)

                        if (success) {
                            // Update local state with correct structure
                            updateProductStatusLocally(product, {
                                id: statusId,
                                name: action.value?.name || getStatusName(statusId),
                            })
                        }
                    } catch (error: any) {
                        console.error('Failed to update product status:', error)
                        toast.error(error.message || t('allProductsPage.errors.statusUpdateFailed'))
                    }
                    break

                case 'edit':
                    try {
                        await navigateTo(
                            localePath(`/supplier/products/new?step=basic-info&product=${product}`)
                        )
                    } catch (error: any) {
                        toast.error(error.message || t('allProductsPage.errors.navigationFailed'))
                    }
                    break

                case 'delete':
                    await showDeleteProductConfirmation(product)
                    break

                default:
                    console.warn('Unknown product action type:', action.type)
            }
        } catch (error: any) {
            console.error('Product action error:', error)
            toast.error(error.message || t('allProductsPage.errors.actionFailed'))
        } finally {
            isHandlingAction.value = false
        }
    }
    const openFilters = () => {
        isFilterDrawerOpen.value = true
    }

    const handleApplyFilters = (filters: ProductFeaturesFilters) => {
        searchQuery.value = filters.search || ''

        activeFilters.value = {
            search: filters.search || '',
            brand_names: Array.isArray(filters.brand_names) ? filters.brand_names : [],
            category_ids: Array.isArray(filters.category_ids) ? filters.category_ids : [],
            status_ids: Array.isArray(filters.status_ids) ? filters.status_ids : [],
            min_amount: filters.min_amount,
            max_amount: filters.max_amount,
        }

        isFilterDrawerOpen.value = false
        currentPage.value = 1
        refreshKey.value++
        debouncedFetch()
    }
    const getStatusName = (statusId: number): string => {
        const { productStatusOptions } = useProductStaticData()
        const status = productStatusOptions.value?.find((opt) => opt.value === statusId)
        return status?.label || `Status ${statusId}`
    }

    const resetFilters = () => {
        searchQuery.value = ''
        activeFilters.value = {
            search: '',
            brand_names: [],
            category_ids: [],
            status_ids: [],
            min_amount: undefined,
            max_amount: undefined,
        }

        currentPage.value = 1
        refreshKey.value++

        if (isFilterDrawerOpen.value) {
            isFilterDrawerOpen.value = false
        }

        debouncedFetch()
    }

    watch(
        () => refreshKey.value,
        () => {
            fetchProducts()
        }
    )

    onMounted(() => {
        nextTick(() => {
            initialize()
            fetchProducts()
        })
    })
</script>
