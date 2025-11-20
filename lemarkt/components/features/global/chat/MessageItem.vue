<template>
    <div
        :data-message-id="message.id"
        :class="['flex mb-4 message-item group', isOwn ? 'justify-end' : 'justify-start']"
    >
        <div :class="['flex', isOwn ? 'flex-row-reverse' : 'flex-row']">
            <img
                v-if="!isOwn && message.sender.avatar"
                :src="message.sender.avatar"
                :alt="message.sender.name"
                class="h-9 w-9 rounded-full object-cover flex-shrink-0"
                @error="handleAvatarError"
            />

            <div
                :class="['mx-2', isOwn ? 'items-end' : 'items-start', 'flex flex-col']"
                @mouseenter="handleMouseEnter"
                @mouseleave="handleMouseLeave"
            >
                <div
                    ref="messageContentRef"
                    :class="[
                        'relative p-3 rounded-md text-body text-gray-950 space-y-2 max-w-[500px]',
                        isOwn ? 'bg-blue-50  !rounded-br' : 'bg-gray-200 !rounded-bl',
                        message.is_deleted ? 'italic opacity-60' : '',
                    ]"
                >
                    <div v-if="message.reply_to" class="space-y-2 pb-2 border-b border-gray-600">
                        <p class="text-subtitle3 opacity-80 mb-1">
                            {{ $t('chat.replyingTo', { name: message.reply_to.sender.name }) }}
                        </p>
                        <p class="text-subtitle3 opacity-90 line-clamp-2">
                            {{ message.reply_to.content }}
                        </p>
                    </div>

                    <div v-if="message.is_deleted">
                        <p class="text-body">{{ $t('chat.messageDeleted') }}</p>
                    </div>
                    <div v-else class="space-y-2">
                        <p class="text-body break-words whitespace-pre-wrap">{{
                            message.content
                        }}</p>

                        <div v-if="message.attachments?.length > 0" class="space-y-2">
                            <div
                                v-for="attachment in message.attachments"
                                :key="attachment.id"
                                class="flex items-center space-x-2 p-1 bg-white bg-opacity-10 rounded"
                            >
                                <span>{{ getFileIcon(attachment.mime_type) }}</span>
                                <div class="flex-1">
                                    <a
                                        :href="attachment.stream_url"
                                        target="_blank"
                                        :class="[
                                            'text-body font-medium hover:underline',
                                            isOwn ? 'text-blue-500' : 'text-blue-400',
                                        ]"
                                    >
                                        {{ attachment.original_name }}
                                    </a>
                                    <div class="text-caption1 text-gray-950">
                                        {{ formatFileSize(attachment.file_size) }}
                                    </div>
                                </div>
                                <a :href="attachment.download_url" download>
                                    <Button
                                        variant="filled"
                                        size="sm"
                                        color="blue"
                                        :label="$t('chat.download')"
                                    />
                                </a>
                            </div>

                            <div v-if="hasImages" class="grid grid-cols-2 gap-2 mt-2">
                                <img
                                    v-for="attachment in imageAttachments"
                                    :key="attachment.id"
                                    :src="attachment.stream_url"
                                    :alt="attachment.original_name"
                                    class="w-full h-32 object-cover rounded-sm cursor-pointer hover:opacity-90"
                                    @click="openImage(attachment.stream_url)"
                                />
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center gap-2" :class="[isOwn ? 'flex-row-reverse' : '']">
                        <span class="text-body text-gray-800">
                            {{ formatMessageTime(message.created_at) }}
                        </span>

                        <div
                            v-if="message.likes?.length > 0"
                            class="flex items-center text-body text-gray-950"
                        >
                            <svg class="w-4 h-4 text-red-500 mr-2">
                                <use xlink:href="/sprite.svg#heart-full"></use>
                            </svg>
                            {{ message.likes.length }}
                        </div>

                        <div v-if="message.is_edited" class="text-body text-gray-800">
                            {{ $t('chat.edited') }}
                        </div>
                        <div v-if="message.pinned">
                            <svg class="w-4 h-4 text-blue-500">
                                <use xlink:href="/sprite.svg#pin"></use>
                            </svg>
                        </div>
                    </div>
                </div>

                <ClientOnly>
                    <Teleport to="body">
                        <Transition name="fade">
                            <div
                                v-if="showActionsMenu && !message.is_deleted"
                                ref="menuRef"
                                :style="menuPosition"
                            >
                                <MessageActions
                                    :message="message"
                                    :is-own="isOwn"
                                    @action="handleAction"
                                    @mouse-enter="handleMenuMouseEnter"
                                    @mouse-leave="handleMenuMouseLeave"
                                />
                            </div>
                        </Transition>
                    </Teleport>
                </ClientOnly>

                <div class="flex items-center mt-1 space-x-2">
                    <div v-if="message.sending" class="text-body text-gray-950">
                        {{ $t('chat.sending') }}...
                    </div>

                    <div v-if="message.error" class="text-body text-red-500">
                        {{ $t('chat.sendFailed') }}
                        <button class="underline ml-1" @click="retrySend">
                            {{ $t('chat.retry') }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onUnmounted } from 'vue'
    import { useElementBounding } from '@vueuse/core'
    import type { ChatMessage } from '~/types/chat'

    const props = defineProps<{
        message: ChatMessage
        isOwn: boolean
    }>()

    const emit = defineEmits<{
        action: [action: string, message: ChatMessage]
        reply: [message: ChatMessage]
    }>()

    const messageContentRef = ref<HTMLElement | null>(null)
    const menuRef = ref<HTMLElement | null>(null)
    const showActionsMenu = ref(false)
    const isMouseOverMenu = ref(false)

    const { top, left, right, bottom } = useElementBounding(messageContentRef)

    const menuPosition = computed(() => {
        if (!showActionsMenu.value) return {}

        const viewportHeight = window.innerHeight
        const viewportWidth = window.innerWidth
        const menuWidth = 160
        const menuHeight = 300

        let x = 0
        let y = top.value

        if (props.isOwn) {
            x = left.value - menuWidth - 8
            if (x < 16) {
                x = 16
            }
        } else {
            x = right.value + 8
            if (x + menuWidth > viewportWidth - 16) {
                x = viewportWidth - menuWidth - 16
            }
        }

        if (y + menuHeight > viewportHeight - 20) {
            y = viewportHeight - menuHeight - 20
        }

        if (y < 20) {
            y = 20
        }

        return {
            position: 'fixed',
            top: `${y}px`,
            left: `${x}px`,
            zIndex: 50,
        }
    })

    let hoverTimeout: NodeJS.Timeout | null = null
    let leaveTimeout: NodeJS.Timeout | null = null

    const imageAttachments = computed(() => {
        return props.message.attachments?.filter((a) => a.file_type === 'image') || []
    })

    const hasImages = computed(() => imageAttachments.value.length > 0)

    const handleMouseEnter = () => {
        if (leaveTimeout) {
            clearTimeout(leaveTimeout)
            leaveTimeout = null
        }

        if (hoverTimeout) clearTimeout(hoverTimeout)
        hoverTimeout = setTimeout(() => {
            showActionsMenu.value = true
        }, 100)
    }

    const handleMouseLeave = () => {
        if (hoverTimeout) {
            clearTimeout(hoverTimeout)
            hoverTimeout = null
        }

        if (leaveTimeout) clearTimeout(leaveTimeout)
        leaveTimeout = setTimeout(() => {
            if (!isMouseOverMenu.value) {
                showActionsMenu.value = false
            }
        }, 300)
    }

    const handleMenuMouseEnter = () => {
        isMouseOverMenu.value = true
        if (leaveTimeout) {
            clearTimeout(leaveTimeout)
            leaveTimeout = null
        }
    }

    const handleMenuMouseLeave = () => {
        isMouseOverMenu.value = false
        handleMouseLeave()
    }

    const handleAction = (action: string, message: ChatMessage) => {
        showActionsMenu.value = false
        emit('action', action, message)
    }

    const formatMessageTime = (date: string) => {
        const { formatDate } = useDate()
        return formatDate(date, 'HH:mm')
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
    }

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return '🖼️'
        if (mimeType.startsWith('video/')) return '🎥'
        if (mimeType.startsWith('audio/')) return '🎵'
        if (mimeType.includes('pdf')) return '📄'
        if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
        if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦'
        return '📎'
    }

    const openImage = (url: string) => {
        window.open(url, '_blank')
    }

    const handleAvatarError = (event: Event) => {
        const img = event.target as HTMLImageElement
        img.src = '/images/default-avatar.png'
    }

    const retrySend = () => {
        emit('action', 'retry', props.message)
    }

    onUnmounted(() => {
        if (hoverTimeout) clearTimeout(hoverTimeout)
        if (leaveTimeout) clearTimeout(leaveTimeout)
    })
</script>

<style scoped>
    .fade-enter-active,
    .fade-leave-active {
        transition: opacity 0.2s ease;
    }

    .fade-enter-from,
    .fade-leave-to {
        opacity: 0;
    }

    .fade-enter-to,
    .fade-leave-from {
        opacity: 1;
    }
</style>
