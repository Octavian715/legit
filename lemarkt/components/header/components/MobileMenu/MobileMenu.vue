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
                    <!-- 1. Search Bar -->
                    <div class="p-2">
                        <SearchForm />
                    </div>

                    <div v-if="user" class="mx-4 mb-4 space-y-3">
                        <!-- 2. User Info + Upgrade -->
                        <div class="flex justify-between items-center gap-2">
                            <div class="flex flex-col">
                                <p class="text-title3 font-bold text-gray-950">{{ user.name }}</p>
                                <p class="text-bodybold text-gray-800">{{ user.email }}</p>
                            </div>
                            <Button
                                color="blue"
                                variant="outline"
                                font-weight="normal"
                                size="sm"
                                @click="handleUpgrade"
                            >
                                <div class="flex items-center gap-2">
                                    <svg class="w-2.5 h-2.5">
                                        <use xlink:href="/sprite.svg#duble-caret-up"></use>
                                    </svg>
                                    {{ t('upgradePlan') }}
                                </div>
                            </Button>
                        </div>

                        <!-- 3. Stats Row (Products, Followers, Connections) -->
                        <div class="flex gap-1">
                            <NuxtLink
                                :to="localePath(`/profile/${userName}?tab=products`)"
                                class="flex-1 block text-subtitle4 text-gray-800 rounded border py-2 px-1.5 border-gray-600 hover:text-white hover:bg-gray-600 active:bg-gray-800 group text-center"
                            >
                                <strong class="text-gray-950 group-hover:text-white">{{
                                    user.products_count || 0
                                }}</strong>
                                {{ t('company.products') }}
                            </NuxtLink>
                            <NuxtLink
                                :to="localePath(`/profile/${userName}/followers`)"
                                class="flex-1 block text-subtitle4 text-gray-800 rounded border py-2 px-1.5 border-gray-600 hover:text-white hover:bg-gray-600 active:bg-gray-800 group text-center"
                            >
                                <strong class="text-gray-950 group-hover:text-white">{{
                                    user.followers_count || 0
                                }}</strong>
                                {{ t('followers') }}
                            </NuxtLink>
                            <NuxtLink
                                :to="localePath(`/profile/${userName}/connections`)"
                                class="flex-1 block text-subtitle4 text-gray-800 rounded border py-2 px-1.5 border-gray-600 hover:text-white hover:bg-gray-600 active:bg-gray-800 group text-center"
                            >
                                <strong class="text-gray-950 group-hover:text-white">{{
                                    user.connections_count || 0
                                }}</strong>
                                {{ t('connections') }}
                            </NuxtLink>
                        </div>

                        <div class="w-full h-px bg-gray-400" />

                        <!-- 4. Quick Actions (Notifications, Cart, Messages) -->
                        <div class="space-y-2">
                            <button
                                type="button"
                                class="w-full flex items-center justify-between p-3 text-subtitle1 bg-white border border-gray-600 rounded hover:bg-red-50 hover:border-red-500 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-600 disabled:hover:text-current"
                                :class="{
                                    'text-red-500 border-red-500 bg-red-50 font-bold':
                                        route.path.match(/\/notifications/),
                                    'font-medium': !route.path.match(/\/notifications/),
                                }"
                                @click="handleQuickAction('notifications')"
                            >
                                <div class="flex items-center gap-2">
                                    <div class="flex items-center justify-center">
                                        <svg class="flex-shrink-0 w-6 h-6">
                                            <use :xlink:href="iconLink('bell')"></use>
                                        </svg>
                                    </div>
                                    <span class="truncate">{{ t('notification', { n: 0 }) }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span
                                        v-if="unreadNotificationsCount > 0"
                                        class="bg-yellow-500 text-white text-caption1 rounded-full h-6 w-6 flex items-center justify-center font-normal"
                                        :class="{
                                            'bg-red-500': route.path.match(/\/notifications/),
                                        }"
                                    >
                                        {{
                                            unreadNotificationsCount > 9
                                                ? '9+'
                                                : unreadNotificationsCount
                                        }}
                                    </span>
                                </div>
                            </button>

                            <button
                                type="button"
                                class="w-full flex items-center justify-between p-3 text-subtitle1 bg-white border border-gray-600 rounded hover:bg-red-50 hover:border-red-500 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-600 disabled:hover:text-current"
                                :class="{
                                    'text-red-500 border-red-500 bg-red-50 font-bold':
                                        route.path.match(/\/cart/),
                                    'font-medium': !route.path.match(/\/cart/),
                                }"
                                @click="handleQuickAction('cart')"
                            >
                                <div class="flex items-center gap-2">
                                    <div class="flex items-center justify-center">
                                        <svg class="flex-shrink-0 w-6 h-6">
                                            <use :xlink:href="iconLink('shopping-cart')"></use>
                                        </svg>
                                    </div>
                                    <span class="truncate">{{ t('navigation.shoppingCart') }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span
                                        v-if="cartCount > 0"
                                        class="bg-red-500 text-white text-caption1 rounded-full h-6 w-6 flex items-center justify-center font-normal"
                                    >
                                        {{ cartCount > 9 ? '9+' : cartCount }}
                                    </span>
                                </div>
                            </button>

                            <button
                                type="button"
                                class="w-full flex items-center justify-between p-3 text-subtitle1 bg-white border border-gray-600 rounded hover:bg-red-50 hover:border-red-500 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-600 disabled:hover:text-current"
                                :class="{
                                    'text-green-500 border-green-500 bg-green-50 font-bold':
                                        route.path.match(/\/chat/),
                                    'font-medium': !route.path.match(/\/chat/),
                                }"
                                @click="handleQuickAction('chat')"
                            >
                                <div class="flex items-center gap-2">
                                    <div class="flex items-center justify-center">
                                        <svg class="flex-shrink-0 w-6 h-6">
                                            <use :xlink:href="iconLink('chat')"></use>
                                        </svg>
                                    </div>
                                    <span class="truncate">{{ t('navigation.messages') }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span
                                        v-if="unreadMessagesCount > 0"
                                        class="bg-green-500 text-white text-caption1 rounded-full h-6 w-6 flex items-center justify-center font-normal"
                                        :class="{
                                            'bg-blue-500': route.path.match(/\/chat/),
                                        }"
                                    >
                                        {{ unreadMessagesCount > 9 ? '9+' : unreadMessagesCount }}
                                    </span>
                                </div>
                            </button>
                        </div>

                        <div class="w-full h-px bg-gray-400" />

                        <!-- 5. Dashboard Navigation (Company Profile, Supplier, Buyer, Marketplace) -->
                        <div class="space-y-2">
                            <!-- Company Profile -->
                            <button
                                v-if="userName"
                                type="button"
                                class="w-full flex items-center justify-between p-3 text-subtitle1 bg-white border border-gray-600 rounded hover:bg-red-50 hover:border-red-500 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-600 disabled:hover:text-current"
                                :class="{
                                    'text-red-500 border-red-500 bg-red-50 font-bold':
                                        route.path.includes(`/profile/${userName}`),
                                    'font-medium': !route.path.includes(`/profile/${userName}`),
                                }"
                                @click="handleProfileNavigation"
                            >
                                <div class="flex items-center gap-2">
                                    <div class="flex items-center justify-center">
                                        <svg class="flex-shrink-0 w-6 h-6">
                                            <use :xlink:href="iconLink('profile')"></use>
                                        </svg>
                                    </div>
                                    <span class="truncate">{{ t('company.profile') }}</span>
                                </div>
                            </button>

                            <!-- Supplier Dashboard -->
                            <button
                                v-if="userStore.isSupplier"
                                type="button"
                                class="w-full flex items-center justify-between p-3 text-subtitle1 bg-white border border-gray-600 rounded hover:bg-red-50 hover:border-red-500 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-600 disabled:hover:text-current"
                                :class="{
                                    'text-red-500 border-red-500 bg-red-50 font-bold':
                                        route.path.match(/\/supplier/),
                                    'font-medium': !route.path.match(/\/supplier/),
                                }"
                                @click="handleDashboard('supplier')"
                            >
                                <div class="flex items-center gap-2">
                                    <div class="flex items-center justify-center">
                                        <svg class="flex-shrink-0 w-6 h-6">
                                            <use :xlink:href="iconLink('box-plus')"></use>
                                        </svg>
                                    </div>
                                    <span class="truncate"
                                        >{{ t('suppliers', { n: 0 }) }}
                                        {{ t('dashboard').toLowerCase() }}</span
                                    >
                                </div>
                            </button>

                            <!-- Buyer Dashboard -->
                            <button
                                type="button"
                                class="w-full flex items-center justify-between p-3 text-subtitle1 bg-white border border-gray-600 rounded hover:bg-red-50 hover:border-red-500 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-600 disabled:hover:text-current"
                                :class="{
                                    'text-red-500 border-red-500 bg-red-50 font-bold':
                                        route.path.match(/\/buyer/),
                                    'font-medium': !route.path.match(/\/buyer/),
                                }"
                                @click="handleDashboard('buyer')"
                            >
                                <div class="flex items-center gap-2">
                                    <div class="flex items-center justify-center">
                                        <svg class="flex-shrink-0 w-6 h-6">
                                            <use :xlink:href="iconLink('plan')"></use>
                                        </svg>
                                    </div>
                                    <span class="truncate"
                                        >{{ t('buyers', { n: 0 }) }}
                                        {{ t('dashboard').toLowerCase() }}</span
                                    >
                                </div>
                            </button>

                            <!-- Marketplace -->
                            <button
                                type="button"
                                class="w-full flex items-center justify-between p-3 text-subtitle1 bg-white border border-gray-600 rounded hover:bg-red-50 hover:border-red-500 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-600 disabled:hover:text-current"
                                :class="{
                                    'text-red-500 border-red-500 bg-red-50 font-bold':
                                        !route.path.startsWith('/buyer') &&
                                        !route.path.startsWith('/supplier') &&
                                        !route.path.includes('/profile/'),
                                    'font-medium':
                                        route.path.startsWith('/buyer') ||
                                        route.path.startsWith('/supplier') ||
                                        route.path.includes('/profile/'),
                                }"
                                @click="handleNavigation('marketplace')"
                            >
                                <div class="flex items-center gap-2">
                                    <div class="flex items-center justify-center">
                                        <svg class="flex-shrink-0 w-6 h-6">
                                            <use :xlink:href="iconLink('shopping-cart')"></use>
                                        </svg>
                                    </div>
                                    <span class="truncate">{{ t('navigation.marketplace') }}</span>
                                </div>
                            </button>
                        </div>

                        <div class="w-full h-px bg-gray-400" />

                        <!-- 6. Settings Section (Settings, Support, Guide) -->
                        <div class="space-y-2">
                            <button
                                type="button"
                                class="w-full flex items-center justify-between p-3 text-subtitle1 bg-white border border-gray-600 rounded hover:bg-red-50 hover:border-red-500 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-600 disabled:hover:text-current"
                                :class="{
                                    'text-red-500 border-red-500 bg-red-50 font-bold':
                                        route.path.match(/\/settings/),
                                    'font-medium': !route.path.match(/\/settings/),
                                }"
                                @click="handleNavigation('settings')"
                            >
                                <div class="flex items-center gap-2">
                                    <div class="flex items-center justify-center">
                                        <svg class="flex-shrink-0 w-6 h-6">
                                            <use :xlink:href="iconLink('settings')"></use>
                                        </svg>
                                    </div>
                                    <span class="truncate">{{ t('navigation.settings') }}</span>
                                </div>
                            </button>

                            <button
                                type="button"
                                class="w-full flex items-center justify-between p-3 text-subtitle1 bg-white border border-gray-600 rounded hover:bg-red-50 hover:border-red-500 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-600 disabled:hover:text-current"
                                :class="{
                                    'text-red-500 border-red-500 bg-red-50 font-bold':
                                        route.path.match(/\/support/),
                                    'font-medium': !route.path.match(/\/support/),
                                }"
                                disabled
                            >
                                <div class="flex items-center gap-2">
                                    <div class="flex items-center justify-center">
                                        <svg class="flex-shrink-0 w-6 h-6">
                                            <use :xlink:href="iconLink('help-circle')"></use>
                                        </svg>
                                    </div>
                                    <span class="truncate">{{ t('navigation.support') }}</span>
                                </div>
                            </button>

                            <button
                                type="button"
                                class="w-full flex items-center justify-between p-3 text-subtitle1 bg-white border border-gray-600 rounded hover:bg-red-50 hover:border-red-500 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-600 disabled:hover:text-current"
                                :class="{
                                    'text-red-500 border-red-500 bg-red-50 font-bold':
                                        route.path.match(/\/guide/),
                                    'font-medium': !route.path.match(/\/guide/),
                                }"
                                disabled
                            >
                                <div class="flex justify-between items-center gap-2 w-full">
                                    <div class="flex items-center gap-2">
                                        <div class="flex items-center justify-center">
                                            <svg class="flex-shrink-0 w-6 h-6">
                                                <use :xlink:href="iconLink('book-saved')"></use>
                                            </svg>
                                        </div>
                                        <span class="truncate">{{ t('navigation.guide') }}</span>
                                    </div>
                                    <span
                                        class="bg-gray-400 px-2 py-1 rounded text-subtitle3 leading-4 text-white"
                                    >
                                        {{ t('launch') }}
                                    </span>
                                </div>
                            </button>

                        </div>

                        <div class="w-full h-px bg-gray-400" />

                        <!-- 7. Action Buttons (Add SKU, Create Order, Invite Partner) -->
                        <div class="flex flex-col space-y-3">
                            <NuxtLink :to="localePath('/supplier/products/new')">
                                <Button
                                    color="blue"
                                    variant="filled"
                                    size="lg"
                                    font-weight="normal"
                                    :label="
                                        t('addATemplate', {
                                            n: 2,
                                            template: t('sku', { n: 0 }),
                                        })
                                    "
                                    container-classes="w-full"
                                />
                            </NuxtLink>
                            <NuxtLink :to="localePath('/supplier/order/new')">
                                <Button
                                    :label="t('createOrder')"
                                    size="lg"
                                    variant="filled"
                                    color="red"
                                    container-classes="w-full"
                                />
                            </NuxtLink>
                            <Button
                                :label="t('navigation.invitePartener')"
                                size="lg"
                                variant="outline"
                                color="red"
                                container-classes="w-full"
                                @click="$emit('accountAction', 'invite')"
                            />
                        </div>

                        <div class="w-full h-px bg-gray-400" />

                        <!-- 8. Logout -->
                        <Button
                            color="gray"
                            variant="filled"
                            font-weight="normal"
                            :label="t('logout')"
                            container-classes="w-full"
                            size="lg"
                            @click="handleSignOut"
                        />
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
    const { unreadCount: unreadNotificationsCount } = useNotifications()

    const menuRef = ref<HTMLElement>()
    const searchTimeoutId = ref<NodeJS.Timeout | null>(null)
    const actionTimeoutId = ref<NodeJS.Timeout | null>(null)

    // Computed for user name
    const userName = computed(() => userStore.userName)

    const lockScroll = (lock: boolean) => {
        if (process.client) {
            document.body.style.overflow = lock ? 'hidden' : ''
        }
    }

    const throttledQuickAction = (action: string) => {
        if (actionTimeoutId.value) return

        actionTimeoutId.value = setTimeout(() => {
            actionTimeoutId.value = null
        }, 200)

        emit('quickAction', action)

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
            case 'currency':
                router.push(localePath('/currency'))
                break
            case 'favorites':
                router.push(localePath('/favorites'))
                break
            case 'templates':
                router.push(localePath('/templates'))
                break
        }

        emit('close')
    }

    const handleQuickAction = (action: string) => {
        throttledQuickAction(action)
    }

    const handleNavigation = (path: string) => {
        emit('close')
        router.push(localePath(`/${path}`))
    }

    const handleProfileNavigation = () => {
        emit('close')
        router.push(localePath(`/profile/${userName.value}`))
    }

    const handleDashboard = (type: string) => {
        emit('close')
        router.push(localePath(`/${type}/dashboard`))
    }

    const handleGuide = () => {
        emit('close')
        window.open('/guide', '_blank')
    }

    const handleUpgrade = () => {
        emit('close')
        router.push(localePath('/settings/upgrade'))
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

    onMounted(() => {
        if (process.client) {
            document.addEventListener('keydown', handleKeydown)
        }
    })

    onUnmounted(() => {
        if (process.client) {
            lockScroll(false)
            document.removeEventListener('keydown', handleKeydown)

            if (searchTimeoutId.value) {
                clearTimeout(searchTimeoutId.value)
            }
            if (actionTimeoutId.value) {
                clearTimeout(actionTimeoutId.value)
            }
        }
    })
</script>
