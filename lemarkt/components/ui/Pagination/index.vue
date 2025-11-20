<template>
    <div class="pagination">
        <!-- Page Navigation - Centered -->
        <nav
            v-if="shouldShowPagination"
            class="pagination__nav"
            :aria-label="t('pagination', 'Pagination')"
        >
            <ul class="pagination__controls">
                <!-- Previous Button -->
                <li>
                    <Button
                        :disabled="currentPage === 1"
                        color="mix"
                        variant="filled"
                        square
                        size="md"
                        :aria-label="t('prevPage', 'Previous Page')"
                        container-classes="max-w-8 !p-2"
                        @click="previousPage"
                    >
                        <div>
                            <svg class="pagination__controls-button w-4 h-4">
                                <use xlink:href="/sprite.svg#a_left" />
                            </svg>
                        </div>
                    </Button>
                </li>

                <!-- Pagination Buttons -->
                <li v-for="(page, index) in paginationRange" :key="`page-${index}-${page.value}`">
                    <Button
                        v-if="page.type === 'page'"
                        :color="currentPage === page.value ? 'red' : 'mix'"
                        variant="filled"
                        :aria-current="currentPage === page.value ? 'page' : undefined"
                        square
                        size="md"
                        container-classes="max-w-8 !p-2"
                        :label="page.value.toString()"
                        @click="goToPage(page.value)"
                    />
                    <span v-else class="pagination__ellipsis text-body" aria-hidden="true"
                        >...</span
                    >
                </li>

                <!-- Next Button -->
                <li>
                    <Button
                        :disabled="currentPage === totalPages"
                        color="mix"
                        variant="filled"
                        square
                        size="md"
                        container-classes="max-w-8 !p-2"
                        :aria-label="t('nextPage', 'Next Page')"
                        @click="nextPage"
                    >
                        <div>
                            <svg class="pagination__controls-button w-4 h-4">
                                <use xlink:href="/sprite.svg#a_right" />
                            </svg>
                        </div>
                    </Button>
                </li>
            </ul>
        </nav>

        <!-- Items Per Page Dropdown - Right aligned -->
        <div v-if="shouldShowPagination" class="pagination__size">
            <PageItemsSelect
                :items-per-page="itemsPerPage"
                @update:items-per-page="handlePageSizeChange"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch } from 'vue'

    interface PaginationRangeItem {
        type: 'page' | 'ellipsis'
        value: number | string
    }

    const props = defineProps({
        currentPage: {
            type: Number,
            required: true,
            validator: (value: number) => value > 0,
        },
        itemsPerPage: {
            type: Number,
            required: true,
            validator: (value: number) => value > 0,
        },
        totalItems: {
            type: Number,
            required: true,
            validator: (value: number) => value >= 0,
        },
        maxVisiblePages: {
            type: Number,
            default: 5,
            validator: (value: number) => value >= 3,
        },
        minItemsToShowPagination: {
            type: Number,
            default: 0,
        },
    })

    const emit = defineEmits<{
        (e: 'update:currentPage', value: number): void
        (e: 'update:itemsPerPage', value: number): void
    }>()

    const { t } = useI18n()

    const localItemsPerPage = ref(props.itemsPerPage)

    watch(
        () => props.itemsPerPage,
        (newVal) => {
            localItemsPerPage.value = newVal
        },
        { immediate: true }
    )

    const handlePageSizeChange = (newSize: number) => {
        emit('update:itemsPerPage', newSize)
        if (props.currentPage !== 1) {
            emit('update:currentPage', 1)
        }
    }

    const totalPages = computed(() => {
        if (localItemsPerPage.value === 0) return 1
        if (props.totalItems === 0) return 1
        return Math.ceil(props.totalItems / localItemsPerPage.value)
    })

    const shouldShowPagination = computed(() => {
        return props.totalItems > props.minItemsToShowPagination || totalPages.value > 1
    })

    const paginationRange = computed<PaginationRangeItem[]>(() => {
        if (totalPages.value <= 1) {
            return [{ type: 'page', value: 1 }]
        }

        const safeMaxVisible = Math.max(3, props.maxVisiblePages)

        if (totalPages.value <= safeMaxVisible) {
            return range(1, totalPages.value).map((value) => ({
                type: 'page',
                value,
            }))
        }

        const current = Math.min(Math.max(1, props.currentPage), totalPages.value)
        const half = Math.floor(safeMaxVisible / 2)

        let start = Math.max(2, current - half)
        let end = Math.min(totalPages.value - 1, start + safeMaxVisible - 3)

        if (end - start < safeMaxVisible - 3) {
            start = Math.max(2, end - safeMaxVisible + 3)
        }

        const pages: PaginationRangeItem[] = [{ type: 'page', value: 1 }]

        if (start > 2) pages.push({ type: 'ellipsis', value: 'start-ellipsis' })
        pages.push(...range(start, end).map((value) => ({ type: 'page', value })))
        if (end < totalPages.value - 1) pages.push({ type: 'ellipsis', value: 'end-ellipsis' })

        if (totalPages.value > 1) {
            pages.push({ type: 'page', value: totalPages.value })
        }

        return pages
    })

    const goToPage = (page: number | string) => {
        if (typeof page === 'number') {
            const validPage = Math.max(1, Math.min(page, Math.max(1, totalPages.value)))
            if (validPage !== props.currentPage) {
                emit('update:currentPage', validPage)
            }
        }
    }

    const previousPage = () => {
        if (props.currentPage > 1) {
            goToPage(props.currentPage - 1)
        }
    }

    const nextPage = () => {
        if (props.currentPage < totalPages.value) {
            goToPage(props.currentPage + 1)
        }
    }

    const range = (start: number, end: number): number[] => {
        if (start > end) return []
        return Array.from({ length: end - start + 1 }, (_, i) => start + i)
    }
</script>

<style lang="scss" scoped>
    .pagination {
        @apply relative flex items-center justify-center w-full px-4 py-4;

        &__nav {
            @apply flex items-center justify-center flex-1;
        }

        &__controls {
            @apply flex items-center gap-1 list-none m-0 p-0;

            li {
                @apply flex items-center;
            }

            &-button {
                @apply w-4 h-4;
            }
        }

        &__ellipsis {
            @apply px-2 text-gray-500 select-none;
        }

        &__size {
            @apply absolute right-4 top-1/2 -translate-y-1/2 flex items-center;
        }
    }

    @media (max-width: 992px) {
        .pagination {
            @apply flex-col gap-4 py-6;

            &__nav {
                @apply w-full;
            }

            &__size {
                @apply relative right-auto top-auto translate-y-0;
            }
        }
    }

    @media (max-width: 480px) {
        .pagination {
            &__controls {
                @apply gap-0.5;

                :deep(.button) {
                    @apply px-2;
                }
            }
        }
    }
</style>
