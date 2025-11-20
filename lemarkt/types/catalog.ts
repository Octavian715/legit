export interface CatalogNode {
    id: number
    name: string
    slug: string
    icon_path?: string
}

export interface CatalogMenuState {
    data: CatalogNode[] | CatalogNode | null
    fetchedAt: Date | null
    isLoading: boolean
    error: string | null
    currentRootId: number | null
}

export interface CatalogMenuCache {
    [key: string]: {
        data: CatalogNode[] | CatalogNode
        fetchedAt: string
    }
}
