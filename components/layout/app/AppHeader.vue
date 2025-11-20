<template>
    <header
        class="bg-white sticky top-0 z-50 border-b border-gray-400 h-16 sm:h-auto"
        :class="{ 'lg:h-24': !isEcom, 'lg:h-20': isEcom }"
    >
        <div
            class="flex items-center w-full h-full px-4 py-2 sm:px-0 lg:px-4 xl:px-0"
            :class="{ ' container mx-auto': isEcom, 'lg:pr-12': !isEcom }"
        >
            <div
                class="flex sm:flex-col lg:flex-row items-center gap-1 w-full"
                :class="{ 'justify-end': !isEcom, 'justify-between': isEcom }"
            >
                <template v-if="isEcom">
                    <div class="flex items-center flex-1 w-full">
                        <div class="flex items-center flex-shrink-0">
                            <NuxtLink class="flex justify-start" :to="handleRootRedirect">
                                <svg class="h-7 lg:h-8 w-auto max-w-44" aria-label="LeMarkt Logo">
                                    <use xlink:href="/sprite.svg#logo_lg"></use>
                                </svg>
                            </NuxtLink>
                        </div>

                        <div class="hidden sm:block flex-1 max-w-xl lg:max-w-2xl">
                            <ClientOnly>
                                <SearchForm />
                            </ClientOnly>
                        </div>

                        <div class="profile-dropdown hidden sm:block lg:hidden">
                            <Dropdown
                                id="account-tablet"
                                ref="profileDropdownTabletRef"
                                no-default-styles
                                placement="auto"
                                trigger="click"
                                size="lg"
                                trigger-label-class="!px-1.5 !py-1 !rounded-sm"
                                :max-menu-height="700"
                                menu-width="max-content"
                                menu-alignment="right"
                                auto-align
                            >
                                <template #label>
                                    <div class="flex items-center gap-2 max-w-40">
                                        <Avatar
                                            size="sm"
                                            :initials="userInitials"
                                            :image-url="userAvatar"
                                            class="flex-shrink-0"
                                        />
                                        <div class="flex flex-col justify-start gap-1 text-left">
                                            <p
                                                class="text-subtitle4 text-gray-950 font-bold truncate max-w-36"
                                            >
                                                {{ userDisplayName }}
                                            </p>
                                            <span class="text-caption1 text-blue-500">
                                                {{ plan ? plan : '-' }}
                                            </span>
                                        </div>
                                    </div>
                                </template>

                                <ProfileDropdown @close="closeProfileDropdownTablet" />
                            </Dropdown>
                        </div>
                    </div>
                </template>

                <div class="flex lg:flex items-center gap-1 sm:flex-shrink-0 sm:w-full lg:w-auto">
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
                            <NuxtLink :to="localePath('/supplier/orders/create')">
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
                            />
                        </div>
                        <div class="w-px h-9 mx-1 bg-gray-400" />
                    </template>

                    <template v-if="isEcom">
                        <nav
                            class="hidden sm:flex items-center gap-1 w-full justify-between lg:w-auto lg:justify-normal"
                        >
                            <NuxtLink
                                v-for="item in navItems"
                                :key="item.path"
                                :to="localePath(item.path)"
                                class="relative"
                                :class="{ 'pointer-events-none': item.disabled }"
                            >
                                <Icon
                                    v-tooltip="item.disabled ? item.tooltip : item.label"
                                    is-button
                                    size="sm"
                                    color="gray"
                                    hover-color="blue"
                                    active-border-color="blue"
                                    badge-type="count"
                                    badge-color="red"
                                    :active="isRouteActive(item.path)"
                                    container-class="p-2"
                                    :icon="item.icon"
                                    :disabled="item.disabled"
                                    :text-color="
                                        isRouteActive(item.path)
                                            ? 'text-blue-500 bg-blue-100'
                                            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-100'
                                    "
                                    @click="router.push(localePath(item.path))"
                                />
                                <Transition name="fade">
                                    <span
                                        :class="{
                                            'transition-colors duration-150': true,
                                            'block absolute bottom-0 bg-blue-500 h-1 inset-x-0 rounded-br-sm rounded-bl-sm':
                                                isRouteActive(item.path),
                                        }"
                                    ></span>
                                </Transition>
                            </NuxtLink>
                            <div class="w-px h-8 mx-2 bg-gray-300"></div>

                            <NuxtLink :to="localePath('/notifications')" class="relative lg:hidden">
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
                            </NuxtLink>

                            <Dropdown
                                id="notifications"
                                ref="notificationsDropdownRef"
                                placement="auto"
                                trigger="both"
                                menu-width="max-content"
                                menu-alignment="right"
                                auto-align
                                class="hidden lg:block"
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

                            <NuxtLink :to="localePath('/chat')" class="relative">
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
                                    :active="isRouteActive('/chat')"
                                    container-class="p-2"
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
                            <!-- v-if="currentPlan?.plan?.code !== 'supplier-lite'" -->

                            <NuxtLink
                                v-if="!isLiteSupplier"
                                :to="localePath('/cart')"
                                class="relative"
                            >
                                <Icon
                                    is-button
                                    size="sm"
                                    :tooltip="t('navigation.cart')"
                                    color="gray"
                                    hover-color="blue"
                                    active-border-color="blue"
                                    badge-type="count"
                                    badge-color="red"
                                    :active="isRouteActive('/cart')"
                                    :count="safeTotalItemsCount"
                                    container-class="p-2"
                                    icon="cart"
                                    :text-color="
                                        isRouteActive('/cart')
                                            ? 'text-blue-500 bg-blue-100'
                                            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-100'
                                    "
                                    @click="router.push(localePath('/cart'))"
                                />
                                <Transition name="fade">
                                    <span
                                        :class="{
                                            'transition-colors duration-150': true,
                                            'block absolute bottom-0 bg-blue-500 h-1 inset-x-0 rounded-br-sm rounded-bl-sm':
                                                isRouteActive('/cart'),
                                        }"
                                    ></span>
                                </Transition>
                            </NuxtLink>

                            <div class="flex space-x-2 ml-2">
                                <Dropdown
                                    v-if="isLoaded && isMounted && currencyDropdownItems.length > 0"
                                    id="currency-selector"
                                    :label="selectedCurrencyLabel"
                                    :items="currencyDropdownItems || []"
                                    :selected-value="selectedCurrencyId"
                                    trigger="click"
                                    size="lg"
                                    size-icon="sm"
                                    menu-width="trigger"
                                    trigger-class="rounded-sm min-w-[100px]"
                                    trigger-label-class="!px-1.5 !py-1 !rounded-sm !text-gray-600 !text-subtitle3 "
                                    menu-alignment="right"
                                    :close-on-click="true"
                                    placement="bottom"
                                    auto-align
                                    @select="handleCurrencyChange"
                                />
                                <div
                                    v-else
                                    class="h-10 w-24 bg-gray-100 rounded animate-pulse"
                                ></div>

                                <div class="profile-dropdown hidden lg:block ml-2">
                                    <Dropdown
                                        id="account"
                                        ref="profileDropdownRef"
                                        no-default-styles
                                        placement="auto"
                                        trigger="click"
                                        size="lg"
                                        size-icon="sm"
                                        :max-menu-height="700"
                                        menu-width="max-content"
                                        menu-alignment="right"
                                        trigger-label-class="!px-1.5 !py-1 !rounded-sm"
                                        auto-align
                                    >
                                        <template #label>
                                            <div class="flex items-center gap-2 max-w-40">
                                                <Avatar
                                                    size="sm"
                                                    :initials="userInitials"
                                                    :image-url="userAvatar"
                                                    class="flex-shrink-0"
                                                />
                                                <div
                                                    class="flex flex-col justify-start gap-1 text-left"
                                                >
                                                    <p
                                                        class="text-subtitle4 text-gray-950 font-bold truncate max-w-36"
                                                    >
                                                        {{ userDisplayName }}
                                                    </p>
                                                    <span class="text-caption1 text-blue-500">
                                                        {{ plan ? plan : '-' }}
                                                    </span>
                                                </div>
                                            </div>
                                        </template>

                                        <ProfileDropdown
                                            class="z-40"
                                            @close="closeProfileDropdown"
                                        />
                                    </Dropdown>
                                </div>
                            </div>
                        </nav>
                    </template>
                    <Icon
                        :icon="!menuOpen ? 'burger_menu' : 'close'"
                        is-button
                        size="md"
                        color="gray"
                        text-color="text-gray-950"
                        container-class="sm:hidden "
                        :tooltip="!menuOpen ? t('navigation.menu') : t('close')"
                        @click="toggleMenu"
                    />
                </div>
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
                :cart-count="safeTotalItemsCount"
                :wishlist-count="wishlistCount"
                :unread-messages-count="safeUnreadMessagesCount"
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
    </header>
</template>

<script setup lang="ts">
    import { ref, computed, watch, onMounted } from 'vue'
    import { useLocalePath } from '#imports'
    import { useCart } from '~/composables/useCart'
    import { useScrollLock, useThrottleFn, useEventListener } from '@vueuse/core'
    import { storeToRefs } from 'pinia'
    import { useUserStore } from '~/stores/user'
    import { useChatStore } from '~/stores/chat'
    import type { DropdownItem } from '~/types/ui/dropdown'
    import { useNotifications } from '~/composables/socket/useNotifications'
    import { useUpgradeModal } from '~/composables/useUpgradeModal'

    interface NavItem {
        path: string
        icon: string
        label: string
        tooltip?: string
        disabled?: boolean
    }

    interface Category {
        id: string
        name: string
        icon: any
        count?: number
        slug: string
    }

    const localePath = useLocalePath()
    const { t } = useI18n()
    const route = useRoute()
    const router = useRouter()
    const userStore = useUserStore()
    const chatStore = useChatStore()
    const toast = useToastNotification()

    const { isSupplier, isBuyer, currentPlan } = storeToRefs(userStore)
    const { currencies, isLoaded, initialize } = useStaticData()
    const isLocked = useScrollLock(process.client ? document.body : null)

    const { totalItemsCount } = useCart()

    const {
        unreadCount,
        recentNotifications,
        markAllAsRead,
        isInitialized: notificationsInitialized,
        isInitializing: notificationsInitializing,
        isLoading: notificationsLoading,
        initializationError,
        notificationState,
        handleNotificationClick,
        retry: retryNotifications,
    } = useNotifications()

    const notificationsDropdownRef = ref(null)
    const profileDropdownRef = ref(null)
    const profileDropdownTabletRef = ref(null)

    const menuOpen = ref<boolean>(false)
    const showMobileSearch = ref<boolean>(false)
    const isMounted = ref<boolean>(false)

    const { user, userDisplayName, userInitials, plan, isLiteSupplier, userAvatar } =
        storeToRefs(userStore)

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
            console.error('[AppHeader] Error accessing recent notifications:', error)
            return []
        }
    })

    const safeUnreadMessagesCount = computed(() => {
        try {
            return chatStore.totalUnreadCount || 0
        } catch (error) {
            console.error('[AppHeader] Error accessing unread messages:', error)
            return 0
        }
    })

    const safeTotalItemsCount = computed(() => {
        try {
            return totalItemsCount.value || 0
        } catch (error) {
            console.error('[AppHeader] Error accessing cart count:', error)
            return 0
        }
    })

    const notificationError = computed(() => initializationError.value)

    const selectedCurrency = computed(() => {
        try {
            if (!isLoaded.value || !currencies.value || currencies.value.length === 0) {
                return null
            }

            const userDefaultCurrency = userStore.defaultCurrency
            if (userDefaultCurrency) {
                const currency = currencies.value.find((c) => c.id === userDefaultCurrency.id)
                if (currency) {
                    return currency
                }
            }

            const userCurrencyId = user.value?.default_currency_id
            if (userCurrencyId) {
                const currency = currencies.value.find((c) => c.id === userCurrencyId)
                if (currency) {
                    return currency
                }
            }

            const usdCurrency = currencies.value.find((c) => c.code === 'USD')
            if (usdCurrency) {
                return usdCurrency
            }

            return currencies.value[0] || null
        } catch (error) {
            console.error('[AppHeader] Error accessing currency:', error)
            return null
        }
    })

    const selectedCurrencyId = computed(() => {
        try {
            if (!isLoaded.value || !selectedCurrency.value) {
                return null
            }
            return selectedCurrency.value.id
        } catch (error) {
            console.error('[AppHeader] Error accessing currency ID:', error)
            return null
        }
    })

    const selectedCurrencyLabel = computed(() => {
        try {
            if (!selectedCurrency.value) {
                return '$ USD'
            }
            return `${selectedCurrency.value.symbol} ${selectedCurrency.value.code}`
        } catch (error) {
            console.error('[AppHeader] Error formatting currency label:', error)
            return '$ USD'
        }
    })

    const currencyDropdownItems = computed<DropdownItem[]>(() => {
        try {
            if (!currencies.value || currencies.value.length === 0) {
                return []
            }

            return currencies.value.map((currency) => ({
                label: `${currency.symbol} ${currency.code}`,
                value: currency.id,
            }))
        } catch (error) {
            console.error('[AppHeader] Error creating currency dropdown items:', error)
            return []
        }
    })

    const closeNotificationsDropdown = () => {
        notificationsDropdownRef.value?.close()
    }

    const closeProfileDropdown = () => {
        profileDropdownRef.value?.close()
    }

    const closeProfileDropdownTablet = () => {
        profileDropdownTabletRef.value?.close()
    }

    const handleCurrencyChange = async (currencyId: number) => {
        try {
            const selectedCurrencyData = currencies.value.find((c) => c.id === currencyId)

            await userStore.updateUserCurrency(currencyId)

            if (selectedCurrencyData) {
                toast?.success(
                    t('currencyUpdatedSuccess', {
                        currency: `${selectedCurrencyData.symbol} ${selectedCurrencyData.code}`,
                    }),
                    t('success'),
                    {
                        timeout: 1000,
                        position: 'top-right',
                    }
                )
            }

            if (process.client) {
                window.location.reload()
            }
        } catch (error) {
            console.error('Currency update failed:', error)
            toast?.error(t('currencyUpdateError'), t('error'))
        }
    }

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead()
        } catch (error) {
            console.error('[AppHeader] Error marking all as read:', error)
            toast?.error('Failed to mark notifications as read')
        }
    }

    const handleNotificationRetry = async () => {
        try {
            await retryNotifications()
        } catch (error) {
            console.error('[AppHeader] Retry failed:', error)
        }
    }

    const isRouteActive = (path: string): boolean => {
        try {
            const localizedPath = localePath(path)
            return route.matched.some((m) => m.path === localizedPath)
        } catch (error) {
            console.error('[AppHeader] Error checking route active:', error)
            return false
        }
    }

    const getFavoritesIcon = (): string => {
        try {
            const icon = isRouteActive('favorites') ? 'heart-full' : 'heart-2'
            return icon
        } catch (error) {
            console.error('[AppHeader] Error getting favorites icon:', error)
            return 'heart-2'
        }
    }

    const isEcom = computed(() => {
        try {
            return !/\/(buyer|supplier)/.test(route.path)
        } catch (error) {
            console.error('[AppHeader] Error checking ecom status:', error)
            return true
        }
    })

    const navItems = computed<NavItem[]>(() => [
        {
            path: '/marketplace',
            icon: 'logo_sm-icon',
            label: t('navigation.shop'),
            tooltip: t('navigation.shop'),
            disabled: false,
        },
        {
            path: '/buy-now',
            icon: 'buy-now',
            label: t('navigation.shop'),
            tooltip: t('navigation.shop'),
            disabled: true,
        },
        {
            path: '/buy-now',
            icon: 'map',
            label: t('navigation.shop'),
            tooltip: t('navigation.shop'),
            disabled: true,
        },
        {
            path: '/favorites',
            icon: getFavoritesIcon(),
            label: t('navigation.favorites'),
            tooltip: t('navigation.favorites'),
            disabled: false,
        },
        {
            path: '/templates',
            icon: 'cub',
            label: t('navigation.templates'),
            disabled: true,
            tooltip: t('featureComingSoon'),
        },
        {
            path: '/currencies',
            icon: 'exchange',
            label: t('exchangeTool'),
            disabled: true,
            tooltip: t('featureComingSoon'),
        },
    ])

    // ============================
    // Upgrade Modal Logic
    // ============================

    const { openUpgradeModal } = useUpgradeModal()

    /**
     * Handle upgrade button click
     */
    const handleUpgradeClick = () => {
        openUpgradeModal(undefined, 'upgrade')
    }

    // ============================
    // Navigation & UI Functions
    // ============================

    const toggleMenu = useThrottleFn((): void => {
        menuOpen.value = !menuOpen.value
        if (menuOpen.value) {
            showMobileSearch.value = false
        }
        isLocked.value = menuOpen.value
    }, 100)

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
                router.push(localePath('/supplier/orders'))
                break
            case 'profile':
                router.push(localePath('/profile'))
                break
            case 'addresses':
                router.push(localePath('/settings/addresses'))
                break
            case 'payments':
                router.push(localePath('/settings/payments'))
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

            if (currentPath.includes('/buyer') && isBuyer) {
                return localePath('/buyer/dashboard')
            }

            if (currentPath.includes('/supplier') && isSupplier) {
                return localePath('/supplier/dashboard')
            }

            return localePath('/marketplace')
        } catch (error) {
            console.error('[AppHeader] Error computing root redirect:', error)
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
        }
    })

    watch(
        () => route.path,
        () => {
            if (menuOpen.value || showMobileSearch.value) {
                menuOpen.value = false
                showMobileSearch.value = false
                isLocked.value = false
            }
        }
    )

    watch(notificationError, (error) => {
        if (error && process.client) {
            console.warn('[AppHeader] Notification error detected:', error)
        }
    })

    onMounted(async () => {
        try {
            isMounted.value = true
        } catch (error) {
            console.error('[AppHeader] Mount error:', error)
        }
    })
</script>
