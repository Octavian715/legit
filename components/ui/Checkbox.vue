<template>
    <div class="flex gap-2">
        <div
            v-tooltip="hintMessage ? `${hintMessage}` : undefined"
            role="checkbox"
            :aria-checked="modelValue"
            :aria-disabled="disabled"
            :class="[
                'flex items-center checkbox-wrapper group focus-visible:outline-none',
                {
                    'cursor-not-allowed opacity-75': disabled,
                    'cursor-pointer': !disabled,
                },
            ]"
            tabindex="0"
            @click="handleClick"
            @keydown.space.prevent="toggleChecked"
        >
            <input
                ref="checkboxInput"
                type="checkbox"
                :name="name"
                :checked="modelValue"
                :disabled="disabled"
                class="sr-only"
                @change="toggleChecked"
            />
            <label
                :for="name"
                class="flex items-center select-none gap-2"
                :class="{ 'cursor-not-allowed': disabled }"
            >
                <span
                    class="rounded border flex items-center justify-center relative transition-colors duration-150 delay-100"
                    :class="[
                        checkboxClasses,
                        sizeClasses,
                        {
                            'group-hover:border-blue-300 border-gray-600 ':
                                !disabled && !modelValue && !indeterminate,
                            'group-hover:bg-blue-300 border-blue-500 hover:border-blue-300':
                                !disabled && (modelValue || indeterminate),
                        },
                    ]"
                >
                    <Transition name="checkmark">
                        <svg
                            v-if="modelValue && !indeterminate"
                            class="w-3 h-3 text-white"
                            aria-hidden="true"
                        >
                            <use :xlink:href="`${spritePath}#check`" />
                        </svg>
                        <span v-else-if="indeterminate" class="w-2 h-0.5 bg-white rounded"></span>
                    </Transition>
                </span>

                <span
                    v-if="$slots.default || label"
                    class="label text-subtitle3 font-normal text-gray-950 hover:text-gray-800"
                    :class="[
                        {
                            'text-gray-400': disabled,
                            'whitespace-nowrap': wrap,
                            'break-words': !wrap,
                        },
                        modelValue && props.checkedLabelColor ? props.checkedLabelColor : '',
                    ]"
                    @mouseenter="handleLabelHover"
                    @mouseleave="handleLabelLeave"
                >
                    <slot>
                        {{ label }}
                    </slot>
                </span>
            </label>
        </div>
        <span
            v-if="props.info"
            v-tooltip="`${props.infoMessage}`"
            class="hover:text-blue-500 cursor-help"
            :class="[
                {
                    'text-gray-400': disabled,
                    'text-gray-950': !disabled && !modelValue,
                },
                modelValue && props.checkedLabelColor ? props.checkedLabelColor : '',
            ]"
        >
            <svg v-if="props.icon" class="w-4 h-4" aria-hidden="true">
                <use :xlink:href="`${spritePath}#${props.icon}`" />
            </svg>
        </span>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch } from 'vue'
    import type { CheckboxType } from '~/types/ui/checkbox'

    const props = withDefaults(defineProps<CheckboxType>(), {
        label: '',
        name: '',
        disabled: false,
        wrap: false,
        indeterminate: false,
        size: 'md',
        checkedLabelColor: '',
        info: false,
    })

    const emit = defineEmits<{
        (e: 'update:modelValue', value: boolean): void
        (e: 'change', value: boolean): void
    }>()

    const spritePath = '/sprite.svg'
    const isHovered = ref(false)
    const checkboxInput = ref<HTMLInputElement | null>(null)

    const checkboxClasses = computed(() => ({
        'border-gray-300': !props.modelValue && !props.indeterminate && !props.disabled,
        'bg-blue-500': (props.modelValue || props.indeterminate) && !props.disabled,
        // Disabled unchecked state
        'border-gray-300 bg-gray-100': props.disabled && !props.modelValue && !props.indeterminate,
        // Disabled checked state - use lighter blue to show it's checked but disabled
        'border-blue-300 bg-blue-300': props.disabled && (props.modelValue || props.indeterminate),
        'border-blue-300':
            ((props.modelValue || props.indeterminate) && !props.disabled && isHovered.value) ||
            (isHovered.value && !props.modelValue && !props.indeterminate),
    }))

    const sizeClasses = computed(() => {
        switch (props.size) {
            case 'sm':
                return 'min-w-3 w-3 h-3'
            case 'lg':
                return 'min-w-5 w-5 h-5'
            default:
                return 'min-w-4 w-4 h-4'
        }
    })

    const toggleChecked = () => {
        if (!props.disabled) {
            const newValue = !props.modelValue
            emit('update:modelValue', newValue)
            emit('change', newValue)
        }
    }

    const handleClick = (event: MouseEvent) => {
        if (!props.disabled) {
            toggleChecked()
            ;(event.currentTarget as HTMLElement)?.focus()
        }
    }

    const handleLabelHover = () => {
        if (!props.disabled) {
            isHovered.value = true
        }
    }

    const handleLabelLeave = () => {
        isHovered.value = false
    }

    watch(
        () => props.indeterminate,
        (newValue) => {
            if (checkboxInput.value) {
                checkboxInput.value.indeterminate = newValue
            }
        },
        { immediate: true }
    )
</script>

<style scoped>
    .checkmark-enter-active,
    .checkmark-leave-active {
        transition:
            transform 0.15s ease,
            opacity 0.15s ease;
    }

    .checkmark-enter-from {
        transform: translateY(-100%);
        opacity: 0;
    }

    .checkmark-enter-to {
        transform: translateY(0);
        opacity: 1;
    }

    .checkmark-leave-from {
        transform: translateY(0);
        opacity: 1;
    }

    .checkmark-leave-to {
        transform: translateY(100%);
        opacity: 0;
    }
</style>
