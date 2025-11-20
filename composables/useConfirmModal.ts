import { useModalStore } from '~/stores/modal'
import { useI18n } from 'vue-i18n'
import type { DetailItem } from '~/types/modal'

interface ConfirmationOptions {
    title: string
    message: string
    details?: DetailItem[]
    warningText?: string
    confirmText?: string
    cancelText?: string
    confirmColor?: 'blue' | 'red' | 'green' | 'yellow' | 'gray'
    iconType?: 'warning' | 'danger' | 'success' | 'info' | 'question'
    showIcon?: boolean
    contentWidth?: string
}

export const useConfirmation = () => {
    const modalStore = useModalStore()
    const { t } = useI18n()

    const showConfirmation = async (options: ConfirmationOptions): Promise<boolean> => {
        return new Promise(async (resolve) => {
            try {
                const ConfirmModal = await import('~/components/modals/ConfirmModal.vue').then(
                    (m) => m.default
                )

                modalStore.openModal(
                    ConfirmModal,
                    'info',
                    {
                        title: options.title,
                        message: options.message,
                        details: options.details || [],
                        warningText: options.warningText || '',
                        confirmText: options.confirmText || t('confirm'),
                        cancelText: options.cancelText || t('cancel'),
                        confirmColor: options.confirmColor || 'blue',
                        iconType: options.iconType || 'warning',
                        showIcon: false,
                    },
                    {
                        title: options.title,
                        hideFooter: false,
                        contentWidth: options.contentWidth || 'max-w-lg',
                        cancelText: options.cancelText || t('cancel'),
                        okText: options.confirmText || t('confirm'),
                        okColor: options.confirmColor || 'blue',
                        onOk: () => {
                            modalStore.closeModal()
                            resolve(true)
                        },
                        onClose: () => {
                            resolve(false)
                        },
                    }
                )
            } catch (error) {
                console.error('Error loading confirmation modal:', error)
                resolve(false)
            }
        })
    }

    return {
        showConfirmation,
    }
}
