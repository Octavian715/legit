<template>
    <component
        :is="wrapperComponent"
        :class="[wrapperClasses, 'p-1.5', containerClass]"
        :role="isButton ? 'button' : undefined"
        :aria-label="accessibilityLabel"
        :tabindex="isButton ? 0 : undefined"
        :data-test="test"
        v-bind="$attrs"
        @keydown.enter="handleButtonClick"
        @keydown.space="handleButtonClick"
        @click="handleButtonClick"
    >
        <!-- Loading spinner overlay -->
        <Transition name="spinner-fade">
            <div
                v-if="loading"
                :class="[
                    'absolute inset-0 flex items-center justify-center',
                    'bg-white/80 rounded backdrop-blur-sm',
                ]"
            >
                <div :class="['loader-btn', loadingSpinnerSize]" />
            </div>
        </Transition>

        <!-- Slot content (takes priority over icon prop) -->
        <Transition name="icon-fade">
            <div
                v-if="hasSlotContent && !loading"
                :class="iconClasses"
                :aria-hidden="isSlotDecorative"
            >
                <slot />
            </div>
        </Transition>

        <!-- Fallback icon prop -->
        <Transition name="icon-fade">
            <svg
                v-if="icon && !hasSlotContent && !loading"
                :class="iconClasses"
                aria-hidden="true"
                :width="iconSize"
                :height="iconSize"
            >
                <use :href="spriteIdentifier" />
            </svg>
        </Transition>

        <!-- Badge -->
        <Transition name="badge-scale">
            <span
                v-if="showBadge && props.count > 0"
                :class="badgeClasses"
                :data-test="`${icon || 'custom'}-badge`"
                :aria-label="badgeAriaLabel"
            >
                {{ formattedBadgeValue }}
            </span>
        </Transition>

        <!-- Focus ring for better accessibility (only for buttons) -->
        <div
            v-if="isButton"
            class="absolute inset-0 rounded border border-transparent transition-colors duration-200 pointer-events-none outline-none"
        />
    </component>
</template>

<script lang="ts" setup>
    import { computed, defineEmits, defineProps, useAttrs, useSlots, withDefaults } from 'vue'

    interface IconProps {
        icon?: string
        isButton?: boolean
        spritePath?: string
        background?: boolean | string
        textColor?: string
        activeColor?: string
        hoverColor?: string
        activeBorderColor?: string
        maxCount?: number
        size?: 'base' | 'sm' | 'md' | 'lg' | 'xl'
        color?: 'gray' | 'green' | 'yellow' | 'blue' | 'red' | 'purple' | 'indigo' | 'pink'
        badgeColor?: 'gray' | 'green' | 'yellow' | 'blue' | 'red' | 'purple' | 'indigo' | 'pink'
        badgeType?: 'count' | 'dot' | 'label'
        count?: string | number
        label?: string
        disabled?: boolean
        loading?: boolean
        test?: string
        slotAriaHidden?: boolean
        containerClass?: string
        active?: boolean
    }

    const props = withDefaults(defineProps<IconProps>(), {
        isButton: false,
        spritePath: () => '/sprite.svg',
        background: false,
        textColor: '',
        maxCount: 99,
        size: 'md',
        color: 'gray',
        badgeColor: 'green',
        badgeType: 'count',
        disabled: false,
        loading: false,
        test: 'ui-icon',
        slotAriaHidden: true,
        active: false,
        containerClass: '',
        hoverColor: '',
        activeBorderColor: '',
    })

    const emit = defineEmits<{
        (event: 'click', payload: MouseEvent): void
    }>()

    const attrs = useAttrs()
    const slots = useSlots()

    const SIZE_CONFIG = {
        base: {
            icon: 16,
            wrapper: 'w-4 h-4',
            badge: 'min-w-3 h-3',
            badgeOffset: '-top-2 -right-2',
            spinner: 'w-3 h-3',
        },
        sm: {
            icon: 24,
            wrapper: 'w-6 h-6',
            badge: 'min-w-4 h-4',
            badgeOffset: '-top-1 -right-1',
            spinner: 'w-4 h-4',
        },
        md: {
            icon: 32,
            wrapper: 'w-9 h-9',
            badge: 'min-w-5 h-5',
            badgeOffset: '-top-2 -right-2',
            spinner: 'w-5 h-5',
        },
        lg: {
            icon: 40,
            wrapper: 'w-12 h-12',
            badge: 'min-w-6 h-6',
            badgeOffset: '-top-2.5 -right-2.5',
            spinner: 'w-6 h-6',
        },
        xl: {
            icon: 48,
            wrapper: 'w-16 h-16',
            badge: 'min-w-7 h-7',
            badgeOffset: '-top-3 -right-3',
            spinner: 'w-7 h-7',
        },
    } as const

    // Separate color themes for buttons vs static icons
    const BUTTON_COLOR_THEMES = {
        base: {
            gray: 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 active:text-gray-700 active:bg-gray-200 focus:text-gray-800 focus:bg-gray-100',
            green: 'text-green-500 hover:text-green-700 hover:bg-green-100 active:text-green-600 active:bg-green-200 focus:text-green-700 focus:bg-green-100',
            yellow: 'text-yellow-500 hover:text-yellow-600 hover:bg-yellow-100 active:text-yellow-700 active:bg-yellow-200 focus:text-yellow-600 focus:bg-yellow-100',
            blue: 'text-blue-500 hover:text-blue-600 hover:bg-blue-100 active:text-blue-700 active:bg-blue-200 focus:text-blue-600 focus:bg-blue-100',
            red: 'text-red-500 hover:text-red-600 hover:bg-red-100 active:text-red-700 active:bg-red-200 focus:text-red-600 focus:bg-red-100',
            purple: 'text-purple-500 hover:text-purple-600 hover:bg-purple-100 active:text-purple-700 active:bg-purple-200 focus:text-purple-600 focus:bg-purple-100',
            indigo: 'text-indigo-500 hover:text-indigo-600 hover:bg-indigo-100 active:text-indigo-700 active:bg-indigo-200 focus:text-indigo-600 focus:bg-indigo-100',
            pink: 'text-pink-500 hover:text-pink-600 hover:bg-pink-100 active:text-pink-700 active:bg-pink-200 focus:text-pink-600 focus:bg-pink-100',
        },
        active: {
            gray: 'text-gray-800 bg-gray-200',
            green: 'text-green-700 bg-green-200',
            yellow: 'text-yellow-700 bg-yellow-200',
            blue: 'text-blue-700 bg-blue-200',
            red: 'text-red-700 bg-red-200',
            purple: 'text-purple-700 bg-purple-200',
            indigo: 'text-indigo-700 bg-indigo-200',
            pink: 'text-pink-700 bg-pink-200',
        },
    } as const

    // Static icon colors (no hover/background effects)
    const STATIC_COLOR_THEMES = {
        gray: 'text-gray-600',
        green: 'text-green-500',
        yellow: 'text-yellow-500',
        blue: 'text-blue-500',
        red: 'text-red-500',
        purple: 'text-purple-500',
        indigo: 'text-indigo-500',
        pink: 'text-pink-500',
    } as const

    const BADGE_COLOR_THEMES = {
        gray: 'bg-gray-500 text-white',
        green: 'bg-green-500 text-white',
        yellow: 'bg-yellow-500 text-white',
        blue: 'bg-blue-500 text-white',
        red: 'bg-red-500 text-white',
        purple: 'bg-purple-500 text-white',
        indigo: 'bg-indigo-500 text-white',
        pink: 'bg-pink-500 text-white',
    } as const

    const wrapperComponent = computed(() => (attrs.href ? 'a' : 'span'))
    const iconSize = computed(() => SIZE_CONFIG[props.size].icon)
    const currentColor = computed(() => props.activeColor || props.color)
    const loadingSpinnerSize = computed(() => SIZE_CONFIG[props.size].spinner)
    const hasSlotContent = computed(() => !!slots.default)
    const isSlotDecorative = computed(() => props.slotAriaHidden)

    const wrapperClasses = computed(() => {
        const baseClasses = [
            'icon-wrapper rounded relative',
            'flex items-center justify-center',
            'transition-all duration-200 ease-in-out',
            'transform-gpu',
        ]

        // Apply different styling based on isButton prop
        if (props.isButton) {
            // Button styling with hover effects and backgrounds
            baseClasses.push('cursor-pointer focus:outline-none')
            if (!props.disabled && !props.loading && !props.active) {
                baseClasses.push('hover:scale-105 active:scale-95')
            }
            if (props.disabled) {
                baseClasses.push('opacity-50 cursor-not-allowed')
            }
            if (props.loading) {
                baseClasses.push('cursor-wait')
            }

            // Apply button-specific colors with hover/background effects
            if (props.textColor) {
                baseClasses.push(props.textColor)
            } else if (props.active) {
                baseClasses.push(BUTTON_COLOR_THEMES.active[currentColor.value])
            } else {
                baseClasses.push(BUTTON_COLOR_THEMES.base[currentColor.value])
            }

            // Apply custom background if specified
            if (typeof props.background === 'string') {
                baseClasses.push(props.background)
            }
        } else {
            // Static icon styling - no hover effects or backgrounds
            if (props.textColor) {
                baseClasses.push(props.textColor)
            } else {
                baseClasses.push(STATIC_COLOR_THEMES[props.color])
            }

            // For non-button icons, apply opacity if disabled but no other interactive styles
            if (props.disabled) {
                baseClasses.push('opacity-50')
            }
        }

        return baseClasses
    })

    const iconClasses = computed(() => [
        'icon-wrapper__icon',
        'flex-shrink-0 transition-transform duration-200',
        SIZE_CONFIG[props.size].wrapper,
    ])

    const badgeClasses = computed(() => [
        'icon-wrapper__badge absolute',
        'flex items-center items-center justify-center',
        'font-semibold text-caption1 rounded-full border-2 border-white shadow-sm w-6 h-6',
        'transition-all duration-200 ease-in-out',
        SIZE_CONFIG[props.size].badge,
        SIZE_CONFIG[props.size].badgeOffset,
        BADGE_COLOR_THEMES[props.badgeColor],
        {
            'w-2 h-2 p-0 border-white': props.badgeType === 'dot',
            'px-1.5': props.badgeType !== 'dot',
        },
    ])

    const showBadge = computed(
        () => !props.loading && (props.badgeType === 'dot' || !!formattedBadgeValue.value)
    )

    const formattedBadgeValue = computed(() => {
        if (props.badgeType === 'dot') return ''
        if (props.badgeType === 'label') return props.label || ''

        const numericCount = Number(props.count)
        if (isNaN(numericCount)) return props.count?.toString() || ''

        return numericCount > props.maxCount ? `${props.maxCount}+` : numericCount.toLocaleString()
    })

    const accessibilityLabel = computed(() => {
        let label =
            props.tooltip ||
            (props.label ? `${props.label} icon` : `${props.icon || 'custom'} icon`)

        if (props.active) label += ', selected'
        if (props.disabled) label += ', disabled'
        if (props.loading) label += ', loading'

        return label
    })

    const badgeAriaLabel = computed(() => {
        if (props.badgeType === 'dot') return 'Has notification'
        if (props.badgeType === 'label') return props.label

        const count = Number(props.count)
        if (isNaN(count)) return props.count?.toString()

        return count === 1 ? '1 notification' : `${formattedBadgeValue.value} notifications`
    })

    const spriteIdentifier = computed(() => `${props.spritePath}#${props.icon}`)

    const handleButtonClick = (event: MouseEvent | KeyboardEvent) => {
        // Only handle clicks if it's actually a button
        if (!props.disabled && !props.loading && props.isButton) {
            if (event instanceof KeyboardEvent) {
                event.preventDefault()
            }

            emit('click', event as MouseEvent)
        }
    }
</script>

<style scoped>
    .icon-fade-enter-active,
    .icon-fade-leave-active {
        transition:
            opacity 0.2s ease-in-out,
            transform 0.2s ease-in-out;
    }

    .icon-fade-enter-from,
    .icon-fade-leave-to {
        opacity: 0;
        transform: translateY(-2px);
    }

    .badge-scale-enter-active,
    .badge-scale-leave-active {
        transition:
            opacity 0.2s ease-in-out,
            transform 0.2s ease-in-out;
    }

    .badge-scale-enter-from,
    .badge-scale-leave-to {
        opacity: 0;
        transform: scale(0.5);
    }

    .spinner-fade-enter-active,
    .spinner-fade-leave-active {
        transition:
            opacity 0.3s ease-in-out,
            backdrop-filter 0.3s ease-in-out;
    }

    .spinner-fade-enter-from,
    .spinner-fade-leave-to {
        opacity: 0;
        backdrop-filter: blur(0px);
    }

    .icon-wrapper:focus-within {
        outline: none;
    }

    .icon-wrapper__badge {
        z-index: 10;
    }

    .icon-wrapper {
        will-change: transform;
    }

    .icon-wrapper:disabled,
    .icon-wrapper[aria-disabled='true'] {
        pointer-events: none;
    }

    /* Only apply interactive styles to buttons */
    .icon-wrapper:not(.static-icon) {
        cursor: pointer;
    }

    .static-icon {
        cursor: default;
    }
</style>
