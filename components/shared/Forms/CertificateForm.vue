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
            <div class="flex gap-3">
                <!-- Issue Date -->
                <div class="flex-1">
                    <Input
                        v-model="form.issueDate"
                        :label="$t('certificates.issueDate', 'Issue Date')"
                        name="issueDate"
                        type="date"
                        background="bg-white"
                        :error="!!errors.issueDate"
                        :error-message="errors.issueDate"
                        required
                        @input="clearFieldError('issueDate')"
                    />
                </div>

                <!-- Expiry Date -->
                <div class="flex-1">
                    <Input
                        v-model="form.expiryDate"
                        :label="$t('certificates.expiryDate', 'Expiry date')"
                        name="expiryDate"
                        type="date"
                        background="bg-white"
                        :error="!!errors.expiryDate"
                        :error-message="errors.expiryDate"
                        required
                        @input="clearFieldError('expiryDate')"
                    />
                </div>
            </div>

            <!-- Issuing Authority -->
            <Input
                v-model="form.issuingAuthority"
                :label="$t('certificates.issuingAuthority', 'Issuing Authority')"
                name="issuingAuthority"
                background="bg-white"
                :error="!!errors.issuingAuthority"
                :error-message="errors.issuingAuthority"
                required
                @input="clearFieldError('issuingAuthority')"
            />

            <!-- File Upload -->
            <div>
                <label class="block text-subtitle3 font-medium text-gray-900 mb-2">
                    {{ $t('certificates.certificateFile', 'Certificate File') }} *
                </label>

                <FileUpload
                    v-model="form.file"
                    :title="$t('certificates.uploadCertificateFile', 'Upload Certificate File')"
                    :subtitle="
                        $t(
                            'register.uploadCertificatesRequirementMessage',
                            '1MB max. JPEG, PNG or PDF format only.'
                        )
                    "
                    accept=".pdf,.jpg,.jpeg,.png"
                    :max-size="1048576"
                    :error="!!errors.file"
                    :error-message="errors.file"
                    @update:model-value="clearFieldError('file')"
                />
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
    import { reactive, computed, watch, onMounted } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useToastNotification } from '~/composables/useToastNotification'

    interface Certificate {
        id?: number
        name: string
        number: string
        issueDate: string
        expiryDate: string
        issuingAuthority: string
        file: File | null
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
    const toast = useToastNotification()

    // State
    const editMode = computed(() => !!props.initialData?.id || !!props.initialData?.name)

    // Form data
    const form = reactive<Certificate>({
        id: props.initialData?.id || undefined,
        name: props.initialData?.name || '',
        number: props.initialData?.number || '',
        issueDate: props.initialData?.issueDate || '',
        expiryDate: props.initialData?.expiryDate || '',
        issuingAuthority: props.initialData?.issuingAuthority || '',
        file: props.initialData?.file || null,
    })

    // Field errors
    const errors = reactive({
        name: '',
        number: '',
        issueDate: '',
        expiryDate: '',
        issuingAuthority: '',
        file: '',
    })

    // Computed Properties
    const canSubmit = computed(() => {
        return (
            form.name &&
            form.number &&
            form.issueDate &&
            form.expiryDate &&
            form.issuingAuthority &&
            form.file &&
            !Object.values(errors).some((error) => error) &&
            !props.isSubmitting
        )
    })

    // Form validation
    const validateForm = (): boolean => {
        clearAllErrors()

        let isValid = true

        // Required field validation
        if (!form.name.trim()) {
            errors.name = t('validation.required', 'This field is required')
            isValid = false
        }

        if (!form.number.trim()) {
            errors.number = t('validation.required', 'This field is required')
            isValid = false
        }

        if (!form.issueDate) {
            errors.issueDate = t('validation.required', 'This field is required')
            isValid = false
        }

        if (!form.expiryDate) {
            errors.expiryDate = t('validation.required', 'This field is required')
            isValid = false
        }

        if (!form.issuingAuthority.trim()) {
            errors.issuingAuthority = t('validation.required', 'This field is required')
            isValid = false
        }

        if (!form.file) {
            errors.file = t('validation.required', 'Please upload a certificate file')
            isValid = false
        }

        // Date validation
        if (form.issueDate && form.expiryDate) {
            const issueDate = new Date(form.issueDate)
            const expiryDate = new Date(form.expiryDate)

            if (expiryDate <= issueDate) {
                errors.expiryDate = t(
                    'certificates.expiryAfterIssue',
                    'Expiry date must be after issue date'
                )
                isValid = false
            }
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
            return
        }

        emit('save', { ...form })
    }

    const handleCancel = () => {
        emit('cancel')
    }

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
                    issuingAuthority: newData.issuingAuthority || '',
                    file: newData.file || null,
                })
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
