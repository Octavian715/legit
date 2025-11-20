<template>
    <button
        class="ui-button-action flex items-center text-subtitle2 gap-1 text-blue-500 hover:text-blue-700 font-medium disabled:text-gray-300 leading-4"
        type="button"
        @click="handleClick"
    >
        <svg class="ui-button-action__icon">
            <use xlink:href="/sprite.svg#plus"></use>
        </svg>
        <slot>
            <span>{{ label }}</span>
        </slot>
    </button>
</template>

<script setup lang="ts">
    import { defineProps, defineEmits } from 'vue'

    // Define props
    defineProps({
        label: {
            type: String,

            default: 'Add a language',
        },
    })

    // Define emits
    const emit = defineEmits(['click'])

    // Handle click event
    const handleClick = () => {
        emit('click')
    }
</script>

<style scoped lang="scss">
    .ui-button-action {
        @apply cursor-pointer transition duration-200 w-fit;

        &__icon {
            @apply w-4 h-4;
        }
        &:active {
            @apply text-blue-800 scale-95;
        }

        &:hover {
            @apply text-blue-800;
        }
    }
</style>
