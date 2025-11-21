<template>
    <Modal
        :is-open="true"
        :title="$t('deleteAccount.modalTitle')"
        content-width="max-w-2xl"
        :persistent="true"
        @close="handleCancel"
    >
        <!-- Body -->
        <div class="px-4 space-y-4">
            <!-- Primary Instruction -->
            <p class="text-subtitle2 text-gray-700 leading-relaxed">
                {{ $t('deleteAccount.confirmInstruction') }}
            </p>

            <!-- Deletion Timeline Warning -->
            <p class="text-subtitle2 text-gray-700 leading-relaxed">
                {{ $t('deleteAccount.deletionTimelinePrefix') }}
                <span class="font-bold text-gray-900">{{ $t('deleteAccount.deletionTimelineBold') }}</span>
            </p>

            <!-- Deactivation Notice -->
            <p class="text-subtitle2 text-gray-700 leading-relaxed">
                {{ $t('deleteAccount.deactivationNotice') }}
            </p>

            <!-- Reactivation Information -->
            <p class="text-subtitle2 text-gray-700 leading-relaxed">
                {{ $t('deleteAccount.reactivationInfo') }}
            </p>

            <!-- Permanent Deletion Warning -->
            <p class="text-subtitle2 text-gray-700 leading-relaxed">
                {{ $t('deleteAccount.permanentDeletionWarningPrefix') }}
                <span class="font-bold text-gray-900">{{ $t('deleteAccount.permanentDeletionWarningBold') }}</span>
            </p>

            <!-- Form Fields -->
            <div class="space-y-3 pt-2">
                <!-- Company Name Input -->
                <Input
                    v-model="form.company_name"
                    :label="$t('deleteAccount.companyNameLabel')"
                    name="company_name"
                    background="bg-white"
                    size="lg"
                    required
                    :error="!!errors.company_name"
                    :error-message="errors.company_name"
                    @input="clearFieldError('company_name')"
                />

                <!-- Password Input -->
                <Input
                    v-model="form.password"
                    :label="$t('deleteAccount.passwordLabel')"
                    type="password"
                    name="password"
                    background="bg-white"
                    size="lg"
                    required
                    :error="!!errors.password"
                    :error-message="errors.password"
                    @input="clearFieldError('password')"
                />

                <!-- Confirmation Code Input -->
                <div>
                    <Input
                        v-model="form.code"
                        :label="$t('deleteAccount.confirmationCodeLabel')"
                        name="confirmation_code"
                        background="bg-white"
                        size="lg"
                        required
                        maxlength="6"
                        :error="!!errors.code"
                        :error-message="errors.code"
                        @input="clearFieldError('code')"
                    />
                    <div class="mt-2 text-caption1">
                        <span class="text-gray-600">{{ $t('deleteAccount.didntReceiveCode') }}</span>
                        <button
                            type="button"
                            class="ml-1 text-blue-500 hover:text-blue-600 transition-colors"
                            :disabled="resendCooldown > 0"
                            :class="{ 'opacity-50 cursor-not-allowed': resendCooldown > 0 }"
                            @click="handleResendCode"
                        >
                            <template v-if="resendCooldown > 0">
                                {{ $t('deleteAccount.resendCodeIn', { seconds: resendCooldown }) }}
                            </template>
                            <template v-else>
                                {{ $t('deleteAccount.resendCode') }}
                            </template>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <template #footer>
            <div class="flex gap-2.5 justify-center w-full">
                <Button
                    color="gray"
                    variant="filled"
                    size="lg"
                    :label="$t('common.cancel')"
                    @click="handleCancel"
                />
                <Button
                    color="red"
                    variant="filled"
                    size="lg"
                    :label="isLoading ? $t('deleteAccount.deleteAccountButtonLoading') : $t('deleteAccount.deleteAccountButton')"
                    :disabled="!canSubmit"
                    :loading="isLoading"
                    @click="handleDelete"
                />
            </div>
        </template>
    </Modal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useApi } from '~/composables/useApi'
import { useToastNotification } from '~/composables/useToastNotification'

const props = defineProps<{
    reason: string
}>()

const { t } = useI18n()
const { post } = useApi()
const { error: showError, success } = useToastNotification()

const emit = defineEmits<{
    (e: 'cancel'): void
    (e: 'success', scheduledAt: string): void
}>()

interface FormData {
    company_name: string
    password: string
    code: string
}

const form = ref<FormData>({
    company_name: '',
    password: '',
    code: '',
})

const errors = ref<Record<string, string>>({})
const isLoading = ref(false)
const resendCooldown = ref(0)
let cooldownInterval: ReturnType<typeof setInterval> | null = null

const canSubmit = computed(() => {
    return (
        form.value.company_name.trim().length > 0 &&
        form.value.password.length >= 8 &&
        form.value.code.length >= 4
    )
})

const clearFieldError = (field: keyof FormData) => {
    errors.value[field] = ''
}

const startCooldown = () => {
    resendCooldown.value = 60
    cooldownInterval = setInterval(() => {
        resendCooldown.value--
        if (resendCooldown.value <= 0) {
            if (cooldownInterval) {
                clearInterval(cooldownInterval)
                cooldownInterval = null
            }
        }
    }, 1000)
}

const handleResendCode = async () => {
    if (resendCooldown.value > 0) return

    try {
        await post('/user/delete/request')
        success(t('deleteAccount.codeSent'))
        startCooldown()
    } catch (err: any) {
        const errorMessage = err.data?.message || err.message || t('deleteAccount.errors.resendFailed')
        showError(errorMessage)
    }
}

const validate = (): boolean => {
    errors.value = {}

    if (!form.value.company_name.trim()) {
        errors.value.company_name = t('deleteAccount.validation.companyNameRequired')
    }

    if (!form.value.password) {
        errors.value.password = t('deleteAccount.validation.passwordRequired')
    } else if (form.value.password.length < 8) {
        errors.value.password = t('deleteAccount.validation.passwordTooShort')
    }

    if (!form.value.code) {
        errors.value.code = t('deleteAccount.validation.confirmationCodeRequired')
    } else if (!/^\d{4,6}$/.test(form.value.code)) {
        errors.value.code = t('deleteAccount.validation.confirmationCodeInvalid')
    }

    return Object.keys(errors.value).length === 0
}

const handleCancel = () => {
    emit('cancel')
}

const handleDelete = async () => {
    if (!validate()) return

    isLoading.value = true

    try {
        const response = await post<{ success: boolean; scheduled_at: string }>('/user/delete/confirm', {
            code: form.value.code,
            password: form.value.password,
            company_name: form.value.company_name,
            reason: props.reason,
        })

        success(t('deleteAccount.successMessage'))
        emit('success', response.scheduled_at || '')
    } catch (err: any) {
        if (err.statusCode === 401) {
            errors.value.password = t('deleteAccount.validation.passwordIncorrect')
        } else if (err.statusCode === 400) {
            const message = err.data?.message || ''
            if (message.toLowerCase().includes('company')) {
                errors.value.company_name = t('deleteAccount.validation.companyNameMismatch')
            } else if (message.toLowerCase().includes('code') || message.toLowerCase().includes('verification')) {
                errors.value.code = t('deleteAccount.validation.confirmationCodeIncorrect')
            } else {
                showError(message || t('deleteAccount.errors.confirmFailed'))
            }
        } else if (err.statusCode === 410) {
            errors.value.code = t('deleteAccount.validation.confirmationCodeExpired')
        } else if (err.statusCode === 429) {
            showError(t('deleteAccount.errors.tooManyAttempts'))
        } else if (err.statusCode === 422 && err.data?.errors) {
            const backendErrors = err.data.errors
            Object.keys(backendErrors).forEach((field) => {
                const errorMessages = backendErrors[field]
                const message = Array.isArray(errorMessages) ? errorMessages[0] : errorMessages
                if (field === 'code' || field === 'password' || field === 'company_name') {
                    errors.value[field] = message
                }
            })
        } else {
            const errorMessage = err.data?.message || err.message || t('deleteAccount.errors.confirmFailed')
            showError(errorMessage)
        }
    } finally {
        isLoading.value = false
    }
}

onMounted(() => {
    startCooldown()
})

onUnmounted(() => {
    if (cooldownInterval) {
        clearInterval(cooldownInterval)
    }
})
</script>
