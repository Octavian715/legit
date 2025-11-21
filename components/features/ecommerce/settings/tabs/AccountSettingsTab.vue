<template>
    <div class="account-settings-tab space-y-3">
        <h2 class="text-subtitle3 text-gray-800 mb-3">
            {{ $t('settings.account.changePassword') }}
        </h2>

        <section class="grid gap-3 max-w-md">
            <Input
                v-model="form.current_password"
                :label="$t('settings.account.currentPassword')"
                type="password"
                name="current_password"
                background="bg-white"
                size="lg"
                class="w-f"
                required
                :error="!!errors.current_password"
                :error-message="errors.current_password"
                @input="clearFieldError('current_password')"
            />

            <Input
                v-model="form.new_password"
                :label="$t('settings.account.newPassword')"
                type="password"
                name="new_password"
                background="bg-white"
                size="lg"
                required
                :error="!!errors.new_password"
                :error-message="errors.new_password"
                @input="clearFieldError('new_password')"
            />

            <Input
                v-model="form.new_password_confirmation"
                :label="$t('settings.account.confirmPassword')"
                type="password"
                name="new_password_confirmation"
                background="bg-white"
                size="lg"
                required
                :error="!!errors.new_password_confirmation"
                :error-message="errors.new_password_confirmation"
                @input="clearFieldError('new_password_confirmation')"
            />

            <Checkbox
                v-model="form.logout_other_devices"
                :label="$t('settings.account.logoutOtherDevices')"
                name="logout_other_devices"
                @update:model-value="clearFieldError('logout_other_devices')"
            />
        </section>
    </div>
</template>

<script setup lang="ts">
    import { ref, watch, onMounted } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useUserStore } from '~/stores/user'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { validator } from '~/utils/validator/index'
    import { accountSettingsSchema } from '~/utils/validator/schemas/user/accountSettings'

    const { t } = useI18n()
    const userStore = useUserStore()
    const { error: showError, success } = useToastNotification()

    const isDirty = ref(false)
    const form = ref<PasswordData>({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
        logout_other_devices: false,
    })
    const errors = ref<Record<string, string>>({})

    const validate = () => {
        // Clear previous errors
        errors.value = {}

        const result = validator.validate('accountSettings', accountSettingsSchema, form.value)
        if (!result.isValid) {
            result.errors.forEach((err) => {
                errors.value[err.field] = err.message
            })
        }
        return { isValid: result.isValid, errors: Object.values(errors.value) }
    }

    const save = async () => {
        const validation = validate()
        if (!validation.isValid) {
            showError(t('settings.errorSavingChanges'))
            return false
        }

        try {
            await userStore.updateProfile({ password_data: form.value })
            form.value = {
                current_password: '',
                new_password: '',
                new_password_confirmation: '',
                logout_other_devices: false,
            }
            isDirty.value = false
            return true
        } catch (err: any) {
            // Handle backend validation errors (4XX)
            if (err.data && err.data.errors) {
                // Laravel validation errors format
                const backendErrors = err.data.errors

                // Map backend errors to form fields
                Object.keys(backendErrors).forEach((field) => {
                    const errorMessages = backendErrors[field]
                    const message = Array.isArray(errorMessages) ? errorMessages[0] : errorMessages

                    // Map backend field names to frontend field names
                    if (
                        field === 'password_data.current_password' ||
                        field === 'current_password'
                    ) {
                        errors.value.current_password = message
                    } else if (field === 'password_data.new_password' || field === 'new_password') {
                        errors.value.new_password = message
                    } else if (
                        field === 'password_data.new_password_confirmation' ||
                        field === 'new_password_confirmation'
                    ) {
                        errors.value.new_password_confirmation = message
                    } else if (
                        field === 'password_data.logout_other_devices' ||
                        field === 'logout_other_devices'
                    ) {
                        errors.value.logout_other_devices = message
                    }
                })

                // Show toast with general error message if available
                // const errorMessage =
                //     err.data.message ||
                //     t('validation.pleaseFixErrors', 'Please fix the errors before saving')
                // showError(errorMessage)
            } else {
                // Generic error handling
                const errorMessage =
                    err.data?.message || err.message || t('settings.errorSavingChanges')
                showError(errorMessage)
            }

            return false
        }
    }

    const reset = () => {
        form.value = {
            current_password: '',
            new_password: '',
            new_password_confirmation: '',
            logout_other_devices: false,
        }
        errors.value = {}
        isDirty.value = false
    }

    const clearFieldError = (field: keyof PasswordData) => {
        errors.value[field] = ''
    }

    watch(form, () => (isDirty.value = true), { deep: true })

    defineExpose({ save, validate, reset, isDirty })
</script>

<style scoped>
    .account-settings-tab {
        min-height: 400px;
    }
</style>
