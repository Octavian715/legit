<template>
    <div
        ref="dropZoneRef"
        class="relative m-3 p-3 bg-gray-200 rounded-md border transition-colors"
        :class="[isOverDropZone ? 'border-blue-500 bg-blue-50' : 'border-gray-600']"
    >
        <!-- Drag overlay -->
        <Transition name="fade">
            <div
                v-if="isOverDropZone"
                class="absolute inset-0 flex items-center justify-center bg-blue-500/10 rounded-md z-10 pointer-events-none"
            >
                <div class="text-center">
                    <svg
                        class="mx-auto h-12 w-12 text-blue-500 mb-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                    </svg>
                    <p class="text-subtitle1 text-blue-600 font-semibold">
                        {{ $t('chat.dropFilesHere') }}
                    </p>
                </div>
            </div>
        </Transition>

        <!-- Reply/Edit banner -->
        <div
            v-if="replyingTo || editingMessage"
            class="mb-3 p-3 bg-gray-50 rounded-lg flex items-center justify-between"
        >
            <div class="flex-1 min-w-0">
                <p class="text-body text-gray-800">
                    {{
                        editingMessage
                            ? $t('chat.editing')
                            : $t('chat.replyingTo', { name: replyingTo?.sender.name })
                    }}
                </p>
                <p class="text-body text-gray-950 truncate">
                    {{ editingMessage?.content || replyingTo?.content }}
                </p>
            </div>

            <ButtonClose
                icon-size="sm"
                size="sm"
                @click="editingMessage ? $emit('cancel-edit') : $emit('cancel-reply')"
            />
        </div>

        <!-- Attachments preview -->
        <div v-if="files.length > 0" class="mb-2">
            <div class="flex flex-wrap gap-2">
                <div v-for="(file, index) in files" :key="index" class="relative group">
                    <!-- Image preview -->
                    <div
                        v-if="isImageFile(file)"
                        class="relative w-20 h-20 rounded bg-gray-100 cursor-move"
                        :class="{
                            'opacity-50': draggedIndex === index,
                            'scale-105 shadow-lg':
                                dragOverIndex === index && draggedIndex !== index,
                        }"
                        draggable="true"
                        @dragstart="handleDragStart($event, index)"
                        @dragend="handleDragEnd"
                        @dragover.prevent="handleDragOverItem($event, index)"
                        @dragleave="handleDragLeaveItem"
                        @drop.stop.prevent="handleReorderDrop($event, index)"
                    >
                        <img
                            :src="getFileUrl(file)"
                            :alt="file.name"
                            class="w-full h-full object-cover rounded-lg pointer-events-none"
                            @dragstart.prevent
                        />
                        <!-- Remove Button -->
                        <button
                            class="absolute -top-1 -left-1 p-2 w-5 h-5 rounded bg-white text-gray-700 hover:bg-red-500 hover:text-white active:scale-95 shadow flex items-center justify-center transition-all duration-200"
                            :aria-label="$t('remove')"
                            @click.stop="removeFile(index)"
                        >
                            &times;
                        </button>
                    </div>

                    <!-- Non-image file -->
                    <div
                        v-else
                        class="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-2 border border-gray-300 transition-colors"
                    >
                        <svg
                            class="h-5 w-5 text-gray-600 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        <div class="flex flex-col min-w-0">
                            <span class="text-body text-gray-900 truncate max-w-[120px]">
                                {{ file.name }}
                            </span>
                            <span class="text-caption2 text-gray-600">
                                {{ formatBytes(file.size) }}
                            </span>
                        </div>
                        <ButtonClose icon-size="sm" size="sm" @click="removeFile(index)" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Input controls -->
        <div class="flex items-end space-x-2">
            <!-- Attachment button -->
            <Button
                variant="ghost"
                color="blue"
                size="lg"
                container-classes="!p-2"
                square
                :disabled="sendingMessage || files.length >= maxFiles"
                :title="
                    files.length >= maxFiles ? $t('chat.maxFilesReached') : $t('chat.attachFile')
                "
                @click="open"
            >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                </svg>
            </Button>

            <!-- Textarea -->
            <div class="flex-1">
                <textarea
                    ref="textareaRef"
                    v-model="messageInput"
                    :placeholder="$t('chat.typeMessage')"
                    :rows="messageRows"
                    class="w-full resize-none py-2 placeholder:text-gray-800 hover:text-gray-950 focus:outline-none bg-transparent"
                    :disabled="sendingMessage"
                    @keydown="handleKeyPress"
                    @input="handleTyping"
                    @paste="handlePaste"
                />
            </div>

            <!-- Send button -->
            <Button
                variant="ghost"
                color="blue"
                size="lg"
                class="!p-2"
                square
                :loading="sendingMessage"
                :disabled="sendingMessage"
                @click="handleSend"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                >
                    <path
                        d="M7.50733 2.23013L16.0673 6.51013C19.9073 8.43013 19.9073 11.5701 16.0673 13.4901L7.50733 17.7701C1.74733 20.6501 -0.602666 18.2901 2.27733 12.5401L3.14733 10.8101C3.36733 10.3701 3.36733 9.64013 3.14733 9.20013L2.27733 7.46013C-0.602666 1.71013 1.75733 -0.649866 7.50733 2.23013Z"
                        stroke="currentColor"
                        stroke-width="1.6"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            </Button>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { useDropZone, useFileDialog, useObjectUrl } from '@vueuse/core'
    import { storeToRefs } from 'pinia'
    import { useChatStore } from '~/stores/chat'
    import type { ChatMessage } from '~/types/chat'
    import { useSocketManager } from '~/composables/socket/useSocketManager'

    const props = defineProps<{
        replyingTo?: ChatMessage | null
        editingMessage?: ChatMessage | null
    }>()

    const emit = defineEmits<{
        'cancel-reply': []
        'cancel-edit': []
        send: []
    }>()

    const { t } = useI18n()
    const chatStore = useChatStore()
    const { activeChat, sendingMessage } = storeToRefs(chatStore)
    const { emitTyping } = useSocketManager()
    const toast = useToastNotification()

    const textareaRef = ref<HTMLTextAreaElement | null>(null)
    const dropZoneRef = ref<HTMLDivElement | null>(null)

    const messageInput = ref('')
    const files = ref<File[]>([])
    // Store object URLs for file previews
    const fileUrls = ref<Map<File, string>>(new Map())

    const maxFiles = 10
    const maxFileSize = 10 * 1024 * 1024

    // Drag to reorder state
    const isDragging = ref(false)
    const draggedIndex = ref(-1)
    const dragOverIndex = ref(-1)
    const draggedFile = ref<File | null>(null)

    // ✅ FIX: Prevent recursive drop zone triggers
    const isProcessingDrop = ref(false)

    const { open, onChange } = useFileDialog({
        accept: 'image/*,application/pdf,.doc,.docx,.xls,.xlsx',
        multiple: true,
    })

    onChange((selectedFiles) => {
        if (selectedFiles && !isProcessingDrop.value) {
            isProcessingDrop.value = true
            addFiles(Array.from(selectedFiles))
            // Reset flag after a short delay
            setTimeout(() => {
                isProcessingDrop.value = false
            }, 100)
        }
    })

    const { isOverDropZone } = useDropZone(dropZoneRef, {
        onDrop(files) {
            if (files && !isProcessingDrop.value) {
                isProcessingDrop.value = true
                addFiles(Array.from(files))
                // Reset flag after a short delay
                setTimeout(() => {
                    isProcessingDrop.value = false
                }, 100)
            }
        },
    })

    const messageRows = computed(() => {
        const lineBreaks = (messageInput.value.match(/\n/g) || []).length
        return Math.min(Math.max(lineBreaks + 1, 1), 5)
    })

    const canSend = computed(() => {
        return (
            (messageInput.value.trim().length > 0 || files.value.length > 0) &&
            !sendingMessage.value
        )
    })

    const isImageFile = (file: File): boolean => {
        return file.type.startsWith('image/')
    }

    // ✅ FIX: Get proper file extension from MIME type
    const getExtensionFromMimeType = (mimeType: string): string => {
        const mimeToExtension: Record<string, string> = {
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
            'image/svg+xml': 'svg',
            'image/bmp': 'bmp',
            'application/pdf': 'pdf',
            'application/msword': 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
            'application/vnd.ms-excel': 'xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
        }

        return mimeToExtension[mimeType] || mimeType.split('/')[1] || 'file'
    }

    // ✅ FIX: Validate file extension matches MIME type
    const validateFileExtension = (file: File): boolean => {
        const expectedExtension = getExtensionFromMimeType(file.type)
        const fileName = file.name.toLowerCase()
        const actualExtension = fileName.split('.').pop()

        // If extensions don't match, rename the file
        if (actualExtension !== expectedExtension) {
            return false
        }

        return true
    }

    // ✅ FIX: Ensure file has correct extension
    const ensureCorrectExtension = (file: File): File => {
        const expectedExtension = getExtensionFromMimeType(file.type)
        const fileName = file.name.toLowerCase()
        const actualExtension = fileName.split('.').pop()

        // If extension doesn't match MIME type, create new file with correct extension
        if (actualExtension !== expectedExtension) {
            const nameWithoutExtension = file.name.substring(0, file.name.lastIndexOf('.'))
            const newFileName = `${nameWithoutExtension}.${expectedExtension}`
            return new File([file], newFileName, { type: file.type })
        }

        return file
    }

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
    }

    const getFileUrl = (file: File): string => {
        return fileUrls.value.get(file) || ''
    }

    const validateFile = (file: File): string | null => {
        if (file.size > maxFileSize) {
            return t('chat.errors.fileTooLarge', {
                name: file.name,
                maxSize: formatBytes(maxFileSize),
            })
        }

        const exists = files.value.some((f) => f.name === file.name && f.size === file.size)
        if (exists) {
            return t('chat.errors.duplicateFile', { name: file.name })
        }

        return null
    }

    const addFiles = (newFiles: File[]) => {
        const errors: string[] = []
        const validFiles: File[] = []

        for (const file of newFiles) {
            if (files.value.length + validFiles.length >= maxFiles) {
                errors.push(t('chat.errors.tooManyFiles', { max: maxFiles }))
                break
            }

            const error = validateFile(file)
            if (error) {
                errors.push(error)
            } else {
                // ✅ FIX: Ensure file has correct extension before adding
                const correctedFile = ensureCorrectExtension(file)
                validFiles.push(correctedFile)
            }
        }

        if (errors.length > 0) {
            toast.warning(errors[0])
        }

        if (validFiles.length > 0) {
            // Create object URLs for image files and store them
            validFiles.forEach((file) => {
                if (isImageFile(file)) {
                    const url = URL.createObjectURL(file)
                    fileUrls.value.set(file, url)
                }
            })

            files.value.push(...validFiles)
            toast.success(t('chat.filesAdded', { count: validFiles.length }))
        }
    }

    const removeFile = (index: number) => {
        const file = files.value[index]
        // Revoke object URL to prevent memory leaks
        const url = fileUrls.value.get(file)
        if (url) {
            URL.revokeObjectURL(url)
            fileUrls.value.delete(file)
        }
        files.value.splice(index, 1)
    }

    const clearFiles = () => {
        // Revoke all object URLs to prevent memory leaks
        fileUrls.value.forEach((url) => {
            URL.revokeObjectURL(url)
        })
        fileUrls.value.clear()
        files.value = []
    }

    const handleDragStart = (event: DragEvent, index: number) => {
        isDragging.value = true
        draggedIndex.value = index
        draggedFile.value = files.value[index]

        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move'
            const dragImage = new Image()
            dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs='
            event.dataTransfer.setDragImage(dragImage, 0, 0)
        }
    }

    const handleDragEnd = () => {
        isDragging.value = false
        draggedIndex.value = -1
        dragOverIndex.value = -1
        draggedFile.value = null
    }

    const handleDragOverItem = (event: DragEvent, index: number) => {
        if (draggedIndex.value !== -1 && draggedIndex.value !== index) {
            event.preventDefault()
            dragOverIndex.value = index
        }
    }

    const handleDragLeaveItem = () => {
        dragOverIndex.value = -1
    }

    const handleReorderDrop = (event: DragEvent, dropIndex: number) => {
        event.preventDefault()

        if (draggedIndex.value !== -1 && draggedIndex.value !== dropIndex && draggedFile.value) {
            const newFiles = [...files.value]
            newFiles.splice(draggedIndex.value, 1)
            const insertIndex = draggedIndex.value < dropIndex ? dropIndex - 1 : dropIndex
            newFiles.splice(insertIndex, 0, draggedFile.value)
            files.value = newFiles
        }

        handleDragEnd()
    }

    const handlePaste = async (event: ClipboardEvent) => {
        const items = event.clipboardData?.items
        if (!items) return

        const imageFiles: File[] = []

        for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile()
                if (file) {
                    const timestamp = Date.now()
                    // ✅ FIX: Use proper extension mapper
                    const extension = getExtensionFromMimeType(item.type)
                    const renamedFile = new File([file], `pasted-image-${timestamp}.${extension}`, {
                        type: item.type,
                    })
                    imageFiles.push(renamedFile)
                }
            }
        }

        if (imageFiles.length > 0) {
            event.preventDefault()
            addFiles(imageFiles)
        }
    }

    const handleKeyPress = (event: KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            handleSend()
        }
    }

    const handleSend = async () => {
        if (!canSend.value) return

        try {
            const payload = {
                content: messageInput.value.trim(),
                chat_id: activeChat.value?.id,
                reply_to_id: props.replyingTo?.id,
                files: files.value.length > 0 ? files.value : undefined,
            }

            if (props.editingMessage) {
                await chatStore.editMessage(props.editingMessage.id, messageInput.value)
                emit('cancel-edit')
            } else {
                await chatStore.sendMessage(payload)
                emit('cancel-reply')
            }

            messageInput.value = ''
            clearFiles()

            await nextTick()
            textareaRef.value?.focus()
        } catch (error: any) {
            toast.error(error.message || 'Failed to send message')
        }
    }

    let typingTimeout: NodeJS.Timeout | null = null
    const handleTyping = () => {
        if (!activeChat.value || !process.client) return

        emitTyping(activeChat.value.id, true)

        if (typingTimeout) {
            clearTimeout(typingTimeout)
        }

        typingTimeout = setTimeout(() => {
            if (activeChat.value) {
                emitTyping(activeChat.value.id, false)
            }
            typingTimeout = null
        }, 3000)
    }

    watch(
        () => props.editingMessage,
        (newVal) => {
            if (newVal) {
                messageInput.value = newVal.content || ''
            }
        }
    )

    // Cleanup object URLs on component unmount
    onUnmounted(() => {
        fileUrls.value.forEach((url) => {
            URL.revokeObjectURL(url)
        })
        fileUrls.value.clear()
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
</style>
