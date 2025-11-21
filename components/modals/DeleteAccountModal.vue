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
            <!-- Primary Message -->
            <p class="text-subtitle1 text-gray-900">
                {{ $t('deleteAccount.sorryMessage') }}
            </p>

            <!-- Secondary Message -->
            <p class="text-subtitle2 text-gray-700 leading-relaxed">
                {{ $t('deleteAccount.feedbackMessage') }}
            </p>

            <!-- Question Label -->
            <p class="text-subtitle1 font-semibold text-gray-900">
                {{ $t('deleteAccount.reasonQuestion') }}
            </p>

            <!-- Radio Group -->
            <div class="space-y-2 max-h-[40vh] overflow-y-auto" role="radiogroup">
                <div
                    v-for="reason in reasons"
                    :key="reason.value"
                    class="py-2 px-3 rounded hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
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
            <div v-if="selectedReason === 'other'" class="space-y-1">
                <textarea
                    v-model="otherReasonText"
                    :placeholder="$t('deleteAccount.otherReasonPlaceholder')"
                    rows="3"
                    maxlength="500"
                    class="w-full p-3 border rounded bg-white text-subtitle2 text-gray-900
                           border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                           resize-none transition-colors duration-200"
                    :class="{ 'border-red-500': otherReasonError }"
                    :aria-label="$t('deleteAccount.otherReasonLabel')"
                ></textarea>
                <div v-if="otherReasonError" class="text-caption1 text-red-500">
                    {{ otherReasonError }}
                </div>
                <div class="text-caption1 text-gray-600 text-right">
                    {{ otherReasonText.length }}/500
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
                    :label="$t('common.next')"
                    :disabled="!canProceed"
                    :loading="isLoading"
                    @click="handleNext"
                />
            </div>
        </template>
    </Modal>
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
        await post('/user/delete/request')

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
