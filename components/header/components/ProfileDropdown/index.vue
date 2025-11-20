<template>
    <div class="bg-white rounded-sm max-w-96 w-full p-4">
        <TransitionGroup name="list" tag="div" class="space-y-3">
            <div key="user-info" class="flex items-center justify-between gap-2">
                <div class="flex flex-col">
                    <h3 class="text-title3 text-gray-950 font-bold">{{ userDisplayName }}</h3>
                    <p class="text-body text-gray-800">{{ plan }}</p>
                </div>

                <Button
                    variant="outline"
                    color="blue"
                    size="sm"
                    font-weight="normal"
                    @click="handleUpgradeClick"
                >
                    <div class="flex items-center gap-2">
                        <svg class="w-2.5 h-2.5">
                            <use xlink:href="/sprite.svg#duble-caret-up"></use>
                        </svg>
                        {{ t('upgradePlan') }}
                    </div>
                </Button>
            </div>

            <ul key="profile-stats" class="flex gap-1">
                <li>
                    <NuxtLink
                        :to="`/profile/${userName}?tab=products`"
                        class="block text-subtitle4 text-gray-800 rounded border py-2 px-1.5 border-gray-600 hover:text-white hover:bg-gray-600 active:bg-gray-800 group"
                    >
                        <strong class="text-gray-950 group-hover:text-white">{{
                            user.products_count
                        }}</strong>
                        {{ t('company.products') }}</NuxtLink
                    >
                </li>
                <li>
                    <NuxtLink
                        :to="`/profile/${userName}/followers`"
                        class="block text-subtitle4 text-gray-800 rounded border py-2 px-1.5 border-gray-600 hover:text-white hover:bg-gray-600 active:bg-gray-800 group"
                    >
                        <strong class="text-gray-950 group-hover:text-white">{{
                            user.followers_count
                        }}</strong>
                        {{ t('followers') }}</NuxtLink
                    >
                </li>
                <li>
                    <NuxtLink
                        :to="`/profile/${userName}/connections`"
                        class="block text-subtitle4 text-gray-800 rounded border py-2 px-1.5 border-gray-600 hover:text-white hover:bg-gray-600 active:bg-gray-800 group"
                    >
                        <strong class="text-gray-950 group-hover:text-white">{{
                            user.connections_count
                        }}</strong>
                        {{ t('connections') }}
                    </NuxtLink>
                </li>
            </ul>

            <div key="divider-1" class="w-full h-px bg-gray-600 mt-1" />

            <div key="user-type-buttons" class="flex flex-col gap-3">
                <ProfileButton
                    v-for="dashboard in dashboardNavigation"
                    :key="dashboard.href"
                    class="rounded-sm"
                    variant="secound"
                    :is-active="dashboard.isActive"
                    :label="dashboard.label"
                    @click="navigateToRoute(dashboard.href)"
                >
                    <template #icon>
                        <svg class="w-5 h-5">
                            <use :xlink:href="`/sprite.svg#${dashboard.icon}`"></use>
                        </svg>
                    </template>
                </ProfileButton>

                <div key="divider-2" class="w-full h-px bg-gray-600" />

                <ProfileButton
                    v-for="settingItem in settingsNavigation"
                    :key="settingItem.href || settingItem.action"
                    class="rounded-sm"
                    variant="secound"
                    :is-active="settingItem.isActive"
                    :label="settingItem.label"
                    @click="handleNavigationAction(settingItem)"
                >
                    <template #icon>
                        <svg class="w-5 h-5">
                            <use :xlink:href="`/sprite.svg#${settingItem.icon}`"></use>
                        </svg>
                    </template>
                </ProfileButton>

                <div key="divider-3" class="w-full h-px bg-gray-600" />

                <Button
                    key="logout-button"
                    variant="filled"
                    color="gray"
                    size="lg"
                    @click="handleLogout"
                >
                    {{ t('logout') }}
                </Button>
            </div>
        </TransitionGroup>
    </div>
</template>

<script setup lang="ts">
    import { useLocalePath } from '#imports'
    import { storeToRefs } from 'pinia'

    interface DashboardNavItem {
        icon: string
        label: string
        href: string
        isActive: boolean
    }

    interface SettingsNavItem {
        icon: string
        label: string
        href?: string
        action?: string
        isActive?: boolean
    }

    const emit = defineEmits<{
        close: []
    }>()

    const { t } = useI18n()
    const localePath = useLocalePath()
    const router = useRouter()
    const route = useRoute()
    const userStore = useUserStore()
    const { openUpgradeModal } = useUpgradeModal()

    const { user, userDisplayName, plan, userName, isBuyer, isSupplier, isHybridUser } =
        storeToRefs(userStore)

    const navigateToRoute = async (href: string): Promise<void> => {
        emit('close')
        await router.push(localePath(href))
    }

    /**
     * Handle upgrade button click - opens global upgrade modal
     */
    const handleUpgradeClick = (): void => {
        emit('close')
        openUpgradeModal(undefined, 'upgrade')
    }

    const handleNavigationAction = async (item: SettingsNavItem): Promise<void> => {
        if (item.href) {
            await navigateToRoute(item.href)
        } else if (item.action) {
            emit('close')
            await executeAction(item.action)
        }
    }

    const executeAction = async (action: string): Promise<void> => {
        switch (action) {
            case 'openGuide':
                window.open('/guide', '_blank')
                break
            default:
                console.warn(`Unknown action: ${action}`)
        }
    }

    const handleLogout = async (): Promise<void> => {
        emit('close')
        await userStore.logout()
    }

    // ✅ FIX: isEcommerce = true for all paths EXCEPT buyer/supplier layouts
    const isEcommerce = computed(() => {
        return !route.path.startsWith('/buyer') && !route.path.startsWith('/supplier')
    })

    const dashboardNavigation = computed<DashboardNavItem[]>(() => {
        const route = useRoute()
        const items: DashboardNavItem[] = []

        if (userName.value) {
            items.push({
                icon: 'profile',
                label: t('company.profile'),
                href: `/profile/${userName.value}`,
                isActive: route.path.includes(`/profile/${userName.value}`),
            })
        }

        if (isSupplier.value) {
            items.push({
                icon: 'box-plus',
                label: `${t('suppliers', { n: 0 })} ${t('dashboard').toLowerCase()}`,
                href: '/supplier/dashboard',
                isActive: route.path.includes('/supplier'),
            })
        }

        items.push({
            icon: 'plan',
            label: `${t('buyers', { n: 0 })} ${t('dashboard').toLowerCase()}`,
            href: '/buyer/dashboard',
            isActive: route.path.includes('/buyer'),
        })

        items.push({
            icon: 'shopping-cart',
            label: t('navigation.marketplace'),
            href: '/marketplace',
            isActive: isEcommerce.value,
        })

        return items
    })

    const settingsNavigation = computed<SettingsNavItem[]>(() => [
        {
            icon: 'settings',
            label: t('navigation.settings'),
            href: '/settings',
            isActive: route.path.includes('/settings'),
        },
        {
            icon: 'help-circle',
            label: t('navigation.support'),
            href: '/support',
            isActive: false,
        },
        {
            icon: 'book-saved',
            label: t('navigation.guide'),
            action: 'openGuide',
            isActive: false,
        },
    ])
</script>

<style scoped>
    .list-enter-active,
    .list-leave-active {
        transition: all 0.5s ease;
    }

    .list-enter-from,
    .list-leave-to {
        opacity: 0;
        transform: translateX(30px);
    }
</style>
