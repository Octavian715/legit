<template>
    <div class="products-list">
        <div class="grid grid-cols-1 bg-white" :class="{ 'p-3 gap-2': isModeCompany || isModeAll }">
            <template v-if="isModeProducts">
                <ProductCard
                    v-for="product in products"
                    :key="product.id"
                    :product="product"
                    :mode="useModule"
                    @view="$emit('viewProduct', product)"
                    @contact="$emit('contactSupplier', product)"
                />
            </template>

            <template v-if="isModeCompany">
                <SupplierCardItem
                    v-for="company in companies"
                    :key="`company-${company.id}`"
                    :item="company"
                    mode="extended"
                    @click="$emit('viewCompany', company)"
                />
            </template>

            <template v-if="isModeAll">
                <GroupedCompanyItem
                    v-for="group in groupedResults"
                    :key="`group-${group.company.id}`"
                    :group="group"
                    mode="extended"
                    @click="$emit('viewProduct', $event)"
                    @category-click="$emit('categoryClick', $event)"
                    @profile-click="$emit('profileClick', $event)"
                    @view-all="$emit('viewAll', $event)"
                />
            </template>
        </div>

        <Pagination
            v-if="meta && meta.total > 0"
            :current-page="meta.current_page"
            :items-per-page="meta.per_page"
            :total-items="meta.total"
            :max-visible-pages="5"
            @update:current-page="$emit('pageChange', $event)"
            @update:items-per-page="$emit('itemsPerPageChange', $event)"
        />
    </div>
</template>

<script setup lang="ts">
    import type { ProductListing, ProductListingMeta } from '~/types/products'
    import type { GroupedCompanyProducts, SearchCompany } from '~/types/search'

    interface Props {
        // For products mode
        products?: ProductListing[]

        // For companies mode
        companies?: SearchCompany[]

        // For all/grouped mode
        groupedResults?: GroupedCompanyProducts[]

        // Legacy prop for backward compatibility
        items?: any

        meta: ProductListingMeta | null
        useModule?: 'products' | 'companies' | 'all' | 'favorites'
    }

    const props = withDefaults(defineProps<Props>(), {
        useModule: 'products',
    })

    defineEmits<{
        pageChange: [page: number]
        itemsPerPageChange: [itemsPerPage: number]
        viewProduct: [product: ProductListing]
        contactSupplier: [product: ProductListing]
        viewCompany: [company: SearchCompany]
        categoryClick: [categorySlug: string]
        profileClick: [companyUsername: string]
        viewAll: [companyUsername: string]
    }>()

    // Computed properties for mode detection
    const isModeAll = computed(() => props.useModule === 'all')
    const isModeCompany = computed(() => props.useModule === 'companies')
    const isModeProducts = computed(
        () => props.useModule === 'products' || props.useModule === 'favorites'
    )

    // Fallback to items prop for backward compatibility
    const companies = computed(() => props.companies || (isModeCompany.value ? props.items : []))
    const groupedResults = computed(
        () => props.groupedResults || (isModeAll.value ? props.items : [])
    )
</script>

<style scoped>
    .products-list {
        @apply relative;
    }
</style>
