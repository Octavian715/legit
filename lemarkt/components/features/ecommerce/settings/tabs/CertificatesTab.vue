<!-- components/features/ecommerce/settings/tabs/CertificatesTab.vue -->
<template>
    <div class="certificates-tab w-full">
        <!-- Loading State -->
        <div v-if="isLoading" class="flex justify-center items-center p-8">
            <span class="loader"></span>
        </div>

        <!-- Main Content -->
        <div v-else class="w-full mx-auto">
            <!-- Hero Section -->
            <div
                v-if="formData.certificates.length === 0"
                class="text-center space-y-6 md:w-1/2 mx-auto"
            >
                <img
                    src="/public/images/register/no-documents.webp"
                    :alt="$t('certificates.certificates', 'Certificates')"
                    class="max-h-64 w-full h-full object-contain transition-transform duration-200"
                    loading="lazy"
                />
                <h3 class="text-title3 font-bold text-gray-950">
                    {{
                        $t(
                            'certificates.pleaseUploadCertificates',
                            'Please upload your certificates'
                        )
                    }}
                </h3>
                <p class="text-subtitle2 text-gray-800">
                    {{
                        $t(
                            'certificates.uploadCertificatesDescription',
                            'Upload your business certificates to verify your credentials'
                        )
                    }}
                </p>
            </div>

            <Table
                v-else
                :columns="tableColumns"
                :rows="tableRows"
                :actions="['edit', 'download', 'delete']"
                :loading="isSaving"
                enable-cell-events
                @add-item="handleAddCertificate"
                @edit="handleEditCertificate"
                @delete="handleDeleteCertificate"
                @show="handleViewCertificate"
                @download="handleDownloadCertificate"
            />

            <!-- Error Display -->
            <div v-if="generalError" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p class="text-caption1 text-red-700" role="alert">
                    {{ generalError }}
                </p>
            </div>

            <!-- Navigation Buttons -->
            <div class="flex flex-col gap-4 w-full max-w-md mx-auto mt-6">
                <Button
                    variant="filled"
                    color="blue"
                    size="lg"
                    :label="$t('certificates.addCertificate', 'Add Certificate')"
                    :disabled="isSaving"
                    class="w-full"
                    @click="handleAddCertificate"
                />
            </div>
        </div>

        <!-- Add/Edit Certificate Modal -->
        <CertificateModal
            v-model="showCertificateModal"
            :initial-data="editingCertificate"
            :is-submitting="isSubmittingModal"
            :is-editing="editingIndex !== null"
            @save="handleSaveCertificate"
            @cancel="handleCloseCertificateModal"
        />
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useToastNotification } from '~/composables/useToastNotification'
    import type { TableColumn } from '~/types/ui/table'
    import { useUserStore } from '~/stores/user'

    interface Certificate {
        id?: number
        name: string
        certificateNumber: string
        issueDate: string
        expiryDate: string
        file: File | string | null
        fileName?: string
    }

    // Composables
    const { t } = useI18n()
    const toast = useToastNotification()
    const userStore = useUserStore()
    const { $api } = useNuxtApp()

    // Component mounted state
    const isMounted = ref(false)

    // State
    const isLoading = ref(true)
    const isSaving = ref(false)
    const showCertificateModal = ref(false)
    const editingCertificate = ref<Partial<Certificate> | null>(null)
    const editingIndex = ref<number | null>(null)
    const isSubmittingModal = ref(false)
    const generalError = ref('')

    // Form data
    const formData = reactive({
        certificates: [] as Certificate[],
    })

    // Store original data for dirty checking
    const originalData = ref<string>('')
    const isDirty = ref(false)

    // Table Configuration
    const tableColumns: TableColumn[] = [
        {
            key: 'name',
            label: t('certificates.certificateName', 'Certificate Name'),
            align: 'left',
            view: 'TableCellText',
            width: '25%',
            cellOptions: {
                classes: 'break-words whitespace-normal line-clamp-2',
            },
        },
        {
            key: 'certificateNumber',
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
        return formData.certificates.map((cert: Certificate, index: number) => {
            const rowData = [
                cert.name || '-',
                cert.certificateNumber || '-',
                cert.issueDate || null,
                cert.expiryDate || null,
                null, // actions column
            ]

            return {
                id: cert.id || `cert-${index}`,
                row: rowData,
                originalData: cert,
                index,
            }
        })
    })

    /**
     * Load certificates from user data
     */
    const loadCertificates = async () => {
        try {
            isLoading.value = true

            // Ensure user data is loaded
            if (!userStore.user) {
                await userStore.fetchUser()
            }

            const user = userStore.user
            console.log('[CertificatesTab] User data:', user)

            if (!user) {
                console.warn('[CertificatesTab] No user data available')
                return
            }

            // Get certificates from user.media_documents
            const mediaDocuments = user.media_documents || []
            console.log('[CertificatesTab] Media documents:', mediaDocuments)

            const certificates = mediaDocuments.filter(
                (item: any) => item.type === 'general_certificate'
            )

            console.log('[CertificatesTab] Filtered certificates:', certificates)

            if (certificates.length) {
                formData.certificates = certificates.map((certificate: any) => {
                    console.log('[CertificatesTab] Mapping certificate:', certificate)

                    return {
                        id: certificate.id,
                        name: certificate.file_name,
                        certificateNumber: certificate.certificate_number,
                        issueDate: certificate.issue_date,
                        expiryDate: certificate.expiry_date,
                        file: certificate.url || certificate.file_path || certificate.file_url, // ✅ Use URL with signature for download
                        fileName: certificate.file_name,
                    }
                })

                console.log('[CertificatesTab] Loaded certificates:', formData.certificates)
            } else {
                formData.certificates = []
            }

            // Store original data for dirty checking
            originalData.value = JSON.stringify(formData.certificates)
            isDirty.value = false
        } catch (error) {
            console.error('[CertificatesTab] Error loading certificates:', error)
            toast.error(
                t('certificates.loadError', 'Failed to load certificates'),
                t('error', 'Error')
            )
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Check for changes
     */
    const checkForChanges = () => {
        if (!isMounted.value) return
        isDirty.value = JSON.stringify(formData.certificates) !== originalData.value
    }

    /**
     * Handle add certificate
     */
    const handleAddCertificate = () => {
        editingIndex.value = null
        editingCertificate.value = {
            name: '',
            certificateNumber: '',
            issueDate: '',
            expiryDate: '',
            file: null,
        }
        showCertificateModal.value = true
    }

    /**
     * Handle edit certificate
     */
    const handleEditCertificate = (payload: { row: any }) => {
        const index = payload.row.index
        const cert = formData.certificates[index]

        editingIndex.value = index
        // ✅ Pass file data properly for initialization
        editingCertificate.value = {
            id: cert.id,
            name: cert.name,
            certificateNumber: cert.certificateNumber,
            issueDate: cert.issueDate,
            expiryDate: cert.expiryDate,
            file: cert.file, // This will be a file path string from backend
            fileName: cert.fileName,
        }
        showCertificateModal.value = true
    }

    /**
     * Handle delete certificate
     */
    const handleDeleteCertificate = (payload: { row: any }) => {
        const index = payload.row.index
        formData.certificates.splice(index, 1)
        checkForChanges()

        toast.success(t('success.deleted', 'Deleted successfully'), t('common.success', 'Success'))
    }

    /**
     * Handle save certificate
     */
    const handleSaveCertificate = async (certificateData: Certificate) => {
        isSubmittingModal.value = true

        try {
            if (editingIndex.value !== null) {
                // Update existing certificate
                formData.certificates[editingIndex.value] = { ...certificateData }
                toast.success(
                    t('success.updated', 'Updated successfully'),
                    t('common.success', 'Success')
                )
            } else {
                // Add new certificate
                formData.certificates.push({ ...certificateData })
                toast.success(
                    t('success.created', 'Created successfully'),
                    t('common.success', 'Success')
                )
            }

            handleCloseCertificateModal()
        } catch (error: any) {
            console.error('[CertificatesTab] Error saving certificate:', error)
            toast.error(
                error.message || t('errors.generalSubmit', 'Failed to save certificate'),
                t('error', 'Error')
            )
        } finally {
            isSubmittingModal.value = false
        }
    }

    /**
     * Handle close certificate modal
     */
    const handleCloseCertificateModal = () => {
        showCertificateModal.value = false
        editingIndex.value = null
        editingCertificate.value = null
        isSubmittingModal.value = false
    }

    /**
     * Handle view certificate
     */
    const handleViewCertificate = (payload: { row: any }) => {
        const certificate = payload.row.originalData
        console.log('[CertificatesTab] View certificate:', certificate)
    }

    /**
     * Handle download certificate
     */
    const handleDownloadCertificate = async (payload: { row: any }) => {
        const certificate = payload.row.originalData

        console.log('[CertificatesTab] Download certificate:', {
            id: certificate.id,
            file: certificate.file,
            fileName: certificate.fileName,
            fileType: typeof certificate.file,
        })

        try {
            let downloadUrl: string
            let fileName: string

            if (certificate.file instanceof File) {
                // New file not yet uploaded
                const blob = new Blob([certificate.file], { type: certificate.file.type })
                downloadUrl = URL.createObjectURL(blob)
                fileName =
                    certificate.fileName || certificate.file.name || `${certificate.name}.pdf`
            } else if (
                certificate.file &&
                typeof certificate.file === 'string' &&
                certificate.file.trim()
            ) {
                // File from backend
                console.log('[CertificatesTab] Downloading from:', certificate.file)

                const response = await $api(certificate.file, {
                    method: 'GET',
                    responseType: 'blob',
                })

                const blob = new Blob([response], { type: 'application/pdf' })
                downloadUrl = URL.createObjectURL(blob)
                fileName = certificate.fileName || `${certificate.name}.pdf`
            } else {
                console.error('[CertificatesTab] No valid file found:', certificate)
                toast.error(
                    t('certificates.noFileAvailable', 'No file available for download'),
                    t('error', 'Error')
                )
                return
            }

            // Trigger download
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = fileName
            link.style.display = 'none'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            // Cleanup
            if (certificate.file instanceof File) {
                setTimeout(() => URL.revokeObjectURL(downloadUrl), 100)
            }

            toast.success(
                t('certificates.downloadSuccessful', `Certificate downloaded successfully`),
                t('common.success', 'Success')
            )
        } catch (error) {
            console.error('[CertificatesTab] Download error:', error)
            toast.error(
                t('certificates.downloadFailed', 'Failed to download certificate'),
                t('error', 'Error')
            )
        }
    }

    /**
     * Public method for parent to trigger save
     */
    const save = async () => {
        if (!isMounted.value) {
            console.warn('[CertificatesTab] Cannot save - component not mounted')
            return false
        }

        try {
            isSaving.value = true

            // Prepare data for userStore.updateProfile()
            const data: Record<string, any> = {}
            const files: Record<string, File> = {}

            formData.certificates.forEach((cert, index) => {
                data[`general_certificates[${index}][certificate_number]`] = cert.certificateNumber
                data[`general_certificates[${index}][issue_date]`] = cert.issueDate
                data[`general_certificates[${index}][expiry_date]`] = cert.expiryDate

                if (cert.id) {
                    data[`general_certificates[${index}][id]`] = cert.id
                }

                // ✅ Add file ONLY if it's a NEW File object (not a string path from backend)
                if (cert.file instanceof File) {
                    files[`general_certificates[${index}][file]`] = cert.file
                }
            })

            console.log('[CertificatesTab] Saving certificates:', {
                data,
                files,
                certificatesCount: formData.certificates.length,
            })

            // Call userStore.updateProfile with data and files
            await userStore.updateProfile(data, Object.keys(files).length > 0 ? files : undefined)

            // Refresh user data
            await userStore.fetchUser()

            // Reload certificates from updated user data
            await loadCertificates()

            return true
        } catch (error: any) {
            console.error('[CertificatesTab] Error saving:', error)

            // Show specific validation errors if available
            if (error?.data?.errors) {
                const errorMessages = Object.values(error.data.errors).flat()
                generalError.value = errorMessages.join('. ')
            } else {
                generalError.value = t(
                    'errors.generalSubmit',
                    'Failed to save certificates. Please try again.'
                )
            }

            return false
        } finally {
            isSaving.value = false
        }
    }

    /**
     * Public method for parent to reset form
     */
    const reset = async () => {
        await loadCertificates()
    }

    /**
     * Public method for parent to validate form
     */
    const validate = () => {
        // No validation needed for certificates tab
        return { isValid: true, errors: [] }
    }

    /**
     * Public method to check for unsaved changes
     */
    const getHasUnsavedChanges = () => {
        return isDirty.value
    }

    // Expose methods for parent component
    defineExpose({
        save,
        reset,
        validate,
        isDirty,
        getHasUnsavedChanges,
    })

    // Watch for changes
    watch(
        () => ({ ...formData }),
        () => {
            checkForChanges()
        },
        { deep: true }
    )

    // Lifecycle
    onMounted(async () => {
        try {
            await nextTick()
            isMounted.value = true
            await loadCertificates()
        } catch (error) {
            console.error('[CertificatesTab] Error loading data:', error)
            toast.error(
                t('error.loadingFailed', 'Failed to load certificates'),
                t('error', 'Error')
            )
        }
    })
</script>

<style scoped>
    .certificates-tab {
        @apply mb-20;
    }
</style>
