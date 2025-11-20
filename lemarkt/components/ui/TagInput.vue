<template>
    <div class="tab-input-wrapper">
        <div
            class="tab-input-container"
            :class="[
                `tab-input-container--${size}`,
                {
                    'tab-input-container--focused': isFocused,
                    'tab-input-container--disabled': disabled,
                    'tab-input-container--has-value': modelValue.length > 0 || isFocused,
                },
            ]"
            @click="handleContainerClick"
        >
            <label
                :for="inputId"
                class="tab-input-label"
                :class="[
                    `tab-input-label--${size}`,
                    {
                        'tab-input-label--float':
                            modelValue.length > 0 || isFocused || inputValue.length,
                    },
                ]"
            >
                {{ label || placeholder }} <span v-if="required" class="text-red-500">*</span>
            </label>

            <div
                class="tab-input-tags px-3"
                :class="{ 'mt-5': modelValue.length > 0, 'mt-auto': modelValue.length === 0 }"
            >
                <div
                    v-for="(tab, index) in modelValue"
                    :key="getTabKey(tab, index)"
                    class="tab-input-tag"
                    :class="`tab-input-tag--${size}`"
                    :tabindex="disabled ? -1 : 0"
                    @keydown.delete="removeTab(index)"
                    @keydown.backspace="removeTab(index)"
                >
                    <span class="tab-input-tag-text">{{ getTabLabel(tab) }}</span>
                    <button
                        type="button"
                        class="tab-input-tag-remove"
                        :disabled="disabled"
                        aria-label="Remove item"
                        @click.stop="removeTab(index)"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div class="tab-input-field">
                    <input
                        :id="inputId"
                        ref="inputRef"
                        v-model="inputValue"
                        class="mt-auto"
                        type="text"
                        :placeholder="modelValue.length > 0 ? computedPlaceholder : ''"
                        :disabled="disabled"
                        :tabindex="disabled ? -1 : 0"
                        :aria-expanded="isDropdownOpen"
                        :aria-autocomplete="'list'"
                        :aria-controls="dropdownId"
                        :aria-activedescendant="activeItemId"
                        role="combobox"
                        @focus="handleFocus"
                        @blur="handleBlur"
                        @keydown.enter.prevent="handleEnter"
                        @keydown.tab="handleTab"
                        @keydown.backspace="handleBackspace"
                        @keydown.delete="handleDelete"
                        @keydown.down.prevent="handleArrowDown"
                        @keydown.up.prevent="handleArrowUp"
                        @keydown.esc="closeDropdown"
                        @input="handleInput"
                    />
                </div>
            </div>

            <div
                v-if="isDropdownOpen && filteredSuggestions.length > 0"
                :id="dropdownId"
                class="tab-input-dropdown"
                role="listbox"
            >
                <div
                    v-for="(suggestion, index) in filteredSuggestions"
                    :id="`${dropdownId}-item-${index}`"
                    :key="getSuggestionKey(suggestion, index)"
                    class="tab-input-dropdown-item"
                    :class="[
                        `tab-input-dropdown-item--${size}`,
                        { 'tab-input-dropdown-item--active': index === activeIndex },
                    ]"
                    role="option"
                    :aria-selected="index === activeIndex"
                    @mousedown.prevent="addTab(suggestion)"
                    @mouseover="activeIndex = index"
                >
                    <slot name="suggestion" :suggestion="suggestion">
                        {{ getTabLabel(suggestion) }}
                    </slot>
                </div>

                <div
                    v-if="allowCustom && inputValue.trim().length > 0 && !exactMatch"
                    class="tab-input-dropdown-item tab-input-dropdown-item--custom"
                    :class="[
                        `tab-input-dropdown-item--${size}`,
                        {
                            'tab-input-dropdown-item--active':
                                activeIndex === filteredSuggestions.length,
                        },
                    ]"
                    @mousedown.prevent="addCustomTab"
                >
                    <span class="text-gray-500 mr-1">{{ $t('addCustomKeyword') }}:</span>
                    <span class="font-medium">{{ inputValue }}</span>
                </div>
            </div>

            <div
                v-if="
                    isDropdownOpen &&
                    filteredSuggestions.length === 0 &&
                    !isLoading &&
                    (!allowCustom || inputValue.trim().length === 0)
                "
                class="tab-input-no-results"
            >
                <slot name="no-results">
                    <span class="text-gray-400 text-subtitle3">{{ $t('noSuggestions') }}</span>
                </slot>
            </div>

            <div
                v-if="
                    isDropdownOpen &&
                    filteredSuggestions.length === 0 &&
                    !isLoading &&
                    allowCustom &&
                    inputValue.trim().length > 0
                "
                class="tab-input-dropdown"
            >
                <div
                    class="tab-input-dropdown-item tab-input-dropdown-item--custom"
                    :class="[
                        `tab-input-dropdown-item--${size}`,
                        { 'tab-input-dropdown-item--active': activeIndex === 0 },
                    ]"
                    @mousedown.prevent="addCustomTab"
                >
                    <span class="text-gray-800 mr-1">{{ $t('selectWithAdd.addLabel') }}:</span>
                    <span class="font-medium">{{ inputValue }}</span>
                </div>
            </div>

            <div v-if="isLoading" class="tab-input-loading">
                <span class="tab-input-loading-spinner"></span>
                <span>{{ $t('loading') }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'

    interface TabInputProps {
        modelValue: any[]
        suggestions?: any[]
        fetchSuggestions?: (query: string) => Promise<any[]>
        labelKey?: string
        valueKey?: string
        placeholder?: string
        label?: string
        disabled?: boolean
        limit?: number
        minChars?: number
        debounceMs?: number
        allowDuplicates?: boolean
        required?: boolean
        allowCustom?: boolean
        validateCustom?: (value: string) => boolean | string
        size?: 'sm' | 'md' | 'lg'
        showDropdownOnFocus?: boolean
        customTagTransform?: (value: string) => any
    }

    const props = withDefaults(defineProps<TabInputProps>(), {
        suggestions: () => [],
        labelKey: 'label',
        valueKey: 'value',
        placeholder: 'Add items...',
        label: '',
        disabled: false,
        limit: 0,
        minChars: 0,
        debounceMs: 300,
        allowDuplicates: false,
        allowCustom: true,
        size: 'md',
        showDropdownOnFocus: true,
    })

    const emit = defineEmits<{
        (e: 'update:modelValue', value: any[]): void
        (e: 'add', item: any): void
        (e: 'remove', item: any, index: number): void
        (e: 'focus'): void
        (e: 'blur'): void
        (e: 'search', query: string): void
        (e: 'fetch-error', error: any): void
        (e: 'custom-add', value: string): void
        (e: 'validation-error', error: string): void
    }>()

    const uniqueId = `tab-input-${Math.random().toString(36).substring(2, 9)}`
    const inputId = `${uniqueId}-input`
    const dropdownId = `${uniqueId}-dropdown`
    const activeItemId = computed(() =>
        activeIndex.value >= 0 ? `${dropdownId}-item-${activeIndex.value}` : ''
    )

    const inputValue = ref('')
    const inputRef = ref<HTMLInputElement | null>(null)
    const isFocused = ref(false)
    const isDropdownOpen = ref(false)
    const activeIndex = ref(-1)
    const fetchedSuggestions = ref<any[]>([])
    const isLoading = ref(false)
    const debounceTimer = ref<number | null>(null)

    const computedPlaceholder = computed(() => {
        if (props.modelValue.length === 0) {
            return props.placeholder
        }
        return ''
    })

    const allSuggestions = computed(() => {
        return [...props.suggestions, ...fetchedSuggestions.value]
    })

    const exactMatch = computed(() => {
        if (!inputValue.value) return false
        const searchValue = inputValue.value.toLowerCase().trim()
        return filteredSuggestions.value.some((suggestion) => {
            const label = getTabLabel(suggestion).toLowerCase()
            return label === searchValue
        })
    })

    const getTabLabel = (tab: any): string => {
        if (typeof tab === 'string') return tab
        if (typeof tab === 'number') return tab.toString()
        return tab[props.labelKey] || ''
    }

    const getTabValue = (tab: any): any => {
        if (typeof tab === 'string' || typeof tab === 'number') return tab
        return tab[props.valueKey] !== undefined ? tab[props.valueKey] : tab
    }

    const getTabKey = (tab: any, index: number): string => {
        const value = getTabValue(tab)
        if (typeof value === 'object' && value !== null) {
            return `selected-${index}-${JSON.stringify(value)}`
        }
        return `selected-${index}-${value}`
    }

    const getSuggestionKey = (suggestion: any, index: number): string => {
        const value = getTabValue(suggestion)
        if (typeof value === 'object' && value !== null) {
            return `suggestion-${index}-${JSON.stringify(value)}`
        }
        return `suggestion-${index}-${value}`
    }

    const areValuesEqual = (value1: any, value2: any): boolean => {
        if (value1 === value2) return true

        if (typeof value1 !== typeof value2) return false

        if (typeof value1 === 'object' && value1 !== null && value2 !== null) {
            const keys1 = Object.keys(value1).sort()
            const keys2 = Object.keys(value2).sort()

            if (keys1.length !== keys2.length) return false
            if (keys1.join(',') !== keys2.join(',')) return false

            return keys1.every((key) => {
                const val1 = value1[key]
                const val2 = value2[key]

                if (typeof val1 === 'object' && val1 !== null) {
                    return areValuesEqual(val1, val2)
                }

                return val1 === val2
            })
        }

        return false
    }

    const isTabSelected = (suggestion: any): boolean => {
        const suggestionValue = getTabValue(suggestion)

        return props.modelValue.some((selectedItem) => {
            const selectedValue = getTabValue(selectedItem)
            return areValuesEqual(suggestionValue, selectedValue)
        })
    }

    const filteredSuggestions = computed(() => {
        if (inputValue.value.length > 0 && inputValue.value.length < props.minChars) {
            return []
        }

        const filtered = allSuggestions.value.filter((suggestion) => {
            if (!props.allowDuplicates && isTabSelected(suggestion)) {
                return false
            }

            if (inputValue.value.length === 0) {
                return true
            }

            const label = getTabLabel(suggestion).toLowerCase()
            const query = inputValue.value.toLowerCase()
            return label.includes(query)
        })

        return filtered
    })

    const isLimitReached = computed(() => {
        return props.limit > 0 && props.modelValue.length >= props.limit
    })

    const validateCustomTag = (value: string): boolean | string => {
        if (props.validateCustom) {
            return props.validateCustom(value)
        }

        if (!value || value.trim().length === 0) {
            return 'Value cannot be empty'
        }

        return true
    }

    const addCustomTab = () => {
        if (!props.allowCustom) return

        const trimmedValue = inputValue.value.trim()
        if (!trimmedValue) return

        const validation = validateCustomTag(trimmedValue)
        if (validation !== true) {
            emit('validation-error', typeof validation === 'string' ? validation : 'Invalid value')
            return
        }

        const customTag = props.customTagTransform
            ? props.customTagTransform(trimmedValue)
            : trimmedValue

        if (!props.allowDuplicates && isTabSelected(customTag)) {
            shakeExistingTag(customTag)
            closeDropdown()
            resetInput()
            return
        }

        addTab(customTag)
        emit('custom-add', trimmedValue)
    }

    const shakeExistingTag = (tag: any) => {
        const duplicateIndex = props.modelValue.findIndex((item) => {
            return areValuesEqual(getTabValue(item), getTabValue(tag))
        })

        if (duplicateIndex !== -1) {
            const tagElements = document.querySelectorAll('.tab-input-tag')
            if (tagElements && tagElements[duplicateIndex]) {
                const tagElement = tagElements[duplicateIndex] as HTMLElement
                tagElement.classList.add('shake-animation')

                setTimeout(() => {
                    tagElement.classList.remove('shake-animation')
                }, 820)
            }
        }
    }

    const addTab = (tab: any) => {
        if (props.disabled || isLimitReached.value) return

        if (!props.allowDuplicates && isTabSelected(tab)) {
            shakeExistingTag(tab)
            closeDropdown()
            resetInput()
            return
        }

        // Extract the actual value to store (handles both strings and objects)
        const valueToStore = getTabValue(tab)

        const newTabs = [...props.modelValue, valueToStore]
        emit('update:modelValue', newTabs)
        emit('add', valueToStore)

        resetInput()

        nextTick(() => {
            inputRef.value?.focus()
            if (props.showDropdownOnFocus && allSuggestions.value.length > 0) {
                openDropdown()
            }
        })
    }

    const removeTab = (index: number) => {
        if (props.disabled) return

        const removed = props.modelValue[index]
        const newTabs = [...props.modelValue]
        newTabs.splice(index, 1)

        emit('update:modelValue', newTabs)
        emit('remove', removed, index)

        nextTick(() => {
            inputRef.value?.focus()
            if (isFocused.value && props.showDropdownOnFocus) {
                openDropdown()
            }
        })
    }

    const handleFocus = () => {
        isFocused.value = true
        emit('focus')

        if (
            props.showDropdownOnFocus &&
            (allSuggestions.value.length > 0 || props.fetchSuggestions || props.allowCustom)
        ) {
            openDropdown()

            if (props.fetchSuggestions && inputValue.value.length >= props.minChars) {
                fetchSuggestionsDebounced(inputValue.value)
            }
        }
    }

    const handleBlur = () => {
        isFocused.value = false

        setTimeout(() => {
            closeDropdown()
        }, 200)

        emit('blur')
    }

    const handleEnter = () => {
        if (isDropdownOpen.value && activeIndex.value >= 0) {
            if (activeIndex.value < filteredSuggestions.value.length) {
                addTab(filteredSuggestions.value[activeIndex.value])
            } else if (props.allowCustom && inputValue.value.trim().length > 0) {
                addCustomTab()
            }
        } else if (props.allowCustom && inputValue.value.trim().length > 0) {
            addCustomTab()
        }
    }

    const handleTab = (event: KeyboardEvent) => {
        if (props.allowCustom && inputValue.value.trim().length > 0 && !event.shiftKey) {
            event.preventDefault()
            addCustomTab()
        }
    }

    const handleBackspace = () => {
        if (!inputValue.value && props.modelValue.length > 0) {
            removeTab(props.modelValue.length - 1)
        }
    }

    const handleDelete = () => {
        if (!inputValue.value && props.modelValue.length > 0) {
            removeTab(props.modelValue.length - 1)
        }
    }

    const handleArrowDown = () => {
        if (!isDropdownOpen.value) {
            openDropdown()
            return
        }

        const maxIndex =
            props.allowCustom && inputValue.value.trim().length > 0 && !exactMatch.value
                ? filteredSuggestions.value.length
                : filteredSuggestions.value.length - 1

        if (maxIndex < 0) return

        activeIndex.value = activeIndex.value < maxIndex ? activeIndex.value + 1 : 0

        nextTick(() => {
            if (activeIndex.value < filteredSuggestions.value.length) {
                const activeItem = document.getElementById(
                    `${dropdownId}-item-${activeIndex.value}`
                )
                if (activeItem) {
                    activeItem.scrollIntoView({ block: 'nearest' })
                }
            }
        })
    }

    const handleArrowUp = () => {
        if (!isDropdownOpen.value) {
            openDropdown()
            return
        }

        const maxIndex =
            props.allowCustom && inputValue.value.trim().length > 0 && !exactMatch.value
                ? filteredSuggestions.value.length
                : filteredSuggestions.value.length - 1

        if (maxIndex < 0) return

        activeIndex.value = activeIndex.value > 0 ? activeIndex.value - 1 : maxIndex

        nextTick(() => {
            if (activeIndex.value < filteredSuggestions.value.length) {
                const activeItem = document.getElementById(
                    `${dropdownId}-item-${activeIndex.value}`
                )
                if (activeItem) {
                    activeItem.scrollIntoView({ block: 'nearest' })
                }
            }
        })
    }

    const handleInput = () => {
        activeIndex.value = -1

        emit('search', inputValue.value)

        if (inputValue.value.length >= props.minChars) {
            openDropdown()

            if (props.fetchSuggestions) {
                fetchSuggestionsDebounced(inputValue.value)
            }
        } else if (inputValue.value.length === 0 && props.minChars === 0) {
            openDropdown()
        } else {
            closeDropdown()
        }
    }

    const openDropdown = () => {
        if (
            !props.disabled &&
            (inputValue.value.length >= props.minChars ||
                props.minChars === 0 ||
                (props.allowCustom && inputValue.value.trim().length > 0))
        ) {
            isDropdownOpen.value = true
        }
    }

    const closeDropdown = () => {
        isDropdownOpen.value = false
        activeIndex.value = -1
    }

    const resetInput = () => {
        inputValue.value = ''
        activeIndex.value = -1
    }

    const handleOutsideClick = (event: MouseEvent) => {
        const wrapper = (inputRef.value?.closest('.tab-input-wrapper') as HTMLElement) || null
        if (wrapper && !wrapper.contains(event.target as Node)) {
            closeDropdown()
        }
    }

    const fetchSuggestionsDebounced = (query: string) => {
        if (debounceTimer.value !== null) {
            window.clearTimeout(debounceTimer.value)
        }

        debounceTimer.value = window.setTimeout(async () => {
            if (
                (query.length >= props.minChars || props.minChars === 0) &&
                props.fetchSuggestions
            ) {
                isLoading.value = true
                try {
                    const suggestions = await props.fetchSuggestions(query)
                    fetchedSuggestions.value = suggestions || []
                    if (isFocused.value) {
                        openDropdown()
                    }
                } catch (error) {
                    emit('fetch-error', error)
                } finally {
                    isLoading.value = false
                }
            }
        }, props.debounceMs)
    }

    const handleContainerClick = (event: MouseEvent) => {
        if (props.disabled) return

        const target = event.target as HTMLElement
        const isTagOrButton =
            target.closest('.tab-input-tag') || target.closest('.tab-input-tag-remove')

        if (!isTagOrButton) {
            inputRef.value?.focus()

            if (!isDropdownOpen.value && props.showDropdownOnFocus) {
                openDropdown()

                if (props.fetchSuggestions && inputValue.value.length >= props.minChars) {
                    fetchSuggestionsDebounced(inputValue.value)
                }
            }
        }
    }

    watch(
        () => props.suggestions,
        () => {
            if (
                isFocused.value &&
                (inputValue.value.length >= props.minChars || props.minChars === 0)
            ) {
                openDropdown()
            }
        }
    )

    watch(
        () => props.modelValue,
        () => {
            activeIndex.value = -1
        },
        { deep: true }
    )

    onMounted(() => {
        document.addEventListener('click', handleOutsideClick)
    })

    onBeforeUnmount(() => {
        document.removeEventListener('click', handleOutsideClick)

        if (debounceTimer.value !== null) {
            window.clearTimeout(debounceTimer.value)
        }
    })

    defineExpose({
        inputRef,
        focus: () => inputRef.value?.focus(),
        blur: () => inputRef.value?.blur(),
        addTab,
        addCustomTab,
        removeTab,
        resetInput,
    })
</script>

<style scoped>
    .tab-input-wrapper {
        @apply relative;
    }

    .tab-input-container {
        @apply border border-gray-600 rounded w-full bg-white flex flex-col relative;
    }

    .tab-input-container--sm {
        @apply min-h-8;
    }

    .tab-input-container--md {
        @apply min-h-10;
    }

    .tab-input-container--lg {
        @apply min-h-12;
    }

    .tab-input-container--focused {
        @apply border-blue-500 shadow-sm;
    }

    .tab-input-container--disabled {
        @apply bg-gray-100 cursor-not-allowed;
    }

    .tab-input-label {
        @apply absolute text-gray-950 transition-all duration-200 pointer-events-none;
    }

    .tab-input-label--sm {
        @apply absolute left-2 top-2;
    }

    .tab-input-label--md {
        @apply absolute left-3 top-3;
    }

    .tab-input-label--lg {
        @apply top-4 left-3 text-subtitle2;
    }

    .tab-input-label--sm.tab-input-label--float {
        @apply top-0.5 left-2 text-caption1;
        transform: translateY(0);
    }

    .tab-input-label--md.tab-input-label--float {
        @apply top-0.5 left-3 text-caption1;
        transform: translateY(0);
    }

    .tab-input-label--lg.tab-input-label--float {
        @apply top-2 left-3 text-caption1;
        transform: translateY(0);
    }

    .tab-input-tags {
        @apply flex flex-wrap gap-1;
    }

    .tab-input-tag {
        @apply px-1 py-0.5 bg-gray-500 text-gray-800 rounded flex items-center gap-1 max-w-full max-h-[18px];
    }

    .tab-input-tag-text {
        @apply truncate text-gray-800 text-subtitle3;
    }

    .tab-input-tag-remove {
        @apply text-gray-800 hover:text-red-500 focus:outline-none rounded active:scale-95 active:text-red-700;
    }

    .tab-input-field {
        @apply flex-grow;
    }

    .tab-input-field input {
        @apply border-none w-full focus:outline-none bg-transparent mt-auto;
    }

    .tab-input-dropdown {
        @apply absolute left-0 right-0 border border-gray-200 bg-white rounded shadow-lg z-10 max-h-60 overflow-y-auto;
        top: 100%;
    }

    .tab-input-dropdown-item {
        @apply hover:bg-gray-100 cursor-pointer;
    }

    .tab-input-dropdown-item--sm {
        @apply px-3 py-1.5 text-subtitle3;
    }

    .tab-input-dropdown-item--md {
        @apply px-4 py-2 text-subtitle3;
    }

    .tab-input-dropdown-item--lg {
        @apply px-4 py-2.5 text-subtitle3;
    }

    .tab-input-dropdown-item--active {
        @apply bg-blue-50 text-blue-700;
    }

    .tab-input-dropdown-item--custom {
        @apply border-t border-gray-200 bg-gray-50;
    }

    .tab-input-dropdown-item--custom:hover {
        @apply bg-blue-50;
    }

    .tab-input-no-results {
        @apply absolute left-0 right-0 border border-gray-200 bg-white rounded shadow-lg z-10 px-4 py-3 text-center;
        top: 100%;
    }

    .tab-input-loading {
        @apply absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-500;
    }

    .tab-input-loading-spinner {
        @apply animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full;
    }

    @keyframes shake {
        0%,
        100% {
            transform: translateX(0);
        }
        10%,
        30%,
        50%,
        70%,
        90% {
            transform: translateX(-5px);
        }
        20%,
        40%,
        60%,
        80% {
            transform: translateX(5px);
        }
    }

    .shake-animation {
        animation: shake 0.8s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        transform: translate3d(0, 0, 0);
        backface-visibility: hidden;
        perspective: 1000px;
    }
</style>
