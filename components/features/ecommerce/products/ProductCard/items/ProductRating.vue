<template>
    <div>
        <StarRating v-model:rating="props.rating" :max-stars="5" @update:rating="updateRating" />
    </div>
</template>
<script setup lang="ts">
    import { defineProps, defineEmits, withDefaults } from 'vue'

    const props = withDefaults(
        defineProps<{
            rating: number
        }>(),
        {
            rating: 0,
        }
    )

    const emit = defineEmits<{
        (e: 'update-rating', value: number): void
    }>()

    const updateRating = (value: number) => {
        emit('update-rating', value)
    }
</script>
