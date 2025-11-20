<template>
    <div class="space-y-3 w-full h-full relative">
        <!-- Upload Zone -->
        <div class="relative">
            <div
                class="group border-2 border-dashed border-gray-400 hover:border-gray-800 rounded-md px-auto py-auto bg-gray-50 hover:bg-gray-600 cursor-pointer transition-colors duration-300 flex flex-col items-center justify-center text-center active:scale-95"
                :class="{
                    'pointer-events-none opacity-50': isLimitReached || buttonLoading,
                }"
                :aria-label="ariaLabel"
                @dragover.prevent="handleDragOver"
                @drop.prevent="handleDrop"
                @click="triggerFileInput"
            >
                <input
                    ref="fileInput"
                    type="file"
                    class="hidden"
                    :accept="accept"
                    :multiple="multiple && !isLimitReached"
                    :disabled="isLimitReached"
                    @change="handleFileUpload"
                />

                <div
                    class="flex p-6 flex-col items-center gap-4 max-w-md"
                    :class="{ 'md:py-20 pb-20': showButton }"
                >
                    <svg class="w-16 h-16 text-gray-800">
                        <use xlink:href="/sprite.svg#upload"></use>
                    </svg>

                    <span
                        class="text-subtitle2 font-bold text-gray-950 group-hover:text-blue-400 group-active:text-blue-700 transition-colors duration-150"
                    >
                        {{ isLimitReached ? limitReachedTitle : title }}
                    </span>
                    <p class="text-gray-800 text-body">
                        {{ isLimitReached ? limitReachedDescription : description }}
                    </p>
                </div>
            </div>
            <slot>
                <Button
                    v-if="showButton"
                    :label="buttonTitle"
                    color="blue"
                    variant="filled"
                    icon="download"
                    size="md"
                    :loading="buttonLoading"
                    class="absolute bottom-8 left-1/2 -translate-x-1/2 mx-auto"
                    @click="emit('click')"
                />
            </slot>
        </div>

        <!-- Error Message -->
        <div v-if="error || limitError" class="flex items-center gap-1 text-caption1 mx-1">
            <svg
                class="w-3 h-3 mt-0.5 flex-shrink-0"
                :class="error || limitError ? 'text-red-500' : 'text-gray-600'"
            >
                <use xlink:href="/sprite.svg#warn-error"></use>
            </svg>
            <span
                :class="error || limitError ? 'text-red-500' : 'text-gray-600'"
                class="break-words"
            >
                {{ limitError || error }}
            </span>
        </div>

        <!-- File Counter -->
        <div v-if="maxFiles && localFiles.length > 0" class="text-caption1 text-gray-600">
            {{ $t('filesUploaded', { current: localFiles.length, max: maxFiles }) }}
        </div>

        <!-- Preview Thumbnails with Drag & Drop -->
        <div v-if="localFiles.length" class="flex gap-3 flex-wrap">
            <div
                v-for="(file, index) in localFiles"
                :key="`${file.name}-${index}`"
                class="relative w-[120px] h-[120px] border rounded group transition-all duration-200"
                :class="{
                    'opacity-50': draggedIndex === index,
                    'scale-105 shadow-lg': dragOverIndex === index && draggedIndex !== index,
                    'cursor-move': !isDragging,
                    'cursor-grabbing': isDragging && draggedIndex === index,
                }"
                draggable="true"
                @dragstart="handleDragStart($event, index)"
                @dragend="handleDragEnd"
                @dragover.prevent="handleDragOverItem($event, index)"
                @dragleave="handleDragLeave"
                @drop.stop.prevent="handleReorderDrop($event, index)"
            >
                <!-- Drag Handle Icon -->
                <div
                    v-if="localFiles.length > 1"
                    class="absolute -top-2 -right-2 z-20 bg-white rounded p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                    <svg class="w-3 h-3 text-gray-600">
                        <use xlink:href="/sprite.svg#a_move"></use>
                    </svg>
                </div>

                <!-- Preview: image or icon -->
                <template v-if="isImageFile(file.name)">
                    <img
                        v-if="getPreviewUrl(file)"
                        :src="getPreviewUrl(file)"
                        :alt="file.name"
                        class="w-full h-full object-cover aspect-square rounded"
                        @error="handleImageError($event, file)"
                    />
                    <div
                        v-else
                        class="w-full h-full flex flex-col items-center justify-center bg-gray-100 rounded"
                    >
                        <svg class="w-10 h-10 text-gray-600">
                            <use xlink:href="/sprite.svg#image"></use>
                        </svg>
                        <span
                            class="text-caption2 mt-2 px-2 text-center text-gray-700 truncate w-full"
                        >
                            {{ getFileName(file.name) }}
                        </span>
                    </div>
                </template>
                <template v-else>
                    <div
                        class="w-full h-full flex flex-col items-center justify-center bg-gray-100 rounded"
                    >
                        <svg class="w-10 h-10 text-gray-600">
                            <use :xlink:href="getFileIcon(file.name)"></use>
                        </svg>
                        <span
                            class="text-caption1 mt-2 px-2 font-bold text-center text-gray-700 truncate w-full"
                        >
                            {{ getFileName(file.name) }}
                        </span>
                        <span class="text-caption2">{{ bytesToReadableSize(file.size) }}</span>
                    </div>
                </template>

                <!-- Primary Image Tag - Always first image -->
                <span
                    v-if="index === 0 && multiple && selectPrimary"
                    class="absolute flex gap-1 items-center top-1 right-1 max-h-5 bg-blue-500 text-white px-2 py-1 text-caption1 rounded shadow h-fit"
                >
                    <svg class="w-2.5 h-2.5">
                        <use xlink:href="/sprite.svg#pin"></use>
                    </svg>
                    <p class="text-[10px]">{{ $t('primaryImageLabel', 'Main') }}</p>
                </span>

                <!-- Remove Button -->
                <button
                    class="absolute -top-1 -left-1 p-2 w-5 h-5 rounded bg-white text-gray-700 hover:bg-red-500 hover:text-white active:scale-95 shadow flex items-center justify-center transition-all duration-200"
                    :aria-label="$t('removeImageLabel')"
                    @click.stop="removeFile(index)"
                >
                    &times;
                </button>

                <!-- Reorder Indicator -->
                <div
                    v-if="dragOverIndex === index && draggedIndex !== index && draggedIndex !== -1"
                    class="absolute inset-0 border-2 border-blue-500 rounded pointer-events-none"
                >
                    <div
                        class="absolute top-1/2 right-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-2 py-1 rounded text-xs"
                    >
                        {{ $t('dropHere', 'Drop here') }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Reorder Hint -->
        <div v-if="localFiles.length > 1" class="text-caption2 text-gray-600 italic">
            {{ $t('dragToReorder', 'Drag images to reorder. First image will be the main photo.') }}
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, onBeforeUnmount } from 'vue'
    import type { UploadImage, UploadImageProps } from '~/types/ui/uploader'

    const props = withDefaults(defineProps<UploadImageProps>(), {
        modelValue: () => [],
        title: 'Drag and drop file here or Choose file',
        description: '1MB max. JPEG, PNG or PDF format only.',
        accept: '.jpg,.jpeg,.png,.pdf',
        multiple: false,
        selectPrimary: false,
        error: '',
        ariaLabel: 'Upload file',
        showButton: false,
        maxFiles: undefined,
    })

    const emit = defineEmits<{
        (e: 'update:modelValue', value: UploadImage[]): void
        (e: 'reorder', value: { from: number; to: number }): void
        (e: 'click'): void
        (e: 'limit-reached', value: number): void
    }>()

    const { t } = useI18n()

    const fileInput = ref<HTMLInputElement | null>(null)
    const localFiles = ref<UploadImage[]>([...props.modelValue])
    const previewUrls = ref<Map<string, string>>(new Map())
    const limitError = ref<string>('')
    const config = useRuntimeConfig()

    const isDragging = ref(false)
    const draggedIndex = ref(-1)
    const dragOverIndex = ref(-1)
    const draggedFile = ref<UploadImage | null>(null)

    const isLimitReached = computed(() => {
        return props.maxFiles !== undefined && localFiles.value.length >= props.maxFiles
    })

    const limitReachedTitle = computed(() => {
        return t('uploadLimitReachedTitle', 'Upload limit reached')
    })

    const limitReachedDescription = computed(() => {
        return t('uploadLimitReachedDesc', {
            max: props.maxFiles,
            defaultValue: `Maximum ${props.maxFiles} files allowed`,
        })
    })

    watch(
        () => props.modelValue,
        (val) => {
            localFiles.value = Array.isArray(val) ? [...val] : []
            if (!isLimitReached.value) {
                limitError.value = ''
            }
        },
        { immediate: true }
    )

    watch(isLimitReached, (reached) => {
        if (reached) {
            emit('limit-reached', props.maxFiles!)
        }
    })

    const triggerFileInput = () => {
        if (isLimitReached.value) {
            limitError.value = t('uploadLimitError', {
                max: props.maxFiles,
                defaultValue: `You can only upload up to ${props.maxFiles} files`,
            })
            return
        }
        fileInput.value?.click()
    }

    const handleFileUpload = (e: Event) => {
        const files = (e.target as HTMLInputElement).files
        if (files) addFiles(Array.from(files))
        ;(e.target as HTMLInputElement).value = ''
    }

    const handleDragOver = (e: DragEvent) => {
        if (isLimitReached.value) {
            e.dataTransfer!.dropEffect = 'none'
            return
        }
        e.dataTransfer!.dropEffect = 'copy'
    }

    const handleDrop = (e: DragEvent) => {
        if (isLimitReached.value) {
            limitError.value = t('uploadLimitError', {
                max: props.maxFiles,
                defaultValue: `You can only upload up to ${props.maxFiles} files`,
            })
            return
        }

        if (!isDragging.value && e.dataTransfer?.files) {
            const files = e.dataTransfer.files
            if (files) addFiles(Array.from(files))
        }
    }

    const addFiles = (files: File[]) => {
        limitError.value = ''

        if (props.maxFiles !== undefined) {
            const availableSlots = props.maxFiles - localFiles.value.length

            if (availableSlots <= 0) {
                limitError.value = t('uploadLimitError', {
                    max: props.maxFiles,
                    defaultValue: `You can only upload up to ${props.maxFiles} files`,
                })
                return
            }

            if (files.length > availableSlots) {
                limitError.value = t('uploadLimitPartialError', {
                    available: availableSlots,
                    attempted: files.length,
                    defaultValue: `Only ${availableSlots} more file(s) can be added. You tried to add ${files.length}.`,
                })
                files = files.slice(0, availableSlots)
            }
        }

        files.forEach((file) => {
            const uploadImage: UploadImage = {
                file,
                name: file.name,
                type: file.type,
                size: file.size,
                previewUrl: '',
            }

            if (isImageFile(file.name)) {
                const previewUrl = URL.createObjectURL(file)
                uploadImage.previewUrl = previewUrl
                const uniqueKey = `${file.name}-${Date.now()}`
                previewUrls.value.set(uniqueKey, previewUrl)
            }

            localFiles.value.push(uploadImage)
        })

        emit('update:modelValue', localFiles.value)
    }

    const handleDragStart = (e: DragEvent, index: number) => {
        isDragging.value = true
        draggedIndex.value = index
        draggedFile.value = localFiles.value[index]

        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move'
            const dragImage = new Image()
            dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs='
            e.dataTransfer.setDragImage(dragImage, 0, 0)
        }
    }

    const handleDragEnd = () => {
        isDragging.value = false
        draggedIndex.value = -1
        dragOverIndex.value = -1
        draggedFile.value = null
    }

    const handleDragOverItem = (e: DragEvent, index: number) => {
        if (draggedIndex.value !== -1 && draggedIndex.value !== index) {
            e.preventDefault()
            dragOverIndex.value = index
        }
    }

    const handleDragLeave = () => {
        dragOverIndex.value = -1
    }

    const handleReorderDrop = (e: DragEvent, dropIndex: number) => {
        e.preventDefault()

        if (draggedIndex.value !== -1 && draggedIndex.value !== dropIndex && draggedFile.value) {
            const newFiles = [...localFiles.value]
            newFiles.splice(draggedIndex.value, 1)
            const insertIndex = draggedIndex.value < dropIndex ? dropIndex - 1 : dropIndex
            newFiles.splice(insertIndex, 0, draggedFile.value)
            localFiles.value = newFiles

            emit('reorder', { from: draggedIndex.value, to: dropIndex })
            emit('update:modelValue', localFiles.value)
        }

        handleDragEnd()
    }

    const getPreviewUrl = (file: UploadImage): string => {
        if (file.previewUrl && file.previewUrl.startsWith('blob:')) {
            return file.previewUrl
        }

        if (file.id && file.file && typeof file.file === 'string') {
            return `${config.public.apiBase}/storage/${file.file}`
        }

        if (file.previewUrl) {
            return file.previewUrl
        }

        return ''
    }

    const handleImageError = (event: Event, file: UploadImage) => {
        console.error('Failed to load image:', file.name)
        const target = event.target as HTMLImageElement
        target.style.display = 'none'
    }

    const bytesToReadableSize = (bytes: number, decimals = 2): string => {
        if (bytes === 0) return '0 Bytes'

        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))

        const value = parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))
        return `${value} ${sizes[i]}`
    }

    const isImageFile = (fileName: string): boolean => {
        const extension = fileName.split('.').pop()?.toLowerCase()
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')
    }

    const getFileIcon = (fileName: string): string => {
        const extension = fileName.split('.').pop()?.toLowerCase()
        switch (extension) {
            case 'pdf':
                return '/sprite.svg#pdf'
            case 'doc':
            case 'docx':
                return '/sprite.svg#word'
            case 'xls':
            case 'xlsx':
                return '/sprite.svg#excel'
            case 'ppt':
            case 'pptx':
                return '/sprite.svg#powerpoint'
            case 'txt':
                return '/sprite.svg#text'
            default:
                return '/sprite.svg#document'
        }
    }

    const getFileName = (fileName: string): string => {
        const name = fileName.split('/').pop() || fileName
        if (name.length > 15) {
            const extension = name.split('.').pop()
            const base = name.substring(0, name.lastIndexOf('.'))
            return base.substring(0, 10) + '...' + (extension ? '.' + extension : '')
        }
        return name
    }

    const removeFile = (index: number) => {
        const file = localFiles.value[index]
        if (file?.previewUrl && file.previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(file.previewUrl)
        }

        localFiles.value = localFiles.value.filter((_, i) => i !== index)
        emit('update:modelValue', localFiles.value)

        limitError.value = ''
    }

    onBeforeUnmount(() => {
        previewUrls.value.forEach((url) => {
            if (url.startsWith('blob:')) {
                URL.revokeObjectURL(url)
            }
        })
        previewUrls.value.clear()
    })
</script>

<style scoped>
    .group {
        transition:
            transform 0.2s ease,
            opacity 0.2s ease,
            box-shadow 0.2s ease;
    }

    .cursor-move {
        cursor: move;
    }

    .cursor-grabbing {
        cursor: grabbing;
    }

    .opacity-50 {
        opacity: 0.5;
    }

    .scale-105 {
        transform: scale(1.05);
    }
</style>
