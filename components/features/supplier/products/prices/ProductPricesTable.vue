<template>
    <div class="products-prices-table-wrapper">
        <Table
            :columns="tableColumns"
            :rows="tableRows"
            :loading="loading"
            pagination
            :pagination-config="paginationConfig"
            :actions="allActions"
            fixed-layout
            :sort-by="sortBy"
            expandable
            :sort-direction="sortDirection"
            background="bg-white"
            test="product-prices-table"
            @actions="handleTableAction"
            @sort="handleSort"
            @update:current-page="handlePageChange"
            @update:items-per-page="handleItemsPerPageChange"
        >
            <template #row-expansion="{ item }">
                <div class="flex items-center gap-4 px-4 py-3 bg-gray-50">
                    <div class="flex gap-2 flex-1">
                        <!-- Local Price - Always visible -->
                        <Input
                            :model-value="
                                localPriceInputs[item.id] || item.originalData.local_price || ''
                            "
                            :label="t('productPricesTable.localPrice')"
                            type="number"
                            :step="0.01"
                            :min="0"
                            background="bg-white"
                            size="lg"
                            class="flex-1"
                            @update:model-value="(value) => updateLocalPrice(item.id, value)"
                        />
                        <Select
                            :model-value="getLocalCurrencyCode()"
                            :label="t('productPricesTable.localCurrency')"
                            :options="[localCurrencyOption]"
                            :clearable="false"
                            :disabled="true"
                            background="bg-gray-100"
                            size="lg"
                            class="flex-1"
                        />

                        <!-- Export Price - Only if doExport -->
                        <template v-if="doExport">
                            <Input
                                :model-value="
                                    exportPriceInputs[item.id] ||
                                    item.originalData.export_price ||
                                    ''
                                "
                                :label="t('productPricesTable.exportPrice')"
                                type="number"
                                :step="0.01"
                                :min="0"
                                background="bg-white"
                                size="lg"
                                class="flex-1"
                                @update:model-value="(value) => updateExportPrice(item.id, value)"
                            />
                            <Select
                                :model-value="getExportCurrencyCode()"
                                :label="t('productPricesTable.exportCurrency')"
                                :options="[exportCurrencyOption]"
                                :clearable="false"
                                :disabled="true"
                                background="bg-gray-100"
                                size="lg"
                                class="flex-1"
                            />
                        </template>
                    </div>

                    <div class="ml-auto">
                        <Button
                            variant="filled"
                            color="red"
                            size="md"
                            :disabled="!hasAnyChanges(item.id)"
                            @click="savePrices(item)"
                        >
                            {{ t('productPricesTable.saveChanges') }}
                        </Button>
                    </div>
                </div>
            </template>
        </Table>
    </div>
</template>

<script setup lang="ts">
    import { computed, ref } from 'vue'
    import { useI18n } from 'vue-i18n'
    import type { TableColumn, TableRow, SortState } from '~/types/ui/table'
    import type { ProductWithPrices, ProductPricesSort } from '~/types/dashboardProduct'
    import { useUserStore } from '~/stores/user'

    interface Props {
        products?: ProductWithPrices[]
        meta?: any
        currentPage?: number
        itemsPerPage?: number
        loading?: boolean
        showPagination?: boolean
        sortBy?: ProductPricesSort
        sortDirection?: 'asc' | 'desc' | undefined
    }

    const props = withDefaults(defineProps<Props>(), {
        products: () => [],
        meta: () => ({}),
        currentPage: 1,
        itemsPerPage: 15,
        loading: false,
        showPagination: true,
        sortBy: undefined,
        sortDirection: undefined,
    })

    const emit = defineEmits<{
        'page-change': [page: number]
        'items-per-page-change': [itemsPerPage: number]
        'sort-change': [field: ProductPricesSort | undefined, direction: 'asc' | 'desc' | undefined]
        action: [action: { type: string; row: any; value?: any }]
    }>()

    const { t } = useI18n()
    const userStore = useUserStore()

    const localPriceInputs = ref<Record<string, string>>({})
    const exportPriceInputs = ref<Record<string, string>>({})
    const allActions = []

    // Check if user has export enabled
    const doExport = computed(() => userStore.doExport)
    const userLocalCurrency = computed(() => userStore.user?.default_local_currency)
    const userExportCurrency = computed(() => userStore.user?.default_export_currency)

    const localCurrencyOption = computed(() => {
        const currency = userLocalCurrency.value
        if (!currency) return { value: 'EUR', label: 'EUR (€)', code: 'EUR', symbol: '€' }
        return {
            value: currency.code,
            label: `${currency.code} (${currency.symbol})`,
            code: currency.code,
            symbol: currency.symbol,
        }
    })

    const exportCurrencyOption = computed(() => {
        const currency = userExportCurrency.value
        if (!currency) return { value: 'USD', label: 'USD ($)', code: 'USD', symbol: '$' }
        return {
            value: currency.code,
            label: `${currency.code} (${currency.symbol})`,
            code: currency.code,
            symbol: currency.symbol,
        }
    })

    const updateLocalPrice = (itemId: string, value: string) => {
        localPriceInputs.value[itemId] = value
    }

    const updateExportPrice = (itemId: string, value: string) => {
        exportPriceInputs.value[itemId] = value
    }

    const getLocalCurrencyCode = (): string => {
        return userLocalCurrency.value?.code || 'EUR'
    }

    const getExportCurrencyCode = (): string => {
        return userExportCurrency.value?.code || 'USD'
    }

    const hasLocalChanges = (itemId: string): boolean => {
        const product = props.products?.find((p) => p.product_id?.toString() === itemId)
        if (!product) return false
        const currentPrice = localPriceInputs.value[itemId]
        return currentPrice !== undefined && currentPrice !== product.local_price?.toString()
    }

    const hasExportChanges = (itemId: string): boolean => {
        if (!doExport.value) return false
        const product = props.products?.find((p) => p.product_id?.toString() === itemId)
        if (!product) return false
        const currentPrice = exportPriceInputs.value[itemId]
        return currentPrice !== undefined && currentPrice !== product.export_price?.toString()
    }

    const hasAnyChanges = (itemId: string): boolean => {
        return hasLocalChanges(itemId) || hasExportChanges(itemId)
    }

    const savePrices = (item: TableRow) => {
        const localPrice = localPriceInputs.value[item.id] || item.originalData.local_price

        const prices = [
            {
                price: parseFloat(localPrice),
                currency_id: userLocalCurrency.value?.id,
                price_type: 'local',
            },
        ]

        // Only add export price if doExport is enabled
        if (doExport.value) {
            const exportPrice = exportPriceInputs.value[item.id] || item.originalData.export_price
            prices.push({
                price: parseFloat(exportPrice),
                currency_id: userExportCurrency.value?.id,
                price_type: 'export',
            })
        }

        emit('action', {
            type: 'update-prices',
            row: item.originalData,
            value: {
                local: {
                    price: parseFloat(localPrice),
                    currency: {
                        code: userLocalCurrency.value?.code,
                        id: userLocalCurrency.value?.id,
                        symbol: userLocalCurrency.value?.symbol,
                    },
                },
                export: doExport.value
                    ? {
                          price: parseFloat(
                              exportPriceInputs.value[item.id] || item.originalData.export_price
                          ),
                          currency: {
                              code: userExportCurrency.value?.code,
                              id: userExportCurrency.value?.id,
                              symbol: userExportCurrency.value?.symbol,
                          },
                      }
                    : undefined,
            },
        })

        delete localPriceInputs.value[item.id]
        delete exportPriceInputs.value[item.id]
    }

    // Columns: conditionally include export columns
    const tableColumns = computed<TableColumn[]>(() => {
        const baseColumns: TableColumn[] = [
            {
                key: 'product_id',
                label: t('productPricesTable.productId'),
                sortable: false,
                view: 'TableCellText',
                width: '100px',
                align: 'left',
            },
            {
                key: 'brand_name',
                label: t('productPricesTable.brandName'),
                sortable: true,
                view: 'TableCellText',
                width: '150px',
                align: 'left',
            },
            {
                key: 'product_original_name',
                label: t('productPricesTable.productName'),
                sortable: true,
                view: 'TableCellText',
                width: '200px',
                align: 'left',
            },
            {
                key: 'article_number',
                label: t('productPricesTable.articleNumber'),
                sortable: true,
                view: 'TableCellText',
                width: '130px',
                align: 'left',
            },
            {
                key: 'weight',
                label: t('productPricesTable.weight'),
                sortable: true,
                view: 'TableCellText',
                width: '100px',
                align: 'left',
            },
            {
                key: 'category',
                label: t('productPricesTable.category'),
                sortable: true,
                view: 'TableCellText',
                width: '120px',
                align: 'left',
            },
            {
                key: 'local_price',
                label: `${t('productPricesTable.localPrice')} (${userLocalCurrency.value?.symbol || '€'})`,
                sortable: true,
                view: 'TableCellText',
                width: '120px',
                align: 'right',
            },
        ]

        // Add export columns only if doExport
        if (doExport.value) {
            baseColumns.push({
                key: 'export_price',
                label: `${t('productPricesTable.exportPrice')} (${userExportCurrency.value?.symbol || '$'})`,
                sortable: true,
                view: 'TableCellText',
                width: '120px',
                align: 'right',
            })
        }

        baseColumns.push({
            key: 'local_vat',
            label: t('productPricesTable.localVat'),
            sortable: true,
            view: 'TableCellText',
            width: '80px',
            align: 'right',
        })

        if (doExport.value) {
            baseColumns.push({
                key: 'export_vat',
                label: t('productPricesTable.exportVat'),
                sortable: true,
                view: 'TableCellText',
                width: '80px',
                align: 'right',
            })
        }

        baseColumns.push({
            key: 'local_discount_price',
            label: t('productPricesTable.discountLocal'),
            sortable: true,
            view: 'TableCellText',
            width: '100px',
            align: 'right',
        })

        if (doExport.value) {
            baseColumns.push({
                key: 'export_discount_price',
                label: t('productPricesTable.discountExport'),
                sortable: true,
                view: 'TableCellText',
                width: '100px',
                align: 'right',
            })
        }

        return baseColumns
    })

    const formatWeight = (weight: { value: number; unit: string } | null): string => {
        if (!weight) return t('productPricesTable.noWeight')
        return `${weight.value}${weight.unit}`
    }

    const formatVAT = (vat: number): string => {
        return `${vat}%`
    }

    const formatPrice = (price: number | null | undefined, currencySymbol: string): string => {
        if (price === null || price === undefined) return '-'
        return `${currencySymbol}${price.toFixed(2)}`
    }

    const paginationConfig = computed(() => ({
        currentPage: props.currentPage,
        itemsPerPage: props.itemsPerPage,
        totalItems: props.meta?.total || 0,
    }))

    const tableRows = computed<TableRow[]>(() => {
        const products = props.products || []
        if (!Array.isArray(products) || products.length === 0) return []

        return products.map((product, index) => {
            const rowData = [
                product.product_id?.toString() || t('productPricesTable.unknownId'),
                product.brand_name || t('productPricesTable.notSpecified'),
                product.product_original_name || t('productPricesTable.unknownName'),
                product.article_number || t('productPricesTable.notSpecified'),
                formatWeight(product.weight),
                product.category?.name || t('productPricesTable.noCategory'),
                formatPrice(product.local_price, userLocalCurrency.value?.symbol || '€'),
            ]

            // Add export price column if doExport
            if (doExport.value) {
                rowData.push(
                    formatPrice(product.export_price, userExportCurrency.value?.symbol || '$')
                )
            }

            rowData.push(formatVAT(product.local_vat || 0))

            if (doExport.value) {
                rowData.push(formatVAT(product.export_vat || 0))
            }

            rowData.push(
                product.local_discount_price
                    ? formatPrice(
                          product.local_discount_price,
                          userLocalCurrency.value?.symbol || '€'
                      )
                    : '-'
            )

            if (doExport.value) {
                rowData.push(
                    product.export_discount_price
                        ? formatPrice(
                              product.export_discount_price,
                              userExportCurrency.value?.symbol || '$'
                          )
                        : '-'
                )
            }

            return {
                id: product.product_id?.toString() || `product-${index}`,
                row: rowData,
                originalData: product,
                index: index,
            }
        })
    })

    const handleTableAction = (payload: { type: string; row: TableRow }) => {
        emit('action', { type: payload.type, row: payload.row.originalData })
    }

    const handlePageChange = (page: number) => {
        emit('page-change', page)
    }

    const handleItemsPerPageChange = (itemsPerPage: number) => {
        emit('items-per-page-change', itemsPerPage)
    }

    const handleSort = (sortState: SortState) => {
        if (sortState.direction === undefined) {
            emit('sort-change', undefined, undefined)
            return
        }

        const sortableFields: Record<string, ProductPricesSort> = {
            brand_name: 'brand_name',
            product_original_name: 'name_original',
            article_number: 'article_number',
            weight: 'weight',
            category: 'category',
            local_price: 'local_price',
            export_price: 'export_price',
            local_vat: 'local_vat',
            export_vat: 'export_vat',
            local_discount_price: 'local_discount_price',
            export_discount_price: 'export_discount_price',
        }

        const sortField = sortableFields[sortState.columnKey || '']
        if (sortField) {
            emit('sort-change', sortField, sortState.direction)
        }
    }
</script>

<style scoped>
    .products-prices-table-wrapper {
        width: 100%;
    }
</style>
