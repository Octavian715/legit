import { ref } from 'vue'
import type { TableColumn, SortState, SortDirection } from '~/types/ui/table'

export const useTableSorting = (
    props: {
        sortBy?: string
        sortDirection?: SortDirection
    },
    emit: (event: string, ...args: any[]) => void
) => {
    const sortState = ref<SortState>({
        columnKey: props.sortBy,
        direction: props.sortDirection,
    })

    const handleSort = (column: TableColumn, direction: 'asc' | 'desc' | undefined) => {
        sortState.value = {
            columnKey: direction !== undefined ? column.key : '',
            direction,
        }
        emit('sort', { ...sortState.value })
    }

    const isColumnSorted = (column: TableColumn) => {
        return sortState.value.columnKey === column.key && sortState.value.direction !== undefined
    }

    const getColumnSortDirection = (column: TableColumn) => {
        return isColumnSorted(column) ? sortState.value.direction : undefined
    }

    const currentSortState = (column: TableColumn) => {
        if (!isColumnSorted(column)) return 'none'
        return sortState.value.direction === 'asc' ? 'ascending' : 'descending'
    }

    return {
        sortState,
        handleSort,
        isColumnSorted,
        getColumnSortDirection,
        currentSortState,
    }
}
