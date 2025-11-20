<template>
    <div class="space-y-6 px-6 py-4 pb-0">
        <div class="flex justify-center mb-4">
            <div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                    class="w-10 h-10 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            </div>
        </div>

        <div class="text-center space-y-3">
            <p class="text-subtitle2 text-gray-950 leading-relaxed">
                {{ message }}
            </p>
            <p v-if="additionalInfo" class="text-subtitle3 text-gray-800">
                {{ additionalInfo }}
            </p>
        </div>

        <!-- <div class="flex justify-center gap-3">
            <Button
                v-if="showContactSupport"
                variant="outline"
                color="blue"
                size="lg"
                :label="$t('contactSupport', 'Contact Support')"
                @click="handleContactSupport"
            />
            <Button
                variant="filled"
                color="red"
                size="lg"
                :label="
                    closeButtonLabel || $t('register.backToRegistration', 'Back to Registration')
                "
                @click="handleClose"
            />
        </div> -->
    </div>
</template>

<script setup lang="ts">
    import { useI18n } from 'vue-i18n'

    interface ComingSoonModalProps {
        message?: string
        additionalInfo?: string
        showContactSupport?: boolean
        closeButtonLabel?: string
    }

    const props = withDefaults(defineProps<ComingSoonModalProps>(), {
        message: '',
        additionalInfo: '',
        showContactSupport: false,
        closeButtonLabel: '',
    })

    const emit = defineEmits<{
        confirm: []
        cancel: []
    }>()

    const { t } = useI18n({ useScope: 'global' })

    // const handleContactSupport = (): void => {
    //     window.location.href = 'mailto:support@lemarkt.com?subject=Email Verification Issue'
    // }

    // const handleClose = (): void => {
    //     emit('cancel')
    // }
</script>
