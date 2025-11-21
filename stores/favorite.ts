import { defineStore } from 'pinia'
import type {
    FavoriteItem,
    AddToFavoritePayload,
    RemoveFromFavoritePayload,
} from '~/types/favorite'
import { FavoriteService } from '~/services/favorite'

export const useFavoriteStore = defineStore('favorite', () => {
    const favoriteService = new FavoriteService()

    // State
    const favoritesMeta = ref({})
    const favorites = ref<FavoriteItem[]>([])
    const filterOptions = ref({})
    const isLoading = ref<boolean>(false)
    const isLoadingFilterOptions = ref<boolean>(false)
    const error = ref<AppError | null>(null)

    // Computed
    const favoriteIds = computed<number[]>(() => favorites.value.map((item) => item.product_id))

    const isFavorite = (productId: number) => favoriteIds.value.includes(productId)

    // Fetch favorites with filters (main method)
    const fetchFavoritesWithFilters = async (params = {}) => {
        isLoading.value = true
        error.value = null

        try {
            const { data, meta } = await favoriteService.fetchFavorites(params)
            if (Array.isArray(data)) {
                favorites.value = data
            } else {
                favorites.value = []
            }
            favoritesMeta.value = meta || {}
        } catch (e: any) {
            error.value = {
                code: 'API_ERROR',
                message: e.message || 'Failed to fetch filtered favorites',
            }
        } finally {
            isLoading.value = false
        }
    }

    // Original fetch favorites (for backward compatibility)
    const fetchFavorites = async (force = false) => {
        if (isLoading.value && !force) return

        await fetchFavoritesWithFilters()
    }

    // Fetch filter options for favorites
    const fetchFilterOptions = async (categoryId?: number) => {
        isLoadingFilterOptions.value = true

        try {
            const options = await favoriteService.fetchFilterOptions(categoryId)
            filterOptions.value = options
        } catch (e: any) {
            console.error('Failed to fetch filter options:', e)
            filterOptions.value = {
                categories: [],
                subcategories: [],
                brands: [],
                features: [],
                additional_features: [],
                conditions: [],
                allergens: [],
                statuses: [],
                countries: [],
                price_range: { min: 0, max: 1000 },
            }
        } finally {
            isLoadingFilterOptions.value = false
        }
    }

    const addToFavorite = async (
        payload: AddToFavoritePayload,
        refetchFavorites: boolean = false
    ) => {
        error.value = null

        try {
            const response = await favoriteService.addToFavorite(payload)

            // Actualizează direct state-ul local
            const productId = payload.product_id || payload.id
            if (productId && !isFavorite(productId)) {
                // Încearcă să folosești datele din răspunsul API-ului dacă sunt disponibile
                const favoriteItem = response?.data || ({ product_id: productId } as FavoriteItem)
                favorites.value.push(favoriteItem)
            }

            // ✅ SYNC: Update products store to reflect favorite status change
            if (productId) {
                try {
                    const productsStore = useProductsStore()

                    // Update product in marketplace listing
                    productsStore.updateProductLocally(productId, { is_favorite: true })

                    // Update current product if it's loaded
                    if (productsStore.currentProduct?.id === productId) {
                        productsStore.updateCurrentProduct({ is_favorite: true })
                    }
                } catch (syncError) {
                    console.warn('[FavoriteStore] Failed to sync with products store:', syncError)
                }
            }

            // Refetch doar dacă este explicit cerut
            if (refetchFavorites) {
                await fetchFavorites(true)
            }
        } catch (e: any) {
            error.value = { code: 'API_ERROR', message: e.message || 'Failed to add favorite' }
            throw e
        }
    }

    const removeFromFavorite = async (
        payload: RemoveFromFavoritePayload,
        refetchFavorites: boolean = false
    ) => {
        error.value = null

        try {
            await favoriteService.removeFromFavorite(payload)

            // Actualizează direct state-ul local
            const productId = payload.product_id || payload.id
            if (productId) {
                const index = favorites.value.findIndex((item) => item.product_id === productId)
                if (index !== -1) {
                    favorites.value.splice(index, 1)
                }

                // ✅ SYNC: Update products store to reflect favorite status change
                try {
                    const productsStore = useProductsStore()

                    // Update product in marketplace listing
                    productsStore.updateProductLocally(productId, { is_favorite: false })

                    // Update current product if it's loaded
                    if (productsStore.currentProduct?.id === productId) {
                        productsStore.updateCurrentProduct({ is_favorite: false })
                    }
                } catch (syncError) {
                    console.warn('[FavoriteStore] Failed to sync with products store:', syncError)
                }
            }

            // Refetch doar dacă este explicit cerut
            if (refetchFavorites) {
                await fetchFavorites(true)
            }
        } catch (e: any) {
            error.value = {
                code: 'API_ERROR',
                message: e.message || 'Failed to remove favorite',
            }
            throw e
        }
    }

    // Toggle favorite status (metodă helper pentru UI)
    const toggleFavorite = async (productId: number) => {
        const isCurrentlyFavorite = isFavorite(productId)

        if (isCurrentlyFavorite) {
            await removeFromFavorite({ product_id: productId })
        } else {
            await addToFavorite({ product_id: productId })
        }
    }

    const initializeFavorites = async () => {
        await Promise.all([fetchFavorites(), fetchFilterOptions()])
    }

    return {
        favorites,
        favoritesMeta,
        filterOptions,
        isLoading,
        isLoadingFilterOptions,
        error,
        favoriteIds,
        isFavorite,
        fetchFavorites,
        fetchFavoritesWithFilters,
        fetchFilterOptions,
        addToFavorite,
        removeFromFavorite,
        toggleFavorite,
        initializeFavorites,
    }
})

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useFavoriteStore, import.meta.hot))
}
