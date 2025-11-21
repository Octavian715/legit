<!-- components/modals/CertificateModal.vue -->
<template>
    <Modal
        v-model:is-open="isOpen"
        :title="modalTitle"
        content-width="sm:max-w-md"
        @close="handleClose"
    >
        <div class="space-y-6">
            <form class="space-y-3 px-5" @submit.prevent="handleSubmit">
                <!-- Certificate Name -->
                <div>
                    <Input
                        v-model="form.name"
                        :label="$t('certificates.certificateName', 'Certificate Name')"
                        :error="!!errors.name"
                        :error-message="errors.name"
                        required
                        @input="clearFieldError('name')"
                    />
                </div>

                <!-- Certificate Number -->
                <div>
                    <Input
                        v-model="form.certificateNumber"
                        :label="$t('certificates.certificateNumber', 'Certificate Number')"
                        :error="!!errors.certificateNumber"
                        :error-message="errors.certificateNumber"
                        required
                        @input="clearFieldError('certificateNumber')"
                    />
                </div>

                <!-- Date Fields Row -->
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
                        v-if="!isEditing"
                        v-model="uploadedFiles"
                        :accept="acceptedFileTypes"
                        :max-files="1"
                        :title="
                            $t(
                                'certificates.dragAndDropFile',
                                'Drag and drop certificate here or choose file'
                            )
                        "
                        :description="
                            $t(
                                'certificates.fileTypesHint',
                                '10 MB max, JPEG, PNG or PDF format only. Only one file allowed.'
                            )
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

                <!-- Error Display -->
                <p v-if="generalError" class="text-caption1 text-red-500" role="alert">
                    {{ generalError }}
                </p>
            </form>
        </div>

        <template #footer>
            <Button
                type="button"
                variant="filled"
                color="gray"
                :label="$t('cancel', 'Cancel')"
                :disabled="isSubmitting"
                @click="handleCancel"
            />

            <Button
                type="button"
                variant="filled"
                color="blue"
                :label="submitButtonLabel"
                :loading="isSubmitting"
                :disabled="!canSubmit"
                @click="handleSubmit"
            />
        </template>
    </Modal>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, watch, onMounted } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useDate } from '~/composables/useDate'
    import { useToastNotification } from '~/composables/useToastNotification'

    interface Certificate {
        id?: number
        name: string
        certificateNumber: string
        issueDate: string
        expiryDate: string
        file: File | null
        fileName?: string
    }

    interface UploadFile {
        id: number
        file: File
        name: string
        type: string
        size: number
        previewUrl?: string
    }

    interface Props {
        modelValue: boolean
        initialData?: Partial<Certificate>
        isSubmitting?: boolean
        isEditing?: boolean
    }

    const props = withDefaults(defineProps<Props>(), {
        modelValue: false,
        initialData: () => ({}),
        isSubmitting: false,
        isEditing: false,
    })

    const emit = defineEmits<{
        (e: 'update:modelValue', value: boolean): void
        (e: 'save', certificate: Certificate): void
        (e: 'cancel'): void
    }>()

    // Composables
    const { t } = useI18n({ useScope: 'global' })
    const { isValidDate, isDateBefore, isDateInFuture } = useDate()
    const toast = useToastNotification()

    // State
    const isOpen = computed({
        get: () => props.modelValue,
        set: (value) => emit('update:modelValue', value),
    })

    // Reactive form data
    const form = reactive<Certificate>({
        id: undefined,
        name: '',
        certificateNumber: '',
        issueDate: '',
        expiryDate: '',
        file: null,
        fileName: '',
    })

    // File upload state
    const uploadedFiles = ref<UploadFile[]>([])

    // Validation errors
    const errors = reactive({
        name: '',
        certificateNumber: '',
        issueDate: '',
        expiryDate: '',
        file: '',
    })

    // General error state
    const generalError = ref('')

    // File upload configuration
    const acceptedFileTypes = 'image/jpeg,image/png,application/pdf'
    const maxFileSize = 10 * 1024 * 1024 // 10 MB in bytes

    // Computed properties
    const canSubmit = computed(() => {
        const hasRequiredFields = !!(
            form.name.trim() &&
            form.certificateNumber.trim() &&
            form.issueDate &&
            form.expiryDate
        )

        const hasFile = props.isEditing || uploadedFiles.value.length > 0 || !!form.file
        const hasNoErrors = !Object.values(errors).some((error) => !!error)

        return hasRequiredFields && hasFile && hasNoErrors && !props.isSubmitting
    })

    const currentFileName = computed(() => {
        return (
            props.initialData?.fileName ||
            props.initialData?.file?.name ||
            uploadedFiles.value[0]?.name ||
            ''
        )
    })

    const submitButtonLabel = computed(() => {
        return props.isEditing
            ? t('certificates.updateCertificate', 'Update Certificate')
            : t('certificates.addCertificate', 'Add Certificate')
    })

    const modalTitle = computed(() => {
        return props.isEditing
            ? t('certificates.editCertificate', 'Edit Certificate')
            : t('certificates.addCertificate', 'Add Certificate')
    })

    // Methods
    const clearFieldError = (field: keyof typeof errors) => {
        if (errors[field]) {
            errors[field] = ''
        }
        generalError.value = ''
    }

    const clearAllErrors = () => {
        Object.keys(errors).forEach((key) => {
            errors[key as keyof typeof errors] = ''
        })
        generalError.value = ''
    }

    const validateForm = (): boolean => {
        clearAllErrors()
        let isValid = true

        // Validate certificate name
        if (!form.name.trim()) {
            errors.name = t('validation.certificateNameRequired', 'Certificate name is required')
            isValid = false
        }

        // Validate certificate number
        if (!form.certificateNumber.trim()) {
            errors.certificateNumber = t(
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

        // Validate file (only required for new certificates)
        if (!props.isEditing) {
            if (uploadedFiles.value.length === 0 && !form.file) {
                errors.file = t(
                    'validation.certificateFileRequired',
                    'Certificate file is required'
                )
                isValid = false
            } else if (uploadedFiles.value.length > 1) {
                errors.file = t('validation.onlyOneFileAllowed', 'Only one file is allowed')
                isValid = false
            } else if (uploadedFiles.value.length === 1) {
                const file = uploadedFiles.value[0].file
                if (file.size > maxFileSize) {
                    errors.file = t('validation.fileTooLarge', 'File size must be less than 10 MB')
                    isValid = false
                }
            }
        }

        return isValid
    }

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
                id: props.isEditing ? form.id : undefined,
                name: form.name.trim(),
                certificateNumber: form.certificateNumber.trim(),
                issueDate: form.issueDate,
                expiryDate: form.expiryDate,
                file: fileToSubmit,
                fileName: uploadedFiles.value[0]?.name || form.fileName || fileToSubmit?.name,
            }

            emit('save', certificateData)
        } catch (error) {
            console.error('Certificate submission error:', error)
            generalError.value = t(
                'errors.generalSubmit',
                'Failed to save certificate. Please try again.'
            )
        }
    }

    const handleCancel = () => {
        emit('cancel')
        handleClose()
    }

    const handleClose = () => {
        clearAllErrors()
        resetForm()
        isOpen.value = false
    }

    const resetForm = () => {
        Object.assign(form, {
            id: undefined,
            name: '',
            certificateNumber: '',
            issueDate: '',
            expiryDate: '',
            file: null,
            fileName: '',
        })
        uploadedFiles.value = []
    }

    const initializeForm = () => {
        if (!props.initialData) {
            resetForm()
            return
        }

        // Initialize form fields
        Object.assign(form, {
            id: props.initialData.id || undefined,
            name: props.initialData.name || '',
            certificateNumber: props.initialData.certificateNumber || '',
            issueDate: props.initialData.issueDate || '',
            expiryDate: props.initialData.expiryDate || '',
            file: props.initialData.file || null,
            fileName: props.initialData.fileName || props.initialData.file?.name || '',
        })

        // Initialize uploaded files for editing mode
        if (props.isEditing && (props.initialData.file || props.initialData.fileName)) {
            const existingFile =
                props.initialData.file || new File([], props.initialData.fileName || 'certificate')

            uploadedFiles.value = [
                {
                    id: Date.now(),
                    file: existingFile,
                    name: props.initialData.fileName || existingFile.name,
                    type: existingFile.type || 'application/pdf',
                    size: existingFile.size || 0,
                    previewUrl: '',
                },
            ]
        }
    }

    // Watch for file uploads - enforce single file limit
    watch(
        uploadedFiles,
        (newFiles) => {
            // CRITICAL: Enforce only one file allowed
            if (newFiles.length > 1) {
                // Keep only the most recent file
                uploadedFiles.value = [newFiles[newFiles.length - 1]]
                toast.warning(
                    t('validation.onlyOneFileAllowed', 'Only one certificate file is allowed'),
                    t('warning', 'Warning')
                )
            }

            if (newFiles.length > 0) {
                const file = newFiles[0]

                // Validate file size
                if (file.file.size > maxFileSize) {
                    errors.file = t('validation.fileTooLarge', 'File size must be less than 10 MB')
                    uploadedFiles.value = []
                    toast.error(
                        t('validation.fileTooLarge', 'File size must be less than 10 MB'),
                        t('error', 'Error')
                    )
                    return
                }

                form.file = file.file
                form.fileName = file.name
                clearFieldError('file')
            } else {
                form.file = null
                form.fileName = ''
            }
        },
        { deep: true }
    )

    // Watch for prop changes
    watch(
        () => props.initialData,
        () => {
            initializeForm()
        },
        { deep: true, immediate: true }
    )

    // Watch modal open state
    watch(
        () => props.modelValue,
        (newValue) => {
            if (newValue) {
                initializeForm()
            } else {
                clearAllErrors()
            }
        }
    )

    // Initialize on mount
    onMounted(() => {
        initializeForm()
    })
</script>
