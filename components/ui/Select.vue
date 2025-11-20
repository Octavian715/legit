<template>
    <div
        ref="selectWrapperRef"
        class="select-wrapper relative"
        :class="{
            'dropdown-top': dropdownPosition === 'top-start',
            'dropdown-bottom': dropdownPosition === 'bottom-start',
        }"
        @mouseenter="onHover"
        @mouseleave="onLeave"
    >
        <div class="relative flex items-center gap-4">
            <label
                :for="name"
                class="floating-label absolute text-gray-900 text-subtitle2 transition-all z-[2] cursor-pointer"
                :class="[
                    size,
                    {
                        'cursor-not-allowed': disabled,
                        floating: hasValue || isFocused,
                        error: errorMessage?.length,
                    },
                ]"
                @click="focusSelect"
            >
                {{ label }}
                <span v-if="required" class="text-red-500">*</span>
            </label>

            <v-select
                ref="selectRef"
                :uid="id"
                :name="name"
                :options="options"
                :model-value="internalValue"
                :multiple="multiple"
                :searchable="searchable"
                :disabled="disabled"
                :clearable="clearable"
                :label="selectLabel"
                :reduce="reduce"
                :taggable="taggable"
                :push-tags="pushTags"
                :append-to-body="true"
                :calculate-position="calculateDropdownPosition"
                :select-on-key-codes="taggable ? [188, 13] : []"
                :class="[
                    'group',
                    'select',
                    background,
                    isFocused ? 'select--focus' : null,
                    sizeClasses[size],
                    {
                        'error-border': errorMessage?.length,
                        disabled,
                        'multi-select': multiple && hasMultipleValues,
                    },
                ]"
                @focus="handleFocus(true)"
                @blur="handleFocus(false)"
                @search:focus="handleFocus(true)"
                @search:blur="handleFocus(false)"
                @update:modelValue="updatedValue"
                @open="handleOpen"
                @close="handleClose"
            >
                <template v-if="multiple && !taggable" #option="{ label, value }">
                    <div class="flex gap-2.5 w-full cursor-pointer" @mousedown.prevent>
                        <label
                            class="flex items-center cursor-pointer relative"
                            @click.stop.prevent="handleOptionToggle(value)"
                        >
                            <input
                                type="checkbox"
                                :checked="isOptionSelected(value)"
                                class="peer h-4 w-4 cursor-pointer transition-all appearance-none rounded hover:shadow-md border border-gray-600 checked:bg-blue-500 checked:border-blue-500"
                            />
                            <span
                                class="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-3.5 w-3.5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    stroke="currentColor"
                                    stroke-width="1"
                                >
                                    <path
                                        fill-rule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clip-rule="evenodd"
                                    ></path>
                                </svg>
                            </span>
                        </label>
                        <label
                            class="cursor-pointer text-subtitle3 font-normal"
                            @click.stop.prevent="handleOptionToggle(value)"
                        >
                            {{ label }}
                        </label>
                    </div>
                </template>

                <template #selected-option="option">
                    <span class="tab-input-tag-text">{{ option[selectLabel] }}</span>
                </template>

                <template #open-indicator="{ attributes }">
                    <span v-bind="attributes">
                        <svg class="w-4 h-4 text-gray-800 hover:text-gray-600 active:text-gray-300">
                            <use xlink:href="/sprite.svg#a_down"></use>
                        </svg>
                    </span>
                </template>

                <template #deselect="{ attributes }">
                    <button
                        v-bind="attributes"
                        type="button"
                        class="vs__deselect"
                        @click="handleDeselect"
                        @mousedown.prevent.stop
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
                </template>
            </v-select>

            <Checkbox
                v-if="selectAllEnabled"
                v-model="selectAll"
                :label="selectAllLabel"
                :wrap="true"
            />
        </div>

        <p v-if="errorMessage?.length" class="helper error flex gap-1 text-red-500">
            <svg class="w-3 h-3">
                <use xlink:href="/sprite.svg#warn-error"></use>
            </svg>
            {{ errorMessage }}
        </p>

        <p v-if="helperText" class="helper text-gray-800">
            {{ helperText }}
        </p>
    </div>
</template>

<script setup lang="ts">
    import vSelect from 'vue-select'
    import { ref, watch, computed, nextTick, onMounted, onUnmounted } from 'vue'
    import { createPopper } from '@popperjs/core'
    import 'vue-select/dist/vue-select.css'

    const props = defineProps({
        id: {
            type: String,
            default: () => 'ui-select',
        },
        name: {
            type: String,
            default: 'ui-select',
        },
        options: {
            type: Array,
            required: true,
            default: () => [],
        },
        label: {
            type: String,
            default: 'Select an option',
        },
        selectLabel: {
            type: String,
            default: 'label',
        },
        selectAllLabel: {
            type: String,
            default: 'Select all',
        },
        selectAllEnabled: {
            type: Boolean,
            default: false,
        },
        helperText: {
            type: String,
            default: '',
        },
        errorMessage: {
            type: String,
            default: '',
        },
        checkboxed: {
            type: Boolean,
            default: false,
        },
        pushTags: {
            type: Boolean,
            default: false,
        },
        size: {
            type: String as () => 'sm' | 'md' | 'lg',
            default: 'md',
        },
        multiple: {
            type: Boolean,
            default: false,
        },
        searchable: {
            type: Boolean,
            default: true,
        },
        clearable: {
            type: Boolean,
            default: false,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        background: {
            type: String,
            default: 'bg-transparent',
        },
        reduce: {
            type: Function,
            default: (option: any) => option.value || option,
        },
        taggable: {
            type: Boolean,
            default: false,
        },
        modelValue: {
            type: [Array, String, Number, Object, null],
            default: null,
        },
        required: {
            type: Boolean,
            default: false,
        },
    })

    const emit = defineEmits<{
        'update:modelValue': [value: any]
    }>()

    const isFocused = ref<boolean>(false)
    const isOpen = ref<boolean>(false)
    const internalValue = ref<any>(props.modelValue || (props.multiple ? [] : null))
    const selectAll = ref<boolean>(false)
    const isHovered = ref<boolean>(false)
    const selectRef = ref<InstanceType<typeof vSelect> | null>(null)
    const selectWrapperRef = ref<HTMLElement | null>(null)
    const selectWidth = ref<number>(0)
    const resizeObserver = ref<ResizeObserver | null>(null)
    const dropdownPosition = ref<'top-start' | 'bottom-start' | null>(null)

    const handleFocus = (focus: boolean): void => {
        isFocused.value = focus
    }

    const handleOpen = (): void => {
        isOpen.value = true
    }

    const handleClose = (): void => {
        isOpen.value = false
        isFocused.value = false
    }

    const onHover = (): void => {
        isHovered.value = true
    }

    const onLeave = (): void => {
        isHovered.value = false
    }

    const focusSelect = (): void => {
        if (!props.disabled && selectRef.value) {
            selectRef.value.$el.querySelector('input')?.focus()
        }
    }

    const sizeClasses = computed(() => ({
        sm: 'sm',
        md: 'md',
        lg: 'lg',
    }))

    const hasValue = computed(() => {
        if (props.multiple) {
            return Array.isArray(internalValue.value) && internalValue.value.length > 0
        }
        return (
            internalValue.value !== null &&
            internalValue.value !== undefined &&
            internalValue.value !== ''
        )
    })

    const hasMultipleValues = computed(() => {
        return (
            props.multiple && Array.isArray(internalValue.value) && internalValue.value.length > 0
        )
    })

    const updatedValue = (value: any): void => {
        internalValue.value = value
        emit('update:modelValue', value)
    }

    const handleOptionToggle = (value: any): void => {
        if (!props.multiple) return

        const currentValues = Array.isArray(internalValue.value) ? [...internalValue.value] : []
        const index = currentValues.findIndex((v) => {
            if (
                typeof v === 'object' &&
                v !== null &&
                typeof value === 'object' &&
                value !== null
            ) {
                return JSON.stringify(v) === JSON.stringify(value)
            }
            return v === value
        })

        if (index > -1) {
            currentValues.splice(index, 1)
        } else {
            currentValues.push(value)
        }

        updatedValue(currentValues)
    }

    const isOptionSelected = (value: any): boolean => {
        if (!props.multiple) return false
        const currentValues = Array.isArray(internalValue.value) ? internalValue.value : []
        return currentValues.some((v) => {
            if (
                typeof v === 'object' &&
                v !== null &&
                typeof value === 'object' &&
                value !== null
            ) {
                return JSON.stringify(v) === JSON.stringify(value)
            }
            return v === value
        })
    }

    const handleDeselect = (): void => {
        if (!props.clearable) return
        internalValue.value = props.multiple ? [] : null
        emit('update:modelValue', internalValue.value)
    }

    watch(
        () => props.modelValue,
        (newValue) => {
            internalValue.value = newValue
        },
        { deep: true }
    )

    watch(selectAll, (newValue) => {
        if (!props.multiple) return

        if (newValue) {
            const allValues = props.options.map((opt: any) => {
                return props.reduce ? props.reduce(opt) : opt
            })
            updatedValue(allValues)
        } else {
            updatedValue([])
        }
    })

    watch(
        () => internalValue.value,
        (newValue) => {
            if (!props.multiple || !props.selectAllEnabled) return

            const allValues = props.options.map((opt: any) => {
                return props.reduce ? props.reduce(opt) : opt
            })

            if (Array.isArray(newValue) && newValue.length === allValues.length) {
                selectAll.value = true
            } else {
                selectAll.value = false
            }
        },
        { deep: true }
    )

    const exactWidth = computed(() => {
        return selectWidth.value
    })

    onMounted(() => {
        if (selectWrapperRef.value) {
            const updateWidth = () => {
                if (selectWrapperRef.value) {
                    selectWidth.value = selectWrapperRef.value.offsetWidth
                }
            }

            updateWidth()

            resizeObserver.value = new ResizeObserver(updateWidth)
            resizeObserver.value.observe(selectWrapperRef.value)
        }
    })

    onUnmounted(() => {
        if (resizeObserver.value && selectWrapperRef.value) {
            resizeObserver.value.unobserve(selectWrapperRef.value)
        }
    })

    const calculateDropdownPosition = (
        dropdownList: HTMLElement,
        component: any,
        { width }: any
    ) => {
        dropdownList.style.width = width

        const popper = createPopper(component.$refs.toggle, dropdownList, {
            placement: 'bottom-start',
            modifiers: [
                {
                    name: 'offset',
                    options: {
                        offset: [0, -1],
                    },
                },
                {
                    name: 'toggleClass',
                    enabled: true,
                    phase: 'write',
                    fn({ state }: any) {
                        component.$el.classList.toggle(
                            'drop-up',
                            state.placement === 'top-start' || state.placement === 'top-end'
                        )

                        dropdownPosition.value =
                            state.placement === 'top-start' || state.placement === 'top-end'
                                ? 'top-start'
                                : 'bottom-start'
                    },
                },
                {
                    name: 'sameWidth',
                    enabled: true,
                    fn: ({ state }: any) => {
                        const toggleWidth = exactWidth.value
                        const vw = window.innerWidth
                        const isMobile = vw < 640

                        // On mobile, use full width with padding
                        if (isMobile) {
                            const mobileWidth = Math.min(toggleWidth, vw - 16)
                            state.styles.popper.width = `${mobileWidth}px`
                            state.styles.popper.minWidth = `${mobileWidth}px`
                            state.styles.popper.maxWidth = `${vw - 16}px`
                        } else {
                            // On desktop, match toggle width exactly
                            state.styles.popper.width = `${toggleWidth + 1}px`
                            state.styles.popper.minWidth = `${toggleWidth + 1}px`
                            state.styles.popper.maxWidth = `${toggleWidth + 1}px`
                        }
                    },
                },
                {
                    name: 'preventOverflow',
                    options: {
                        boundary: 'viewport',
                        padding: 8,
                        altAxis: true,
                        tether: false,
                        altBoundary: true,
                    },
                },
                {
                    name: 'flip',
                    options: {
                        fallbackPlacements: ['top-start', 'bottom-start'],
                        padding: 8,
                    },
                },
            ],
        })

        return () => popper.destroy()
    }
</script>

<style lang="scss">
    .helper {
        @apply text-caption1 mx-3 mt-1;
    }

    .floating-label.error {
        @apply text-red-500;
    }

    .floating-label.sm {
        @apply absolute left-2 top-2;
    }
    .floating-label.sm.floating {
        @apply top-0.5 left-2 text-caption1 px-1;
    }

    .floating-label.md {
        @apply absolute left-2 top-3;
    }
    .floating-label.md.floating {
        @apply top-1.5 left-2 text-caption1 px-1;
    }

    .floating-label.lg {
        @apply top-4 left-3 text-subtitle2;
    }
    .floating-label.lg.floating {
        @apply top-2 left-2 text-caption1 px-1;
    }

    .select {
        @apply w-full;

        .vs__selected {
            @apply truncate;
        }

        &.disabled {
            @apply bg-gray-100 cursor-not-allowed;
        }

        &.select--focus {
            .vs__dropdown-toggle {
                @apply border-blue-500 shadow-sm;
            }
        }

        &.vs--multiple {
            .vs__selected {
                @apply max-h-5 px-1 py-0.5 bg-gray-500 text-gray-800 rounded flex items-center gap-1 max-w-full max-h-[18px];
            }
        }

        .vs__selected:first-child {
            @apply pl-0;
        }

        .vs__dropdown-toggle {
            @apply px-2 rounded border-gray-600 hover:border-gray-800;
            min-height: inherit;

            .vs__selected-options {
                .vs__selected {
                    @apply py-0.5 text-subtitle3 text-gray-950;

                    button {
                        @apply m-1;
                    }
                }
            }
        }
        &.error-border {
            .vs__dropdown-toggle {
                .vs__selected {
                    @apply text-red-500;
                }
            }
        }
        &.sm {
            .vs__dropdown-toggle {
                @apply min-h-8;

                .vs__selected {
                    @apply mt-0.5;
                }

                .vs__selected-options {
                    @apply px-0 py-0;

                    input {
                        @apply text-subtitle2 text-gray-900 pl-0 pt-4 pb-1 m-0;
                    }
                }
            }

            &.select--focus {
                .vs__selected {
                    @apply mt-2.5;
                }
            }
            .vs__selected {
                @apply px-1.5 py-0.5 ml-0 mt-3;
            }
        }

        &.md {
            .vs__dropdown-toggle {
                @apply min-h-10;

                .vs__selected-options {
                    input {
                        @apply text-subtitle2 text-gray-900 pl-0 pt-4 pb-1 m-0;
                    }
                }
            }

            .vs__selected {
                @apply mt-3.5 ml-0;
            }
        }

        &.lg {
            .vs__dropdown-toggle {
                @apply min-h-12;

                .vs__selected-options {
                    input {
                        @apply text-subtitle2 text-gray-900 !pl-0 pt-4 pb-1 m-0;
                    }
                }
            }

            .vs__selected {
                @apply text-subtitle2 mt-5 ml-0 pl-0;
            }
        }

        &.vs--multiple {
            &.sm .vs__dropdown-toggle {
                min-height: 32px;
            }

            &.md .vs__dropdown-toggle {
                min-height: 40px;
            }

            &.lg .vs__dropdown-toggle {
                min-height: 48px;
            }
        }
    }

    .vs__dropdown-menu {
        box-shadow:
            0px 1px 18px -18px rgba(90, 93, 101, 0.12),
            0px 6px 10px -10px rgba(90, 93, 101, 0.14) !important;
        max-height: 200px !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        z-index: 9 !important;
        box-sizing: border-box !important;
        border: 1px;
        border-style: solid;
        border-radius: 0;
        @apply border-blue-400;

        // Mobile responsive styles
        @media (max-width: 639px) {
            max-height: min(200px, 40vh) !important;
            padding: 0 !important;
        }

        .vs__dropdown-option {
            @apply px-4 py-3 cursor-pointer;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            box-sizing: border-box;

            // Mobile: better touch targets and spacing
            @media (max-width: 639px) {
                @apply px-3 py-2.5;
                font-size: 14px;
            }

            &--highlight {
                @apply bg-red-50 text-red-500 !important;
            }

            &--selected {
                @apply bg-blue-100 text-blue-700;
            }

            &--disabled {
                @apply text-gray-400 cursor-not-allowed;
            }
        }
    }

    .vs__dropdown-menu[data-size='sm'] .vs__dropdown-option {
        @apply px-2 py-1;
    }

    .vs__dropdown-menu[data-size='md'] .vs__dropdown-option {
        @apply px-4 py-3;
    }

    .vs__dropdown-menu[data-size='lg'] .vs__dropdown-option {
        @apply px-4 py-3;
    }

    .vs__dropdown-option .peer {
        @apply h-4 w-4 cursor-pointer transition-all appearance-none rounded hover:shadow-md border border-gray-600;

        &:checked {
            @apply bg-blue-500 border-blue-500;
        }
    }

    body > .vs__dropdown-menu {
        z-index: 9999 !important;
        box-sizing: border-box !important;
    }

    [data-popper-placement='bottom-start'] {
        @apply bg-white !rounded-b border-t-transparent;
    }

    [data-popper-placement='top-start'] {
        @apply bg-white !rounded-t border-b-transparent;
    }

    .select.vs--multiple {
        .vs__actions {
            padding: 0 !important;
        }
        .vs__dropdown-toggle {
            height: auto !important;
            min-height: 20px;
            padding: 0px 12px 0 8px;
            overflow: visible;
            @apply border border-gray-600 rounded w-full bg-white;
        }

        .vs__selected-options {
            flex-wrap: wrap;
            max-height: none;
            padding-top: 10px;
            margin-top: 8px;

            @apply flex flex-wrap gap-1 px-3 pl-0;
        }

        .vs__selected {
            margin: 2px 0px;
            max-width: calc(100% - 8px);
            @apply px-1 py-0.5 bg-gray-500 text-gray-800 rounded flex items-center gap-1 max-w-full max-h-[18px];
        }

        .vs__deselect {
            @apply text-gray-800 hover:text-red-500 focus:outline-none rounded active:scale-95 active:text-red-700;
        }
    }

    .tab-input-tag-text {
        @apply truncate text-gray-800 text-subtitle3;
    }

    .select.vs--multiple .vs__search {
        flex-basis: 0 !important;
        flex-grow: 1;
        min-width: 2px;
        width: auto !important;
        padding-top: 0 !important;
        margin: 0 2px;
        height: auto;
        line-height: 1;
    }
</style>
