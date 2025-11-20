import { computed } from 'vue'
import type { TableColumn } from '~/types/ui/table'

export const useTableConfig = (props: {
    actions?: string[]
    selectable?: boolean
    expandable?: boolean
    pagination?: boolean
    hideColumn?: string[]
    columns: TableColumn[]
}) => {
    const showSelectAll = computed(() => props.selectable)

    const showAddItemButton = computed(() => props.actions?.includes('addItem'))

    const hasRowExpansion = computed(() => props.expandable)

    const showPagination = computed(() => props.pagination)

    const visibleColumns = computed(() => {
        return props.columns.filter((column) => !props.hideColumn?.includes(column.key))
    })

    const totalColumnsCount = computed(() => {
        return (
            visibleColumns.value.length +
            (showSelectAll.value ? 1 : 0) +
            (hasRowExpansion.value ? 1 : 0)
        )
    })

    const getColumnWidth = (column: TableColumn) => {
        return column.width ? `${column.width}%` : 'auto'
    }

    const hasActions = computed(() => {
        return props.actions && props.actions.length > 0
    })

    const availableActions = computed(() => {
        return props.actions || []
    })

    return {
        showSelectAll,
        showAddItemButton,
        hasRowExpansion,
        showPagination,
        visibleColumns,
        totalColumnsCount,
        getColumnWidth,
        hasActions,
        availableActions,
    }
}
