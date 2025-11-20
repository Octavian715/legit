<template>
    <div>
        <form @submit.prevent="handleSubmit">
            <div class="px-6 mt-1 mb-6 space-y-3">
                <!-- Email Field -->
                <Input
                    v-model="formData.email"
                    name="email"
                    type="email"
                    :label="$t('email')"
                    :error="errors.email"
                    required
                    autocomplete="email"
                    size="lg"
                />

                <!-- Company Name Field -->
                <Input
                    v-model="formData.companyName"
                    name="companyName"
                    type="text"
                    :label="$t('companyName')"
                    :error="errors.companyName"
                    required
                    autocomplete="organization"
                    size="lg"
                />

                <!-- Phone Number Field -->
                <PhoneInput
                    v-model="formData.phone"
                    name="phone"
                    required
                    :error="errors.phone"
                    size="lg"
                    country-code="MD"
                    :show-validation-state="true"
                />

                <!-- Message/Comment Field -->
                <Textarea
                    v-model="formData.message"
                    name="message"
                    :label="$t('writeComment')"
                    :maxlength="500"
                    :rows="4"
                    size="lg"
                />
            </div>
            <!-- Action Buttons -->
            <div class="flex justify-center gap-3 px-5 pt-6 border-t border-gray-400">
                <Button
                    type="button"
                    variant="outline"
                    color="gray"
                    size="lg"
                    class="order-2 sm:order-1 w-full sm:w-auto"
                    :disabled="isSubmitting"
                    @click="handleClose"
                >
                    {{ $t('cancel') }}
                </Button>
                <Button
                    type="submit"
                    variant="filled"
                    color="blue"
                    size="lg"
                    class="order-1 sm:order-2 w-full sm:w-auto"
                    :loading="isSubmitting"
                    :disabled="!isFormValid || isSubmitting"
                >
                    {{ $t('sendInvitation') }}
                </Button>
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
    import { validator } from '~/utils/validator'
    import {
        invitationFormSchema,
        emailSchema,
        companyNameSchema,
        phoneSchema,
        messageSchema,
        type InvitationFormData,
    } from '~/utils/validator/schemas/invitations'

    const props = defineProps<{
        partnerType: string
    }>()

    const { t } = useI18n()
    const modalStore = useModalStore()
    const { success, error: showError, warning } = useToastNotification()

    const formData = ref<InvitationFormData>({
        email: '',
        companyName: '',
        phone: '',
        message: '',
        partnerType: props.partnerType,
    })

    const errors = ref({
        email: '',
        companyName: '',
        phone: '',
        message: '',
    })

    const isSubmitting = ref(false)

    const isFormValid = computed(() => {
        const validation = validator.validate('invitation-form', invitationFormSchema, {
            email: formData.value.email,
            companyName: formData.value.companyName,
            phone: formData.value.phone,
            message: formData.value.message || undefined,
            partnerType: formData.value.partnerType,
        })
        return validation.isValid && Object.values(errors.value).every((error) => error === '')
    })

    const validateFieldRealtime = (field: keyof typeof errors.value, value: string) => {
        let validation
        switch (field) {
            case 'email':
                validation = validator.validate('invitation-email', emailSchema, { email: value })
                errors.value.email =
                    validation.errors.find((err) => err.field === 'email')?.message || ''
                break
            case 'companyName':
                validation = validator.validate('invitation-company-name', companyNameSchema, {
                    companyName: value,
                })
                errors.value.companyName =
                    validation.errors.find((err) => err.field === 'companyName')?.message || ''
                break
            case 'phone':
                validation = validator.validate('invitation-phone', phoneSchema, { phone: value })
                errors.value.phone =
                    validation.errors.find((err) => err.field === 'phone')?.message || ''
                break
            case 'message':
                validation = validator.validate('invitation-message', messageSchema, {
                    message: value || undefined,
                })
                errors.value.message =
                    validation.errors.find((err) => err.field === 'message')?.message || ''
                break
        }
    }

    const clearFieldError = (field: keyof typeof errors.value) => {
        errors.value[field] = ''
    }

    const resetForm = () => {
        formData.value = {
            email: '',
            companyName: '',
            phone: '',
            message: '',
            partnerType: props.partnerType,
        }
        errors.value = {
            email: '',
            companyName: '',
            phone: '',
            message: '',
        }
    }

    const handleClose = () => {
        if (isSubmitting.value) {
            warning(t('pleaseWaitForRequestToComplete'))
            return
        }
        resetForm()
        modalStore.closeModal()
    }

    const handleSubmit = async () => {
        if (isSubmitting.value) return

        const formValidation = validator.validate('invitation-form', invitationFormSchema, {
            email: formData.value.email,
            companyName: formData.value.companyName,
            phone: formData.value.phone,
            message: formData.value.message || undefined,
            partnerType: props.partnerType,
        })

        if (!formValidation.isValid) {
            formValidation.errors.forEach((error) => {
                if (error.field in errors.value) {
                    errors.value[error.field as keyof typeof errors.value] = error.message
                }
            })
            showError(t('pleaseFixValidationErrors'), t('formValidationError'), { timeout: 4000 })
            return
        }

        try {
            isSubmitting.value = true

            const payload = {
                email: formData.value.email.trim().toLowerCase(),
                company_name: formData.value.companyName.trim(),
                phone_number: formData.value.phone.trim(),
                comment: formData.value.message?.trim() || null,
                referred_role: props.partnerType,
            }

            const {
                public: { apiBaseURL },
            } = useRuntimeConfig()
            const { post } = useApi()

            await post('/referral/invitations', payload)

            success(
                t('invitationSentSuccessfullyMessage', {
                    email: formData.value.email,
                    company: formData.value.companyName,
                }),
                t('connections.invitationSent'),
                { timeout: 5000 }
            )

            resetForm()
            modalStore.closeModal()
        } catch (error: any) {
            console.error('Error submitting invitation:', error)

            if (error.statusCode === 422 && error.data?.errors) {
                const serverErrors = error.data.errors
                let hasFieldErrors = false

                const fieldMapping = {
                    email: 'email',
                    company_name: 'companyName',
                    phone_number: 'phone',
                    comment: 'message',
                }

                Object.keys(serverErrors).forEach((serverField) => {
                    const localField = fieldMapping[serverField as keyof typeof fieldMapping]
                    if (
                        localField &&
                        errors.value[localField as keyof typeof errors.value] !== undefined
                    ) {
                        errors.value[localField as keyof typeof errors.value] =
                            serverErrors[serverField][0]
                        hasFieldErrors = true
                    }
                })

                if (hasFieldErrors) {
                    showError(
                        t('pleaseCorrectHighlightedFieldsAndTryAgain'),
                        t('validationErrors'),
                        { timeout: 6000 }
                    )
                } else {
                    showError(t('serverValidationError'), t('validationError'), { timeout: 5000 })
                }
            } else if (error.statusCode === 409) {
                showError(t('invitationAlreadyExists'), t('duplicateInvitation'), { timeout: 6000 })
            } else if (error.statusCode === 429) {
                showError(t('tooManyInvitationsPleaseTryLater'), t('rateLimitExceeded'), {
                    timeout: 8000,
                })
            } else if (error.statusCode >= 500) {
                showError(t('serverErrorPleaseTryAgainLater'), t('serverError'), { timeout: 6000 })
            } else if (!navigator.onLine) {
                showError(t('pleaseCheckInternetConnectionAndTryAgain'), t('connectionError'), {
                    timeout: 6000,
                })
            } else {
                showError(t('invitationSendFailed'), t('unexpectedError'), { timeout: 5000 })
            }
        } finally {
            isSubmitting.value = false
        }
    }

    watch(
        () => formData.value.email,
        (value) => {
            if (value && errors.value.email) {
                validateFieldRealtime('email', value)
            } else if (value) {
                clearFieldError('email')
            }
        }
    )

    watch(
        () => formData.value.companyName,
        (value) => {
            if (value && errors.value.companyName) {
                validateFieldRealtime('companyName', value)
            } else if (value) {
                clearFieldError('companyName')
            }
        }
    )

    watch(
        () => formData.value.phone,
        (value) => {
            if (value && errors.value.phone) {
                validateFieldRealtime('phone', value)
            } else if (value) {
                clearFieldError('phone')
            }
        }
    )

    watch(
        () => formData.value.message,
        (value) => {
            if (value && errors.value.message) {
                validateFieldRealtime('message', value)
            } else if (value) {
                clearFieldError('message')
            }
        }
    )

    watch(
        () => props.partnerType,
        (newType) => {
            formData.value.partnerType = newType
        },
        { immediate: true }
    )

    onMounted(() => {
        nextTick(() => {
            const firstInput = document.querySelector('input[name="email"]') as HTMLInputElement
            if (firstInput) {
                firstInput.focus()
            }
        })
    })
</script>
