// utils/product-transformer.ts

export const transformProductFromBackend = (
    product: any,
    staticData?: {
        countries?: any[]
        categories?: any[]
        quantityTypes?: any[]
        storageConditions?: any[]
        incoterms?: any[]
        features?: any[]
        additionalFeatures?: any[]
        materials?: any[]
        languageOptions?: any[]
    }
): Record<string, any> => {
    if (!product || typeof product !== 'object') {
        console.warn('Invalid product data provided to transformer')
        return {}
    }

    const stepData: Record<string, any> = {}

    // COUNTRY - search by code, return .value
    let countryId: number | null = null
    if (product.country_origin?.name && staticData?.countries) {
        const country = staticData.countries.find(
            (c: any) =>
                c.label === product.country_origin.name || c.code === product.country_origin.name
        )
        countryId = country?.value ? Number(country.value) : null
    }

    // CATEGORY - search by parent.id and slug, return .value
    let categoryId: number | null = null

    if (product.category) {
        categoryId = Number(product.category.id)
    }

    // QUANTITY TYPE - search by symbol, return .value
    let weightNetTypeId: number | null = null
    if (product.weight?.symbol && staticData?.quantityTypes) {
        const qType = staticData.quantityTypes.find((q: any) => q.code === product.weight.symbol)
        weightNetTypeId = qType?.value ? Number(qType.value) : null
    }

    // LANGUAGE IDs - search by code, return .value (NOT .id)
    const transformNamesWithLanguageValue = (
        names: any[] | undefined
    ): Array<{ languageId: number; name: string }> => {
        if (!Array.isArray(names)) return [{ languageId: 1, name: '' }]

        return names.map((item) => {
            let languageId = 1

            if (item.language?.code && staticData?.languageOptions) {
                const lang = staticData.languageOptions.find(
                    (l: any) => l.code === item.language.code
                )
                languageId = lang?.value ? Number(lang.value) : 1
            }

            return {
                languageId,
                name: item.name || '',
            }
        })
    }

    const normalizeDestinationType = (type: string | undefined): 'both' | 'horeca' | 'retail' => {
        if (!type) return 'both'

        const normalized = type.toLowerCase()

        switch (normalized) {
            case 'horeca':
            case 'ho_re_ca':
                return 'horeca'
            case 'retail':
                return 'retail'
            case 'both':
                return 'both'
            default:
                return 'both'
        }
    }

    const transformPackagings = (
        packagings: any[] | undefined,
        materials?: any[],
        quantityTypes?: any[]
    ): Array<{
        type: string
        materialId: number | null
        weight: number | null
        quantityTypeId: number | null
    }> => {
        const defaultPackagings = [
            { type: 'unit', materialId: null, weight: null, quantityTypeId: null },
            { type: 'box', materialId: null, weight: null, quantityTypeId: null },
            { type: 'palette', materialId: null, weight: null, quantityTypeId: null },
        ]

        if (!Array.isArray(packagings) || packagings.length === 0) {
            return defaultPackagings
        }

        // Creează un map pentru acces rapid
        const packagingMap: Record<string, any> = {}
        packagings.forEach((item) => {
            if (item.type) {
                packagingMap[item.type] = item
            }
        })

        const result = ['unit', 'box', 'palette'].map((type) => {
            const pkg = packagingMap[type]

            if (!pkg) {
                return { type, materialId: null, weight: null, quantityTypeId: null }
            }

            // Resolve materialId: prefer staticData lookup by code, fallback to nested material.id
            let materialId: number | null = null
            if (pkg.material?.code && materials) {
                const material = materials.find((m: any) => m.code === pkg.material.code)
                materialId = material?.value
                    ? Number(material.value)
                    : pkg.material?.id
                      ? Number(pkg.material.id)
                      : null
            } else {
                materialId = pkg.material?.id ? Number(pkg.material.id) : null
            }

            // Resolve quantityTypeId: prefer staticData lookup by symbol, fallback to nested quantity_type.id
            let quantityTypeId: number | null = null
            if (pkg.quantity_type?.symbol && quantityTypes) {
                const qType = quantityTypes.find((q: any) => q.code === pkg.quantity_type.symbol)
                quantityTypeId = qType?.value
                    ? Number(qType.value)
                    : pkg.quantity_type?.id
                      ? Number(pkg.quantity_type.id)
                      : null
            } else {
                quantityTypeId = pkg.quantity_type?.id ? Number(pkg.quantity_type.id) : null
            }

            return {
                type,
                materialId,
                weight: pkg.weight ? parseFloat(pkg.weight) : null,
                quantityTypeId,
            }
        })

        return result
    }

    stepData['basic-info'] = {
        privateLabelAvailable: product.private_label_available ?? false,
        articleNumber: product.article_number ?? '',
        brandName: product.brand_name ?? '',
        nameOriginal: product.name_original ?? '',
        names: transformNamesWithLanguageValue(product.names),
        weightNet: product.weight_net
            ? parseFloat(product.weight_net)
            : product.weight?.value
              ? parseFloat(product.weight.value)
              : null,
        weightNetTypeId: product.weight_net_type_id || weightNetTypeId,
        eanProduct: product.ean_product ?? '',
        eanBox: product.ean_box ?? '',
        localVat: product.local_vat
            ? parseFloat(product.local_vat)
            : product.vat
              ? parseFloat(product.vat)
              : null,
        exportVat: product.export_vat ? parseFloat(product.export_vat) : null,
        categoryId: categoryId,
        countryOriginId: product.country_origin_id || countryId,
        // Fix destinationType to handle case variations
        destinationType: normalizeDestinationType(product.destination_type),
    }

    let storageConditionId: number | null = null
    if (product.storage_condition?.name && staticData?.storageConditions) {
        const storage = staticData.storageConditions.find(
            (s: any) => s.label === product.storage_condition.name
        )
        storageConditionId = storage?.value ? Number(storage.value) : null
    }

    // Label translations with language .value
    const transformLabelTranslationsWithValue = (
        labels: any[] | undefined
    ): Array<{ languageId: number; label: string }> => {
        if (!Array.isArray(labels)) return [{ languageId: 1, label: '' }]

        return labels.map((item) => {
            let languageId = 1

            if (item.language?.code && staticData?.languageOptions) {
                const lang = staticData.languageOptions.find(
                    (l: any) => l.code === item.language.code
                )
                languageId = lang?.value ? Number(lang.value) : 1
            }

            return {
                languageId,
                label: item.label || item.name || '',
            }
        })
    }

    // Content arrays with language .value
    const transformContentArrayWithValue = (
        items: any[] | undefined
    ): Array<{ languageId: number; content: string }> => {
        if (!Array.isArray(items)) return []

        return items.map((item) => {
            let languageId = 1

            if (item.language?.code && staticData?.languageOptions) {
                const lang = staticData.languageOptions.find(
                    (l: any) => l.code === item.language.code
                )
                languageId = lang?.value ? Number(lang.value) : 1
            }

            return {
                languageId,
                content: item.content || '',
            }
        })
    }

    stepData['descriptions'] = {
        shelfLifeDays: product.shelf_life_days ?? null,
        storageConditionId: storageConditionId,
        temperatureMin: parseFloat(product.storage_condition?.temperature_min) || null,
        temperatureMax: parseFloat(product.storage_condition?.temperature_max) || null,
        labelTranslations: transformLabelTranslationsWithValue(
            product.label_translations || product.names
        ),
        labelTranslationsOnRequest: product.label_translations_on_request ?? false,
        businessTypeIds: transformIdsFromObjects(product.business_types),
        allergenIds: transformIdsFromObjects(product.allergens),
        typeIds: transformIdsFromObjects(product.types),
        ingredients: transformContentArrayWithValue(product.ingredients),
        descriptions: transformContentArrayWithValue(product.descriptions),
    }

    stepData['ai-assistant'] = {
        keywords: transformKeywords(product.keywords),
    }

    stepData['pricing'] = {
        prices: transformPricesFromAPI(product),
        volumePrices: transformVolumePrices(product.volume_prices),
    }

    stepData['logistics'] = {
        piecesPerBox: product.logistic?.pieces_per_box ?? null,
        boxesPerPalette: product.logistic?.boxes_per_palette ?? null,
        boxesPerRow: product.logistic?.boxes_per_row ?? null,
        rowsPerPalette: product.logistic?.rows_per_palette ?? null,
        packagings: transformPackagings(product.packagings),
        productLengthCm: parseFloat(product.logistic?.product_length_cm || '0') || null,
        productWidthCm: parseFloat(product.logistic?.product_width_cm || '0') || null,
        productHeightCm: parseFloat(product.logistic?.product_height_cm || '0') || null,
        productGrossWeightG: parseFloat(product.logistic?.product_gross_weight_g || '0') || null,
        cartonLengthCm: parseFloat(product.logistic?.carton_length_cm || '0') || null,
        cartonWidthCm: parseFloat(product.logistic?.carton_width_cm || '0') || null,
        cartonHeightCm: parseFloat(product.logistic?.carton_height_cm || '0') || null,
        cartonGrossWeightG: parseFloat(product.logistic?.carton_gross_weight_g || '0') || null,
        paletteLengthCm: parseFloat(product.logistic?.palette_length_cm || '0') || null,
        paletteWidthCm: parseFloat(product.logistic?.palette_width_cm || '0') || null,
        paletteHeightCm: parseFloat(product.logistic?.palette_height_cm || '0') || null,
        paletteGrossWeightG: parseFloat(product.logistic?.palette_gross_weight_g || '0') || null,
        showProductGrossWeight: product.logistic?.show_product_gross_weight ?? false,
        customsTariffNumber: product.logistic?.customs_tariff_number ?? '',
    }
    stepData['delivery'] = {
        availabilityCountryIds: transformCountryIdsByCodes(
            product.availability_countries,
            staticData?.countries
        ),
        incotermIds: transformIdsByCodes(product.incoterms, staticData?.incoterms),
    }

    stepData['features'] = {
        featureIds: transformIdsByNames(product.features, staticData?.features),
        additionalFeatureIds: transformIdsByNames(
            product.additional_features,
            staticData?.additionalFeatures
        ),
        discounts: transformDiscounts(product.discounts),
    }

    stepData['images'] = {
        images: [],
        existingImages: transformImages(product.images),
        primaryImageIndex: (() => {
            const images = transformImages(product.images)
            const primaryIndex = images.findIndex((img) => img.isPrimary)
            return primaryIndex >= 0 ? primaryIndex : 0
        })(),
        deleteImageIds: [],
    }

    return stepData
}

const transformKeywords = (keywords: any[] | undefined): string[] => {
    if (!Array.isArray(keywords)) return []
    return keywords
        .map((item) => (typeof item === 'string' ? item : item.name || item.keyword || ''))
        .filter(Boolean)
}

const transformPricesFromAPI = (
    product: any
): Array<{ currencyId: number; price: number; priceType: 'local' | 'export' }> => {
    const prices = []
    let hasLocal = false
    let hasExport = false

    // Check for prices array format (from import)
    if (Array.isArray(product.prices) && product.prices.length > 0) {
        product.prices.forEach((price: any) => {
            const currencyId = Number(price.currency_id || price.currency?.id || 1)
            const priceValue = parseFloat(price.price || 0)
            const priceType = (price.price_type || 'local') as 'local' | 'export'

            prices.push({
                currencyId,
                price: priceValue,
                priceType,
            })

            if (priceType === 'local') hasLocal = true
            if (priceType === 'export') hasExport = true
        })
    }

    // Check for old format (price and export_price objects)
    if (!hasLocal && product.price?.product_currency?.currency?.id) {
        const currencyId = Number(product.price.product_currency.currency.id)
        const priceValue = parseFloat(
            product.price.product_currency.original || product.price.product_currency.final || 0
        )

        prices.push({
            currencyId,
            price: priceValue,
            priceType: 'local' as const,
        })
        hasLocal = true
    }

    if (!hasExport && product.export_price?.product_currency?.currency?.id) {
        const currencyId = Number(product.export_price.product_currency.currency.id)
        const priceValue = parseFloat(
            product.export_price.product_currency.original ||
                product.export_price.product_currency.final ||
                0
        )

        prices.push({
            currencyId,
            price: priceValue,
            priceType: 'export' as const,
        })
        hasExport = true
    }

    if (!hasLocal) {
        prices.push({
            currencyId: 1, // Default USD
            price: 0,
            priceType: 'local' as const,
        })
    }

    if (!hasExport) {
        // Use same currency as local price if exists
        const localPrice = prices.find((p) => p.priceType === 'local')
        prices.push({
            currencyId: localPrice?.currencyId || 1,
            price: 0,
            priceType: 'export' as const,
        })
    }

    return prices
}

const transformDiscounts = (
    discounts: any[] | undefined
): Array<{
    priceType: 'local' | 'export'
    percentage: number
    startDate: string
    endDate: string
}> => {
    if (!Array.isArray(discounts)) return []
    return discounts.map((item) => ({
        priceType: (item.price_type || 'local') as 'local' | 'export',
        percentage: parseFloat(item.percentage || 0),
        startDate: item.start_date || '',
        endDate: item.end_date || '',
    }))
}

const transformImages = (
    images: any[] | undefined
): Array<{
    id: number
    url: string
    name?: string
    isPrimary: boolean
    sortOrder: number
}> => {
    if (!Array.isArray(images) || images.length === 0) {
        return []
    }

    const result = images.map((img, index) => ({
        id: img.id || 0,
        url: img.url || img.file_path || '',
        name: img.file_name || `Image ${img.id}`,
        isPrimary: img.is_primary || false,
        sortOrder: img.sort_order !== undefined ? img.sort_order : index,
    }))

    // Sortează după sort_order
    result.sort((a, b) => a.sortOrder - b.sortOrder)

    return result
}
const transformIdsFromObjects = (items: any[] | undefined): number[] => {
    if (!Array.isArray(items)) return []
    return items
        .map((item) => (item.id ? Number(item.id) : null))
        .filter((id): id is number => id !== null)
}

const transformCountryIdsByCodes = (
    countries: any[] | undefined,
    staticCountries: any[] | undefined
): number[] => {
    if (!Array.isArray(countries) || !staticCountries) return []
    return countries
        .map((country) => {
            const found = staticCountries.find((c: any) => c.code === country.code)
            return found?.value ? Number(found.value) : null
        })
        .filter((id): id is number => id !== null)
}

const transformIdsByCodes = (items: any[] | undefined, staticData: any[] | undefined): number[] => {
    if (!Array.isArray(items) || !staticData) return []
    return items
        .map((item) => {
            const found = staticData.find((s: any) => s.code === item.code)
            return found?.value ? Number(found.value) : null
        })
        .filter((id): id is number => id !== null)
}

const transformIdsByNames = (items: any[] | undefined, staticData: any[] | undefined): number[] => {
    if (!Array.isArray(items) || !staticData) return []
    return items
        .map((item) => {
            const found = staticData.find((s: any) => s.name === item.name || s.label === item.name)
            return found?.value ? Number(found.value) : null
        })
        .filter((id): id is number => id !== null)
}

const transformVolumePrices = (
    volumePrices: any[] | undefined
): Array<{
    currencyId: number
    quantityFrom: number
    price: number
    priceType: 'local' | 'export'
}> => {
    if (!Array.isArray(volumePrices) || volumePrices.length === 0) {
        return []
    }

    return volumePrices
        .map((vp) => {
            // Handle missing price field from backend
            const price =
                vp.price !== undefined
                    ? typeof vp.price === 'number'
                        ? vp.price
                        : parseFloat(vp.price) || 0
                    : 0

            // Parse quantity_from correctly (can be string like "3.000")
            const quantityFrom =
                typeof vp.quantity_from === 'number'
                    ? vp.quantity_from
                    : parseFloat(vp.quantity_from) || 0

            return {
                currencyId: Number(vp.currency_id || vp.currency?.id || 1),
                quantityFrom: Math.floor(quantityFrom), // Convert to integer (3.000 -> 3)
                price,
                priceType: (vp.price_type || 'local') as 'local' | 'export',
            }
        })
        .filter((vp) => vp.quantityFrom > 0) // Remove invalid entries
}
