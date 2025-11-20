<template>
    <div class="flex flex-col space-y-5">
        <div class="flex flex-col gap-4">
            <Uploader
                v-model="localFiles"
                :description="t('product.import.acceptedFormats')"
                :accept="'.xlsx,.xls'"
                :multiple="false"
                :select-primary="false"
                :error="displayError"
                :aria-label="t('product.import.uploadAriaLabel')"
                :button-loading="isDownloadingTemplate"
                :button-title="t('product.import.download')"
                :disabled="isUploading"
                show-button
                :max-files="1"
                @update:model-value="handleFilesChange"
                @click="handleDownloadTemplate"
            />

            <!-- Progress Bar -->
            <div v-if="isUploading && uploadProgress > 0" class="mt-4">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm text-gray-600">{{ t('product.import.uploading') }}</span>
                    <span class="text-sm font-medium text-gray-900">{{ uploadProgress }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div
                        class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        :style="{ width: `${uploadProgress}%` }"
                    ></div>
                </div>
            </div>

            <!-- Error Display -->
            <div
                v-if="displayError && !isUploading"
                class="mt-2 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
                <div class="flex items-start gap-2">
                    <svg class="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0">
                        <use :xlink:href="`/sprite.svg#warn-error`"></use>
                    </svg>
                    <div class="text-sm text-red-700">
                        {{ displayError }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import type { UploadImage } from '~/types/ui/uploader'
    import { useProductImport } from '~/composables/useProductImport'

    interface Props {
        stepData?: Partial<{ file: File | null }>
        fieldErrors?: Record<string, string>
    }

    const props = withDefaults(defineProps<Props>(), {
        stepData: () => ({}),
        fieldErrors: () => ({}),
    })

    const emit = defineEmits<{
        update: [data: Partial<{ file: File | null }>]
    }>()

    const { t } = useI18n()
    const {
        downloadTemplate,
        isDownloadingTemplate,
        importErrors,
        isUploading,
        uploadProgress,
        resetImport,
    } = useProductImport()

    const localFiles = ref<UploadImage[]>([])
    const formData = ref<{ file: File | null }>({ file: null })

    const displayError = computed(() => {
        if (importErrors.value?.file) {
            return Array.isArray(importErrors.value.file)
                ? importErrors.value.file[0]
                : importErrors.value.file
        }
        return props.fieldErrors?.file || null
    })

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
    }

    const handleDownloadTemplate = async () => {
        await downloadTemplate()
    }

    const handleFilesChange = (files: UploadImage[]) => {
        resetImport() // Clear previous errors
        localFiles.value = files

        if (files.length > 0) {
            const uploadFile = files[0]
            if (uploadFile.file instanceof File) {
                formData.value.file = uploadFile.file
                emitUpdate()
            }
        } else {
            formData.value.file = null
            emitUpdate()
        }
    }

    const removeFile = () => {
        localFiles.value = []
        formData.value.file = null
        resetImport()
        emitUpdate()
    }

    const emitUpdate = () => {
        emit('update', { ...toRaw(formData.value) })
    }

    const validate = () => {
        const errors = []

        if (!formData.value.file) {
            errors.push({
                field: 'file',
                message: t('product.import.noFileSelected'),
                code: 'required',
                params: {},
            })
        }

        return {
            isValid: errors.length === 0,
            errors,
            data: errors.length === 0 ? formData.value : undefined,
        }
    }

    onMounted(() => {
        if (props.stepData?.file && props.stepData.file instanceof File) {
            formData.value.file = props.stepData.file
            localFiles.value = [
                {
                    file: props.stepData.file,
                    name: props.stepData.file.name,
                    type: props.stepData.file.type,
                    size: props.stepData.file.size,
                    previewUrl: '',
                },
            ]
        }
    })

    defineExpose({
        validate,
        formData: readonly(formData),
    })
</script>
