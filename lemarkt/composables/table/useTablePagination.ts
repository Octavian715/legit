import { ref, computed, watch } from 'vue'
import type { PaginationConfig, TableRow } from '~/types/ui/table'

export const useTablePagination = (
    paginationConfig: PaginationConfig,
    processedRows: Ref<TableRow[]>,
    emit?: (event: string, ...args: any[]) => void
) => {
    // Internal reactive state
    const currentPage = ref(paginationConfig.currentPage || 1)
    const itemsPerPage = ref(paginationConfig.itemsPerPage || 10)
    const totalItems = ref(paginationConfig.totalItems || 0)

    // Computed properties
    const totalPages = computed(() => {
        if (totalItems.value === 0 || itemsPerPage.value === 0) return 0
        return Math.ceil(totalItems.value / itemsPerPage.value)
    })

    const currentPageItems = computed(() => {
        if (!processedRows.value || processedRows.value.length === 0) return []

        // For client-side pagination (when totalItems matches processedRows length)
        if (totalItems.value === processedRows.value.length) {
            const startIndex = (currentPage.value - 1) * itemsPerPage.value
            const endIndex = startIndex + itemsPerPage.value
            return processedRows.value.slice(startIndex, endIndex)
        }

        // For server-side pagination, return all processedRows as they're already paginated
        return processedRows.value
    })

    const hasNextPage = computed(() => {
        return currentPage.value < totalPages.value
    })

    const hasPrevPage = computed(() => {
        return currentPage.value > 1
    })

    // Watch for external pagination config changes
    watch(
        () => paginationConfig,
        (newConfig) => {
            if (
                newConfig.currentPage !== undefined &&
                newConfig.currentPage !== currentPage.value
            ) {
                currentPage.value = newConfig.currentPage
            }
            if (
                newConfig.itemsPerPage !== undefined &&
                newConfig.itemsPerPage !== itemsPerPage.value
            ) {
                itemsPerPage.value = newConfig.itemsPerPage
            }
            if (newConfig.totalItems !== undefined && newConfig.totalItems !== totalItems.value) {
                totalItems.value = newConfig.totalItems
                // Adjust current page if it's beyond the new total pages
                if (currentPage.value > totalPages.value && totalPages.value > 0) {
                    currentPage.value = totalPages.value
                }
            }
        },
        { deep: true, immediate: true }
    )

    // Watch for totalItems changes to adjust currentPage if needed
    watch(totalPages, (newTotalPages) => {
        if (currentPage.value > newTotalPages && newTotalPages > 0) {
            currentPage.value = newTotalPages
            emit?.('update:current-page', currentPage.value)
        }
    })

    // Actions
    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
            currentPage.value = page
            emit?.('update:current-page', page)
        }
    }

    const nextPage = () => {
        if (hasNextPage.value) {
            goToPage(currentPage.value + 1)
        }
    }

    const prevPage = () => {
        if (hasPrevPage.value) {
            goToPage(currentPage.value - 1)
        }
    }

    const changeItemsPerPage = (newItemsPerPage: number) => {
        if (newItemsPerPage !== itemsPerPage.value) {
            const oldItemsPerPage = itemsPerPage.value
            itemsPerPage.value = newItemsPerPage

            // Calculate what the current first item index is
            const currentFirstItem = (currentPage.value - 1) * oldItemsPerPage + 1

            // Calculate what page this item would be on with the new page size
            const newPage = Math.ceil(currentFirstItem / newItemsPerPage)

            // Ensure the new page is within bounds
            const validPage = Math.min(newPage, Math.max(1, totalPages.value))

            if (validPage !== currentPage.value) {
                currentPage.value = validPage
                emit?.('update:current-page', validPage)
            }

            emit?.('update:items-per-page', newItemsPerPage)
        }
    }

    const updatePaginationConfig = (config: Partial<PaginationConfig>) => {
        let pageChanged = false
        let itemsPerPageChanged = false

        if (config.currentPage !== undefined && config.currentPage !== currentPage.value) {
            currentPage.value = config.currentPage
            pageChanged = true
        }

        if (config.itemsPerPage !== undefined && config.itemsPerPage !== itemsPerPage.value) {
            itemsPerPage.value = config.itemsPerPage
            itemsPerPageChanged = true
        }

        if (config.totalItems !== undefined && config.totalItems !== totalItems.value) {
            totalItems.value = config.totalItems
            // Adjust current page if it's beyond the new total pages
            if (currentPage.value > totalPages.value && totalPages.value > 0) {
                currentPage.value = totalPages.value
                pageChanged = true
            }
        }

        // Emit events for changes
        if (pageChanged) {
            emit?.('update:current-page', currentPage.value)
        }
        if (itemsPerPageChanged) {
            emit?.('update:items-per-page', itemsPerPage.value)
        }
    }

    return {
        currentPage,
        itemsPerPage,
        totalItems,
        totalPages,
        currentPageItems,
        hasNextPage,
        hasPrevPage,
        goToPage,
        nextPage,
        prevPage,
        changeItemsPerPage,
        updatePaginationConfig,
    }
}
