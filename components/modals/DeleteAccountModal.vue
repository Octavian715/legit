<template>
    <div class="delete-account-modal">
        <!-- Header -->
        <div class="px-6 pt-6 pb-4 border-b border-gray-200">
            <div class="flex justify-between items-center">
                <h2 class="text-title3 font-semibold text-gray-900">
                    {{ $t('deleteAccount.modalTitle') }}
                </h2>
                <button
                    type="button"
                    class="text-gray-500 hover:text-gray-700 transition-colors"
                    :aria-label="$t('deleteAccount.closeModal')"
                    @click="handleCancel"
                >
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>

        <!-- Body -->
        <div class="px-6 py-6 max-h-[60vh] overflow-y-auto">
            <!-- Primary Message -->
            <p class="text-subtitle1 text-gray-900 mb-4">
                {{ $t('deleteAccount.sorryMessage') }}
            </p>

            <!-- Secondary Message -->
            <p class="text-subtitle2 text-gray-700 leading-relaxed mb-6">
                {{ $t('deleteAccount.feedbackMessage') }}
            </p>

            <!-- Question Label -->
            <p class="text-subtitle1 font-semibold text-gray-900 mb-4">
                {{ $t('deleteAccount.reasonQuestion') }}
            </p>

            <!-- Radio Group -->
            <div class="space-y-3" role="radiogroup" :aria-labelledby="'reason-question'">
                <div
                    v-for="reason in reasons"
                    :key="reason.value"
                    class="flex items-center py-3 px-4 rounded-md hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                    @click="selectedReason = reason.value"
                >
                    <Radiobox
                        v-model="selectedReason"
                        :value="reason.value"
                        :label="reason.label"
                        name="deleteReason"
                    />
                </div>
            </div>

            <!-- Conditional Text Area for "Other" reason -->
            <div v-if="selectedReason === 'other'" class="mt-4">
                <textarea
                    v-model="otherReasonText"
                    :placeholder="$t('deleteAccount.otherReasonPlaceholder')"
                    rows="4"
                    maxlength="500"
                    class="w-full p-3 border rounded-md bg-white text-subtitle2 text-gray-900
                           border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0
                           resize-none transition-colors duration-200"
                    :class="{ 'border-red-500': otherReasonError }"
                    :aria-label="$t('deleteAccount.otherReasonLabel')"
                    :aria-invalid="!!otherReasonError"
                ></textarea>
                <div v-if="otherReasonError" class="text-caption1 text-red-500 mt-1">
                    {{ otherReasonError }}
                </div>
                <div class="text-caption1 text-gray-500 text-right mt-1">
                    {{ otherReasonText.length }}/500
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
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
                :label="$t('common.next')"
                :disabled="!canProceed"
                :loading="isLoading"
                @click="handleNext"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useApi } from '~/composables/useApi'
import { useToastNotification } from '~/composables/useToastNotification'

const { t } = useI18n()
const { post } = useApi()
const { error: showError } = useToastNotification()

const emit = defineEmits<{
    (e: 'cancel'): void
    (e: 'next', reason: string): void
}>()

const selectedReason = ref<string>('')
const otherReasonText = ref('')
const otherReasonError = ref('')
const isLoading = ref(false)

const reasons = computed(() => [
    { value: 'no_longer_needed', label: t('deleteAccount.reasons.noLongerNeeded') },
    { value: 'unsatisfied_service', label: t('deleteAccount.reasons.unsatisfiedService') },
    { value: 'privacy_concerns', label: t('deleteAccount.reasons.privacyConcerns') },
    { value: 'too_many_notifications', label: t('deleteAccount.reasons.tooManyNotifications') },
    { value: 'negative_experience', label: t('deleteAccount.reasons.negativeExperience') },
    { value: 'high_fees', label: t('deleteAccount.reasons.highFees') },
    { value: 'switching_platform', label: t('deleteAccount.reasons.switchingPlatform') },
    { value: 'moderation_issues', label: t('deleteAccount.reasons.moderationIssues') },
    { value: 'remove_personal_data', label: t('deleteAccount.reasons.removePersonalData') },
    { value: 'data_breach_concerns', label: t('deleteAccount.reasons.dataBreachConcerns') },
    { value: 'other', label: t('deleteAccount.reasons.otherReason') },
])

const canProceed = computed(() => {
    if (!selectedReason.value) return false
    if (selectedReason.value === 'other') {
        return otherReasonText.value.trim().length >= 10
    }
    return true
})

const validateOtherReason = () => {
    if (selectedReason.value === 'other') {
        if (otherReasonText.value.trim().length < 10) {
            otherReasonError.value = t('deleteAccount.validation.reasonTooShort')
            return false
        }
        if (otherReasonText.value.length > 500) {
            otherReasonError.value = t('deleteAccount.validation.reasonTooLong')
            return false
        }
    }
    otherReasonError.value = ''
    return true
}

const handleCancel = () => {
    emit('cancel')
}

const handleNext = async () => {
    if (!validateOtherReason()) return

    isLoading.value = true

    try {
        // Request deletion code from API
        await post('/user/delete/request')

        // Get the reason to pass to next modal
        const reason = selectedReason.value === 'other'
            ? otherReasonText.value.trim()
            : selectedReason.value

        emit('next', reason)
    } catch (err: any) {
        const errorMessage = err.data?.message || err.message || t('deleteAccount.errors.requestFailed')
        showError(errorMessage)
    } finally {
        isLoading.value = false
    }
}
</script>

<style scoped>
.delete-account-modal {
    min-width: 400px;
    max-width: 672px;
}

@media (max-width: 640px) {
    .delete-account-modal {
        min-width: 100%;
    }
}
</style>
