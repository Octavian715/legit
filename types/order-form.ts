import type { DocumentType } from '~/types/documents'

export type OrderFormMode = 'create' | 'edit'

export interface OrderFormDeliveryDetail {
    contactName: string
    phoneNumber: string
    phoneCountryId: number | null
    countryId: number | null
    stateName: string
    cityName: string
    streetName: string
    streetNumber: string
    postalCode: string
}

export interface OrderFormItemData {
    id?: number
    tempId?: string
    productId?: number
    name: string
    sku: string
    ean?: string
    bbd?: string
    eanBarcodeUrl?: string | null
    image?: string
    quantity: number
    quantityUnitId: number
    unitPrice: number
    discountPercent: number
    vatPercent: number
}

export interface OrderFormData {
    type: DocumentType | null
    buyerId: number | null
    statusId: number | null
    paymentStatusId: number | null
    title: string
    subtitle: string
    date: string
    currencyId: number | null
    documentNotes: string
    documentCommentary: string

    hasCustomDelivery: boolean
    deliveryDetail: OrderFormDeliveryDetail | null

    items: OrderFormItemData[]
}

export interface OrderFormTotals {
    subtotal: number
    totalDiscount: number
    totalVat: number
    total: number
}

export interface DocumentTypeOption {
    value: DocumentType
    labelKey: string
    descriptionKey: string
    icon: string
    availableFor: ('manufacturer' | 'logistic')[]
}

export interface DeliveryLocation {
    id: number
    contactName: string
    country: {
        id: number
        name: string
        code: string
    }
    cityName: string
    streetName: string
    streetNumber: string
    postalCode: string
    stateName?: string
    phoneNumber?: string
    phoneCountryId?: number
}

export interface CompanyDetails {
    legalName: string
    registrationNumber?: string
    vatNumber?: string
}

export interface ConnectedClient {
    id: number
    companyDetails: CompanyDetails | null
    deliveryLocations: DeliveryLocation[]
}

export interface ConnectedClientResponse {
    id: number
    company_details: {
        legal_name: string
        registration_number?: string
        vat_number?: string
    } | null
    delivery_locations: Array<{
        id: number
        contact_name: string
        country: {
            id: number
            name: string
            code: string
        }
        city_name: string
        street_name: string
        street_number: string
        postal_code: string
        state_name?: string
        phone_number?: string
        phone_country_id?: number
    }>
}
