import type { JSONSchemaType } from '~/utils/validator'

export interface ProductBasicInfoFormData {
    privateLabelAvailable: boolean
    articleNumber: string
    brandName: string
    nameOriginal: string
    names: Array<{
        languageId: number | null
        name: string
    }>
    weightNet: number | null
    weightNetTypeId: number | null
    eanProduct?: string
    eanBox?: string
    localVat?: number | null
    exportVat?: number | null
    categoryId: number | null
    countryOriginId: number | null

    destinationType: 'both' | 'horeca' | 'retail'
    // minOrderQty: number
    // minOrderQtyType: number
}

export const productBasicInfoSchema: JSONSchemaType<ProductBasicInfoFormData> = {
    type: 'object',
    properties: {
        privateLabelAvailable: {
            type: 'boolean',
        },
        articleNumber: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
        },
        brandName: {
            type: 'string',
            minLength: 1,
            maxLength: 150,
        },
        nameOriginal: {
            type: 'string',
            minLength: 1,
            maxLength: 255,
        },
        names: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    languageId: {
                        type: 'integer',
                        minimum: 1,
                        nullable: true,
                    },
                    name: {
                        type: 'string',
                        minLength: 1,
                        maxLength: 255,
                    },
                },
                required: ['languageId', 'name'],
                additionalProperties: false,
            },
            minItems: 1,
        },
        weightNet: {
            type: 'number',
            minimum: 0.001,
            maximum: 99999.999,
        },
        weightNetTypeId: {
            type: 'integer',
            minimum: 1,
            errorMessage: {
                type: 'validation.required',
            },
        },
        eanProduct: {
            type: 'string',
            format: 'ean',
            minLength: 8,
            maxLength: 14,
            nullable: true,
        },
        eanBox: {
            type: 'string',
            format: 'ean',
            minLength: 8,
            maxLength: 14,
            nullable: true,
        },
        localVat: {
            type: 'number',
            nullable: true,
            minimum: 0,
            maximum: 100,
        },
        exportVat: {
            type: 'number',
            nullable: true,
            minimum: 0,
            maximum: 100,
        },

        countryOriginId: {
            type: 'integer',
            minimum: 1,
            errorMessage: { type: 'validation.phoneSelectCountry' },
        },
        categoryId: {
            type: 'integer',
            minimum: 1,
            errorMessage: {
                type: 'validation.required',
            },
        },
        destinationType: {
            type: 'string',
            enum: ['both', 'horeca', 'retail'],
        },
        // minOrderQty: {
        //     type: 'number',
        //     minimum: 0.001,
        //     maximum: 99999.999,
        // },
        // minOrderQtyType: {
        //     type: 'integer',
        //     minimum: 1,
        // },
    },
    required: [
        'articleNumber',
        'brandName',
        'nameOriginal',
        'names',
        'weightNet',
        'weightNetTypeId',
        'eanProduct',
        'eanBox',
        // 'localVat',
        'categoryId',
        'countryOriginId',
        'destinationType',
        // 'minOrderQty',
        // 'minOrderQtyType',
    ],
    additionalProperties: false,
}

export interface ProductDescriptionsFormData {
    shelfLifeDays: number
    storageConditionId: number
    temperatureMin: number | null
    temperatureMax: number | null
    labelTranslations: Array<{
        languageId: number | null
        label: string
    }>
    labelTranslationsOnRequest: boolean
    businessTypeIds: number[]
    allergenIds: number[]
    typeIds: number[]
    ingredients: Array<{
        languageId: number | null
        content: string
    }>
    descriptions: Array<{
        languageId: number | null
        content: string
    }>
}

export const productDescriptionsSchema: JSONSchemaType<ProductDescriptionsFormData> = {
    type: 'object',
    properties: {
        shelfLifeDays: {
            type: 'integer',
            minimum: 1,
        },
        storageConditionId: {
            type: 'integer',
            minimum: 1,
        },
        temperatureMin: {
            type: 'number',
            minimum: -50,
            maximum: 50,
            nullable: true,
        },
        temperatureMax: {
            type: 'number',
            minimum: -50,
            maximum: 50,
            nullable: true,
        },
        labelTranslations: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    languageId: {
                        type: 'integer',
                        minimum: 1,
                        nullable: true,
                    },
                    label: {
                        type: 'string',
                        minLength: 1,
                        maxLength: 255,
                    },
                },
                required: ['languageId', 'label'],
                additionalProperties: false,
            },
            minItems: 1,
        },
        labelTranslationsOnRequest: {
            type: 'boolean',
        },
        businessTypeIds: {
            type: 'array',
            items: {
                type: 'integer',
                minimum: 1,
            },
            minItems: 1,
        },
        allergenIds: {
            type: 'array',
            items: {
                type: 'integer',
                minimum: 1,
            },
        },
        typeIds: {
            type: 'array',
            items: {
                type: 'integer',
                minimum: 1,
            },
            minItems: 1,
        },
        ingredients: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    languageId: {
                        type: 'integer',
                        minimum: 1,
                        nullable: true,
                    },
                    content: {
                        type: 'string',
                        minLength: 1,
                        maxLength: 2000,
                    },
                },
                required: ['languageId', 'content'],
                additionalProperties: false,
            },
            minItems: 1,
        },
        descriptions: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    languageId: {
                        type: 'integer',
                        minimum: 1,
                        nullable: true,
                    },
                    content: {
                        type: 'string',
                        minLength: 1,
                        maxLength: 500,
                    },
                },
                required: ['languageId', 'content'],
                additionalProperties: false,
            },
            minItems: 1,
        },
    },
    required: [
        'shelfLifeDays',
        'storageConditionId',
        'labelTranslations',
        'labelTranslationsOnRequest',
        'businessTypeIds',
        'typeIds',
        'ingredients',
        'descriptions',
    ],
    additionalProperties: false,
}

export interface ProductKeywordsFormData {
    keywords: string[]
}

export const productKeywordsSchema: JSONSchemaType<ProductKeywordsFormData> = {
    type: 'object',
    properties: {
        keywords: {
            type: 'array',
            items: {
                type: 'string',
            },
            minItems: 5,
        },
    },
    required: ['keywords'],
    additionalProperties: false,
}

export interface ProductPricingFormData {
    prices: Array<{
        currencyId: number
        price: number
        priceType: 'local' | 'export'
    }>
}

export const getProductPricingSchema = (
    hasExport: boolean
): JSONSchemaType<ProductPricingFormData> => {
    const minPricesCount = hasExport ? 2 : 1

    return {
        type: 'object',
        properties: {
            prices: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        currencyId: {
                            type: 'integer',
                            minimum: 1,
                        },
                        price: {
                            type: 'number',
                            minimum: 0.01,
                            maximum: 9999999,
                        },
                        priceType: {
                            type: 'string',
                            enum: ['local', 'export'],
                        },
                    },
                    required: ['currencyId', 'price', 'priceType'],
                    additionalProperties: false,
                },
                minItems: minPricesCount,
            },
            volumePrices: {
                type: 'array',
                nullable: true,
                items: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            nullable: true,
                        },
                        currencyId: {
                            type: 'integer',
                            minimum: 1,
                        },
                        quantityFrom: {
                            type: 'number',
                            minimum: 1,
                            maximum: 99999999,
                        },
                        price: {
                            type: 'number',
                            minimum: 0.01,
                            maximum: 9999999,
                        },
                        priceType: {
                            type: 'string',
                            enum: ['local', 'export'],
                        },
                    },
                    required: ['currencyId', 'quantityFrom', 'price', 'priceType'],
                    additionalProperties: false,
                },
            },
        },
        required: ['prices'],
        additionalProperties: false,
    }
}

export interface ProductLogisticsFormData {
    piecesPerBox: number
    boxesPerPalette: number
    boxesPerRow: number
    rowsPerPalette: number
    packagings: Array<{
        type: 'unit' | 'box' | 'palette'
        materialId: number
        weight: number
        quantityTypeId: number
    }>
    productLengthCm: number
    productWidthCm: number
    productHeightCm: number
    productGrossWeightG: number
    cartonLengthCm: number
    cartonWidthCm: number
    cartonHeightCm: number
    cartonGrossWeightG: number
    paletteLengthCm: number
    paletteWidthCm: number
    paletteHeightCm: number
    paletteGrossWeightG: number
    showProductGrossWeight?: boolean
    customsTariffNumber?: string
}

export const productLogisticsSchema: JSONSchemaType<ProductLogisticsFormData> = {
    type: 'object',
    properties: {
        piecesPerBox: {
            type: 'integer',
            minimum: 1,
        },
        boxesPerPalette: {
            type: 'integer',
            minimum: 1,
        },
        boxesPerRow: {
            type: 'integer',
            minimum: 1,
        },
        rowsPerPalette: {
            type: 'integer',
            minimum: 1,
        },
        packagings: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    type: {
                        type: 'string',
                        enum: ['unit', 'box', 'palette'],
                    },
                    materialId: {
                        type: 'integer',
                        minimum: 1,
                    },
                    weight: {
                        type: 'number',
                        minimum: 0.001,
                    },
                    quantityTypeId: {
                        type: 'integer',
                        minimum: 1,
                    },
                },
                required: ['type', 'materialId', 'weight', 'quantityTypeId'],
                additionalProperties: false,
            },
            minItems: 1,
        },
        productLengthCm: {
            type: 'number',
            minimum: 0.1,
        },
        productWidthCm: {
            type: 'number',
            minimum: 0.1,
        },
        productHeightCm: {
            type: 'number',
            minimum: 0.1,
        },
        productGrossWeightG: {
            type: 'number',
            minimum: 0.1,
        },
        cartonLengthCm: {
            type: 'number',
            minimum: 0.1,
        },
        cartonWidthCm: {
            type: 'number',
            minimum: 0.1,
        },
        cartonHeightCm: {
            type: 'number',
            minimum: 0.1,
        },
        cartonGrossWeightG: {
            type: 'number',
            minimum: 0.1,
        },
        paletteLengthCm: {
            type: 'number',
            minimum: 0.1,
        },
        paletteWidthCm: {
            type: 'number',
            minimum: 0.1,
        },
        paletteHeightCm: {
            type: 'number',
            minimum: 0.1,
        },
        paletteGrossWeightG: {
            type: 'number',
            minimum: 0.1,
        },
        showProductGrossWeight: {
            type: 'boolean',
            nullable: true,
        },
        customsTariffNumber: {
            type: 'string',
            nullable: true,
        },
    },
    required: [
        'piecesPerBox',
        'boxesPerPalette',
        'boxesPerRow',
        'rowsPerPalette',
        'packagings',
        'productLengthCm',
        'productWidthCm',
        'productHeightCm',
        'productGrossWeightG',
        'cartonLengthCm',
        'cartonWidthCm',
        'cartonHeightCm',
        'cartonGrossWeightG',
        'paletteLengthCm',
        'paletteWidthCm',
        'paletteHeightCm',
        'paletteGrossWeightG',
    ],
    additionalProperties: false,
}

export interface ProductDeliveryFormData {
    availabilityCountryIds: number[]
    incotermIds: number[]
}

export const productDeliverySchema: JSONSchemaType<ProductDeliveryFormData> = {
    type: 'object',
    properties: {
        availabilityCountryIds: {
            type: 'array',
            items: {
                type: 'integer',
                minimum: 1,
            },
            minItems: 1,
        },
        incotermIds: {
            type: 'array',
            items: {
                type: 'integer',
                minimum: 1,
            },
            minItems: 1,
        },
    },
    required: ['availabilityCountryIds', 'incotermIds'],
    additionalProperties: false,
}

export interface ProductFeaturesFormData {
    featureIds?: number[]
    discounts?: Array<{
        priceType: 'local' | 'export'
        percentage: number
        startDate: string
        endDate?: string
    }>
    additionalFeatureIds?: number[]
}

export const productFeaturesSchema: JSONSchemaType<ProductFeaturesFormData> = {
    type: 'object',
    properties: {
        featureIds: {
            type: 'array',
            items: { type: 'integer', minimum: 1 },
            nullable: true,
        },
        discounts: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    priceType: {
                        type: 'string',
                        enum: ['local', 'export'],
                    },
                    percentage: {
                        type: 'number',
                        minimum: 0.01,
                        maximum: 100,
                    },
                    startDate: {
                        type: 'string',
                        format: 'date',
                    },
                    endDate: {
                        type: 'string',
                        nullable: true,
                    },
                },
                required: ['priceType', 'percentage', 'startDate'],
                additionalProperties: false,
            },
            nullable: true,
        },
        additionalFeatureIds: {
            type: 'array',
            items: { type: 'integer', minimum: 1 },
            nullable: true,
        },
    },
    additionalProperties: false,
}

export interface ProductImagesFormData {
    images: File[]
    primaryImageIndex?: number
    existingImages?: Array<{
        id: number
        sortOrder: number
        isPrimary: boolean
    }>
    deleteImageIds?: number[]
}

export const productImagesSchema = {
    type: 'object',
    properties: {
        images: { type: 'array' },
        primaryImageIndex: { type: 'integer', nullable: true },
        existingImages: { type: 'array', nullable: true },
        deleteImageIds: { type: 'array', nullable: true },
    },
    required: [],
} as any
