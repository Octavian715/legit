// Backend notification types - ONLY these exist in the API
export type NotificationType =
    // Follow notifications
    | 'user_follow'
    | 'user_unfollow'
    // Connection notifications
    | 'connection_request_received'
    | 'connection_request_accepted'
    | 'connection_request_rejected'
    | 'connection_removed'
    // Order notifications
    | 'order_received'
    | 'order_updated'
    // Cart notifications
    | 'cart_changed'

export interface NotificationActionButton {
    text: string
    url: string
    style: 'primary' | 'secondary'
}

export interface NotificationActions {
    primary?: {
        label: string
        url: string
    }
    secondary?: {
        label: string
        url: string
    }
}

export interface Notification {
    id: string | number
    type: NotificationType
    title: string
    body?: string
    message?: string
    is_read?: boolean
    read?: boolean
    read_at?: string | null
    created_at?: string
    createAt?: string
    updated_at?: string
    action_buttons?: NotificationActionButton[]
    actions?: NotificationActions
    metadata?: Record<string, any>
    data?: Record<string, any>

    companyName?: string
    company_name?: string
    companyId?: string | number
    company_id?: string | number
    companySlug?: string
    company_slug?: string

    orderId?: string | number
    order_id?: string | number

    productId?: string | number
    product_id?: string | number
    productName?: string
    product_name?: string

    cartItemId?: string | number
    cart_item_id?: string | number
    affected_product_ids?: number[] | string[]
    target_user_id?: number | string
    userId?: string | number
    user_id?: string | number
    userName?: string
    user_name?: string
}

export interface NotificationMeta {
    current_page: number
    per_page: number
    total: number
    unread_count: number
}

export interface NotificationsResponse {
    data: Notification[]
    meta: NotificationMeta
}

export interface UnreadCountUpdate {
    unread_count: number
    timestamp?: string
}

export interface SocketNotificationPayload {
    notification: Notification
    unread_count: number
}

export interface NotificationTypeInfo {
    value: NotificationType
    display_name: string
    default_channels: string[]
}

export interface NotificationPreference {
    type: NotificationType
    email_enabled: boolean
    platform_enabled: boolean
}
