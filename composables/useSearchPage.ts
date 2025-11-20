import { computed, ref, watch, nextTick, onMounted } from 'vue'
import { useRoute, useRouter } from '#app'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '#imports'
import { useSearchStore } from '~/stores/search'
import { debounce } from 'lodash'
import { storeToRefs } from 'pinia'
import { usePlanChangeEvents } from '~/composables/usePlanChangeEvents'

type TabType = 'all' | 'products' | 'companies'

export const useSearchPage = () => {
    const route = useRoute()
    const router = useRouter()
    const localePath = useLocalePath()
    const { t } = useI18n()
    const searchStore = useSearchStore()
    const { planChangeKey } = usePlanChangeEvents()

    const {
        productResults,
        groupedResults,
        companyResults,
        productMeta,
        companyMeta,
        productFilters,
        companyFilters,
        hasProductInitialLoad,
        hasCompanyInitialLoad,
    } = storeToRefs(searchStore)

    // Direct search function without debounce for immediate execution
    const performSearch = async (type: TabType, query: string, options: any) => {
        if (type === 'companies' && (!query || !query.trim())) {
            console.warn('Company search skipped - empty query')
            return
        }

        try {
            switch (type) {
                case 'all':
                    // Tab "all" uses product filters with group_by_company forced to true
                    await searchStore.searchProducts({
                        ...options,
                        ...productFilters.value, // Apply product filters
                        search: query,
                        group_by_company: true, // Always true for "all" tab
                        // ✅ CRITICAL: Explicitly override with pagination params
                        page: options.page,
                        per_page: options.per_page,
                    })
                    break
                case 'products':
                    // Tab "products" uses product filters without grouping
                    await searchStore.searchProducts({
                        ...options,
                        ...productFilters.value, // Apply product filters
                        search: query,
                        group_by_company: false, // Always false for "products" tab
                        // ✅ CRITICAL: Explicitly override with pagination params
                        page: options.page,
                        per_page: options.per_page,
                    })
                    break
                case 'companies':
                    // Tab "companies" uses company-specific filters
                    await searchStore.searchCompanies({
                        ...options,
                        ...companyFilters.value, // Apply company filters
                        query,
                        // ✅ CRITICAL: Explicitly override with pagination params
                        page: options.page,
                        per_page: options.per_page,
                    })
                    break

                default:
                    // Tab "products" uses product filters without grouping
                    await searchStore.searchProducts({
                        ...options,
                        ...productFilters.value, // Apply product filters
                        search: query,
                        group_by_company: false, // Always false for "products" tab
                        // ✅ CRITICAL: Explicitly override with pagination params
                        page: options.page,
                        per_page: options.per_page,
                    })
            }
        } catch (error) {
            console.error(`${type} search error:`, error)
            throw error
        }
    }

    // Debounced version for handlers that need it (like filter changes)
    const debouncedSearch = debounce(performSearch, 300)

    const activeTab = ref<TabType>('all')
    const searchQuery = ref('')
    const currentPage = ref(1)
    const itemsPerPage = ref(20)
    const currentSort = ref('created_at:desc')
    const isSearching = ref(false)
    const isInitialLoading = ref(true)
    const error = ref<string | null>(null)
    const showFilters = ref(false)
    const isInitialized = ref(false)

    const getValidTabFromRoute = (): TabType => {
        const routeTab = route.params.tab as string | undefined
        return routeTab === 'products' || routeTab === 'companies' ? routeTab : 'all'
    }

    const validTab = computed(() => getValidTabFromRoute())
    const hasQuery = computed(() => !!searchQuery.value?.trim())

    // Check if we've loaded data at least once for the current tab
    const hasLoadedOnce = computed(() => {
        if (activeTab.value === 'companies') {
            return hasCompanyInitialLoad.value
        }
        return hasProductInitialLoad.value
    })

    const hasResults = computed(() => {
        // Don't show results during loading states
        if (isSearching.value || isInitialLoading.value) return false

        if (activeTab.value === 'all') return groupedResults.value.length > 0
        if (activeTab.value === 'products') return productResults.value.length > 0
        return companyResults.value.length > 0
    })

    const currentMeta = computed(() =>
        activeTab.value === 'companies' ? companyMeta.value : productMeta.value
    )

    const sortOptions = computed(() => {
        if (activeTab.value === 'companies') {
            return [
                // { label: t('sorting.chooseOption'), value: '', disabled: true },
                { value: 'name:asc', label: t('sorting.byAlphabetAZ') },
                { value: 'name:desc', label: t('sorting.byAlphabetZA') },
                { value: 'followers_count:desc', label: t('sorting.followersDesc') },
                { value: 'followers_count:asc', label: t('sorting.followersAsc') },
            ]
        }
        // Sort options for both 'all' and 'products' tabs
        return [
            // { label: t('sorting.chooseOption'), value: '', disabled: true },
            { label: t('sorting.newest'), value: 'created_at:desc', disabled: false },
            { label: t('sorting.oldest'), value: 'created_at:asc', disabled: false },
            { label: t('sorting.highPrice'), value: 'price:desc', disabled: false },
            { label: t('sorting.lowPrice'), value: 'price:asc', disabled: false },
            { label: t('sorting.byAlphabetAZ'), value: 'name:asc', disabled: false },
            { label: t('sorting.byAlphabetZA'), value: 'name:desc', disabled: false },
        ]
    })

    const tabOptions = computed(() => [
        { value: 'all', label: t('all'), count: productMeta.value?.total || 0 },
        { value: 'products', label: t('products', 1), count: productMeta.value?.total || 0 },
        {
            value: 'companies',
            label: t('company.title', 0),
            count: companyMeta.value?.total || 0,
        },
    ])

    const currentSortLabel = computed(
        () => sortOptions.value.find((opt) => opt.value === currentSort.value)?.label || ''
        // t('sorting.chooseOption')
    )

    // Use product filters for both 'all' and 'products' tabs
    const currentFilters = computed(() =>
        activeTab.value === 'companies' ? companyFilters.value : productFilters.value
    )

    const hasFiltersApplied = computed(() => activeFiltersCount.value > 0)

    // Count filters correctly for each tab
    const activeFiltersCount = computed(() => {
        let count = 0

        // For both 'all' and 'products' tabs, count product filters
        if (activeTab.value === 'all' || activeTab.value === 'products') {
            const filters = productFilters.value
            if (filters.categories?.length) count++
            if (filters.subcategories?.length) count++
            if (filters.price_min || filters.price_max) count++
            if (filters.brands?.length) count++
            if (filters.features?.length) count++
            if (filters.additional_features?.length) count++
            if (filters.supplier_countries?.length) count++
            if (filters.availability_countries?.length) count++
            if (filters.conditions?.length) count++
            if (filters.weight_min || filters.weight_max) count++
            if (filters.has_discount) count++
            if (filters.only_favorites) count++
            if (filters.my_products) count++
        }
        // For 'companies' tab, count only 2 specific filters
        else if (activeTab.value === 'companies') {
            const filters = companyFilters.value
            if (filters.business_type_id) count++
            if (filters.country_id) count++
        }

        return count
    })

    const pageTitle = computed(() => {
        if (!hasQuery.value) return t('search.title')
        return t('search.resultsFor')
    })

    const subtitle = computed(() => {
        if (!hasQuery.value) return t('search.subtitle')

        const count = currentMeta.value?.total || 0
        return count > 0 ? t('table.countResults', { count }) : t('filters.noProductsFound')
    })

    const executeSearch = async (): Promise<void> => {
        if (!searchQuery.value?.trim()) {
            searchStore.clearSearchResults()
            isSearching.value = false
            return
        }

        if (activeTab.value === 'companies' && !searchQuery.value?.trim()) {
            console.warn('Blocking companies search - no query')
            isSearching.value = false
            return
        }

        isSearching.value = true
        error.value = null

        const [sortBy, sortDirection] = currentSort.value.split(':')
        const baseOptions = {
            page: currentPage.value,
            per_page: itemsPerPage.value,
            sort_by: sortBy,
            sort_direction: sortDirection,
        }

        try {
            // Use performSearch directly for immediate execution (no debounce)
            await performSearch(activeTab.value, searchQuery.value.trim(), baseOptions)
        } catch (err: any) {
            console.error('Search execution error:', err)
            error.value = err.message || t('search.fetchError')
        } finally {
            isSearching.value = false
        }
    }

    const initializeFromRoute = async () => {
        isInitialLoading.value = true
        error.value = null

        activeTab.value = validTab.value
        searchQuery.value = (route.query.q as string) || ''
        currentPage.value = parseInt(route.query.page as string) || 1
        itemsPerPage.value = parseInt(route.query.per_page as string) || 20

        const defaultSort = activeTab.value === 'companies' ? 'name:asc' : 'created_at:desc'
        const sortBy = (route.query.sort_by as string) || defaultSort.split(':')[0]
        const sortDirection = (route.query.sort_direction as string) || defaultSort.split(':')[1]
        currentSort.value = `${sortBy}:${sortDirection}`

        // Ensure URL has all required params, especially per_page
        if (!route.query.per_page) {
            await router.replace({
                query: {
                    ...route.query,
                    per_page: itemsPerPage.value,
                },
            })
        }

        await nextTick()

        if (hasQuery.value) {
            await executeSearch()
        } else {
            searchStore.clearSearchResults()
        }

        isInitialLoading.value = false
        isInitialized.value = true
    }

    const handleTabChange = async (tab: TabType) => {
        isSearching.value = true
        activeTab.value = tab
        currentPage.value = 1

        searchStore.clearSearchResults()

        // Reset filters when switching between product/company contexts
        if (tab === 'companies') {
            searchStore.resetProductFilters()
        } else if (tab === 'products' || tab === 'all') {
            searchStore.resetCompanyFilters()
        }

        await router.replace({
            path: localePath(`/search/${tab}`),
            query: { q: searchQuery.value, page: 1, per_page: itemsPerPage.value },
        })

        await nextTick()

        if (hasQuery.value) {
            await executeSearch()
        } else {
            isSearching.value = false
        }
    }

    const handlePageChange = async (page: number) => {
        isSearching.value = true
        currentPage.value = page

        await router.replace({
            query: {
                ...route.query,
                page,
            },
        })

        await nextTick()
        await executeSearch()
    }

    const handleItemsPerPageChange = async (perPage: number) => {
        isSearching.value = true
        itemsPerPage.value = perPage
        currentPage.value = 1 // Reset to first page

        await router.replace({
            query: {
                ...route.query,
                per_page: perPage,
                page: 1,
            },
        })

        await nextTick()
        await executeSearch()
    }

    const onSortSelect = async (value: string) => {
        isSearching.value = true
        currentSort.value = value
        currentPage.value = 1

        const [sortBy, direction] = value.split(':')
        await router.replace({
            query: {
                ...route.query,
                sort_by: sortBy,
                sort_direction: direction,
                page: 1,
            },
        })

        await nextTick()
        await executeSearch()
    }

    // Apply filters correctly based on tab type
    const handleApplyFilters = async (filters: any) => {
        isSearching.value = true
        currentPage.value = 1

        // For 'all' and 'products' tabs, use product filters
        if (activeTab.value === 'all' || activeTab.value === 'products') {
            searchStore.setProductFilters(filters)
        }
        // For 'companies' tab, use company filters
        else if (activeTab.value === 'companies') {
            searchStore.setCompanyFilters(filters)
        }

        await router.replace({
            query: {
                ...route.query,
                page: 1,
            },
        })

        await nextTick()

        if (hasQuery.value) {
            await executeSearch()
        } else {
            isSearching.value = false
        }
    }

    // Reset filters correctly based on tab type
    const handleResetFilters = async () => {
        isSearching.value = true
        currentPage.value = 1

        // Reset filters based on tab type
        if (activeTab.value === 'all' || activeTab.value === 'products') {
            searchStore.resetProductFilters()
        } else if (activeTab.value === 'companies') {
            searchStore.resetCompanyFilters()
        }

        await router.replace({
            query: {
                ...route.query,
                page: 1,
            },
        })

        await nextTick()

        if (hasQuery.value) {
            await executeSearch()
        } else {
            isSearching.value = false
        }
    }

    const navigateTo = (path: string) => {
        router.push(localePath(path))
    }

    watch(
        () => route.query.q,
        async (newQuery, oldQuery) => {
            if (!isInitialized.value) return
            if (newQuery !== oldQuery) {
                searchQuery.value = (newQuery as string) || ''
                isSearching.value = true
                currentPage.value = 1 // Reset to page 1 on new search
                searchStore.clearSearchResults()
                await nextTick()
                await executeSearch()
            }
        }
    )

    watch(
        () => planChangeKey.value,
        async (newValue, oldValue) => {
            if (oldValue === 0 && newValue === 0) return
            searchStore.clearSearchResults()
            await nextTick()
            await executeSearch()
        }
    )

    onMounted(async () => {
        await initializeFromRoute()
    })

    return {
        activeTab,
        searchQuery,
        currentPage,
        itemsPerPage,
        currentSort,
        isSearching,
        isInitialLoading,
        error,
        showFilters,
        productResults,
        groupedResults,
        companyResults,
        productMeta,
        companyMeta,
        validTab,
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
        executeSearch,
        initializeFromRoute,
        handleTabChange,
        handlePageChange,
        handleItemsPerPageChange,
        onSortSelect,
        handleApplyFilters,
        handleResetFilters,
        navigateTo,
    }
}
