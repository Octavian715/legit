import type {
    OrderTableListResponse,
    OrderTableFilters,
    OrderTableFilterOptions,
} from '~/types/orderTableDashboard'
import { ORDER_TABLE_TAB_CONFIGS } from '~/types/orderTableDashboard'
import { TokenService } from './token'
import { handleApiError } from '~/utils/errors'

export class OrderTableDashboardService {
    private readonly baseURL: string

    constructor() {
        const config = useRuntimeConfig()
        this.baseURL = config.public.apiBaseURL
    }

    private async apiFetch<T>(endpoint: string, options: any): Promise<T> {
        try {
            return await $fetch<T>(endpoint, {
                baseURL: this.baseURL,
                headers: TokenService.getRequestHeaders(),
                ...options,
            })
        } catch (error: any) {
            const appError = handleApiError(error)
            if (appError.code === 'AUTH_ERROR') {
                TokenService.clearAllTokens()
            }
            throw appError
        }
    }

    private buildQueryParams(filters: OrderTableFilters = {}, tabKey?: string): URLSearchParams {
        const queryParams = new URLSearchParams()

        if (filters.type) queryParams.append('type', filters.type)
        if (filters.search?.trim()) queryParams.append('search', filters.search.trim())

        // Handle tab-specific status filtering
        if (tabKey && tabKey !== 'all') {
            const tabConfig = ORDER_TABLE_TAB_CONFIGS.find((config) => config.key === tabKey)
            if (tabConfig?.statusCodes?.length) {
                tabConfig.statusCodes.forEach((statusCode) => {
                    queryParams.append('status_codes[]', statusCode)
                })
            }
            if (tabConfig?.paymentStatusCodes?.length) {
                tabConfig.paymentStatusCodes.forEach((paymentStatusCode) => {
                    queryParams.append('payment_status_codes[]', paymentStatusCode)
                })
            }
        }

        if (filters.status_ids?.length) {
            filters.status_ids.forEach((id) => {
                queryParams.append('status_ids[]', id.toString())
            })
        }

        if (filters.payment_status_ids?.length) {
            filters.payment_status_ids.forEach((id) => {
                queryParams.append('payment_status_ids[]', id.toString())
            })
        }

        if (filters.currency_ids?.length) {
            filters.currency_ids.forEach((id) => {
                queryParams.append('currency_ids[]', id.toString())
            })
        }

        if (filters.amount_min !== undefined) {
            queryParams.append('amount_min', filters.amount_min.toString())
        }
        if (filters.amount_max !== undefined) {
            queryParams.append('amount_max', filters.amount_max.toString())
        }

        if (filters.date_from) queryParams.append('date_from', filters.date_from)
        if (filters.date_to) queryParams.append('date_to', filters.date_to)

        if (filters.sort_by) queryParams.append('sort_by', filters.sort_by)
        if (filters.sort_order) queryParams.append('sort_order', filters.sort_order)

        if (filters.page) queryParams.append('page', filters.page.toString())
        if (filters.per_page) queryParams.append('per_page', filters.per_page.toString())

        return queryParams
    }

    async fetchSupplierOrders(
        filters: OrderTableFilters = {},
        tabKey?: string
    ): Promise<OrderTableListResponse> {
        const queryParams = this.buildQueryParams(filters, tabKey)
        const endpoint = `/backoffice/documents/supplier?${queryParams.toString()}`

        return await this.apiFetch<OrderTableListResponse>(endpoint, {
            method: 'GET',
        })
    }

    async fetchBuyerOrders(
        filters: OrderTableFilters = {},
        tabKey?: string
    ): Promise<OrderTableListResponse> {
        const queryParams = this.buildQueryParams(filters, tabKey)
        const endpoint = `/backoffice/documents/buyer?${queryParams.toString()}`

        return await this.apiFetch<OrderTableListResponse>(endpoint, {
            method: 'GET',
        })
    }

    async fetchSupplierFilters(): Promise<OrderTableFilterOptions> {
        const endpoint = '/backoffice/documents/filters/supplier'

        try {
            const response = await this.apiFetch<
                { data: OrderTableFilterOptions } | OrderTableFilterOptions
            >(endpoint, { method: 'GET' })

            // Handle both response formats: {data: {...}} and direct {...}
            let filterData: OrderTableFilterOptions

            if (response && typeof response === 'object' && 'data' in response) {
                filterData = (response as { data: OrderTableFilterOptions }).data
            } else {
                filterData = response as OrderTableFilterOptions
            }

            return filterData
        } catch (error) {
            console.error('[OrderTableDashboardService] Failed to fetch supplier filters:', error)
            throw error
        }
    }

    async fetchBuyerFilters(): Promise<OrderTableFilterOptions> {
        const endpoint = '/backoffice/documents/filters/buyer'

        try {
            const response = await this.apiFetch<
                { data: OrderTableFilterOptions } | OrderTableFilterOptions
            >(endpoint, { method: 'GET' })

            // Handle both response formats: {data: {...}} and direct {...}
            let filterData: OrderTableFilterOptions

            if (response && typeof response === 'object' && 'data' in response) {
                filterData = (response as { data: OrderTableFilterOptions }).data
            } else {
                filterData = response as OrderTableFilterOptions
            }

            return filterData
        } catch (error) {
            console.error('[OrderTableDashboardService] Failed to fetch buyer filters:', error)
            throw error
        }
    }
}
