import type { AddToFavoritePayload, RemoveFromFavoritePayload } from '~/types/favorite'

export const useFavorite = () => {
    const favoriteStore = useFavoriteStore()
    const { t } = useI18n()
    const toast = useToastNotification()
    const loading = ref<{ [key: string]: boolean }>({})

    const setLoading = (key: string, state: boolean) => {
        loading.value[key] = state
    }

    const isFavorite = (productId: number): boolean => {
        return favoriteStore.favoriteIds.includes(productId)
    }

    const quickToggleFavorite = async (
        productId: number,
        currentState: boolean
    ): Promise<boolean> => {
        setLoading(`toggleFavorite_${productId}`, true)
        try {
            if (currentState) {
                await favoriteStore.removeFromFavorite({ product_id: productId }, false)
                toast.success(t('favorites.removed'))
                return false
            } else {
                await favoriteStore.addToFavorite({ product_id: productId }, false)
                toast.success(t('favorites.added'))
                return true
            }
        } catch (error: any) {
            toast.error(error.message || t('favorites.error'))
            return currentState
        } finally {
            setLoading(`toggleFavorite_${productId}`, false)
        }
    }

    const addToFavorite = async (payload: AddToFavoritePayload, refetch: boolean = false) => {
        const productId = payload.product_id || payload.id
        if (!productId) return false

        setLoading(`addToFavorite_${productId}`, true)
        try {
            await favoriteStore.addToFavorite(payload, refetch)
            toast.success(t('favorites.added'))
            return true
        } catch (error: any) {
            toast.error(error.message || t('favorites.error'))
            return false
        } finally {
            setLoading(`addToFavorite_${productId}`, false)
        }
    }

    const removeFromFavorite = async (
        payload: RemoveFromFavoritePayload | number,
        refetch: boolean = false
    ) => {
        // Normalize payload to always be an object
        const normalizedPayload: RemoveFromFavoritePayload =
            typeof payload === 'number' ? { product_id: payload } : payload

        const productId = normalizedPayload.product_id || normalizedPayload.id
        if (!productId) return false

        setLoading(`removeFromFavorite_${productId}`, true)
        try {
            await favoriteStore.removeFromFavorite(normalizedPayload, refetch)
            toast.success(t('favorites.removed'))
            return true
        } catch (error: any) {
            toast.error(error.message || t('favorites.error'))
            return false
        } finally {
            setLoading(`removeFromFavorite_${productId}`, false)
        }
    }

    return {
        isLoading: computed(() => Object.values(loading.value).some(Boolean)),
        loading,
        favorites: computed(() => favoriteStore.favorites),
        favoriteIds: computed(() => favoriteStore.favoriteIds),
        isFavorite,
        quickToggleFavorite,
        addToFavorite,
        removeFromFavorite,
        initializeFavorites: favoriteStore.initializeFavorites,
        fetchFavorites: favoriteStore.fetchFavorites,
        fetchFavoritesWithFilters: favoriteStore.fetchFavoritesWithFilters,
        fetchFilterOptions: favoriteStore.fetchFilterOptions,
    }
}
