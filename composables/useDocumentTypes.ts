import type { DocumentType } from '~/types/documents'
import type { DocumentTypeOption } from '~/types/order-form'

export const useDocumentTypes = () => {
    const { t } = useI18n()

    const documentTypes: DocumentTypeOption[] = [
        {
            value: 'offer',
            labelKey: 'orders.documentTypes.offer.label',
            descriptionKey: 'orders.documentTypes.offer.description',
            icon: 'handshake',
            availableFor: ['manufacturer', 'logistic'],
        },
        {
            value: 'delivery_note',
            labelKey: 'orders.documentTypes.deliveryNote.label',
            descriptionKey: 'orders.documentTypes.deliveryNote.description',
            icon: 'truck',
            availableFor: ['manufacturer', 'logistic'],
        },
        {
            value: 'invoice',
            labelKey: 'orders.documentTypes.invoice.label',
            descriptionKey: 'orders.documentTypes.invoice.description',
            icon: 'file-text',
            availableFor: ['manufacturer', 'logistic'],
        },
        {
            value: 'correction_invoice',
            labelKey: 'orders.documentTypes.correctionInvoice.label',
            descriptionKey: 'orders.documentTypes.correctionInvoice.description',
            icon: 'edit',
            availableFor: ['manufacturer', 'logistic'],
        },
    ]

    const getDocumentTypeConfig = (type: DocumentType): DocumentTypeOption | undefined => {
        return documentTypes.find((dt) => dt.value === type)
    }

    const getDocumentTypeLabel = (type: DocumentType): string => {
        const config = getDocumentTypeConfig(type)
        return config ? t(config.labelKey) : type
    }

    return {
        documentTypes,
        getDocumentTypeConfig,
        getDocumentTypeLabel,
    }
}
