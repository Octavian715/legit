import type { AddToCartPayload, BulkAddToCartPayload } from '~/types/cart'

export const useCart = () => {
    const cartStore = useCartStore()
    const userStore = useUserStore()
    const { t } = useI18n()
    const toast = useToastNotification()
    const { canAccess, showUpgradePrompt } = useFeatureAccess()
    const loading = ref<{ [key: string]: boolean }>({})
    const itemJustAdded = ref(false)

    /**
     * Check if user has access to cart feature
     */
    const hasCartAccess = computed(() => {
        // Cart is available for ALL users EXCEPT Supplier Lite
        const currentPlan = userStore.currentPlan?.plan?.code?.toLowerCase() || ''
        const isSupplier = userStore.primaryRole === 'supplier'
        const isLite = currentPlan.includes('supplier-lite')

        // Block cart ONLY for Supplier Lite
        if (isSupplier && isLite) {
            return false
        }

        // Everyone else has access (buyers, Professional, Enterprise)
        return true
    })

    /**
     * Check cart access before operation
     */
    const checkCartAccess = (): boolean => {
        if (!hasCartAccess.value) {
            showUpgradePrompt('cart_checkout')
            return false
        }
        return true
    }

    const setLoading = (key: string, state: boolean) => {
        loading.value[key] = state
    }

    const isInCart = (productId: number): boolean => {
        try {
            if (!cartStore || !cartStore.cartItems) {
                return false
            }

            return productId in cartStore.cartItems && cartStore.cartItems[productId] > 0
        } catch (error) {
            console.error('[useCart] Error in isInCart:', error)
            return false
        }
    }

    const getProductQuantityInCart = (productId: number): number => {
        try {
            if (!cartStore || !cartStore.cartItems) {
                return 0
            }

            return cartStore.cartItems[productId] || 0
        } catch (error) {
            console.error('[useCart] Error in getProductQuantityInCart:', error)
            return 0
        }
    }

    const findCartItemByProduct = (productId: number): any => {
        try {
            if (!cartStore.supplierGroups || !Array.isArray(cartStore.supplierGroups)) {
                return null
            }

            for (const group of cartStore.supplierGroups) {
                if (group?.items && Array.isArray(group.items)) {
                    const item = group.items.find((item) => item?.product?.id === productId)
                    if (item) {
                        return item
                    }
                }
            }
            return null
        } catch (error) {
            console.error('[useCart] Error in findCartItemByProduct:', error)
            return null
        }
    }

    const findCartItemBySupplierId = (supplierId: number, productId: number): any => {
        try {
            const supplierGroup = cartStore.supplierGroups.find(
                (group) => group?.supplier?.id === supplierId
            )

            if (!supplierGroup?.items) {
                return null
            }

            return supplierGroup.items.find((item) => item?.product?.id === productId) || null
        } catch (error) {
            console.error('[useCart] Error in findCartItemBySupplierId:', error)
            return null
        }
    }

    const updateCartLocally = (
        productId: number,
        updates: { is_favorite?: boolean; [key: string]: any }
    ): boolean => {
        try {
            const supplierGroup = cartStore.supplierGroups.find((group) =>
                group?.items?.some((item) => item?.product?.id === productId)
            )

            if (!supplierGroup) {
                return false
            }

            const itemIndex = supplierGroup.items.findIndex(
                (item) => item?.product?.id === productId
            )

            if (itemIndex === -1) {
                return false
            }

            const item = supplierGroup.items[itemIndex]
            if (item?.product) {
                if (typeof updates.is_favorite === 'boolean') {
                    item.product.is_favorite = updates.is_favorite
                }

                Object.keys(updates).forEach((key) => {
                    if (key !== 'is_favorite' && updates[key] !== undefined) {
                        ;(item.product as any)[key] = updates[key]
                    }
                })

                return true
            }

            return false
        } catch (error) {
            console.error('[useCart] Error in updateCartLocally:', error)
            return false
        }
    }

    const quickAddToCart = async (productId: number, quantity = 1): Promise<boolean> => {
        // Check cart access before adding
        if (!checkCartAccess()) {
            return false
        }

        setLoading('addToCart', true)
        try {
            const payload: AddToCartPayload = { product_id: productId, quantity }
            await cartStore.addToCart(payload)
            itemJustAdded.value = true

            toast.success(t('cart.success.productAdded'))
            setTimeout(() => {
                itemJustAdded.value = false
            }, 300)
            return true
        } catch (error: any) {
            const message =
                error.statusCode === 422
                    ? t('cart.error.validationError')
                    : t('cart.error.addError')
            toast.error(error.message || message)
            return false
        } finally {
            setLoading('addToCart', false)
        }
    }

    const quickUpdateQuantity = async (itemId: number, quantity: number): Promise<boolean> => {
        // Check cart access before updating
        if (!checkCartAccess()) {
            return false
        }

        if (quantity <= 0) {
            return quickRemoveItem(itemId)
        }
        setLoading(`updateQuantity_${itemId}`, true)
        try {
            await cartStore.updateQuantity(itemId, quantity)
            toast.success(t('cart.success.quantityUpdated'))
            return true
        } catch (error: any) {
            const message =
                error.statusCode === 422
                    ? t('cart.error.validationError')
                    : t('cart.error.updateError')
            toast.error(error.message || message)
            return false
        } finally {
            setLoading(`updateQuantity_${itemId}`, false)
        }
    }

    const quickRemoveItem = async (itemId: number): Promise<boolean> => {
        setLoading(`removeItem_${itemId}`, true)
        try {
            await cartStore.removeItem(itemId)
            toast.success(t('cart.success.itemRemoved'))
            return true
        } catch (error: any) {
            toast.error(error.message || t('cart.error.removeError'))
            return false
        } finally {
            setLoading(`removeItem_${itemId}`, false)
        }
    }

    const quickRemoveSupplierIdCart = async (supplierId: number): Promise<boolean> => {
        setLoading(`removeItemSupplier_${supplierId}`, true)
        try {
            await cartStore.removeSupplierCard(supplierId)
            toast.success(t('cart.success.itemRemoved'))
            return true
        } catch (error: any) {
            toast.error(error.message || t('cart.error.removeError'))
            return false
        } finally {
            setLoading(`removeItemSupplier_${supplierId}`, false)
        }
    }

    const quickToggleSaveForLater = async (itemId: number): Promise<boolean> => {
        const item = cartStore.getItemById(itemId)
        if (!item) {
            toast.error(t('cart.error.itemNotFound'))
            return false
        }
        setLoading(`toggleSaveForLater_${itemId}`, true)
        try {
            if (item.is_saved_for_later) {
                await cartStore.moveItemToCart(itemId)
                toast.success(t('cart.success.movedToCart'))
            } else {
                await cartStore.saveItemForLater(itemId)
                toast.success(t('cart.success.savedForLater'))
            }
            return true
        } catch (error: any) {
            toast.error(error.message || t('cart.error.toggleError'))
            return false
        } finally {
            setLoading(`toggleSaveForLater_${itemId}`, false)
        }
    }

    const bulkAddProducts = async (products: AddToCartPayload[]): Promise<boolean> => {
        // Check cart access before bulk adding
        if (!checkCartAccess()) {
            return false
        }

        if (products.length === 0) {
            toast.error(t('cart.error.noProducts'))
            return false
        }
        setLoading('bulkAddProducts', true)
        try {
            const payload: BulkAddToCartPayload = { items: products }
            await cartStore.bulkAddToCart(payload)
            toast.success(t('cart.success.productsAdded', { count: products.length }))
            return true
        } catch (error: any) {
            const message =
                error.statusCode === 422
                    ? t('cart.error.validationError')
                    : t('cart.error.bulkAddError')
            toast.error(error.message || message)
            return false
        } finally {
            setLoading('bulkAddProducts', false)
        }
    }

    const createOrderForSupplier = async (
        supplierId: number,
        notes?: string,
        deliveryDetail?: any
    ): Promise<any> => {
        // Check cart access before checkout
        if (!checkCartAccess()) {
            throw new Error(
                t('cart.error.accessDenied') || 'Cart access denied. Please upgrade your plan.'
            )
        }

        setLoading('createOrder', true)
        try {
            const order = await cartStore.createOrderFromCart(supplierId, notes, deliveryDetail)
            return order
        } catch (error: any) {
            const message =
                error.statusCode === 422
                    ? t('cart.error.validationError')
                    : t('cart.error.orderError')
            throw error
        } finally {
            setLoading('createOrder', false)
        }
    }

    const createOrderFromCart = createOrderForSupplier

    const fetchCartCount = async (): Promise<number> => {
        setLoading('fetchCount', true)
        try {
            return await cartStore.fetchCartCount()
        } catch (error: any) {
            toast.error(error.message || t('cart.error.countError'))
            return 0
        } finally {
            setLoading('fetchCount', false)
        }
    }

    const getSupplierSubtotal = (supplierId: number) => {
        const group = cartStore.getSupplierGroup(supplierId)
        return group?.totals || null
    }

    const canCheckout = computed(() => {
        return cartStore.totalItemsCount > 0 && !cartStore.isLoading
    })

    const cartBadgeCount = computed(() => {
        const count = cartStore.totalItemsCount
        return count > 99 ? '99+' : count
    })

    const isCartReady = computed(() => {
        try {
            return cartStore && cartStore.allItems !== undefined && !cartStore.isLoading
        } catch (error) {
            console.error('[useCart] Error checking cart ready state:', error)
            return false
        }
    })

    const safeSupplierGroups = computed(() => {
        try {
            if (!cartStore || !cartStore.supplierGroups) {
                return []
            }
            return Array.isArray(cartStore.supplierGroups) ? cartStore.supplierGroups : []
        } catch (error) {
            console.error('[useCart] Error accessing supplierGroups:', error)
            return []
        }
    })

    const getCartQuantity = (productId: number): number => {
        try {
            if (!cartStore || !cartStore.cartItems) {
                return 0
            }
            return cartStore.cartItems[productId] || 0
        } catch (error) {
            console.error('[useCart] Error in getCartQuantity:', error)
            return 0
        }
    }

    return {
        // Feature Access
        hasCartAccess,

        // Loading & Error States
        isLoading: computed(
            () => Object.values(loading.value).some(Boolean) || cartStore.isLoading
        ),
        loading,
        error: computed(() => cartStore.error),

        // Cart Data
        supplierGroups: safeSupplierGroups,
        savedForLater: computed(() => cartStore.savedForLater || []),
        summary: computed(() => cartStore.summary),
        grandTotals: computed(() => cartStore.grandTotals),
        totalItemsCount: computed(() => cartStore.totalItemsCount || 0),
        totalUniqueItems: computed(() => cartStore.totalUniqueItems || 0),
        supplierCount: computed(() => cartStore.supplierCount || 0),
        hasSavedItems: computed(() => cartStore.hasSavedItems || false),
        itemJustAdded: readonly(itemJustAdded),
        isCartReady,
        canCheckout,
        cartBadgeCount,

        // Cart Query Functions
        getCartQuantity,
        isInCart,
        getProductQuantityInCart,
        findCartItemByProduct,
        findCartItemBySupplierId,

        // Cart Mutation Functions
        updateCartLocally,
        quickAddToCart,
        quickUpdateQuantity,
        quickRemoveItem,
        quickRemoveSupplierIdCart,
        quickToggleSaveForLater,
        bulkAddProducts,
        createOrderForSupplier,
        createOrderFromCart,
        fetchCartCount,
        getSupplierSubtotal,

        clearCart: () => cartStore.clearCart(),
        resetError: () => cartStore.resetError(),
    }
}
