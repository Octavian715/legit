export interface FavoriteItem {
    product_id: number
    created_at: string
    updated_at: string
}

export interface AddToFavoritePayload {
    product_id: number
}

export interface RemoveFromFavoritePayload {
    product_id: number
}

export interface ResponseFavorites {
    data: FavoriteItem[]
    meta: Record<string, any>
}
