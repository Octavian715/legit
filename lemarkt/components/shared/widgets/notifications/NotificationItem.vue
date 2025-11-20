<template>
    <div
        class="notification-item p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
        :class="{ 'bg-blue-50': !notification.is_read }"
        @click="handleClick"
    >
        <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                    <span
                        class="text-caption1 uppercase font-semibold"
                        :class="getTypeColor(notification.type)"
                    >
                        {{ t(`notifications.types.${notification.type}`) }}
                    </span>
                    <span v-if="!notification.is_read" class="w-2 h-2 bg-blue-500 rounded-full" />
                </div>

                <h4 class="text-subtitle3 font-semibold text-gray-950 mb-1">
                    {{ notification.title }}
                </h4>

                <p class="text-body text-gray-700 mb-2">
                    {{ notification.body }}
                </p>

                <div
                    v-if="notification.action_buttons && notification.action_buttons.length"
                    class="flex gap-2 mb-2"
                >
                    <Button
                        v-for="(button, index) in notification.action_buttons"
                        :key="index"
                        :label="button.text"
                        size="sm"
                        :variant="button.style === 'primary' ? 'filled' : 'outlined'"
                        :color="button.style === 'primary' ? 'blue' : 'gray'"
                        @click.stop="navigateTo(button.url)"
                    />
                </div>

                <span class="text-caption2 text-gray-500">
                    {{ formatDate(notification.created_at, 'PPp') }}
                </span>
            </div>

            <button
                v-if="!notification.is_read"
                class="flex-shrink-0 text-blue-500 hover:text-blue-600 text-caption1 font-semibold"
                @click.stop="$emit('mark-read', notification.id)"
            >
                {{ t('markAsRead') }}
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
    import type { Notification } from '~/types/notifications'

    const props = defineProps<{
        notification: Notification
    }>()

    const emit = defineEmits<{
        action: [payload: { action: 'confirm' | 'decline' | 'update'; id: string | number }]
        'mark-read': [id: string | number]
        click: [notification: Notification]
    }>()

    const { t } = useI18n()
    const { formatDate } = useDate()

    const getTypeColor = (type: string): string => {
        const colors: Record<string, string> = {
            follow: 'text-blue-600',
            connection_request: 'text-purple-600',
            connection_accepted: 'text-green-600',
            message: 'text-green-600',
            order_request: 'text-orange-600',
            discount_offer: 'text-red-600',
            stock_notification: 'text-yellow-600',
            system: 'text-gray-600',
        }
        return colors[type] || 'text-gray-600'
    }

    const handleClick = () => {
        emit('click', props.notification)
    }
</script>
