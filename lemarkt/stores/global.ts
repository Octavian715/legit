import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { StaticData } from '~/types/staticData'
import type { CatalogNode, CatalogMenuCache } from '~/types/catalog'

export const useGlobalStore = defineStore(
    'global',
    () => {
        const isLoading = ref(false)
        const isCollapseSideBar = useCookie('sidebar-collapsed', {
            default: () => true,
            sameSite: 'lax',
        })

        const staticData = ref<StaticData | null>(null)
        const staticDataFetchedAt = ref<string | null>(null)
        const isStaticDataLoading = ref(false)
        const staticDataError = ref<string | null>(null)

        const catalogMenu = ref<any | null>(null)
        const catalogMenuFetchedAt = ref<Date | null>(null)
        const isCatalogMenuLoading = ref(false)
        const catalogMenuError = ref<string | null>(null)
        const currentCatalogRootId = ref<number | null>(null)
        const catalogMenuCache = ref<CatalogMenuCache>({})

        const getContinents = computed(() => staticData.value?.continents || [])
        const getCountries = computed(() => staticData.value?.countries || [])
        const getBusinessTypes = computed(() => staticData.value?.business_types || [])
        const getCurrencies = computed(() => staticData.value?.currencies || [])
        const getLanguages = computed(() => staticData.value?.languages || [])
        const getContactPositions = computed(() => staticData.value?.contact_positions || [])
        const getEmployeeRanges = computed(() => staticData.value?.employee_ranges || [])
        const getRevenueRanges = computed(() => staticData.value?.revenue_ranges || [])
        const getExportPercentages = computed(() => staticData.value?.export_percentages || [])
        const getFactorySizes = computed(() => staticData.value?.factory_sizes || [])
        const getUserPlans = computed(() => staticData.value?.user_plans || [])
        const getUserRoles = computed(() => staticData.value?.user_roles || [])
        const getCategories = computed(() => staticData.value?.categories || [])
        const getDocumentStatuses = computed(() => staticData.value?.document_statuses || [])
        const getDocumentPaymentStatuses = computed(
            () => staticData.value?.document_payment_statuses || []
        )

        const getCatalogMenu = computed(() => {
            if (!catalogMenu.value) return null

            if (catalogMenu.value.data && catalogMenu.value.data.data) {
                return catalogMenu.value.data.data
            } else if (catalogMenu.value.data) {
                return catalogMenu.value.data
            }

            return catalogMenu.value
        })

        const getCatalogMenuFlat = computed(() => {
            const flattenNodes = (nodes: CatalogNode[] | CatalogNode): CatalogNode[] => {
                const result: CatalogNode[] = []
                const nodesToProcess = Array.isArray(nodes) ? nodes : [nodes]

                const processNode = (node: CatalogNode) => {
                    result.push(node)
                    if (node.children && node.children.length > 0) {
                        node.children.forEach(processNode)
                    }
                }

                nodesToProcess.forEach(processNode)
                return result
            }

            const menu = getCatalogMenu.value
            if (!menu) return []

            if (Array.isArray(menu)) {
                return flattenNodes(menu)
            } else if (menu.children) {
                return flattenNodes(menu.children)
            }

            return flattenNodes(menu)
        })

        const getCatalogNodeById = computed(() => (id: number): CatalogNode | undefined => {
            return getCatalogMenuFlat.value.find((node) => node.id === id)
        })

        const getCatalogNodeBySlug = computed(() => (slug: string): CatalogNode | undefined => {
            return getCatalogMenuFlat.value.find((node) => node.slug === slug)
        })

        const getCatalogRootNodes = computed(() => {
            const menu = getCatalogMenu.value
            if (!menu) return []

            if (Array.isArray(menu)) {
                return menu.filter((node) => node.parent_id === null)
            }
            return menu.parent_id === null ? [menu] : []
        })

        const isCatalogMenuLoaded = computed(() => catalogMenu.value !== null)

        const getCountryByCode = computed(
            () => (code: string) => getCountries.value.find((country) => country.code === code)
        )

        const getCountryByPhoneCode = computed(
            () => (phoneCode: string) =>
                getCountries.value.find((country) => country.phone_code === phoneCode)
        )

        const getStatesByCountryId = computed(() => (countryId: number) => {
            const country = getCountries.value.find((c) => c.id === countryId)
            return country?.states || []
        })

        const getActivePlans = computed(() => getUserPlans.value.filter((plan) => plan.is_active))

        const getCurrencyByCode = computed(
            () => (code: string) => getCurrencies.value.find((currency) => currency.code === code)
        )

        const getLanguageByCode = computed(
            () => (code: string) => getLanguages.value.find((language) => language.code === code)
        )

        const getBusinessTypeByCode = computed(
            () => (code: string) => getBusinessTypes.value.find((type) => type.code === code)
        )

        const getUserRoleByCode = computed(
            () => (code: string) => getUserRoles.value.find((role) => role.code === code)
        )

        const getDocumentStatusByCode = computed(
            () => (code: string) => getDocumentStatuses.value.find((status) => status.code === code)
        )

        const getDocumentPaymentStatusByCode = computed(
            () => (code: string) =>
                getDocumentPaymentStatuses.value.find((status) => status.code === code)
        )

        const toggleSideBar = () => {
            isCollapseSideBar.value = !isCollapseSideBar.value
        }

        const setLoading = (status: boolean) => {
            isLoading.value = status
        }

        const isDataExpired = (fetchedAtStr: string | Date | null, hours: number = 1): boolean => {
            if (!fetchedAtStr) return true

            const fetchedAt =
                typeof fetchedAtStr === 'string' ? new Date(fetchedAtStr) : fetchedAtStr
            if (isNaN(fetchedAt.getTime())) return true

            const now = new Date()
            const expirationTime = new Date(fetchedAt)
            expirationTime.setHours(expirationTime.getHours() + hours)

            return now > expirationTime
        }

        const isStaticDataExpired = () => isDataExpired(staticDataFetchedAt.value, 1)
        const isCatalogMenuExpired = () => isDataExpired(catalogMenuFetchedAt.value, 2)

        const setStaticData = (data: StaticData) => {
            staticData.value = data || {}
        }

        const fetchStaticData = async (forceRefresh = false) => {
            if (isStaticDataLoading.value) return

            if (!forceRefresh && staticData.value && !isStaticDataExpired()) {
                return
            }

            isStaticDataLoading.value = true
            staticDataError.value = null

            try {
                const api = useApi()
                const response = await api.get('/general/static-data')
                const fetchedAt = new Date()

                staticData.value = response || {}
                staticDataFetchedAt.value = fetchedAt.toISOString()
                staticDataError.value = null
            } catch (error: any) {
                console.error('Error fetching static data:', error)
                staticDataError.value = error.message || 'Failed to load application data'
            } finally {
                isStaticDataLoading.value = false
            }
        }

        const getStorage = () => {
            if (import.meta.client && typeof window !== 'undefined' && window.localStorage) {
                return window.localStorage
            }
            return null
        }

        const loadCatalogMenuFromStorage = (rootId?: number) => {
            const storage = getStorage()
            if (!storage) return false

            try {
                const cacheKey = rootId ? `catalog_${rootId}` : 'catalog_full'
                const storedCache = storage.getItem('catalogMenuCache')

                if (storedCache) {
                    const cache: CatalogMenuCache = JSON.parse(storedCache)
                    const cachedData = cache[cacheKey]

                    if (cachedData && cachedData.data && cachedData.fetchedAt) {
                        const parsedDate = new Date(cachedData.fetchedAt)

                        if (!isNaN(parsedDate.getTime())) {
                            catalogMenu.value = cachedData.data
                            catalogMenuFetchedAt.value = parsedDate
                            currentCatalogRootId.value = rootId || null
                            catalogMenuCache.value = cache
                            return true
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading catalog menu from localStorage:', error)
                try {
                    storage.removeItem('catalogMenuCache')
                } catch {}
            }
            return false
        }

        const saveCatalogMenuToStorage = (data: any, timestamp: Date, rootId?: number) => {
            const storage = getStorage()
            if (!storage) return

            try {
                const cacheKey = rootId ? `catalog_${rootId}` : 'catalog_full'
                const cache = { ...catalogMenuCache.value }

                cache[cacheKey] = {
                    data,
                    fetchedAt: timestamp.toISOString(),
                }

                const cacheKeys = Object.keys(cache)
                if (cacheKeys.length > 10) {
                    const oldestKey = cacheKeys.reduce((oldest, key) => {
                        const oldestDate = new Date(cache[oldest].fetchedAt)
                        const currentDate = new Date(cache[key].fetchedAt)
                        return currentDate < oldestDate ? key : oldest
                    })
                    delete cache[oldestKey]
                }

                catalogMenuCache.value = cache

                const cacheStr = JSON.stringify(cache)
                if (cacheStr.length > 5 * 1024 * 1024) {
                    const newCache = { [cacheKey]: cache[cacheKey] }
                    catalogMenuCache.value = newCache
                    storage.setItem('catalogMenuCache', JSON.stringify(newCache))
                } else {
                    storage.setItem('catalogMenuCache', cacheStr)
                }
            } catch (error) {
                console.error('Error saving catalog menu to localStorage:', error)
                try {
                    const cacheKey = rootId ? `catalog_${rootId}` : 'catalog_full'
                    const minCache = {
                        [cacheKey]: {
                            data,
                            fetchedAt: timestamp.toISOString(),
                        },
                    }
                    catalogMenuCache.value = minCache
                    storage.setItem('catalogMenuCache', JSON.stringify(minCache))
                } catch (retryError) {
                    console.error('Failed to save catalog menu even after clearing:', retryError)
                }
            }
        }

        const fetchCatalogMenu = async (rootId?: number, forceRefresh = false) => {
            const rootIdChanged = currentCatalogRootId.value !== (rootId ?? null)

            if (!forceRefresh && !rootIdChanged && catalogMenu.value && !isCatalogMenuExpired()) {
                return
            }

            if (!forceRefresh && import.meta.client) {
                const loadedFromStorage = loadCatalogMenuFromStorage(rootId)
                if (loadedFromStorage && !isCatalogMenuExpired()) {
                    return
                }
            }

            isCatalogMenuLoading.value = true
            catalogMenuError.value = null

            try {
                const api = useApi()
                const params = rootId ? { query: { root_id: rootId } } : {}
                const response = await api.get('/catalog/menu', params)
                const fetchedAt = new Date()

                if (response) {
                    catalogMenu.value = response
                    catalogMenuFetchedAt.value = fetchedAt
                    currentCatalogRootId.value = rootId ?? null

                    if (import.meta.client) {
                        saveCatalogMenuToStorage(response, fetchedAt, rootId)
                    }
                }
            } catch (error: any) {
                console.error('Error fetching catalog menu:', error)

                if (error.statusCode === 422) {
                    catalogMenuError.value = 'Invalid category ID provided'
                } else {
                    catalogMenuError.value = error.message || 'Failed to load catalog menu'
                }

                if (import.meta.client && !catalogMenu.value) {
                    loadCatalogMenuFromStorage(rootId)
                }
            } finally {
                isCatalogMenuLoading.value = false
            }
        }

        const clearStaticData = () => {
            staticData.value = null
            staticDataFetchedAt.value = null
            staticDataError.value = null
        }

        const clearCatalogMenu = () => {
            catalogMenu.value = null
            catalogMenuFetchedAt.value = null
            catalogMenuError.value = null
            currentCatalogRootId.value = null
            catalogMenuCache.value = {}

            const storage = getStorage()
            if (storage) {
                try {
                    storage.removeItem('catalogMenuCache')
                } catch (error) {
                    console.error('Error clearing catalog menu from localStorage:', error)
                }
            }
        }

        const clearAllCache = () => {
            clearStaticData()
            clearCatalogMenu()
        }

        const isStaticDataLoaded = computed(() => staticData.value !== null)

        const initializeFromStorage = () => {
            if (import.meta.client) {
                loadCatalogMenuFromStorage()
            }
        }

        return {
            isLoading,
            isCollapseSideBar,

            staticData,
            staticDataFetchedAt,
            isStaticDataLoading,
            staticDataError,
            isStaticDataLoaded,

            catalogMenu,
            catalogMenuFetchedAt,
            isCatalogMenuLoading,
            catalogMenuError,
            currentCatalogRootId,
            isCatalogMenuLoaded,

            getContinents,
            getCountries,
            getBusinessTypes,
            getCurrencies,
            getLanguages,
            getContactPositions,
            getEmployeeRanges,
            getRevenueRanges,
            getExportPercentages,
            getFactorySizes,
            getUserPlans,
            getUserRoles,
            getCategories,
            getDocumentStatuses,
            getDocumentPaymentStatuses,

            getCatalogMenu,
            getCatalogMenuFlat,
            getCatalogNodeById,
            getCatalogNodeBySlug,
            getCatalogRootNodes,

            getCountryByCode,
            getCountryByPhoneCode,
            getStatesByCountryId,
            getActivePlans,
            getCurrencyByCode,
            getLanguageByCode,
            getBusinessTypeByCode,
            getUserRoleByCode,
            getDocumentStatusByCode,
            getDocumentPaymentStatusByCode,

            toggleSideBar,
            setLoading,

            fetchStaticData,
            clearStaticData,
            isStaticDataExpired,
            setStaticData,

            fetchCatalogMenu,
            clearCatalogMenu,
            isCatalogMenuExpired,
            loadCatalogMenuFromStorage,

            clearAllCache,
            initializeFromStorage,
        }
    },
    {
        persist: {
            key: 'global-store',
            pick: ['staticData', 'staticDataFetchedAt', 'staticDataError', 'isCollapseSideBar'],
            storage: piniaPluginPersistedstate.localStorage(),
        },
    }
)

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useGlobalStore, import.meta.hot))
}
