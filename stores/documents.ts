import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
    Document,
    DocumentListItem,
    DocumentType,
    DocumentFilters,
    DocumentMeta,
    CreateDocumentRequest,
    UpdateDocumentRequest,
    DocumentsResponse,
    ConnectedClient,
    ConnectedClientResponse,
    UserProduct,
    CreateOrderFromCartRequest,
} from '~/types/documents'

export const useDocumentsStore = defineStore('documents', () => {
    const api = useApi()

    const documents = ref<DocumentListItem[]>([])
    const currentDocument = ref<Document | null>(null)
    const meta = ref<DocumentMeta | null>(null)
    const filters = ref<DocumentFilters>({
        page: 1,
        per_page: 20,
        sort_by: 'created_at',
        sort_order: 'desc',
    })
    const connectedClients = ref<ConnectedClient[]>([])
    const loadingClients = ref(false)
    const clientsError = ref<string | null>(null)
    const clientsLastFetchedAt = ref<number | null>(null)

    const userProducts = ref<UserProduct[]>([])
    const loadingProducts = ref(false)
    const productsError = ref<string | null>(null)
    const productsLastFetchedAt = ref<number | null>(null)

    const loadingStates = ref({
        fetching: false,
        fetchingDocument: {} as Record<number, boolean>,
        creatingPreview: false,
        creating: false,
        updating: {} as Record<number, boolean>,
        deleting: {} as Record<number, boolean>,
        duplicating: {} as Record<number, boolean>,
        generatingPdf: {} as Record<number, boolean>,
        confirming: {} as Record<number, boolean>,
        rejecting: {} as Record<number, boolean>,
    })

    const error = ref<string | null>(null)
    const lastFetchSignature = ref<string>('')

    const isLoading = computed(
        () =>
            loadingStates.value.fetching ||
            loadingStates.value.creating ||
            loadingStates.value.creatingPreview ||
            Object.values(loadingStates.value.fetchingDocument).some(Boolean) ||
            Object.values(loadingStates.value.updating).some(Boolean) ||
            Object.values(loadingStates.value.deleting).some(Boolean) ||
            Object.values(loadingStates.value.duplicating).some(Boolean) ||
            Object.values(loadingStates.value.generatingPdf).some(Boolean) ||
            Object.values(loadingStates.value.confirming).some(Boolean) ||
            Object.values(loadingStates.value.rejecting).some(Boolean)
    )

    const hasDocuments = computed(() => documents.value.length > 0)
    const totalDocuments = computed(() => meta.value?.total || 0)
    const currentPage = computed(() => meta.value?.current_page || 1)
    const lastPage = computed(() => meta.value?.last_page || 1)
    const hasNextPage = computed(() => currentPage.value < lastPage.value)
    const hasPrevPage = computed(() => currentPage.value > 1)

    const documentsByType = computed(() => {
        const result: Record<DocumentType, DocumentListItem[]> = {
            order: [],
            offer: [],
            delivery_note: [],
            invoice: [],
            correction_invoice: [],
        }

        documents.value.forEach((doc) => {
            if (result[doc.type]) {
                result[doc.type].push(doc)
            }
        })

        return result
    })

    const getDocumentById = computed(() => (id: number): DocumentListItem | null => {
        return documents.value.find((doc) => doc.id === id) || null
    })

    const getConnectedClients = computed(() => connectedClients.value)

    const getConnectedClientById = computed(() => (id: number): ConnectedClient | undefined => {
        return connectedClients.value.find((client) => client.id === id)
    })

    const connectedClientOptions = computed(() => {
        return connectedClients.value.map((client) => ({
            label: client.companyDetails?.legalName || `Client #${client.id}`,
            value: client.id,
            deliveryAddress: client.deliveryLocations || [],
        }))
    })

    const getDeliveryLocationsByClientId = computed(() => (clientId: number) => {
        const client = connectedClients.value.find((c) => c.id === clientId)
        return client?.deliveryLocations || []
    })

    const getDeliveryLocationOptions = computed(() => (clientId: number) => {
        const client = connectedClients.value.find((c) => c.id === clientId)
        if (!client) return []

        return client.deliveryLocations.map((location) => ({
            label: `${location.streetName} ${location.streetNumber}, ${location.cityName}`,
            value: location.id,
            location,
        }))
    })

    const isClientsExpired = computed(() => {
        if (!clientsLastFetchedAt.value) return true
        const CACHE_DURATION = 5 * 60 * 1000
        return Date.now() - clientsLastFetchedAt.value > CACHE_DURATION
    })

    const isProductsExpired = computed(() => {
        if (!productsLastFetchedAt.value) return true
        const CACHE_DURATION = 5 * 60 * 1000
        return Date.now() - productsLastFetchedAt.value > CACHE_DURATION
    })

    const getUserProducts = computed(() => userProducts.value)

    const getProductById = computed(() => (id: number): UserProduct | undefined => {
        return userProducts.value.find((product) => product.id === id)
    })

    const productOptions = computed(() => {
        return userProducts.value.map((product) => ({
            label: `${product.name_original} ${product.article_number ? `(${product.article_number})` : ''}`,
            value: product.id,
            product,
        }))
    })

    const transformConnectedClients = (data: ConnectedClientResponse[]): ConnectedClient[] => {
        return data.map((client) => ({
            id: client.id,
            companyDetails: client.company_details
                ? {
                      legalName: client.company_details.legal_name,
                      registrationNumber: client.company_details.registration_number,
                      vatNumber: client.company_details.vat_number,
                  }
                : null,
            deliveryLocations: client.delivery_locations.map((location) => ({
                id: location.id,
                contactName: location.contact_name,
                phoneNumber: location.phone_number,
                phoneCountryId: location.phone_country_id,
                country: location.country,
                state: location.state,
                cityName: location.city_name,
                streetName: location.street_name,
                streetNumber: location.street_number,
                postalCode: location.postal_code,
            })),
        }))
    }

    const isDocumentLoading = (
        id: number,
        operation: 'fetch' | 'update' | 'delete' | 'duplicate' | 'pdf' | 'confirm' | 'reject'
    ) => {
        switch (operation) {
            case 'fetch':
                return loadingStates.value.fetchingDocument[id] || false
            case 'update':
                return loadingStates.value.updating[id] || false
            case 'delete':
                return loadingStates.value.deleting[id] || false
            case 'duplicate':
                return loadingStates.value.duplicating[id] || false
            case 'pdf':
                return loadingStates.value.generatingPdf[id] || false
            case 'confirm':
                return loadingStates.value.confirming[id] || false
            case 'reject':
                return loadingStates.value.rejecting[id] || false
            default:
                return false
        }
    }

    const setLoadingState = (
        key: keyof typeof loadingStates.value,
        value: boolean | Record<number, boolean>
    ) => {
        if (typeof value === 'boolean') {
            ;(loadingStates.value[key] as boolean) = value
        } else {
            ;(loadingStates.value[key] as Record<number, boolean>) = {
                ...(loadingStates.value[key] as Record<number, boolean>),
                ...value,
            }
        }
    }

    const clearError = () => {
        error.value = null
    }

    const handleError = (err: any, defaultMessage: string) => {
        console.error('[Documents Store]', err)
        error.value = err?.data?.message || err?.statusMessage || defaultMessage
    }

    const updateFilters = (newFilters: Partial<DocumentFilters>) => {
        filters.value = { ...filters.value, ...newFilters }
    }

    const resetFilters = () => {
        filters.value = {
            page: 1,
            per_page: 20,
            sort_by: 'created_at',
            sort_order: 'desc',
        }
        lastFetchSignature.value = ''
    }

    const fetchDocuments = async (newFilters?: Partial<DocumentFilters>) => {
        if (newFilters) {
            updateFilters(newFilters)
        }

        const currentSignature = JSON.stringify(filters.value)

        if (currentSignature === lastFetchSignature.value && documents.value.length > 0) {
            return
        }

        setLoadingState('fetching', true)
        clearError()
        lastFetchSignature.value = currentSignature

        try {
            const response = await api.get<DocumentsResponse>('/documents', {
                query: filters.value,
            })

            documents.value = response.data?.data || []
            meta.value = response.data?.meta || {
                current_page: 1,
                last_page: 1,
                per_page: 20,
                total: 0,
                from: 0,
                to: 0,
            }
        } catch (err: any) {
            handleError(err, 'Failed to load documents')
            documents.value = []
            meta.value = {
                current_page: 1,
                last_page: 1,
                per_page: 20,
                total: 0,
                from: 0,
                to: 0,
            }
        } finally {
            setLoadingState('fetching', false)
        }
    }

    const fetchDocument = async (id: number): Promise<Document | null> => {
        setLoadingState('fetchingDocument', { [id]: true })
        clearError()

        try {
            const response = await api.get<Document>(`/documents/${id}`)

            if (response) {
                currentDocument.value = response
                return response
            }

            return null
        } catch (err: any) {
            handleError(err, `Failed to load document ${id}`)
            return null
        } finally {
            setLoadingState('fetchingDocument', { [id]: false })
        }
    }

    const createDocument = async (data: CreateDocumentRequest): Promise<Document | null> => {
        setLoadingState('creating', true)
        clearError()

        try {
            const response = await api.post<any>('/documents', data)

            if (response.data || response) {
                const responseData = response.data || response

                const newDocumentListItem: DocumentListItem = {
                    id: responseData.id,
                    type: responseData.type || data.type,
                    status: responseData.status || { id: 1, code: 'draft', name: 'Draft' },
                    payment_status: responseData.payment_status || undefined,
                    number: responseData.number || '',
                    title: responseData.title || data.title || '',
                    date: responseData.date || data.date || '',
                    currency: responseData.currency || {
                        id: data.currency_id,
                        code: '',
                        symbol: '',
                        name: '',
                    },
                    total: Number(responseData.total || 0),
                    buyer: responseData.buyer || { id: data.buyer_id, email: '' },
                    items_count: responseData.items?.length || data.items.length,
                    created_at: responseData.created_at || new Date().toISOString(),
                    updated_at: responseData.updated_at || new Date().toISOString(),
                }

                documents.value.unshift(newDocumentListItem)

                if (meta.value) {
                    meta.value.total += 1
                }

                return {
                    id: responseData.id,
                    type: responseData.type || data.type,
                    status: responseData.status || { id: 1, code: 'draft', name: 'Draft' },
                    payment_status: responseData.payment_status,
                    number: responseData.number || '',
                    title: responseData.title,
                    subtitle: responseData.subtitle,
                    date: responseData.date || data.date || '',
                    currency: responseData.currency || {
                        id: data.currency_id,
                        code: '',
                        symbol: '',
                        name: '',
                    },
                    subtotal: Number(responseData.subtotal || 0),
                    total_discount: Number(responseData.total_discount || 0),
                    total_vat: Number(responseData.total_vat || 0),
                    total: Number(responseData.total || 0),
                    buyer: responseData.buyer || { id: data.buyer_id, email: '' },
                    document_notes: responseData.document_notes,
                    document_commentary: responseData.document_commentary,
                    items: responseData.items || [],
                    vat_totals: responseData.vat_totals || [],
                    created_at: responseData.created_at || new Date().toISOString(),
                    updated_at: responseData.updated_at || new Date().toISOString(),
                } as Document
            }

            return null
        } catch (err: any) {
            console.error('[Documents Store] Create document error:', err)
            handleError(err, 'Failed to create document')
            throw err
        } finally {
            setLoadingState('creating', false)
        }
    }

    const createPreviewDocument = async (data: CreateDocumentRequest): Promise<Blob | null> => {
        setLoadingState('creatingPreview', true)
        clearError()

        try {
            const response = await api.post<Blob>('/documents/preview', data, {
                responseType: 'blob',
            })

            return response as unknown as Blob
        } catch (err: any) {
            console.error('[DocumentsStore] createPreviewDocument error:', err)

            let userMessage = 'Failed to create preview document'

            if (err?.status === 422 || err?.statusCode === 422) {
                userMessage = 'Validation failed. Please check your form data.'
                if (err?.data?.errors) {
                    console.error('[DocumentsStore] Validation errors:', err.data.errors)
                    const firstError = Object.values(err.data.errors)[0]
                    if (Array.isArray(firstError)) {
                        userMessage = firstError[0] as string
                    }
                }
            } else if (err?.status === 404 || err?.statusCode === 404) {
                userMessage = 'Preview endpoint not found. Please contact support.'
            } else if (err?.status === 401 || err?.statusCode === 401) {
                userMessage = 'Authentication failed. Please log in again.'
            } else if (err?.status === 403 || err?.statusCode === 403) {
                userMessage = 'You do not have permission to create previews.'
            } else if (err?.status === 500 || err?.statusCode === 500) {
                userMessage = 'Server error. Please try again later.'
            } else if (err?.data?.message) {
                userMessage = err.data.message
            } else if (err?.message) {
                userMessage = err.message
            }

            error.value = userMessage
            handleError(err, userMessage)
            return null
        } finally {
            setLoadingState('creatingPreview', false)
        }
    }

    const updateDocument = async (
        id: number,
        data: UpdateDocumentRequest
    ): Promise<Document | null> => {
        setLoadingState('updating', { [id]: true })
        clearError()

        try {
            const response = await api.put<Document>(`/documents/${id}`, data)

            if (response.data) {
                const index = documents.value.findIndex((doc) => doc.id === id)
                if (index !== -1) {
                    documents.value[index] = {
                        ...documents.value[index],
                        type: response.data.type,
                        status: response.data.status,
                        payment_status: response.data.payment_status,
                        title: response.data.title,
                        date: response.data.date,
                        total: response.data.total,
                        updated_at: response.data.updated_at,
                    }
                }

                if (currentDocument.value?.id === id) {
                    currentDocument.value = response.data
                }

                return response.data
            }

            return null
        } catch (err: any) {
            handleError(err, `Failed to update document ${id}`)
            throw err
        } finally {
            setLoadingState('updating', { [id]: false })
        }
    }

    const deleteDocument = async (id: number): Promise<boolean> => {
        setLoadingState('deleting', { [id]: true })
        clearError()

        try {
            await api.delete(`/documents/${id}`)

            documents.value = documents.value.filter((doc) => doc.id !== id)

            if (currentDocument.value?.id === id) {
                currentDocument.value = null
            }

            if (meta.value) {
                meta.value.total = Math.max(0, meta.value.total - 1)
            }

            return true
        } catch (err: any) {
            handleError(err, `Failed to delete document ${id}`)
            return false
        } finally {
            setLoadingState('deleting', { [id]: false })
        }
    }

    const duplicateDocument = async (id: number): Promise<Document | null> => {
        setLoadingState('duplicating', { [id]: true })
        clearError()

        try {
            const response = await api.post<Document>(`/documents/${id}/duplicate`)

            if (response.data) {
                const newDocumentListItem: DocumentListItem = {
                    id: response.data.id,
                    type: response.data.type,
                    status: response.data.status,
                    payment_status: response.data.payment_status,
                    number: response.data.number,
                    title: response.data.title,
                    date: response.data.date,
                    currency: response.data.currency,
                    total: response.data.total,
                    buyer: response.data.buyer,
                    items_count: response.data.items?.length || 0,
                    created_at: response.data.created_at,
                    updated_at: response.data.updated_at,
                }

                documents.value.unshift(newDocumentListItem)

                if (meta.value) {
                    meta.value.total += 1
                }

                return response.data
            }

            return null
        } catch (err: any) {
            handleError(err, `Failed to duplicate document ${id}`)
            return null
        } finally {
            setLoadingState('duplicating', { [id]: false })
        }
    }
    const confirmDocument = async (id: number): Promise<boolean> => {
        setLoadingState('confirming', { [id]: true })
        clearError()

        try {
            await api.post(`/documents/${id}/confirm`)

            const index = documents.value.findIndex((doc) => doc.id === id)
            if (index !== -1) {
                const confirmedStatus = { id: 2, code: 'confirmed', name: 'Confirmed' }
                documents.value[index].status = confirmedStatus

                if (currentDocument.value?.id === id) {
                    currentDocument.value.status = confirmedStatus
                }
            }

            return true
        } catch (err: any) {
            handleError(err, `Failed to confirm document ${id}`)
            return false
        } finally {
            setLoadingState('confirming', { [id]: false })
        }
    }

    const rejectDocument = async (id: number): Promise<boolean> => {
        setLoadingState('rejecting', { [id]: true })
        clearError()

        try {
            await api.post(`/documents/${id}/reject`)

            const index = documents.value.findIndex((doc) => doc.id === id)
            if (index !== -1) {
                const rejectedStatus = { id: 3, code: 'rejected', name: 'Rejected' }
                documents.value[index].status = rejectedStatus

                if (currentDocument.value?.id === id) {
                    currentDocument.value.status = rejectedStatus
                }
            }

            return true
        } catch (err: any) {
            handleError(err, `Failed to reject document ${id}`)
            return false
        } finally {
            setLoadingState('rejecting', { [id]: false })
        }
    }

    const generatePdf = async (
        id: number,
        disposition: 'inline' | 'attachment' = 'attachment'
    ): Promise<Blob | null> => {
        setLoadingState('generatingPdf', { [id]: true })
        clearError()

        try {
            const response = await api.get(`/documents/${id}/pdf`, {
                query: { disposition },
                responseType: 'blob',
            })

            return response as unknown as Blob
        } catch (err: any) {
            handleError(err, `Failed to generate PDF for document ${id}`)
            return null
        } finally {
            setLoadingState('generatingPdf', { [id]: false })
        }
    }

    const downloadPdf = async (id: number, filename?: string): Promise<boolean> => {
        const pdfBlob = await generatePdf(id, 'attachment')

        if (!pdfBlob) {
            return false
        }

        try {
            const url = URL.createObjectURL(pdfBlob)
            const link = document.createElement('a')
            link.href = url
            link.download = filename || `document-${id}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            return true
        } catch (err) {
            console.error('Failed to download PDF:', err)
            return false
        }
    }

    const previewPdfInNewTab = async (
        documentDataOrId: CreateDocumentRequest | number
    ): Promise<boolean> => {
        clearError()

        try {
            let pdfBlob: Blob | null = null

            if (typeof documentDataOrId === 'number') {
                pdfBlob = await generatePdf(documentDataOrId, 'inline')
            } else {
                pdfBlob = await createPreviewDocument(documentDataOrId)
            }

            if (!pdfBlob) {
                error.value = 'Failed to generate PDF'
                return false
            }

            const url = URL.createObjectURL(pdfBlob)
            const newTab = window.open(url, '_blank')

            if (!newTab) {
                console.error('Failed to open new tab. Popup blocker might be active.')
                error.value = 'Failed to open PDF. Please allow popups for this site.'
                URL.revokeObjectURL(url)
                return false
            }

            setTimeout(() => {
                URL.revokeObjectURL(url)
            }, 60000)

            return true
        } catch (err: any) {
            console.error('Failed to preview PDF in new tab:', err)
            error.value = err?.message || 'Failed to preview PDF'
            return false
        }
    }

    const fetchConnectedClients = async (forceRefresh = false) => {
        if (loadingClients.value) return

        if (!forceRefresh && connectedClients.value.length > 0 && !isClientsExpired.value) {
            return
        }

        loadingClients.value = true
        clientsError.value = null

        try {
            const response = await api.get<ConnectedClientResponse[]>(
                '/documents/connected-clients'
            )

            if (response) {
                connectedClients.value = transformConnectedClients(response)
                clientsLastFetchedAt.value = Date.now()
            }
        } catch (err: any) {
            console.error('[Documents Store] Failed to fetch connected clients:', err)
            clientsError.value =
                err?.data?.message || err?.statusMessage || 'Failed to fetch connected clients'
            handleError(err, 'Failed to fetch connected clients')
        } finally {
            loadingClients.value = false
        }
    }

    const clearConnectedClients = () => {
        connectedClients.value = []
        clientsError.value = null
        clientsLastFetchedAt.value = null
    }

    const clearClientsError = () => {
        clientsError.value = null
    }

    const fetchUserProducts = async (forceRefresh = false) => {
        if (loadingProducts.value) return

        if (!forceRefresh && userProducts.value.length > 0 && !isProductsExpired.value) {
            return
        }

        loadingProducts.value = true
        productsError.value = null

        try {
            const response = await api.get<UserProduct[]>('/documents/products')

            if (response) {
                userProducts.value = Array.isArray(response) ? response : []
                productsLastFetchedAt.value = Date.now()
            }
        } catch (err: any) {
            console.error('[Documents Store] Failed to fetch user products:', err)
            productsError.value =
                err?.data?.message || err?.statusMessage || 'Failed to fetch user products'
        } finally {
            loadingProducts.value = false
        }
    }

    const clearUserProducts = () => {
        userProducts.value = []
        productsError.value = null
        productsLastFetchedAt.value = null
    }

    const clearProductsError = () => {
        productsError.value = null
    }

    const createOrderFromCart = async (
        data: CreateOrderFromCartRequest
    ): Promise<Document | null> => {
        setLoadingState('creating', true)
        clearError()

        try {
            const response = await api.post<Document>('/documents/create-order-from-cart', data)

            if (response.data) {
                const newDocumentListItem: DocumentListItem = {
                    id: response.data.id,
                    type: response.data.type,
                    status: response.data.status,
                    payment_status: response.data.payment_status,
                    number: response.data.number,
                    title: response.data.title,
                    date: response.data.date,
                    currency: response.data.currency,
                    total: response.data.total,
                    buyer: response.data.buyer,
                    items_count: response.data.items?.length || 0,
                    created_at: response.data.created_at,
                    updated_at: response.data.updated_at,
                }

                documents.value.unshift(newDocumentListItem)

                if (meta.value) {
                    meta.value.total += 1
                }

                return response.data
            }

            return null
        } catch (err: any) {
            handleError(err, 'Failed to create order from cart')
            return null
        } finally {
            setLoadingState('creating', false)
        }
    }

    const goToPage = async (page: number) => {
        if (page < 1 || page > lastPage.value) return
        await fetchDocuments({ page })
    }

    const nextPage = async () => {
        if (hasNextPage.value) {
            await goToPage(currentPage.value + 1)
        }
    }

    const prevPage = async () => {
        if (hasPrevPage.value) {
            await goToPage(currentPage.value - 1)
        }
    }

    const filterByType = async (type: DocumentType | null) => {
        await fetchDocuments({ type, page: 1 })
    }

    const filterByStatus = async (statusId: number | null) => {
        await fetchDocuments({ status_id: statusId, page: 1 })
    }

    const filterByBuyer = async (buyerId: number | null) => {
        await fetchDocuments({ buyer_id: buyerId, page: 1 })
    }

    const searchDocuments = async (searchTerm: string) => {
        await fetchDocuments({ search: searchTerm, page: 1 })
    }

    const sortBy = async (
        sortBy: DocumentFilters['sort_by'],
        sortOrder?: DocumentFilters['sort_order']
    ) => {
        await fetchDocuments({
            sort_by: sortBy,
            sort_order: sortOrder || 'desc',
            page: 1,
        })
    }

    const refresh = async () => {
        lastFetchSignature.value = ''
        await fetchDocuments()
    }

    const clearCurrentDocument = () => {
        currentDocument.value = null
    }

    return {
        documents,
        currentDocument,
        meta,
        filters,
        loadingStates,
        error,
        connectedClients,
        loadingClients,
        clientsError,
        clientsLastFetchedAt,
        userProducts,
        loadingProducts,
        productsError,
        productsLastFetchedAt,

        isLoading,
        hasDocuments,
        totalDocuments,
        currentPage,
        lastPage,
        hasNextPage,
        hasPrevPage,
        documentsByType,
        getDocumentById,
        isDocumentLoading,
        getConnectedClients,
        getConnectedClientById,
        connectedClientOptions,
        getDeliveryLocationsByClientId,
        getDeliveryLocationOptions,
        isClientsExpired,
        getUserProducts,
        getProductById,
        productOptions,
        isProductsExpired,

        fetchDocuments,
        fetchDocument,
        createDocument,
        updateDocument,
        deleteDocument,
        duplicateDocument,
        confirmDocument,
        rejectDocument,
        createPreviewDocument,
        generatePdf,
        downloadPdf,
        previewPdfInNewTab,
        fetchConnectedClients,
        clearConnectedClients,
        clearClientsError,
        fetchUserProducts,
        clearUserProducts,
        clearProductsError,
        createOrderFromCart,

        goToPage,
        nextPage,
        prevPage,

        filterByType,
        filterByStatus,
        filterByBuyer,
        searchDocuments,
        sortBy,
        updateFilters,
        resetFilters,

        refresh,
        clearCurrentDocument,
        clearError,
    }
})

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useDocumentsStore, import.meta.hot))
}
