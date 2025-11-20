<template>
    <div
        class="dropdown-wrapper relative"
        @mouseenter="isHoverTrigger && open()"
        @mouseleave="isHoverTrigger && close()"
    >
        <!-- Trigger slot -->
        <div
            :id="`dropdown-trigger-${id}`"
            ref="triggerRef"
            :aria-expanded="isOpen"
            :aria-controls="`dropdown-menu-${id}`"
            class="cursor-pointer"
            :class="[
                triggerClass,
                triggerSizeClass,
                'transition',
                'duration-300',
                'transition-all',
            ]"
            :style="triggerStyles"
            @click="isClickTrigger && toggle()"
        >
            <slot name="trigger">
                <button
                    type="button"
                    class="dropdown-wrapper--button flex w-full h-full justify-between items-center gap-1 rounded border border-gray-600 bg-white text-gray-950 hover:bg-gray-50"
                    :class="[
                        buttonPaddingClass,
                        isOpen ? 'bg-blue-50 text-blue-500 ' : null,
                        isRounded ? 'rounded-full border-red-500' : null,
                        triggerLabelClass,
                    ]"
                >
                    <slot name="label">
                        <span class="truncate flex-1 text-left" :title="label">
                            {{ label }}
                        </span>
                    </slot>

                    <svg
                        class="transition-transform duration-200 flex-shrink-0"
                        :class="[iconSizeClass, { 'rotate-180': isOpen }]"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 9l-7 7-7-7"
                        ></path>
                    </svg>
                </button>
            </slot>
        </div>

        <!-- Dropdown menu -->
        <Transition
            :name="dropdownDirection === 'top' ? `${transitionName}-top` : transitionName"
            @after-leave="emit('after-hide')"
            @after-enter="emit('after-show')"
        >
            <div
                v-if="isOpen"
                :id="`dropdown-menu-${id}`"
                ref="menuRef"
                role="menu"
                :aria-labelledby="`dropdown-trigger-${id}`"
                tabindex="-1"
                class="menu absolute flex flex-col z-50 origin-top-right focus:outline-none rounded-md border border-t-transparen"
                :class="[
                    menuClass,
                    computedMenuAlignment === 'left'
                        ? 'left-0'
                        : computedMenuAlignment === 'right'
                          ? 'right-0'
                          : 'left-1/2 -translate-x-1/2',
                    dropdownDirection === 'top' ? 'bottom-full' : 'top-full',
                    {
                        'bg-white overflow-hidden': !props.noDefaultStyles,
                    },
                ]"
                :style="computedMenuStyles"
                @keydown.esc="close()"
            >
                <!-- Optional header slot -->
                <div v-if="$slots.header" class="shrink-0">
                    <slot name="header"></slot>
                </div>

                <div class="grow overflow-y-auto overflow-x-hidden" @scroll.stop>
                    <slot>
                        <div v-if="items.length" class="py-1">
                            <template v-for="(item, index) in items" :key="index">
                                <button
                                    v-if="!item.divider"
                                    class="w-full text-left text-body hover:bg-gray-100 focus:bg-red-50 outline-none whitespace-nowrap truncate"
                                    :class="[
                                        itemPaddingClass,
                                        {
                                            'text-gray-950': !item.disabled,
                                            'text-gray-400 cursor-not-allowed': item.disabled,
                                        },
                                    ]"
                                    :disabled="item.disabled"
                                    role="menuitem"
                                    @click="!item.disabled && handleItemClick(item)"
                                >
                                    {{ item.label }}
                                </button>
                                <div v-else class="h-px my-1 bg-gray-200" role="separator"></div>
                            </template>
                        </div>
                    </slot>
                </div>

                <!-- Optional footer slot -->
                <div v-if="$slots.footer" class="shrink-0">
                    <slot name="footer"></slot>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
    import { onClickOutside, useEventListener, useResizeObserver } from '@vueuse/core'
    import type { DropdownItem } from '~/types/ui/dropdown'

    const props = withDefaults(
        defineProps<{
            id?: string
            label?: string
            items?: DropdownItem[]
            modelValue?: boolean
            triggerClass?: string
            triggerLabelClass?: string
            menuClass?: string
            rounded?: boolean
            size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
            sizeIcon?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
            trigger?: 'click' | 'hover' | 'both'
            menuAlignment?: 'left' | 'right' | 'center'
            menuWidth?: 'trigger' | 'trigger+10' | 'max-content' | string
            transitionName?: string
            closeOnClick?: boolean
            closeOnClickOutside?: boolean
            focusOnShow?: boolean
            disableKeyboard?: boolean
            disableCloseOnEscape?: boolean
            noDefaultStyles?: boolean
            placement?: 'top' | 'bottom' | 'auto'
            autoAlign?: boolean
            maxMenuHeight?: number
            width?: string
            maxWidth?: string
            closeOnScroll?: boolean
            autoSyncTriggerWidth?: boolean
        }>(),
        {
            id: () => `dropdown-${Math.random().toString(36).substring(2, 9)}`,
            label: 'Select',
            items: () => [],
            modelValue: false,
            triggerClass: '',
            rounded: false,
            menuClass: '',
            size: 'md',
            trigger: 'click',
            menuAlignment: 'center',
            menuWidth: 'trigger',
            transitionName: 'dropdown',
            closeOnClick: true,
            closeOnClickOutside: true,
            focusOnShow: true,
            disableKeyboard: false,
            disableCloseOnEscape: false,
            noDefaultStyles: false,
            placement: 'auto',
            autoAlign: false,
            maxMenuHeight: 384,
            width: undefined,
            maxWidth: undefined,
            closeOnScroll: true,
            autoSyncTriggerWidth: false,
        }
    )

    const emit = defineEmits<{
        (e: 'update:modelValue', value: boolean): void
        (e: 'show'): void
        (e: 'hide'): void
        (e: 'after-show'): void
        (e: 'after-hide'): void
        (e: 'select', value: any): void
    }>()

    const isOpen = ref(props.modelValue)
    const triggerRef = ref<HTMLElement | null>(null)
    const menuRef = ref<HTMLElement | null>(null)
    const dropdownDirection = ref<'top' | 'bottom'>('bottom')
    const computedMenuAlignment = ref(props.menuAlignment)
    const triggerWidth = ref(0)
    const computedMaxHeight = ref(384)

    const isClickTrigger = computed(() => ['click', 'both'].includes(props.trigger))
    const isHoverTrigger = computed(() => ['hover', 'both'].includes(props.trigger))
    const isRounded = computed(() => props.rounded)

    const triggerSizeClass = computed(() => {
        const sizeMap = {
            xs: 'h-6',
            sm: 'h-8',
            md: 'h-9',
            lg: 'h-10',
            xl: 'h-12',
        }
        return sizeMap[props.size]
    })

    const buttonPaddingClass = computed(() => {
        const paddingMap = {
            xs: 'px-2 py-1 text-subtitle2',
            sm: 'px-3 py-1.5 text-subtitle2',
            md: 'px-3 py-2 text-subtitle2',
            lg: 'px-4 py-2.5 text-subtitle2',
            xl: 'px-4 py-3 text-subtitle1',
        }
        return paddingMap[props.size]
    })

    const itemPaddingClass = computed(() => {
        const paddingMap = {
            xs: 'px-2 py-1.5',
            sm: 'px-3 py-2',
            md: 'px-3 py-2.5',
            lg: 'px-4 py-3',
            xl: 'px-4 py-3.5',
        }
        return paddingMap[props.size]
    })

    const iconSizeClass = computed(() => {
        const iconMap = {
            xs: 'w-3.5 h-3.5',
            sm: 'w-4 h-4',
            md: 'w-5 h-5',
            lg: 'w-6 h-6',
            xl: 'w-8 h-8',
        }
        return iconMap[props.sizeIcon || props.size]
    })

    const optimalWidth = ref<number | null>(null)
    const isCalculatingWidth = ref(false)

    const calculateOptimalWidth = () => {
        if (!props.autoSyncTriggerWidth || isCalculatingWidth.value) return

        isCalculatingWidth.value = true

        const measureElement = document.createElement('div')
        measureElement.style.cssText = `
            position: absolute;
            visibility: hidden;
            white-space: nowrap;
            font-family: inherit;
            font-size: inherit;
            font-weight: inherit;
            padding: 0.5rem 1rem;
            border: 1px solid transparent;
            top: -9999px;
            left: -9999px;
        `

        const longestText = props.items.reduce((longest, item) => {
            return item.label && item.label.length > longest.length ? item.label : longest
        }, '')

        measureElement.textContent = longestText
        document.body.appendChild(measureElement)

        const measuredWidth = measureElement.offsetWidth + 32

        document.body.removeChild(measureElement)

        optimalWidth.value = Math.max(measuredWidth, 120)
        isCalculatingWidth.value = false

        return optimalWidth.value
    }

    const triggerStyles = computed(() => {
        if (props.autoSyncTriggerWidth && optimalWidth.value) {
            return {
                width: `${optimalWidth.value}px`,
                minWidth: `${optimalWidth.value}px`,
            }
        }
        return {}
    })

    const computedMenuStyles = computed(() => {
        const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
        const isMobile = vw < 640

        const styles: Record<string, string> = {
            maxHeight: `${computedMaxHeight.value}px`,
            overflowY: computedMaxHeight.value < props.items.length * 40 + 20 ? 'auto' : 'visible',
        }

        // Mobile responsive: use full viewport width minus padding
        if (isMobile && (props.menuWidth === 'trigger' || props.menuWidth === 'trigger+10')) {
            const mobileWidth = Math.min(triggerWidth.value, vw - 16)
            styles.width = `${mobileWidth}px`
            styles.minWidth = `${mobileWidth}px`
            styles.maxWidth = `${vw - 16}px`
        } else if (props.autoSyncTriggerWidth && optimalWidth.value) {
            styles.width = `${optimalWidth.value + 10}px`
            styles.minWidth = `${optimalWidth.value + 10}px`
        } else if (props.menuWidth === 'trigger+10' && triggerWidth.value > 0) {
            styles.width = `${triggerWidth.value + 10}px`
            styles.minWidth = `${triggerWidth.value + 10}px`
        } else if (props.menuWidth === 'trigger' && triggerWidth.value > 0) {
            styles.width = `${triggerWidth.value}px`
            styles.minWidth = `${triggerWidth.value}px`
        } else if (props.menuWidth === 'max-content') {
            styles.width = 'max-content'
        } else if (
            typeof props.menuWidth === 'string' &&
            props.menuWidth !== 'trigger' &&
            props.menuWidth !== 'trigger+10' &&
            props.menuWidth !== 'max-content'
        ) {
            styles.width = props.menuWidth
        }

        return styles
    })

    const updateTriggerWidth = () => {
        if (triggerRef.value) {
            triggerWidth.value = triggerRef.value.offsetWidth
        }
    }

    useResizeObserver(triggerRef, () => {
        updateTriggerWidth()
        if (isOpen.value) {
            nextTick(() => {
                calculateDropdownPosition()
                adjustMenuPosition()
            })
        }
    })

    watch(
        () => props.items,
        () => {
            if (props.autoSyncTriggerWidth) {
                calculateOptimalWidth()
            }
        }
    )

    watch(
        () => props.modelValue,
        (newValue) => {
            if (newValue !== isOpen.value) {
                newValue ? open() : close()
            }
        }
    )

    const calculateDropdownPosition = () => {
        if (!triggerRef.value) return

        const triggerRect = triggerRef.value.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const spaceBelow = viewportHeight - triggerRect.bottom - 10
        const spaceAbove = triggerRect.top - 10

        const itemHeight =
            props.size === 'xs'
                ? 32
                : props.size === 'sm'
                  ? 36
                  : props.size === 'md'
                    ? 40
                    : props.size === 'lg'
                      ? 44
                      : 48
        const minRequiredHeight = Math.min(
            props.items.length * itemHeight + 16,
            props.maxMenuHeight
        )

        let maxHeight = props.maxMenuHeight

        if (props.placement === 'auto') {
            if (minRequiredHeight <= Math.min(spaceBelow, spaceAbove)) {
                if (spaceBelow >= minRequiredHeight) {
                    dropdownDirection.value = 'bottom'
                    maxHeight = Math.min(maxHeight, spaceBelow)
                } else {
                    dropdownDirection.value = 'top'
                    maxHeight = Math.min(maxHeight, spaceAbove)
                }
            } else if (spaceAbove > spaceBelow) {
                dropdownDirection.value = 'top'
                maxHeight = Math.min(maxHeight, spaceAbove)
            } else {
                dropdownDirection.value = 'bottom'
                maxHeight = Math.min(maxHeight, spaceBelow)
            }
        } else if (props.placement === 'top') {
            dropdownDirection.value = 'top'
            maxHeight = Math.min(maxHeight, spaceAbove)
        } else {
            dropdownDirection.value = 'bottom'
            maxHeight = Math.min(maxHeight, spaceBelow)
        }

        computedMaxHeight.value = Math.max(maxHeight, Math.min(minRequiredHeight, 120))
    }

    const open = () => {
        if (isOpen.value) return

        if (props.autoSyncTriggerWidth) {
            calculateOptimalWidth()
        } else {
            updateTriggerWidth()
        }

        calculateDropdownPosition()

        isOpen.value = true
        emit('update:modelValue', true)
        emit('show')

        nextTick(() => {
            calculateDropdownPosition()
            adjustMenuPosition()

            if (props.focusOnShow) {
                menuRef.value?.focus()
                updateFocusableItems()
            }
        })
    }

    const close = () => {
        if (!isOpen.value) return
        isOpen.value = false
        emit('update:modelValue', false)
        emit('hide')
    }

    const toggle = () => {
        isOpen.value ? close() : open()
    }

    const handleItemClick = (item: DropdownItem) => {
        emit('select', item.value)
        if (props.closeOnClick) close()
    }

    const adjustMenuPosition = async () => {
        await nextTick()
        if (!menuRef.value || !triggerRef.value) return

        const triggerRect = triggerRef.value.getBoundingClientRect()
        const menuRect = menuRef.value.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        const actualSpaceBelow = viewportHeight - triggerRect.bottom - 10
        const actualSpaceAbove = triggerRect.top - 10
        const actualMenuHeight = menuRect.height

        if (dropdownDirection.value === 'bottom' && actualMenuHeight > actualSpaceBelow) {
            if (actualSpaceAbove > actualSpaceBelow) {
                dropdownDirection.value = 'top'
                computedMaxHeight.value = Math.max(
                    Math.min(actualSpaceAbove, props.maxMenuHeight),
                    120
                )
            } else {
                computedMaxHeight.value = Math.max(actualSpaceBelow, 120)
            }
        } else if (dropdownDirection.value === 'top' && actualMenuHeight > actualSpaceAbove) {
            if (actualSpaceBelow > actualSpaceAbove) {
                dropdownDirection.value = 'bottom'
                computedMaxHeight.value = Math.max(
                    Math.min(actualSpaceBelow, props.maxMenuHeight),
                    120
                )
            } else {
                computedMaxHeight.value = Math.max(actualSpaceAbove, 120)
            }
        }

        if (props.autoAlign) {
            const spaceLeft = triggerRect.left
            const spaceRight = viewportWidth - triggerRect.right

            if (spaceRight >= menuRect.width) {
                computedMenuAlignment.value = 'left'
            } else if (spaceLeft >= menuRect.width) {
                computedMenuAlignment.value = 'right'
            } else {
                computedMenuAlignment.value = spaceRight > spaceLeft ? 'left' : 'right'
            }
        } else {
            computedMenuAlignment.value = props.menuAlignment
        }

        if (computedMenuAlignment.value === 'left') {
            const overflowRight = triggerRect.left + menuRect.width - viewportWidth + 10
            if (overflowRight > 0) {
                menuRef.value.style.left = `${-overflowRight}px`
            }
        } else if (computedMenuAlignment.value === 'right') {
            const overflowLeft = triggerRect.right - menuRect.width - 10
            if (overflowLeft < 0) {
                menuRef.value.style.right = `${overflowLeft}px`
            }
        } else if (computedMenuAlignment.value === 'center') {
            const menuCenter = triggerRect.left + triggerRect.width / 2
            const halfMenuWidth = menuRect.width / 2

            if (menuCenter - halfMenuWidth < 10) {
                menuRef.value.style.left = `${10 - triggerRect.left}px`
                menuRef.value.style.transform = 'translateX(0)'
            } else if (menuCenter + halfMenuWidth > viewportWidth - 10) {
                menuRef.value.style.right = `${10 - (viewportWidth - triggerRect.right)}px`
                menuRef.value.style.transform = 'translateX(0)'
            }
        }
    }

    const focusableItems = ref<HTMLElement[]>([])
    const currentFocusIndex = ref(-1)

    const updateFocusableItems = () => {
        if (props.disableKeyboard || !menuRef.value) return
        focusableItems.value = Array.from(
            menuRef.value.querySelectorAll(
                'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
        ) as HTMLElement[]
        currentFocusIndex.value = -1
    }

    const handleKeyDown = (event: KeyboardEvent) => {
        if (props.disableKeyboard || !isOpen.value) return
        switch (event.key) {
            case 'Escape':
                if (!props.disableCloseOnEscape) {
                    event.preventDefault()
                    close()
                }
                break
            case 'ArrowDown':
                event.preventDefault()
                if (focusableItems.value.length) {
                    currentFocusIndex.value =
                        (currentFocusIndex.value + 1) % focusableItems.value.length
                    focusableItems.value[currentFocusIndex.value]?.focus()
                }
                break
            case 'ArrowUp':
                event.preventDefault()
                if (focusableItems.value.length) {
                    currentFocusIndex.value =
                        (currentFocusIndex.value - 1 + focusableItems.value.length) %
                        focusableItems.value.length
                    focusableItems.value[currentFocusIndex.value]?.focus()
                }
                break
            case 'Home':
                event.preventDefault()
                if (focusableItems.value.length) {
                    currentFocusIndex.value = 0
                    focusableItems.value[0]?.focus()
                }
                break
            case 'End':
                event.preventDefault()
                if (focusableItems.value.length) {
                    currentFocusIndex.value = focusableItems.value.length - 1
                    focusableItems.value[currentFocusIndex.value]?.focus()
                }
                break
        }
    }

    const handleScroll = (event: Event) => {
        if (isOpen.value) {
            // Check if scroll event comes from within the dropdown menu
            const target = event.target as Element
            if (menuRef.value && menuRef.value.contains(target)) {
                // Scroll is happening inside the dropdown, don't close it
                return
            }

            if (props.closeOnScroll) {
                close()
            } else {
                calculateDropdownPosition()
                adjustMenuPosition()
            }
        }
    }

    onClickOutside(
        menuRef,
        (event) => {
            // Don't close if the event is a scroll event within the menu
            if (event.type === 'scroll' && menuRef.value?.contains(event.target as Node)) {
                return
            }

            if (
                props.closeOnClickOutside &&
                isOpen.value &&
                !triggerRef.value?.contains(event.target as Node)
            ) {
                close()
            }
        },
        { ignore: [triggerRef] }
    )

    onMounted(() => {
        if (props.autoSyncTriggerWidth) {
            calculateOptimalWidth()
        } else {
            updateTriggerWidth()
        }

        if (!props.disableKeyboard) {
            document.addEventListener('keydown', handleKeyDown)
        }
        useEventListener(window, 'resize', () => {
            if (props.autoSyncTriggerWidth) {
                calculateOptimalWidth()
            } else {
                updateTriggerWidth()
            }
            if (isOpen.value) {
                calculateDropdownPosition()
                adjustMenuPosition()
            }
        })
        useEventListener(window, 'scroll', handleScroll, { passive: true, capture: true })
        useEventListener(document, 'scroll', handleScroll, { passive: true, capture: true })
    })

    onBeforeUnmount(() => {
        if (!props.disableKeyboard) {
            document.removeEventListener('keydown', handleKeyDown)
        }
    })

    defineExpose({ open, close, toggle })
</script>

<style scoped lang="scss">
    .menu {
        box-shadow:
            0px 5px 22px 4px rgba(90, 93, 101, 0.12),
            0px 12px 17px 2px rgba(90, 93, 101, 0.14);

        // Mobile responsive styles
        @media (max-width: 639px) {
            max-height: min(384px, 50vh) !important;

            button[role='menuitem'] {
                font-size: 14px;
                padding: 0.625rem 0.75rem; // py-2.5 px-3
                min-height: 40px; // Better touch target
            }
        }
    }

    .dropdown-enter-active,
    .dropdown-leave-active {
        transition:
            opacity 0.2s,
            transform 0.2s;
    }

    .dropdown-enter-from {
        opacity: 0;
        transform: translateY(-5px);
    }

    .dropdown-top-enter-active,
    .dropdown-top-leave-active {
        transition:
            opacity 0.2s,
            transform 0.2s;
    }
    .dropdown-top-enter-from,
    .dropdown-top-leave-to {
        opacity: 0;
        transform: translateY(5px);
    }
</style>
