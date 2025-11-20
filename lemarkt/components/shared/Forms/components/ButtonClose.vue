<template>
    <ButtonIcon
        icon="close"
        :size="size"
        :icon-size="iconSize"
        color="red"
        variant="ghost"
        :disabled="disabled"
        container-classes="!text-gray-950 hover:!text-red-500"
        @click="handleClick"
    />
</template>

<script setup lang="ts">
    import { defineProps, defineEmits } from 'vue'

    // Define props
    const props = defineProps({
        variant: {
            type: String as () => 'primary' | 'secondary' | 'blue' | 'green' | 'danger' | 'default',
            default: 'primary',
        },
        size: {
            type: String,
            default: 'lg',
        },
        iconSize: {
            type: String,
            default: 'lg',
        },
        disabled: {
            type: Boolean,
            default: false,
        },
    })

    // Define emits
    const emit = defineEmits(['click'])

    // Handle click event
    const handleClick = () => {
        if (!props.disabled) {
            emit('click')
        }
    }
</script>
