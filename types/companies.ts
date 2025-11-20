// ~/types/companies.ts
import type { Connection, CompanyConnectionInfo } from './connections'

export interface CompanySearchResult {
    id: number
    legal_name: string
    username: string
    is_following: boolean
    followers_count?: number
    connection: CompanyConnectionInfo | false
    profile_picture?: {
        id: number
        url: string
        file_name: string
    }
}

export interface CompanySuggestion {
    id: number
    legal_name: string
    username: string
    is_following: boolean
    followers_count?: number
    connection: CompanyConnectionInfo | false
    profile_picture?: {
        id: number
        url: string
        file_name: string
    }
}

export interface CompanySearchMeta {
    current_page: number
    per_page: number
    total: number
    last_page: number
    from: number
    to: number
}

export interface CompanySearchFilters {
    query: string
    page?: number
    per_page?: number
}

export interface CompanySearchResponse {
    data: CompanySearchResult[]
    meta: CompanySearchMeta
}

// Extended result with computed connection status for UI
export interface CompanySearchResultWithStatus extends CompanySearchResult {
    connectionStatus: {
        type: 'connected' | 'pending_sent' | 'pending_received' | 'none'
        connection?: Connection
    }
    isFollowing: boolean
}
