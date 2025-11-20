export interface ProfileSocialData {
    is_following: boolean
    followers_count: number
    connections_count?: number
    connection: {
        exists: boolean
        status: 'pending' | 'accepted' | 'rejected' | null
        id?: number
    }
}
export interface ApiProfileUser {
    id: number
    email: string
    verification_status: string
    is_registration_complete: boolean

    company_details?: {
        legal_name?: string
        username?: string
        description?: string
        website_url?: string
        registration_number?: string
        vat_number?: string
        registration_year?: number
        business_type?: { code: string }
        street_name?: string
        street_number?: string
        city_name?: string
        postal_code?: string
        country?: { code: string }
        state_name?: string
        employee_count_range?: { code: string }
        revenue_range?: { code: string }
        min_order?: {
            amount: string
            currency?: { code: string }
        }
    }
    contacts?: Array<{
        name: string
        email: string
        position?: { code: string }
        custom_position?: string
        phones?: Array<{ phone_number: string }>
        fax_number?: string
    }>
    profile_media?: Array<{
        id: number
        type: 'picture' | 'banner' | 'gallery'
        file_path: string
        file_name: string
        file_size: number
        url: string
    }>
    export_details?: {
        export_since_year?: number
        export_percentage?: { code: string }
    }
    export_countries?: Array<{ code: string }>
    export_ports?: string[]
    spoken_languages?: Array<{ native_name: string }>
    interesting_categories?: Array<{ slug: string }>
    factory_details?: Array<{
        name: string
        size?: { code: string }
        city_name: string
        country?: { code: string }
    }>
    social?: ProfileSocialData

    bank_accounts?: Array<{
        bank_name: string
        account_holder_name: string
        iban: string
        currency?: { code: string }
        city_name: string
        country?: { code: string }
    }>
}

// Transformed interface for easier use in components
export interface ProfileUser {
    // Basic info
    id: number
    email: string
    display_name: string
    company_name: string
    legal_name: string
    username: string
    certificates?: Certificate[]
    social?: ProfileSocialData

    // Profile status
    is_verified: boolean
    is_registration_complete: boolean

    // Company details
    business_description: string
    website_url: string
    registration_number: string
    vat_number: string
    registration_year: number
    business_type: string

    // Contact info
    primary_contact?: {
        name: string
        email: string
        position: string
        custom_position?: string
        phones: string[]
        fax?: string
    }

    // Location
    address: {
        street: string
        city: string
        postal_code: string
        country_code: string
        state?: string
    }

    // Business metrics
    employee_count_range: string
    revenue_range: string
    min_order_amount: string
    min_order_currency: string

    // Export info
    export_experience: boolean
    export_since_year?: number
    export_percentage?: string
    export_countries: string[]
    export_ports: string[]

    // Languages & categories
    spoken_languages: string[]
    interesting_categories: string[]

    // Factory info
    factories: Array<{
        name: string
        size: string
        location: string
    }>

    // Bank info
    bank_accounts: Array<{
        bank_name: string
        account_holder: string
        iban: string
        currency: string
        location: string
    }>

    // Stats (these would come from other endpoints or be calculated)
    followers_count?: number
    connections_count?: number
    products_count?: number
    rating?: number
    rating_count?: number

    // Media
    avatar_url?: string
    cover_image_url?: string
    gallery_images?: ProfileImage[]

    // Additional data for profile display
    achievements?: Achievement[]
    product_categories?: ProductCategory[]
    certificates?: Certificate[]
}

export interface ProfileImage {
    id: number
    url: string
    thumbnail_url?: string
    alt_text?: string
    type: 'gallery' | 'product' | 'certificate' | 'facility'
}

export interface Achievement {
    id: number
    type:
        | 'orders_completed'
        | 'referrals_sent'
        | 'connections_made'
        | 'products_listed'
        | 'years_active'
        | 'certifications'
    title: string
    value: number | string
    icon: string
    description?: string
}

export interface ProductCategory {
    id: number
    name: string
    slug: string
    image_url: string
    product_count: number
    is_featured?: boolean
}

export interface Certificate {
    id: number
    name: string
    issuer: string
    issue_date?: string
    expiry_date?: string
    certificate_number?: string
    file_url?: string
    type: 'quality' | 'safety' | 'environmental' | 'business' | 'other'
}

export interface ProfileContactInfo {
    label: string
    value: string | string[]
    type?: 'text' | 'phone' | 'email' | 'website' | 'revenue'
    icon?: string
}

export interface ProfileTabItem {
    key: string
    label: string
    count?: number
    active?: boolean
}

// API Response types
export interface ProfileApiResponse {
    data: ProfileUser
    meta?: {
        last_updated: string
        view_count?: number
        profile_completion?: number
    }
}

export interface ProfileStatsResponse {
    followers_count: number
    connections_count: number
    products_count: number
    rating: number
    rating_count: number
    view_count: number
}

// Component Props
export interface ProfileHeaderProps {
    user: ProfileUser
    loading?: boolean
}

export interface ProfileTabsProps {
    tabs: ProfileTabItem[]
    activeTab: string
    onTabChange: (tab: string) => void
}

export interface ProfileDescriptionProps {
    description: string
    images: ProfileImage[]
    hasVideo?: boolean
    videoThumbnail?: string
    stats: {
        revenue?: string
        employees?: string
        founded?: string
        location?: string
    }
}

export interface ProfileAwardsProps {
    achievements: Achievement[]
}

export interface ProfileInfoProps {
    title: string
    items: ProfileContactInfo[]
}

export interface ProfileContactsProps {
    contact: ProfileUser['primary_contact']
    additionalInfo: ProfileContactInfo[]
}

export interface ProfileProductsProps {
    categories: ProductCategory[]
    totalProducts: number
}

// Form types removed - using existing ConnectionRequest and ChatInitiation from network/chat types

export type ProfileSection = 'overview' | 'products' | 'certificates' | 'news' | 'reviews'

export interface ProfileViewState {
    currentSection: ProfileSection
    isLoading: boolean
    error: string | null
    user: ProfileUser | null
}
