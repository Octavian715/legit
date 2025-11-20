<template>
    <td class="px-4 py-2">
        <select
            :value="cellValue"
            class="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            :disabled="disabled"
            @change="$emit('update:modelValue', $event.target.value)"
        >
            <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
            <option
                v-for="option in cellOptions.options"
                :key="option.value"
                :value="option.value"
                :disabled="option.disabled"
            >
                {{ option.label }}
            </option>
        </select>
    </td>
</template>

<script setup lang="ts">
    interface SelectOption {
        value: string | number
        label: string
        disabled?: boolean
    }

    interface CellOptions {
        options: SelectOption[]
    }

    const props = withDefaults(
        defineProps<{
            cellOptions?: CellOptions
            cellValue?: string | number
            disabled?: boolean
            placeholder?: string
        }>(),
        {
            cellOptions: () => ({ options: [] }),
            cellValue: '',
            disabled: false,
            placeholder: '',
        }
    )

    const emit = defineEmits<{
        (e: 'update:modelValue', value: string | number): void
        (
            e: 'value-changed',
            payload: {
                oldValue: string | number
                newValue: string | number
            }
        ): void
    }>()
</script>
