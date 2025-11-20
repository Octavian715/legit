import { computed } from 'vue'
import { useTableData } from './useTableData'
import { useTableSelection } from './useTableSelection'
import { useTableSorting } from './useTableSorting'
import { useTableExpansion } from './useTableExpansion'
import { useTablePagination } from './useTablePagination'
import { useTableConfig } from './useTableConfig'
import { useTableEvents } from './useTableEvents'
import type { TableColumn, TableRow, PaginationConfig, SortDirection } from '~/types/ui/table'

interface UseTableProps {
    actions?: string[]
    selectable?: boolean
    columns: TableColumn[]
    rows?: TableRow[]
    hideColumn?: string[]
    indexed?: boolean
    pagination?: boolean
    paginationConfig?: PaginationConfig
    sortBy?: string
    sortDirection?: SortDirection
    expandable?: boolean
    enableCellEvents?: boolean
}

export const useTable = (props: UseTableProps, emit: (event: string, ...args: any[]) => void) => {
    // Data management
    const dataComposable = useTableData(props)

    // Configuration
    const configComposable = useTableConfig(props)

    // Selection functionality
    const selectionComposable = useTableSelection(dataComposable.processedRows, emit)

    // Sorting functionality
    const sortingComposable = useTableSorting(props, emit)

    // Expansion functionality
    const expansionComposable = useTableExpansion()

    // Default pagination config with fallback
    const defaultPaginationConfig: PaginationConfig = {
        currentPage: 1,
        itemsPerPage: 20,
        totalItems: 0,
    }

    // Pagination functionality - pass emit function for proper reactivity
    const paginationComposable = useTablePagination(
        props.paginationConfig || defaultPaginationConfig,
        dataComposable.processedRows,
        emit // Pass emit function to enable pagination events
    )

    // Events handling
    const eventsComposable = useTableEvents(props, emit)

    // Combined computed properties
    const displayRows = computed(() => {
        return configComposable.showPagination.value
            ? paginationComposable.currentPageItems.value
            : dataComposable.processedRows.value
    })

    const tableState = computed(() => ({
        hasData: dataComposable.processedRows.value.length > 0,
        hasSelection: selectionComposable.selectedCount.value > 0,
        isAllSelected: selectionComposable.allSelected.value,
        isIndeterminate: selectionComposable.isIndeterminate.value,
        currentSort: sortingComposable.sortState.value,
        currentPage: paginationComposable.currentPage.value,
        totalPages: paginationComposable.totalPages.value,
        totalItems: paginationComposable.totalItems.value,
    }))

    // Action handlers
    const handleRowAction = (payload: { type: string; row: Record<string, any> }) => {
        eventsComposable.handleRowAction(payload)
    }

    // Enhanced pagination handlers
    const handlePageChange = (page: number) => {
        paginationComposable.goToPage(page)
        emit('update:current-page', page)
    }

    const handleItemsPerPageChange = (itemsPerPage: number) => {
        paginationComposable.changeItemsPerPage(itemsPerPage)
        emit('update:items-per-page', itemsPerPage)
    }

    return {
        // Data
        ...dataComposable,

        // Configuration
        ...configComposable,

        // Selection
        ...selectionComposable,

        // Sorting
        ...sortingComposable,

        // Expansion
        ...expansionComposable,

        // Pagination
        ...paginationComposable,

        // Events
        ...eventsComposable,

        // Combined state
        displayRows,
        tableState,
        handleRowAction,

        // Enhanced handlers
        handlePageChange,
        handleItemsPerPageChange,
    }
}
