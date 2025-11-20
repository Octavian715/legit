import type { TableRow } from '~/types/ui/table'
import { ref, computed } from 'vue'

export const useSelection = () => {
    const selectedItems = ref<Set<TableRow>>(new Set())

    const selectedCount = computed(() => selectedItems.value.size)
    const toggleSelection = (item: any) => {
        if (selectedItems.value.has(item)) {
            selectedItems.value.delete(item)
        } else {
            selectedItems.value.add(item)
        }
    }

    const clearSelected = () => {
        selectedItems.value.clear()
    }

    return {
        selectedItems,
        selectedCount,
        toggleSelection,
        clearSelected,
    }
}
