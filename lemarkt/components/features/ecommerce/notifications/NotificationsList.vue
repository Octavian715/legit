<template>
    <div class="notifications-list bg-white rounded-b-sm overflow-hidden">
        <div v-if="notifications.length > 0" class="p-3 space-y-3">
            <Notification
                v-for="notification in notifications"
                :key="notification.id"
                :notification="notification"
                @action="$emit('action', $event)"
                @mark-read="$emit('mark-read', $event)"
                @navigate="$emit('navigate', $event)"
                @action-complete="$emit('action-complete')"
            />
        </div>

        <div class="border-t border-gray-200 bg-transparent">
            <Pagination
                :current-page="meta.current_page"
                :total-pages="meta.last_page"
                :items-per-page="meta.per_page"
                :total-items="meta.total"
                :max-visible-pages="5"
                @update:current-page="$emit('page-change', $event)"
                @update:items-per-page="$emit('items-per-page-change', $event)"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
    import type { Notification } from '~/types/notifications'

    interface NotificationMeta {
        current_page: number
        per_page: number
        total: number
        last_page: number
        from: number
        to: number
    }

    defineProps<{
        notifications: Notification[]
        meta: NotificationMeta
        loading?: boolean
    }>()

    defineEmits<{
        action: [payload: { action: string; id: string | number }]
        'mark-read': [id: string | number]
        navigate: [url: string]
        'page-change': [page: number]
        'items-per-page-change': [perPage: number]
        'action-complete': []
    }>()
</script>
