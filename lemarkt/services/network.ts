import type {
    NetworkConnection,
    NetworkFollower,
    NetworkInvitation,
    NetworkListResponse,
    NetworkStatsResponse,
    NetworkFilterOptions,
    InvitationFilterOptions,
    ConnectionType,
    FollowerType,
    NetworkFilters,
    InvitationFilters,
    NetworkStatsFilters,
} from '~/types/network'
import { TokenService } from './token'
import { handleApiError } from '~/utils/errors'

export class NetworkService {
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

    async fetchConnections(
        type: ConnectionType,
        filters: NetworkFilters = {}
    ): Promise<NetworkListResponse<NetworkConnection>> {
        const queryParams = new URLSearchParams()
        queryParams.append('type', type)

        if (filters.search?.trim()) queryParams.append('search', filters.search.trim())
        if (filters.start_date) queryParams.append('start_date', filters.start_date)
        if (filters.end_date) queryParams.append('end_date', filters.end_date)

        if (filters.business_type_ids?.length) {
            filters.business_type_ids.forEach((id) =>
                queryParams.append('business_type_ids[]', id.toString())
            )
        }

        if (filters.country_ids?.length) {
            filters.country_ids.forEach((id) => queryParams.append('country_ids[]', id.toString()))
        }

        if (filters.spoken_language_ids?.length) {
            filters.spoken_language_ids.forEach((id) =>
                queryParams.append('spoken_language_ids[]', id.toString())
            )
        }

        if (filters.page) queryParams.append('page', filters.page.toString())
        if (filters.per_page) queryParams.append('per_page', filters.per_page.toString())
        if (filters.sort_by) queryParams.append('sort_by', filters.sort_by)
        if (filters.sort_direction) queryParams.append('sort_direction', filters.sort_direction)

        const endpoint = `/backoffice/network/connections?${queryParams.toString()}`
        return await this.apiFetch<NetworkListResponse<NetworkConnection>>(endpoint, {
            method: 'GET',
        })
    }

    async fetchConnectionFilters(): Promise<NetworkFilterOptions> {
        const response = await this.apiFetch<{ data: NetworkFilterOptions }>(
            '/backoffice/network/connection-filters',
            { method: 'GET' }
        )
        return response.data || response
    }

    async fetchFollowers(
        type: FollowerType,
        filters: NetworkFilters = {}
    ): Promise<NetworkListResponse<NetworkFollower>> {
        const queryParams = new URLSearchParams()
        queryParams.append('type', type)

        if (filters.search?.trim()) queryParams.append('search', filters.search.trim())
        if (filters.start_date) queryParams.append('start_date', filters.start_date)
        if (filters.end_date) queryParams.append('end_date', filters.end_date)

        if (filters.business_type_ids?.length) {
            filters.business_type_ids.forEach((id) =>
                queryParams.append('business_type_ids[]', id.toString())
            )
        }

        if (filters.country_ids?.length) {
            filters.country_ids.forEach((id) => queryParams.append('country_ids[]', id.toString()))
        }

        if (filters.spoken_language_ids?.length) {
            filters.spoken_language_ids.forEach((id) =>
                queryParams.append('spoken_language_ids[]', id.toString())
            )
        }

        if (filters.page) queryParams.append('page', filters.page.toString())
        if (filters.per_page) queryParams.append('per_page', filters.per_page.toString())
        if (filters.sort_by) queryParams.append('sort_by', filters.sort_by)
        if (filters.sort_direction) queryParams.append('sort_direction', filters.sort_direction)

        const endpoint = `/backoffice/network/followers?${queryParams.toString()}`
        return await this.apiFetch<NetworkListResponse<NetworkFollower>>(endpoint, {
            method: 'GET',
        })
    }

    async fetchFollowerFilters(): Promise<NetworkFilterOptions> {
        const response = await this.apiFetch<{ data: NetworkFilterOptions }>(
            '/backoffice/network/follower-filters',
            { method: 'GET' }
        )
        return response.data || response
    }

    async fetchInvitations(
        filters: InvitationFilters = {}
    ): Promise<NetworkListResponse<NetworkInvitation>> {
        const queryParams = new URLSearchParams()

        if (filters.search?.trim()) queryParams.append('search', filters.search.trim())

        // Handle status as array using statuses[] parameter as per API documentation
        if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
            filters.status.forEach((status) => {
                queryParams.append('statuses[]', status)
            })
        }

        if (filters.start_date) queryParams.append('period_from', filters.start_date)
        if (filters.end_date) queryParams.append('period_to', filters.end_date)
        if (filters.page) queryParams.append('page', filters.page.toString())
        if (filters.per_page) queryParams.append('per_page', filters.per_page.toString())
        if (filters.sort_by) queryParams.append('sort_by', filters.sort_by)
        if (filters.sort_direction) queryParams.append('sort_order', filters.sort_direction)

        const endpoint = `/backoffice/network/invitations?${queryParams.toString()}`
        return await this.apiFetch<NetworkListResponse<NetworkInvitation>>(endpoint, {
            method: 'GET',
        })
    }

    async fetchInvitationFilters(): Promise<InvitationFilterOptions> {
        const response = await this.apiFetch<{ data: InvitationFilterOptions }>(
            '/backoffice/network/invitations/filters',
            { method: 'GET' }
        )
        return response.data || response
    }

    async fetchTotalConnections(filters: NetworkStatsFilters = {}): Promise<NetworkStatsResponse> {
        const queryParams = new URLSearchParams()

        if (filters.period) queryParams.append('period', filters.period)
        if (filters.start_date) queryParams.append('start_date', filters.start_date)
        if (filters.end_date) queryParams.append('end_date', filters.end_date)

        const endpoint = `/backoffice/network/total-connections?${queryParams.toString()}`
        return await this.apiFetch<NetworkStatsResponse>(endpoint, {
            method: 'GET',
        })
    }

    async fetchTotalFollowers(filters: NetworkStatsFilters = {}): Promise<NetworkStatsResponse> {
        const queryParams = new URLSearchParams()

        if (filters.period) queryParams.append('period', filters.period)
        if (filters.start_date) queryParams.append('start_date', filters.start_date)
        if (filters.end_date) queryParams.append('end_date', filters.end_date)

        const endpoint = `/backoffice/network/total-followers?${queryParams.toString()}`
        return await this.apiFetch<NetworkStatsResponse>(endpoint, {
            method: 'GET',
        })
    }

    async fetchTotalDisconnections(
        filters: NetworkStatsFilters = {}
    ): Promise<NetworkStatsResponse> {
        const queryParams = new URLSearchParams()

        if (filters.period) queryParams.append('period', filters.period)
        if (filters.start_date) queryParams.append('start_date', filters.start_date)
        if (filters.end_date) queryParams.append('end_date', filters.end_date)

        const endpoint = `/backoffice/network/total-disconnections?${queryParams.toString()}`
        return await this.apiFetch<NetworkStatsResponse>(endpoint, {
            method: 'GET',
        })
    }

    async fetchTotalUnfollowers(filters: NetworkStatsFilters = {}): Promise<NetworkStatsResponse> {
        const queryParams = new URLSearchParams()

        if (filters.period) queryParams.append('period', filters.period)
        if (filters.start_date) queryParams.append('start_date', filters.start_date)
        if (filters.end_date) queryParams.append('end_date', filters.end_date)

        const endpoint = `/backoffice/network/total-unfollowers?${queryParams.toString()}`
        return await this.apiFetch<NetworkStatsResponse>(endpoint, {
            method: 'GET',
        })
    }
}
