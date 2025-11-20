<template>
    <Transition
        name="mobile-menu"
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-all duration-300 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
    >
        <div
            v-if="isOpen"
            class="fixed inset-0 top-16 z-50 lg:hidden bg-white"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-menu-title"
        >
            <div ref="menuRef" class="h-full flex flex-col">
                <div class="flex-1 overflow-y-auto p-4">
                    <div v-if="menu.length > 0" class="space-y-3">
                        <div class="space-y-2">
                            <template v-for="(item, index) in menu" :key="item.key || index">
                                <!-- Menu Item Container with Single Border -->
                                <div
                                    class="overflow-hidden bg-white border border-gray-600 rounded hover:border-red-500 hover:text-red-500 transition-colors"
                                    :class="{
                                        'border-red-500 text-red-500 font-medium': isActive(item),
                                        'hover:border-red-500':
                                            !isActive(item) && !isMenuItemLocked(item),
                                        'border-gray-400 opacity-60': isMenuItemLocked(item),
                                    }"
                                >
                                    <!-- Parent Item with Children -->
                                    <div v-if="item.children && item.children.length > 0">
                                        <button
                                            type="button"
                                            class="w-full flex items-center justify-between p-3 text-subtitle1 transition-colors hover:bg-red-50"
                                            :class="{
                                                'text-red-500 font-medium hover:bg-white':
                                                    shouldShowSubmenu(item),
                                                'font-medium': !shouldShowSubmenu(item),
                                                'text-gray-600 cursor-not-allowed hover:bg-white':
                                                    isMenuItemLocked(item),
                                            }"
                                            @click="handleParentClick($event, item)"
                                        >
                                            <div class="flex items-center gap-2">
                                                <div
                                                    class="flex-shrink-0 w-6 h-6 flex items-center justify-center"
                                                >
                                                    <svg class="h-5 w-5">
                                                        <use
                                                            :xlink:href="iconLink(item.icon)"
                                                        ></use>
                                                    </svg>
                                                </div>
                                                <span class="truncate capitalize">{{
                                                    item.label
                                                }}</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <span
                                                    v-if="item.count && item.count > 0"
                                                    class="bg-red-500 text-white text-caption1 rounded-full h-6 w-6 flex items-center justify-center font-normal"
                                                >
                                                    {{ item.count > 9 ? '9+' : item.count }}
                                                </span>

                                                <!-- Lock Icon for Locked Items -->
                                                <svg
                                                    v-if="isMenuItemLocked(item)"
                                                    class="h-4 w-4 text-gray-600 flex-shrink-0"
                                                >
                                                    <use xlink:href="/sprite.svg#lock"></use>
                                                </svg>

                                                <!-- Expand Arrow for Items with Children (not locked) -->
                                                <svg
                                                    v-else
                                                    :class="[
                                                        'h-4 w-4 transition-transform duration-200',
                                                        {
                                                            'rotate-180': shouldShowSubmenu(item),
                                                        },
                                                    ]"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M19 9l-7 7-7-7"
                                                    ></path>
                                                </svg>
                                            </div>
                                        </button>

                                        <!-- Submenu -->
                                        <Transition
                                            name="submenu"
                                            enter-active-class="transition-all duration-300 ease-out"
                                            leave-active-class="transition-all duration-300 ease-in"
                                            enter-from-class="opacity-0 max-h-0"
                                            enter-to-class="opacity-100 max-h-screen"
                                            leave-from-class="opacity-100 max-h-screen"
                                            leave-to-class="opacity-0 max-h-0"
                                        >
                                            <div
                                                v-if="
                                                    shouldShowSubmenu(item) &&
                                                    !isMenuItemLocked(item)
                                                "
                                                class="overflow-hidden pb-3"
                                            >
                                                <div>
                                                    <template
                                                        v-for="(subItem, subIndex) in item.children"
                                                        :key="subItem.key || subIndex"
                                                    >
                                                        <!-- Subitem Link -->
                                                        <component
                                                            :is="
                                                                isMenuItemLocked(subItem) ||
                                                                !subItem.path
                                                                    ? 'button'
                                                                    : NuxtLinkComponent
                                                            "
                                                            :to="
                                                                !isMenuItemLocked(subItem) &&
                                                                subItem.path
                                                                    ? subItem.path
                                                                    : undefined
                                                            "
                                                            type="button"
                                                            class="flex items-center group justify-between mx-6 text-subtitle2 font-medium text-gray-950 transition-colors relative border-l-2 border-gray-600 hover:border-red-500 w-full"
                                                            :class="{
                                                                'text-red-500 border-red-500 font-medium':
                                                                    isActive(subItem) &&
                                                                    !isMenuItemLocked(subItem),
                                                                'text-gray-600 border-gray-600 cursor-not-allowed opacity-60':
                                                                    isMenuItemLocked(subItem),
                                                            }"
                                                            @click="
                                                                handleSubItemClick($event, subItem)
                                                            "
                                                        >
                                                            <span
                                                                class="truncate capitalize mx-3 p-3 w-full group-hover:text-red-500 group-hover:bg-red-50 text-left"
                                                                :class="{
                                                                    'bg-red-50':
                                                                        isActive(subItem) &&
                                                                        !isMenuItemLocked(subItem),
                                                                    'group-hover:bg-white':
                                                                        isMenuItemLocked(subItem),
                                                                }"
                                                            >
                                                                {{ subItem.label }}

                                                                <!-- Lock icon for locked subitems -->
                                                                <svg
                                                                    v-if="isMenuItemLocked(subItem)"
                                                                    class="inline-block ml-2 h-3 w-3 text-gray-600"
                                                                >
                                                                    <use
                                                                        xlink:href="/sprite.svg#lock"
                                                                    ></use>
                                                                </svg>
                                                            </span>
                                                        </component>
                                                    </template>
                                                </div>
                                            </div>
                                        </Transition>
                                    </div>

                                    <!-- Parent Item without Children -->
                                    <component
                                        :is="isMenuItemLocked(item) ? 'button' : NuxtLinkComponent"
                                        v-else
                                        :to="
                                            !isMenuItemLocked(item) && item.path
                                                ? item.path
                                                : undefined
                                        "
                                        type="button"
                                        class="w-full flex items-center justify-between p-3 text-subtitle1 bg-white hover:bg-gray-50 transition-colors"
                                        :class="{
                                            'text-red-500 font-medium':
                                                isActive(item) && !isMenuItemLocked(item),
                                            'font-medium':
                                                !isActive(item) && !isMenuItemLocked(item),
                                            'text-gray-600 cursor-not-allowed opacity-60':
                                                isMenuItemLocked(item),
                                        }"
                                        @click="handleMenuItemClick($event, item)"
                                    >
                                        <div class="flex items-center gap-2">
                                            <div
                                                class="flex-shrink-0 w-6 h-6 flex items-center justify-center"
                                            >
                                                <svg class="h-5 w-5">
                                                    <use :xlink:href="iconLink(item.icon)"></use>
                                                </svg>
                                            </div>
                                            <span class="truncate capitalize">{{
                                                item.label
                                            }}</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span
                                                v-if="item.count && item.count > 0"
                                                class="bg-red-500 text-white text-caption1 rounded-full h-6 w-6 flex items-center justify-center font-normal"
                                            >
                                                {{ item.count > 9 ? '9+' : item.count }}
                                            </span>
                                            <span
                                                v-if="item.badge"
                                                class="bg-gray-400 px-2 py-1 rounded text-subtitle3 leading-4 text-white"
                                            >
                                                {{ item.badge }}
                                            </span>

                                            <!-- Lock Icon for Locked Items -->
                                            <svg
                                                v-if="isMenuItemLocked(item)"
                                                class="h-4 w-4 text-gray-600 flex-shrink-0"
                                            >
                                                <use xlink:href="/sprite.svg#lock"></use>
                                            </svg>
                                        </div>
                                    </component>
                                </div>
                            </template>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
    import { ref, watch, nextTick, onUnmounted, onMounted, resolveComponent } from 'vue'
    import { useRoute, useRouter } from '#imports'
    import { useMenuItems } from '~/composables/useMenuItems'
    import { useFeatureAccess } from '~/composables/useFeatureAccess'
    import { menuKeyToFeature } from '~/constants/featureAccess'
    import type { User } from '~/types/auth'
    import type { MenuItem } from '~/types/menu'
    import type { FeatureName } from '~/types/features'

    interface Props {
        isOpen: boolean
        user?: User | null
        cartCount?: number
        wishlistCount?: number
    }

    const props = defineProps<Props>()

    const emit = defineEmits<{
        close: []
        'open-invite': []
    }>()

    const route = useRoute()
    const router = useRouter()
    const menuRef = ref<HTMLElement>()

    // Resolve NuxtLink component for dynamic rendering
    const NuxtLinkComponent = resolveComponent('NuxtLink')

    const { menu, isActive, handleSubmenuToggle, shouldShowSubmenu, openActiveParentSubmenu } =
        useMenuItems()

    // ✅ Extract both canAccess AND showUpgradePrompt at TOP-LEVEL
    const { canAccess, showUpgradePrompt } = useFeatureAccess()

    const iconLink = (icon: string): string => `/sprite.svg#${icon}`

    /**
     * Check if menu item is locked based on feature access
     */
    const isMenuItemLocked = (item: MenuItem): boolean => {
        if (!item.key) return false

        // Check if this menu key requires a feature
        const requiredFeature = menuKeyToFeature[item.key]

        // If no feature requirement, item is NOT locked
        if (!requiredFeature) {
            return false
        }

        // Check if user has access
        const hasAccess = canAccess(requiredFeature as any)
        const isLocked = !hasAccess

        return isLocked
    }

    /**
     * Handle parent item click (with or without children)
     */
    const handleParentClick = (event: MouseEvent, item: MenuItem) => {
        // If locked, prevent navigation and show upgrade prompt
        if (isMenuItemLocked(item)) {
            event.preventDefault()
            const requiredFeature = menuKeyToFeature[item.key!]
            if (requiredFeature) {
                // ✅ Use already initialized function from top-level
                showUpgradePrompt(requiredFeature as any)
            }
            return
        }

        // If has children, toggle submenu
        if (item.children && item.children.length > 0) {
            handleSubmenuToggle(item)
        }
    }

    /**
     * Handle single menu item click (no children)
     */
    const handleMenuItemClick = (event: MouseEvent, item: MenuItem) => {
        // If locked, prevent navigation and show upgrade prompt
        if (isMenuItemLocked(item)) {
            event.preventDefault()
            const requiredFeature = menuKeyToFeature[item.key!]

            if (requiredFeature) {
                // ✅ Use already initialized function from top-level
                showUpgradePrompt(requiredFeature as any)
            }
            return
        }

        // Close mobile menu after navigation
        emit('close')
    }

    /**
     * Handle subitem click
     */
    const handleSubItemClick = (event: MouseEvent, subItem: MenuItem) => {
        // If locked, prevent navigation and show upgrade prompt
        if (isMenuItemLocked(subItem)) {
            event.preventDefault()
            const requiredFeature = menuKeyToFeature[subItem.key!]
            if (requiredFeature) {
                // ✅ Use already initialized function from top-level
                showUpgradePrompt(requiredFeature as any)
            }
            return
        }

        // If actions, emit action
        if (subItem.actions) {
            event.preventDefault()
            emit(subItem.actions as 'open-invite')
            emit('close')
            return
        }

        // Close mobile menu after navigation
        emit('close')
    }

    const lockScroll = (lock: boolean): void => {
        if (import.meta.client) {
            document.body.style.overflow = lock ? 'hidden' : ''
        }
    }

    const handleKeydown = (event: KeyboardEvent): void => {
        if (event.key === 'Escape' && props.isOpen) {
            emit('close')
        }
    }

    const handleActionClick = (actionName?: string) => {
        if (actionName) {
            emit(actionName as 'open-invite')
        }
    }

    // Watch for menu open/close
    watch(
        () => props.isOpen,
        (newValue) => {
            lockScroll(newValue)

            if (newValue && import.meta.client) {
                nextTick(() => {
                    if (menuRef.value) {
                        menuRef.value.focus()
                    }
                    openActiveParentSubmenu()
                })
            }
        }
    )

    // Watch for route changes
    watch(
        () => route.path,
        () => {
            nextTick(() => {
                openActiveParentSubmenu()
            })
            if (props.isOpen) {
                emit('close')
            }
        },
        { immediate: true }
    )

    // Watch for menu data changes and initialize active state
    watch(
        () => menu.value.length,
        (newLength) => {
            if (newLength > 0) {
                nextTick(() => {
                    openActiveParentSubmenu()
                })
            }
        },
        { immediate: true }
    )

    onMounted(() => {
        if (import.meta.client) {
            document.addEventListener('keydown', handleKeydown)
            nextTick(() => {
                openActiveParentSubmenu()
            })
        }
    })

    onUnmounted(() => {
        if (import.meta.client) {
            lockScroll(false)
            document.removeEventListener('keydown', handleKeydown)
        }
    })
</script>

<style scoped lang="scss">
    .submenu-enter-active,
    .submenu-leave-active {
        transition: all 0.3s ease;
        overflow: hidden;
    }

    .submenu-enter-from,
    .submenu-leave-to {
        opacity: 0;
        max-height: 0;
    }

    .submenu-enter-to,
    .submenu-leave-from {
        opacity: 1;
        max-height: 24rem; // 384px
    }

    // Smooth hover transitions
    .transition-colors {
        transition:
            color 0.15s ease-in-out,
            background-color 0.15s ease-in-out,
            border-color 0.15s ease-in-out;
    }
</style>
