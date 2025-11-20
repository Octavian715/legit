export interface DeliveryLocation {
    id?: number
    contact_name: string
    phone_number: string
    phone_country_id?: number
    country_id: number | null
    state_name?: string
    city_name: string
    street_name: string
    street_number: string
    postal_code: string
    is_default?: boolean
}

export interface CheckoutFormData {
    selectedAddressId: number | null
    contact_person: {
        company_name: string
        first_name: string
        last_name: string
        email: string
        phone: string
    }
}

export interface CheckoutDeliveryAddress {
    recipient_name: string
    recipient_phone: string
    country_id: number
    state?: string
    city: string
    street: string
    number: string
    postal_code: string
}
