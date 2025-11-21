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
                <div class="flex-1 overflow-y-auto">
                    <!-- Search -->
                    <div class="p-3 border-b border-gray-200">
                        <SearchForm />
                    </div>

                    <!-- User Profile Section (similar to ProfileDropdown) -->
                    <div v-if="user" class="p-4 space-y-4">
                        <!-- User Info + Upgrade -->
                        <div class="flex items-center justify-between gap-3">
                            <div class="flex items-center gap-3">
                                <Avatar
                                    size="md"
                                    :initials="userInitials"
                                    :image-url="userAvatar"
                                    class="flex-shrink-0"
                                />
                                <div class="flex flex-col min-w-0">
                                    <h3 class="text-title3 text-gray-950 font-bold truncate">
                                        {{ userDisplayName }}
                                    </h3>
                                    <p class="text-body text-gray-600">{{ userEmail }}</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                color="blue"
                                size="sm"
                                font-weight="normal"
                                @click="handleUpgrade"
                            >
                                <div class="flex items-center gap-1.5">
                                    <svg class="w-3 h-3">
                                        <use xlink:href="/sprite.svg#duble-caret-up"></use>
                                    </svg>
                                    {{ t('upgradePlan') }}
                                </div>
                            </Button>
                        </div>

                        <!-- Profile Stats -->
                        <div class="flex gap-2">
                            <NuxtLink
                                :to="localePath(`/profile/${userName}?tab=products`)"
                                class="flex-1 text-center text-subtitle4 text-gray-800 rounded border py-2 px-2 border-gray-400 hover:text-white hover:bg-gray-600 active:bg-gray-800 transition-colors"
                                @click="emit('close')"
                            >
                                <strong class="block text-gray-950">{{ user.products_count || 0 }}</strong>
                                {{ t('company.products') }}
                            </NuxtLink>
                            <NuxtLink
                                :to="localePath(`/profile/${userName}/followers`)"
                                class="flex-1 text-center text-subtitle4 text-gray-800 rounded border py-2 px-2 border-gray-400 hover:text-white hover:bg-gray-600 active:bg-gray-800 transition-colors"
                                @click="emit('close')"
                            >
                                <strong class="block text-gray-950">{{ user.followers_count || 0 }}</strong>
                                {{ t('followers') }}
                            </NuxtLink>
                            <NuxtLink
                                :to="localePath(`/profile/${userName}/connections`)"
                                class="flex-1 text-center text-subtitle4 text-gray-800 rounded border py-2 px-2 border-gray-400 hover:text-white hover:bg-gray-600 active:bg-gray-800 transition-colors"
                                @click="emit('close')"
                            >
                                <strong class="block text-gray-950">{{ user.connections_count || 0 }}</strong>
                                {{ t('connections') }}
                            </NuxtLink>
                        </div>

                        <div class="w-full h-px bg-gray-300" />

                        <!-- Quick Actions (Notifications, Cart, Chat) - Full width buttons -->
                        <div class="space-y-2">
                            <button
                                type="button"
                                class="w-full flex items-center justify-between p-3 text-subtitle1 rounded border transition-colors"
                                :class="[
                                    route.path.includes('/notifications')
                                        ? 'bg-red-50 text-red-500 border-red-500 font-bold'
                                        : 'bg-white text-gray-950 border-gray-400 font-medium hover:bg-red-50 hover:text-red-500 hover:border-red-500',
                                ]"
                                @click="handleQuickAction('notifications')"
                            >
                                <div class="flex items-center gap-3">
                                    <div class="flex items-center justify-center w-6 h-6">
                                        <svg class="w-5 h-5">
                                            <use :xlink:href="iconLink('bell')"></use>
                                        </svg>
                                    </div>
                                    <span class="truncate">{{ t('notification', { n: 0 }) }}</span>
                                </div>
                                <span
                                    v-if="unreadNotificationsCount > 0"
                                    class="bg-yellow-500 text-white text-caption1 rounded-full h-6 w-6 flex items-center justify-center"
                                >
                                    {{ unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount }}
                                </span>
                            </button>

                            <button
                                type="button"
                                class="w-full flex items-center justify-between p-3 text-subtitle1 rounded border transition-colors"
                                :class="[
                                    route.path.includes('/cart')
                                        ? 'bg-red-50 text-red-500 border-red-500 font-bold'
                                        : 'bg-white text-gray-950 border-gray-400 font-medium hover:bg-red-50 hover:text-red-500 hover:border-red-500',
                                ]"
                                @click="handleQuickAction('cart')"
                            >
                                <div class="flex items-center gap-3">
                                    <div class="flex items-center justify-center w-6 h-6">
                                        <svg class="w-5 h-5">
                                            <use :xlink:href="iconLink('shopping-cart')"></use>
                                        </svg>
                                    </div>
                                    <span class="truncate">{{ t('navigation.shoppingCart') }}</span>
                                </div>
                                <span
                                    v-if="cartCount > 0"
                                    class="bg-red-500 text-white text-caption1 rounded-full h-6 w-6 flex items-center justify-center"
                                >
                                    {{ cartCount > 9 ? '9+' : cartCount }}
                                </span>
                            </button>

                            <button
                                type="button"
                                class="w-full flex items-center justify-between p-3 text-subtitle1 rounded border transition-colors"
                                :class="[
                                    route.path.includes('/chat')
                                        ? 'bg-green-50 text-green-500 border-green-500 font-bold'
                                        : 'bg-white text-gray-950 border-gray-400 font-medium hover:bg-green-50 hover:text-green-500 hover:border-green-500',
                                ]"
                                @click="handleQuickAction('chat')"
                            >
                                <div class="flex items-center gap-3">
                                    <div class="flex items-center justify-center w-6 h-6">
                                        <svg class="w-5 h-5">
                                            <use :xlink:href="iconLink('chat')"></use>
                                        </svg>
                                    </div>
                                    <span class="truncate">{{ t('navigation.messages') }}</span>
                                </div>
                                <span
                                    v-if="unreadMessagesCount > 0"
                                    class="bg-green-500 text-white text-caption1 rounded-full h-6 w-6 flex items-center justify-center"
                                >
                                    {{ unreadMessagesCount > 9 ? '9+' : unreadMessagesCount }}
                                </span>
                            </button>
                        </div>

                        <div class="w-full h-px bg-gray-300" />

                        <!-- Dashboard Navigation -->
                        <div class="space-y-2">
                            <!-- Profile -->
                            <MobileMenuButton
                                :icon="'profile'"
                                :label="t('company.profile')"
                                :is-active="route.path.includes(`/profile/${userName}`)"
                                @click="navigateTo(`/profile/${userName}`)"
                            />

                            <!-- Supplier Dashboard (if supplier) -->
                            <MobileMenuButton
                                v-if="userStore.isSupplier"
                                :icon="'box-plus'"
                                :label="`${t('suppliers', { n: 0 })} ${t('dashboard').toLowerCase()}`"
                                :is-active="route.path.includes('/supplier')"
                                @click="navigateTo('/supplier/dashboard')"
                            />

                            <!-- Buyer Dashboard -->
                            <MobileMenuButton
                                :icon="'plan'"
                                :label="`${t('buyers', { n: 0 })} ${t('dashboard').toLowerCase()}`"
                                :is-active="route.path.includes('/buyer')"
                                @click="navigateTo('/buyer/dashboard')"
                            />

                            <!-- Marketplace -->
                            <MobileMenuButton
                                :icon="'shopping-cart'"
                                :label="t('navigation.marketplace')"
                                :is-active="isMarketplace"
                                @click="navigateTo('/marketplace')"
                            />
                        </div>

                        <div class="w-full h-px bg-gray-300" />

                        <!-- Settings Navigation -->
                        <div class="space-y-2">
                            <MobileMenuButton
                                :icon="'settings'"
                                :label="t('navigation.settings')"
                                :is-active="route.path.includes('/settings')"
                                @click="navigateTo('/settings')"
                            />

                            <MobileMenuButton
                                :icon="'help-circle'"
                                :label="t('navigation.support')"
                                :is-active="false"
                                :disabled="true"
                                @click="navigateTo('/support')"
                            />

                            <MobileMenuButton
                                :icon="'book-saved'"
                                :label="t('navigation.guide')"
                                :badge="t('launch')"
                                :is-active="false"
                                :disabled="true"
                                @click="handleGuide"
                            />
                        </div>

                        <div class="w-full h-px bg-gray-300" />

                        <!-- Action Buttons (Add SKU, Create Order, Invite) - Always visible -->
                        <div class="space-y-2">
                            <Button
                                v-if="userStore.isSupplier"
                                color="blue"
                                variant="filled"
                                size="lg"
                                font-weight="normal"
                                container-classes="w-full"
                                @click="navigateTo('/supplier/products/new')"
                            >
                                <div class="flex items-center justify-center gap-2">
                                    <svg class="w-5 h-5">
                                        <use xlink:href="/sprite.svg#plus"></use>
                                    </svg>
                                    {{ t('addATemplate', { n: 2, template: t('sku', { n: 0 }) }) }}
                                </div>
                            </Button>

                            <Button
                                color="red"
                                variant="filled"
                                size="lg"
                                font-weight="normal"
                                container-classes="w-full"
                                @click="navigateTo('/supplier/order/new')"
                            >
                                <div class="flex items-center justify-center gap-2">
                                    <svg class="w-5 h-5">
                                        <use xlink:href="/sprite.svg#document-add"></use>
                                    </svg>
                                    {{ t('createOrder') }}
                                </div>
                            </Button>

                            <Button
                                color="gray"
                                variant="outline"
                                size="lg"
                                font-weight="normal"
                                container-classes="w-full"
                                @click="handleInvite"
                            >
                                <div class="flex items-center justify-center gap-2">
                                    <svg class="w-5 h-5">
                                        <use xlink:href="/sprite.svg#user-plus"></use>
                                    </svg>
                                    {{ t('navigation.invitePartener') }}
                                </div>
                            </Button>
                        </div>

                        <div class="w-full h-px bg-gray-300" />

                        <!-- Logout -->
                        <Button
                            color="gray"
                            variant="filled"
                            size="lg"
                            font-weight="normal"
                            container-classes="w-full"
                            @click="handleSignOut"
                        >
                            {{ t('logout') }}
                        </Button>
                    </div>

                    <!-- Guest State -->
                    <div v-else class="p-4 space-y-4">
                        <div class="text-center py-8">
                            <p class="text-subtitle1 text-gray-600 mb-4">
                                {{ t('auth.signInToAccess') }}
                            </p>
                            <Button
                                color="blue"
                                variant="filled"
                                size="lg"
                                container-classes="w-full"
                                @click="handleSignIn"
                            >
                                {{ t('auth.signIn') }}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
    import { ref, computed, watch, nextTick, onUnmounted, onMounted } from 'vue'
    import { useLocalePath, useRouter, useRoute } from '#imports'
    import { useI18n } from 'vue-i18n'
    import type { User } from '~/types/auth'
    import { useNotifications } from '~/composables/socket/useNotifications'
    import { useUserStore } from '~/stores/user'
    import { useUpgradeModal } from '~/composables/useUpgradeModal'

    interface Props {
        isOpen: boolean
        user?: User | null
        cartCount?: number
        wishlistCount?: number
        unreadMessagesCount?: number
    }

    const props = withDefaults(defineProps<Props>(), {
        cartCount: 0,
        wishlistCount: 0,
        unreadMessagesCount: 0,
    })

    const emit = defineEmits<{
        close: []
        search: [query: string]
        categoryClick: [category: any]
        quickAction: [action: string]
        accountAction: [action: string]
        supportAction: [action: string]
        signIn: []
        signOut: []
    }>()

    const { t } = useI18n()
    const localePath = useLocalePath()
    const router = useRouter()
    const route = useRoute()
    const userStore = useUserStore()
    const { openUpgradeModal } = useUpgradeModal()
    const { unreadCount: unreadNotificationsCount } = useNotifications()

    const menuRef = ref<HTMLElement>()

    // Computed properties
    const userDisplayName = computed(() => userStore.userDisplayName || props.user?.name || '')
    const userEmail = computed(() => props.user?.email || '')
    const userName = computed(() => userStore.userName || '')
    const userInitials = computed(() => {
        const name = userDisplayName.value
        if (!name) return ''
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    })
    const userAvatar = computed(() => props.user?.avatar || '')

    const isMarketplace = computed(() => {
        return !route.path.startsWith('/buyer') && !route.path.startsWith('/supplier')
    })

    // Methods
    const lockScroll = (lock: boolean) => {
        if (process.client) {
            document.body.style.overflow = lock ? 'hidden' : ''
        }
    }

    const navigateTo = (path: string) => {
        emit('close')
        router.push(localePath(path))
    }

    const handleQuickAction = (action: string) => {
        emit('quickAction', action)
        emit('close')

        switch (action) {
            case 'notifications':
                router.push(localePath('/notifications'))
                break
            case 'chat':
                router.push(localePath('/chat'))
                break
            case 'cart':
                router.push(localePath('/cart'))
                break
            case 'favorites':
                router.push(localePath('/favorites'))
                break
        }
    }

    const handleUpgrade = () => {
        emit('close')
        openUpgradeModal(undefined, 'upgrade')
    }

    const handleInvite = () => {
        emit('accountAction', 'invite')
        emit('close')
    }

    const handleGuide = () => {
        emit('close')
        window.open('/guide', '_blank')
    }

    const handleSignIn = () => {
        emit('close')
        router.push(localePath('/auth/login'))
    }

    const handleSignOut = async () => {
        await userStore.logout()
        emit('close')
    }

    const iconLink = (icon: string) => `/sprite.svg#${icon}`

    const handleKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && props.isOpen) {
            emit('close')
        }
    }

    // Watchers
    watch(
        () => props.isOpen,
        (newValue) => {
            lockScroll(newValue)

            if (newValue && process.client) {
                nextTick(() => {
                    if (menuRef.value) {
                        menuRef.value.focus()
                    }
                })
            }
        }
    )

    watch(
        () => route.path,
        () => {
            if (props.isOpen) {
                emit('close')
            }
        }
    )

    // Lifecycle
    onMounted(() => {
        if (process.client) {
            document.addEventListener('keydown', handleKeydown)
        }
    })

    onUnmounted(() => {
        if (process.client) {
            lockScroll(false)
            document.removeEventListener('keydown', handleKeydown)
        }
    })
</script>
