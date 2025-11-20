<template>
    <component
        :is="tag"
        :type="tag === 'button' ? type : undefined"
        :href="tag === 'a' ? href : undefined"
        :to="tag === 'NuxtLink' ? to : undefined"
        :target="tag === 'a' && external ? '_blank' : undefined"
        :rel="tag === 'a' && external ? 'noopener noreferrer' : undefined"
        :class="[
            'flex items-center rounded-sm justify-center focus:outline-none transition-all duration-300 active:scale-95 ',
            sizeClasses[size],
            fontWeightClasses[fontWeight],
            variantClasses[variant],
            colorClasses[color]?.[variant],
            props.wrap ? 'whitespace-normal' : 'whitespace-nowrap',
            square ? 'p-2 aspect-square min-h-6' : '',
            { 'cursor-not-allowed text-gray-600 opacity-60 disabled:scale-100': disabled },

            { 'cursor-wait': loading },

            containerClasses,
        ]"
        :disabled="disabled || loading"
        :aria-disabled="disabled || loading"
        :aria-label="ariaLabel || label"
        @click="handleClick"
        @keydown.enter="handleClick"
        @keydown.space.prevent="handleClick"
    >
        <component
            :is="iconBefore"
            v-if="iconBefore && !loading"
            :class="['w-4 h-4 shrink-0', label ? 'mr-1' : '']"
        />

        <slot>
            <div class="flex items-center justify-center relative w-full">
                <span :class="{ 'opacity-0': loading }">{{ label }}</span>
                <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
                    <div class="loader-btn"></div>
                </div>
            </div>
        </slot>

        <!-- Icon After -->
        <component
            :is="iconAfter"
            v-if="iconAfter && !loading"
            :class="['w-4 h-4 shrink-0', label ? 'ml-1' : '']"
        />
    </component>
</template>

<script setup lang="ts">
    import { defineProps, defineEmits, withDefaults } from 'vue'
    import type { ButtonType, ButtonVariant, ButtonColor } from '~/types/ui/button'

    interface EnhancedButtonType extends ButtonType {
        // Navigation support
        tag?: 'button' | 'a' | 'NuxtLink'
        type?: 'button' | 'submit' | 'reset'
        href?: string
        to?: string | object
        external?: boolean

        // Icon support
        iconBefore?: any
        iconAfter?: any

        // Accessibility
        ariaLabel?: string
    }

    const props = withDefaults(defineProps<EnhancedButtonType>(), {
        label: '',
        size: 'lg',
        square: false,
        variant: 'filled',
        color: 'blue',
        fontWeight: 'bold',
        disabled: false,
        wrap: true,
        loading: false,
        showLoadingText: false,
        containerClasses: '',
        tag: 'button',
        type: 'button',
        external: false,
    })

    const emit = defineEmits(['click'])

    const sizeClasses = {
        sm: 'px-2 py-1 text-subtitle3 h-6',
        md: 'px-4 py-2 text-subtitle2 h-8',
        lg: 'px-5 py-3 text-subtitle2 h-10',
    }

    const variantClasses: Record<ButtonVariant, string> = {
        filled: '',
        outline: 'border bg-transparent',
        ghost: 'bg-transparent',
    }

    const colorClasses: Record<ButtonColor, Record<ButtonVariant, string>> = {
        blue: {
            filled: 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-300 disabled:bg-blue-50 disabled:text-gray-600',
            outline:
                'border-blue-500 text-blue-500 hover:bg-blue-100 active:bg-blue-300 disabled:text-gray-400',
            ghost: 'text-blue-500 hover:bg-blue-100 active:bg-blue-300 disabled:text-gray-400',
        },
        red: {
            filled: 'bg-red-500 text-white hover:bg-red-700 active:bg-red-300 text-white disabled:bg-red-500 disabled:text-white',
            outline:
                'border-red-500 text-red-500 hover:bg-red-100 active:bg-red-300 disabled:text-gray-400',
            ghost: 'text-red-500 hover:bg-red-100 active:bg-red-300 disabled:text-gray-400',
        },
        gray: {
            filled: 'bg-gray-400 text-gray-800 hover:bg-gray-600 active:text-white active:bg-gray-800 disabled:bg-gray-400 disabled:text-gray-800',
            outline:
                'border-gray-400 text-gray-700 hover:bg-gray-100 active:bg-gray-300 disabled:text-gray-400',
            ghost: 'text-gray-800 hover:text-gray-950 hover:bg-gray-100 active:text-gray-950 active:bg-gray-300 disabled:text-gray-400',
        },
        green: {
            filled: 'bg-green-500 text-white hover:bg-green-700 active:bg-green-300 disabled:bg-green-50 disabled:text-gray-600',
            outline:
                'border-green-500 text-green-500 hover:bg-green-100 active:bg-green-300 disabled:text-gray-400',
            ghost: 'text-green-500 hover:bg-green-100 active:bg-green-300 disabled:text-gray-400',
        },
        black: {
            filled: 'bg-black text-white hover:bg-gray-800 active:bg-gray-600 disabled:bg-gray-300 disabled:text-gray-600',
            outline:
                'border-black text-black hover:bg-gray-200 active:bg-gray-400 disabled:text-gray-400',
            ghost: 'text-black hover:bg-gray-100 active:bg-gray-300 disabled:text-gray-400',
        },
        white: {
            filled: 'bg-white text-gray-950 hover:bg-gray-200 active:bg-gray-300 disabled:text-gray-400',
            outline:
                'border-white text-white hover:bg-gray-100 active:bg-gray-300 disabled:text-gray-400',
            ghost: 'text-white hover:bg-gray-100 active:bg-gray-300 disabled:text-gray-400',
        },
        yellow: {
            filled: 'bg-yellow-400 text-black hover:bg-yellow-500 active:bg-yellow-600 disabled:text-gray-600',
            outline:
                'border-yellow-400 text-yellow-500 hover:bg-yellow-100 active:bg-yellow-300 disabled:text-gray-400',
            ghost: 'text-yellow-500 hover:bg-yellow-100 active:bg-yellow-300 disabled:text-gray-400',
        },
        mix: {
            filled: 'bg-white border text-gray-950 border-gray-600 hover:bg-red-50 hover:text-red-500 hover:border-red-500 active:bg-red-500 active:text-white active:border-red-500 disabled:bg-gray-400 disabled:text-white disabled:hover:bg-gray-400 disabled:active:bg-gray-400 disabled:border-gray-400 disabled:hover:border-gray-400 active:disabled:border-gray-400',
            outline:
                'border-gray-400 text-gray-600 bg-transparent hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:border-red-500 active:bg-red-500 active:text-white disabled:border-gray-200 disabled:text-gray-400 disabled:hover:border-gray-200 disabled:hover:bg-transparent disabled:active:border-gray-200 disabled:active:bg-transparent',
            ghost: 'text-gray-600 bg-transparent hover:bg-red-50 hover:text-red-600 active:bg-red-500 active:text-white disabled:text-gray-400 disabled:hover:bg-transparent disabled:active:bg-transparent',
        },
    }

    const fontWeightClasses = {
        light: 'font-light',
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold',
    }

    const handleClick = (event: Event) => {
        if (!props.disabled && !props.loading) {
            emit('click', event)
        }
    }
</script>
