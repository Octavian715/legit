<template>
    <div
        class="relative w-full h-full flex items-center justify-end text-gray-950 text-body px-2 py-1 max-h-8"
        :class="{
            'cursor-pointer group': !isEditing,
            'ring-inset rounded-sm': isEditing,
        }"
        @click="enableEdit"
    >
        <!-- Display Mode -->
        <div v-if="!isEditing" class="flex items-center justify-between w-full">
            <span class="transition-colors">
                {{ formattedValue }}
            </span>
            <svg
                class="w-4 h-4 ml-2 opacity-0 text-gray-800 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0"
            >
                <use xlink:href="/sprite.svg#edit2"></use>
            </svg>
        </div>

        <!-- Edit Mode -->
        <div v-else class="relative w-full h-full flex items-center">
            <input
                ref="inputRef"
                v-model.lazy="editValue"
                type="text"
                inputmode="decimal"
                :min="minValue"
                :max="maxValue"
                :step="stepValue"
                class="w-full h-full bg-transparent focus:outline-none text-right pr-6"
                @blur="handleBlur"
                @keydown.enter.prevent="handleEnter"
                @keydown.escape.prevent="cancelEdit"
                @keydown.up.prevent="incrementValue"
                @keydown.down.prevent="decrementValue"
            />

            <!-- Increment/Decrement Controls -->
            <div class="absolute right-0 top-0 bottom-0 flex flex-col w-4">
                <button
                    type="button"
                    class="flex-1 flex items-center justify-center hover:bg-gray-400 text-gray-950 hover:text-gray-800 transition-colors duration-150"
                    tabindex="-1"
                    @mousedown.prevent="incrementValue"
                    @click.stop
                >
                    <svg class="w-3 h-3 fill-current rotate-180">
                        <use xlink:href="/sprite.svg#a_down"></use>
                    </svg>
                </button>
                <button
                    type="button"
                    class="flex-1 flex items-center justify-center hover:bg-gray-400 text-gray-950 hover:text-gray-800 transition-colors duration-150"
                    tabindex="-1"
                    @mousedown.prevent="decrementValue"
                    @click.stop
                >
                    <svg class="w-3 h-3 fill-current">
                        <use xlink:href="/sprite.svg#a_down"></use>
                    </svg>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    interface Props {
        value: number
        currencySymbol?: string
        editable?: boolean
        columnKey?: string
        rowId?: string
        row?: any
        cellOptions?: {
            min?: number
            max?: number
            step?: number
            currencySymbol?: string
            editable?: boolean
        }
    }

    const props = withDefaults(defineProps<Props>(), {
        value: 0,
        currencySymbol: '',
        editable: true,
        columnKey: '',
        rowId: '',
        row: null,
        cellOptions: () => ({}),
    })

    const emit = defineEmits<{
        'cell-edit': [
            payload: {
                rowId: string
                column: string
                value: number
                row: any
            },
        ]
    }>()

    const isEditing = ref(false)
    const editValue = ref('')
    const inputRef = ref<HTMLInputElement | null>(null)
    const isSaving = ref(false)

    const symbol = computed(() => props.cellOptions?.currencySymbol || props.currencySymbol || '')
    const minValue = computed(() => props.cellOptions?.min ?? 0.01)
    const maxValue = computed(() => props.cellOptions?.max ?? undefined)
    const stepValue = computed(() => props.cellOptions?.step ?? 1)

    const formattedValue = computed(() => {
        const numValue = props.value ?? 0
        const formatted = numValue.toFixed(2)
        return symbol.value ? `${formatted}${symbol.value}` : formatted
    })

    const enableEdit = () => {
        if (!props.editable || isEditing.value) return

        isEditing.value = true
        editValue.value = props.value.toString()

        nextTick(() => {
            if (inputRef.value) {
                inputRef.value.focus()
                inputRef.value.select()
            }
        })
    }

    const clampValue = (value: number): number => {
        let clampedValue = value

        if (minValue.value !== undefined && clampedValue < minValue.value) {
            clampedValue = minValue.value
        }

        if (maxValue.value !== undefined && clampedValue > maxValue.value) {
            clampedValue = maxValue.value
        }

        return clampedValue
    }

    const saveValue = async () => {
        if (isSaving.value) return

        isSaving.value = true

        try {
            const parsedValue = parseFloat(editValue.value)
            const newValue = clampValue(isNaN(parsedValue) ? minValue.value : parsedValue)

            // Round to step precision
            const decimalPlaces = stepValue.value.toString().split('.')[1]?.length || 2
            const roundedValue = parseFloat(newValue.toFixed(decimalPlaces))

            if (roundedValue !== props.value) {
                emit('cell-edit', {
                    rowId: props.rowId,
                    column: props.columnKey,
                    value: roundedValue,
                    row: props.row,
                })
            }

            cancelEdit()
        } finally {
            isSaving.value = false
        }
    }

    const handleEnter = async () => {
        if (isSaving.value) return

        isSaving.value = true

        try {
            const parsedValue = parseFloat(editValue.value)
            const newValue = clampValue(isNaN(parsedValue) ? minValue.value : parsedValue)

            // Round to step precision
            const decimalPlaces = stepValue.value.toString().split('.')[1]?.length || 2
            const roundedValue = parseFloat(newValue.toFixed(decimalPlaces))

            if (roundedValue !== props.value) {
                emit('cell-edit', {
                    rowId: props.rowId,
                    column: props.columnKey,
                    value: roundedValue,
                    row: props.row,
                })
            }

            cancelEdit()
        } finally {
            isSaving.value = false
        }
    }

    const handleBlur = () => {
        if (!isSaving.value) {
            saveValue()
        }
    }

    const cancelEdit = () => {
        isEditing.value = false
        editValue.value = ''
    }

    const incrementValue = () => {
        const currentValue = parseFloat(editValue.value) || 0
        const newValue = clampValue(currentValue + 1)
        editValue.value = newValue.toString()

        // Keep focus on input
        nextTick(() => {
            if (inputRef.value) {
                inputRef.value.focus()
            }
        })
    }

    const decrementValue = () => {
        const currentValue = parseFloat(editValue.value) || 0
        const newValue = clampValue(currentValue - 1)
        editValue.value = newValue.toString()

        // Keep focus on input
        nextTick(() => {
            if (inputRef.value) {
                inputRef.value.focus()
            }
        })
    }

    watch(
        () => props.value,
        () => {
            if (isEditing.value && !isSaving.value) {
                cancelEdit()
            }
        }
    )
</script>

<style scoped>
    /* Hide native number input spinners */
    input[type='number']::-webkit-inner-spin-button,
    input[type='number']::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    input[type='number'] {
        -moz-appearance: textfield;
        appearance: textfield;
    }
</style>
