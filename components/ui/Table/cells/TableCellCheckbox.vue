<template>
    <div v-if="isLoaded" class="w-full">
        <Checkbox v-model="localValue" :label="localLabel" :wrap="true" class="w-full" />
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, onMounted } from 'vue'
    import type { TableColumn } from '~/types/ui/table'

    const props = withDefaults(
        defineProps<{
            cellOptions?: TableColumn
            cellValue?: boolean | number
        }>(),
        {
            cellOptions: () => ({ allElements: [], width: '50px' }) as TableColumn,
            cellValue: false,
        }
    )

    const isLoaded = ref(false)
    const localValue = ref(props.cellValue)

    const localLabel = computed(() => {
        return props.cellOptions?.checkboxLabel || ''
    })

    watch(
        () => props.cellValue,
        (newValue) => {
            localValue.value = newValue
        }
    )

    onMounted(() => {
        isLoaded.value = true
    })
</script>
