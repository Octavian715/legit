<!-- components/modals/DocumentUploadModal.vue -->
<template>
    <Modal
        v-model:is-open="isOpen"
        :title="$t('addDocuments', 'Add Documents')"
        content-width="sm:max-w-md"
        @close="handleClose"
    >
        <div class="space-y-3 px-5">
            <!-- Document Upload Sections -->
            <div class="grid grid-cols-1 gap-6">
                <!-- Passport Upload Section -->
                <!-- <div class="text-left space-y-4">
                    <h3 class="text-subtitle1 text-gray-950">
                        {{ $t('register.uploadPaspport') }}
                    </h3>

                    <Uploader
                        v-model="form.passportImages"
                        :title="$t('register.uploadPassportTitleLabel')"
                        :description="
                            $t(
                                'register.passportRequirements',
                                '10 MB max. JPEG, PNG or PDF format only.'
                            )
                        "
                        accept=".jpg,.jpeg,.png,.pdf"
                        :multiple="true"
                        :select-primary="false"
                        :error="errors.passportImages"
                        :aria-label="$t('uploadPassportLabel', 'Upload passport document')"
                        @update:model-value="clearFieldError('passportImages')"
                    />
                </div> -->

                <!-- Company Certificate Upload Section -->
                <div class="text-left space-y-4">
                    <h3 class="text-subtitle1 font-medium text-gray-950">
                        {{ $t('register.uploadCompanyTitleLabel') }}
                    </h3>

                    <Uploader
                        v-model="form.companyCertificate"
                        :title="$t('register.uploadPassportTitleLabel')"
                        :description="
                            $t(
                                'register.passportRequirements',
                                '10 MB max. JPEG, PNG or PDF format only.'
                            )
                        "
                        accept=".jpg,.jpeg,.png,.pdf"
                        :multiple="false"
                        c
                        :select-primary="false"
                        :error="errors.companyCertificate"
                        :aria-label="
                            $t('uploadCompanyCertificateLabel', 'Upload company certificate')
                        "
                        @update:model-value="clearFieldError('companyCertificate')"
                    />
                </div>
            </div>

            <!-- General Error Display -->
            <div v-if="generalError" class="text-center">
                <p class="text-caption1 text-red-500" role="alert">
                    {{ generalError }}
                </p>
            </div>
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
                :label="$t('confirm', 'Confirm')"
                :loading="isSubmitting"
                :disabled="!canSubmit"
                @click="handleConfirm"
            />
        </template>
    </Modal>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, watch } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useToastNotification } from '~/composables/useToastNotification'
    import type { UploadImage } from '~/types/ui/uploader'

    interface DocumentUploadData {
        passportImages: UploadImage[]
        companyCertificate: UploadImage[]
    }

    interface Props {
        modelValue: boolean
        initialData?: Partial<DocumentUploadData>
        isSubmitting?: boolean
        maxPassportFiles?: number
        maxCompanyCertificateFiles?: number
        requirePassport?: boolean
        requireCompanyCertificate?: boolean
    }

    const props = withDefaults(defineProps<Props>(), {
        modelValue: false,
        initialData: () => ({ passportImages: [], companyCertificate: [] }),
        isSubmitting: false,
        maxPassportFiles: 5,
        maxCompanyCertificateFiles: 1,
        requirePassport: true,
        requireCompanyCertificate: true,
    })

    const emit = defineEmits<{
        (e: 'update:modelValue', value: boolean): void
        (e: 'confirm', data: DocumentUploadData): void
        (e: 'cancel', data: DocumentUploadData | null): void
    }>()

    // Composables
    const { t } = useI18n({ useScope: 'global' })
    const toast = useToastNotification()

    // State
    const isOpen = computed({
        get: () => props.modelValue,
        set: (value) => emit('update:modelValue', value),
    })

    // Form data
    const form = reactive<DocumentUploadData>({
        passportImages: [...(props.initialData?.passportImages || [])],
        companyCertificate: [...(props.initialData?.companyCertificate || [])],
    })

    // Field errors
    const errors = reactive({
        passportImages: '',
        companyCertificate: '',
    })

    const generalError = ref('')

    const canSubmit = computed(() => {
        // const hasRequiredPassport = !props.requirePassport || form.passportImages.length > 0
        const hasRequiredCompany =
            !props.requireCompanyCertificate || form.companyCertificate.length > 0
        const hasNoErrors = !Object.values(errors).some((error) => error)

        // return hasRequiredPassport && hasRequiredCompany && hasNoErrors && !props.isSubmitting
        return hasRequiredCompany && hasNoErrors && !props.isSubmitting
    })

    // Validation
    const validateForm = (): boolean => {
        clearAllErrors()
        let isValid = true

        // Validate passport documents
        // if (props.requirePassport && form.passportImages.length === 0) {
        //     errors.passportImages = t(
        //         'validation.passportRequired',
        //         'Passport document is required'
        //     )
        //     isValid = false
        // } else if (form.passportImages.length > props.maxPassportFiles) {
        //     errors.passportImages = t(
        //         'validation.maxPassportFiles',
        //         `Maximum ${props.maxPassportFiles} passport files allowed`
        //     )
        //     isValid = false
        // }

        // Validate company certificate
        if (props.requireCompanyCertificate && form.companyCertificate.length === 0) {
            errors.companyCertificate = t(
                'validation.companyCertificateRequired',
                'Company certificate is required'
            )
            isValid = false
        } else if (form.companyCertificate.length > props.maxCompanyCertificateFiles) {
            errors.companyCertificate = t(
                'validation.maxCompanyCertificateFiles',
                `Maximum ${props.maxCompanyCertificateFiles} company certificate file allowed`
            )
            isValid = false
        }

        // File size and type validation
        const allFiles = [...form.passportImages, ...form.companyCertificate]
        const maxSize = 10 * 1024 * 1024 // 10MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']

        for (const file of allFiles) {
            if (file.size > maxSize) {
                generalError.value = t(
                    'validation.fileTooLarge',
                    'One or more files exceed 10MB limit'
                )
                isValid = false
                break
            }
            if (file.id) {
                isValid = true
                break
            }

            if (!allowedTypes.includes(file.type)) {
                generalError.value = t(
                    'validation.invalidFileType',
                    'Only JPEG, PNG, and PDF files are allowed'
                )
                isValid = false
                break
            }
        }

        return isValid
    }

    // Error handling
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

    // Handlers
    const handleConfirm = () => {
        if (!validateForm()) {
            toast.error(
                t('validation.fixErrors', 'Please fix the errors and try again'),
                t('error', 'Error')
            )
            return
        }

        emit('confirm', { ...form })
    }

    const handleCancel = () => {
        emit('cancel', { ...form })
        handleClose()
    }

    const handleClose = () => {
        clearAllErrors()
        isOpen.value = false
    }

    // Watch for prop changes
    watch(
        () => props.initialData,
        (newData) => {
            if (newData) {
                form.passportImages = [...(newData.passportImages || [])]
                form.companyCertificate = [...(newData.companyCertificate || [])]
            }
        },
        { deep: true, immediate: true }
    )

    // Watch for file count changes to auto-clear errors
    watch(
        () => form.passportImages.length,
        () => {
            if (form.passportImages.length > 0) {
                clearFieldError('passportImages')
            }
        }
    )

    watch(
        () => form.companyCertificate.length,
        () => {
            if (form.companyCertificate.length > 0) {
                clearFieldError('companyCertificate')
            }
        }
    )
</script>
