<template>
    <div
        class="bg-white rounded-lg shadow-lg min-w-[150px] z-10"
        @mouseenter="$emit('mouse-enter')"
        @mouseleave="$emit('mouse-leave')"
    >
        <button
            v-for="action in availableActions"
            :key="action.id"
            :class="[
                'w-full p-3 text-left text-body hover:bg-gray-100 flex items-center space-x-2 transition-colors hover:first:rounded-t-lg hover:last:rounded-b-lg border-b last:border-0 border-gray-200',
                action.color === 'danger' ? 'text-red-500' : 'text-gray-950',
            ]"
            @click="handleAction(action.id, message)"
        >
            <svg
                class="w-4 h-4 flex-shrink-0"
                :class="[action.active ? 'text-red-500' : '']"
                viewBox="0 0 24 24"
            >
                <use :xlink:href="`/sprite.svg#${action.icon}`"></use>
            </svg>
            <span>{{ action.label }}</span>
        </button>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue'
    import type { ChatMessage } from '~/types/chat'

    const props = defineProps<{
        message: ChatMessage
        isOwn: boolean
    }>()

    const emit = defineEmits<{
        action: [action: string, message: any]
        'mouse-enter': []
        'mouse-leave': []
    }>()

    const { t } = useI18n()

    const availableActions = computed(() => {
        const actions = []

        if (props.message.liked_by_current_user) {
            actions.push({
                id: 'unlike',
                icon: 'heart-full',
                active: true,
                label: t('chat.removeLike', 'Remove like'),
            })
        } else {
            actions.push({
                id: 'like',
                icon: 'heart',
                label: t('chat.addLike', 'Add like'),
            })
        }

        if (props.isOwn) {
            actions.push({
                id: 'edit',
                icon: 'edit2',
                label: t('chat.edit', 'Edit'),
            })
        }

        actions.push({
            id: 'reply',
            icon: 'replay',
            label: t('chat.reply', 'Reply'),
        })

        if (props.message.pinned) {
            actions.push({
                id: 'unpin',
                icon: 'pin',
                label: t('chat.unpin', 'Unpin'),
            })
        } else {
            actions.push({
                id: 'pin',
                icon: 'pin',
                label: t('chat.pin', 'Pin'),
            })
        }

        if (props.message.content) {
            actions.push({
                id: 'copy',
                icon: 'copy',
                label: t('chat.copyText', 'Copy Text'),
            })
        }

        // actions.push({
        //     id: 'select',
        //     icon: 'star',
        //     label: t('chat.inSelected', 'In Selected'),
        // })

        if (props.isOwn) {
            actions.push({
                id: 'delete',
                icon: 'delete',
                label: t('chat.delete', 'Delete'),
                color: 'danger',
            })
        }

        return actions
    })

    const handleAction = (action: string, message: ChatMessage) => {
        emit('action', action, message)
    }
</script>
