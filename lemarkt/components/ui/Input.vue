<template>
    <div class="w-full flex flex-col gap-1">
        <div
            class="relative border rounded transition-colors duration-300"
            :class="[
                sizeClasses[size],
                background,
                {
                    'border-red-500': hasError,
                    'border-gray-600 hover:border-gray-800': !hasError,
                    'bg-gray-100 cursor-not-allowed': disabled,
                },
            ]"
        >
            <label
                :for="inputId"
                class="absolute left-3 transition-all duration-200 whitespace-nowrap overflow-hidden text-ellipsis pointer-events-none max-w-[calc(100%-3rem)]"
                :class="[
                    isFocused || hasValue
                        ? 'text-caption1 text-gray-800'
                        : 'text-subtitle2 text-gray-600',
                    { 'cursor-not-allowed': disabled },
                    labelPositionClass,
                    hasError ? 'text-red-500' : null,
                ]"
            >
                {{ label }}
                <span v-if="required" class="text-red-500">*</span>
            </label>

            <div class="h-full">
                <input
                    :id="inputId"
                    ref="inputRef"
                    :name="name"
                    :type="inputType"
                    :value="displayValue"
                    :disabled="disabled"
                    :min="type === 'number' ? Number(min) : undefined"
                    :max="type === 'number' ? Number(max) : undefined"
                    :step="type === 'number' ? Number(step) : undefined"
                    :maxlength="type !== 'number' ? maxlength : undefined"
                    :aria-invalid="hasError"
                    :aria-required="required"
                    :aria-describedby="
                        hasError ? `${inputId}-error` : explain ? `${inputId}-explain` : undefined
                    "
                    :autocomplete="computedAutocomplete"
                    :placeholder="placeholder"
                    class="w-full h-full mt-auto border-none bg-transparent focus:outline-none"
                    :class="[
                        defaultInputClass,
                        inputPaddingClass,
                        {
                            'text-red-500': hasError,
                            'text-gray-950': !hasError,
                            'cursor-not-allowed': disabled,
                            'pr-8': (type === 'password' && showPasswordToggle) || copy,
                        },
                    ]"
                    @focus="handleFocus"
                    @blur="handleBlur"
                    @input="handleInput"
                    @keydown="handleKeyDown"
                />

                <div
                    v-if="(type === 'password' && showPasswordToggle) || copy"
                    class="absolute top-1/2 right-3 flex items-center gap-2 -translate-y-1/2"
                >
                    <button
                        v-if="type === 'password' && showPasswordToggle"
                        type="button"
                        class="p-1 text-gray-600 hover:text-blue-500 transition-colors"
                        :aria-label="showPassword ? 'Hide password' : 'Show password'"
                        @click="togglePasswordVisibility"
                    >
                        <svg class="w-4 h-4">
                            <use :xlink:href="`/sprite.svg#${showPassword ? 'hide' : 'eye'}`"></use>
                        </svg>
                    </button>
                    <button
                        v-if="copy"
                        type="button"
                        class="p-1 transition-colors"
                        :class="
                            hasValue
                                ? 'text-gray-600 hover:text-blue-500'
                                : 'text-gray-300 cursor-not-allowed'
                        "
                        :disabled="!hasValue"
                        :aria-label="'Copy to clipboard'"
                        @click="copyToClipboard"
                    >
                        <svg class="w-6 h-6">
                            <use xlink:href="/sprite.svg#copy"></use>
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <div v-if="hasError || explain" class="flex items-start gap-1 text-caption1 mx-1">
            <svg
                class="w-3 h-3 mt-0.5 flex-shrink-0"
                :class="hasError ? 'text-red-500' : 'text-gray-600'"
            >
                <use xlink:href="/sprite.svg#warn-error"></use>
            </svg>
            <span
                :id="hasError ? `${inputId}-error` : `${inputId}-explain`"
                :class="hasError ? 'text-red-500' : 'text-gray-600'"
                class="break-words"
            >
                {{ displayMessage }}
            </span>
        </div>

        <div
            v-if="maxlength !== undefined && type !== 'number'"
            class="text-caption1 mx-1 text-right"
            :class="isOverLimit ? 'text-red-500' : 'text-gray-600'"
        >
            {{ inputValueLength }}/{{ maxlength }}
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed } from 'vue'
    import type { InputType } from '~/types/ui/input'
    import { useInputValidation } from '~/composables/useInputValidation'

    const props = withDefaults(defineProps<InputType>(), {
        name: 'input',
        type: 'text',
        label: '',
        size: 'lg',
        background: 'bg-transparent',
        required: false,
        disabled: false,
        error: '',
        errorMessage: '',
        explain: '',
        maxlength: undefined,
        min: undefined,
        max: undefined,
        step: 1,
        copy: false,
        showPasswordToggle: true,
        autocomplete: null,
        modelValue: null as string | number | null | undefined,
        placeholder: '',
        decimalPlaces: undefined,
        allowNegative: true,
        strictNumber: true, // ✅ FIX: Changed default to true for better validation
    })

    const emit = defineEmits(['update:modelValue', 'blur', 'focus', 'input', 'copy'])

    const inputId = ref(props.name || `input-${Math.random().toString(36).substr(2, 9)}`)
    const isFocused = ref(false)
    const showPassword = ref(false)
    const inputRef = ref<HTMLInputElement | null>(null)

    const { validateNumberInput, clampNumber } = useInputValidation()

    const modelValue = computed({
        get: () => props.modelValue,
        set: (value) => emit('update:modelValue', value),
    })

    // ✅ FIX: Improved hasValue detection
    const hasValue = computed(() => {
        if (props.type === 'number') {
            // Check if there's ANY value in the input, regardless of validity
            // This prevents label overlap even when user enters invalid characters
            const stringValue = String(props.modelValue ?? '')
            return (
                props.modelValue !== '' &&
                props.modelValue !== null &&
                props.modelValue !== undefined &&
                stringValue.trim().length > 0
            )
        }
        return !!String(props.modelValue || '').trim()
    })

    const displayValue = computed(() => {
        if (props.type === 'number') {
            if (
                props.modelValue === '' ||
                props.modelValue === null ||
                props.modelValue === undefined
            ) {
                return ''
            }
            return String(props.modelValue)
        }
        return props.modelValue ?? ''
    })

    const hasError = computed(() => !!(props.error || props.errorMessage))

    const displayMessage = computed(() => {
        if (props.error) {
            return typeof props.error === 'string' ? props.error : props.errorMessage
        }
        if (props.errorMessage) {
            return props.errorMessage
        }
        return props.explain
    })

    const isOverLimit = computed(
        () =>
            props.maxlength !== undefined && String(props.modelValue || '').length > props.maxlength
    )

    const defaultInputClass = computed(() => {
        return 'text-gray-950 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-moz-appearance:textfield]'
    })

    const sizeClasses = {
        lg: 'h-12 text-subtitle2',
        md: 'h-10 text-subtitle2',
        sm: 'h-8 text-body1',
    }

    const inputPaddingClass = computed(() => {
        return isFocused.value || hasValue.value ? 'pt-5 pb-1 px-3' : 'py-3 px-3'
    })

    const labelPositionClass = computed(() => {
        return isFocused.value || hasValue.value ? 'top-1' : 'top-1/2 -translate-y-1/2'
    })

    const inputValueLength = computed(() => String(props.modelValue || '').length)

    const inputType = computed(() => {
        if (props.type === 'password' && showPassword.value) {
            return 'text'
        }
        return props.type
    })

    const computedAutocomplete = computed(() => {
        if (props.autocomplete !== null) {
            return props.autocomplete
        }

        switch (props.type) {
            case 'email':
                return 'email'
            case 'password':
                return 'current-password'
            case 'tel':
                return 'tel'
            case 'url':
                return 'url'
            default:
                return 'off'
        }
    })

    const handleFocus = (event: Event) => {
        isFocused.value = true
        emit('focus', event)
    }

    /**
     * ✅ FIX: Prevents invalid key inputs for strict number mode
     * Properly handles negative numbers with text selection
     */
    const handleKeyDown = (event: KeyboardEvent) => {
        if (props.type === 'number' && props.strictNumber) {
            const key = event.key

            // Allow: backspace, delete, tab, escape, enter, arrows
            if (
                [
                    'Backspace',
                    'Delete',
                    'Tab',
                    'Escape',
                    'Enter',
                    'ArrowLeft',
                    'ArrowRight',
                    'ArrowUp',
                    'ArrowDown',
                    'Home',
                    'End',
                ].includes(key)
            ) {
                return
            }

            // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Cmd+A, Cmd+C, Cmd+V, Cmd+X
            if (
                (event.ctrlKey || event.metaKey) &&
                ['a', 'c', 'v', 'x', 'A', 'C', 'V', 'X'].includes(key)
            ) {
                return
            }

            // Block: e, E, + (scientific notation and plus sign)
            if (['e', 'E', '+'].includes(key)) {
                event.preventDefault()
                return
            }

            // Handle minus sign for negative numbers
            if (key === '-') {
                if (!props.allowNegative) {
                    event.preventDefault()
                    return
                }

                const target = event.target as HTMLInputElement
                const currentValue = target.value || ''
                const selectionStart = target.selectionStart || 0
                const selectionEnd = target.selectionEnd || 0
                const hasSelection = selectionStart !== selectionEnd

                if (currentValue === '') {
                    return
                }

                if (hasSelection) {
                    if (selectionStart === 0) {
                        return
                    }
                    event.preventDefault()
                    return
                }

                if (selectionStart === 0) {
                    if (!currentValue.includes('-')) {
                        return
                    }
                }

                event.preventDefault()
                return
            }

            // Block decimal point if decimalPlaces is 0
            if (key === '.' && props.decimalPlaces === 0) {
                event.preventDefault()
                return
            }

            // Allow only one decimal point
            if (key === '.') {
                const target = event.target as HTMLInputElement
                const currentValue = target.value || ''
                if (currentValue.includes('.')) {
                    event.preventDefault()
                    return
                }
            }

            // Allow only numbers and decimal point
            if (!/^\d$/.test(key) && key !== '.') {
                event.preventDefault()
            }
        }
    }

    const handleInput = (event: Event) => {
        const target = event.target as HTMLInputElement
        let value: string | number | null = target.value

        if (props.type === 'number') {
            if (value === '' || value === null) {
                emit('update:modelValue', null)
                emit('input', null)
                return
            }

            // Use strict validation if strictNumber is enabled
            if (props.strictNumber) {
                const validation = validateNumberInput(String(value), {
                    min: props.min,
                    max: props.max,
                    decimalPlaces: props.decimalPlaces,
                    allowNegative: props.allowNegative,
                    strictNumber: props.strictNumber,
                })

                // Update the input field with sanitized value
                if (validation.sanitizedValue !== value) {
                    target.value = validation.sanitizedValue
                }

                // Emit the numeric value or sanitized string
                const emitValue =
                    validation.numericValue !== null
                        ? validation.numericValue
                        : validation.sanitizedValue

                emit('update:modelValue', emitValue)
                emit('input', emitValue)
            } else {
                // Standard number handling
                const numericValue = Number(value)
                if (!isNaN(numericValue)) {
                    emit('update:modelValue', numericValue)
                    emit('input', numericValue)
                } else {
                    emit('update:modelValue', value)
                    emit('input', value)
                }
            }
        } else {
            emit('update:modelValue', value)
            emit('input', value)
        }
    }

    const handleBlur = (event: Event) => {
        isFocused.value = false

        if (props.type === 'number' && props.modelValue !== '' && props.modelValue !== null) {
            const numericValue = Number(props.modelValue)
            if (!isNaN(numericValue)) {
                let finalValue = numericValue

                // Clamp value between min and max
                if (props.min !== undefined || props.max !== undefined) {
                    finalValue = clampNumber(numericValue, props.min, props.max)
                }

                // Round to decimal places if specified
                if (props.decimalPlaces !== undefined && props.decimalPlaces >= 0) {
                    finalValue = parseFloat(finalValue.toFixed(props.decimalPlaces))
                }

                // Only emit if value changed
                if (finalValue !== numericValue) {
                    emit('update:modelValue', finalValue)
                }
            }
        }

        emit('blur', event)
    }

    const togglePasswordVisibility = () => {
        showPassword.value = !showPassword.value
    }

    const copyToClipboard = async () => {
        if (hasValue.value) {
            try {
                await navigator.clipboard.writeText(String(props.modelValue))
                emit('copy', true)
            } catch (error) {
                console.error('Failed to copy:', error)
                emit('copy', false)
            }
        }
    }

    defineExpose({
        inputRef,
        focus: () => inputRef.value?.focus(),
        blur: () => inputRef.value?.blur(),
    })
</script>
