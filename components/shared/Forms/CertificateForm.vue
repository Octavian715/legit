<!-- components/forms/CertificateForm.vue -->
<template>
    <div class="certificate-form">
        <form class="flex flex-col gap-3 px-5" novalidate @submit.prevent="handleSubmit">
            <!-- Certificate Name -->
            <Input
                v-model="form.name"
                :label="$t('register.certificateName', 'Certificate name')"
                name="name"
                background="bg-white"
                :error="!!errors.name"
                :error-message="errors.name"
                required
                @input="clearFieldError('name')"
            />

            <!-- Certificate Number -->
            <Input
                v-model="form.number"
                :label="$t('register.certificateNumber', 'Certificate number')"
                name="number"
                background="bg-white"
                :error="!!errors.number"
                :error-message="errors.number"
                required
                @input="clearFieldError('number')"
            />

            <!-- Issue Date and Expiry Date - Side by Side -->
            <div class="grid grid-cols-1 gap-3">
                <!-- Issue Date -->
                <div class="flex flex-col w-full">
                    <DatePicker
                        v-model="form.issueDate"
                        :label="$t('certificates.selectIssueDate', 'Select issue date')"
                        :placeholder="$t('certificates.selectDate', 'Select date')"
                        required
                        @date-selected="clearFieldError('issueDate')"
                    />
                    <div v-if="errors.issueDate" class="flex gap-1 text-caption1 mx-1 mt-1">
                        <svg class="w-3 h-3 text-red-500">
                            <use xlink:href="/sprite.svg#warn-error"></use>
                        </svg>
                        <span class="text-red-500">{{ errors.issueDate }}</span>
                    </div>
                </div>

                <!-- Expiry Date -->
                <div class="flex flex-col w-full">
                    <DatePicker
                        v-model="form.expiryDate"
                        :label="$t('certificates.selectExpiryDate', 'Select expiry date')"
                        :placeholder="$t('certificates.selectDate', 'Select date')"
                        required
                        @date-selected="clearFieldError('expiryDate')"
                    />
                    <div v-if="errors.expiryDate" class="flex gap-1 text-caption1 mx-1 mt-1">
                        <svg class="w-3 h-3 text-red-500">
                            <use xlink:href="/sprite.svg#warn-error"></use>
                        </svg>
                        <span class="text-red-500">{{ errors.expiryDate }}</span>
                    </div>
                </div>
            </div>

            <!-- File Upload -->
            <div>
                <Uploader
                    v-model="uploadedFiles"
                    :accept="acceptedFileTypes"
                    :title="
                        $t(
                            'certificates.dragAndDropFile',
                            'Drag and drop certificate here or choose file'
                        )
                    "
                    :description="
                        $t('certificates.fileTypesHint', '10 MB max, JPEG, PNG or PDF format only')
                    "
                    :multiple="false"
                />

                <div v-if="errors.file" class="flex gap-1 text-caption1 mx-1 mt-2">
                    <svg class="w-3 h-3 text-red-500">
                        <use xlink:href="/sprite.svg#warn-error"></use>
                    </svg>
                    <span class="text-red-500">{{ errors.file }}</span>
                </div>
            </div>

            <!-- Actions (if showActions is true) -->
            <div v-if="showActions" class="flex gap-3 justify-end mt-6">
                <Button
                    type="button"
                    color="gray"
                    variant="filled"
                    :label="$t('cancel', 'Cancel')"
                    :disabled="isSubmitting"
                    @click="handleCancel"
                />

                <Button
                    type="submit"
                    color="blue"
                    :label="
                        editMode
                            ? $t('save', 'Update')
                            : $t('certificates.addCertificate', 'Add Certificate')
                    "
                    :loading="isSubmitting"
                    :disabled="!canSubmit"
                />
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, watch, onMounted } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useDate } from '~/composables/useDate'
    import { useToastNotification } from '~/composables/useToastNotification'

    interface Certificate {
        id?: number
        name: string
        number: string
        issueDate: string
        expiryDate: string
        file: File | null
        fileName?: string
    }

    interface UploadFile {
        id?: number
        file: File | string
        name: string
        type: string
        size: number
        previewUrl?: string
    }

    interface Props {
        initialData?: Partial<Certificate> | null
        showActions?: boolean
        isSubmitting?: boolean
    }

    const props = withDefaults(defineProps<Props>(), {
        initialData: null,
        showActions: false,
        isSubmitting: false,
    })

    const emit = defineEmits<{
        (e: 'save', data: Certificate): void
        (e: 'cancel'): void
    }>()

    // Composables
    const { t } = useI18n({ useScope: 'global' })
    const { isValidDate, isDateBefore, isDateInFuture } = useDate()
    const toast = useToastNotification()

    // State
    const editMode = computed(() => !!props.initialData?.id || !!props.initialData?.name)

    // File upload state
    const uploadedFiles = ref<UploadFile[]>([])

    // File upload configuration
    const acceptedFileTypes = 'image/jpeg,image/png,application/pdf'

    // Form data
    const form = reactive<Certificate>({
        id: props.initialData?.id || undefined,
        name: props.initialData?.name || '',
        number: props.initialData?.number || '',
        issueDate: props.initialData?.issueDate || '',
        expiryDate: props.initialData?.expiryDate || '',
        file: props.initialData?.file || null,
        fileName: props.initialData?.fileName || '',
    })

    // Field errors
    const errors = reactive({
        name: '',
        number: '',
        issueDate: '',
        expiryDate: '',
        file: '',
    })

    // Computed Properties
    const canSubmit = computed(() => {
        const hasRequiredFields = !!(
            form.name.trim() &&
            form.number.trim() &&
            form.issueDate &&
            form.expiryDate
        )

        const hasFile = uploadedFiles.value.length > 0 || !!form.file
        const hasNoErrors = !Object.values(errors).some((error) => !!error)

        return hasRequiredFields && hasFile && hasNoErrors && !props.isSubmitting
    })

    // Form validation
    const validateForm = (): boolean => {
        clearAllErrors()

        let isValid = true

        // Validate certificate name
        if (!form.name.trim()) {
            errors.name = t('validation.certificateNameRequired', 'Certificate name is required')
            isValid = false
        }

        // Validate certificate number
        if (!form.number.trim()) {
            errors.number = t(
                'validation.certificateNumberRequired',
                'Certificate number is required'
            )
            isValid = false
        }

        // Validate issue date
        if (!form.issueDate) {
            errors.issueDate = t('validation.issueDateRequired', 'Issue date is required')
            isValid = false
        } else if (!isValidDate(form.issueDate)) {
            errors.issueDate = t('validation.invalidDate', 'Invalid date format')
            isValid = false
        } else if (isDateInFuture(form.issueDate)) {
            errors.issueDate = t(
                'validation.issueDateCannotBeFuture',
                'Issue date cannot be in the future'
            )
            isValid = false
        }

        // Validate expiry date
        if (!form.expiryDate) {
            errors.expiryDate = t('validation.expiryDateRequired', 'Expiry date is required')
            isValid = false
        } else if (!isValidDate(form.expiryDate)) {
            errors.expiryDate = t('validation.invalidDate', 'Invalid date format')
            isValid = false
        } else if (
            form.issueDate &&
            isValidDate(form.issueDate) &&
            isDateBefore(form.expiryDate, form.issueDate)
        ) {
            errors.expiryDate = t(
                'validation.expiryDateMustBeAfterIssueDate',
                'Expiry date must be after issue date'
            )
            isValid = false
        }

        // Validate file (required for new certificates)
        if (uploadedFiles.value.length === 0 && !form.file) {
            errors.file = t('validation.certificateFileRequired', 'Certificate file is required')
            isValid = false
        }

        return isValid
    }

    // Clear field error on user input
    const clearFieldError = (field: keyof typeof errors) => {
        if (errors[field]) {
            errors[field] = ''
        }
    }

    // Clear all field errors
    const clearAllErrors = () => {
        Object.keys(errors).forEach((key) => {
            errors[key as keyof typeof errors] = ''
        })
    }

    // Handlers
    const handleSubmit = () => {
        if (!validateForm()) {
            toast.error(
                t('validation.fixErrors', 'Please fix the errors and try again'),
                t('error', 'Error')
            )
            return
        }

        try {
            // Get file from uploaded files or existing form file
            const fileToSubmit =
                uploadedFiles.value.length > 0 ? uploadedFiles.value[0].file : form.file

            const certificateData: Certificate = {
                id: form.id,
                name: form.name.trim(),
                number: form.number.trim(),
                issueDate: form.issueDate,
                expiryDate: form.expiryDate,
                file: fileToSubmit instanceof File ? fileToSubmit : form.file,
                fileName: uploadedFiles.value[0]?.name || form.fileName || fileToSubmit?.name,
            }

            emit('save', certificateData)
        } catch (error) {
            console.error('Certificate submission error:', error)
        }
    }

    const handleCancel = () => {
        emit('cancel')
    }

    // Watch for file uploads
    watch(
        uploadedFiles,
        (newFiles) => {
            if (newFiles.length > 0) {
                const file = newFiles[0]

                // Update form.file only if it's a new File upload
                // If file.file is a string (file path from backend), keep the original form.file
                if (file.file instanceof File) {
                    form.file = file.file
                    form.fileName = file.name
                    clearFieldError('file')
                } else if (typeof file.file === 'string') {
                    // File path from backend - keep existing form.file if it exists
                    if (!form.file) {
                        form.file = file.file as any // Store the path as file reference
                    }
                    form.fileName = file.name
                    clearFieldError('file')
                }
            } else {
                // ✅ File removed - always clear form.file regardless of edit mode
                // This ensures validation will fail if file is required
                form.file = null
                form.fileName = ''
            }
        },
        { deep: true }
    )

    // Update form when initialData changes
    watch(
        () => props.initialData,
        (newData) => {
            if (newData) {
                Object.assign(form, {
                    id: newData.id || undefined,
                    name: newData.name || '',
                    number: newData.number || '',
                    issueDate: newData.issueDate || '',
                    expiryDate: newData.expiryDate || '',
                    file: newData.file || null,
                    fileName: newData.fileName || '',
                })

                // Initialize uploadedFiles for edit mode with existing file
                if (newData.file || newData.fileName) {
                    const existingFile = newData.file instanceof File ? newData.file : newData.file // It could be a file path string from backend

                    uploadedFiles.value = [
                        {
                            id: newData.id || Date.now(),
                            file: existingFile || newData.fileName || '',
                            name:
                                newData.fileName ||
                                (newData.file instanceof File ? newData.file.name : 'certificate'),
                            type:
                                newData.file instanceof File
                                    ? newData.file.type
                                    : 'application/pdf',
                            size: newData.file instanceof File ? newData.file.size : 0,
                            previewUrl: '',
                        },
                    ]
                } else {
                    uploadedFiles.value = []
                }
            }
        },
        { immediate: true, deep: true }
    )

    onMounted(() => {
        // Initialize form if no initial data
        if (!props.initialData) {
            clearAllErrors()
        }
    })
</script>
