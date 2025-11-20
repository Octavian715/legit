import type { Country, BusinessType, SpokenLanguage, Contact } from './auth'

export interface NetworkUser {
    id: number
    email: string
    name: string
    registration_year: number | null
    country: Country | null
    business_type: BusinessType | null
    annual_revenue: {
        id: number
        name: string
    } | null
    spoken_languages: SpokenLanguage[]
    contacts: Contact[]
    mutual_connections: number
}

export interface NetworkConnection {
    id: number
    requested_at: string | null
    accepted_at: string | null
    rejected_at: string | null
    status: 'pending' | 'accepted' | 'rejected' | 'declined'
    user: NetworkUser
}

export interface NetworkFollower {
    id: number
    created_at: string
    user: NetworkUser
}

export interface NetworkInvitation {
    id: number
    email: string
    sent_at: string
    expires_at: string
    status: 'pending' | 'accepted' | 'expired' | 'cancelled'
    channel: string
    referred_role: string
    company_name?: string
    phone_number?: string
}

export interface NetworkMeta {
    current_page: number
    per_page: number
    total: number
    last_page: number
    type: string
    from: number
    to: number
    filters_applied?: {
        search: string | null
        date_range:
            | 'all_time'
            | {
                  start_date: string
                  end_date: string
              }
        business_type_id: number | null
        country_id: number | null
        spoken_language_ids: number[]
        sort: {
            sort_by: string
            sort_direction: string
        }
    }
}

export interface NetworkListResponse<T> {
    data: T[]
    meta: NetworkMeta
}

export interface ChartDataPoint {
    date: string
    count: number
}

export interface NetworkStatsResponse {
    total: number
    period: string
    date_range: {
        start_date: string
        end_date: string
    }
    chart_data: ChartDataPoint[]
}

export interface InvitationFilterOption {
    value: string
    label: string
}

export interface InvitationFilterOptions {
    statuses: InvitationFilterOption[]
    channels: InvitationFilterOption[]
    referred_roles: InvitationFilterOption[]
}

export interface NetworkFilterOptions {
    business_types: BusinessType[]
    countries: Country[]
    spoken_languages: SpokenLanguage[]
}

export type ConnectionType = 'requests' | 'accepted' | 'my-requests' | 'declined'
export type FollowerType = 'followed' | 'followers'
export type InvitationType = 'all' | 'pending' | 'accepted' | 'expired'
export type ConnectionSortField =
    | 'name'
    | 'country'
    | 'business_type'
    | 'registration_year'
    | 'annual_revenue'
    | 'mutual_connections'
    | 'created_at'
    | 'phone'
    | 'email'
export type InvitationSortField =
    | 'company_name'
    | 'email'
    | 'phone_number'
    | 'sent_at'
    | 'expires_at'
    | 'status'
export type SortDirection = 'asc' | 'desc'
export type StatsPeriod = 'today' | 'last_month' | 'last_year'

export interface NetworkFilters {
    search?: string
    start_date?: string
    end_date?: string
    business_type_ids?: number[]
    country_ids?: number[]
    spoken_language_ids?: number[]
    min_mutual_connections?: number
    max_mutual_connections?: number
    annual_revenue_id?: number
    min_registration_year?: number
    max_registration_year?: number
    page?: number
    per_page?: number
    sort_by?: ConnectionSortField | InvitationSortField
    sort_direction?: SortDirection
}

export interface InvitationFilters {
    search?: string
    status?: string[]
    start_date?: string
    end_date?: string
    page?: number
    per_page?: number
    sort_by?: InvitationSortField
    sort_direction?: SortDirection
}

export interface ConnectionFilters {
    search?: string
    businessTypeIds?: number[]
    countryIds?: number[]
    spokenLanguageIds?: number[]
    dateRange?: {
        startDate: string
        endDate: string
    }
    minMutualConnections?: number
    maxMutualConnections?: number
    annualRevenueId?: number
    minRegistrationYear?: number
    maxRegistrationYear?: number
}

export interface NetworkStatsFilters {
    period?: StatsPeriod
    start_date?: string
    end_date?: string
}

export interface ApiError {
    message: string
    errors?: Record<string, string[]>
    statusCode?: number
}
