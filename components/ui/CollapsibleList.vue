<!-- components/ui/CollapsibleList.vue -->
<template>
    <div class="collapsible-list">
        <!-- Empty State -->
        <div
            v-if="items.length === 0"
            class="empty-state text-center py-12 px-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
        >
            <!-- Empty Icon -->
            <div class="mx-auto w-16 h-16 mb-4 flex items-center justify-center">
                <Icon :name="emptyIcon" class="w-12 h-12 text-gray-400" />
            </div>

            <!-- Empty Title -->
            <h3 class="text-title3 font-semibold text-gray-900 mb-2">
                {{ emptyTitle }}
            </h3>

            <!-- Empty Subtitle -->
            <p class="text-body2 text-gray-600 mb-6 max-w-sm mx-auto">
                {{ emptySubtitle }}
            </p>

            <!-- Add Button -->
            <Button
                variant="filled"
                color="blue"
                size="lg"
                :label="addButtonText"
                :disabled="disabled"
                @click="handleAdd"
            />
        </div>

        <!-- Items List -->
        <div v-else class="space-y-3">
            <div
                v-for="(item, index) in items"
                :key="getItemKey(item, index)"
                class="collapsible-item"
            >
                <slot
                    name="item"
                    :item="item"
                    :index="index"
                    :is-editing="editingIndex === index"
                    :on-edit="() => handleEdit(index, item)"
                    :on-delete="() => handleDelete(index)"
                    :on-save="(data: any) => handleSave(index, data)"
                    :on-cancel="() => handleCancel()"
                />
            </div>

            <!-- Add Another Button -->
            <div class="add-button-container pt-4">
                <Button
                    variant="outlined"
                    color="blue"
                    size="lg"
                    :label="addButtonText"
                    :disabled="disabled"
                    class="w-full"
                    @click="handleAdd"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue'

    interface Props {
        items: any[]
        disabled?: boolean
        addButtonText?: string
        emptyTitle?: string
        emptySubtitle?: string
        emptyIcon?: string
        itemKey?: string
    }

    const props = withDefaults(defineProps<Props>(), {
        disabled: false,
        addButtonText: 'Add Item',
        emptyTitle: 'No items added yet',
        emptySubtitle: 'Add your first item to get started',
        emptyIcon: 'plus-circle',
        itemKey: 'id',
    })

    const emit = defineEmits<{
        (e: 'add'): void
        (e: 'edit', index: number, item: any): void
        (e: 'delete', index: number): void
        (e: 'update', index: number, item: any): void
    }>()

    // State
    const editingIndex = ref<number | null>(null)

    // Methods
    const handleAdd = () => {
        if (!props.disabled) {
            emit('add')
        }
    }

    const handleEdit = (index: number, item: any) => {
        if (!props.disabled) {
            editingIndex.value = index
            emit('edit', index, item)
        }
    }

    const handleDelete = (index: number) => {
        if (!props.disabled) {
            // Reset editing state if deleting currently edited item
            if (editingIndex.value === index) {
                editingIndex.value = null
            }
            emit('delete', index)
        }
    }

    const handleSave = (index: number, data: any) => {
        editingIndex.value = null
        emit('update', index, data)
    }

    const handleCancel = () => {
        editingIndex.value = null
    }

    const getItemKey = (item: any, index: number): string | number => {
        if (props.itemKey && item[props.itemKey] !== undefined) {
            return item[props.itemKey]
        }
        return index
    }
</script>

<style scoped>
    .space-y-3 > * + * {
        margin-top: 0.75rem;
    }

    .empty-state {
        background-image: url("data:image/svg+xml,%3csvg width='60' height='60' viewBox='0 0 60 60' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath opacity='0.1' fill-rule='evenodd' clip-rule='evenodd' d='m36 28 8-8v12l-8-4Z' fill='%2399a1aa'/%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: top 1rem center;
        background-size: 60px 60px;
    }
</style>
