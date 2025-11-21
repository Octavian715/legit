<template>
    <header class="bg-white sticky top-0 z-50 border-b border-gray-400 h-16 sm:h-auto lg:h-20">
        <div class="flex items-center w-full h-full px-4 py-2 sm:px-4 lg:px-6 lg:pr-12">
            <div class="flex items-center gap-2 w-full justify-end">
                <div class="flex sm:hidden items-center flex-1 w-full">
                    <div class="flex items-center flex-shrink-0">
                        <NuxtLink class="flex justify-start" :to="handleRootRedirect">
                            <svg
                                class="h-6 md:h-8 lg:h-10 w-auto max-w-32"
                                aria-label="LeMarkt Logo"
                            >
                                <use xlink:href="/sprite.svg#logo_lg"></use>
                            </svg>
                        </NuxtLink>
                    </div>
                </div>

                <div class="hidden lg:flex items-center gap-6 sm:flex-shrink-0 sm:w-full lg:w-auto">
                    <template v-if="!isEcom">
                        <div class="flex space-x-2">
                            <NuxtLink :to="localePath('/supplier/products/new')">
                                <Button
                                    :label="t('addATemplate', { n: 2, template: t('sku', 0) })"
                                    size="lg"
                                    variant="filled"
                                    color="blue"
                                />
                            </NuxtLink>
                            <NuxtLink
                                v-if="userStore?.currentPlan?.plan?.code !== 'supplier-lite'"
                                :to="localePath('/supplier/orders/create')"
                            >
                                <Button
                                    :label="t('createOrder')"
                                    size="lg"
                                    variant="filled"
                                    color="red"
                                />
                            </NuxtLink>
                            <Button
                                :label="t('navigation.invitePartener')"
                                size="lg"
                                variant="filled"
                                color="red"
                                @click="$emit('open-invite')"
                            />
                        </div>
                        <div class="w-px h-9 mx-1 bg-gray-400" />

                        <div
                            class="flex items-center gap-1 sm:w-full justify-between lg:w-auto lg:justify-normal"
                        >
                            <Dropdown
                                id="notifications-dashboard"
                                ref="notificationsDropdownRef"
                                placement="auto"
                                trigger="both"
                                menu-width="max-content"
                                menu-alignment="right"
                                auto-align
                            >
                                <template #trigger>
                                    <!-- <NuxtLink :to="localePath('/notifications')" class="relative"> -->
                                    <Icon
                                        :tooltip="
                                            notificationError
                                                ? 'Notifications unavailable'
                                                : t('navigation.notifications')
                                        "
                                        is-button
                                        size="sm"
                                        :color="notificationError ? 'red' : 'gray'"
                                        hover-color="blue"
                                        active-border-color="blue"
                                        badge-type="count"
                                        :count="safeUnreadCount"
                                        :badge-color="notificationError ? 'red' : 'yellow'"
                                        :active="isRouteActive('/notifications')"
                                        container-class="p-2"
                                        icon="bell"
                                        :text-color="
                                            notificationError
                                                ? 'text-red-600 bg-red-100'
                                                : isRouteActive('/notifications')
                                                  ? 'text-yellow-700 bg-yellow-100'
                                                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-100'
                                        "
                                    />
                                    <Transition name="fade">
                                        <span
                                            :class="{
                                                'transition-colors duration-150': true,
                                                'block absolute bottom-0 bg-yellow-500 h-1 inset-x-0 rounded-br-sm rounded-bl-sm':
                                                    isRouteActive('/notifications'),
                                            }"
                                        ></span>
                                    </Transition>
                                    <div
                                        v-if="notificationError"
                                        class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                                    ></div>
                                    <!-- </NuxtLink> -->
                                </template>

                                <ClientOnly>
                                    <div
                                        v-if="notificationState === 'error'"
                                        class="bg-white rounded-sm max-w-96 w-full shadow-lg p-4"
                                    >
                                        <div class="text-center space-y-3">
                                            <svg class="w-8 h-8 mx-auto text-red-500">
                                                <use xlink:href="/sprite.svg#alert-triangle"></use>
                                            </svg>
                                            <div>
                                                <p
                                                    class="text-subtitle2 font-semibold text-red-600"
                                                >
                                                    Notifications Unavailable
                                                </p>
                                                <p class="text-caption1 text-gray-600 mt-1">
                                                    {{ notificationError }}
                                                </p>
                                            </div>
                                            <Button
                                                size="sm"
                                                color="red"
                                                variant="outline"
                                                label="Retry"
                                                @click="handleNotificationRetry"
                                            />
                                        </div>
                                    </div>

                                    <div
                                        v-else-if="notificationState === 'loading'"
                                        class="bg-white rounded-sm max-w-96 w-full shadow-lg p-4"
                                    >
                                        <div class="text-center space-y-2">
                                            <div
                                                class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"
                                            ></div>
                                            <p class="text-subtitle2 text-gray-700">
                                                Loading notifications...
                                            </p>
                                        </div>
                                    </div>

                                    <NotificationsDropdown
                                        v-else-if="notificationState === 'ready'"
                                        :notifications="safeRecentNotifications"
                                        :unread-count="safeUnreadCount"
                                        :loading="notificationsLoading"
                                        :error="!!notificationError"
                                        @mark-all-read="markAllAsRead"
                                        @retry="handleNotificationRetry"
                                        @close="closeNotificationsDropdown"
                                        @notification-click="handleNotificationClick"
                                        @refresh="handleNotificationRetry"
                                    />

                                    <div
                                        v-else
                                        class="bg-white rounded-sm max-w-96 w-full shadow-lg p-4"
                                    >
                                        <div class="text-center">
                                            <p class="text-subtitle2 text-gray-700">
                                                Notifications not available
                                            </p>
                                        </div>
                                    </div>
                                </ClientOnly>
                            </Dropdown>

                            <NuxtLink :to="localePath('/supplier/chat')" class="relative">
                                <Icon
                                    is-button
                                    size="sm"
                                    :tooltip="t('navigation.messages')"
                                    color="gray"
                                    hover-color="blue"
                                    active-border-color="blue"
                                    badge-type="count"
                                    :count="safeUnreadMessagesCount"
                                    badge-color="green"
                                    container-class="p-2"
                                    :active="isRouteActive('/chat')"
                                    icon="chat"
                                    :text-color="
                                        isRouteActive('/chat')
                                            ? 'text-blue-500 bg-blue-100'
                                            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-100'
                                    "
                                    @click="router.push(localePath('/chat'))"
                                />
                                <Transition name="fade">
                                    <span
                                        :class="{
                                            'transition-colors duration-150': true,
                                            'block absolute bottom-0 bg-blue-500 h-1 inset-x-0 rounded-br-sm rounded-bl-sm':
                                                isRouteActive('/chat'),
                                        }"
                                    ></span>
                                </Transition>
                            </NuxtLink>
                        </div>
                    </template>

                    <Icon
                        icon="burger_menu"
                        is-button
                        size="sm"
                        color="gray"
                        text-color="text-gray-950"
                        container-class="sm:hidden "
                        :tooltip="t('navigation.menu')"
                        @click="toggleMenu"
                    />
                </div>

                <div class="sm:hidden profile-menu cursor-pointer relative" @click="toggleMenu">
                    <Avatar size="md" :initials="userInitials" :image-url="userAvatar" />
                    <span
                        class="absolute -bottom-0.5 -right-0.5 border-2 bg-gray-150 tex-gray-800 border-white rounded-full"
                    >
                        <svg
                            class="transition-transform duration-200 flex-shrink-0"
                            :class="['w-3 h-3', { 'rotate-180': menuOpen }]"
                        >
                            <use xlink:href="/sprite.svg#a_down"></use>
                        </svg>
                    </span>
                </div>

                <div class="profile-dropdown hidden sm:block ml-2">
                    <Dropdown
                        id="account"
                        ref="profileDropdownRef"
                        no-default-styles
                        placement="auto"
                        trigger="click"
                        size="lg"
                        :max-menu-height="700"
                        menu-width="max-content"
                        menu-alignment="right"
                        trigger-label-class="p-1.5"
                        trigger-class="rounded-sm"
                        auto-align
                        @hide="profileDropdown = false"
                        @show="profileDropdown = true"
                    >
                        <template #trigger>
                            <div class="relative flex items-center gap-2 max-w-40">
                                <Avatar
                                    size="md"
                                    :initials="userInitials"
                                    :image-url="userAvatar"
                                />
                                <span
                                    class="absolute -bottom-0.5 -right-0.5 border-2 bg-gray-150 tex-gray-800 border-white rounded-full"
                                >
                                    <svg
                                        class="transition-transform duration-200 flex-shrink-0"
                                        :class="['w-3 h-3', { 'rotate-180': profileDropdown }]"
                                    >
                                        <use xlink:href="/sprite.svg#a_down"></use>
                                    </svg>
                                </span>
                            </div>
                        </template>

                        <ProfileDropdown @close="closeProfileDropdown" />
                    </Dropdown>
                </div>
                <Icon
                    v-if="menuOpen"
                    :icon="!menuOpen ? 'burger_menu' : 'close'"
                    is-button
                    size="md"
                    color="gray"
                    text-color="text-gray-950"
                    container-class="sm:hidden "
                    :tooltip="!menuOpen ? t('navigation.menu') : t('close')"
                    @click="toggleMenu"
                />
                <Icon
                    v-if="!menuOpen"
                    :icon="!dashboardMenuOpen ? 'burger_menu' : 'close'"
                    is-button
                    size="md"
                    color="gray"
                    text-color="text-gray-950"
                    container-class="sm:hidden "
                    :tooltip="!dashboardMenuOpen ? t('navigation.menu') : t('close')"
                    @click="toggleDashboardMenu"
                />
            </div>
        </div>

        <div v-if="showMobileSearch" class="md:hidden bg-white border-t border-gray-200 p-4">
            <div class="flex items-center gap-2">
                <div class="flex-1">
                    <SearchForm @search="showMobileSearch = false" />
                </div>
                <Icon
                    icon="close"
                    is-button
                    size="sm"
                    text-color="text-gray-950"
                    color="gray"
                    :tooltip="t('close')"
                    @click="showMobileSearch = false"
                />
            </div>
        </div>

        <ClientOnly>
            <MobileMenu
                :is-open="menuOpen"
                :user="user"
                :cart-count="totalItemsCount ?? 0"
                :wishlist-count="wishlistCount"
                @close="closeMobileMenu"
                @search="handleMobileSearch"
                @category-click="handleCategoryClick"
                @quick-action="handleQuickAction"
                @account-action="handleAccountAction"
                @support-action="handleSupportAction"
                @sign-in="handleSignIn"
                @sign-out="handleSignOut"
            />
        </ClientOnly>

        <template v-if="!isEcom">
            <ClientOnly>
                <MobileMenuDashboard
                    :is-open="dashboardMenuOpen"
                    :user="user"
                    :cart-count="totalItemsCount ?? 0"
                    :wishlist-count="wishlistCount"
                    @close="closeDashboardMobileMenu"
                    @search="handleMobileSearch"
                    @open-invite="$emit('open-invite')"
                    @category-click="handleCategoryClick"
                    @quick-action="handleQuickAction"
                    @account-action="handleAccountAction"
                    @support-action="handleSupportAction"
                    @sign-in="handleSignIn"
                    @sign-out="handleSignOut"
                />
            </ClientOnly>
        </template>
    </header>
</template>

<script setup lang="ts">
    import { ref, computed, watch } from 'vue'
    import { useLocalePath } from '#imports'
    import { useCart } from '~/composables/useCart'
    import { useScrollLock, useThrottleFn, useEventListener } from '@vueuse/core'
    import { storeToRefs } from 'pinia'
    import { useUserStore } from '~/stores/user'
    import { useChatStore } from '~/stores/chat'
    import { useNotifications } from '~/composables/socket/useNotifications'
    import { useUpgradeModal } from '~/composables/useUpgradeModal'

    interface Category {
        id: string
        name: string
        icon: any
        count?: number
        slug: string
    }

    const emit = defineEmits<{
        'open-invite': []
    }>()

    const localePath = useLocalePath()
    const { t } = useI18n()
    const route = useRoute()
    const router = useRouter()
    const userStore = useUserStore()
    const chatStore = useChatStore()
    const toast = useToastNotification()
    const { totalItemsCount } = useCart()
    const isLocked = useScrollLock(process.client ? document.body : null)

    const {
        unreadCount,
        recentNotifications,
        markAllAsRead,
        isInitialized: notificationsInitialized,
        isInitializing: notificationsInitializing,
        isLoading: notificationsLoading,
        initializationError,
        notificationState,
        handleNotificationClick, // Asigură-te că este importat (deja este în fișierul tău)
        retry: retryNotifications,
    } = useNotifications()

    const {
        isSupplier,
        isBuyer,
        currentPlan,
        user,
        userDisplayName,
        userInitials,
        plan,
        userAvatar,
    } = storeToRefs(userStore)

    const notificationsDropdownRef = ref<InstanceType<typeof Dropdown> | null>(null)
    const profileDropdownRef = ref<InstanceType<typeof Dropdown> | null>(null)

    const profileDropdown = ref(false)
    const menuOpen = ref<boolean>(false)
    const dashboardMenuOpen = ref<boolean>(false)
    const showMobileSearch = ref<boolean>(false)
    const wishlistCount = ref(5)

    const safeUnreadCount = computed(() => {
        try {
            // Only block if there's an actual error
            if (initializationError.value) {
                return 0
            }

            // Get count directly - don't wait for initialization to complete
            const count = unreadCount.value

            // Return valid count or 0
            if (typeof count === 'number' && !isNaN(count) && count >= 0) {
                return count
            }

            return 0
        } catch (error) {
            console.error('[AppHeader] Error accessing unread count:', error)
            return 0
        }
    })

    const safeRecentNotifications = computed(() => {
        try {
            if (initializationError.value) return []
            if (!notificationsInitialized.value) return []
            if (notificationsLoading.value) return []

            const notifications = recentNotifications.value

            if (!notifications || !Array.isArray(notifications)) {
                return []
            }

            return notifications.filter((notification) => {
                return (
                    notification &&
                    typeof notification === 'object' &&
                    (notification.id || notification.id === 0) &&
                    typeof notification.title === 'string'
                )
            })
        } catch (error) {
            console.error('[AppHeaderDashboard] Error accessing recent notifications:', error)
            return []
        }
    })

    const safeUnreadMessagesCount = computed(() => {
        try {
            return chatStore.totalUnreadCount || 0
        } catch (error) {
            console.error('[AppHeaderDashboard] Error accessing unread messages:', error)
            return 0
        }
    })

    const notificationError = computed(() => initializationError.value)

    const closeNotificationsDropdown = () => {
        notificationsDropdownRef.value?.close()
    }

    const closeProfileDropdown = () => {
        profileDropdownRef.value?.close()
    }

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead()
        } catch (error) {
            console.error('[AppHeaderDashboard] Error marking all as read:', error)
            toast.error('Failed to mark notifications as read')
        }
    }

    const handleNotificationRetry = async () => {
        try {
            await retryNotifications()
        } catch (error) {
            console.error('[AppHeaderDashboard] Retry failed:', error)
        }
    }

    const isRouteActive = (path: string): boolean => {
        try {
            const localizedPath = localePath(path)
            return route.matched.some((m) => m.path === localizedPath)
        } catch (error) {
            console.error('[AppHeaderDashboard] Error checking route active:', error)
            return false
        }
    }

    const isEcom = computed(() => {
        try {
            return !/\/(buyer|supplier)/.test(route.path)
        } catch (error) {
            console.error('[AppHeaderDashboard] Error checking ecom status:', error)
            return true
        }
    })

    // ============================
    // Upgrade Modal Logic
    // ============================

    const { openUpgradeModal } = useUpgradeModal()

    /**
     * Check if user is on Lite plan
     */
    const isLitePlan = computed(() => {
        try {
            const planCode = currentPlan.value?.plan?.code
            return planCode?.includes('supplier-lite') || false
        } catch (error) {
            return false
        }
    })

    // ============================
    // Navigation & UI Functions
    // ============================

    const toggleMenu = useThrottleFn((): void => {
        menuOpen.value = !menuOpen.value
        if (menuOpen.value) {
            if (dashboardMenuOpen.value) toggleDashboardMenu()
            showMobileSearch.value = false
        }
        isLocked.value = menuOpen.value
    }, 100)

    const toggleDashboardMenu = useThrottleFn((): void => {
        dashboardMenuOpen.value = !dashboardMenuOpen.value
        if (menuOpen.value) {
            toggleMenu()
        }
        isLocked.value = dashboardMenuOpen.value
    }, 100)

    const closeDashboardMobileMenu = (): void => {
        dashboardMenuOpen.value = false
        isLocked.value = false
    }

    const closeMobileMenu = (): void => {
        menuOpen.value = false
        isLocked.value = false
    }

    const handleMobileSearch = (query: string): void => {
        router.push(localePath(`/search?q=${encodeURIComponent(query)}`))
    }

    const handleCategoryClick = (category: Category): void => {
        router.push(localePath(`/category/${category.slug}`))
    }

    const handleQuickAction = (action: string): void => {
        switch (action) {
            case 'cart':
                router.push(localePath('/cart'))
                break
            case 'wishlist':
                router.push(localePath('/favorites'))
                break
            default:
        }
    }

    const handleAccountAction = (action: string): void => {
        switch (action) {
            case 'orders':
                router.push(localePath('/account/orders'))
                break
            case 'profile':
                router.push(localePath('/account/profile'))
                break
            case 'addresses':
                router.push(localePath('/account/addresses'))
                break
            case 'payments':
                router.push(localePath('/account/payments'))
                break
            default:
        }
    }

    const handleSupportAction = (action: string): void => {
        switch (action) {
            case 'help':
                router.push(localePath('/help'))
                break
            case 'contact':
                router.push(localePath('/contact'))
                break
            case 'about':
                router.push(localePath('/about'))
                break
            default:
        }
    }

    const handleRootRedirect = computed(() => {
        try {
            const currentPath = route.path

            if (currentPath.includes('/buyer') && isBuyer.value) {
                return localePath('/buyer/dashboard')
            }

            if (currentPath.includes('/supplier') && isSupplier.value) {
                return localePath('/supplier/dashboard')
            }

            return localePath('/marketplace')
        } catch (error) {
            console.error('[AppHeaderDashboard] Error computing root redirect:', error)
            return localePath('/marketplace')
        }
    })

    const handleSignIn = (): void => {
        router.push(localePath('/login'))
    }

    const handleSignOut = (): void => {
        navigateTo(localePath('/login'))
    }

    useEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (showMobileSearch.value) {
                showMobileSearch.value = false
                isLocked.value = false
            }
            if (menuOpen.value) {
                closeMobileMenu()
            }
            if (dashboardMenuOpen.value) {
                closeDashboardMobileMenu()
            }
        }
    })

    // Close mobile menus when viewport exceeds sm breakpoint (640px)
    useEventListener('resize', () => {
        if (window.innerWidth >= 640) {
            if (menuOpen.value) {
                closeMobileMenu()
            }
            if (dashboardMenuOpen.value) {
                closeDashboardMobileMenu()
            }
        }
    })

    watch(
        () => route.path,
        () => {
            if (menuOpen.value || showMobileSearch.value || dashboardMenuOpen.value) {
                menuOpen.value = false
                dashboardMenuOpen.value = false
                showMobileSearch.value = false
                isLocked.value = false
            }
        }
    )

    watch(notificationError, (error) => {
        if (error && process.client) {
            console.warn('[AppHeaderDashboard] Notification error detected:', error)
        }
    })
</script>
