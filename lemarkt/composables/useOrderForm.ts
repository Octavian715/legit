import type {
    OrderFormData,
    OrderFormMode,
    OrderFormItemData,
    OrderFormTotals,
    ProductPriceData,
} from '~/types/order-form'
import type { Document, CreateDocumentRequest, UpdateDocumentRequest } from '~/types/documents'
import { useDocumentsStore } from '~/stores/documents'
import { useUserStore } from '~/stores/user'
import { storeToRefs } from 'pinia'

export const useOrderForm = (mode: OrderFormMode = 'create', documentId?: number) => {
    const documentsStore = useDocumentsStore()
    const userStore = useUserStore()
    const { user } = storeToRefs(userStore)
    const { currencyOptions } = useStaticData()
    const { formatDateForInput, formatDate, isValidDate, parseDate } = useDate()
    const { isFavorite, favoriteIds } = useFavorite()
    const { t } = useI18n()

    const isEditMode = computed(() => mode === 'edit')
    const isCreateMode = computed(() => mode === 'create')

    const formData = ref<OrderFormData>({
        type: null,
        buyerId: null,
        statusId: null,
        paymentStatusId: null,
        title: '',
        subtitle: '',
        date: formatDateForInput(new Date()),
        currencyId: null,
        documentNotes: '',
        documentCommentary: '',
        hasCustomDelivery: false,
        deliveryDetail: null,
        items: [],
    })

    const loading = ref(false)
    const loadingDocument = ref(false)
    const loadingPreview = ref(false)
    const selectedDeliveryLocationId = ref<number | null>(null)

    const connectedClients = computed(() => documentsStore.getConnectedClients)
    const loadingClients = computed(() => documentsStore.loadingClients)
    const clientsError = computed(() => documentsStore.clientsError)

    const connectedClientOptions = computed(() => documentsStore.connectedClientOptions)

    const deliveryLocationOptions = computed(() => {
        if (!formData.value.buyerId) return []
        return documentsStore.getDeliveryLocationOptions(formData.value.buyerId)
    })

    const isAnyOperationInProgress = computed(
        () => loading.value || loadingDocument.value || loadingPreview.value
    )

    const getConnectedClientById = (id: number) => {
        return documentsStore.getConnectedClientById(id)
    }

    const getDeliveryLocations = (clientId: number) => {
        return documentsStore.getDeliveryLocationsByClientId(clientId)
    }

    const fetchConnectedClients = async (forceRefresh = false) => {
        await documentsStore.fetchConnectedClients(forceRefresh)
    }

    const initializeConnectedClients = async () => {
        if (connectedClients.value.length === 0 || documentsStore.isClientsExpired) {
            await fetchConnectedClients()
        }
    }

    const totals = computed<OrderFormTotals>(() => {
        let subtotal = 0
        let totalDiscount = 0
        let totalVat = 0

        formData.value.items.forEach((item) => {
            const lineSubtotal = item.quantity * item.unitPrice
            const lineDiscount = lineSubtotal * (item.discountPercent / 100)
            const lineNet = lineSubtotal - lineDiscount
            const lineVat = lineNet * (item.vatPercent / 100)

            subtotal += lineSubtotal
            totalDiscount += lineDiscount
            totalVat += lineVat
        })

        const total = subtotal - totalDiscount + totalVat

        return {
            subtotal: Number(subtotal.toFixed(2)),
            totalDiscount: Number(totalDiscount.toFixed(2)),
            totalVat: Number(totalVat.toFixed(2)),
            total: Number(total.toFixed(2)),
        }
    })

    const itemsWithFavoriteStatus = computed(() => {
        return formData.value.items.map((item) => ({
            ...item,
            isFavorite: item.productId ? isFavorite(item.productId) : false,
        }))
    })

    const favoriteItemsCount = computed(() => {
        return formData.value.items.filter((item) => item.productId && isFavorite(item.productId))
            .length
    })

    const addItem = () => {
        const newItem: OrderFormItemData = {
            tempId: `temp-${Date.now()}-${Math.random()}`,
            name: '',
            sku: '',
            ean: '',
            bbd: '',
            quantity: 1,
            quantityUnitId: 1,
            unitPrice: 0,
            discountPercent: 0,
            vatPercent: 20,
        }
        formData.value.items.push(newItem)
    }

    const removeItem = (index: number) => {
        formData.value.items.splice(index, 1)
    }

    const duplicateItem = (index: number) => {
        const item = { ...formData.value.items[index] }
        item.tempId = `temp-${Date.now()}-${Math.random()}`
        delete item.id
        formData.value.items.splice(index + 1, 0, item)
    }

    const isItemFavorite = (index: number): boolean => {
        const item = formData.value.items[index]
        return item.productId ? isFavorite(item.productId) : false
    }

    const toggleCustomDelivery = (value: boolean) => {
        formData.value.hasCustomDelivery = value

        if (value && !formData.value.deliveryDetail) {
            formData.value.deliveryDetail = {
                contactName: '',
                phoneNumber: '',
                phoneCountryId: null,
                countryId: null,
                stateName: '',
                cityName: '',
                streetName: '',
                streetNumber: '',
                postalCode: '',
            }
        } else if (!value) {
            formData.value.deliveryDetail = null
        }
    }

    const handleDeliveryLocationSelect = (locationId: number) => {
        const options = documentsStore.getDeliveryLocationOptions(formData.value.buyerId!)
        const selected = options.find((opt) => opt.value === locationId)

        if (selected?.location) {
            selectedDeliveryLocationId.value = locationId
            formData.value.hasCustomDelivery = false
            formData.value.deliveryDetail = null
        }
    }

    const handleBuyerChange = () => {
        if (isCreateMode.value) {
            selectedDeliveryLocationId.value = null

            const locations = deliveryLocationOptions.value

            if (locations.length > 0) {
                selectedDeliveryLocationId.value = locations[0].value
                formData.value.hasCustomDelivery = false
            } else {
                formData.value.hasCustomDelivery = true
                if (!formData.value.deliveryDetail) {
                    formData.value.deliveryDetail = {
                        contactName: '',
                        phoneNumber: '',
                        phoneCountryId: null,
                        countryId: null,
                        stateName: '',
                        cityName: '',
                        streetName: '',
                        streetNumber: '',
                        postalCode: '',
                    }
                }
            }
        }
    }

    const validateDate = (dateString: string): boolean => {
        return isValidDate(dateString)
    }

    const setDocumentDate = (date: Date | string) => {
        const dateObj = typeof date === 'string' ? parseDate(date) : date
        if (dateObj && isValidDate(dateObj)) {
            formData.value.date = formatDateForInput(dateObj)
        }
    }

    const getFormattedDocumentDate = (formatString = 'PP'): string => {
        if (!formData.value.date) return ''
        return formatDate(formData.value.date, formatString)
    }

    const reconstructProductPriceData = (
        item: any,
        documentCurrencyId: number
    ): ProductPriceData => {
        const localCurrencyId = user.value?.default_local_currency?.id
        const exportCurrencyId = user.value?.default_export_currency?.id

        const unitPrice = Number(item.unit_price) || 0
        const vatPercent = Number(item.vat_percent) || 20

        const isLocalCurrency = documentCurrencyId === localCurrencyId
        const isExportCurrency = documentCurrencyId === exportCurrencyId

        const productPriceData: ProductPriceData = {
            price: unitPrice,
            localPrice: unitPrice,
            exportPrice: unitPrice,
            vatLocal: 20,
            vatExport: 0,
        }

        if (isLocalCurrency) {
            productPriceData.localPrice = unitPrice
            productPriceData.vatLocal = vatPercent
        } else if (isExportCurrency) {
            productPriceData.exportPrice = unitPrice
            productPriceData.vatExport = vatPercent
        }

        return productPriceData
    }

    const loadDocumentForEdit = async () => {
        if (!documentId || !isEditMode.value) {
            console.warn('[useOrderForm] loadDocumentForEdit called but not in edit mode')
            return
        }

        loadingDocument.value = true

        try {
            const document = documentsStore.currentDocument

            if (!document) {
                console.error('[useOrderForm] No document found in store')
                throw new Error('Document not found in store')
            }

            populateFormFromDocument(document)

            if (formData.value.buyerId) {
                await nextTick()

                const locations = documentsStore.getDeliveryLocationsByClientId(
                    formData.value.buyerId
                )

                if (document.delivery_location?.id) {
                    selectedDeliveryLocationId.value = document.delivery_location.id
                } else if (!document.delivery_detail && locations.length > 0) {
                    selectedDeliveryLocationId.value = locations[0].id
                } else if (document.delivery_detail) {
                }
            }
        } catch (error: any) {
            console.error('[useOrderForm] Failed to load document:', error)
            throw error
        } finally {
            loadingDocument.value = false
        }
    }

    const populateFormFromDocument = (document: Document) => {
        formData.value.type = document.type
        formData.value.buyerId = document.buyer?.id || null
        formData.value.statusId = document.status?.id || null
        formData.value.paymentStatusId = document.payment_status?.id || null
        formData.value.title = document.title || ''
        formData.value.subtitle = document.subtitle || ''
        formData.value.date = document.date
        formData.value.currencyId = document.currency?.id || null
        formData.value.documentNotes = document.document_notes || ''
        formData.value.documentCommentary = document.document_commentary || ''

        if (document.delivery_detail) {
            formData.value.hasCustomDelivery = true
            formData.value.deliveryDetail = {
                contactName: document.delivery_detail.contact_name || '',
                phoneNumber: document.delivery_detail.phone_number || '',
                phoneCountryId: document.delivery_detail.phone_country_id || null,
                countryId: document.delivery_detail.country?.id || null,
                stateName: document.delivery_detail.state_name || '',
                cityName: document.delivery_detail.city_name || '',
                streetName: document.delivery_detail.street_name || '',
                streetNumber: document.delivery_detail.street_number || '',
                postalCode: document.delivery_detail.postal_code || '',
            }
        } else if (document.delivery_location) {
            formData.value.hasCustomDelivery = false
            formData.value.deliveryDetail = null
            selectedDeliveryLocationId.value = document.delivery_location.id
        } else {
            formData.value.hasCustomDelivery = false
            formData.value.deliveryDetail = null
        }

        formData.value.items = (document.items || []).map((item: any, index: number) => {
            const productPriceData = reconstructProductPriceData(item, document.currency?.id || 0)

            const orderFormItem: OrderFormItemData = {
                id: item.id,
                tempId: undefined,
                productId: item.product_id || item.product?.id || null,
                name: item.name || item.product?.name || '',
                sku: item.sku || item.product?.article_number || '',
                ean: item.ean || item.product?.ean_product || '',
                bbd: item.bbd || '',
                eanBarcodeUrl: item.ean_barcode_url || item.product?.ean_product_url || null,
                image: item.image || item.product?.primary_image || '',
                quantity: Number(item.quantity) || 1,
                quantityUnitId: item.quantity_unit_id || item.quantity_unit?.id || 1,
                unitPrice: Number(item.unit_price) || 0,
                discountPercent: Number(item.discount_percent) || 0,
                vatPercent: Number(item.vat_percent) || 20,
                productPriceData,
            }

            return orderFormItem
        })
    }

    const prepareRequestData = (
        forceIncludeType = false
    ): CreateDocumentRequest | UpdateDocumentRequest => {
        const baseData = {
            buyer_id: formData.value.buyerId!,
            status_id: formData.value.statusId || undefined,
            payment_status_id: formData.value.paymentStatusId || undefined,
            title: formData.value.title || undefined,
            subtitle: formData.value.subtitle || undefined,
            date: formData.value.date,
            currency_id: formData.value.currencyId!,
            document_notes: formData.value.documentNotes || undefined,
            document_commentary: formData.value.documentCommentary || undefined,
            delivery_location_id:
                !formData.value.hasCustomDelivery && selectedDeliveryLocationId.value
                    ? selectedDeliveryLocationId.value
                    : undefined,
            delivery_detail:
                formData.value.hasCustomDelivery && formData.value.deliveryDetail
                    ? {
                          contact_name: formData.value.deliveryDetail.contactName,
                          phone_number: formData.value.deliveryDetail.phoneNumber,
                          phone_country_id:
                              formData.value.deliveryDetail.phoneCountryId || undefined,
                          country_id: formData.value.deliveryDetail.countryId!,
                          state_name: formData.value.deliveryDetail.stateName || undefined,
                          city_name: formData.value.deliveryDetail.cityName,
                          street_name: formData.value.deliveryDetail.streetName,
                          street_number: formData.value.deliveryDetail.streetNumber,
                          postal_code: formData.value.deliveryDetail.postalCode,
                      }
                    : undefined,
            items: formData.value.items.map((item) => ({
                product_id: item.productId || undefined,
                name: item.name,
                sku: item.sku,
                ean: item.ean || undefined,
                bbd: item.bbd || undefined,
                quantity: Number(item.quantity),
                quantity_unit_id: item.quantityUnitId,
                unit_price: Number(item.unitPrice),
                discount_percent: Number(item.discountPercent),
                vat_percent: Number(item.vatPercent),
            })),
        }

        // Include type for create mode OR when explicitly required (e.g., preview)
        if (isCreateMode.value || forceIncludeType) {
            return {
                ...baseData,
                type: formData.value.type!,
            } as CreateDocumentRequest
        }

        // In edit mode, exclude read-only fields that only supplier can modify
        // This prevents validation errors when buyer tries to update the document
        const editableData: Partial<typeof baseData> = {
            title: baseData.title,
            subtitle: baseData.subtitle,
            document_notes: baseData.document_notes,
            document_commentary: baseData.document_commentary,
            delivery_location_id: baseData.delivery_location_id,
            delivery_detail: baseData.delivery_detail,
            items: baseData.items,
        }

        return editableData as UpdateDocumentRequest
    }

    const submit = async (): Promise<{ success: boolean; document?: Document }> => {
        loading.value = true

        try {
            const payload = prepareRequestData()

            let document: Document | null = null

            if (mode === 'edit' && documentId) {
                document = await documentsStore.updateDocument(documentId, payload)
            } else {
                document = await documentsStore.createDocument(payload)
            }

            if (document) {
                return {
                    success: true,
                    document,
                }
            }

            return {
                success: true,
            }
        } catch (error: any) {
            console.error('[useOrderForm] Submit error:', error)
            throw error
        } finally {
            loading.value = false
        }
    }

    const createPreview = async (): Promise<{ success: boolean; document?: Document }> => {
        loadingPreview.value = true

        try {
            // Force include type for preview endpoint (required by backend)
            const payload = prepareRequestData(true)
            const success = await documentsStore.previewPdfInNewTab(payload)

            if (success) {
                return {
                    success: true,
                }
            }

            throw new Error(documentsStore.error || 'Failed to create preview')
        } catch (error: any) {
            console.error('[useOrderForm] Create preview error:', error)
            throw error
        } finally {
            loadingPreview.value = false
        }
    }

    const reset = () => {
        formData.value = {
            type: null,
            buyerId: null,
            statusId: null,
            paymentStatusId: null,
            title: '',
            subtitle: '',
            date: formatDateForInput(new Date()),
            currencyId: null,
            documentNotes: '',
            documentCommentary: '',
            hasCustomDelivery: false,
            deliveryDetail: null,
            items: [],
        }
        selectedDeliveryLocationId.value = null
    }

    return {
        formData,
        loading,
        loadingDocument,
        loadingPreview,
        isAnyOperationInProgress,
        isEditMode,
        isCreateMode,
        connectedClients,
        loadingClients,
        clientsError,
        connectedClientOptions,
        deliveryLocationOptions,
        selectedDeliveryLocationId,
        getConnectedClientById,
        getDeliveryLocations,
        fetchConnectedClients,
        initializeConnectedClients,
        totals,
        currencyOptions,
        itemsWithFavoriteStatus,
        favoriteItemsCount,
        favoriteIds,
        addItem,
        removeItem,
        duplicateItem,
        isItemFavorite,
        toggleCustomDelivery,
        handleDeliveryLocationSelect,
        handleBuyerChange,
        validateDate,
        setDocumentDate,
        getFormattedDocumentDate,
        loadDocumentForEdit,
        populateFormFromDocument,
        submit,
        createPreview,
        reset,
    }
}
