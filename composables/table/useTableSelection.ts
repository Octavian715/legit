import { computed } from 'vue'
import { useSelection } from '~/composables/useSelection'
import type { TableRow } from '~/types/ui/table'

export const useTableSelection = (
    processedRows: Ref<TableRow[]>,
    emit: (event: string, ...args: any[]) => void
) => {
    const {
        selectedItems: selectedRows,
        selectedCount,
        toggleSelection,
        clearSelected,
    } = useSelection<TableRow>()

    const allSelected = computed({
        get: () => {
            return (
                processedRows.value.length > 0 &&
                processedRows.value.every((item) => selectedRows.value.has(item))
            )
        },
        set: (value: boolean) => {
            const items = processedRows.value
            if (value) {
                items.forEach((item) => selectedRows.value.add(item))
            } else {
                items.forEach((item) => selectedRows.value.delete(item))
            }
        },
    })

    const isIndeterminate = computed(() => {
        const items = processedRows.value
        return items.some((item) => selectedRows.value.has(item)) && !allSelected.value
    })

    const toggleAllSelection = (select: boolean) => {
        if (select) {
            processedRows.value.forEach((item) => {
                toggleSelection(item)
            })
        } else {
            clearSelected()
        }

        allSelected.value = select
        emit('selection-changed', Array.from(selectedRows.value))
    }

    const toggleSingleSelection = (row: TableRow) => {
        toggleSelection(row)
        emit('selection-changed', Array.from(selectedRows.value))
    }

    const handleDeleteSelected = () => {
        emit('delete-selected', Array.from(selectedRows.value))
        clearSelected()
    }

    const isRowSelected = (row: TableRow) => selectedRows.value.has(row)

    return {
        selectedRows,
        selectedCount,
        allSelected,
        isIndeterminate,
        toggleAllSelection,
        toggleSingleSelection,
        handleDeleteSelected,
        isRowSelected,
        clearSelected,
    }
}
