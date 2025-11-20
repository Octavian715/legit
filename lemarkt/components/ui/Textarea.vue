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
                :for="textareaId"
                class="absolute left-3 text-gray-600 transition-all duration-200 whitespace-nowrap overflow-hidden text-ellipsis pointer-events-none max-w-[calc(100%-3rem)]"
                :class="[
                    isFocused || hasValue
                        ? 'text-caption1 text-gray-800'
                        : 'text-subtitle2 text-gray-600',
                    { 'cursor-not-allowed': disabled },
                    labelPositionClass,
                    hasError ? 'text-red-500' : null,
                ]"
                @click="focusTextarea"
            >
                {{ label }}
                <span v-if="required" class="text-red-500">*</span>
            </label>

            <textarea
                :id="textareaId"
                ref="textareaRef"
                :name="name"
                :value="displayValue"
                :disabled="disabled"
                :maxlength="maxlength"
                :rows="rows"
                :aria-invalid="hasError"
                :aria-required="required"
                :aria-describedby="
                    hasError ? `${textareaId}-error` : explain ? `${textareaId}-explain` : null
                "
                class="w-full border-none bg-transparent focus:outline-none resize-none"
                :class="[
                    defaultTextareaClass,
                    textareaPaddingClass,
                    {
                        'text-red-500': hasError,
                        'cursor-not-allowed': disabled,
                        'pr-20': copy && !disabled,
                    },
                ]"
                @focus="handleFocus"
                @blur="handleBlur"
                @input="handleInput"
            />

            <div v-if="copy && !disabled" class="absolute top-3 right-3 flex items-center gap-2">
                <span class="text-caption1 text-gray-600">Copy text</span>
                <button
                    type="button"
                    class="p-1 transition-colors"
                    :class="
                        hasValue
                            ? 'text-gray-600 hover:text-blue-500'
                            : 'text-gray-300 cursor-not-allowed'
                    "
                    @click="copyToClipboard"
                >
                    <svg class="w-6 h-6">
                        <use xlink:href="/sprite.svg#copy"></use>
                    </svg>
                </button>
            </div>
        </div>

        <div class="flex justify-between mx-1">
            <div v-if="hasError || explain" class="flex items-start gap-1 text-caption1">
                <svg
                    class="w-3 h-3 mt-0.5 flex-shrink-0"
                    :class="hasError ? 'text-red-500' : 'text-gray-600'"
                >
                    <use xlink:href="/sprite.svg#warn-error"></use>
                </svg>
                <span
                    :id="hasError ? `${textareaId}-error` : `${textareaId}-explain`"
                    :class="hasError ? 'text-red-500' : 'text-gray-600'"
                    class="break-words"
                >
                    {{ displayMessage }}
                </span>
            </div>

            <div
                v-if="maxlength !== undefined"
                class="text-caption1 text-right ml-auto"
                :class="isOverLimit ? 'text-red-500' : 'text-gray-800'"
            >
                {{ currentLength }}/{{ maxlength }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed } from 'vue'
    import type { TextareaType } from '~/types/ui/textarea'

    const props = withDefaults(defineProps<TextareaType>(), {
        name: 'textarea',
        label: '',
        size: 'lg',
        rows: 4,
        maxlength: undefined,
        explain: '',
        error: '',
        errorMessage: '',
        copy: false,
        background: 'bg-transparent',
        disabled: false,
        required: false,
        modelValue: null as string | number | null | undefined,
    })

    const emit = defineEmits(['update:modelValue', 'blur', 'focus', 'input', 'copy'])

    const textareaId = ref(props.name || `textarea-${Math.random().toString(36).substr(2, 9)}`)
    const isFocused = ref(false)
    const textareaRef = ref<HTMLTextAreaElement | null>(null)

    const modelValue = computed({
        get: () => props.modelValue,
        set: (value) => emit('update:modelValue', value),
    })

    const hasValue = computed(() => {
        return !!String(props.modelValue || '').trim()
    })

    const displayValue = computed(() => {
        // Convert null/undefined to empty string
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

    const currentLength = computed(() => {
        return String(props.modelValue || '').length
    })

    const isOverLimit = computed(
        () => props.maxlength !== undefined && currentLength.value > props.maxlength
    )

    const defaultTextareaClass = computed(() => {
        return 'text-gray-950 appearance-none'
    })

    const sizeClasses = {
        lg: 'min-h-[120px] text-subtitle2',
        md: 'min-h-[100px] text-subtitle2',
        sm: 'min-h-[80px] text-subtitle3',
    }

    const labelPositionClass = computed(() => {
        if (isFocused.value || hasValue.value) {
            if (props.size === 'lg') return 'top-1.5'
            if (props.size === 'md') return 'top-1'
            if (props.size === 'sm') return 'top-0.5'
            return 'top-1.5'
        }
        if (props.size === 'lg') return 'top-[14px]'
        if (props.size === 'md') return 'top-2.5'
        if (props.size === 'sm') return 'top-1.5'
        return 'top-[14px]'
    })

    const textareaPaddingClass = computed(() => {
        if (props.size === 'lg') return 'px-3 pb-2 pt-6'
        if (props.size === 'md') return 'px-3 pb-2 pt-5'
        if (props.size === 'sm') return 'px-2 pb-1.5 pt-4'
        return 'px-3 pb-2 pt-6'
    })

    const handleFocus = (event: Event) => {
        isFocused.value = true
        emit('focus', event)
    }

    const handleInput = (event: Event) => {
        const target = event.target as HTMLTextAreaElement
        const value = target.value
        emit('update:modelValue', value)
        emit('input', value)
    }

    const handleBlur = (event: Event) => {
        isFocused.value = false
        emit('blur', event)
    }

    const focusTextarea = () => {
        textareaRef.value?.focus()
    }

    const copyToClipboard = async () => {
        if (hasValue.value) {
            try {
                await navigator.clipboard.writeText(String(props.modelValue))
                emit('copy', true)
            } catch (error) {
                console.error('Failed to copy text:', error)
                emit('copy', false)
            }
        }
    }
</script>
