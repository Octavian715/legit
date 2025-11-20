<template>
    <div class="search-page">
        <Breadcrumbs :items="breadcrumbs" />

        <PageHeader :title="pageTitle" :subtitle="subtitle" :loading="isInitialLoading">
            <template #right>
                <div class="flex items-center gap-3">
                    <Dropdown
                        v-if="hasResults && !isSearching && !isInitialLoading"
                        :items="sortOptions"
                        :label="currentSortLabel"
                        trigger="click"
                        size="sm"
                        menu-alignment="right"
                        auto-sync-trigger-width
                        @select="onSortSelect"
                    />
                    <Button
                        variant="ghost"
                        color="gray"
                        size="lg"
                        square
                        container-classes="!p-1"
                        :class="{ relative: hasFiltersApplied }"
                        @click="showFilters = true"
                    >
                        <svg class="w-4 h-4 flex-1">
                            <use xlink:href="/sprite.svg#filter" />
                        </svg>
                        <span
                            v-if="hasActiveFilters"
                            class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"
                            aria-label="Active filters"
                        ></span>
                    </Button>
                </div>
            </template>
        </PageHeader>

        <ErrorBoundary v-if="error" :error="error" @retry="initializeFromRoute" />

        <template v-else>
            <!-- Show skeletons when loading (initial or searching) -->
            <template v-if="isInitialLoading || isSearching">
                <div class="grid grid-cols-1 bg-white rounded-b p-3 gap-2">
                    <template v-if="activeTab === 'products'">
                        <ProductCardSkeleton v-for="i in 6" :key="`product-skeleton-${i}`" />
                    </template>
                    <template v-else-if="activeTab === 'companies'">
                        <SupplierCardItemSkeleton v-for="i in 6" :key="`company-skeleton-${i}`" />
                    </template>
                    <template v-else-if="activeTab === 'all'">
                        <GroupedCompanyItemSkeleton v-for="i in 6" :key="`grouped-skeleton-${i}`" />
                    </template>
                </div>
            </template>

            <!-- Show results when we have them and not loading -->
            <template v-else-if="hasResults">
                <ProductsList
                    :products="activeTab === 'products' ? productResults : undefined"
                    :companies="activeTab === 'companies' ? companyResults : undefined"
                    :grouped-results="activeTab === 'all' ? groupedResults : undefined"
                    :meta="activeTab === 'companies' ? companyMeta : productMeta"
                    :use-module="activeTab"
                    @page-change="handlePageChange"
                    @items-per-page-change="handleItemsPerPageChange"
                    @view-product="handleProductClick"
                    @contact-supplier="handleContactSupplier"
                    @view-company="handleCompanyClick"
                    @category-click="handleCategoryClick"
                    @profile-click="handleProfileClick"
                    @view-all="handleViewAllClick"
                />
            </template>

            <!-- Show no results only when: not loading, have query, no results, and loaded at least once -->
            <template v-else-if="hasQuery && !hasResults && hasLoadedOnce">
                <NoDataPage
                    :title="t('marketplace.empty.title')"
                    :description="t('marketplace.empty.description')"
                    @action="handleResetFilters"
                />
            </template>

            <!-- Show "please enter query" when no query and not loading -->
            <template v-else-if="!hasQuery">
                <NoDataPage
                    :title="t('search.subtitle')"
                    :description="t('search.pleaseEnterQuery')"
                    image=""
                    @action="router.push(localePath('/marketplace'))"
                />
            </template>
        </template>

        <SearchFiltersDrawer
            v-model:is-open="showFilters"
            :tab="activeTab"
            :filters="currentFilters"
            :active-filters-count="activeFiltersCount"
            @apply="handleApplyFilters"
            @reset="handleResetFilters"
        />
    </div>
</template>

<script setup lang="ts">
    import { useSearchPage } from '~/composables/useSearchPage'
    import { computed } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useRouter } from '#app'
    import { useLocalePath } from '#imports'

    definePageMeta({
        layout: 'default',
    })

    const { t } = useI18n()
    const localePath = useLocalePath()
    const router = useRouter()

    const {
        activeTab,
        isSearching,
        isInitialLoading,
        error,
        showFilters,
        productResults,
        groupedResults,
        companyResults,
        productMeta,
        companyMeta,
        hasQuery,
        hasResults,
        hasLoadedOnce,
        pageTitle,
        subtitle,
        tabOptions,
        sortOptions,
        currentSortLabel,
        currentFilters,
        hasFiltersApplied,
        activeFiltersCount,
        initializeFromRoute,
        handleTabChange,
        handlePageChange,
        handleItemsPerPageChange,
        onSortSelect,
        handleApplyFilters,
        handleResetFilters,
    } = useSearchPage()

    const hasActiveFilters = computed(() => {
        return activeFiltersCount.value > 0
    })

    const breadcrumbs = computed(() => [
        { label: t('home'), path: localePath('/') },
        { label: t('search.title'), path: localePath(`/search/${activeTab.value}`) },
    ])

    const handleProductClick = (product: any) => {
        router.push(localePath(`/marketplace/product/${product.id}`))
    }

    const handleCompanyClick = (company: any) => {
        router.push(localePath(`/profile/${company.username}`))
    }

    const handleCategoryClick = (categorySlug: string) => {
        router.push(localePath(`/marketplace/category/${categorySlug}`))
    }

    const handleProfileClick = (companyUsername: string) => {
        router.push(localePath(`/profile/${companyUsername}`))
    }

    const handleViewAllClick = (companyUsername: string) => {
        router.push({
            path: localePath(`/profile/${companyUsername}`),
            query: { tab: 'products' },
        })
    }

    const handleContactSupplier = (product: any) => {}
</script>

<style scoped>
    .search-page {
        @apply relative;
    }
</style>
