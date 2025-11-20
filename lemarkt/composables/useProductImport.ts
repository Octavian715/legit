// composables/useProductImport.ts
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ProductService } from '~/services/product'
import { useToastNotification } from '~/composables/useToastNotification'
import type { ProductImportResponse } from '~/types/product'

export const useProductImport = () => {
    const { t } = useI18n()
    const toast = useToastNotification()
    const productService = new ProductService()

    const isUploading = ref(false)
    const isDownloadingTemplate = ref(false)
    const uploadProgress = ref(0)
    const importResult = ref<ProductImportResponse | null>(null)
    const importErrors = ref<Record<string, string[]>>({})

    const hasImportErrors = computed(() => Object.keys(importErrors.value).length > 0)

    const downloadTemplate = async (): Promise<boolean> => {
        isDownloadingTemplate.value = true
        try {
            const blob = await productService.downloadTemplate()

            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'products_template.xlsx'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            toast.success(t('product.templateDownloaded'))
            return true
        } catch (error: any) {
            console.error('Download template error:', error)
            toast.error(error.message || t('product.downloadTemplateError'))
            return false
        } finally {
            isDownloadingTemplate.value = false
        }
    }

    const importProducts = async (file: File): Promise<boolean> => {
        if (!file) {
            importErrors.value = { file: [t('product.import.noFileSelected')] }
            return false
        }

        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
        ]

        if (!allowedTypes.includes(file.type)) {
            importErrors.value = { file: [t('product.import.invalidFileType')] }
            return false
        }

        const maxSize = 10 * 1024 * 1024
        if (file.size > maxSize) {
            importErrors.value = { file: [t('product.import.fileTooLarge')] }
            return false
        }

        isUploading.value = true
        uploadProgress.value = 0
        importErrors.value = {}
        importResult.value = null

        try {
            uploadProgress.value = 30

            const formData = new FormData()
            formData.append('file', file) // Make sure the field name is 'file'

            uploadProgress.value = 60

            // Pass FormData, not File
            const response = await productService.importProducts(formData)

            uploadProgress.value = 100
            importResult.value = response

            if (response.created_products !== undefined && response.excel_products !== undefined) {
                const created = response.created_products || 0
                const total = response.excel_products || 0
                const failed = total - created

                if (failed > 0) {
                    toast.warning(
                        t('product.import.partialSuccess', {
                            imported: created,
                            total: total,
                            failed: failed,
                        })
                    )
                } else if (created > 0) {
                    toast.success(
                        created === 1
                            ? t('product.import.successSingle')
                            : t('product.import.successMultiple', { count: created })
                    )
                } else {
                    toast.error(t('product.import.noProductsImported'))
                    return false
                }
            }

            return true
        } catch (error: any) {
            console.error('Import error:', error)

            if (error.statusCode === 400) {
                const errorMessage =
                    error.data?.message || error.message || t('product.import.validationError')
                importErrors.value = { file: [errorMessage] }
                toast.error(errorMessage)
            } else if (error.statusCode === 422 && error.data?.errors) {
                importErrors.value = error.data.errors
                const firstError = Object.values(error.data.errors)[0]
                toast.error(Array.isArray(firstError) ? firstError[0] : firstError)
            } else {
                const errorMsg = error.message || t('product.import.error')
                importErrors.value = { file: [errorMsg] }
                toast.error(errorMsg)
            }

            return false
        } finally {
            isUploading.value = false
            uploadProgress.value = 0
        }
    }
    const resetImport = () => {
        importResult.value = null
        importErrors.value = {}
        uploadProgress.value = 0
        isUploading.value = false
    }

    return {
        isUploading,
        isDownloadingTemplate,
        uploadProgress,
        importResult,
        importErrors,
        hasImportErrors,
        downloadTemplate,
        importProducts,
        resetImport,
    }
}
