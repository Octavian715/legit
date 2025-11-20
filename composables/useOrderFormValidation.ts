import { ref, computed } from 'vue'
import type { OrderFormData } from '~/types/order-form'

export const useOrderFormValidation = (formData: Ref<OrderFormData>) => {
    const { t } = useI18n()
    const errors = ref<Record<string, string>>({})
    const hasValidated = ref(false)

    const hasErrors = computed(() => Object.keys(errors.value).length > 0)

    const BACKEND_TO_FRONTEND_FIELD_MAP: Record<string, string> = {
        type: 'type',
        buyer_id: 'buyerId',
        currency_id: 'currencyId',
        date: 'date',
        title: 'title',
        subtitle: 'subtitle',
        document_notes: 'documentNotes',
        document_commentary: 'documentCommentary',
        items: 'items',
        delivery_location_id: 'deliveryLocationId',
        'delivery_detail.contact_name': 'deliveryDetail.contactName',
        'delivery_detail.phone_number': 'deliveryDetail.phoneNumber',
        'delivery_detail.phone_country_id': 'deliveryDetail.phoneCountryId',
        'delivery_detail.country_id': 'deliveryDetail.countryId',
        'delivery_detail.state_name': 'deliveryDetail.stateName',
        'delivery_detail.city_name': 'deliveryDetail.cityName',
        'delivery_detail.street_name': 'deliveryDetail.streetName',
        'delivery_detail.street_number': 'deliveryDetail.streetNumber',
        'delivery_detail.postal_code': 'deliveryDetail.postalCode',
    }

    const validateField = (fieldPath: string) => {
        if (!hasValidated.value) return

        delete errors.value[fieldPath]

        const pathParts = fieldPath.split('.')

        if (pathParts[0] === 'items' && pathParts.length > 1) {
            const index = parseInt(pathParts[1])
            if (!isNaN(index) && formData.value.items[index]) {
                validateItem(index)
            }
            return
        }

        if (pathParts[0] === 'deliveryDetail' && formData.value.hasCustomDelivery) {
            validateDeliveryDetail()
            return
        }

        validateBasicField(fieldPath)
    }

    const validateBasicField = (fieldPath: string) => {
        const value = formData.value[fieldPath as keyof OrderFormData]

        switch (fieldPath) {
            case 'type':
                if (!formData.value.type) {
                    errors.value.type = t('validation.required', {
                        field: t('orders.sections.buyerData.documentType'),
                    })
                }
                break

            case 'buyerId':
                if (!formData.value.buyerId || formData.value.buyerId < 1) {
                    errors.value.buyerId = t('validation.required', {
                        field: t('orders.sections.buyerData.buyerCompany'),
                    })
                }
                break

            case 'currencyId':
                if (!formData.value.currencyId || formData.value.currencyId < 1) {
                    errors.value.currencyId = t('validation.required', {
                        field: t('orders.sections.buyerData.currency'),
                    })
                }
                break

            case 'date':
                if (!formData.value.date || formData.value.date.trim() === '') {
                    errors.value.date = t('validation.required', {
                        field: t('orders.sections.buyerData.date'),
                    })
                }
                break
        }
    }

    const validateItem = (index: number) => {
        const item = formData.value.items[index]
        const prefix = `items.${index}`

        if (!item.name || item.name.trim() === '') {
            errors.value[`${prefix}.name`] = t('orders.validation.item.nameRequired')
        }

        if (!item.sku || item.sku.trim() === '') {
            errors.value[`${prefix}.sku`] = t('orders.validation.item.skuRequired')
        }

        if (!item.quantityUnitId || item.quantityUnitId <= 0) {
            errors.value[`${prefix}.quantityUnitId`] = t('orders.validation.item.unitRequired')
        }

        const quantity = Number(item.quantity)
        if (isNaN(quantity) || quantity <= 0) {
            errors.value[`${prefix}.quantity`] = t('orders.validation.item.quantityRequired')
        }

        const unitPrice = Number(item.unitPrice)
        if (isNaN(unitPrice) || unitPrice <= 0) {
            errors.value[`${prefix}.unitPrice`] = t('orders.validation.item.unitPriceRequired')
        }

        const vatPercent = Number(item.vatPercent)
        if (isNaN(vatPercent) || vatPercent < 0 || vatPercent > 100) {
            errors.value[`${prefix}.vatPercent`] = t('orders.validation.item.vatInvalid')
        }

        const discountPercent = Number(item.discountPercent)
        if (isNaN(discountPercent) || discountPercent < 0 || discountPercent > 100) {
            errors.value[`${prefix}.discountPercent`] = t('orders.validation.item.discountInvalid')
        }
    }

    const validateItems = (): boolean => {
        if (!formData.value.items || formData.value.items.length === 0) {
            errors.value.items = t('orders.validation.atLeastOneItem')
            return false
        }

        let hasErrors = false

        formData.value.items.forEach((item, index) => {
            const itemErrors: string[] = []

            const quantity = Number(item.quantity)
            if (isNaN(quantity) || quantity <= 0) {
                itemErrors.push(t('orders.validation.item.quantityRequired'))
                hasErrors = true
            }

            const unitPrice = Number(item.unitPrice)
            if (isNaN(unitPrice) || unitPrice <= 0) {
                itemErrors.push(t('orders.validation.item.unitPriceRequired'))
                hasErrors = true
            }

            const vatPercent = Number(item.vatPercent)
            if (isNaN(vatPercent) || vatPercent < 0 || vatPercent > 100) {
                itemErrors.push(t('orders.validation.item.vatInvalid'))
                hasErrors = true
            }

            const discountPercent = Number(item.discountPercent)
            if (isNaN(discountPercent) || discountPercent < 0 || discountPercent > 100) {
                itemErrors.push(t('orders.validation.item.discountInvalid'))
                hasErrors = true
            }

            if (!item.name || item.name.trim() === '') {
                itemErrors.push(t('orders.validation.item.nameRequired'))
                hasErrors = true
            }

            if (!item.sku || item.sku.trim() === '') {
                itemErrors.push(t('orders.validation.item.skuRequired'))
                hasErrors = true
            }

            if (!item.quantityUnitId || item.quantityUnitId <= 0) {
                itemErrors.push(t('orders.validation.item.unitRequired'))
                hasErrors = true
            }

            if (itemErrors.length > 0) {
                errors.value[`items.${index}`] = itemErrors.join(', ')
            }
        })

        if (hasErrors) {
            errors.value.items = t('orders.validation.itemsHaveErrors')
        }

        return !hasErrors
    }

    const validateDeliveryDetail = () => {
        if (!formData.value.deliveryDetail) return

        const detail = formData.value.deliveryDetail
        const prefix = 'deliveryDetail'

        if (!detail.contactName || detail.contactName.trim().length < 2) {
            errors.value[`${prefix}.contactName`] = t('validation.stringMinLength', {
                field: t('company.contactPerson'),
                min: 2,
            })
        }

        if (!detail.phoneNumber || detail.phoneNumber.trim().length < 5) {
            errors.value[`${prefix}.phoneNumber`] = t('validation.stringMinLength', {
                field: t('phoneNumber'),
                min: 5,
            })
        }

        if (!detail.phoneCountryId) {
            errors.value[`${prefix}.phoneCountryId`] = t('validation.required', {
                field: t('phoneCountry', 'Phone Country'),
            })
        }

        if (!detail.countryId || detail.countryId < 1) {
            errors.value[`${prefix}.countryId`] = t('validation.required', {
                field: t('country'),
            })
        }

        if (!detail.cityName || detail.cityName.trim().length < 2) {
            errors.value[`${prefix}.cityName`] = t('validation.stringMinLength', {
                field: t('city'),
                min: 2,
            })
        }

        if (!detail.streetName || detail.streetName.trim().length < 2) {
            errors.value[`${prefix}.streetName`] = t('validation.stringMinLength', {
                field: t('orders.sections.deliveryLocation.streetName'),
                min: 2,
            })
        }

        if (!detail.streetNumber || detail.streetNumber.trim().length < 1) {
            errors.value[`${prefix}.streetNumber`] = t('validation.required', {
                field: t('orders.sections.deliveryLocation.streetNumber'),
            })
        }

        if (!detail.postalCode || detail.postalCode.trim().length < 3) {
            errors.value[`${prefix}.postalCode`] = t('validation.stringMinLength', {
                field: t('company.postalCode'),
                min: 3,
            })
        }
    }

    const validateForm = (): boolean => {
        hasValidated.value = true
        errors.value = {}

        if (!formData.value.type) {
            errors.value.type = t('validation.required', {
                field: t('orders.sections.buyerData.documentType'),
            })
        }

        if (!formData.value.buyerId || formData.value.buyerId < 1) {
            errors.value.buyerId = t('validation.required', {
                field: t('orders.sections.buyerData.buyerCompany'),
            })
        }

        if (!formData.value.currencyId || formData.value.currencyId < 1) {
            errors.value.currencyId = t('validation.required', {
                field: t('orders.sections.buyerData.currency'),
            })
        }

        if (!formData.value.date || formData.value.date.trim() === '') {
            errors.value.date = t('validation.required', {
                field: t('orders.sections.buyerData.date'),
            })
        }

        if (!formData.value.items || formData.value.items.length === 0) {
            errors.value.items = t('orders.validation.atLeastOneItem')
        }

        if (formData.value.hasCustomDelivery && formData.value.deliveryDetail) {
            validateDeliveryDetail()
        }

        return Object.keys(errors.value).length === 0
    }

    const setBackendErrors = (backendErrors: Record<string, string[] | string>) => {
        Object.entries(backendErrors).forEach(([field, messages]) => {
            const message = Array.isArray(messages) ? messages[0] : messages
            const frontendField = BACKEND_TO_FRONTEND_FIELD_MAP[field] || field
            errors.value[frontendField] = message
        })
    }

    const getFieldError = (fieldPath: string): string => {
        return errors.value[fieldPath] || ''
    }

    const clearFieldError = (fieldPath: string) => {
        delete errors.value[fieldPath]
    }

    const clearAllErrors = () => {
        errors.value = {}
        hasValidated.value = false
    }

    return {
        errors,
        hasErrors,
        hasValidated,
        validateField,
        validateForm,
        validateItems,
        setBackendErrors,
        getFieldError,
        clearFieldError,
        clearAllErrors,
    }
}
