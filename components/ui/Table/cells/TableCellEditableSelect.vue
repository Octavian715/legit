<template>
    <div
        class="relative w-full h-12 p-0 border-x border-gray-400 bg-gray-150 flex items-center group"
        :class="[classes]"
        @click.stop
    >
        <select
            :id="`select-${columnKey}-${rowId}`"
            ref="selectRef"
            v-model="internalValue"
            :disabled="!editable"
            :class="[
                'w-full px-3 py-2 text-subtitle3 font-normal bg-transparent appearance-none transition-all duration-200',
                'border-0 outline-none focus:outline-none',
                'disabled:bg-gray-100 disabled:text-gray-950 disabled:cursor-not-allowed',
                {
                    'cursor-pointer': editable,
                    'pr-8': editable,
                    'text-gray-950': hasValue,
                    'text-gray-500': !hasValue,
                },
            ]"
            @focus="handleFocus(true)"
            @blur="handleFocus(false)"
            @change="handleChange"
        >
            <option v-if="placeholder" value="" disabled selected hidden>
                {{ placeholder }}
            </option>
            <option v-for="option in formattedOptions" :key="option.value" :value="option.value">
                {{ option.displayLabel }}
            </option>
        </select>

        <div
            v-if="editable"
            class="absolute right-2 top-1/2 hover:text-gray-800 -translate-y-1/2 pointer-events-none transition-all duration-200"
            :class="{
                'text-gray-800': isFocused,
                'text-gray-600': !isFocused,
                'text-gray-400': !editable,
            }"
        >
            <svg
                class="w-4 h-4 transition-transform duration-200"
                :class="{ 'rotate-180': isFocused }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                />
            </svg>
        </div>
    </div>
</template>

<script setup lang="ts">
    interface SelectOption {
        value: any
        label: string
        code?: string
        symbol?: string
    }

    interface Props {
        value: any
        options: SelectOption[]
        editable?: boolean
        searchable?: boolean
        columnKey?: string
        rowId?: string
        row?: any
        classes?: string
        placeholder?: string
        showCode?: boolean
        showSymbol?: boolean
    }

    const props = withDefaults(defineProps<Props>(), {
        value: null,
        options: () => [],
        classes: '',
        editable: true,
        searchable: false,
        columnKey: '',
        rowId: '',
        row: null,
        placeholder: '',
        showCode: false,
        showSymbol: true,
    })

    const emit = defineEmits<{
        'cell-edit': [
            payload: {
                rowId: string
                column: string
                value: any
                row: any
            },
        ]
    }>()

    const selectRef = ref<HTMLSelectElement>()
    const internalValue = ref(props.value)
    const isFocused = ref(false)

    const formattedOptions = computed(() => {
        return props.options.map((option) => {
            let displayLabel = option.label

            if (props.showCode && option.code) {
                displayLabel += ` (${option.code})`
            }

            if (props.showSymbol && option.symbol) {
                displayLabel += ` ${option.symbol}`
            }

            return {
                ...option,
                displayLabel,
            }
        })
    })

    const hasValue = computed(() => {
        return (
            internalValue.value !== null &&
            internalValue.value !== '' &&
            internalValue.value !== undefined
        )
    })

    const handleFocus = (focused: boolean) => {
        isFocused.value = focused
    }

    const handleChange = () => {
        const newValue = internalValue.value

        if (newValue !== props.value) {
            emit('cell-edit', {
                rowId: props.rowId,
                column: props.columnKey,
                value: newValue === '' ? null : newValue,
                row: props.row,
            })
        }
    }

    watch(
        () => props.value,
        (newValue) => {
            internalValue.value = newValue
        }
    )
</script>

<style scoped lang="scss">
    select {
        &::-ms-expand {
            display: none;
        }
    }

    option {
        @apply text-subtitle2 text-gray-950 py-4 px-3 bg-white transition-colors duration-200;
        cursor: pointer;

        &:hover {
            @apply bg-red-500 text-white;
        }

        &:checked,
        &:focus {
            @apply bg-red-50 text-red-500;
        }

        &:disabled {
            @apply text-gray-400 bg-gray-100;
            cursor: not-allowed;
        }
    }
</style>
