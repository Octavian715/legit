import { ref } from 'vue'
import type { TableRow } from '~/types/ui/table'

export const useTableExpansion = () => {
    const expandedRows = ref<Set<string>>(new Set())

    const toggleRowExpansion = (row: TableRow) => {
        const rowId = row.id
        if (expandedRows.value.has(rowId)) {
            expandedRows.value.delete(rowId)
        } else {
            expandedRows.value.add(rowId)
        }
    }

    const isRowExpanded = (row: TableRow) => expandedRows.value.has(row?.id)

    const collapseAllRows = () => {
        expandedRows.value.clear()
    }

    const expandAllRows = (rows: TableRow[]) => {
        rows.forEach((row) => {
            expandedRows.value.add(row.id)
        })
    }

    return {
        expandedRows,
        toggleRowExpansion,
        isRowExpanded,
        collapseAllRows,
        expandAllRows,
    }
}
