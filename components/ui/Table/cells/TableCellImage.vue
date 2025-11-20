<template>
    <div class="text-body text-center text-gray-950">
        <img v-if="imageUrl" :src="imageUrl" :class="classes" />
        <span :class="[classes]" v-text="text" />
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue'

    const props = withDefaults(
        defineProps<{
            cellOptions?: object
            cellValue?: any
        }>(),
        {
            cellOptions: () => ({ classes: '' }),
            cellValue: '',
        }
    )

    const text = computed(() => {
        const value = props.cellValue?.code
        return value || '-'
    })
    const imageUrl = computed(() => {
        const value = props.cellValue?.barcodeUrl
        return value || null
    })

    const classes = computed(() => {
        return props.cellOptions?.classes || ''
    })
</script>
