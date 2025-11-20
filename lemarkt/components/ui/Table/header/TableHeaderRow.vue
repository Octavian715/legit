<template>
    <thead class="sticky top-0">
        <tr class="bg-blue-50 border-b border-gray-600 space-x-2">
            <!-- Select All Checkbox -->
            <th v-if="showSelectAll" class="w-10 h-10 p-3 text-center" scope="col">
                <Checkbox
                    v-tooltip="t('selectAll')"
                    :model-value="selectedAll"
                    :aria-label="t('selectAll')"
                    :indeterminate="isIndeterminate"
                    @change="$emit('toggle-select-all', !selectedAll)"
                />
            </th>
            <!-- Column Headers -->
            <th
                v-for="(column, index) in columns"
                :key="column.key"
                class="p-3 text-body font-normal text-gray-950 break-words overflow-hidden"
                :class="[
                    { 'cursor-pointer hover:bg-blue-150': column.sortable },
                    column.className || '',
                    column.classes || '',
                    getHeaderTextAlign(column, index),
                ]"
                :aria-sort="isColumnSorted(column) ? currentSortState(column) : undefined"
                scope="col"
                @click="handleSort(column)"
            >
                <span
                    v-tooltip="column.sortable ? sortingTooltipLabel : column.label"
                    class="flex items-center transition-transform gap-1 w-fit"
                    :class="headerCellClass(column, index)"
                >
                    {{ column.label }}

                    <SortIcon
                        v-if="column.sortable"
                        :active="isColumnSorted(column)"
                        :direction="getColumnSortDirection(column)"
                        :aria-label="`${t('sortBy')} ${column.label}`"
                    />
                </span>
            </th>

            <!-- Expansion Column -->
            <th v-if="hasRowExpansion" class="w-10 p-3 text-body text-gray-950" scope="col"></th>
        </tr>
    </thead>
</template>

<script setup lang="ts">
    import { ref, computed } from 'vue'
    import type { TableColumn, SortState } from '~/types/ui/table'

    const { t } = useI18n()

    // Define props with defaults
    const props = withDefaults(
        defineProps<{
            columns: TableColumn[]
            showSelectAll?: boolean
            hasRowExpansion?: boolean
            isIndeterminate: boolean
            selectedAll?: boolean
            sortState: SortState
        }>(),
        {
            showSelectAll: false,
            hasRowExpansion: false,
            isIndeterminate: false,
            selectedAll: false,
        }
    )

    // Define emits
    const emit = defineEmits<{
        (e: 'sort', column: TableColumn, direction: 'asc' | 'desc' | undefined): void
        (e: 'toggle-select-all', value: boolean): void
    }>()

    // Track click count per column
    const clickCount = ref<Record<string, number>>({})

    // Determine if a column is sorted
    const isColumnSorted = (column: TableColumn) => {
        return props.sortState.columnKey === column.key && props.sortState.direction !== undefined
    }

    // Get the sort direction for a specific column
    const getColumnSortDirection = (column: TableColumn) => {
        return isColumnSorted(column) ? props.sortState.direction : undefined
    }

    // Map sort state to ARIA values
    const currentSortState = (column: TableColumn) => {
        if (!isColumnSorted(column)) return 'none'
        return props.sortState.direction === 'asc' ? 'ascending' : 'descending'
    }
    const sortingTooltipLabel = computed(() => {
        let direction = t('ascendent').toLowerCase()

        switch (props.sortState.direction) {
            case 'asc':
                direction = t('descendent').toLowerCase()
                break
        }

        if (props.sortState.direction === 'desc') {
            return t('clickToStopSort')
        }
        return t('clickToSortDirection', { direction })
    })
    // Handle sort logic with 3-click cycle
    const handleSort = (column: TableColumn) => {
        if (!column.sortable) return

        const columnKey = column.key
        clickCount.value[columnKey] = (clickCount.value[columnKey] || 0) + 1

        let direction: 'asc' | 'desc' | undefined

        switch (clickCount.value[columnKey] % 3) {
            case 1: // First click: Ascending
                direction = 'asc'
                break
            case 2: // Second click: Descending
                direction = 'desc'
                break
            case 0: // Third click: Disable sort
                direction = undefined
                clickCount.value[columnKey] = 0 // Reset click count
                break
        }

        emit('sort', column, direction)

        // Update sortState in parent component if needed
        if (direction === undefined) {
            clickCount.value[columnKey] = 0 // Reset click count when sort is disabled
        }
    }

    // Header cell alignment classes for flex container (aligns text and icon)
    const headerCellClass = (column: TableColumn, index: number) => {
        const isLastColumn = index === props.columns.length - 1

        let align = column.align || 'left'

        if (isLastColumn && !column.align) {
            align = 'right'
        }

        // For flex containers, justify-content aligns items along main axis
        // Also add margin-left auto for right alignment to move the flex item itself
        return {
            'justify-start': align === 'left',
            'justify-center': align === 'center',
            'justify-end': align === 'right',
            'ml-auto': align === 'right', // ✅ Moves the flex span to the right!
            'mx-auto': align === 'center', // ✅ Centers the flex span
        }
    }

    // Text alignment classes for th element (using hardcoded classes for Tailwind)
    const getHeaderTextAlign = (column: TableColumn, index: number) => {
        const isLastColumn = index === props.columns.length - 1

        let align = column.align || 'left'

        if (isLastColumn && !column.align) {
            align = 'right'
        }

        // Return object with hardcoded Tailwind classes instead of dynamic string
        return {
            'text-left': align === 'left',
            'text-center': align === 'center',
            'text-right': align === 'right',
        }
    }
</script>
