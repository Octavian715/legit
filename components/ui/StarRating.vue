<template>
    <div
        class="star-rating flex items-center gap-1 transition-all"
        :class="[disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer']"
    >
        <!-- Star Rating Display -->
        <span
            v-for="(star, index) in maxStars"
            :key="star"
            v-tooltip="`${++index}`"
            class="star transition-colors duration-200"
            :class="[
                star <= hoverRating || star <= currentRating ? 'text-yellow-500' : 'text-gray-400',
                sizeClasses[size],
                !disabled && 'hover:scale-110 cursor-pointer',
            ]"
            @mouseover="handleMouseOver(star)"
            @mouseleave="handleMouseLeave"
            @click="handleClick(star)"
        >
            ★
        </span>

        <!-- Reviews Information -->
        <span
            v-if="viewReviews"
            v-tooltip="`${currentRating}/${maxStars}`"
            class="ml-2 text-caption1 text-gray-800"
        >
            {{ currentRating }}/{{ maxStars }}
        </span>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed } from 'vue'
    import type { StarRatingType } from '~/types/ui/rating'

    const props = withDefaults(defineProps<StarRatingType>(), {
        maxStars: 5,
        size: 'md',
        rating: 0,
        viewReviews: true,
        disabled: false,
    })

    const emit = defineEmits<{
        (e: 'update:rating', value: number): void
    }>()

    const hoverRating = ref(0)
    const currentRating = computed(() => props.rating)

    const sizeClasses: Record<string, string> = {
        sm: 'text-sm',
        md: 'text-xl',
        lg: 'text-2xl',
    }

    const handleMouseOver = (value: number) => {
        if (props.disabled) return
        hoverRating.value = value
    }

    const handleMouseLeave = () => {
        if (props.disabled) return
        hoverRating.value = 0
    }

    const handleClick = (value: number) => {
        if (props.disabled) return
        emit('update:rating', value)
    }
</script>

<style scoped>
    .star:hover ~ .star {
        @apply text-gray-400;
    }
</style>
