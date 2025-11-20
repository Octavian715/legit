import { ref, readonly } from 'vue'
import { useI18n } from 'vue-i18n'
import { useModalStore } from '~/stores/modal'
import { useDocumentsStore } from '~/stores/documents'
import { useToastNotification } from '~/composables/useToastNotification'
import { useStaticData } from '~/composables/useStaticData'

export const useOrderActions = () => {
    const { t } = useI18n()
    const modalStore = useModalStore()
    const documentsStore = useDocumentsStore()
    const toast = useToastNotification()
    const { documentStatusOptions } = useStaticData()

    const isLoading = ref(false)
    const error = ref<string | null>(null)

    const resetError = () => {
        error.value = null
    }

    const handleError = (e: any) => {
        const errorMessage = e.data?.message || e.message || t('orders.errors.genericError')
        error.value = errorMessage
        console.error('Order action error:', e)
        return errorMessage
    }

    const downloadOrder = async (orderId: number, orderNumber?: string): Promise<boolean> => {
        resetError()
        isLoading.value = true

        try {
            const success = await documentsStore.downloadPdf(
                orderId,
                `order-${orderNumber || orderId}.pdf`
            )

            if (success) {
                toast.success(t('orders.notifications.downloadSuccess'))
                return true
            }

            throw new Error('Download failed')
        } catch (e: any) {
            const message = handleError(e)
            toast.error(message || t('orders.notifications.downloadFailed'))
            return false
        } finally {
            isLoading.value = false
        }
    }

    const deleteOrder = async (orderId: number): Promise<boolean> => {
        resetError()
        isLoading.value = true

        try {
            const success = await documentsStore.deleteDocument(orderId)

            if (success) {
                return true
            }

            throw new Error('Delete failed')
        } catch (e: any) {
            const message = handleError(e)
            toast.error(message || t('orders.notifications.deleteFailed'))
            return false
        } finally {
            isLoading.value = false
        }
    }

    const confirmOrder = async (orderId: number): Promise<boolean> => {
        resetError()
        isLoading.value = true

        try {
            const success = await documentsStore.confirmDocument(orderId)

            if (success) {
                return true
            }

            throw new Error('Confirm failed')
        } catch (e: any) {
            const message = handleError(e)
            toast.error(message || t('orders.notifications.confirmFailed'))
            return false
        } finally {
            isLoading.value = false
        }
    }

    const rejectOrder = async (orderId: number): Promise<boolean> => {
        resetError()
        isLoading.value = true

        try {
            const success = await documentsStore.rejectDocument(orderId)

            if (success) {
                return true
            }

            throw new Error('Reject failed')
        } catch (e: any) {
            const message = handleError(e)
            toast.error(message || t('orders.notifications.rejectFailed'))
            return false
        } finally {
            isLoading.value = false
        }
    }

    const approveOrder = async (orderId: number): Promise<boolean> => {
        resetError()
        isLoading.value = true

        const approvedStatusId =
            documentStatusOptions.value.find((s) => s.code === 'approved')?.value || 2

        try {
            const result = await documentsStore.updateDocument(orderId, {
                status_id: approvedStatusId,
            })

            if (result) {
                return true
            }

            throw new Error('Approve failed')
        } catch (e: any) {
            const message = handleError(e)
            toast.error(message || t('orders.notifications.approveFailed'))
            return false
        } finally {
            isLoading.value = false
        }
    }

    const declineOrder = async (orderId: number): Promise<boolean> => {
        resetError()
        isLoading.value = true

        const declinedStatusId =
            documentStatusOptions.value.find((s) => s.code === 'declined')?.value || 5

        try {
            const result = await documentsStore.updateDocument(orderId, {
                status_id: declinedStatusId,
            })

            if (result) {
                return true
            }

            throw new Error('Decline failed')
        } catch (e: any) {
            const message = handleError(e)
            toast.error(message || t('orders.notifications.declineFailed'))
            return false
        } finally {
            isLoading.value = false
        }
    }

    const resetOrder = async (orderId: number): Promise<boolean> => {
        resetError()
        isLoading.value = true

        const activeStatusId =
            documentStatusOptions.value.find((s) => s.code === 'active')?.value || 1

        try {
            const result = await documentsStore.updateDocument(orderId, {
                status_id: activeStatusId,
            })

            if (result) {
                return true
            }

            throw new Error('Reset failed')
        } catch (e: any) {
            const message = handleError(e)
            toast.error(message || t('orders.notifications.resetFailed'))
            return false
        } finally {
            isLoading.value = false
        }
    }

    const updateOrderStatus = async (
        orderId: number,
        statusId?: number,
        paymentStatusId?: number
    ): Promise<boolean> => {
        resetError()
        isLoading.value = true

        try {
            const updateData: any = {}

            if (statusId !== undefined) {
                updateData.status_id = statusId
            }

            if (paymentStatusId !== undefined) {
                updateData.payment_status_id = paymentStatusId
            }

            const result = await documentsStore.updateDocument(orderId, updateData)

            if (result) {
                toast.success(t('orders.notifications.updateSuccess'))
                return true
            }

            throw new Error('Update failed')
        } catch (e: any) {
            const message = handleError(e)
            toast.error(message || t('orders.notifications.updateFailed'))
            return false
        } finally {
            isLoading.value = false
        }
    }

    const showDeleteConfirmation = async (
        orderNumber: string,
        orderId: number
    ): Promise<boolean> => {
        return new Promise(async (resolve) => {
            try {
                const moduleImport = await import('~/components/modals/OrderConfirmationModal.vue')
                const OrderConfirmationModal = moduleImport.default

                let isProcessing = false

                modalStore.openModal(
                    OrderConfirmationModal,
                    'deleteOrderConfirmation',
                    {
                        orderNumber,
                        orderId,
                        action: 'delete',
                        isLoading: isProcessing,
                    },
                    {
                        title: t('orders.modal.delete.title'),
                        contentWidth: 'max-w-sm sm:max-w-md',
                        hideFooter: true,
                        hideHeader: true,
                        persistent: isProcessing,
                        onOk: async () => {
                            if (isProcessing) return
                            isProcessing = true

                            try {
                                const result = await deleteOrder(orderId)
                                if (result) {
                                    toast.success(t('orders.notifications.deleteSuccess'))
                                }
                                resolve(result)
                            } catch (error) {
                                resolve(false)
                            } finally {
                                isProcessing = false
                                modalStore.closeModal()
                            }
                        },
                        onClose: () => {
                            if (!isProcessing) {
                                resolve(false)
                            }
                        },
                    }
                )
            } catch (error) {
                toast.error(t('orders.errors.modalLoadFailed'))
                resolve(false)
            }
        })
    }

    const showConfirmConfirmation = async (
        orderNumber: string,
        orderId: number
    ): Promise<boolean> => {
        return new Promise(async (resolve) => {
            try {
                const moduleImport = await import('~/components/modals/OrderConfirmationModal.vue')
                const OrderConfirmationModal = moduleImport.default

                let isProcessing = false

                modalStore.openModal(
                    OrderConfirmationModal,
                    'confirmOrderConfirmation',
                    {
                        orderNumber,
                        orderId,
                        action: 'confirm',
                        isLoading: isProcessing,
                    },
                    {
                        title: t('orders.modal.confirm.title'),
                        contentWidth: 'max-w-sm sm:max-w-md',
                        hideFooter: true,
                        hideHeader: true,
                        persistent: isProcessing,
                        onOk: async () => {
                            if (isProcessing) return
                            isProcessing = true

                            try {
                                const result = await confirmOrder(orderId)
                                if (result) {
                                    toast.success(t('orders.notifications.confirmSuccess'))
                                }
                                resolve(result)
                            } catch (error) {
                                resolve(false)
                            } finally {
                                isProcessing = false
                                modalStore.closeModal()
                            }
                        },
                        onClose: () => {
                            if (!isProcessing) {
                                resolve(false)
                            }
                        },
                    }
                )
            } catch (error) {
                toast.error(t('orders.errors.modalLoadFailed'))
                resolve(false)
            }
        })
    }

    const showRejectConfirmation = async (
        orderNumber: string,
        orderId: number
    ): Promise<boolean> => {
        return new Promise(async (resolve) => {
            try {
                const moduleImport = await import('~/components/modals/OrderConfirmationModal.vue')
                const OrderConfirmationModal = moduleImport.default

                let isProcessing = false

                modalStore.openModal(
                    OrderConfirmationModal,
                    'rejectOrderConfirmation',
                    {
                        orderNumber,
                        orderId,
                        action: 'reject',
                        isLoading: isProcessing,
                    },
                    {
                        title: t('orders.modal.reject.title'),
                        contentWidth: 'max-w-sm sm:max-w-md',
                        hideFooter: true,
                        hideHeader: true,
                        persistent: isProcessing,
                        onOk: async () => {
                            if (isProcessing) return
                            isProcessing = true

                            try {
                                const result = await rejectOrder(orderId)
                                if (result) {
                                    toast.success(t('orders.notifications.rejectSuccess'))
                                }
                                resolve(result)
                            } catch (error) {
                                resolve(false)
                            } finally {
                                isProcessing = false
                                modalStore.closeModal()
                            }
                        },
                        onClose: () => {
                            if (!isProcessing) {
                                resolve(false)
                            }
                        },
                    }
                )
            } catch (error) {
                toast.error(t('orders.errors.modalLoadFailed'))
                resolve(false)
            }
        })
    }

    const showApproveConfirmation = async (
        orderNumber: string,
        orderId: number
    ): Promise<boolean> => {
        return new Promise(async (resolve) => {
            try {
                const moduleImport = await import('~/components/modals/OrderConfirmationModal.vue')
                const OrderConfirmationModal = moduleImport.default

                let isProcessing = false

                modalStore.openModal(
                    OrderConfirmationModal,
                    'approveOrderConfirmation',
                    {
                        orderNumber,
                        orderId,
                        action: 'approve',
                        isLoading: isProcessing,
                    },
                    {
                        title: t('orders.modal.approve.title'),
                        contentWidth: 'max-w-sm sm:max-w-md',
                        hideFooter: true,
                        hideHeader: true,
                        persistent: isProcessing,
                        onOk: async () => {
                            if (isProcessing) return
                            isProcessing = true

                            try {
                                const result = await approveOrder(orderId)
                                if (result) {
                                    toast.success(t('orders.notifications.approveSuccess'))
                                }
                                resolve(result)
                            } catch (error) {
                                resolve(false)
                            } finally {
                                isProcessing = false
                                modalStore.closeModal()
                            }
                        },
                        onClose: () => {
                            if (!isProcessing) {
                                resolve(false)
                            }
                        },
                    }
                )
            } catch (error) {
                toast.error(t('orders.errors.modalLoadFailed'))
                resolve(false)
            }
        })
    }

    const showDeclineConfirmation = async (
        orderNumber: string,
        orderId: number
    ): Promise<boolean> => {
        return new Promise(async (resolve) => {
            try {
                const moduleImport = await import('~/components/modals/OrderConfirmationModal.vue')
                const OrderConfirmationModal = moduleImport.default

                let isProcessing = false

                modalStore.openModal(
                    OrderConfirmationModal,
                    'declineOrderConfirmation',
                    {
                        orderNumber,
                        orderId,
                        action: 'decline',
                        isLoading: isProcessing,
                    },
                    {
                        title: t('orders.modal.decline.title'),
                        contentWidth: 'max-w-sm sm:max-w-md',
                        hideFooter: true,
                        hideHeader: true,
                        persistent: isProcessing,
                        onOk: async () => {
                            if (isProcessing) return
                            isProcessing = true

                            try {
                                const result = await declineOrder(orderId)
                                if (result) {
                                    toast.success(t('orders.notifications.declineSuccess'))
                                }
                                resolve(result)
                            } catch (error) {
                                resolve(false)
                            } finally {
                                isProcessing = false
                                modalStore.closeModal()
                            }
                        },
                        onClose: () => {
                            if (!isProcessing) {
                                resolve(false)
                            }
                        },
                    }
                )
            } catch (error) {
                toast.error(t('orders.errors.modalLoadFailed'))
                resolve(false)
            }
        })
    }

    const showResetConfirmation = async (
        orderNumber: string,
        orderId: number
    ): Promise<boolean> => {
        return new Promise(async (resolve) => {
            try {
                const moduleImport = await import('~/components/modals/OrderConfirmationModal.vue')
                const OrderConfirmationModal = moduleImport.default

                let isProcessing = false

                modalStore.openModal(
                    OrderConfirmationModal,
                    'resetOrderConfirmation',
                    {
                        orderNumber,
                        orderId,
                        action: 'reset',
                        isLoading: isProcessing,
                    },
                    {
                        title: t('orders.modal.reset.title'),
                        contentWidth: 'max-w-sm sm:max-w-md',
                        hideFooter: true,
                        hideHeader: true,
                        persistent: isProcessing,
                        onOk: async () => {
                            if (isProcessing) return
                            isProcessing = true

                            try {
                                const result = await resetOrder(orderId)
                                if (result) {
                                    toast.success(t('orders.notifications.resetSuccess'))
                                }
                                resolve(result)
                            } catch (error) {
                                resolve(false)
                            } finally {
                                isProcessing = false
                                modalStore.closeModal()
                            }
                        },
                        onClose: () => {
                            if (!isProcessing) {
                                resolve(false)
                            }
                        },
                    }
                )
            } catch (error) {
                toast.error(t('orders.errors.modalLoadFailed'))
                resolve(false)
            }
        })
    }

    return {
        isLoading: readonly(isLoading),
        error: readonly(error),

        downloadOrder,
        deleteOrder,
        confirmOrder,
        rejectOrder,
        approveOrder,
        declineOrder,
        resetOrder,
        updateOrderStatus,

        showDeleteConfirmation,
        showConfirmConfirmation,
        showRejectConfirmation,
        showApproveConfirmation,
        showDeclineConfirmation,
        showResetConfirmation,

        resetError,
    }
}
