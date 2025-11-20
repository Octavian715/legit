// types/staticData.ts - UPDATED SELECT OPTION FORMAT
export interface Continent {
    id: number
    code: string
    name: string
}

export interface Currency {
    id: number
    code: string
    symbol: string
    name: string
}

export interface State {
    id: number
    code: string
    name: string
}
export interface Continent {
    id: number
    code: string
    name: string
}

export interface Currency {
    id: number
    code: string
    symbol: string
    name: string
}

export interface State {
    id: number
    code: string
    name: string
}

export interface Country {
    id: number
    code: string
    phone_code: string
    native_name: string
    name: string
    flag_url?: string
    continent: Continent
    default_currency: Currency
    states: State[]
}

export interface BusinessType {
    id: number
    code: string
    name: string
}

export interface Language {
    id: number
    code: string
    native_name: string
}

export interface ContactPosition {
    id: number
    code: string
    name: string
}

export interface EmployeeRange {
    id: number
    code: string
    name: string
    min_value?: number
    max_value?: number | null
}

export interface RevenueRange {
    id: number
    code: string
    name: string
    min_value?: number
    max_value?: number | null
}

export interface ExportPercentage {
    id: number
    code: string
    name: string
    min_value?: number
    max_value?: number
}

export interface FactorySize {
    id: number
    code: string
    name: string
    min_value?: number
    max_value?: number | null
}

export interface UserPlan {
    id: number
    code: string
    name: string
    price: number
    billing_cycle: string
    duration_months: number
    is_active: boolean
}

export interface UserRole {
    id: number
    code: string
    name: string
}

export interface Category {
    id: number
    slug: string
    name: string
    icon_raw_svg?: string
}

export interface DocumentStatus {
    id: number
    code: string
    name: string
}

export interface DocumentPaymentStatus {
    id: number
    code: string
    name: string
}

export interface StaticData {
    continents: Continent[]
    countries: Country[]
    business_types: BusinessType[]
    currencies: Currency[]
    languages: Language[]
    contact_positions: ContactPosition[]
    employee_ranges: EmployeeRange[]
    revenue_ranges: RevenueRange[]
    export_percentages: ExportPercentage[]
    factory_sizes: FactorySize[]
    user_plans: UserPlan[]
    user_roles: UserRole[]
    categories: Category[]
    document_statuses: DocumentStatus[]
    document_payment_statuses: DocumentPaymentStatus[]
}

export interface SelectOption {
    code: string
    label: string
    value: number | string
    [key: string]: any
}

export interface CountryOption extends SelectOption {
    phoneCode: string
    nativeName: string
    flag: string
}

export interface CurrencyOption extends SelectOption {
    symbol: string
}

export interface LanguageOption extends SelectOption {
    code: string
}

export interface PlanOption extends SelectOption {
    price: number
    billingCycle: string
    isActive?: boolean
}
export interface Country {
    id: number
    code: string
    phone_code: string
    native_name: string
    name: string
    continent: Continent
    default_currency: Currency
    states: State[]
}

export interface BusinessType {
    id: number
    code: string
    name: string
}

export interface Language {
    id: number
    code: string
    native_name: string
}

export interface ContactPosition {
    id: number
    code: string
    name: string
}

export interface EmployeeRange {
    id: number
    code: string
    name: string
}

export interface RevenueRange {
    id: number
    code: string
    name: string
}

export interface ExportPercentage {
    id: number
    code: string
    name: string
}

export interface FactorySize {
    id: number
    code: string
    name: string
}

export interface UserPlan {
    id: number
    code: string
    name: string
    price: number
    billing_cycle: string
    duration_months: number
    is_active: boolean
}

export interface UserRole {
    id: number
    code: string
    name: string
}

export interface Category {
    id: number
    slug: string
    name: string
}

export interface StaticData {
    continents: Continent[]
    countries: Country[]
    business_types: BusinessType[]
    currencies: Currency[]
    languages: Language[]
    contact_positions: ContactPosition[]
    employee_ranges: EmployeeRange[]
    revenue_ranges: RevenueRange[]
    export_percentages: ExportPercentage[]
    factory_sizes: FactorySize[]
    user_plans: UserPlan[]
    user_roles: UserRole[]
    categories: Category[]
}

// UPDATED FORM OPTION TYPES - CORRECT FORMAT
export interface SelectOption {
    code: string
    label: string
    value: number | string
    [key: string]: any
}

export interface CountryOption extends SelectOption {
    phoneCode: string
    nativeName: string
    flag: string
}

export interface CurrencyOption extends SelectOption {
    symbol: string
}

export interface LanguageOption extends SelectOption {
    code: string
}

export interface PlanOption extends SelectOption {
    price: number
    billingCycle: string
    isActive?: boolean
}
