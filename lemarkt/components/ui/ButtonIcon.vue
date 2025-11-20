<template>
    <button
        :class="[
            'flex items-center justify-center rounded focus:outline-none transition-all duration-300 active:scale-95',
            sizeClasses[size],
            fontWeightClasses[fontWeight],
            variantClasses[variant],
            colorClasses[color]?.[variant],
            square ? 'p-0 aspect-square w-auto' : '',
            { 'cursor-not-allowed text-gray-600 opacity-70': disabled },
            containerClasses,
        ]"
        :disabled="disabled"
        @click="handleClick"
    >
        <slot>
            <svg :class="iconSizeClasses[iconSize]" class="shrink-0">
                <use :xlink:href="`/sprite.svg#${icon}`"></use>
            </svg>
        </slot>
    </button>
</template>

<script setup lang="ts">
    import type { ButtonType, ButtonVariant, ButtonColor, ButtonSize } from '~/types/ui/button'

    const props = withDefaults(
        defineProps<
            ButtonType & {
                icon: string
                iconSize?: string
            }
        >(),
        {
            size: 'md',
            iconSize: 'md',
            square: true,
            variant: 'filled',
            color: 'blue',
            fontWeight: 'bold',
            label: '',
            disabled: false,
            loading: false,
            containerClasses: '',
            icon: 'plus',
        }
    )

    const emit = defineEmits(['click'])

    const sizeClasses: Record<ButtonSize, string> = {
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-10 h-10',
    }

    const iconSizeClasses: Record<string, string> = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-9 h-9',
        xl: 'w-12 h-12',
    }

    const fontWeightClasses: Record<string, string> = {
        light: 'font-light',
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold',
    }

    const variantClasses: Record<ButtonVariant, string> = {
        filled: 'text-white',
        outline: 'border-2 bg-transparent',
        ghost: 'bg-transparent',
    }

    const colorClasses: Record<ButtonColor, Record<ButtonVariant, string>> = {
        blue: {
            filled: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-300 disabled:bg-blue-50 disabled:text-gray-600',
            outline:
                'border-blue-500 text-blue-500 hover:bg-blue-100 active:bg-blue-300 disabled:text-gray-400',
            ghost: 'text-blue-500 hover:bg-blue-100 active:bg-blue-300 disabled:text-gray-400',
        },
        red: {
            filled: 'bg-red-500 hover:bg-red-700 active:bg-red-300 text-white disabled:bg-red-50 disabled:text-gray-600',
            outline:
                'border-red-500 text-red-500 hover:bg-red-100 active:bg-red-300 disabled:text-gray-400',
            ghost: 'text-red-500 hover:bg-red-100 active:bg-red-300 disabled:text-gray-400',
        },
        gray: {
            filled: 'bg-gray-400 text-white hover:bg-gray-600 active:bg-gray-800 disabled:bg-gray-50 disabled:text-gray-600',
            outline:
                'border-gray-400 text-gray-700 hover:bg-gray-100 active:bg-gray-300 disabled:text-gray-400',
            ghost: 'text-gray-700 hover:bg-gray-100 active:bg-gray-300 disabled:text-gray-400',
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
    }

    const handleClick = () => {
        if (!props.disabled && !props.loading) {
            emit('click')
        }
    }
</script>
