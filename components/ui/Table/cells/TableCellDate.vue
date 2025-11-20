<template>
    <span v-tooltip="formattedValue" class="whitespace-nowrap text-gray-950">
        {{ formattedValue }}
    </span>
</template>

<script setup lang="ts">
    import { computed } from 'vue'
    import { useDate } from '~/composables/useDate'

    const props = withDefaults(
        defineProps<{
            cellOptions?: object
            cellValue?: string | number | Date | null
        }>(),
        {
            cellOptions: () => ({}),
            cellValue: null,
        }
    )

    const { formatDate } = useDate()

    const formattedValue = computed(() => {
        if (!props.cellValue) return '-'

        try {
            return formatDate(props.cellValue, 'dd.MM.yyyy')
        } catch (e) {
            console.warn('Invalid date value:', props.cellValue)
            return '-'
        }
    })
</script>
