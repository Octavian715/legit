<template>
    <div class="table-header flex items-center justify-between px-3 py-2">
        <div>
            <h4 v-if="hasTitle || $slots.title" class="text-gray-950 text-title3 font-bold">
                <slot name="title">
                    {{ title }}
                </slot>
            </h4>

            <p v-if="hasSubTitle || $slots.subtitle" class="text-gray-800 text-subtitle3 mt-1">
                <slot name="subtitle">
                    {{ subTitle }}
                </slot>
            </p>
        </div>

        <div class="flex items-center gap-3">
            <Button v-if="showAddItemButton" variant="filled" @click="addItem">
                {{ addItemLabel }}
            </Button>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue'

    const props = withDefaults(
        defineProps<{
            title?: string
            subTitle?: string
            addItemLabel?: string
            showAddItemButton?: boolean
        }>(),
        {
            title: '',
            subTitle: '',
            addItemLabel: 'Add Item',
            showAddItemButton: false,
        }
    )

    const emit = defineEmits<{
        (e: 'add-item'): void
        (e: 'update:itemsPerPage', value: number): void
    }>()

    const hasTitle = computed(() => !!props.title.trim())
    const hasSubTitle = computed(() => !!props.subTitle.trim())

    const addItem = () => {
        emit('add-item')
    }
</script>

<style lang="scss" scoped></style>
