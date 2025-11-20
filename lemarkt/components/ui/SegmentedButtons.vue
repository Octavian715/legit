<template>
    <div class="segment-wrapper w-full max-w-md mx-auto mt-4">
        <div
            v-if="hasOptions"
            class="relative flex border overflow-hidden"
            :class="[disabled ? 'border-blue-300' : 'border-blue-400', borderRadius]"
            role="tablist"
            :aria-label="ariaLabel || 'Segmented control'"
        >
            <!-- Active segment indicator without explicit border radius, relying on parent clipping -->
            <div
                class="segment-indicator absolute bg-blue-400 transition-all duration-300 top-0 h-full z-0"
                :style="indicatorStyle"
                aria-hidden="true"
            ></div>

            <button
                v-for="(option, index) in options"
                :key="`${option.value}-${index}`"
                ref="segmentButtons"
                class="flex-1 text-center transition-colors duration-300 relative focus:outline-none"
                :class="[
                    sizeClasses,
                    {
                        'cursor-not-allowed text-gray-600': disabled || !option.active,
                        'text-white': selectedValue === option.value && !disabled && option.active,
                        'text-blue-950 hover:text-blue-500':
                            selectedValue !== option.value && !disabled && option.active,
                        'text-gray-400': !option.active,
                    },
                ]"
                :disabled="disabled || !option.active"
                :aria-selected="selectedValue === option.value"
                :aria-disabled="disabled || !option.active"
                role="tab"
                :tabindex="selectedValue === option.value ? 0 : -1"
                @click="selectSegment(option, index)"
                @keydown="handleKeydown($event, index)"
            >
                {{ option.label }}
            </button>
        </div>

        <!-- Fallback for empty options -->
        <div
            v-else
            class="flex items-center justify-center py-4 text-gray-500 text-caption1 border border-gray-300"
            :class="[borderRadius]"
        >
            {{ $t('noOptionsAvailable', 'No options available') }}
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, watch, nextTick } from 'vue'
    import type { SegmentButtonOption, SegmentButtonOptionType } from '~/types/ui/segmentedButtons'

    const props = withDefaults(defineProps<SegmentButtonOptionType>(), {
        defaultActive: undefined,
        disabled: false,
        borderRadius: 'rounded',
        size: 'md',
    })

    const selectedValue = ref<string | undefined>(props.defaultActive)
    const segmentButtons = ref<HTMLButtonElement[]>([])

    const emit = defineEmits<{
        (e: 'change', value: string): void
    }>()

    const hasOptions = computed(() => props.options && props.options.length > 0)

    const activeOptions = computed(() => props.options.filter((option) => option.active !== false))

    const selectedIndex = computed(() => {
        return props.options.findIndex((option) => option.value === selectedValue.value)
    })

    const sizeClasses = computed(() => {
        const sizeMap = {
            sm: 'px-2 md:px-4 py-1 text-subtitle4',
            md: 'px-3 py-2 text-subtitle2',
            lg: 'px-3 md:px-6 py-3 text-subtitle1',
        }
        return sizeMap[props.size] || sizeMap.md
    })

    const indicatorStyle = computed(() => {
        if (selectedIndex.value === -1 || !hasOptions.value) {
            return { width: '0%', left: '0%' }
        }

        const totalOptions = props.options.length
        const width = 100 / totalOptions
        const left = selectedIndex.value * width

        return {
            width: `${width}%`,
            left: `${left}%`,
        }
    })

    const selectSegment = (option: SegmentButtonOption, index: number) => {
        if (props.disabled || option.active === false) return

        selectedValue.value = option.value
        emit('change', option.value)

        nextTick(() => {
            segmentButtons.value[index]?.focus()
        })
    }

    const handleKeydown = (event: KeyboardEvent, currentIndex: number) => {
        if (props.disabled) return

        const availableIndexes = props.options
            .map((option, index) => ({ option, index }))
            .filter(({ option }) => option.active !== false)
            .map(({ index }) => index)

        const currentAvailableIndex = availableIndexes.indexOf(currentIndex)
        let targetIndex = currentIndex

        switch (event.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                event.preventDefault()
                if (currentAvailableIndex > 0) {
                    targetIndex = availableIndexes[currentAvailableIndex - 1]
                } else {
                    targetIndex = availableIndexes[availableIndexes.length - 1]
                }
                break

            case 'ArrowRight':
            case 'ArrowDown':
                event.preventDefault()
                if (currentAvailableIndex < availableIndexes.length - 1) {
                    targetIndex = availableIndexes[currentAvailableIndex + 1]
                } else {
                    targetIndex = availableIndexes[0]
                }
                break

            case 'Home':
                event.preventDefault()
                targetIndex = availableIndexes[0]
                break

            case 'End':
                event.preventDefault()
                targetIndex = availableIndexes[availableIndexes.length - 1]
                break

            case 'Enter':
            case ' ':
                event.preventDefault()
                selectSegment(props.options[currentIndex], currentIndex)
                return

            default:
                return
        }

        if (targetIndex !== currentIndex && props.options[targetIndex]) {
            selectSegment(props.options[targetIndex], targetIndex)
        }
    }

    const validateOptions = () => {
        if (!props.options || props.options.length === 0) {
            return false
        }

        const values = new Set<string>()
        const duplicates: string[] = []

        props.options.forEach((option) => {
            if (!option.value || !option.label) {
                console.warn('SegmentedButtons: All options must have value and label properties')
            }

            if (values.has(option.value)) {
                duplicates.push(option.value)
            }
            values.add(option.value)
        })

        if (duplicates.length > 0) {
            console.warn(`SegmentedButtons: Duplicate values detected: ${duplicates.join(', ')}`)
        }

        return true
    }

    const initializeSelection = () => {
        if (!hasOptions.value) return

        if (props.defaultActive) {
            const defaultOption = props.options.find((opt) => opt.value === props.defaultActive)
            if (defaultOption && defaultOption.active !== false) {
                selectedValue.value = props.defaultActive
                return
            }
        }

        const firstActiveOption = props.options.find((opt) => opt.active !== false)
        if (firstActiveOption) {
            selectedValue.value = firstActiveOption.value
        }
    }

    watch(
        () => props.defaultActive,
        (newDefaultActive) => {
            if (newDefaultActive && props.options.find((opt) => opt.value === newDefaultActive)) {
                selectedValue.value = newDefaultActive
            }
        }
    )

    watch(
        () => props.options,
        () => {
            if (validateOptions()) {
                const currentOption = props.options.find((opt) => opt.value === selectedValue.value)
                if (!currentOption || currentOption.active === false) {
                    initializeSelection()
                }
            }
        },
        { deep: true }
    )

    onMounted(() => {
        if (validateOptions()) {
            initializeSelection()

            if (selectedValue.value) {
                emit('change', selectedValue.value)
            }
        }
    })
</script>

<style scoped>
    .segment-indicator {
        transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .segment-wrapper button:focus {
        z-index: 20;
    }
</style>
