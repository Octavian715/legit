<template>
    <tr
        class="table-row border-t border-gray-600 p-0 m-0"
        :class="{ rowClasses, 'border-0': border, 'bg-gray-150': isExpanded }"
        :aria-expanded="isExpanded"
    >
        <td
            v-if="showSelectAll"
            class="table-row__cell start-0 w-10 min-w-10 max-w-10 text-center p-0"
            :class="[
                isExpanded || isSelected ? 'bg-blue-50' : 'bg-white',
                { 'border border-gray-600': border },
            ]"
            scope="col"
        >
            <Checkbox
                :model-value="isSelected"
                :aria-label="`Select row ${index + 1}`"
                class="flex justify-center items-center w-full"
                @change="$emit('selection-changed', row)"
            />
        </td>

        <td
            v-for="column in columns"
            :key="column.key"
            :class="[
                column.view === 'TableCellEditableSelect' ? '' : 'table-row__cell',
                `table-row__cell--${column.align || 'left'}`,
                {
                    'first:border-0 border-l border-gray-600': border,
                    'table-row__cell--interactive': column.sortable,
                },
                isExpanded ? 'bg-gray-150' : null,
                'p-0 m-0 box-border',
            ]"
            :style="{ width: 'auto' }"
            @click="
                column.view !== 'TableCellEditableSelect' && emitCellEvent('cell-clicked', column)
            "
            @mouseover="emitCellEvent('cell-hover', column)"
            @mouseleave="emitCellEvent('cell-leave', column)"
        >
            <component
                :is="getCellComponent(column.view)"
                :label="column.label"
                :cell-value="getCellValue(column.key)"
                :cell-options="column.cellOptions || column"
                :row="row"
                :actions="column.view === 'TableCellActions' ? actions : undefined"
                :value="getNumericValue(column)"
                :currency-symbol="
                    column.view === 'TableCellEditablePrice'
                        ? column.cellOptions?.currencySymbol || ''
                        : undefined
                "
                :editable="
                    column.view === 'TableCellEditablePrice' ||
                    column.view === 'TableCellEditableSelect'
                        ? column.cellOptions?.editable !== false
                        : undefined
                "
                :options="
                    column.view === 'TableCellEditableSelect'
                        ? column.cellOptions?.options || []
                        : undefined
                "
                :searchable="
                    column.view === 'TableCellEditableSelect'
                        ? column.cellOptions?.searchable !== false
                        : undefined
                "
                :placeholder="
                    column.view === 'TableCellEditableSelect'
                        ? column.cellOptions?.placeholder || 'Select...'
                        : undefined
                "
                :column-key="
                    column.view === 'TableCellEditablePrice' ||
                    column.view === 'TableCellEditableSelect' ||
                    column.view === 'TableCellProductSelect'
                        ? column.key
                        : undefined
                "
                :row-id="
                    column.view === 'TableCellEditablePrice' ||
                    column.view === 'TableCellEditableSelect' ||
                    column.view === 'TableCellProductSelect'
                        ? row.id
                        : undefined
                "
                @actions="handleCellAction"
                @start-edit="$emit('start-edit', $event)"
                @save-edit="$emit('save-edit', $event)"
                @cancel-edit="$emit('cancel-edit', $event)"
                @cell-edit="handleCellEdit(column.key, $event)"
                @edit-product="$emit('edit-product', $event)"
            />
        </td>

        <td
            v-if="hasRowExpansion"
            class="table-row__cell table-row__cell--expansion w-10 min-w-10 max-w-10 text-right"
        >
            <button
                class="table-row__expand-button"
                :class="{ 'table-row__expand-button--expanded': isExpanded }"
                :aria-label="expansionButtonLabel"
                @click="$emit('toggle-expansion', row)"
            >
                <svg
                    class="table-row__expand-icon"
                    :class="{ 'table-row__expand-icon--expanded': isExpanded }"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                >
                    <path
                        fill="currentColor"
                        d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"
                    />
                </svg>
            </button>
        </td>
    </tr>
</template>

<script setup lang="ts">
    import { computed } from 'vue'
    import type { TableColumn, TableRow } from '~/types/ui/table'
    import TableCellText from '../cells/TableCellText.vue'
    import TableCellCheckbox from '../cells/TableCellCheckbox.vue'
    import TableCellSelect from '../cells/TableCellSelect.vue'
    import TableCellDate from '../cells/TableCellDate.vue'
    import TableCellCertificateDate from '../cells/TableCellCertificateDate.vue'
    import TableCellActions from '../cells/TableCellActions.vue'
    import TableCellEditablePrice from '../cells/TableCellEditablePrice.vue'
    import TableCellEditableSelect from '../cells/TableCellEditableSelect.vue'
    import TableCellBusinessType from '../cells/TableCellBusinessType.vue'
    import TableCellCompany from '../cells/TableCellCompany.vue'
    import TableCellCountry from '../cells/TableCellCountry.vue'
    import TableCellLanguages from '../cells/TableCellLanguages.vue'
    import TableCellStatus from '../cells/TableCellStatus.vue'
    import TableCellProductSelect from '../cells/TableCellProductSelect.vue'
    import TableCellImage from '../cells/TableCellImage.vue'

    const props = withDefaults(
        defineProps<{
            row: TableRow
            columns: TableColumn[]
            index: number
            isSelected?: boolean
            isExpanded?: boolean
            showSelectAll?: boolean
            hasRowExpansion?: boolean
            border?: boolean
            actions: string[]
        }>(),
        {
            isSelected: false,
            isExpanded: false,
            showSelectAll: false,
            border: false,
            hasRowExpansion: false,
            actions: () => [],
        }
    )

    const emit = defineEmits<{
        (e: 'selection-changed', selected: TableRow): void
        (e: 'toggle-expansion', row: TableRow): void
        (e: 'cell-clicked', payload: { row: TableRow; column: TableColumn }): void
        (e: 'cell-hover', payload: { row: TableRow; column: TableColumn }): void
        (e: 'cell-leave', payload: { row: TableRow; column: TableColumn }): void
        (e: 'actions', payload: { type: string; row: TableRow }): void
        (e: 'edit-product', payload: { rowId: string; row: TableRow }): void
        (
            e: 'cell-edit',
            payload: { rowId: string; column: string; value: any; row: TableRow }
        ): void
    }>()

    const rowClasses = computed(() => ({
        'bg-blue-50': props.isSelected || props.isExpanded,
    }))

    const expansionButtonLabel = computed(() => (props.isExpanded ? 'Collapse row' : 'Expand row'))

    const getCellComponent = (view: string | undefined) => {
        const components = {
            TableCellText,
            TableCellCheckbox,
            TableCellSelect,
            TableCellDate,
            TableCellCertificateDate,
            TableCellActions,
            TableCellEditablePrice,
            TableCellEditableSelect,
            TableCellBusinessType,
            TableCellCompany,
            TableCellLanguages,
            TableCellCountry,
            TableCellStatus,
            TableCellProductSelect,
            TableCellImage,
        }
        return components[view as keyof typeof components] || TableCellText
    }

    const getCellValue = (columnKey: string) => {
        if (!props.row || typeof props.row !== 'object') {
            console.warn('Row is null or not an object')
            return null
        }

        // Priority 1: Direct property access (your structure)
        if (columnKey in props.row) {
            const value = props.row[columnKey as keyof TableRow]
            return value
        }

        // Priority 2: Array-based row structure (fallback)
        if ('row' in props.row && Array.isArray(props.row.row)) {
            const columnIndex = props.columns.findIndex((col) => col.key === columnKey)
            const value = columnIndex !== -1 ? props.row.row[columnIndex] : null
            return value
        }

        console.warn(`Key ${columnKey} not found in row`)
        return null
    }

    const getNumericValue = (column: TableColumn) => {
        if (column.view !== 'TableCellEditablePrice' && column.view !== 'TableCellEditableSelect') {
            return undefined
        }

        const value = getCellValue(column.key)

        if (value === null || value === undefined) {
            return 0
        }

        if (typeof value === 'number') {
            return value
        }

        const numValue = Number(value)
        return isNaN(numValue) ? 0 : numValue
    }

    const emitCellEvent = (
        event: 'cell-clicked' | 'cell-hover' | 'cell-leave',
        column: TableColumn
    ) => {
        emit(event, { row: props.row, column })
    }

    const handleCellAction = (payload: { type: string; row: TableRow }) => {
        emit('actions', payload)
    }

    const handleCellEdit = (columnKey: string, payload: any) => {
        emit('cell-edit', {
            rowId: props.row.id,
            column: columnKey,
            value: payload.value !== undefined ? payload.value : payload,
            row: props.row,
        })
    }
</script>

<style lang="scss" scoped>
    .table-row {
        &__cell {
            @apply p-3 text-subtitle3 text-gray-800 align-middle;

            &--select {
                @apply w-10 min-w-10 max-w-10 text-center;
            }

            &--expansion {
                @apply w-10 min-w-10 max-w-10 text-right;
            }

            &--left {
                @apply text-left;
            }

            &--center {
                @apply text-center;
            }

            &--right {
                @apply text-right;
            }
        }

        &__expand-button {
            @apply rounded hover:bg-gray-400 active:bg-gray-600 transition-colors duration-200 active:scale-95;
        }

        &__expand-icon {
            @apply transition-transform duration-200;

            &--expanded {
                @apply rotate-180;
            }
        }
    }
</style>
