<template>
    <div class="table-base rounded-sm" :class="[background]" :data-test="test">
        <TableHeader
            v-if="title || subTitle || showAddItemButton"
            :title="title"
            :sub-title="subTitle"
            :show-add-item-button="showAddItemButton"
            :add-item-label="addItemLabel"
            @add-item="handleAddItem"
        />
        <div
            class="table-base__wrapper rounded-sm border border-gray-600 overflow-hidden"
            :class="wrapperClass"
        >
            <div class="table-base__scroll-wrapper overflow-x-auto overflow-y-auto">
                <table
                    class="table-base__table min-w-full border-collapse border-gray-600 rounded-sm"
                    :class="{ 'table-base__table--bordered': showColumnBorders }"
                    :style="{ tableLayout: fixedLayout ? 'fixed' : 'auto' }"
                    :aria-busy="loading"
                >
                    <colgroup>
                        <col v-if="showSelectAll" style="width: 40px" />
                        <col
                            v-for="column in visibleColumns"
                            :key="column.key"
                            :style="getColumnStyle(column)"
                        />
                        <col v-if="hasRowExpansion" style="width: 40px" />
                    </colgroup>

                    <TableHeaderRow
                        :columns="visibleColumns"
                        :selected-count="selectedCount"
                        :show-select-all="showSelectAll"
                        :has-row-expansion="hasRowExpansion"
                        :is-indeterminate="isIndeterminate"
                        :selected-all="allSelected"
                        :sort-state="sortState"
                        @sort="handleSort"
                        @toggle-select-all="toggleAllSelection"
                    >
                        <template #title>
                            <slot name="title"></slot>
                        </template>
                    </TableHeaderRow>

                    <!-- Locked State -->
                    <tbody v-if="locked" class="table-base__content">
                        <tr>
                            <td :colspan="totalColumnsCount" class="text-center py-16">
                                <div class="flex flex-col items-center justify-center w-full">
                                    <div class="text-gray-600 mb-4">
                                        <svg class="w-16 h-16 mx-auto">
                                            <use xlink:href="/sprite.svg#lock"></use>
                                        </svg>
                                    </div>
                                    <h3 class="text-subtitle2 font-bold text-gray-950 mb-4">
                                        {{ t('subscription.featureNotAvailable') }}
                                    </h3>

                                    <Button
                                        font-weight="normal"
                                        size="md"
                                        variant="filled"
                                        color="blue"
                                        :label="t('subscription.upgradePlan')"
                                        @click="handleUpgradeClick"
                                    />
                                </div>
                            </td>
                        </tr>
                    </tbody>

                    <tbody v-else-if="!loading" class="table-base__content">
                        <tr v-if="selectedCount > 0" class="table-row">
                            <th
                                :colspan="totalColumnsCount"
                                class="p-3 font-normal text-subtitle3 bg-white text-blue-500"
                            >
                                <div class="flex items-center justify-between">
                                    <span>
                                        {{ $t('selectedOf', { n: selectedCount, y: totalItems }) }}
                                    </span>

                                    <Button
                                        font-weight="normal"
                                        size="md"
                                        variant="filled"
                                        color="red"
                                        @click="handleDeleteSelected"
                                    >
                                        <div class="flex gap-1">
                                            <svg class="w-4 h-4">
                                                <use xlink:href="/sprite.svg#delete"></use>
                                            </svg>
                                            {{ t('delete') }}
                                        </div>
                                    </Button>
                                </div>
                            </th>
                        </tr>

                        <tr v-if="!displayRows.length">
                            <td :colspan="totalColumnsCount" class="text-center py-12">
                                <div class="flex flex-col items-center justify-center w-full">
                                    <slot name="empty">
                                        <!-- <NuxtImg
                                            src="/images/content/no-found-products.svg"
                                            width="120"
                                            height="120"
                                            alt="No data"
                                        /> -->
                                        <img
                                            src="/images/content/no-found-products.svg"
                                            width="120px"
                                            height="120px"
                                            alt="No data"
                                        />

                                        <p class="text-subtitle2 font-bold text-gray-950 my-2">
                                            {{ t('noData') }}
                                        </p>
                                        <p class="text-gray-800 font-bold text-body my-2">
                                            {{ t('noDataSubtitle') }}
                                        </p>
                                    </slot>
                                </div>
                            </td>
                        </tr>

                        <template v-for="(item, index) in displayRows" :key="item.id">
                            <TableRow
                                :row="item"
                                :columns="visibleColumns"
                                :index="index"
                                :border="showColumnBorders"
                                :is-selected="isRowSelected(item)"
                                :is-expanded="isRowExpanded(item)"
                                :show-select-all="showSelectAll"
                                :has-row-expansion="hasRowExpansion"
                                :actions="actions"
                                :editing-cell="editingCell"
                                @selection-changed="toggleSingleSelection"
                                @toggle-expansion="toggleRowExpansion"
                                @cell-clicked="handleCellEvent('cell-clicked', $event)"
                                @cell-hover="handleCellEvent('cell-hover', $event)"
                                @cell-leave="handleCellEvent('cell-leave', $event)"
                                @actions="handleRowAction"
                                @start-edit="handleStartEdit"
                                @save-edit="handleSaveEdit"
                                @cancel-edit="handleCancelEdit"
                                @cell-edit="handleCellEdit"
                            />

                            <tr
                                v-if="(hasRowExpansion && isRowExpanded(item)) || extendedRow"
                                :class="{
                                    'border-b  border-gray-400': extendedRow,
                                    'bg-gray-150': extendedRow,
                                }"
                            >
                                <td :colspan="totalColumnsCount" class="p-0">
                                    <div
                                        class="expansion-content"
                                        :class="{
                                            'bg-gray-150': isRowSelected(item),
                                            // 'bg-white': !isRowSelected(item),
                                        }"
                                    >
                                        <slot name="row-expansion" :item="item" :index="index">
                                            <div class="p-4 bg-gray-50"></div>
                                        </slot>
                                    </div>
                                </td>
                            </tr>
                        </template>
                    </tbody>

                    <tbody v-else>
                        <tr
                            v-for="n in itemsPerPage"
                            :key="n"
                            class="bg-white border-t border-gray-400"
                        >
                            <td v-if="showSelectAll" class="w-10 p-3">
                                <div class="h-4 bg-gray-300 rounded animate-pulse"></div>
                            </td>
                            <td v-for="column in visibleColumns" :key="column.key" class="p-3">
                                <div class="h-4 bg-gray-300 rounded animate-pulse"></div>
                            </td>
                            <td v-if="hasRowExpansion" class="w-10 p-3">
                                <div class="h-4 bg-gray-300 rounded animate-pulse"></div>
                            </td>
                        </tr>
                    </tbody>

                    <tfoot v-if="$slots.footer">
                        <tr>
                            <td :colspan="totalColumnsCount">
                                <slot name="footer"></slot>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>

        <slot name="table-footer"> </slot>

        <!-- pagination-->
        <Pagination
            v-if="showPagination"
            :current-page="currentPage"
            :items-per-page="itemsPerPage"
            :total-items="totalItems"
            @update:current-page="handlePaginationPageChange"
            @update:items-per-page="handlePaginationItemsChange"
        />
    </div>
</template>

<script setup lang="ts">
    import { watch } from 'vue'
    import { useTable } from '~/composables/table/useTable'
    import { useUpgradeModal } from '~/composables/useUpgradeModal'
    import type { TableColumn, TableRow, PaginationConfig } from '~/types/ui/table'

    const { t } = useI18n()
    const { openUpgradeModal } = useUpgradeModal()

    /**
     * Handle upgrade button click from locked state
     */
    const handleUpgradeClick = () => {
        if (props.featureName) {
            openUpgradeModal(props.featureName, 'upgrade')
        } else {
            openUpgradeModal(undefined, 'upgrade')
        }
    }

    const props = withDefaults(
        defineProps<{
            actions?: string[]
            selectable?: boolean
            columns: TableColumn[]
            rows?: TableRow[]
            hideColumn?: string[]
            height?: string
            indexed?: boolean
            loading?: boolean
            footer?: boolean
            addItemLabel?: string
            pagination?: boolean
            background?: string
            paginationConfig?: PaginationConfig
            title?: string
            subTitle?: string
            sortBy?: string
            sortDirection?: 'asc' | 'desc' | undefined
            expandable?: boolean
            test?: string
            enableCellEvents?: boolean
            extendedRow?: boolean
            wrapperClass?: string
            editableColumns?: string[]
            fixedLayout?: boolean
            showColumnBorders?: boolean
            locked?: boolean // Feature is locked due to plan restrictions
            featureName?: string // Name of locked feature for upgrade prompt
        }>(),
        {
            actions: () => [],
            selectable: false,
            rows: () => [],
            hideColumn: () => [],
            height: '',
            indexed: false,
            loading: false,
            footer: false,
            addItemLabel: '',
            pagination: false,
            paginationConfig: () => ({
                currentPage: 1,
                itemsPerPage: 20,
                totalItems: 0,
            }),
            title: '',
            subTitle: '',
            expandable: false,
            test: '',
            enableCellEvents: false,
            extendedRow: false,
            background: 'bg-white',
            editableColumns: () => [],
            fixedLayout: true,
            showColumnBorders: false,
        }
    )

    const emit = defineEmits<{
        (e: 'sort', state: any): void
        (e: 'add-item'): void
        (e: 'edit-item', payload: { row: TableRow }): void
        (e: 'cell-clicked', payload: { row: TableRow; column: TableColumn }): void
        (e: 'cell-hover', payload: { row: TableRow; column: TableColumn }): void
        (e: 'cell-leave', payload: { row: TableRow; column: TableColumn }): void
        (e: 'chat', payload: { row: TableRow }): void
        (e: 'download', payload: { row: TableRow }): void
        (e: 'edit', payload: { row: TableRow }): void
        (e: 'delete', payload: { row: TableRow }): void
        (e: 'show', payload: { row: TableRow }): void
        (e: 'print', payload: { row: TableRow }): void
        (e: 'show-profile', payload: { row: TableRow }): void
        (e: 'disconnect', payload: { row: TableRow }): void
        (e: 'product-status', payload: { row: TableRow }): void
        (e: 'product-prices', payload: { row: TableRow }): void
        (e: 'view-pdf', payload: { row: TableRow }): void
        (e: 'product-features', payload: { row: TableRow }): void
        (e: 'cancel-disconnect', payload: { row: TableRow }): void
        (e: 'follow', payload: { row: TableRow }): void
        (e: 'unfollow', payload: { row: TableRow }): void
        (e: 'connect', payload: { row: TableRow }): void
        (e: 'accept', payload: { row: TableRow }): void
        (e: 'invite', payload: { row: TableRow }): void
        (e: 'selection-changed', selected: TableRow[]): void
        (e: 'change-tab', value: string | number): void
        (e: 'delete-selected', value: Array<any>): void
        (e: 'update:current-page', page: number): void
        (e: 'update:items-per-page', itemsPerPage: number): void
        (e: 'page-changed', page: number): void
        (e: 'items-per-page-changed', itemsPerPage: number): void
        (
            e: 'cell-edit',
            payload: { rowId: string; column: string; value: any; row: TableRow }
        ): void
    }>()

    const editingCell = ref<{ rowId: string; column: string } | null>(null)

    const getColumnStyle = (column: TableColumn) => {
        const style: Record<string, string> = {}

        if (column.width) {
            style.width = column.width
        }
        if (column.minWidth) {
            style.minWidth = column.minWidth
        }
        if (column.maxWidth) {
            style.maxWidth = column.maxWidth
        }

        return style
    }

    const handleStartEdit = (payload: { rowId: string; column: string }) => {
        if (props.editableColumns.includes(payload.column)) {
            editingCell.value = payload
        }
    }

    const handleSaveEdit = (payload: {
        rowId: string
        column: string
        value: any
        row: TableRow
    }) => {
        if (editingCell.value) {
            const row = displayRows.value.find((r) => r.id === payload.rowId)
            if (row) {
                emit('cell-edit', { ...payload, row })
            }
            editingCell.value = null
        }
    }

    const handleCancelEdit = () => {
        editingCell.value = null
    }

    const handleCellEdit = (payload: {
        rowId: string
        column: string
        value: any
        row: TableRow
    }) => {
        emit('cell-edit', payload)
    }

    const {
        visibleColumns,
        displayRows,
        getColumnWidth,
        showSelectAll,
        showAddItemButton,
        hasRowExpansion,
        showPagination,
        totalColumnsCount,
        selectedCount,
        allSelected,
        isIndeterminate,
        toggleAllSelection,
        toggleSingleSelection,
        handleDeleteSelected,
        isRowSelected,
        sortState,
        handleSort,
        toggleRowExpansion,
        isRowExpanded,
        currentPage,
        itemsPerPage,
        totalItems,
        updatePaginationConfig,
        handleCellEvent,
        handleRowAction,
        handleAddItem,
    } = useTable(props, emit)

    // Enhanced pagination event handlers
    const handlePaginationPageChange = (page: number) => {
        // Update internal state
        currentPage.value = page

        // Emit events for parent components
        emit('update:current-page', page)
        emit('page-changed', page)
    }

    const handlePaginationItemsChange = (items: number) => {
        // Update internal state
        itemsPerPage.value = items

        // Emit events for parent components
        emit('update:items-per-page', items)
        emit('items-per-page-changed', items)
    }

    // Watch for paginationConfig changes from parent and sync internal state
    watch(
        () => props.paginationConfig,
        (newConfig) => {
            if (newConfig) {
                updatePaginationConfig(newConfig)
            }
        },
        { deep: true, immediate: true }
    )

    // Watch for rows changes to update totalItems for client-side pagination
    watch(
        () => props.rows,
        (newRows) => {
            // Only update totalItems if it matches the current rows length (client-side pagination)
            if (newRows && props.paginationConfig?.totalItems === totalItems.value) {
                updatePaginationConfig({
                    ...props.paginationConfig,
                    totalItems: newRows.length,
                })
            }
        },
        { immediate: true }
    )
</script>

<style lang="scss" scoped>
    .table-base {
        &__wrapper--sticky {
            @apply sticky top-0;
        }

        &__table {
            width: 100%;

            &--bordered {
                th,
                td {
                    @apply border-r border-gray-400;

                    &:last-child {
                        @apply border-r-0;
                    }
                }
            }
        }

        &__row {
            @apply border-t border-gray-600;

            &--stripped {
                @apply bg-gray-50;
            }

            .expand-button {
                transform: rotate(0deg);
                transition: transform 0.2s ease-in-out;

                &.expanded {
                    transform: rotate(180deg);
                }
            }

            &--extend,
            tr[aria-expanded='true'] {
                @apply bg-gray-50;
            }
        }

        &__cell {
            @apply p-3 text-subtitle3 text-gray-800 align-middle;

            &:not(:last-child),
            &:not(:first-child) {
                @apply px-1.5;
            }

            &:active span {
                @apply scale-95;
            }

            &:first-child {
                @apply pl-3;
            }

            &:last-child {
                @apply pr-3;
            }

            &--header {
                @apply p-3 text-gray-950 text-subtitle3 cursor-pointer text-left;

                &:first-child {
                    @apply pl-3;
                }

                &:last-child {
                    @apply pr-3;
                }
            }

            &.start {
                @apply text-left;
            }
            &.center {
                @apply text-center;
            }
            &.right {
                @apply text-right;
            }

            span {
                @apply flex items-center;
            }

            &:hover .sort-icon {
                stroke: #0057ff;
            }
        }

        &__pagination {
            @apply flex justify-between items-center mt-4;
        }

        sort-icon {
            @apply ml-2;
            transition: stroke 0.2s ease;
        }

        .sort-active {
            @apply text-blue-600;
        }
    }

    .expand-button {
        @apply p-1 rounded-sm hover:bg-gray-100 transition-colors;

        svg {
            @apply transition-transform duration-200;
        }
    }

    .editing-cell {
        @apply bg-blue-50 border-blue-300;
    }

    .editable-cell {
        @apply cursor-pointer hover:bg-gray-50 transition-colors;
    }
</style>
