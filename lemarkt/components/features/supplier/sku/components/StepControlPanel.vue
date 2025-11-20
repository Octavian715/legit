<template>
    <div class="sticky bottom-0 bg-white px-6 py-4 rounded z-[4]">
        <div class="flex items-center justify-start space-x-2">
            <!-- Back Button -->
            <div class="flex items-center space-x-3">
                <Button
                    v-if="canGoBack"
                    :label="t('prevStep')"
                    color="gray"
                    variant="filled"
                    icon="arrow-left"
                    :disabled="isLoading"
                    @click="$emit('previous')"
                />
                <div v-else class="w-24"></div>
            </div>

            <!-- Next/Complete Button -->
            <Button
                v-if="!isLastStep && !isImportStep"
                :label="t('nextStep')"
                variant="filled"
                color="red"
                icon="arrow-right"
                icon-position="right"
                :disabled="!isValid || isLoading"
                :loading="isLoading"
                @click="$emit('next')"
            />

            <Button
                v-else-if="isImportStep"
                :label="t('product.import.uploadProducts')"
                variant="filled"
                color="blue"
                icon="upload"
                :disabled="!isValid || isLoading"
                :loading="isLoading"
                @click="$emit('complete')"
            />

            <Button
                v-else
                :label="t('completeProduct')"
                variant="filled"
                color="blue"
                icon="check"
                :disabled="!isValid || isLoading"
                :loading="isLoading"
                @click="$emit('complete')"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
    interface Props {
        currentStep: string
        currentStepIndex: number
        totalSteps: number
        canGoBack: boolean
        canGoForward: boolean
        isValid: boolean
        isLoading?: boolean
        isLastStep: boolean
    }

    const props = defineProps<Props>()

    const emit = defineEmits<{
        previous: []
        next: []
        'save-draft': []
        complete: []
    }>()

    const { t } = useI18n()

    const isImportStep = computed(() => props.currentStep === 'import')
</script>
