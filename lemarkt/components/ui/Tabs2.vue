<template>
    <div class="w-full">
        <div class="relative" :class="headerClasses">
            <Button
                v-if="showScrollButtons && canScrollLeft"
                color="mix"
                variant="filled"
                square
                size="md"
                :aria-label="t('prevPage', 'Previous Page')"
                container-classes="!max-w-6 absolute left-0 top-1/2 -translate-y-1/2 z-[1] ml-4"
                @click="scrollLeft"
            >
                <div>
                    <svg class="w-4 h-4">
                        <use xlink:href="/sprite.svg#a_left" />
                    </svg>
                </div>
            </Button>

            <div
                ref="tabsContainer"
                class="tabs-section flex overflow-x-auto scrollbar-hide border-b border-gray-600 scroll-smooth"
                :class="[
                    variant === 'pills' ? 'gap-2 border-0 pb-2' : '',
                    variant === 'underline' ? 'px-4 border border-gray-600 rounded-md' : '',
                    showScrollButtons ? 'px-16' : '',
                    classes,
                ]"
                @scroll="handleScroll"
            >
                <button
                    v-for="(tab, index) in processedTabs"
                    :key="`tab-${tab.id || index}`"
                    :ref="(el) => setTabRef(el, index)"
                    type="button"
                    role="tab"
                    :aria-selected="selectedIndex === index"
                    :aria-controls="`tabpanel-${tab.id || index}`"
                    :aria-disabled="!tab.active || disabled"
                    :disabled="!tab.active || disabled"
                    :class="getTabClasses(tab, index)"
                    @click="selectTab(index)"
                    @keydown="handleKeydown($event, index)"
                >
                    <svg
                        v-if="tab.icon"
                        class="w-4 h-4 flex-shrink-0"
                        :class="[
                            tab.label ? 'mr-2' : '',
                            selectedIndex === index ? 'text-current' : 'text-gray-600',
                        ]"
                    >
                        <use :xlink:href="`/sprite.svg#${tab.icon}`" />
                    </svg>

                    <span
                        class="whitespace-nowrap group-active:scale-95 transition-transform duration-300 delay-150"
                    >
                        {{ tab.label }}
                    </span>

                    <span v-if="tab.badge" :class="getBadgeClasses(index)">
                        {{ tab.badge }}
                    </span>

                    <button
                        v-if="tab.closable && !disabled"
                        type="button"
                        class="ml-2 -mr-1 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        @click.stop="closeTab(index)"
                    >
                        <svg class="w-3 h-3">
                            <use xlink:href="/sprite.svg#close" />
                        </svg>
                    </button>

                    <div
                        v-if="variant === 'underline' && selectedIndex === index"
                        class="absolute inset-0 top-full rounded-t-lg h-1 bg-blue-400 transition-all duration-300 ease-out delay-150"
                    />
                </button>
            </div>

            <Button
                v-if="showScrollButtons && canScrollRight"
                color="mix"
                variant="filled"
                square
                size="md"
                container-classes="!max-w-6 absolute right-0 top-1/2 -translate-y-1/2 z-[1] mr-4"
                :aria-label="t('nextPage', 'Next Page')"
                @click="scrollRight"
            >
                <div>
                    <svg class="w-4 h-4">
                        <use xlink:href="/sprite.svg#a_right" />
                    </svg>
                </div>
            </Button>

            <button
                v-if="addable && !disabled"
                type="button"
                class="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                :class="showScrollButtons ? 'right-12' : 'right-0'"
                @click="$emit('add-tab')"
            >
                <svg class="w-5 h-5">
                    <use xlink:href="/sprite.svg#plus" />
                </svg>
            </button>
        </div>

        <div class="relative">
            <Transition
                v-if="props.transition !== 'none'"
                :name="transitionName"
                mode="out-in"
                @before-enter="onBeforeEnter"
                @enter="onEnter"
                @leave="onLeave"
            >
                <div
                    v-if="selectedTab"
                    :id="`tabpanel-${selectedTab.id || selectedIndex}`"
                    :key="`panel-${selectedTab.id || selectedIndex}`"
                    role="tabpanel"
                    :aria-labelledby="`tab-${selectedTab.id || selectedIndex}`"
                    :class="getPanelClasses()"
                >
                    <template v-if="!lazy || hasBeenSelected[selectedIndex]">
                        <slot
                            :name="selectedTab.name || `tab-${selectedIndex}`"
                            :tab="selectedTab"
                            :index="selectedIndex"
                            :selected="true"
                        >
                            <div v-if="selectedTab.content" v-html="selectedTab.content" />
                            <div v-else class="text-gray-500 text-center py-8">
                                {{ t('tabs.noContent', 'No content available') }}
                            </div>
                        </slot>
                    </template>

                    <div v-else-if="loading" class="flex justify-center items-center py-8">
                        <span class="loader"></span>
                    </div>
                </div>
            </Transition>

            <div
                v-for="(tab, index) in processedTabs"
                v-else
                v-show="selectedIndex === index"
                :id="`tabpanel-${tab.id || index}`"
                :key="`panel-${tab.id || index}`"
                role="tabpanel"
                :aria-labelledby="`tab-${tab.id || index}`"
                :class="getPanelClasses()"
            >
                <template v-if="!lazy || hasBeenSelected[index]">
                    <slot
                        :name="tab.name || `tab-${index}`"
                        :tab="tab"
                        :index="index"
                        :selected="selectedIndex === index"
                    >
                        <div v-if="tab.content" v-html="tab.content" />
                        <div v-else class="text-gray-500 text-center py-8">
                            {{ t('tabs.noContent', 'No content available') }}
                        </div>
                    </slot>
                </template>

                <div v-else-if="loading" class="flex justify-center items-center py-8">
                    <span class="loader"></span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useDebounceFn, useResizeObserver } from '@vueuse/core'

    interface Tab {
        id?: string | number
        name?: string
        label: string
        icon?: string
        badge?: string | number
        active?: boolean
        closable?: boolean
        content?: string
        [key: string]: any
    }

    interface TabsProps {
        tabs: Tab[]
        modelValue?: number
        defaultActive?: number
        variant?: 'underline' | 'pills' | 'bordered'
        size?: 'sm' | 'md' | 'lg'
        disabled?: boolean
        lazy?: boolean
        addable?: boolean
        closable?: boolean
        transition?: 'fade' | 'slide' | 'none'
        loading?: boolean
        fullWidth?: boolean
        centered?: boolean
        scrollable?: boolean
        headerClasses?: string
        classes?: string
    }

    const props = withDefaults(defineProps<TabsProps>(), {
        modelValue: undefined,
        defaultActive: 0,
        variant: 'underline',
        size: 'md',
        disabled: false,
        lazy: false,
        addable: false,
        closable: false,
        transition: 'fade',
        loading: false,
        fullWidth: false,
        centered: false,
        scrollable: true,
        headerClasses: '',
        classes: '',
    })

    const emit = defineEmits<{
        'update:modelValue': [value: number]
        'select-tab': [index: number, tab: Tab]
        'close-tab': [index: number, tab: Tab]
        'add-tab': []
    }>()

    const { t } = useI18n({ useScope: 'global', missingWarn: false })

    const tabsContainer = ref<HTMLElement>()
    const tabRefs = ref<(HTMLElement | null)[]>([])
    const selectedIndex = ref(props.modelValue ?? props.defaultActive)
    const indicatorStyle = ref({ left: '0px', width: '0px' })
    const hasBeenSelected = ref<Record<number, boolean>>({})
    const showIndicator = ref(false)
    const isUpdatingIndicator = ref(false)
    const rafId = ref<number | null>(null)

    const canScrollLeft = ref(false)
    const canScrollRight = ref(false)
    const showScrollButtons = ref(false)

    const processedTabs = computed(() => {
        return props.tabs.map((tab, index) => ({
            ...tab,
            active: tab.active !== false,
            id: tab.id || index,
        }))
    })

    const selectedTab = computed(() => {
        return processedTabs.value[selectedIndex.value]
    })

    const transitionName = computed(() => {
        if (props.transition === 'none') return ''
        return `tab-${props.transition}`
    })

    const setTabRef = (el: any, index: number) => {
        if (el) {
            tabRefs.value[index] = el
        }
    }

    const getTabClasses = (tab: Tab, index: number) => {
        const isSelected = selectedIndex.value === index
        const isDisabled = !tab.active || props.disabled

        const baseClasses = [
            'relative',
            'group',
            'flex',
            'items-center',
            'vorder-0',
            'justify-center',
            'transition-all',
            'duration-200',
            'outline-none',
        ]

        const sizeClasses = {
            sm: 'px-3 py-1.5 text-caption1',
            md: 'px-2 py-2.5 mb-1 text-subtitle2',
            lg: 'px-5 py-3 text-lg',
        }

        const variantClasses = {
            underline: [
                isSelected
                    ? 'text-blue-400 hover:text-blue-700'
                    : 'text-gray-950 hover:text-gray-800',
                !isDisabled && !isSelected && 'hover:text-gray-800 hover:border-gray-800',
                props.fullWidth ? 'flex-1' : '',
            ],
            pills: [
                isSelected
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 bg-gray-100 hover:bg-gray-200',
                'rounded-lg',
                props.fullWidth ? 'flex-1' : '',
            ],
            bordered: [
                isSelected
                    ? 'bg-white text-blue-600 border-gray-200 border-b-white -mb-px z-[1]'
                    : 'text-gray-950 border-transparent',
                !isDisabled && !isSelected && 'hover:text-gray-800 hover:bg-gray-50',
                'border',
                'rounded-t-lg',
                props.fullWidth ? 'flex-1' : '',
            ],
        }

        const disabledClasses = isDisabled
            ? ['opacity-50', 'cursor-not-allowed', 'pointer-events-none']
            : ['cursor-pointer']

        return [
            ...baseClasses,
            sizeClasses[props.size],
            ...variantClasses[props.variant],
            ...disabledClasses,
        ]
    }

    const getBadgeClasses = (index: number) => {
        const isSelected = selectedIndex.value === index

        return [
            'ml-2',
            'px-2',
            'py-0.5',
            'text-subtitle2',
            'font-semibold',
            'rounded-full',
            isSelected
                ? props.variant === 'pills'
                    ? 'bg-white/20 text-white'
                    : 'bg-blue-500 text-white'
                : 'bg-blue-50 text-gray-950',
        ]
    }

    const getPanelClasses = () => {
        return [
            'tab-panel',
            'focus:outline-none',
            props.variant === 'bordered'
                ? 'border border-t-0 border-gray-600 p-4 rounded-b-lg'
                : 'pt-3',
        ]
    }

    const selectTab = (index: number) => {
        const tab = processedTabs.value[index]

        if (!tab.active || props.disabled) return

        selectedIndex.value = index
        hasBeenSelected.value[index] = true

        emit('update:modelValue', index)
        emit('select-tab', index, tab)

        scheduleIndicatorUpdate()
        scheduleScrollUpdate(index)
    }

    const closeTab = (index: number) => {
        const tab = processedTabs.value[index]
        emit('close-tab', index, tab)
    }

    const updateIndicator = () => {
        if (isUpdatingIndicator.value || props.variant !== 'underline') return

        isUpdatingIndicator.value = true

        if (rafId.value) {
            cancelAnimationFrame(rafId.value)
            rafId.value = null
        }

        const activeTab = tabRefs.value[selectedIndex.value]
        if (!activeTab || !tabsContainer.value) {
            isUpdatingIndicator.value = false
            return
        }

        const containerRect = tabsContainer.value.getBoundingClientRect()
        const tabRect = activeTab.getBoundingClientRect()
        const scrollLeft = tabsContainer.value.scrollLeft

        indicatorStyle.value = {
            left: `${tabRect.left - containerRect.left + scrollLeft}px`,
            width: `${tabRect.width}px`,
        }
        showIndicator.value = true
        isUpdatingIndicator.value = false
    }

    const scheduleIndicatorUpdate = () => {
        if (rafId.value) {
            cancelAnimationFrame(rafId.value)
        }
        rafId.value = requestAnimationFrame(() => {
            rafId.value = null
            updateIndicator()
        })
    }

    const scheduleScrollUpdate = (index: number) => {
        requestAnimationFrame(() => {
            scrollTabIntoView(index)
        })
    }

    const scrollTabIntoView = (index: number) => {
        if (!props.scrollable) return

        const tab = tabRefs.value[index]
        if (tab && tabsContainer.value) {
            const containerRect = tabsContainer.value.getBoundingClientRect()
            const tabRect = tab.getBoundingClientRect()

            if (tabRect.left < containerRect.left) {
                tabsContainer.value.scrollLeft -= containerRect.left - tabRect.left + 20
            } else if (tabRect.right > containerRect.right) {
                tabsContainer.value.scrollLeft += tabRect.right - containerRect.right + 20
            }
        }
    }

    const checkScrollButtons = () => {
        if (!tabsContainer.value || !props.scrollable) return

        const container = tabsContainer.value
        const hasOverflow = container.scrollWidth > container.clientWidth

        showScrollButtons.value = hasOverflow
        canScrollLeft.value = container.scrollLeft > 0
        canScrollRight.value =
            container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    }

    const handleScroll = () => {
        checkScrollButtons()
        scheduleIndicatorUpdate()
    }

    const scrollLeft = () => {
        if (!tabsContainer.value) return
        tabsContainer.value.scrollBy({ left: -200, behavior: 'smooth' })
    }

    const scrollRight = () => {
        if (!tabsContainer.value) return
        tabsContainer.value.scrollBy({ left: 200, behavior: 'smooth' })
    }

    const handleKeydown = (event: KeyboardEvent, currentIndex: number) => {
        const tabs = processedTabs.value
        let newIndex = currentIndex

        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault()
                newIndex = currentIndex - 1
                if (newIndex < 0) newIndex = tabs.length - 1
                while (!tabs[newIndex].active && newIndex !== currentIndex) {
                    newIndex--
                    if (newIndex < 0) newIndex = tabs.length - 1
                }
                break

            case 'ArrowRight':
                event.preventDefault()
                newIndex = currentIndex + 1
                if (newIndex >= tabs.length) newIndex = 0
                while (!tabs[newIndex].active && newIndex !== currentIndex) {
                    newIndex++
                    if (newIndex >= tabs.length) newIndex = 0
                }
                break

            case 'Home':
                event.preventDefault()
                newIndex = tabs.findIndex((tab) => tab.active)
                break

            case 'End':
                event.preventDefault()
                for (let i = tabs.length - 1; i >= 0; i--) {
                    if (tabs[i].active) {
                        newIndex = i
                        break
                    }
                }
                break

            default:
                return
        }

        if (newIndex !== currentIndex && tabs[newIndex].active) {
            selectTab(newIndex)
            tabRefs.value[newIndex]?.focus()
        }
    }

    const onBeforeEnter = (el: Element) => {
        if (props.transition === 'fade') {
            ;(el as HTMLElement).style.opacity = '0'
        } else if (props.transition === 'slide') {
            ;(el as HTMLElement).style.transform = 'translateX(-20px)'
            ;(el as HTMLElement).style.opacity = '0'
        }
    }

    const onEnter = (el: Element) => {
        if (props.transition === 'fade') {
            setTimeout(() => {
                ;(el as HTMLElement).style.opacity = '1'
            }, 10)
        } else if (props.transition === 'slide') {
            setTimeout(() => {
                ;(el as HTMLElement).style.transform = 'translateX(0)'
                ;(el as HTMLElement).style.opacity = '1'
            }, 10)
        }
    }

    const onLeave = (el: Element) => {
        if (props.transition === 'fade') {
            ;(el as HTMLElement).style.opacity = '0'
        } else if (props.transition === 'slide') {
            ;(el as HTMLElement).style.transform = 'translateX(20px)'
            ;(el as HTMLElement).style.opacity = '0'
        }
    }

    const debouncedUpdateIndicator = useDebounceFn(() => {
        if (!isUpdatingIndicator.value) {
            scheduleIndicatorUpdate()
        }
    }, 150)

    const debouncedCheckScroll = useDebounceFn(() => {
        checkScrollButtons()
    }, 100)

    useResizeObserver(tabsContainer, () => {
        if (tabsContainer.value && !isUpdatingIndicator.value) {
            debouncedUpdateIndicator()
            debouncedCheckScroll()
        }
    })

    watch(
        () => props.modelValue,
        (newValue) => {
            if (newValue !== undefined && newValue !== selectedIndex.value) {
                if (newValue >= 0 && newValue < processedTabs.value.length) {
                    selectTab(newValue)
                }
            }
        }
    )

    watch(
        () => props.tabs.length,
        () => {
            nextTick(() => {
                if (!isUpdatingIndicator.value) {
                    scheduleIndicatorUpdate()
                }
                checkScrollButtons()
            })
        }
    )

    onMounted(() => {
        hasBeenSelected.value[selectedIndex.value] = true

        nextTick(() => {
            scheduleIndicatorUpdate()
            checkScrollButtons()
        })
    })

    onUnmounted(() => {
        if (rafId.value) {
            cancelAnimationFrame(rafId.value)
        }
    })

    defineExpose({
        selectedIndex,
        selectTab,
        updateIndicator: scheduleIndicatorUpdate,
    })
</script>

<style scoped>
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }

    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }

    .tab-panel {
        transition: opacity 0.3s ease;
    }

    .tab-fade-enter-active,
    .tab-fade-leave-active {
        transition: opacity 0.3s ease;
    }

    .tab-fade-enter-from,
    .tab-fade-leave-to {
        opacity: 0;
    }

    .tab-slide-enter-active,
    .tab-slide-leave-active {
        transition: all 0.3s ease;
    }

    .tab-slide-enter-from {
        transform: translateX(-20px);
        opacity: 0;
    }

    .tab-slide-leave-to {
        transform: translateX(20px);
        opacity: 0;
    }
</style>
