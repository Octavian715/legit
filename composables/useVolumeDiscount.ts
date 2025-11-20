import { useModalStore } from '~/stores/modal'
import { useI18n } from 'vue-i18n'

interface VolumeDiscountData {
    quantityFrom: number
    localPrice: number
    exportPrice: number | null
}

interface VolumeDiscountOptions {
    localCurrency: string
    exportCurrency?: string
    hasExport: boolean
    existingData?: VolumeDiscountData
    existingQuantities?: number[]
}

export const useVolumeDiscount = () => {
    const modalStore = useModalStore()
    const { t } = useI18n()

    const showVolumeDiscountModal = async (
        options: VolumeDiscountOptions
    ): Promise<VolumeDiscountData | null> => {
        return new Promise(async (resolve) => {
            try {
                const VolumeDiscountModal = await import(
                    '~/components/features/supplier/sku/modals/VolumeDiscountModal.vue'
                ).then((m) => m.default)

                modalStore.openModal(
                    VolumeDiscountModal,
                    'info',
                    {
                        localCurrency: options.localCurrency,
                        exportCurrency: options.exportCurrency || '',
                        hasExport: options.hasExport,
                        existingData: options.existingData,
                        existingQuantities: options.existingQuantities || [],
                    },
                    {
                        title: t('product.addQuantityDiscount'),
                        hideFooter: false,
                        contentWidth: 'max-w-md',
                        cancelText: t('cancel'),
                        okText: t('add'),
                        okColor: 'red',
                        persistent: false,
                        onOk: (data: VolumeDiscountData) => {
                            resolve(data)
                            modalStore.closeModal()
                        },
                        onClose: () => {
                            resolve(null)
                        },
                    }
                )
            } catch (error) {
                console.error('Error loading volume discount modal:', error)
                resolve(null)
            }
        })
    }

    return {
        showVolumeDiscountModal,
    }
}
