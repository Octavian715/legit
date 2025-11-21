<template>
    <div class="bg-white rounded-sm max-w-96 w-full shadow-lg">
        <!-- Header -->
        <div class="flex items-center justify-between py-2 px-3 border-b border-gray-600">
            <div>
                <h3 class="text-subtitle2 font-semibold text-gray-950">
                    {{ t('navigation.notifications') }}
                </h3>
                <p class="text-gray-700 text-subtitle3">
                    {{ unreadCount || 0 }} {{ t('newNotification') }}
                </p>
            </div>
            <Button
                v-if="unreadCount > 0"
                :label="t('chat.actions.markAsRead')"
                size="sm"
                variant="ghost"
                color="blue"
                class="!p-1"
                @click.stop="handleMarkAllRead"
            />
        </div>

        <!-- ✅ FIXED: Added @scroll.stop and @mousewheel.stop -->
        <div class="max-h-64 overflow-y-auto p-3" @scroll.stop @mousewheel.stop>
            <TransitionGroup name="list" tag="div" class="space-y-2">
                <Notification
                    v-for="notification in notifications"
                    :key="notification.id"
                    :notification="notification"
                    @action="handleAction"
                    @mark-read="handleMarkRead"
                    @click="handleNotificationClick(notification)"
                    @action-complete="handleActionComplete"
                />
            </TransitionGroup>

            <!-- Empty State -->
            <div
                v-if="notifications.length === 0"
                class="max-w-96 max-h-64 flex justify-center items-center p-8"
            >
                <div class="text-center space-y-2">
                    <svg class="w-12 h-12 mx-auto text-gray-600">
                        <use xlink:href="/sprite.svg#bell"></use>
                    </svg>
                    <p class="text-subtitle1 text-gray-950 font-bold">
                        {{ t('notificationSection.empty') }}
                    </p>
                    <p class="text-subtitle2 text-gray-700 text-wrap">
                        {{ t('notificationSection.description') }}
                    </p>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div v-if="notifications.length > 0" class="p-3 border-t border-gray-200">
            <NuxtLink :to="localePath('/notifications')" @click="handleViewAll">
                <Button color="red" :label="t('allNotification')" class="mx-auto" />
            </NuxtLink>
        </div>
    </div>
</template>

<script setup lang="ts">
    import type { Notification } from '~/types/notifications'
    import { useLocalePath } from '#imports'
    import { useNotificationsStore } from '~/stores/notifications'

    const props = defineProps<{
        notifications: Notification[]
        unreadCount: number
    }>()

    const emit = defineEmits<{
        (e: 'mark-all-read'): void
        (e: 'mark-read', id: string | number): void
        (e: 'close'): void
        (e: 'notification-click', notification: Notification): void
        (e: 'refresh'): void
        (e: 'retry'): void
    }>()

    const { t } = useI18n()
    const localePath = useLocalePath()
    const notificationsStore = useNotificationsStore()

    const handleMarkAllRead = (): void => {
        emit('mark-all-read')
    }

    const handleMarkRead = async (id: string | number): Promise<void> => {
        try {
            // Mark notification as read in the store
            await notificationsStore.markAsRead(Number(id))
            emit('mark-read', id)
            // Trigger refresh to update the notification list
            emit('refresh')
        } catch (error) {
            console.error('[NotificationsDropdown] Error marking notification as read:', error)
            // Still trigger refresh on error to update UI
            emit('refresh')
        }
    }

    const handleNotificationClick = (notification: Notification): void => {
        emit('notification-click', notification)
    }

    const handleAction = (action: string): void => {
        if (action === 'refresh') {
            emit('refresh')
        } else if (action === 'retry') {
            emit('retry')
        }
    }

    const handleActionComplete = (): void => {
        // Refresh notifications list after accept/reject action
        emit('refresh')
    }

    const handleViewAll = (): void => {
        emit('close')
    }
</script>

<style scoped>
    /* List transition animations */
    .list-enter-active,
    .list-leave-active {
        transition: all 0.3s ease;
    }

    .list-enter-from {
        opacity: 0;
        transform: translateX(-20px);
    }

    .list-leave-to {
        opacity: 0;
        transform: translateX(20px);
    }

    .list-move {
        transition: transform 0.3s ease;
    }
</style>
