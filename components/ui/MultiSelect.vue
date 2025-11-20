<!-- components/ui/MultiSelect.vue -->
<template>
    <div class="multi-select group">
        <!-- Multi Select Container -->
        <div class="relative">
            <!-- Selected Items Display -->
            <div
                :id="fieldId"
                class="multi-select-trigger relative"
                :class="[
                    'w-full px-3 pt-3 text-subtitle2 border transition-all duration-200 cursor-pointer pb-2',
                    background,
                    sizeClasses[size],
                    // Rounded corners - adjust based on dropdown state (keeping your rounded style)
                    isOpen ? 'rounded-t border-b-0' : 'rounded',
                    {
                        'border-red-500 focus:ring-red-500 focus:border-red-500': error,
                        'border-gray-600 hover:border-gray-800 focus:border-blue-400':
                            !error && !disabled,
                        'bg-gray-100 cursor-not-allowed border-gray-200': disabled,
                        'focus:border-blue-500': !error && !disabled,
                        // Special styling when dropdown is open
                        'border-blue-500': (isOpen && !error) || isFocused,
                        'border-red-500': isOpen && error,
                    },
                ]"
                :tabindex="disabled ? -1 : 0"
                @click="toggleDropdown"
                @keydown.enter="toggleDropdown"
                @keydown.space.prevent="toggleDropdown"
                @keydown.escape="closeDropdown"
                @focus="isFocused = true"
                @blur="isFocused = false"
            >
                <!-- Floating Label -->
                <label
                    v-if="label"
                    :for="fieldId"
                    class="floating-label absolute transition-all duration-200 pointer-events-none select-none"
                    :class="[
                        size,
                        {
                            floating: hasContent || isFocused || isOpen,
                            error: error,
                            disabled: disabled,
                        },
                    ]"
                >
                    {{ label }}
                    <span v-if="required" class="text-red-500 ml-1">*</span>
                </label>

                <!-- Selected Items -->
                <div
                    v-if="selectedItems.length > 0"
                    class="flex flex-wrap gap-1 pr-10 mt-2"
                    :class="selectedItemsClasses[size]"
                >
                    <div
                        v-for="item in selectedItems"
                        :key="item.value"
                        class="inline-flex items-center gap-1 px-1 py-0.5 t-2 bg-gray-400 text-gray-800 rounded text-subtitle3 transition-colors duration-150 max-h-[18px]"
                    >
                        <span>{{ item.label }}</span>
                        <button
                            type="button"
                            class="text-gray-800 hover:bg-red-200 rounded transition-colors duration-150 flex items-center justify-center active:scale-95"
                            :disabled="disabled"
                            @click.stop="removeItem(item.value)"
                        >
                            <svg class="w-3 h-3">
                                <use :xlink:href="`/sprite.svg#close`"></use>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Placeholder (only when no label or when label is floating) -->
                <div
                    v-if="selectedItems.length === 0 && !label"
                    class="text-gray-500 flex items-center pr-10"
                    :class="placeholderClasses[size]"
                >
                    {{ placeholder }}
                </div>

                <!-- Empty state for spacing when no items selected and has label -->
                <div
                    v-if="selectedItems.length === 0 && label"
                    class="pr-10"
                    :class="emptyStateClasses[size]"
                ></div>

                <!-- Dropdown Arrow -->
                <div class="absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none">
                    <svg
                        class="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-transform duration-200"
                        :class="{ 'rotate-180': isOpen }"
                    >
                        <use :xlink:href="`/sprite.svg#a_down`"></use>
                    </svg>
                </div>
            </div>

            <!-- Dropdown Menu -->
            <transition name="dropdown">
                <div
                    v-if="isOpen"
                    class="absolute z-50 w-full bg-white border border-gray-600 shadow-lg max-h-60 overflow-auto"
                    :class="[
                        // Rounded corners - top only if connected to trigger
                        'rounded-b',
                        // Border styling to match trigger
                        error ? 'border-red-500' : 'border-gray-300',
                        // Position directly below trigger
                        '-mt-px',
                    ]"
                >
                    <!-- Search Input -->
                    <div class="p-3 border-b border-gray-200 bg-gray-50">
                        <input
                            ref="searchInput"
                            v-model="searchQuery"
                            type="text"
                            class="w-full px-3 py-2 text-subtitle2 border border-gray-600 rounded focus:outline-none focus:border-blue-500 bg-white"
                            :placeholder="searchPlaceholder"
                        />
                    </div>

                    <!-- Options List -->
                    <div class="py-1 bg-white">
                        <div
                            v-if="filteredOptions.length === 0"
                            class="px-4 py-3 text-gray-500 text-center text-subtitle3"
                        >
                            {{ noResultsText }}
                        </div>

                        <div
                            v-for="option in filteredOptions"
                            :key="option.value"
                            class="option-item"
                            :class="[
                                'flex items-center px-4 py-3 cursor-pointer hover:bg-red-50 hover:text-red-500 transition-colors duration-150',
                                {
                                    'bg-blue-50 text-blue-700': isSelected(option.value),
                                },
                            ]"
                            @click="toggleOption(option)"
                        >
                            <!-- Checkbox -->
                            <div class="flex items-center mr-3">
                                <div
                                    class="w-4 h-4 border-2 rounded flex items-center justify-center transition-all duration-150 cursor-pointer hover:shadow-md"
                                    :class="[
                                        isSelected(option.value)
                                            ? 'bg-blue-500 border-blue-500'
                                            : 'border-gray-600 hover:border-gray-800',
                                    ]"
                                >
                                    <svg
                                        v-if="isSelected(option.value)"
                                        class="w-3.5 h-3.5 text-white"
                                    >
                                        <use :xlink:href="`/sprite.svg#check`"></use>
                                    </svg>
                                </div>
                            </div>

                            <!-- Option Label -->
                            <span class="flex-1 text-subtitle3 font-normal">{{
                                option.label
                            }}</span>
                            <img
                                v-if="option.flagUrl"
                                :src="option.flagUrl"
                                :alt="option.label"
                                class="w-4 h-4 object-cover ml-2"
                            />
                            <!-- Optional Flag or Icon -->
                            <span v-if="option.flag" class="ml-2 text-lg">{{ option.flag }}</span>
                        </div>
                    </div>
                </div>
            </transition>
        </div>

        <!-- Error Message -->
        <div v-if="error && errorMessage" class="mt-2">
            <p class="text-caption1 text-red-500 flex items-center gap-1" role="alert">
                <svg class="w-3 h-3">
                    <use xlink:href="/sprite.svg#warn-error"></use>
                </svg>
                {{ errorMessage }}
            </p>
        </div>

        <!-- Help Text -->
        <div v-if="helpText && !error" class="mt-2">
            <p class="text-caption1 text-gray-600 flex items-center gap-1">
                <svg class="w-3 h-3 flex-shrink-0 text-gray-400">
                    <use :xlink:href="`/sprite.svg#info`"></use>
                </svg>
                {{ helpText }}
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
    import { useI18n } from 'vue-i18n'

    interface SelectOption {
        value: string | number
        label: string
        flag?: string
        [key: string]: any
    }

    interface Props {
        modelValue: (string | number)[]
        options: SelectOption[]
        label?: string
        placeholder?: string
        searchPlaceholder?: string
        noResultsText?: string
        helpText?: string
        name?: string
        required?: boolean
        disabled?: boolean
        error?: boolean
        errorMessage?: string
        size?: 'sm' | 'md' | 'lg'
        background?: string
        maxSelections?: number
        allowCustom?: boolean
        customInputPlaceholder?: string
    }

    const props = withDefaults(defineProps<Props>(), {
        label: '',
        placeholder: 'Select options',
        searchPlaceholder: 'Search...',
        noResultsText: 'No results found',
        helpText: '',
        name: undefined,
        required: false,
        disabled: false,
        error: false,
        errorMessage: '',
        size: 'md',
        background: 'bg-white',
        maxSelections: undefined,
        allowCustom: false,
        customInputPlaceholder: 'Type to add...',
    })

    const emit = defineEmits<{
        (e: 'update:modelValue', value: (string | number)[]): void
        (e: 'addCustomItem', value: string): void
        (e: 'clear-error', value: string): void
    }>()

    // Composables
    const { t } = useI18n({ useScope: 'global' })

    // State
    const isOpen = ref(false)
    const isFocused = ref(false)
    const searchQuery = ref('')
    const searchInput = ref<HTMLInputElement>()

    // Size classes mapping (same as Select component)
    const sizeClasses: Record<string, string> = {
        sm: 'min-h-8',
        md: 'min-h-10',
        lg: 'min-h-12',
    }

    const selectedItemsClasses: Record<string, string> = {
        // sm: 'min-h-4',
        // md: 'min-h-3.5',
        // lg: 'min-h-6',
    }

    const placeholderClasses: Record<string, string> = {
        sm: 'min-h-4',
        md: 'min-h-6',
        lg: 'min-h-6',
    }

    const emptyStateClasses: Record<string, string> = {
        sm: 'min-h-4',
        md: 'min-h-6',
        lg: 'min-h-6',
    }

    // Computed
    const fieldId = computed(() => {
        return props.name ? `multi-select-${props.name}` : 'multi-select'
    })

    const hasContent = computed(() => {
        return props.modelValue.length > 0
    })

    const selectedItems = computed(() => {
        return props.options.filter((option) => props.modelValue.includes(option.value))
    })

    const filteredOptions = computed(() => {
        if (!searchQuery.value) return props.options

        const query = searchQuery.value.toLowerCase()
        return props.options.filter((option) => option.label.toLowerCase().includes(query))
    })

    // Methods
    const toggleDropdown = () => {
        if (props.disabled) return

        isOpen.value = !isOpen.value

        if (isOpen.value) {
            nextTick(() => {
                searchInput.value?.focus()
            })
        }
    }

    const closeDropdown = () => {
        isOpen.value = false
        isFocused.value = false
        searchQuery.value = ''
    }

    const isSelected = (value: string | number): boolean => {
        return props.modelValue.includes(value)
    }

    const toggleOption = (option: SelectOption) => {
        const currentValues = [...props.modelValue]
        const index = currentValues.indexOf(option.value)

        if (index > -1) {
            // Remove item
            currentValues.splice(index, 1)
        } else {
            // Add item (check max selections)
            if (props.maxSelections && currentValues.length >= props.maxSelections) {
                return // Don't add if at maximum
            }
            currentValues.push(option.value)
        }

        emit('update:modelValue', currentValues)
    }

    const removeItem = (value: string | number) => {
        const currentValues = props.modelValue.filter((item) => item !== value)
        emit('update:modelValue', currentValues)
    }

    // Handle click outside
    const handleClickOutside = (event: Event) => {
        const target = event.target as Element
        const container = document.getElementById(fieldId.value)

        if (container && !container.contains(target)) {
            closeDropdown()
        }
    }

    // Lifecycle
    onMounted(() => {
        document.addEventListener('click', handleClickOutside)
    })

    onUnmounted(() => {
        document.removeEventListener('click', handleClickOutside)
    })

    // Watch for external changes
    watch(
        () => props.modelValue,
        () => {
            emit('clear-error', props.name)
        }
    )
</script>

<style scoped>
    .dropdown-enter-active,
    .dropdown-leave-active {
        transition:
            opacity 0.2s ease,
            transform 0.2s ease;
    }

    .dropdown-enter-from,
    .dropdown-leave-to {
        opacity: 0;
        transform: translateY(-4px);
    }

    .dropdown-enter-to,
    .dropdown-leave-from {
        opacity: 1;
        transform: translateY(0);
    }

    /* Floating label styles - keeping your original text colors */
    .floating-label {
        @apply text-gray-950 text-subtitle2 transition-all cursor-pointer;
    }

    .floating-label.error {
        @apply text-red-500;
    }

    .floating-label.disabled {
        @apply text-gray-400;
    }

    .floating-label.sm {
        @apply absolute left-2 top-2;
    }

    .floating-label.sm.floating {
        @apply top-0.5 left-2 text-caption1 bg-white px-1 text-gray-800;
    }

    .floating-label.md {
        @apply absolute left-2 top-3;
    }

    .floating-label.md.floating {
        @apply top-1.5 left-2 text-caption1 bg-white px-1 text-gray-800;
    }

    .floating-label.lg {
        @apply top-4 left-3 text-subtitle2 bg-white;
    }

    .floating-label.lg.floating {
        @apply top-2 left-2 text-caption1 bg-white px-1 text-gray-800;
    }

    .floating-label.error.floating {
        @apply text-red-500;
    }

    .floating-label.disabled.floating {
        @apply text-gray-400;
    }
</style>
