<template>
    <span class="text-body text-gray-950" :class="[classes]" v-text="text" />
</template>

<script setup lang="ts">
    import { computed } from 'vue'

    const props = withDefaults(
        defineProps<{
            cellOptions?: object
            cellValue?: string | number | any[]
        }>(),
        {
            cellOptions: () => ({ classes: '' }),
            cellValue: '',
        }
    )

    const text = computed(() => {
        const value = Array.isArray(props.cellValue) ? props.cellValue.join(', ') : props.cellValue
        return value || '-'
    })

    const classes = computed(() => {
        return props.cellOptions?.classes || ''
    })
</script>
