// types/productStaticData.ts
export interface ProductAdditionalFeature {
    id: number
    code: string
    name: string
}

export interface ProductAllergen {
    id: number
    code: string
    name: string
}

export interface ProductIncoterm {
    id: number
    code: string
    name: string
}

export interface ProductKeyword {
    id: number
    code: string
    name: string
}

export interface ProductMaterial {
    id: number
    code: string
    name: string
}

export interface ProductQuantityType {
    id: number
    code: string
    name: string
}

export interface ProductStorageCondition {
    id: number
    code: string
    name: string
}

export interface ProductType {
    id: number
    code: string
    name: string
}

export interface ProductStatus {
    id: number
    code: string
    name: string
}
export interface categories {
    id: number
    name: string
}
export interface ProductStaticData {
    additional_features: ProductAdditionalFeature[]
    allergens: ProductAllergen[]
    incoterms: ProductIncoterm[]
    keywords: ProductKeyword[]
    materials: ProductMaterial[]
    quantity_types: ProductQuantityType[]
    storage_conditions: ProductStorageCondition[]
    types: ProductType[]
    statuses: ProductStatus[]
    categories: categories[]
}

export interface ProductSelectOption {
    code: string
    label: string
    value: number | string
    [key: string]: any
}
