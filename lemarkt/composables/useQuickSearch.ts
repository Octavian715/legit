// composables/useQuickSearch.ts
import { debounce } from 'lodash'
import { ref, computed } from 'vue'
import { useRouter } from '#app'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '#imports'
import { useSearchStore } from '~/stores/search'
export const useQuickSearch = () => {
    const searchStore = useSearchStore()
    const router = useRouter()
    const localePath = useLocalePath()
    const { t } = useI18n()

    const searchQuery = ref('')
    const isOpen = ref(false)

    const debouncedSearch = debounce(async (query: string) => {
        if (!query?.trim()) {
            searchStore.clearQuickSearch()
            return
        }

        try {
            await searchStore.quickSearchAll(query)
        } catch (error) {
            console.error('Quick search error:', error)
        }
    }, 300)

    const handleInput = (query: string): void => {
        searchQuery.value = query
        isOpen.value = !!query.trim()
        debouncedSearch(query)
    }

    const handleSearch = (query: string): void => {
        if (!query?.trim()) return

        isOpen.value = false
        searchQuery.value = ''
        searchStore.clearQuickSearch()

        router.push(localePath(`/search/products?q=${encodeURIComponent(query.trim())}`))
    }

    const handleProductClick = (productId: number): void => {
        isOpen.value = false
        searchQuery.value = ''
        searchStore.clearQuickSearch()
        router.push(localePath(`/products/${productId}`))
    }

    const handleCompanyClick = (companyUsername: string): void => {
        isOpen.value = false
        searchQuery.value = ''
        searchStore.clearQuickSearch()

        router.push(localePath(`/profile/${companyUsername}`))
    }

    const handleViewAllResults = (): void => {
        if (!searchQuery.value.trim()) return

        const query = searchQuery.value
        isOpen.value = false
        searchQuery.value = ''
        searchStore.clearQuickSearch()

        router.push(localePath(`/search/products?q=${encodeURIComponent(query)}`))
    }

    const closeDropdown = (): void => {
        isOpen.value = false
    }

    const clearSearch = (): void => {
        searchQuery.value = ''
        searchStore.clearQuickSearch()
        isOpen.value = false
    }

    return {
        searchQuery,
        isOpen,
        products: computed(() => searchStore.quickSearchProducts),
        companies: computed(() => searchStore.quickSearchCompanies),
        isLoading: computed(() => searchStore.isLoadingQuickSearch),
        hasResults: computed(() => searchStore.hasQuickSearchResults),
        handleInput,
        handleSearch,
        handleProductClick,
        handleCompanyClick,
        handleViewAllResults,
        closeDropdown,
        clearSearch,
    }
}
