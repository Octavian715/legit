<template>
    <div
        :class="['radio-wrapper flex items-center', { 'cursor-not-allowed': readOnly }]"
        @click="handleClick"
        @mouseenter="onHover"
        @mouseleave="onLeave"
    >
        <label
            :for="name"
            :class="[
                'flex items-center gap-2 select-none',
                { 'cursor-not-allowed': readOnly, 'cursor-pointer': !readOnly },
                bodyClass,
            ]"
        >
            <span
                class="w-4 h-4 rounded-full border transition-colors duration-200 relative flex items-center justify-center flex-shrink-0 px-auto"
                :class="{
                    'border-gray-600 bg-gray-100 hover:': !isChecked && !readOnly,
                    'border-blue-500 hover:border-blue-300': isChecked,
                    'border-gray-300': !isChecked && readOnly,
                    '!border-blue-300': isHovered && !readOnly,
                }"
            >
                <span
                    v-if="isChecked"
                    :class="[
                        'radio-circle',
                        'w-2 h-2 rounded-full bg-blue-500 hover:bg-blue-300 flex-shrink-0',
                        { '!bg-blue-300': isHovered && isChecked },
                    ]"
                ></span>
            </span>

            <span
                v-if="$slots.default || label"
                :class="{
                    'text-gray-950': !readOnly,
                    'text-gray-400': readOnly,
                }"
            >
                <slot>
                    {{ label }}
                </slot>
            </span>
        </label>
    </div>
</template>

<script setup lang="ts">
    import type { RadioType } from '~/types/ui/radio'

    const props = withDefaults(defineProps<RadioType>(), {
        label: '',
        name: () => useId(),
        readOnly: false,
        test: '',
        containerClass: '',
        modelValue: null,
    })

    const emit = defineEmits(['update:modelValue', 'change'])
    const isHovered = ref(false)

    const toggleChecked = () => {
        if (!props.readOnly) {
            emit('update:modelValue', props.value)
            emit('change', props.value)
        }
    }

    const bodyClass = computed(() => {
        return props.containerClass
    })

    const isChecked = computed(() => {
        const currentValue = props.modelValue === undefined ? null : props.modelValue
        return currentValue === props.value
    })

    const handleClick = () => {
        if (!props.readOnly) {
            toggleChecked()
        }
    }

    const onHover = () => {
        if (!props.readOnly) {
            isHovered.value = true
        }
    }

    const onLeave = () => {
        isHovered.value = false
    }
</script>
