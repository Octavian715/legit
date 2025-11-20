export type ConnectionStatus = 'pending' | 'accepted' | 'rejected'
export type ConnectionAction = 'accept' | 'reject'

export interface ConnectionApiResponse {
    success: boolean
    status?: ConnectionStatus
    connection_id?: number
    message?: string
}

export interface FollowApiResponse {
    success: boolean
    message?: string
}

export interface ConnectionRequest {
    userId: number
    connectionId?: number
    status?: ConnectionStatus
}

// types/connections.ts
export interface ConnectionStatus {
    id: number | null
    exists: boolean
    status: 'pending' | 'accepted' | 'rejected' | null
}

export interface PhoneNumber {
    countryCode: string
    phoneNumber: string
}

export interface CompanyUser {
    id: number
    email: string
    companyDetails: {
        legalName: string
        username: string
        websiteUrl: string
        country?: {
            code: string
            name: string
        }
    }
    phoneNumbers: PhoneNumber[]
    social: {
        isFollowing: boolean
        connection: ConnectionStatus
        followersCount: number
        connectionsCount: number
        productsCount: number
    }
    picture: string | null
}

export interface ConnectionsFilters {
    page?: number
    perPage?: number
    search?: string
    companyName?: string
    email?: string
    username?: string
    sortBy?: 'company_name' | 'products_count' | 'followers_count' | 'connections_count'
    sortOrder?: 'asc' | 'desc'
}

export interface FollowersFilters extends ConnectionsFilters {
    type: 'followers' | 'following'
}

export interface PaginationMeta {
    currentPage: number
    lastPage: number
    perPage: number
    total: number
    from: number
    to: number
    appliedFilters: Record<string, any>
}

export interface ConnectionsResponse {
    data: CompanyUser[]
    meta: PaginationMeta
}
