<template>
    <aside
        :class="[
            'sidebar container flex flex-col justify-between bg-white shadow-md sticky top-0 h-screen transition-all duration-300 overflow-hidden py-6 z-[2]',
            {
                'w-full': isCollapsed,
                'w-20': !isCollapsed,
            },
        ]"
    >
        <!-- Loading State -->
        <div v-if="isLoading" class="relative z-10 flex flex-col h-full bg-white">
            <div class="flex justify-start" :class="{ 'px-12': isCollapsed, 'px-6': !isCollapsed }">
                <div class="logo-container flex-shrink-0 w-fit">
                    <div
                        :class="[
                            'bg-gray-300 rounded animate-pulse',
                            isCollapsed ? 'h-8 w-44' : 'h-7 w-7',
                        ]"
                    ></div>
                </div>
            </div>

            <nav
                :class="{
                    'flex-1 overflow-y-auto py-6 px-6': true,
                    'py-12': isCollapsed,
                    'px-4 py-8': !isCollapsed,
                }"
            >
                <div class="space-y-1 animate-pulse">
                    <div
                        v-for="i in 10"
                        :key="i"
                        :class="[
                            'flex items-center gap-3 p-3 rounded-lg',
                            'min-h-[44px] md:min-h-[auto]',
                            {
                                'mt-6': i === 4,
                                'justify-start gap-0 pl-0': !isCollapsed,
                            },
                        ]"
                    >
                        <div class="h-6 w-6 bg-gray-300 rounded flex-shrink-0"></div>
                        <div
                            v-if="isCollapsed"
                            :class="[
                                'h-4 bg-gray-300 rounded',
                                i % 3 === 0 ? 'w-24' : i % 2 === 0 ? 'w-32' : 'w-28',
                            ]"
                        ></div>
                        <div
                            v-if="i <= 2 && isCollapsed"
                            class="ml-auto h-5 w-5 bg-gray-300 rounded-full flex-shrink-0"
                        ></div>
                    </div>
                </div>
            </nav>

            <div class="p-4">
                <div class="h-12 w-full bg-gray-300 rounded-md animate-pulse"></div>
            </div>
        </div>

        <!-- Main Content -->
        <div v-else class="relative z-10 flex flex-col h-full bg-white">
            <!-- Logo -->
            <div class="logo-container flex-shrink-0 w-fit h-14">
                <NuxtLink :to="handleRootRedirect" class="block w-fit pl-6">
                    <Transition
                        name="logo"
                        mode="out-in"
                        enter-active-class="logo-enter-active"
                        leave-active-class="logo-leave-active"
                        enter-from-class="logo-enter-from"
                        enter-to-class="logo-enter-to"
                        leave-from-class="logo-leave-from"
                        leave-to-class="logo-leave-to"
                    >
                        <svg v-if="isCollapsed" key="logo-large" class="logo logo--large">
                            <use xlink:href="/sprite.svg#logo_lg" />
                        </svg>
                        <svg v-else key="logo-small" class="logo logo--small">
                            <use xlink:href="/sprite.svg#logo_sm" />
                        </svg>
                    </Transition>
                </NuxtLink>
            </div>

            <!-- Navigation -->
            <nav
                v-if="menu.length > 0"
                :class="{
                    'flex-1 overflow-y-auto py-6 px-6': true,
                    'py-12': isCollapsed,
                    'px-4 py-8': !isCollapsed,
                }"
            >
                <ul class="space-y-1">
                    <li
                        v-for="(item, index) in menu"
                        :key="item.key || index"
                        class="relative w-full"
                    >
                        <!-- Parent with Children -->
                        <component
                            :is="isMenuItemLocked(item) ? 'button' : NuxtLinkComponent"
                            v-if="item.children && item.children.length > 0"
                            v-tooltip.right="getMenuItemTooltip(item)"
                            :to="!isMenuItemLocked(item) ? getParentPath(item) : undefined"
                            :class="[
                                'flex items-center gap-3 p-3 text-gray-800 transition-colors duration-300 rounded-lg w-full text-left',
                                'min-h-[44px] md:min-h-[auto]',
                                {
                                    'text-red-500': isParentActive(item) && !isMenuItemLocked(item),
                                    'hover:text-red-500 cursor-pointer': !isMenuItemLocked(item),
                                    'text-gray-400 cursor-not-allowed opacity-60':
                                        isMenuItemLocked(item),
                                    'justify-start gap-0 pl-0': !isCollapsed,
                                    'mt-6': shouldAddTopMargin(item, index),
                                },
                            ]"
                            @click="handleParentClick($event, item)"
                        >
                            <svg class="h-6 w-6 flex-shrink-0">
                                <use :xlink:href="iconLink(item.icon)"></use>
                            </svg>
                            <span
                                v-if="isCollapsed"
                                class="font-medium text-subtitle1 transition-all duration-300"
                            >
                                {{ item.label }}
                            </span>

                            <!-- Lock Icon for Locked Items -->
                            <svg
                                v-if="isMenuItemLocked(item) && isCollapsed"
                                class="ml-auto h-4 w-4 text-gray-600 flex-shrink-0"
                            >
                                <use xlink:href="/sprite.svg#lock"></use>
                            </svg>

                            <!-- Expand Arrow for Items with Children -->
                            <svg
                                v-else
                                :class="[
                                    'ml-auto transition-transform duration-300 flex-shrink-0',
                                    isCollapsed ? 'h-4 w-4' : 'w-2 h-2 ml-0.5',
                                    {
                                        'rotate-180': activeSubMenu?.key === item.key,
                                    },
                                ]"
                            >
                                <use xlink:href="/sprite.svg#a_down"></use>
                            </svg>
                        </component>

                        <!-- Single Item (No Children) -->
                        <component
                            :is="isMenuItemLocked(item) ? 'button' : NuxtLinkComponent"
                            v-else
                            v-tooltip.right="getMenuItemTooltip(item)"
                            :to="
                                !isMenuItemLocked(item) && item.path
                                    ? { path: item.path }
                                    : undefined
                            "
                            :class="[
                                'flex items-center gap-3 p-3 text-gray-800 transition-colors duration-300 rounded-lg w-full text-left',
                                'min-h-[44px] md:min-h-[auto]',
                                {
                                    'text-red-500': isActive(item) && !isMenuItemLocked(item),
                                    'hover:text-red-500 cursor-pointer':
                                        !isMenuItemLocked(item) && !isComingSoon(item),
                                    'text-gray-400 cursor-not-allowed opacity-60':
                                        isMenuItemLocked(item) || isComingSoon(item),
                                    'justify-start gap-0 pl-0': !isCollapsed,
                                    'mt-6': shouldAddTopMargin(item, index),
                                },
                            ]"
                            @click="handleMenuItemClick($event, item)"
                        >
                            <svg class="h-6 w-6 flex-shrink-0">
                                <use :xlink:href="iconLink(item.icon)"></use>
                            </svg>
                            <span
                                v-if="isCollapsed"
                                class="capitalize font-medium text-subtitle1 transition-all duration-300"
                            >
                                {{ item.label }}
                            </span>

                            <!-- Coming Soon Badge -->
                            <span
                                v-if="isComingSoon(item) && isCollapsed"
                                class="ml-auto text-caption1"
                            >
                                {{ $t('comingSoon') }}
                            </span>

                            <!-- Lock Icon for Locked Items -->
                            <svg
                                v-else-if="isMenuItemLocked(item) && isCollapsed"
                                class="ml-auto h-4 w-4 text-gray-400 flex-shrink-0"
                            >
                                <use xlink:href="/sprite.svg#lock"></use>
                            </svg>

                            <!-- Count Badge -->
                            <span
                                v-else-if="item.count && item.count > 0 && isCollapsed"
                                class="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center"
                            >
                                {{ item.count > 99 ? '99+' : item.count }}
                            </span>
                        </component>

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
                            <ul
                                v-if="
                                    item.children &&
                                    activeSubMenu?.key === item.key &&
                                    !isMenuItemLocked(item)
                                "
                                class="overflow-hidden mt-2"
                            >
                                <li
                                    v-for="(subItem, subIndex) in item.children"
                                    :key="subItem.key || subIndex"
                                    :class="[
                                        'text-gray-800 hover:text-red-500 transition-colors duration-300 border-l-2 border-gray-500',
                                        {
                                            'ml-5 hover:border-red-500': isCollapsed,
                                            'border-red-500 hover:border-red-500':
                                                isActive(subItem) && !isMenuItemLocked(subItem),
                                            'ml-3': !isCollapsed,
                                        },
                                    ]"
                                >
                                    <component
                                        :is="
                                            isMenuItemLocked(subItem) || !subItem.path
                                                ? 'button'
                                                : NuxtLinkComponent
                                        "
                                        v-if="subItem.path || subItem.actions"
                                        v-tooltip.right="getMenuItemTooltip(subItem)"
                                        :to="
                                            !isMenuItemLocked(subItem) && subItem.path
                                                ? subItem.path
                                                : undefined
                                        "
                                        :class="[
                                            'block px-3 py-3 rounded transition-colors duration-300 relative w-full text-left',
                                            'min-h-[44px] md:min-h-[auto] flex items-center',
                                            {
                                                'ml-0 hover:bg-red-50':
                                                    !isCollapsed && !isMenuItemLocked(subItem),
                                                'text-gray-400 cursor-not-allowed opacity-60':
                                                    isMenuItemLocked(subItem),
                                            },
                                        ]"
                                        @click="handleSubItemClick($event, subItem)"
                                    >
                                        <span
                                            v-if="isCollapsed"
                                            :class="{
                                                capitalize: true,
                                                'text-red-500 font-medium':
                                                    isActive(subItem) && !isMenuItemLocked(subItem),
                                                'ml-8': isCollapsed,
                                            }"
                                        >
                                            {{ subItem.label }}
                                        </span>

                                        <!-- Lock Icon for Locked Subitems -->
                                        <svg
                                            v-if="isMenuItemLocked(subItem) && isCollapsed"
                                            class="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400"
                                        >
                                            <use xlink:href="/sprite.svg#lock"></use>
                                        </svg>

                                        <!-- Count Badge -->
                                        <span
                                            v-else-if="
                                                subItem.count && subItem.count > 0 && isCollapsed
                                            "
                                            class="absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center"
                                        >
                                            {{ subItem.count > 99 ? '99+' : subItem.count }}
                                        </span>
                                    </component>
                                </li>
                            </ul>
                        </Transition>
                    </li>
                </ul>
            </nav>

            <!-- Collapse Button -->
            <div :class="['p-4', { 'px-4 pb-6': isCollapsed }]">
                <button
                    :class="[
                        'flex items-center justify-center w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none transition-colors duration-200',
                        'min-h-[44px]',
                    ]"
                    :title="isCollapsed ? 'Collapse sidebar' : 'Expand sidebar'"
                    @click="globalStore.toggleSideBar"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 transition-transform duration-200"
                        :class="{ 'rotate-180': !isCollapsed }"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M4 6h16M4 12h16M4 18h16"
                        />
                    </svg>
                </button>
            </div>
        </div>
    </aside>
</template>

<script setup lang="ts">
    import { ref, computed } from 'vue'
    import { resolveComponent } from 'vue'
    import { useGlobalStore } from '~/stores/global'
    import { useMenuItems } from '~/composables/useMenuItems'
    import { useUserStore } from '~/stores/user'
    import { useFeatureAccess } from '~/composables/useFeatureAccess'
    import { storeToRefs } from 'pinia'
    import type { MenuItem } from '~/types/menu'
    import { menuKeyToFeature } from '~/constants/featureAccess'

    const globalStore = useGlobalStore()
    const userStore = useUserStore()
    const route = useRoute()
    const router = useRouter()
    const localePath = useLocalePath()
    const { t } = useI18n()

    // Resolve NuxtLink component for dynamic rendering
    const NuxtLinkComponent = resolveComponent('NuxtLink')

    const { isCollapseSideBar: isCollapsed } = storeToRefs(globalStore)
    const { isSupplier, isBuyer } = storeToRefs(userStore)

    const { menu, activeSubMenu, toggleSubMenu, shouldAddTopMargin, isActive } = useMenuItems()
    const { canAccess, navigateToUpgrade } = useFeatureAccess()

    const isLoading = ref(true)

    const emit = defineEmits<{
        'open-invite': []
    }>()

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
     * Check if menu item is coming soon (old hardcoded logic)
     */
    const isComingSoon = (item: MenuItem): boolean => {
        if (!item.path) return false
        return (
            item.path.includes('/guide') ||
            item.path.includes('/support') ||
            item.path.includes('/inventory') ||
            item.path.includes('/sales')
        )
    }

    /**
     * Get tooltip for menu item
     */
    const getMenuItemTooltip = (item: MenuItem): string => {
        // If collapsed, show label
        if (!isCollapsed.value) {
            return item.label
        }

        // If locked, show upgrade message
        if (isMenuItemLocked(item)) {
            return t('subscription.upgradeToAccess', 'Upgrade your plan to access this feature')
        }

        // Default: no tooltip when expanded
        return ''
    }

    const getParentPath = (item: MenuItem): string => {
        if (!item.path) return '#'
        return `${item.path}`
    }

    const isParentActive = (item: MenuItem): boolean => {
        if (!item.path) return false

        const currentPath = route.path
        const parentPath = item.path

        if (currentPath.startsWith(parentPath)) {
            return true
        }

        if (item.children && item.children.length > 0) {
            return item.children.some((child) => child.path && isActive(child))
        }

        return false
    }

    /**
     * Handle parent item click
     */
    const handleParentClick = (event: MouseEvent, item: MenuItem) => {
        // If locked, prevent navigation and show upgrade prompt
        if (isMenuItemLocked(item)) {
            event.preventDefault()
            const requiredFeature = menuKeyToFeature[item.key!]
            if (requiredFeature) {
                navigateToUpgrade(requiredFeature as any)
            }
            return
        }

        // If sidebar is NARROW (icon only) - expand it and show submenu
        if (!isCollapsed.value) {
            event.preventDefault()
            globalStore.toggleSideBar() // Expand sidebar
            // Open submenu after sidebar animation
            setTimeout(() => {
                if (activeSubMenu.value?.key !== item.key) {
                    toggleSubMenu(item)
                }
            }, 100)
            return
        }

        // Sidebar is WIDE - toggle submenu
        const isCurrentlyActive = activeSubMenu.value?.key === item.key

        if (isCurrentlyActive) {
            event.preventDefault()
            toggleSubMenu(item)
        } else {
            toggleSubMenu(item)
        }
    }

    /**
     * Handle menu item click (items without children)
     */
    const handleMenuItemClick = (event: MouseEvent, item: MenuItem) => {
        // If locked, prevent navigation and show upgrade prompt
        if (isMenuItemLocked(item)) {
            event.preventDefault()
            const requiredFeature = menuKeyToFeature[item.key!]
            if (requiredFeature) {
                navigateToUpgrade(requiredFeature as any)
            }
            return
        }

        // If coming soon, prevent navigation
        if (isComingSoon(item)) {
            event.preventDefault()
            return
        }
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
                navigateToUpgrade(requiredFeature as any)
            }
            return
        }

        // If actions, emit action
        if (subItem.actions) {
            event.preventDefault()
            emit(subItem.actions as 'open-invite')
        }
    }

    const handleRootRedirect = computed(() => {
        if (isSupplier.value) return localePath('/supplier/dashboard')
        if (isBuyer.value) return localePath('/buyer/dashboard')
        return localePath('/feed')
    })

    const iconLink = (icon: string) => {
        return `/sprite.svg#${icon}`
    }

    onMounted(() => {
        isLoading.value = false
    })
</script>

<style scoped>
    /* Logo Transitions */
    .logo-enter-active,
    .logo-leave-active {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .logo-enter-from {
        opacity: 0;
        transform: scale(0.95);
    }

    .logo-enter-to {
        opacity: 1;
        transform: scale(1);
    }

    .logo-leave-from {
        opacity: 1;
        transform: scale(1);
    }

    .logo-leave-to {
        opacity: 0;
        transform: scale(0.95);
    }

    /* Logo Sizes */
    .logo--large {
        width: 176px;
        height: 32px;
    }

    .logo--small {
        width: 28px;
        height: 28px;
    }

    /* Submenu Transitions */
    .submenu-enter-active,
    .submenu-leave-active {
        overflow: hidden;
    }

    .submenu-enter-from,
    .submenu-leave-to {
        max-height: 0;
        opacity: 0;
    }

    .submenu-enter-to,
    .submenu-leave-from {
        max-height: 1000px;
        opacity: 1;
    }
</style>
