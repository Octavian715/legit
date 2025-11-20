<template>
    <div class="relative">
        <div
            class="relative border rounded transition-colors duration-300 bg-gray-150"
            :class="[
                sizeClasses[size],
                background,
                {
                    'border-red-500': hasError,
                    'border-gray-600 hover:border-gray-800': !hasError && !isFocused,
                    'border-gray-800': isFocused,
                    'bg-gray-100 cursor-not-allowed': disabled,
                },
                containerClasses,
            ]"
        >
            <div class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
                <svg class="w-4 h-4">
                    <use xlink:href="/sprite.svg#search" />
                </svg>
            </div>

            <input
                :id="inputId"
                ref="inputRef"
                :name="name"
                type="text"
                :value="modelValue"
                :disabled="disabled"
                :placeholder="placeholder"
                :aria-invalid="hasError"
                :aria-describedby="
                    hasError ? `${inputId}-error` : explain ? `${inputId}-explain` : null
                "
                class="w-full h-full pl-10 pr-10 border-none bg-transparent focus:outline-none text-gray-950"
                :class="{
                    'text-red-500': hasError,
                    'cursor-not-allowed': disabled,
                }"
                @focus="handleFocus"
                @blur="handleBlur"
                @input="handleInput"
                @keydown.enter="handleEnter"
                @keydown.escape="handleEscape"
            />

            <div
                v-if="showClearButton && modelValue"
                class="absolute right-3 top-1/2 -translate-y-1/2"
            >
                <button
                    type="button"
                    class="p-1 text-gray-600 hover:text-red-500 transition-colors"
                    @click="clearInput"
                >
                    <svg class="w-4 h-4">
                        <use xlink:href="/sprite.svg#close" />
                    </svg>
                </button>
            </div>
        </div>

        <div v-if="hasError || explain" class="flex items-start gap-1 text-caption1 mx-1 mt-1">
            <svg
                class="w-3 h-3 mt-0.5 flex-shrink-0"
                :class="hasError ? 'text-red-500' : 'text-gray-600'"
            >
                <use xlink:href="/sprite.svg#warn-error" />
            </svg>
            <span
                :id="hasError ? `${inputId}-error` : `${inputId}-explain`"
                :class="hasError ? 'text-red-500' : 'text-gray-600'"
                class="break-words"
            >
                {{ displayMessage }}
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed } from 'vue'

    interface InputSearchProps {
        modelValue?: string
        name?: string
        placeholder?: string
        size?: 'sm' | 'md' | 'lg'
        background?: string
        disabled?: boolean
        error?: string | boolean
        errorMessage?: string
        explain?: string
        containerClasses?: string
        showClearButton?: boolean
    }

    const props = withDefaults(defineProps<InputSearchProps>(), {
        modelValue: '',
        name: 'search',
        placeholder: '',
        size: 'lg',
        containerClasses: '',
        background: 'bg-transparent',
        disabled: false,
        error: '',
        errorMessage: '',
        explain: '',
        showClearButton: true,
    })

    const emit = defineEmits([
        'update:modelValue',
        'search',
        'clear',
        'focus',
        'blur',
        'enter',
        'escape',
    ])

    const inputId = ref(props.name || `search-${Math.random().toString(36).substr(2, 9)}`)
    const isFocused = ref(false)
    const inputRef = ref<HTMLInputElement | null>(null)

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

    const sizeClasses = {
        lg: 'h-12 text-subtitle2',
        md: 'h-10 text-subtitle2',
        sm: 'h-8 text-subtitle3',
    }

    const handleFocus = (event: Event) => {
        isFocused.value = true
        emit('focus', event)
    }

    const handleBlur = (event: Event) => {
        isFocused.value = false
        emit('blur', event)
    }

    const handleInput = (event: Event) => {
        const target = event.target as HTMLInputElement
        const value = target.value
        emit('update:modelValue', value)
        emit('search', value)
    }

    const handleEnter = (event: KeyboardEvent) => {
        emit('enter', event)
        emit('search', props.modelValue)
    }

    const handleEscape = (event: KeyboardEvent) => {
        emit('escape', event)
        clearInput()
    }

    const clearInput = () => {
        emit('update:modelValue', '')
        emit('clear')
        emit('search', '')
        inputRef.value?.focus()
    }

    const focus = () => {
        inputRef.value?.focus()
    }

    defineExpose({
        focus,
        inputRef,
    })
</script>
