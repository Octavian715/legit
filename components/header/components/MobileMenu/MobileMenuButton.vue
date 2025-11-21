<template>
    <button
        type="button"
        class="w-full flex items-center justify-between p-3 text-subtitle1 rounded border transition-colors"
        :class="[
            isActive
                ? 'bg-red-50 text-red-500 border-red-500 font-bold'
                : 'bg-white text-gray-950 border-gray-400 font-medium',
            disabled
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-red-50 hover:text-red-500 hover:border-red-500',
        ]"
        :disabled="disabled"
        @click="handleClick"
    >
        <div class="flex items-center gap-3">
            <div class="flex items-center justify-center w-6 h-6">
                <svg class="w-5 h-5">
                    <use :xlink:href="`/sprite.svg#${icon}`"></use>
                </svg>
            </div>
            <span class="truncate">{{ label }}</span>
        </div>

        <span
            v-if="badge"
            class="bg-gray-400 px-2 py-0.5 rounded text-caption1 leading-4 text-white"
        >
            {{ badge }}
        </span>
    </button>
</template>

<script setup lang="ts">
    interface Props {
        icon: string
        label: string
        isActive?: boolean
        disabled?: boolean
        badge?: string
    }

    const props = withDefaults(defineProps<Props>(), {
        isActive: false,
        disabled: false,
        badge: '',
    })

    const emit = defineEmits<{
        click: [event: MouseEvent]
    }>()

    const handleClick = (event: MouseEvent) => {
        if (!props.disabled) {
            emit('click', event)
        }
    }
</script>
