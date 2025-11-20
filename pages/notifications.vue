<template>
    <div class="notifications-page">
        <Breadcrumbs :items="breadcrumbs" />

        <PageHeader
            :title="t('navigation.notifications')"
            :subtitle="totalItems > 0 ? t('countResults', { count: totalItems }) : ''"
            :loading="isLoading"
        >
            <template #right>
                <div class="flex items-center gap-3">
                    <Checkbox
                        v-model="showUnreadOnly"
                        :label="t('unRead')"
                        name="unread-filter"
                        size="md"
                        :disabled="!isInitialized"
                    />
                    <Button
                        v-if="hasUnread && isInitialized"
                        variant="filled"
                        color="blue"
                        size="md"
                        :loading="isMarkingAllRead"
                        @click="handleMarkAllRead"
                    >
                        <svg class="w-4 h-4 flex-1 mr-1">
                            <use xlink:href="/sprite.svg#check" />
                        </svg>
                        <div class="flex items-center">{{ t('readAll') }}</div>
                    </Button>
                </div>
            </template>
        </PageHeader>

        <div
            v-if="!isInitialized"
            class="notifications-list bg-white rounded-lg shadow-sm overflow-hidden"
        >
            <div class="p-3 space-y-3">
                <div
                    v-for="n in 5"
                    :key="n"
                    class="p-3 transition-all duration-200 border rounded-md border-l-4 border-l-gray-300 border-gray-200 animate-pulse"
                >
                    <div class="flex items-start gap-3">
                        <div class="flex-shrink-0 flex items-center justify-center">
                            <div class="w-9 h-9 bg-gray-200 rounded-full"></div>
                        </div>

                        <div class="flex-1 space-y-2">
                            <div class="h-5 bg-gray-200 rounded w-2/3"></div>

                            <div class="space-y-1.5">
                                <div class="h-4 bg-gray-200 rounded w-full"></div>
                                <div class="h-4 bg-gray-200 rounded w-4/5"></div>
                            </div>

                            <div class="h-3 bg-gray-200 rounded w-40"></div>

                            <div class="flex gap-2 pt-1">
                                <div class="h-8 bg-gray-200 rounded w-24"></div>
                                <div class="h-8 bg-gray-200 rounded w-24"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <NoDataPage
            v-else-if="notifications.length === 0"
            image="/images/content/no-notifications.svg"
            image-height="300px"
            image-width="300px"
            :title="t('notificationSection.empty')"
            :description="t('notificationSection.description')"
            :button-label="showUnreadOnly ? t('allNotification') : undefined"
            @action="handleShowAllNotifications"
        />

        <NotificationsList
            v-else
            :notifications="paginatedNotifications"
            :meta="paginationMeta"
            :loading="isLoading"
            @action="handleAction"
            @mark-read="handleMarkAsRead"
            @navigate="handleNavigate"
            @page-change="handlePageChange"
            @items-per-page-change="handleItemsPerPageChange"
        />
    </div>
</template>

<script setup lang="ts">
    import { useLocalePath } from '#imports'
    import type { Notification } from '~/types/notifications'
    import { useNotificationsStore } from '~/stores/notifications'

    const localePath = useLocalePath()
    const { t } = useI18n()
    const router = useRouter()
    const route = useRoute()
    const runtimeConfig = useRuntimeConfig()
    const store = useNotificationsStore()

    definePageMeta({
        layout: 'default',
        scrollToTop: true,
    })

    const currentPage = ref(Number(route.query.page) || 1)
    const itemsPerPage = ref(Number(route.query.per_page) || 10)
    const showUnreadOnly = ref(route.query.unread_only === 'true')
    const isMarkingAllRead = ref(false)

    const notifications = computed(() => store.notifications)
    const unreadCount = computed(() => store.unreadCount)
    const hasUnread = computed(() => store.hasUnread)
    const isLoading = computed(() => store.isLoading)
    const isInitialized = computed(() => store.isInitialized)
    const meta = computed(() => store.meta)

    const totalItems = computed(() => notifications.value.length)
    const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

    const paginatedNotifications = computed(() => {
        const start = (currentPage.value - 1) * itemsPerPage.value
        const end = start + itemsPerPage.value
        return notifications.value.slice(start, end)
    })

    const paginationMeta = computed(() => ({
        current_page: currentPage.value,
        per_page: itemsPerPage.value,
        total: totalItems.value,
        last_page: totalPages.value,
        from: totalItems.value > 0 ? (currentPage.value - 1) * itemsPerPage.value + 1 : 0,
        to: Math.min(currentPage.value * itemsPerPage.value, totalItems.value),
    }))

    const breadcrumbs = computed(() => [
        { label: t('home'), to: localePath('/marketplace') },
        { label: t('navigation.notifications') },
    ])

    const pageTitle = computed(() => {
        const baseTitle = t('navigation.notifications')
        if (unreadCount.value > 0) {
            return `(${unreadCount.value}) ${baseTitle}`
        }
        return baseTitle
    })

    const pageDescription = computed(() => {
        const count = totalItems.value
        if (count === 0) {
            return t('notificationSection.description')
        }
        return t('countResults', { count })
    })

    const canonicalUrl = computed(() => {
        const baseUrl = runtimeConfig.public.siteUrl
        const path = localePath('/notifications')
        return `${baseUrl}${path}`
    })

    useHead({
        title: pageTitle,
        titleTemplate: (titleChunk) => {
            return titleChunk ? `${titleChunk} | LeMarkt` : 'LeMarkt - Empowering food trade'
        },
    })

    useSeoMeta({
        title: pageTitle,
        description: pageDescription,
        ogTitle: pageTitle,
        ogDescription: pageDescription,
        ogUrl: canonicalUrl,
        ogType: 'website',
        ogImage: `${runtimeConfig.public.siteUrl}/images/og-default.jpg`,
        twitterCard: 'summary',
        twitterTitle: pageTitle,
        twitterDescription: pageDescription,
        twitterImage: `${runtimeConfig.public.siteUrl}/images/og-default.jpg`,
        robots: 'noindex, nofollow',
    })

    useServerSeoMeta({
        robots: 'noindex, nofollow',
    })

    const updateUrl = () => {
        const query: Record<string, string> = {}

        if (currentPage.value > 1) {
            query.page = String(currentPage.value)
        }

        if (itemsPerPage.value !== 10) {
            query.per_page = String(itemsPerPage.value)
        }

        if (showUnreadOnly.value) {
            query.unread_only = true
        }

        router.replace({ query })
    }

    const loadNotifications = async () => {
        await store.fetchNotifications(1, { unreadOnly: showUnreadOnly.value })
    }

    const handleMarkAllRead = async () => {
        if (isMarkingAllRead.value) return

        isMarkingAllRead.value = true
        try {
            await store.markAllAsRead()
        } catch (error) {
            console.error('[NotificationsPage] Error marking all as read:', error)
        } finally {
            isMarkingAllRead.value = false
        }
    }

    const handleShowAllNotifications = async () => {
        showUnreadOnly.value = false
        currentPage.value = 1
        updateUrl()
        await loadNotifications()
    }

    const handleMarkAsRead = async (id: string | number) => {
        try {
            await store.markAsRead(Number(id))
        } catch (error) {
            console.error('[NotificationsPage] Error marking notification as read:', error)
        }
    }

    const handleNavigate = async (url: string) => {
        try {
            await router.push(localePath(url))
        } catch (error) {
            console.error('[NotificationsPage] Navigation error:', error)
        }
    }

    const handleAction = async (payload: { action: string; id: string | number }) => {
        const notification = notifications.value.find((n) => n.id === payload.id)
        if (!notification) return

        if (!notification.is_read) {
            await handleMarkAsRead(payload.id)
        }

        switch (payload.action) {
            case 'confirm':
                if (
                    notification.type === 'connection-request' ||
                    notification.type === 'connection_request'
                ) {
                    // Handle connection request confirmation
                    console.log('Confirm connection request:', notification.id)
                } else if (notification.type === 'order-request') {
                    // Handle order request confirmation
                    console.log('Confirm order request:', notification.id)
                }
                break
            case 'decline':
                if (
                    notification.type === 'connection-request' ||
                    notification.type === 'connection_request'
                ) {
                    // Handle connection request decline
                    console.log('Decline connection request:', notification.id)
                } else if (notification.type === 'order-request') {
                    // Handle order request decline
                    console.log('Decline order request:', notification.id)
                }
                break
            case 'add-stock':
                // Handle add stock action
                break
            default:
                break
        }
    }

    const handlePageChange = (page: number) => {
        currentPage.value = page
        updateUrl()

        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const handleItemsPerPageChange = (perPage: number) => {
        itemsPerPage.value = perPage
        currentPage.value = 1
        updateUrl()
    }

    watch(showUnreadOnly, async () => {
        currentPage.value = 1
        updateUrl()
        await loadNotifications()
    })

    watch(
        () => route.query,
        async (newQuery) => {
            const newPage = Number(newQuery.page) || 1
            const newPerPage = Number(newQuery.per_page) || 10
            const newUnreadOnly = newQuery.unread_only === 'true'

            let needsReload = false

            if (currentPage.value !== newPage) {
                currentPage.value = newPage
            }
            if (itemsPerPage.value !== newPerPage) {
                itemsPerPage.value = newPerPage
            }
            if (showUnreadOnly.value !== newUnreadOnly) {
                showUnreadOnly.value = newUnreadOnly
                needsReload = true
            }

            if (needsReload) {
                await loadNotifications()
            }
        }
    )

    onMounted(async () => {
        await store.initialize()
    })
</script>

<style scoped>
    .notifications-page {
        @apply pb-20 px-4 md:px-0;
    }
</style>
