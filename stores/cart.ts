import { defineStore, acceptHMRUpdate } from 'pinia'
import { nextTick, triggerRef } from 'vue'
import type {
    CartSupplierGroup,
    CartItem,
    CartSummary,
    AddToCartPayload,
    BulkAddToCartPayload,
} from '~/types/cart'
import type { ApiError } from '~/types/api'

const parseQuantity = (quantity: any): number => {
    if (typeof quantity === 'number') {
        return Math.floor(quantity)
    }
    if (typeof quantity === 'string') {
        const parsed = parseFloat(quantity)
        return isNaN(parsed) ? 0 : Math.floor(parsed)
    }
    return 0
}

export const useCartStore = defineStore('cart', () => {
    const totalItemsCount = ref<number>(0)
    const supplierGroups = ref<CartSupplierGroup[]>([])
    const savedForLater = ref<CartItem[]>([])
    const summary = ref<CartSummary | null>(null)
    const isLoading = ref<boolean>(false)
    const isUpdating = ref<boolean>(false)
    const error = ref<ApiError | null>(null)
    const lastFetch = ref<number | null>(null)
    const isInitialized = ref(false)

    let cartServiceInstance: any = null

    const getCartService = async () => {
        if (!cartServiceInstance) {
            const { CartService } = await import('~/services/cart')
            cartServiceInstance = new CartService()
        }
        return cartServiceInstance
    }

    const allItems = computed<CartItem[]>(() => {
        if (!supplierGroups.value || !Array.isArray(supplierGroups.value)) {
            return []
        }
        return supplierGroups.value.flatMap((group) => group?.items || [])
    })

    const cartItems = computed(() => {
        const items: Record<number, number> = {}

        if (!supplierGroups.value || !Array.isArray(supplierGroups.value)) {
            return items
        }

        supplierGroups.value.forEach((group) => {
            if (!group?.items || !Array.isArray(group.items)) {
                return
            }

            group.items.forEach((item) => {
                if (!item?.product?.id) {
                    return
                }

                const quantity = parseQuantity(item.product.quantity)

                if (quantity > 0) {
                    items[item.product.id] = quantity
                }
            })
        })

        return items
    })

    const totalUniqueItems = computed<number>(() => allItems.value?.length || 0)

    const grandTotals = computed(() => summary.value?.grand_totals || null)

    const supplierCount = computed<number>(() => {
        return summary.value?.supplier_count || supplierGroups.value?.length || 0
    })

    const getItemById = computed(() => {
        return (itemId: number) => {
            if (!allItems.value) return undefined
            return allItems.value.find((item) => item?.id === itemId)
        }
    })

    const getSupplierGroup = computed(() => {
        return (supplierId: number) => {
            if (!supplierGroups.value) return undefined
            return supplierGroups.value.find((group) => group?.supplier?.id === supplierId)
        }
    })

    const hasSavedItems = computed<boolean>(() => savedForLater.value?.length > 0)

    const allProducts = computed(() => {
        if (!allItems.value || allItems.value.length === 0) {
            return []
        }

        return allItems.value
            .filter((item) => item?.product?.id)
            .map((item) => {
                const product = item.product

                return {
                    id: product.id,
                    image: product.images?.primary || null,
                    name: product.name_en || product.name_original || '',
                    brand_name: product.brand || '',
                    article_number: product.article_number || '',
                    price: product.pricing || product.price || null,
                    quantity: parseQuantity(item.quantity),
                }
            })
    })

    const resetError = () => {
        error.value = null
    }

    const handleError = (e: any) => {
        const apiError: ApiError = {
            message: e.data?.message || e.message || 'An error occurred',
            errors: e.data?.errors,
            statusCode: e.statusCode || 500,
        }
        error.value = apiError
        console.error('[Cart Store] Error:', apiError)
        throw apiError
    }

    const forceReactivityUpdate = () => {
        triggerRef(supplierGroups)
    }

    const ensureInitialized = async () => {
        if (isInitialized.value) {
            return
        }

        if (isLoading.value) {
            while (isLoading.value) {
                await new Promise((resolve) => setTimeout(resolve, 50))
            }
            return
        }

        isLoading.value = true

        try {
            const cartService = await getCartService()

            const [cartData, summaryData, countData] = await Promise.all([
                cartService.fetchCart(),
                cartService.fetchApiSummary().catch(() => null),
                cartService.fetchCount().catch(() => 0),
            ])

            if (cartData) {
                supplierGroups.value = [...cartData]
            }

            if (summaryData) {
                summary.value = summaryData
            }

            if (typeof countData === 'number') {
                totalItemsCount.value = countData
            }

            isInitialized.value = true
            lastFetch.value = Date.now()
            forceReactivityUpdate()
        } catch (error) {
            console.error('[Cart Store] Initialization failed:', error)
            totalItemsCount.value = 0
        } finally {
            isLoading.value = false
        }
    }

    const fetchCart = async (force = false) => {
        if (isLoading.value) return

        if (!force && lastFetch.value && Date.now() - lastFetch.value < 1000) {
            return
        }

        isLoading.value = true
        resetError()

        try {
            const cartService = await getCartService()

            const [cartData, summaryData, countData] = await Promise.all([
                cartService.fetchCart(),
                cartService.fetchApiSummary().catch(() => null),
                cartService.fetchCount().catch(() => 0),
            ])

            supplierGroups.value = [...cartData]

            if (summaryData) {
                summary.value = summaryData
            }

            if (typeof countData === 'number') {
                totalItemsCount.value = countData
            }

            lastFetch.value = Date.now()

            forceReactivityUpdate()

            await nextTick()
        } catch (e) {
            handleError(e)
            supplierGroups.value = []
            totalItemsCount.value = 0
        } finally {
            isLoading.value = false
        }
    }

    const fetchSummary = async () => {
        resetError()

        try {
            const cartService = await getCartService()
            const result = await cartService.fetchApiSummary()
            summary.value = result
        } catch (e) {
            handleError(e)
            summary.value = null
        }
    }

    const fetchCartCount = async () => {
        resetError()

        try {
            const cartService = await getCartService()
            const count = await cartService.fetchCount()

            const newCount = typeof count === 'number' ? count : 0

            totalItemsCount.value = newCount

            return newCount
        } catch (e) {
            console.error('[Cart Store] Failed to fetch cart count:', e)
            totalItemsCount.value = 0
            return 0
        }
    }

    const addToCart = async (payload: AddToCartPayload) => {
        while (isUpdating.value) {
            await new Promise((resolve) => setTimeout(resolve, 0))
        }

        isUpdating.value = true
        resetError()

        const optimisticCount = totalItemsCount.value + payload.quantity
        totalItemsCount.value = optimisticCount

        try {
            const cartService = await getCartService()
            const addedItem = await cartService.addToCart(payload)

            await new Promise((resolve) => setTimeout(resolve, 0))

            await fetchCart(true)

            return addedItem
        } catch (e) {
            totalItemsCount.value = Math.max(0, totalItemsCount.value - payload.quantity)
            handleError(e)
        } finally {
            isUpdating.value = false
        }
    }

    const bulkAddToCart = async (payload: BulkAddToCartPayload) => {
        while (isUpdating.value) {
            await new Promise((resolve) => setTimeout(resolve, 0))
        }

        isUpdating.value = true
        resetError()

        try {
            const cartService = await getCartService()
            const addedItems = await cartService.bulkAddToCart(payload)

            await new Promise((resolve) => setTimeout(resolve, 0))

            await fetchCart(true)

            return addedItems
        } catch (e) {
            handleError(e)
        } finally {
            isUpdating.value = false
        }
    }

    const updateQuantity = async (itemId: number, quantity: number) => {
        while (isUpdating.value) {
            await new Promise((resolve) => setTimeout(resolve, 0))
        }

        isUpdating.value = true
        resetError()

        try {
            const cartService = await getCartService()
            const updatedItem = await cartService.updateQuantity(itemId, { quantity })

            await new Promise((resolve) => setTimeout(resolve, 0))

            await fetchCart(true)

            return updatedItem
        } catch (e) {
            handleError(e)
        } finally {
            isUpdating.value = false
        }
    }

    const removeItem = async (itemId: number) => {
        while (isUpdating.value) {
            await new Promise((resolve) => setTimeout(resolve, 0))
        }

        isUpdating.value = true
        resetError()

        const itemToRemove = allItems.value.find((item) => item.id === itemId)
        const removedQuantity = itemToRemove ? parseQuantity(itemToRemove.quantity) : 0

        if (itemToRemove) {
            totalItemsCount.value = Math.max(0, totalItemsCount.value - removedQuantity)
        }

        try {
            const cartService = await getCartService()
            await cartService.removeFromCart(itemId)

            await new Promise((resolve) => setTimeout(resolve, 0))

            await fetchCart(true)
        } catch (e) {
            totalItemsCount.value = totalItemsCount.value + removedQuantity
            handleError(e)
        } finally {
            isUpdating.value = false
        }
    }

    const removeSupplierCard = async (supplierId: number) => {
        while (isUpdating.value) {
            await new Promise((resolve) => setTimeout(resolve, 50))
        }

        isUpdating.value = true
        resetError()

        try {
            const cartService = await getCartService()
            await cartService.removeFromSupplierCart(supplierId)

            await new Promise((resolve) => setTimeout(resolve, 0))

            await fetchCart(true)
        } catch (e) {
            handleError(e)
        } finally {
            isUpdating.value = false
        }
    }

    const clearCart = async () => {
        resetError()

        try {
            const cartService = await getCartService()
            await cartService.clearCart()

            supplierGroups.value = []
            summary.value = null
            totalItemsCount.value = 0
            lastFetch.value = Date.now()
            forceReactivityUpdate()
        } catch (e) {
            handleError(e)
        }
    }

    const saveItemForLater = async (itemId: number) => {
        resetError()

        try {
            const cartService = await getCartService()
            const savedItem = await cartService.saveForLater(itemId)

            await new Promise((resolve) => setTimeout(resolve, 0))

            await Promise.all([fetchCart(true), fetchSavedForLater()])

            return savedItem
        } catch (e) {
            handleError(e)
        }
    }

    const moveItemToCart = async (itemId: number) => {
        resetError()

        try {
            const cartService = await getCartService()
            const movedItem = await cartService.moveToCart(itemId)

            await new Promise((resolve) => setTimeout(resolve, 0))

            await Promise.all([fetchCart(true), fetchSavedForLater()])

            return movedItem
        } catch (e) {
            handleError(e)
        }
    }

    const fetchSavedForLater = async () => {
        resetError()

        try {
            const cartService = await getCartService()
            savedForLater.value = await cartService.fetchSavedForLater()
        } catch (e) {
            handleError(e)
        }
    }

    const clearSavedForLater = async () => {
        resetError()

        try {
            const cartService = await getCartService()
            await cartService.clearSavedForLater()
            savedForLater.value = []
        } catch (e) {
            handleError(e)
        }
    }

    const createOrderFromCart = async (
        supplierId: number,
        documentNotes?: string,
        deliveryDetail?: any
    ) => {
        resetError()
        isLoading.value = true

        try {
            const cartService = await getCartService()
            const payload = {
                supplier_id: supplierId,
                document_notes: documentNotes,
                delivery_detail: deliveryDetail,
            }
            const order = await cartService.createOrder(payload)

            await new Promise((resolve) => setTimeout(resolve, 0))

            await fetchCart(true)

            return order
        } catch (e) {
            handleError(e)
        } finally {
            isLoading.value = false
        }
    }

    return {
        supplierGroups,
        savedForLater,
        summary,
        isLoading,
        isUpdating,
        error,
        isInitialized,

        allItems,
        allProducts,
        cartItems,
        totalItemsCount,
        totalUniqueItems,
        grandTotals,
        supplierCount,
        getItemById,
        getSupplierGroup,
        hasSavedItems,
        removeSupplierCard,

        ensureInitialized,
        fetchCart,
        fetchSummary,
        fetchCartCount,
        addToCart,
        bulkAddToCart,
        updateQuantity,
        removeItem,
        clearCart,
        saveItemForLater,
        moveItemToCart,
        fetchSavedForLater,
        clearSavedForLater,
        createOrderFromCart,
        resetError,
        forceReactivityUpdate,
    }
})

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useCartStore, import.meta.hot))
}
