// ~/types/auth.ts
export interface Country {
    id: number
    code: string
    name?: string
}

export interface State {
    id: number
    code: string
    name?: string
}

export interface Currency {
    id: number
    code: string
    name?: string
    symbol?: string
}

export interface BusinessType {
    id: number
    code: string
}

export interface EmployeeCountRange {
    id: number
    code: string
}

export interface RevenueRange {
    id: number
    code: string
}

export interface Position {
    id: number
    code: string
}

export interface SpokenLanguage {
    id: number
    native_name: string
}

export interface InterestingCategory {
    id: number
    slug: string
}

export interface Phone {
    id: number
    phone_number: string
    verified: boolean
    country: Country
}

export interface Contact {
    id: number
    name: string
    email: string
    position: Position
    custom_position?: string | null
    fax_country?: Country | null
    fax_number?: string | null
    phones: Phone[]
}

export interface BankAccount {
    id: number
    bank_name: string
    account_holder_name: string
    iban: string
    swift_code: string
    currency: Currency
    country: Country
    state: State
    city_name: string
    street_name: string
    street_number: string
    postal_code: string
}

export interface FactoryDetails {
    id: number
    name?: string
    location?: string
    capacity?: number
}

export interface ExportDetails {
    id?: number
    has_export_experience?: boolean
    export_years?: number
    annual_export_volume?: string
}

export interface ExportCountry {
    id: number
    country: Country
}

export interface ExportPort {
    id: number
    name: string
    country: Country
}

export interface MediaDocument {
    id: number
    type: string
    file_path: string
    file_name: string
    file_size: number
    certificate_number?: string | null
    issue_date?: string | null
    expiry_date?: string | null
}

export interface ProfileMedia {
    id: number
    type: string
    file_path: string
    file_name: string
    file_size: number
}

export interface UserRole {
    id: number
    code: UserRoleCode
    name: string
}

export interface PlanMap {
    id: number
    plan_code?: string
    name?: string
    price?: string
    billing_cycle?: string
    duration_months?: number
    is_active?: boolean
    features?: string[]
    role?: {
        id: number
        code: string
        name: string
    }
}

export interface CompanyDetails {
    id: number
    legal_name: string
    username: string
    registration_number: string
    vat_number: string
    registration_year: number
    website_url: string
    description: string
    street_name: string
    street_number: string
    postal_code: string
    business_type: BusinessType
    employee_count_range: EmployeeCountRange
    revenue_range: RevenueRange
    destination_type: string
    country: Country
    state: State
    city_name: string
}

/* ---------- SUBSCRIPTION & BILLING TYPES ---------------------------------- */

export interface PaymentMethod {
    id: string
    type: 'card' | 'paypal' | 'bank_transfer'
    brand?: string
    last_four: string
    expiry_month?: number
    expiry_year?: number
    is_default: boolean
    billing_email: string
    billing_address: BillingAddress
}

export interface BillingAddress {
    street: string
    city: string
    state?: string
    postal_code: string
    country: string
}

export interface Invoice {
    id: string
    invoice_number: string
    date: string
    subscription_name: string
    status: 'paid' | 'pending' | 'failed' | 'refunded'
    total_amount: number
    currency: string
    pdf_url?: string
}

export interface PlanFeature {
    title: string
    text: string
    included: boolean
    hint?: string | null
}

export interface PlanCard {
    id: number
    title: string
    currency: string
    monthlyPrice: number
    discountedPrice?: number
    highlighted: boolean
    label?: string | null
    features: PlanFeature[]
}

/* ---------- USER INTERFACE (EXACT API STRUCTURE) -------------------------- */

export interface User {
    id: number
    email: string
    verification_status?: 'rejected' | 'pending' | 'verified'
    register_step?: string | null
    register_substep?: string | number | null
    is_registration_complete: boolean
    company_details?: CompanyDetails
    spoken_languages: SpokenLanguage[]
    interesting_categories: InterestingCategory[]
    contacts: Contact[]
    delivery_locations?: DeliveryLocation[]
    bank_accounts: BankAccount[]
    factory_details: FactoryDetails[]
    export_details?: ExportDetails | null
    export_countries: ExportCountry[]
    export_ports: ExportPort[]
    media_documents: MediaDocument[]
    profile_media: ProfileMedia[]
    roles: UserRole[]
    default_currency_id?: number | null | undefined
    plan_maps: PlanMap[]
}

export interface ExtendedUser extends User {
    name?: string
    firstName?: string
    lastName?: string
    avatar?: string
    phone?: string
    emailVerifiedAt?: string
    phoneVerifiedAt?: string
    subscription?: {
        plan: PlanTier
    }
    updated_at?: string
    created_at?: string
    lastLoginAt?: string
    lastActivityAt?: string
    isActive?: boolean
    isOnline?: boolean
    default_currency_id?: number | null | undefined
}

/* ---------- STORE ERROR TYPES ---------------------------------------------- */

export interface UserStoreError {
    code: 'NETWORK_ERROR' | 'AUTH_ERROR' | 'VALIDATION_ERROR' | 'API_ERROR' | 'UNKNOWN_ERROR'
    message: string
    details?: any
    timestamp: number
}

/* ---------- AUTHENTICATION TYPES ------------------------------------------ */

export interface LoginResponse {
    user: User
    token: string
    refresh?: string
}

export interface LoginCredentials {
    email: string
    password: string
    rememberMe?: boolean
}

export interface RegisterCredentials {
    email: string
    password: string
    passwordConfirmation: string
    acceptTerms: boolean
    acceptPrivacy: boolean
}

export interface PasswordResetState {
    email: string | null
    token: string | null
    isResetInProgress: boolean
}

export interface DeviceInfo {
    userAgent?: string
    platform?: string
    deviceType?: 'desktop' | 'mobile' | 'tablet'
    ipAddress?: string
    location?: string
}

/* ---------- ENUMS & TYPES -------------------------------------------------- */

export type UserRoleCode = 'admin' | 'supplier' | 'buyer' | 'serviceProvider' | 'hybrid' | 'sale'
export type PlanTier =
    | 'free'
    | 'basic'
    | 'premium'
    | 'enterprise'
    | 'lite'
    | 'professional'
    | 'access'
export type AccountStatus = 'active' | 'inactive' | 'suspended' | 'pending' | 'banned'

export interface DeliveryLocation {
    id?: number
    postal_code: string
    country_id: number
    street_number: string
    street_name: string
    state_name: string | null
    phone_country_id: number
    contact_name: string
    is_default: boolean
    phone_number: string
    city_name: string
}

export interface DeliveryLocationFormData extends Omit<DeliveryLocation, 'id'> {
    id?: number
}

/* ---------- UTILITY FUNCTIONS ---------------------------------------------- */

export const hasRole = (
    user: User | ExtendedUser | null | undefined,
    roleCode: string
): boolean => {
    if (!user?.roles) return false
    return user.roles.some((role) => role.code === roleCode)
}

export const effectiveRoles = (user: User | ExtendedUser | null | undefined): UserRoleCode[] => {
    if (!user?.roles) return []
    return user.roles.map((role) => role.code)
}

export const getPrimaryRole = (
    user: User | ExtendedUser | null | undefined
): UserRoleCode | null => {
    if (!user?.roles || user.roles.length === 0) return null
    return user.roles[0].code
}

export const isHybridUser = (user: User | ExtendedUser | null | undefined): boolean => {
    if (!user?.roles) return false
    const businessRoles = ['supplier', 'buyer', 'serviceProvider']
    const userBusinessRoles = user.roles.filter((role) => businessRoles.includes(role.code))
    return userBusinessRoles.length > 1
}

export const isRegistrationComplete = (user: User | ExtendedUser | null | undefined): boolean => {
    if (!user) return false
    return Boolean(user.is_registration_complete)
}
