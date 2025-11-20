<template>
    <div class="range-slider-wrapper">
        <div v-if="showLabels && label" class="mb-2">
            <label class="block text-sm font-medium text-gray-700">{{ label }}</label>
        </div>

        <div class="mb-4 px-1">
            <div class="relative h-1">
                <div class="absolute w-full h-1 bg-gray-200 rounded-full"></div>
                <div
                    class="absolute h-1 bg-blue-500 rounded-full transition-all duration-150"
                    :style="{
                        left: `${minPercentage}%`,
                        right: `${100 - maxPercentage}%`,
                    }"
                ></div>
                <div class="relative">
                    <input
                        ref="minThumbRef"
                        v-model.number="internalMin"
                        type="range"
                        :min="absoluteMin"
                        :max="absoluteMax"
                        :step="step"
                        class="range-slider-thumb range-min"
                        :class="{ 'z-10': activeThumb === 'min' }"
                        :disabled="disabled"
                        @input="handleMinChange"
                        @mousedown="handleMinMouseDown"
                        @touchstart="handleMinTouchStart"
                        @focus="activeThumb = 'min'"
                    />
                    <input
                        ref="maxThumbRef"
                        v-model.number="internalMax"
                        type="range"
                        :min="absoluteMin"
                        :max="absoluteMax"
                        :step="step"
                        class="range-slider-thumb range-max"
                        :class="{ 'z-10': activeThumb === 'max' }"
                        :disabled="disabled"
                        @input="handleMaxChange"
                        @mousedown="handleMaxMouseDown"
                        @touchstart="handleMaxTouchStart"
                        @focus="activeThumb = 'max'"
                    />
                </div>
            </div>
        </div>

        <div v-if="showInputs" class="grid grid-cols-2 gap-3">
            <Input
                v-model="minValueDisplay"
                type="number"
                name="range-min"
                :placeholder="minPlaceholder || t('filters.from')"
                :min="absoluteMin"
                :max="internalMax"
                :step="step"
                :size="inputSize"
                :disabled="disabled"
                @input="handleMinInputChange"
            />
            <Input
                v-model="maxValueDisplay"
                type="number"
                name="range-max"
                :placeholder="maxPlaceholder || t('filters.to')"
                :min="internalMin"
                :max="absoluteMax"
                :step="step"
                :size="inputSize"
                :disabled="disabled"
                @input="handleMaxInputChange"
            />
        </div>

        <div v-if="error" class="mt-2 p-2 bg-red-50 rounded-md border border-red-200">
            <p class="text-xs text-red-600 font-medium">{{ error }}</p>
        </div>

        <div v-if="showRange && showRangeInfo" class="mt-3 p-2.5 bg-gray-50 rounded-md">
            <div class="text-xs text-gray-500 mb-0.5">
                {{ rangeLabel || t('filters.priceRange') }}:
            </div>
            <div class="text-sm font-semibold text-gray-700">
                {{ formatValue(absoluteMin) }} - {{ formatValue(absoluteMax) }}
            </div>
        </div>

        <div
            v-if="showSelectedRange && (internalMin > absoluteMin || internalMax < absoluteMax)"
            class="mt-2 p-2.5 bg-blue-50 rounded-md border border-blue-200"
        >
            <div class="text-xs text-blue-600 mb-0.5">
                {{ selectedLabel || t('filters.activeFilters') }}:
            </div>
            <div class="text-sm font-semibold text-blue-700">
                {{ formatSelectedRange }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, onMounted, type Ref } from 'vue'
    import { useI18n } from 'vue-i18n'

    interface Props {
        modelValue?: { min: number | null; max: number | null }
        min?: number
        max?: number
        step?: number
        label?: string
        minPlaceholder?: string
        maxPlaceholder?: string
        rangeLabel?: string
        selectedLabel?: string
        showLabels?: boolean
        showInputs?: boolean
        showRange?: boolean
        showRangeInfo?: boolean
        showSelectedRange?: boolean
        formatType?: 'currency' | 'number' | 'custom'
        currency?: string
        customFormatter?: (value: number) => string
        inputSize?: 'sm' | 'md' | 'lg'
        disabled?: boolean
        errorMessage?: string
    }

    const props = withDefaults(defineProps<Props>(), {
        modelValue: () => ({ min: null, max: null }),
        min: 0,
        max: 1000,
        step: 1,
        label: '',
        minPlaceholder: '',
        maxPlaceholder: '',
        rangeLabel: '',
        selectedLabel: '',
        showLabels: false,
        showInputs: true,
        showRange: false,
        showRangeInfo: false,
        showSelectedRange: false,
        formatType: 'number',
        currency: 'EUR',
        inputSize: 'md',
        disabled: false,
        errorMessage: '',
    })

    const emit = defineEmits<{
        'update:modelValue': [value: { min: number | null; max: number | null }]
        change: [value: { min: number | null; max: number | null }]
    }>()

    const { t } = useI18n()

    // Store absolute min/max values from initialization
    const absoluteMin = ref<number>(props.min)
    const absoluteMax = ref<number>(props.max)

    const minThumbRef: Ref<HTMLInputElement | null> = ref(null)
    const maxThumbRef: Ref<HTMLInputElement | null> = ref(null)
    const activeThumb = ref<'min' | 'max' | null>(null)
    const lastInteractionPosition = ref<{ x: number; y: number } | null>(null)

    const internalMin = ref<number>(props.modelValue.min ?? absoluteMin.value)
    const internalMax = ref<number>(props.modelValue.max ?? absoluteMax.value)
    const minValueDisplay = ref<string>('')
    const maxValueDisplay = ref<string>('')
    const error = ref<string>(props.errorMessage)

    onMounted(() => {
        // Ensure absolute min/max are set on component mount
        absoluteMin.value = props.min
        absoluteMax.value = props.max

        // Initialize internal values if not set
        if (internalMin.value < absoluteMin.value) {
            internalMin.value = absoluteMin.value
        }
        if (internalMax.value > absoluteMax.value) {
            internalMax.value = absoluteMax.value
        }

        // Initialize display values ONLY if they differ from absolute bounds
        if (props.modelValue.min !== null && props.modelValue.min > absoluteMin.value) {
            minValueDisplay.value = props.modelValue.min.toString()
        }
        if (props.modelValue.max !== null && props.modelValue.max < absoluteMax.value) {
            maxValueDisplay.value = props.modelValue.max.toString()
        }
    })

    const minPercentage = computed(() => {
        const range = absoluteMax.value - absoluteMin.value
        if (range === 0) return 0
        return ((internalMin.value - absoluteMin.value) / range) * 100
    })

    const maxPercentage = computed(() => {
        const range = absoluteMax.value - absoluteMin.value
        if (range === 0) return 100
        return ((internalMax.value - absoluteMin.value) / range) * 100
    })

    const formatValue = (value: number): string => {
        if (props.customFormatter) {
            return props.customFormatter(value)
        }

        if (props.formatType === 'currency') {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: props.currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            }).format(value)
        }

        return value.toLocaleString()
    }

    const formatSelectedRange = computed(() => {
        if (internalMin.value > absoluteMin.value && internalMax.value < absoluteMax.value) {
            return `${formatValue(internalMin.value)} - ${formatValue(internalMax.value)}`
        } else if (internalMin.value > absoluteMin.value) {
            return `${t('filters.minimum')}: ${formatValue(internalMin.value)}`
        } else if (internalMax.value < absoluteMax.value) {
            return `${t('filters.maximum')}: ${formatValue(internalMax.value)}`
        }
        return ''
    })

    const validateRange = (): boolean => {
        if (internalMax.value < internalMin.value) {
            error.value = t('filters.amountRangeError')
            return false
        }
        error.value = ''
        return true
    }

    const emitChange = () => {
        if (validateRange()) {
            const value = {
                min: internalMin.value > absoluteMin.value ? internalMin.value : null,
                max: internalMax.value < absoluteMax.value ? internalMax.value : null,
            }
            emit('update:modelValue', value)
            emit('change', value)
        }
    }

    // Mouse/Touch handlers for determining which thumb to prioritize when overlapping
    const handleMinMouseDown = (event: MouseEvent) => {
        activeThumb.value = 'min'
        lastInteractionPosition.value = { x: event.clientX, y: event.clientY }

        // When thumbs overlap, determine direction of movement
        if (internalMin.value === internalMax.value) {
            const handleMove = (e: MouseEvent) => {
                if (lastInteractionPosition.value) {
                    const deltaX = e.clientX - lastInteractionPosition.value.x
                    // If moving left, min thumb takes priority
                    // If moving right, we should switch to max thumb
                    if (deltaX > 0 && maxThumbRef.value) {
                        activeThumb.value = 'max'
                        maxThumbRef.value.focus()
                        document.removeEventListener('mousemove', handleMove)
                    }
                }
            }
            document.addEventListener('mousemove', handleMove, { once: true })
        }
    }

    const handleMaxMouseDown = (event: MouseEvent) => {
        activeThumb.value = 'max'
        lastInteractionPosition.value = { x: event.clientX, y: event.clientY }

        // When thumbs overlap, determine direction of movement
        if (internalMin.value === internalMax.value) {
            const handleMove = (e: MouseEvent) => {
                if (lastInteractionPosition.value) {
                    const deltaX = e.clientX - lastInteractionPosition.value.x
                    // If moving right, max thumb takes priority
                    // If moving left, we should switch to min thumb
                    if (deltaX < 0 && minThumbRef.value) {
                        activeThumb.value = 'min'
                        minThumbRef.value.focus()
                        document.removeEventListener('mousemove', handleMove)
                    }
                }
            }
            document.addEventListener('mousemove', handleMove, { once: true })
        }
    }

    const handleMinTouchStart = (event: TouchEvent) => {
        if (event.touches.length > 0) {
            activeThumb.value = 'min'
            const touch = event.touches[0]
            lastInteractionPosition.value = { x: touch.clientX, y: touch.clientY }

            // When thumbs overlap, determine direction of movement
            if (internalMin.value === internalMax.value) {
                const handleMove = (e: TouchEvent) => {
                    if (e.touches.length > 0 && lastInteractionPosition.value) {
                        const currentTouch = e.touches[0]
                        const deltaX = currentTouch.clientX - lastInteractionPosition.value.x
                        // If moving right, switch to max thumb
                        if (deltaX > 5 && maxThumbRef.value) {
                            activeThumb.value = 'max'
                            maxThumbRef.value.focus()
                            document.removeEventListener('touchmove', handleMove)
                        }
                    }
                }
                document.addEventListener('touchmove', handleMove, { once: true })
            }
        }
    }

    const handleMaxTouchStart = (event: TouchEvent) => {
        if (event.touches.length > 0) {
            activeThumb.value = 'max'
            const touch = event.touches[0]
            lastInteractionPosition.value = { x: touch.clientX, y: touch.clientY }

            // When thumbs overlap, determine direction of movement
            if (internalMin.value === internalMax.value) {
                const handleMove = (e: TouchEvent) => {
                    if (e.touches.length > 0 && lastInteractionPosition.value) {
                        const currentTouch = e.touches[0]
                        const deltaX = currentTouch.clientX - lastInteractionPosition.value.x
                        // If moving left, switch to min thumb
                        if (deltaX < -5 && minThumbRef.value) {
                            activeThumb.value = 'min'
                            minThumbRef.value.focus()
                            document.removeEventListener('touchmove', handleMove)
                        }
                    }
                }
                document.addEventListener('touchmove', handleMove, { once: true })
            }
        }
    }

    const handleMinChange = () => {
        // When thumbs are at same position, allow movement in both directions
        if (internalMin.value === internalMax.value) {
            // Min can equal max, no restriction
        } else if (internalMin.value > internalMax.value) {
            // Only restrict if trying to go beyond max
            internalMin.value = internalMax.value
        }
        // Only show value in input if different from absolute minimum
        minValueDisplay.value =
            internalMin.value > absoluteMin.value ? internalMin.value.toString() : ''
        emitChange()
    }

    const handleMaxChange = () => {
        // When thumbs are at same position, allow movement in both directions
        if (internalMax.value === internalMin.value) {
            // Max can equal min, no restriction
        } else if (internalMax.value < internalMin.value) {
            // Only restrict if trying to go below min
            internalMax.value = internalMin.value
        }
        // Only show value in input if different from absolute maximum
        maxValueDisplay.value =
            internalMax.value < absoluteMax.value ? internalMax.value.toString() : ''
        emitChange()
    }

    const handleMinInputChange = () => {
        const value = parseFloat(minValueDisplay.value)
        if (!isNaN(value)) {
            internalMin.value = Math.max(absoluteMin.value, Math.min(value, internalMax.value))
        } else {
            internalMin.value = absoluteMin.value
        }
        // Only show value if different from absolute minimum
        minValueDisplay.value =
            internalMin.value > absoluteMin.value ? internalMin.value.toString() : ''
        emitChange()
    }

    const handleMaxInputChange = () => {
        const value = parseFloat(maxValueDisplay.value)
        if (!isNaN(value)) {
            internalMax.value = Math.min(absoluteMax.value, Math.max(value, internalMin.value))
        } else {
            internalMax.value = absoluteMax.value
        }
        // Only show value if different from absolute maximum
        maxValueDisplay.value =
            internalMax.value < absoluteMax.value ? internalMax.value.toString() : ''
        emitChange()
    }

    watch(
        () => props.modelValue,
        (newValue) => {
            if (newValue.min !== null) {
                internalMin.value = Math.max(
                    absoluteMin.value,
                    Math.min(newValue.min, absoluteMax.value)
                )
                // Only show if different from absolute minimum
                minValueDisplay.value =
                    internalMin.value > absoluteMin.value ? internalMin.value.toString() : ''
            } else {
                internalMin.value = absoluteMin.value
                minValueDisplay.value = ''
            }

            if (newValue.max !== null) {
                internalMax.value = Math.max(
                    absoluteMin.value,
                    Math.min(newValue.max, absoluteMax.value)
                )
                // Only show if different from absolute maximum
                maxValueDisplay.value =
                    internalMax.value < absoluteMax.value ? internalMax.value.toString() : ''
            } else {
                internalMax.value = absoluteMax.value
                maxValueDisplay.value = ''
            }
        },
        { immediate: true, deep: true }
    )

    watch(
        () => props.errorMessage,
        (newError) => {
            error.value = newError
        }
    )

    // Watch for changes to min/max props to update absolute values
    watch(
        () => [props.min, props.max],
        ([newMin, newMax]) => {
            absoluteMin.value = newMin as number
            absoluteMax.value = newMax as number

            // Ensure internal values are within new bounds
            if (internalMin.value < absoluteMin.value) {
                internalMin.value = absoluteMin.value
                emitChange()
            }
            if (internalMax.value > absoluteMax.value) {
                internalMax.value = absoluteMax.value
                emitChange()
            }
        }
    )
</script>

<style scoped lang="scss">
    .range-slider-wrapper {
        @apply w-full;
    }

    .range-slider-thumb {
        position: absolute;
        width: 100%;
        height: 0;
        top: 2px;
        background: transparent;
        pointer-events: none;
        -webkit-appearance: none;
        appearance: none;
        margin: 0;
        padding: 0;
        touch-action: none; /* Prevent browser touch gestures */
        -webkit-tap-highlight-color: transparent; /* Remove tap highlight on iOS */

        &:disabled {
            cursor: not-allowed;
            opacity: 0.5;
        }

        &::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px; /* Increased for better mobile touch */
            height: 20px;
            background: #3b82f6;
            border: 2px solid white;
            border-radius: 50%;
            cursor: pointer;
            pointer-events: all;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
            transition: all 0.2s ease;
            position: relative;
            margin-top: -9.5px;
            touch-action: none;
            -webkit-touch-callout: none; /* Disable callout on iOS */
            -webkit-user-select: none;
            user-select: none;

            &:hover {
                transform: scale(1.15);
                box-shadow: 0 3px 8px rgba(59, 130, 246, 0.4);
            }

            &:active {
                transform: scale(1.2);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
            }
        }

        &::-moz-range-thumb {
            width: 20px;
            height: 20px;
            background: #3b82f6;
            border: 2px solid white;
            border-radius: 50%;
            cursor: pointer;
            pointer-events: all;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
            transition: all 0.2s ease;
            touch-action: none;
            -moz-user-select: none;
            user-select: none;

            &:hover {
                transform: scale(1.15);
                box-shadow: 0 3px 8px rgba(59, 130, 246, 0.4);
            }

            &:active {
                transform: scale(1.2);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
            }
        }

        &::-webkit-slider-runnable-track {
            width: 100%;
            height: 1px;
            background: transparent;
            border: none;
        }

        &::-moz-range-track {
            width: 100%;
            height: 1px;
            background: transparent;
            border: none;
        }

        &:focus {
            outline: none;
        }

        &:focus::-webkit-slider-thumb {
            box-shadow:
                0 0 0 4px rgba(59, 130, 246, 0.2),
                0 2px 4px rgba(0, 0, 0, 0.15);
        }

        &:focus::-moz-range-thumb {
            box-shadow:
                0 0 0 4px rgba(59, 130, 246, 0.2),
                0 2px 4px rgba(0, 0, 0, 0.15);
        }

        &:disabled {
            &::-webkit-slider-thumb {
                cursor: not-allowed;
                background: #9ca3af;
                border-color: #e5e7eb;
            }

            &::-moz-range-thumb {
                cursor: not-allowed;
                background: #9ca3af;
                border-color: #e5e7eb;
            }
        }
    }

    .range-min {
        z-index: 3;
    }

    .range-max {
        z-index: 4;
    }

    /* Enhanced mobile support */
    @media (hover: none) and (pointer: coarse) {
        .range-slider-thumb {
            &::-webkit-slider-thumb {
                width: 24px; /* Larger touch target on mobile */
                height: 24px;
                margin-top: -11.5px;
            }

            &::-moz-range-thumb {
                width: 24px;
                height: 24px;
            }
        }
    }

    /* Prevent text selection during drag on mobile */
    .range-slider-wrapper {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
    }
</style>
