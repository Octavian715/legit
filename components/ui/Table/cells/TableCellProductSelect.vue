<!-- components/ui/table/cells/TableCellProductSelect.vue -->
<template>
    <div class="flex items-center gap-3 min-w-0 group relative">
        <!-- Product Image -->
        <div class="w-12 h-12 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
            <img
                v-if="productData.image"
                :src="productData.image"
                :alt="productData.name"
                class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
                <svg
                    class="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                </svg>
            </div>
        </div>

        <!-- Product Info -->
        <div class="flex-1 min-w-0">
            <p
                class="text-subtitle2 font-semibold text-gray-950 truncate"
                :title="productData.name"
            >
                {{ productData.name || '-' }}
            </p>
            <p class="text-subtitle3 text-gray-700 truncate">
                {{ t('orders.sections.documentPositions.columns.sku') }}:
                {{ productData.sku || '-' }}
            </p>
        </div>

        <!-- Edit Button -->
        <button
            v-if="editable"
            type="button"
            class="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
            :title="t('orders.sections.documentPositions.changeProduct')"
            @click="handleEditClick"
        >
            <svg
                class="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
            </svg>
        </button>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue'

    interface ProductData {
        name: string
        sku: string
        image?: string
    }

    const props = withDefaults(
        defineProps<{
            cellOptions?: {
                editable?: boolean
            }
            cellValue?: ProductData | string
            rowId?: string
            row?: any
        }>(),
        {
            cellOptions: () => ({ editable: true }),
            cellValue: () => ({ name: '', sku: '', image: '' }),
            rowId: '',
            row: null,
        }
    )

    const emit = defineEmits<{
        'edit-product': [payload: { rowId: string; row: any }]
    }>()

    const { t } = useI18n()

    const editable = computed(() => props.cellOptions?.editable !== false)

    const productData = computed((): ProductData => {
        const value = props.cellValue

        if (typeof value === 'string') {
            return { name: value, sku: '', image: '' }
        }

        if (typeof value === 'object' && value !== null) {
            return value as ProductData
        }

        return { name: '', sku: '', image: '' }
    })

    const handleEditClick = () => {
        emit('edit-product', {
            rowId: props.rowId,
            row: props.row,
        })
    }
</script>
