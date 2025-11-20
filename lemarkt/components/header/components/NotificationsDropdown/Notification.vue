<template>
    <div
        class="p-3 transition-all duration-200 border rounded-md cursor-pointer"
        :class="[borderClass, hoverClass, { 'bg-blue-50': !notification?.is_read }]"
        @click="handleContainerClick"
    >
        <div class="flex items-start gap-3">
            <div class="flex-shrink-0 flex items-center justify-center">
                <svg class="w-9 h-9" :class="iconColorClass">
                    <use :xlink:href="`/sprite.svg#${iconName}`"></use>
                </svg>
            </div>

            <div class="flex-1 space-y-1">
                <div class="flex items-start justify-between gap-3">
                    <h3 class="text-subtitle1 font-medium" :class="titleColorClass">
                        {{ notification?.title }}
                    </h3>
                </div>

                <div v-if="notificationBody" class="space-y-1">
                    <div class="text-body text-gray-950">
                        <component :is="notificationBody" />
                    </div>

                    <span class="text-caption1 text-gray-800 flex-shrink-0 block">
                        {{ formatFullTime(notification?.created_at || notification?.createAt) }}
                    </span>

                    <div class="flex gap-2 pt-1">
                        <!-- <Button
                            v-if="hasLegacyActions && showConfirm"
                            variant="filled"
                            color="red"
                            size="sm"
                            @click.stop="handleActionClick('confirm')"
                        >
                            {{ $t('confirm') }}
                        </Button>
                        <Button
                            v-if="hasLegacyActions && showDecline"
                            variant="outline"
                            color="gray"
                            size="sm"
                            @click.stop="handleActionClick('decline')"
                        >
                            {{ $t('decline') }}
                        </Button>
                        <Button
                            v-if="hasLegacyActions && notification?.type === 'stock-notification'"
                            variant="filled"
                            color="green"
                            size="sm"
                            @click.stop="handleActionClick('add-stock')"
                        >
                            <svg class="h-5 w-5">
                                <use xlink:href="/sprite.svg#plus"></use>
                            </svg>
                            {{ $t('add') }} {{ $t('stock', 0) }}
                        </Button> -->

                        <Button
                            v-for="(button, index) in filteredActionButtons"
                            :key="index"
                            size="sm"
                            :variant="getButtonVariant(button.style)"
                            :color="getButtonColor(button.style)"
                            :loading="isProcessing && activeButtonIndex === index"
                            :disabled="isProcessing"
                            @click.stop="handleActionButtonClick(button, index)"
                        >
                            {{ button.text }}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import type { Notification } from '~/types/notifications'
    import { useLocalePath } from '#imports'
    import { useConnections } from '~/composables/useConnections'
    import Link from '~/components/ui/Link.vue'
    import { h, ref } from 'vue'

    const localePath = useLocalePath()
    const { formatDate } = useDate()
    const router = useRouter()

    const { t } = useI18n()
    const { handleNotificationAcceptConnection, handleNotificationRejectConnection } =
        useConnections()

    const isProcessing = ref(false)
    const activeButtonIndex = ref<number | null>(null)

    // Global set to track actioned notifications across refreshes
    const actionedNotificationIds = useState<Set<string | number>>(
        'actioned-notifications',
        () => new Set()
    )

    const actionCompleted = computed(() => {
        return props.notification?.id
            ? actionedNotificationIds.value.has(props.notification.id)
            : false
    })

    const props = defineProps<{
        notification?: Notification
    }>()

    const emit = defineEmits<{
        (e: 'mark-read', id: string | number): void
        (e: 'navigate', url: string): void
        (
            e: 'action',
            payload: { action: 'confirm' | 'decline' | 'add-stock'; id: string | number }
        ): void
        (e: 'action-complete'): void
    }>()

    /**
     * Notification type configuration based on backend types and design
     * Colors: Green (success/positive), Red (error/warning), Blue (info)
     */
    const notificationTypeConfig = {
        // Follow notifications - GREEN (positive action)
        user_follow: {
            icon: '2users',
            iconColor: 'text-green-600',
            titleColor: 'text-green-600',
            borderColor: 'border-l-4 border-l-green-600 border-gray-200',
            hoverBorder: 'hover:border-green-400',
            hoverBg: 'hover:bg-green-50',
        },
        user_unfollow: {
            icon: '2users',
            iconColor: 'text-red-600',
            titleColor: 'text-red-600',
            borderColor: 'border-l-4 border-l-red-600 border-gray-200',
            hoverBorder: 'hover:border-red-400',
            hoverBg: 'hover:bg-red-50',
        },

        // Connection notifications
        connection_request_received: {
            icon: 'like',
            iconColor: 'text-green-600',
            titleColor: 'text-green-600',
            borderColor: 'border-l-4 border-l-green-600 border-gray-200',
            hoverBorder: 'hover:border-green-400',
            hoverBg: 'hover:bg-green-50',
        },
        connection_request_accepted: {
            icon: 'like',
            iconColor: 'text-green-600',
            titleColor: 'text-green-600',
            borderColor: 'border-l-4 border-l-green-600 border-gray-200',
            hoverBorder: 'hover:border-green-400',
            hoverBg: 'hover:bg-green-50',
        },
        connection_request_rejected: {
            icon: 'alert',
            iconColor: 'text-red-600',
            titleColor: 'text-red-600',
            borderColor: 'border-l-4 border-l-red-600 border-gray-200',
            hoverBorder: 'hover:border-red-400',
            hoverBg: 'hover:bg-red-50',
        },
        connection_removed: {
            icon: 'alert',
            iconColor: 'text-red-600',
            titleColor: 'text-red-600',
            borderColor: 'border-l-4 border-l-red-600 border-gray-200',
            hoverBorder: 'hover:border-red-400',
            hoverBg: 'hover:bg-red-50',
        },

        // Order notifications
        order_received: {
            icon: 'check',
            iconColor: 'text-green-600',
            titleColor: 'text-green-600',
            borderColor: 'border-l-4 border-l-green-600 border-gray-200',
            hoverBorder: 'hover:border-green-400',
            hoverBg: 'hover:bg-green-50',
        },
        order_updated: {
            icon: 'info',
            iconColor: 'text-red-600',
            titleColor: 'text-red-600',
            borderColor: 'border-l-4 border-l-red-600 border-gray-200',
            hoverBorder: 'hover:border-red-400',
            hoverBg: 'hover:bg-red-50',
        },

        // Cart notifications - INFO (blue)
        cart_changed: {
            icon: 'shopping-cart',
            iconColor: 'text-blue-600',
            titleColor: 'text-blue-600',
            borderColor: 'border-l-4 border-l-blue-600 border-gray-200',
            hoverBorder: 'hover:border-blue-400',
            hoverBg: 'hover:bg-blue-50',
        },

        // Legacy support (will be deprecated)
        'connection-request': {
            icon: 'like',
            iconColor: 'text-green-600',
            titleColor: 'text-green-600',
            borderColor: 'border-l-4 border-l-green-600 border-gray-200',
            hoverBorder: 'hover:border-green-400',
            hoverBg: 'hover:bg-green-50',
        },
        connection_request: {
            icon: 'like',
            iconColor: 'text-green-600',
            titleColor: 'text-green-600',
            borderColor: 'border-l-4 border-l-green-600 border-gray-200',
            hoverBorder: 'hover:border-green-400',
            hoverBg: 'hover:bg-green-50',
        },
        'order-request': {
            icon: 'inventory',
            iconColor: 'text-green-600',
            titleColor: 'text-green-600',
            borderColor: 'border-l-4 border-l-green-600 border-gray-200',
            hoverBorder: 'hover:border-green-400',
            hoverBg: 'hover:bg-green-50',
        },
        'order-request-declined': {
            icon: 'alert',
            iconColor: 'text-red-600',
            titleColor: 'text-red-600',
            borderColor: 'border-l-4 border-l-red-600 border-gray-200',
            hoverBorder: 'hover:border-red-400',
            hoverBg: 'hover:bg-red-50',
        },
        'order-request-accepted': {
            icon: 'check',
            iconColor: 'text-green-600',
            titleColor: 'text-green-600',
            borderColor: 'border-l-4 border-l-green-600 border-gray-200',
            hoverBorder: 'hover:border-green-400',
            hoverBg: 'hover:bg-green-50',
        },
        'discount-offer': {
            icon: 'check',
            iconColor: 'text-green-600',
            titleColor: 'text-green-600',
            borderColor: 'border-l-4 border-l-green-600 border-gray-200',
            hoverBorder: 'hover:border-green-400',
            hoverBg: 'hover:bg-green-50',
        },
        'stock-notification': {
            icon: 'alert',
            iconColor: 'text-red-600',
            titleColor: 'text-red-600',
            borderColor: 'border-l-4 border-l-red-600 border-gray-200',
            hoverBorder: 'hover:border-red-400',
            hoverBg: 'hover:bg-red-50',
        },
        connection_accepted: {
            icon: 'like',
            iconColor: 'text-green-600',
            titleColor: 'text-green-600',
            borderColor: 'border-l-4 border-l-green-600 border-gray-200',
            hoverBorder: 'hover:border-green-400',
            hoverBg: 'hover:bg-green-50',
        },
        message: {
            icon: 'feedback',
            iconColor: 'text-green-600',
            titleColor: 'text-green-600',
            borderColor: 'border-l-4 border-l-green-600 border-gray-200',
            hoverBorder: 'hover:border-green-400',
            hoverBg: 'hover:bg-green-50',
        },
        system: {
            icon: 'info',
            iconColor: 'text-blue-600',
            titleColor: 'text-blue-600',
            borderColor: 'border-l-4 border-l-blue-600 border-gray-200',
            hoverBorder: 'hover:border-blue-400',
            hoverBg: 'hover:bg-blue-50',
        },
        follow: {
            icon: '2users',
            iconColor: 'text-green-600',
            titleColor: 'text-green-600',
            borderColor: 'border-l-4 border-l-green-600 border-gray-200',
            hoverBorder: 'hover:border-green-400',
            hoverBg: 'hover:bg-green-50',
        },
    }

    const iconName = computed(() => {
        const type = props.notification?.type
        return notificationTypeConfig[type as keyof typeof notificationTypeConfig]?.icon || 'bell'
    })

    const iconColorClass = computed(() => {
        const type = props.notification?.type
        return (
            notificationTypeConfig[type as keyof typeof notificationTypeConfig]?.iconColor ||
            'text-gray-600'
        )
    })

    const titleColorClass = computed(() => {
        const type = props.notification?.type
        return (
            notificationTypeConfig[type as keyof typeof notificationTypeConfig]?.titleColor ||
            'text-gray-600'
        )
    })

    const borderClass = computed(() => {
        const type = props.notification?.type
        const config = notificationTypeConfig[type as keyof typeof notificationTypeConfig]

        if (!config) {
            return 'border-l-4 border-l-gray-600 border-gray-200 hover:border-gray-400'
        }

        return `${config.borderColor} ${config.hoverBorder}`
    })

    const hoverClass = computed(() => {
        const type = props.notification?.type
        return (
            notificationTypeConfig[type as keyof typeof notificationTypeConfig]?.hoverBg ||
            'hover:bg-gray-50'
        )
    })

    const notificationBody = computed(() => {
        if (!props.notification) return null

        const { type, body, companyName, companySlug, companyId, orderId, productName, productId } =
            props.notification

        if (type === 'connection-request' || type === 'connection_request') {
            return () =>
                h('p', [
                    h(
                        Link,
                        {
                            to: localePath(`/profile/${companySlug || companyId}`),
                            class: 'font-semibold text-blue-600 hover:text-blue-700',
                            size: 'custom',
                        },
                        () => companyName
                    ),
                    ' ',
                    t('notifications.connectionRequestSuffix'),
                ])
        }

        if (type === 'order-request') {
            return () =>
                h('p', [
                    h(
                        Link,
                        {
                            to: localePath(`/profile/${companySlug || companyId}`),
                            class: 'font-semibold text-blue-600 hover:text-blue-700',
                            size: 'custom',
                        },
                        () => companyName
                    ),
                    ' ',
                    t('notifications.orderRequestSuffix', { orderId: orderId || '' }),
                ])
        }

        if (type === 'order-request-declined') {
            return () =>
                h('p', [
                    h(
                        Link,
                        {
                            to: localePath(`/profile/${companySlug || companyId}`),
                            class: 'font-semibold text-blue-600 hover:text-blue-700',
                            size: 'custom',
                        },
                        () => companyName
                    ),
                    ' ',
                    t('notifications.orderRequestDeclinedSuffix', { orderId: orderId || '' }),
                ])
        }

        if (type === 'order-request-accepted') {
            return () =>
                h('p', [
                    h(
                        Link,
                        {
                            to: localePath(`/profile/${companySlug || companyId}`),
                            class: 'font-semibold text-blue-600 hover:text-blue-700',
                            size: 'custom',
                        },
                        () => companyName
                    ),
                    ' ',
                    t('notifications.orderRequestAcceptedSuffix', { orderId: orderId || '' }),
                ])
        }

        if (type === 'discount-offer') {
            return () =>
                h('p', [
                    t('notifications.discountOfferPrefix'),
                    ' ',
                    h(
                        Link,
                        {
                            to: localePath(`/marketplace/product/${productId}`),
                            class: 'font-semibold text-blue-600 hover:text-blue-700',
                            size: 'custom',
                        },
                        () => productName
                    ),
                    ' ',
                    t('notifications.discountOfferSuffix'),
                ])
        }

        if (type === 'stock-notification') {
            return () =>
                h('p', [
                    t('notifications.stockNotificationPrefix'),
                    ' ',
                    h(
                        Link,
                        {
                            to: localePath(`marketplace/product/${productId}`),
                            class: 'font-semibold text-blue-600 hover:text-blue-700',
                            size: 'custom',
                        },
                        () => productName
                    ),
                    ' ',
                    t('notifications.stockNotificationSuffix'),
                ])
        }

        if (body) {
            return () => h('p', body)
        }

        return null
    })

    const handleContainerClick = () => {
        if (!props.notification?.is_read && props.notification?.id) {
            emit('mark-read', props.notification.id)
        }
    }

    const handleButtonClick = async (url: string) => {
        if (!props.notification?.is_read && props.notification?.id) {
            emit('mark-read', props.notification.id)
        }
        await router.push(localePath(url))
    }

    const getButtonVariant = (style: string): 'filled' | 'outline' => {
        return ['blue', 'secundary', 'green', 'red'].includes(style) ? 'filled' : 'outline'
    }
    const filteredActionButtons = computed(() => {
        const notification = props.notification

        if (
            !notification ||
            !notification.action_buttons ||
            !Array.isArray(notification.action_buttons)
        ) {
            return []
        }

        // If action was completed locally, hide accept/reject buttons immediately
        if (actionCompleted.value) {
            return notification.action_buttons.filter(
                (button) => button.type !== 'accept' && button.type !== 'reject'
            )
        }

        // Dacă show_action_buttons este false, exclude butoanele de tip accept și reject
        if (notification.data?.show_action_buttons === false) {
            return notification.action_buttons.filter(
                (button) => button.type !== 'accept' && button.type !== 'reject'
            )
        }

        return notification.action_buttons
    })
    const getButtonColor = (style: string): string => {
        switch (style) {
            case 'green':
            case 'red':
                return 'red'
            case 'secondary':
            case 'blue':
                return 'blue'
            default:
                return 'gray'
        }
    }

    const handleActionButtonClick = async (button: any, index: number) => {
        // Handle URL navigation
        if (button.url) {
            handleButtonClick(button.url)
            return
        }

        // Handle connection actions
        if (button.type === 'accept' || button.type === 'reject') {
            // Extract connection_id from notification
            // Store normalizes all notifications to have connection_id in data object
            const notification = props.notification
            const connectionId =
                notification?.data?.connection_id ||
                notification?.data?.connectionId ||
                notification?.metadata?.connection_id ||
                notification?.metadata?.connectionId ||
                notification?.connection_id ||
                notification?.connectionId

            if (!connectionId) {
                console.error(
                    '[Notification] Cannot process connection action: missing connection_id',
                    notification
                )

                // Show error toast to user
                const { error: showError } = useToastNotification()
                showError(
                    t('notifications.errors.missingConnectionId', 'Connection information missing')
                )
                return
            }

            isProcessing.value = true
            activeButtonIndex.value = index

            try {
                let success = false

                if (button.type === 'accept') {
                    success = await handleNotificationAcceptConnection(
                        connectionId,
                        props.notification.user_id || props.notification.data?.user_id,
                        props.notification.user_name || props.notification.data?.user_name
                    )
                } else if (button.type === 'reject') {
                    success = await handleNotificationRejectConnection(
                        connectionId,
                        props.notification.user_id || props.notification.data?.user_id,
                        props.notification.user_name || props.notification.data?.user_name
                    )
                }

                if (success) {
                    // Mark notification as actioned globally (persists across refreshes)
                    if (props.notification?.id) {
                        actionedNotificationIds.value.add(props.notification.id)
                    }

                    emit('action-complete')

                    if (!props.notification?.is_read && props.notification?.id) {
                        emit('mark-read', props.notification.id)
                    }
                }
            } catch (error) {
                console.error('❌ Error in action:', error)
            } finally {
                isProcessing.value = false
                activeButtonIndex.value = null
            }
            return
        }

        // Default: just navigate if URL exists
        if (button.url) {
            handleButtonClick(button.url)
        }
    }

    const formatFullTime = (dateString?: string) => {
        if (!dateString) return '--,--,--, --:--'
        return formatDate(dateString, 'MMM, dd, yyyy, HH:mm')
    }
</script>
