<template>
    <div class="switcher flex items-center gap-2">
        <label class="switch relative inline-flex items-center w-7 h-4 cursor-pointer">
            <input
                type="checkbox"
                :checked="modelValue"
                :disabled="disabled"
                class="sr-only peer"
                @change="toggleSwitch"
            />
            <span
                class="slider absolute inset-0 rounded-full transition-all duration-300 ease-in-out"
                :class="{
                    'bg-blue-500': modelValue && !disabled,
                    'bg-gray-300': !modelValue && !disabled,
                    'bg-gray-200 cursor-not-allowed': disabled,
                }"
            >
                <span
                    class="dot absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-300 ease-in-out"
                    :class="{
                        'left-0.5': !modelValue,
                        'left-[14px]': modelValue && !disabled,
                    }"
                ></span>
            </span>
        </label>
        <span v-if="label" class="text-gray-900 font-normal">{{ label }}</span>
    </div>
</template>

<script setup lang="ts">
    import type { SwitchType } from '~/types/ui/switch'

    const props = withDefaults(defineProps<SwitchType>(), {
        disabled: false,
        label: '',
    })

    const emit = defineEmits<{
        (e: 'update:modelValue', value: boolean): void
    }>()

    // Handle toggle event
    const toggleSwitch = (event: Event) => {
        if (!props.disabled) {
            const target = event.target as HTMLInputElement
            emit('update:modelValue', target.checked)
        }
    }
</script>

<style scoped>
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
    }
</style>
