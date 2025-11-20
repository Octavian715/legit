import { computed, ref, watch } from 'vue'
import { uniqueId } from 'lodash'
import type { TableColumn, TableRow } from '~/types/ui/table'

export const useTableData = (props: {
    rows: TableRow[]
    columns: TableColumn[]
    indexed?: boolean
    hideColumn?: string[]
}) => {
    const processedRows = ref<TableRow[]>([])

    const visibleColumns = computed(() => {
        const filteredColumns = props.columns.filter(
            (column) => !props.hideColumn?.includes(column.key)
        )

        return props.indexed
            ? [{ key: '#', label: '#', width: 5 }, ...filteredColumns]
            : filteredColumns
    })

    const totalVisibleColumns = computed(() => {
        return visibleColumns.value.length
    })

    const processRows = () => {
        processedRows.value = props.rows.map((row, index) => {
            // Check if this is a legacy array-based row structure
            const hasArrayRow = 'row' in row && Array.isArray(row.row) && row.row.length > 0

            if (hasArrayRow) {
                // Legacy structure - keep array format
                return {
                    id: row.id || uniqueId('row-'),
                    row: props.indexed ? [index + 1, ...row.row] : row.row,
                    originalData: row.originalData,
                    index: row.index !== undefined ? row.index : index,
                }
            }

            // Modern structure with direct properties - return as-is without transformation
            return {
                ...row,
                id: row.id || uniqueId('row-'),
                index: row.index !== undefined ? row.index : index,
            }
        })
    }

    watch(
        () => props.rows,
        () => processRows(),
        { immediate: true, deep: true }
    )

    const getColumnWidth = (column: TableColumn) => {
        return column.width ? `${column.width}%` : 'auto'
    }

    return {
        processedRows,
        visibleColumns,
        totalVisibleColumns,
        getColumnWidth,
    }
}
