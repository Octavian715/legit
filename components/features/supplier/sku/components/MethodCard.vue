<template>
    <div
        class="flex flex-col items-center text-center gap-3 p-4 border rounded-md cursor-pointer transition-all duration-200 hover:shadow-md"
        :class="cardClasses"
    >
        <!-- Icon -->
        <svg class="w-12 h-12 text-gray-800" :class="iconClasses">
            <use :xlink:href="`/sprite.svg#${icon}`"></use>
        </svg>

        <!-- Content -->
        <div class="text-gray-950 text-subtitle2 flex items-center">
            <div>
                <strong>{{ title }}</strong>
                <span v-if="description"> - {{ description }}</span>
            </div>
        </div>

        <div class="w-full">
            <Button
                :label="buttonLabel"
                :color="buttonColor"
                variant="filled"
                size="md"
                class="w-full"
                @click.stop="handleSelect"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
    interface Props {
        icon: string
        title: string
        description?: string
        buttonColor: 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'gray'
        buttonLabel: string
        selected?: boolean
        estimatedTime?: string
        disabled?: boolean
    }

    const props = withDefaults(defineProps<Props>(), {
        description: '',
        selected: false,
        estimatedTime: '',
        disabled: false,
    })

    const emit = defineEmits<{
        select: []
    }>()

    const { t } = useI18n()

    // Computed classes
    const cardClasses = computed(() => [
        {
            // Selected state
            'border-blue-500 bg-blue-50 shadow-md': props.selected && !props.disabled,

            // Default state
            'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50':
                !props.selected && !props.disabled,

            // Disabled state
            'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed': props.disabled,

            // Focus state for accessibility
            'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-50':
                !props.disabled,
        },
    ])

    const iconClasses = computed(() => [
        {
            'text-blue-600': props.selected && !props.disabled,
            'text-gray-800': !props.selected && !props.disabled,
            'text-gray-400': props.disabled,
        },
    ])

    // Methods
    const handleSelect = () => {
        if (!props.disabled) {
            emit('select')
        }
    }

    // Keyboard accessibility
    const handleKeydown = (event: KeyboardEvent) => {
        if ((event.key === 'Enter' || event.key === ' ') && !props.disabled) {
            event.preventDefault()
            handleSelect()
        }
    }
</script>

<style scoped>
    /* Additional hover effects */
    .method-card:hover:not(.disabled) {
        transform: translateY(-1px);
    }

    .method-card.selected {
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    }

    /* Smooth animations */
    .method-card {
        transition: all 0.2s ease-in-out;
    }
</style>
