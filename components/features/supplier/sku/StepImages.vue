<template>
    <div class="flex flex-col space-y-5">
        <div class="flex flex-col gap-4">
            <Uploader
                v-model="uploadedFiles"
                :title="t('product.uploadImagesTitle')"
                :description="t('product.uploadImagesDescription')"
                :accept="'.jpg,.jpeg,.png,.webp'"
                :multiple="true"
                :select-primary="true"
                :max-files="10"
                :error="uploadError"
                @update:model-value="handleFilesChange"
                @reorder="handleReorder"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
    import type { UploadImage } from '~/types/ui/uploader'
    import { type ProductImagesFormData } from '~/utils/validator/schemas/products/product'

    interface ExistingImage {
        id: number
        url: string
        name?: string
        isPrimary: boolean
        sortOrder: number
    }

    interface Props {
        stepData?: Partial<ProductImagesFormData>
        fieldErrors?: Record<string, string>
    }

    const props = withDefaults(defineProps<Props>(), {
        stepData: () => ({}),
        fieldErrors: () => ({}),
    })

    const emit = defineEmits<{
        update: [data: FormData | Partial<ProductImagesFormData>]
        'clear-error': [fieldName: string]
    }>()

    const { t } = useI18n()

    const formData = ref<ProductImagesFormData>({
        images: [],
        existingImages: [],
        primaryImageIndex: 0,
        deleteImageIds: [],
    })

    const uploadedFiles = ref<UploadImage[]>([])
    const uploadError = ref<string>('')

    // Initialize form data from props
    const initializeFormData = () => {
        if (props.stepData && Object.keys(props.stepData).length > 0) {
            formData.value = {
                ...formData.value,
                ...props.stepData,
            }

            // Convert existing images to uploader format
            if (formData.value.existingImages && formData.value.existingImages.length > 0) {
                uploadedFiles.value = formData.value.existingImages.map((img: ExistingImage) => ({
                    file: null,
                    name: img.name || `Image ${img.id}`,
                    type: 'image/jpeg',
                    size: 0,
                    previewUrl: img.url,
                    id: img.id,
                    isPrimary: img.isPrimary,
                    sortOrder: img.sortOrder,
                }))
            }
        }
    }

    // Handle file changes from uploader
    const handleFilesChange = (files: UploadImage[]) => {
        uploadedFiles.value = files
        updateExistingImagesOrder()
    }

    // Handle reorder event
    const handleReorder = (event: { from: number; to: number }) => {
        updateExistingImagesOrder()
    }

    // Update existing images order and primary status
    const updateExistingImagesOrder = () => {
        const existingImages: ExistingImage[] = []
        const newImages: File[] = []

        uploadedFiles.value.forEach((file, index) => {
            if (file.id) {
                // Existing image
                existingImages.push({
                    id: file.id,
                    url: file.previewUrl || '',
                    name: file.name,
                    isPrimary: index === 0, // First image is always primary
                    sortOrder: index,
                })
            } else if (file.file instanceof File) {
                // New image
                newImages.push(file.file)
            }
        })

        formData.value.existingImages = existingImages
        formData.value.images = newImages
        formData.value.primaryImageIndex = 0

        // Always emit FormData for consistency
        emitFormData()
    }

    // Emit FormData for all operations
    const emitFormData = () => {
        const data = new FormData()

        // IMPORTANT: Add _method first for Laravel
        data.append('_method', 'PATCH')

        // Add new images
        uploadedFiles.value.forEach((file) => {
            if (file.file instanceof File) {
                data.append('images[]', file.file)
            }
        })

        // Add existing images order info
        const existingImagesOrder = uploadedFiles.value
            .filter((f) => f.id)
            .map((f, index) => ({
                id: f.id,
                sortOrder: index,
                isPrimary: index === 0,
            }))

        // Send each element as array item
        existingImagesOrder.forEach((img, index) => {
            data.append(`existing_images[${index}][id]`, img.id.toString())
            data.append(`existing_images[${index}][sort_order]`, img.sortOrder.toString())
            data.append(`existing_images[${index}][is_primary]`, img.isPrimary ? '1' : '0')
        })

        // Add primary image index
        data.append('primary_image_index', '0')

        // Add deleted image IDs
        if (formData.value.deleteImageIds.length > 0) {
            formData.value.deleteImageIds.forEach((id) => {
                data.append('delete_image_ids[]', id.toString())
            })
        }

        for (let [key, value] of data.entries()) {
        }

        emit('update', data)
    }

    // Track deleted images
    watch(uploadedFiles, (newFiles, oldFiles) => {
        if (oldFiles && oldFiles.length > newFiles.length) {
            // Find deleted images
            const currentIds = new Set(newFiles.filter((f) => f.id).map((f) => f.id))
            const deletedImages = oldFiles.filter((f) => f.id && !currentIds.has(f.id))

            deletedImages.forEach((img) => {
                if (img.id && !formData.value.deleteImageIds.includes(img.id)) {
                    formData.value.deleteImageIds.push(img.id)
                }
            })
        }
    })

    const validate = () => {
        const hasImages = uploadedFiles.value.length > 0

        if (!hasImages) {
            return {
                isValid: false,
                errors: [
                    {
                        field: 'images',
                        message: t('validation.atLeastOneImage'),
                        code: 'required',
                        params: {},
                    },
                ],
            }
        }

        return {
            isValid: true,
            errors: [],
            data: formData.value,
        }
    }

    // Initialize on mount
    onMounted(() => {
        initializeFormData()
    })

    // Watch for prop changes
    watch(
        () => props.stepData,
        () => {
            initializeFormData()
        },
        { deep: true }
    )

    defineExpose({
        validate,
        formData: readonly(formData),
    })
</script>
