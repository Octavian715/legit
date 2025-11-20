<!-- ~/components/features/ecommerce/settings/tabs/CertificatesTab.vue -->
<template>
    <div class="w-full space-y-3">
        <!-- Certificates Section -->
        <section>
            <h2 class="text-subtitle3 text-gray-800 mb-3">
                {{ $t('certificates.certificates', 'Certificates') }}
            </h2>

            <div>
                <!-- Loading State -->
                <div v-if="isLoading" class="flex justify-center items-center py-12">
                    <div
                        class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"
                    ></div>
                </div>

                <!-- Empty State -->
                <NoDataPage
                    v-else-if="certificates.length === 0"
                    image="/images/register/no-documents.webp"
                    image-width="350px"
                    image-height="240px"
                    :title="$t('certificates.noCertificatesFound', 'No Certificates found')"
                    :description="
                        $t(
                            'certificates.noCertificatesDescription',
                            'You haven\'t added any certificates yet. To manage your certifications, start by adding one.'
                        )
                    "
                    button-color="blue"
                    :button-label="
                        $t(
                            'addATemplate',
                            { template: $t('certificates.certificate', 'Certificate') },
                            'Add a Certificate'
                        )
                    "
                    @action="handleAddCertificate"
                />

                <!-- Table with Certificates -->
                <div v-else class="space-y-3">
                    <Table
                        :columns="tableColumns"
                        :rows="tableRows"
                        :actions="['edit', 'download', 'delete']"
                        :loading="false"
                        enable-cell-events
                        @add-item="handleAddCertificate"
                        @edit="handleEditCertificate"
                        @delete="handleDeleteCertificate"
                        @show="handleViewCertificate"
                        @download="handleDownloadCertificate"
                    />

                    <!-- Add Another Certificate Button -->
                    <div class="flex justify-center">
                        <Button
                            variant="filled"
                            color="blue"
                            size="lg"
                            :label="
                                $t(
                                    'addATemplate',
                                    { template: $t('certificates.certificate', 'Certificate') },
                                    'Add a Certificate'
                                )
                            "
                            @click="handleAddCertificate"
                        />
                    </div>
                </div>
            </div>
        </section>

        <!-- Add/Edit Certificate Modal -->
        <Modal
            v-model:is-open="showModal"
            :title="modalTitle"
            content-width="sm:max-w-md"
            hide-footer
            @close="handleCloseModal"
        >
            <CertificateForm
                :initial-data="editingCertificate"
                :is-submitting="isSubmittingModal"
                show-actions
                @save="handleSaveCertificate"
                @cancel="handleCloseModal"
            />
        </Modal>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, nextTick, onMounted } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useUserStore } from '~/stores/user'
    import { useToastNotification } from '~/composables/useToastNotification'
    import type { TableColumn } from '~/types/ui/table'

    interface CertificateFormData {
        id?: number
        name: string
        number: string
        issueDate: string
        expiryDate: string
        issuingAuthority: string
        file: File | null
        fileName?: string
    }

    const { t } = useI18n()
    const userStore = useUserStore()
    const { error: showError, success: showSuccess } = useToastNotification()

    // Loading states
    const isLoading = ref(false)
    const isSubmittingModal = ref(false)
    const isInitializing = ref(false) // Prevent watch during load

    // Modal state
    const showModal = ref(false)
    const editingIndex = ref<number | null>(null)
    const editingCertificate = ref<Partial<CertificateFormData> | null>(null)

    // Certificates data
    const certificates = ref<CertificateFormData[]>([])

    // Original data for change detection
    const originalData = ref<CertificateFormData[]>([])

    // Session storage keys
    const CERTIFICATES_STORAGE_KEY = 'certificatesTab_unsavedCertificates'
    const ORIGINAL_STORAGE_KEY = 'certificatesTab_originalCertificates'

    // Modal title
    const modalTitle = computed(() => {
        return editingIndex.value !== null
            ? t('modal.editCertificate', 'Edit Certificate')
            : t('modal.addCertificate', 'Add Certificate')
    })

    // Table Configuration
    const tableColumns: TableColumn[] = [
        {
            key: 'name',
            label: t('certificates.certificateName', 'Certificate Name'),
            align: 'left',
            view: 'TableCellText',
            width: '25%',
        },
        {
            key: 'number',
            label: t('certificates.certificateNumber', 'Certificate Number'),
            align: 'left',
            view: 'TableCellText',
            width: '20%',
        },
        {
            key: 'issueDate',
            label: t('certificates.issueDate', 'Issue Date'),
            align: 'center',
            view: 'TableCellCertificateDate',
            width: '15%',
            cellOptions: {
                dateType: 'issue',
                showStatus: false,
                showRelative: true,
            },
        },
        {
            key: 'expiryDate',
            label: t('certificates.expiryDate', 'Expiry Date'),
            align: 'center',
            view: 'TableCellCertificateDate',
            width: '15%',
            cellOptions: {
                dateType: 'expiry',
                showStatus: true,
                showRelative: true,
            },
        },
        {
            key: 'actions',
            label: t('common.actions', 'Actions'),
            align: 'right',
            view: 'TableCellActions',
            width: '15%',
        },
    ]

    const tableRows = computed(() => {
        return certificates.value.map((cert: CertificateFormData, index: number) => {
            // Create row data that matches the column structure
            const rowData = [
                cert.name || '-',
                cert.number || '-',
                cert.issueDate || null,
                cert.expiryDate || null,
                null, // actions column doesn't need data
            ]

            return {
                id: cert.id || `cert-${index}`,
                row: rowData,
                originalData: cert,
                index,
            }
        })
    })

    // Computed: Check if form is dirty (has unsaved changes)
    const isDirty = computed(() => {
        const currentData = JSON.stringify(certificates.value)
        const original = JSON.stringify(originalData.value)
        return currentData !== original
    })

    /**
     * Restore certificates from sessionStorage
     */
    const restoreCertificatesFromSession = (): boolean => {
        try {
            const savedCertificates = sessionStorage.getItem(CERTIFICATES_STORAGE_KEY)
            const savedOriginal = sessionStorage.getItem(ORIGINAL_STORAGE_KEY)

            if (savedCertificates && savedOriginal) {
                isInitializing.value = true // Block watch

                certificates.value = JSON.parse(savedCertificates)
                originalData.value = JSON.parse(savedOriginal)

                // Unblock watch on next tick
                nextTick(() => {
                    isInitializing.value = false
                })

                return true
            }
        } catch (error) {
            isInitializing.value = false
            // Silent fail
        }
        return false
    }

    /**
     * Save certificates to sessionStorage
     */
    const saveCertificatesToSession = () => {
        try {
            sessionStorage.setItem(CERTIFICATES_STORAGE_KEY, JSON.stringify(certificates.value))
            sessionStorage.setItem(ORIGINAL_STORAGE_KEY, JSON.stringify(originalData.value))
        } catch (error) {
            // Silent fail
        }
    }

    /**
     * Clear certificates from sessionStorage
     */
    const clearCertificatesFromSession = () => {
        try {
            sessionStorage.removeItem(CERTIFICATES_STORAGE_KEY)
            sessionStorage.removeItem(ORIGINAL_STORAGE_KEY)
        } catch (error) {
            // Silent fail
        }
    }

    /**
     * Load certificates from user store
     */
    const loadCertificates = () => {
        // Check if we have cached data in session
        if (restoreCertificatesFromSession()) {
            return
        }

        try {
            isLoading.value = true
            isInitializing.value = true // Block watch

            // Get certificates from user store
            const userCertificates = userStore.user?.certificates || []

            // Transform backend data to frontend format
            certificates.value = userCertificates.map((cert: any) => ({
                id: cert.id,
                name: cert.name,
                number: cert.certificate_number || cert.number,
                issueDate: cert.issue_date || cert.issueDate,
                expiryDate: cert.expiry_date || cert.expiryDate,
                issuingAuthority: cert.issuer || cert.issuingAuthority,
                file: cert.file_path || null,
                fileName: cert.file_name || cert.fileName,
            }))

            originalData.value = JSON.parse(JSON.stringify(certificates.value))

            // Wait for next tick to save to session (after watch has been skipped)
            nextTick(() => {
                saveCertificatesToSession()
                isInitializing.value = false // Unblock watch
            })
        } catch (error: any) {
            isInitializing.value = false
            showError(
                error.message || t('certificates.errorLoadingCertificates', 'Error loading certificates'),
                t('error', 'Error')
            )
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Handle add certificate
     */
    const handleAddCertificate = () => {
        editingIndex.value = null
        editingCertificate.value = {
            name: '',
            number: '',
            issueDate: '',
            expiryDate: '',
            issuingAuthority: '',
            file: null,
        }
        showModal.value = true
    }

    /**
     * Handle edit certificate
     */
    const handleEditCertificate = (payload: { row: any }) => {
        const index = payload.row.index
        editingIndex.value = index
        editingCertificate.value = { ...certificates.value[index] }
        showModal.value = true
    }

    /**
     * Handle delete certificate
     */
    const handleDeleteCertificate = (payload: { row: any }) => {
        const index = payload.row.index
        certificates.value.splice(index, 1)

        showSuccess(
            t('success.deleted', 'Deleted successfully'),
            t('common.success', 'Success')
        )

        // Watch will auto-save to session
    }

    /**
     * Handle save certificate (from CertificateForm)
     */
    const handleSaveCertificate = async (certificateData: CertificateFormData) => {
        try {
            isSubmittingModal.value = true

            if (editingIndex.value !== null) {
                // Update existing certificate
                certificates.value[editingIndex.value] = certificateData
                showSuccess(
                    t('success.updated', 'Updated successfully'),
                    t('common.success', 'Success')
                )
            } else {
                // Add new certificate
                certificates.value.push(certificateData)
                showSuccess(
                    t('success.created', 'Created successfully'),
                    t('common.success', 'Success')
                )
            }

            // Watch will auto-save to session

            // Close modal
            handleCloseModal()
        } catch (error: any) {
            showError(
                error.message || t('certificates.errorSavingCertificate', 'Error saving certificate'),
                t('error', 'Error')
            )
        } finally {
            isSubmittingModal.value = false
        }
    }

    /**
     * Handle view certificate
     */
    const handleViewCertificate = (payload: { row: any }) => {
        const certificate = payload.row.originalData
        // Implement view logic if needed
    }

    /**
     * Handle download certificate
     */
    const handleDownloadCertificate = async (payload: { row: any }) => {
        const certificate = payload.row.originalData

        try {
            let downloadUrl: string
            let fileName: string

            // Handle different file sources
            if (certificate.file instanceof File) {
                // For newly uploaded files (File objects)
                const blob = new Blob([certificate.file], { type: certificate.file.type })
                downloadUrl = URL.createObjectURL(blob)
                fileName = certificate.fileName || certificate.file.name || `${certificate.name}.pdf`
            } else if (certificate.file && typeof certificate.file === 'string') {
                // For files from backend (file paths/URLs)
                const { $api } = useNuxtApp()

                try {
                    // Download file from backend
                    const response = await $api(certificate.file, {
                        method: 'GET',
                        responseType: 'blob',
                    })

                    const blob = new Blob([response], {
                        type: 'application/pdf', // Default to PDF, adjust if needed
                    })
                    downloadUrl = URL.createObjectURL(blob)
                    fileName = certificate.fileName || `${certificate.name}.pdf`
                } catch (downloadError) {
                    console.error('[Certificate] Download error:', downloadError)
                    showError(
                        t('certificates.downloadFailed', 'Failed to download certificate'),
                        t('error', 'Error')
                    )
                    return
                }
            } else {
                showError(
                    t('certificates.noFileAvailable', 'No file available for download'),
                    t('error', 'Error')
                )
                return
            }

            // Create download link and trigger download
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = fileName
            link.style.display = 'none'

            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            // Clean up object URL to prevent memory leaks
            if (certificate.file instanceof File) {
                setTimeout(() => URL.revokeObjectURL(downloadUrl), 100)
            }

            showSuccess(
                t(
                    'certificates.downloadSuccessful',
                    `Certificate "${certificate.name}" downloaded successfully`
                ),
                t('common.success', 'Success')
            )
        } catch (error) {
            console.error('[Certificate] Download error:', error)
            showError(
                t('certificates.downloadFailed', 'Failed to download certificate'),
                t('error', 'Error')
            )
        }
    }

    /**
     * Handle close modal
     */
    const handleCloseModal = () => {
        showModal.value = false
        editingIndex.value = null
        editingCertificate.value = null
        isSubmittingModal.value = false
    }

    /**
     * Validate form
     */
    const validate = () => {
        // Check if all certificates have required fields
        const invalidCertificates = certificates.value.filter(
            (cert) => !cert.name || !cert.number || !cert.expiryDate
        )

        if (invalidCertificates.length > 0) {
            showError(
                t(
                    'certificates.missingRequiredFields',
                    'Some certificates are missing required fields'
                ),
                t('error', 'Error')
            )
            return { isValid: false, errors: [] }
        }

        return { isValid: true, errors: [] }
    }

    /**
     * Save certificates to backend
     */
    const save = async (): Promise<boolean> => {
        try {
            // Validate first
            const validation = validate()
            if (!validation.isValid) {
                return false
            }

            // Filter only complete certificates
            const completeCertificates = certificates.value.filter(
                (cert) => cert.name && cert.number && cert.expiryDate
            )

            if (completeCertificates.length === 0) {
                showError(
                    t(
                        'certificates.noValidCertificates',
                        'No valid certificates to save. Please complete required fields.'
                    ),
                    t('error', 'Error')
                )
                return false
            }

            // Transform frontend data to backend format
            const certificatesPayload = completeCertificates.map((cert) => ({
                id: cert.id || undefined,
                name: cert.name,
                certificate_number: cert.number,
                issue_date: cert.issueDate,
                expiry_date: cert.expiryDate,
                issuer: cert.issuingAuthority,
                file: cert.file, // File object for new uploads
            }))

            // Use userStore.updateProfile with certificates
            await userStore.updateProfile({
                certificates: certificatesPayload,
            })

            // Update original data after successful save
            originalData.value = JSON.parse(JSON.stringify(certificates.value))

            // Clear session storage
            clearCertificatesFromSession()

            return true
        } catch (error: any) {
            showError(
                error.message || t('settings.errorSavingChanges', 'Error saving changes'),
                t('error', 'Error')
            )
            return false
        }
    }

    /**
     * Reset form to original data
     */
    const reset = () => {
        certificates.value = JSON.parse(JSON.stringify(originalData.value))

        // Clear session storage
        clearCertificatesFromSession()
    }

    // Watch certificates changes to auto-save to sessionStorage
    watch(
        certificates,
        () => {
            // Skip if initializing to prevent infinite loop
            if (isInitializing.value) {
                return
            }

            // Only save if there are actual changes
            if (isDirty.value) {
                saveCertificatesToSession()
            }
        },
        { deep: true }
    )

    // Load certificates on mount
    onMounted(() => {
        loadCertificates()
    })

    // Expose methods to parent
    defineExpose({
        validate,
        save,
        reset,
        isDirty,
    })
</script>
