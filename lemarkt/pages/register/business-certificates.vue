<!-- pages/register/business-certificates.vue -->
<template>
    <AuthContainer
        class="bg-gray-150"
        :full-height="false"
        content-class="max-w-6xl mx-auto"
        class-container="w-full"
        spacing
    >
        <template #header>
            <h2 class="font-bold text-gray-950 text-subtitle1 text-center">
                {{ $t('certificates.certificates', 'Certificates') }}
            </h2>
        </template>

        <div>
            <!-- Loading State -->
            <div v-if="isLoading" class="flex justify-center items-center p-8">
                <span class="loader"></span>
            </div>

            <!-- Main Content -->
            <div v-else class="w-full mx-auto">
                <!-- Hero Section -->
                <div
                    v-if="form.certificates.length === 0"
                    class="text-center space-y-6 md:w-1/2 mx-auto"
                >
                    <!-- <NuxtImg
                        src="/public/images/register/no-documents.webp"
                        :alt="$t('certificates.certificates', 'Certificates')"
                        class="max-h-64 w-full h-full object-contain transition-transform duration-200"
                        loading="lazy"
                    /> -->
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
                    :loading="isSubmitting"
                    enable-cell-events
                    @add-item="handleAddCertificate"
                    @edit="handleEditCertificate"
                    @delete="handleDeleteCertificate"
                    @show="handleViewCertificate"
                    @download="handleDownloadCertificate"
                />

                <!-- Error Display -->
                <div
                    v-if="generalError"
                    class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
                >
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
                        :disabled="isSubmitting"
                        class="w-full"
                        @click="handleAddCertificate"
                    />
                    <div
                        class="flex flex-col sm:flex-row gap-3 justify-between max-w-md mx-auto w-full"
                    >
                        <Button
                            type="button"
                            variant="filled"
                            color="gray"
                            font-weight="normal"
                            :label="$t('prevStep', 'Previous step')"
                            class="w-full"
                            :disabled="isSubmitting"
                            @click="handleGoBack"
                        />

                        <Button
                            type="button"
                            variant="filled"
                            color="red"
                            :label="$t('nextStep', 'Next step')"
                            class="w-full"
                            :disabled="!canSubmit"
                            :loading="isSubmitting"
                            @click="handleSubmit"
                        />
                    </div>

                    <Button
                        type="button"
                        variant="ghost"
                        font-weight="normal"
                        color="blue"
                        :label="$t('skip', 'Skip')"
                        class="w-full"
                        :disabled="isSubmitting"
                        @click="handleSkip"
                    />
                </div>
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
    </AuthContainer>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, onMounted, watch } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useLocalePath } from '#imports'
    import { useRouter } from 'vue-router'
    import { useRegistrationNavigation } from '~/composables/useRegistrationNavigation'
    import { useToastNotification } from '~/composables/useToastNotification'
    import type { TableColumn } from '~/types/ui/table'

    definePageMeta({
        layout: 'auth',
        middleware: ['registration'],
    })

    interface Certificate {
        id?: number
        name: string
        certificateNumber: string
        issueDate: string
        expiryDate: string
        file: File | null
        fileName?: string
    }

    // Composables
    const { t } = useI18n()
    const localePath = useLocalePath()
    const router = useRouter()
    const {
        getStepData,
        updateStepData,
        initializeStep,
        isSubmitting: isSavingGeneralCertificates,
        completeGeneralCertificates,
        loadAndPopulateFieldRegistration,
    } = useRegistrationNavigation()
    const toast = useToastNotification()
    const registerStore = useRegistrationStore()

    // State
    const isLoading = ref(true)
    const showCertificateModal = ref(false)
    const editingCertificate = ref<Partial<Certificate> | null>(null)
    const editingIndex = ref<number | null>(null)
    const isSubmittingModal = ref(false)

    // Get current data
    const certificatesData = getStepData('certificates') as any

    // Form data
    const form = reactive({
        certificates: certificatesData?.certificates || [],
    })

    const generalError = ref('')

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
        return form.certificates.map((cert: Certificate, index: number) => {
            // Create row data that matches the column structure
            const rowData = [
                cert.name || '-',
                cert.certificateNumber || '-',
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

    const canSubmit = computed(() => {
        return form.certificates.length > 0 && !isSubmitting.value
    })

    // Computed Properties
    const isSubmitting = computed(() => isSavingGeneralCertificates.value)

    // Methods
    const updateCertificatesData = () => {
        updateStepData('certificates', {
            certificates: form.certificates,
            completed: true,
        })
    }

    // Certificate Management Methods
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

    const handleEditCertificate = (payload: { row: any }) => {
        const index = payload.row.index
        editingIndex.value = index
        editingCertificate.value = { ...form.certificates[index] }
        showCertificateModal.value = true
    }

    const handleDeleteCertificate = (payload: { row: any }) => {
        const index = payload.row.index
        form.certificates.splice(index, 1)
        updateCertificatesData()

        toast.success(t('success.deleted', 'Deleted successfully'), t('common.success', 'Success'))
    }

    const handleSaveCertificate = (certificateData: Certificate) => {
        isSubmittingModal.value = true

        try {
            if (editingIndex.value !== null) {
                form.certificates[editingIndex.value] = { ...certificateData }
                toast.success(
                    t('success.updated', 'Updated successfully'),
                    t('common.success', 'Success')
                )
            } else {
                form.certificates.push({ ...certificateData })
                toast.success(
                    t('success.created', 'Created successfully'),
                    t('common.success', 'Success')
                )
            }

            updateCertificatesData()
            handleCloseCertificateModal()
        } catch (error) {
            toast.error(
                t('errors.generalSubmit', 'Failed to save certificate. Please try again.'),
                t('error', 'Error')
            )
        } finally {
            isSubmittingModal.value = false
        }
    }

    const handleCloseCertificateModal = () => {
        showCertificateModal.value = false
        editingIndex.value = null
        editingCertificate.value = null
        isSubmittingModal.value = false
    }

    const handleViewCertificate = (payload: { row: any }) => {
        const certificate = payload.row.originalData
    }

    const handleDownloadCertificate = async (payload: { row: any }) => {
        const certificate = payload.row.originalData

        try {
            // // Show loading state
            // toast.info(
            //     t('certificates.downloadingFile', 'Downloading file...'),
            //     t('common.info', 'Info')
            // )

            let downloadUrl: string
            let fileName: string

            // Handle different file sources
            if (certificate.file instanceof File) {
                // For newly uploaded files (File objects)
                const blob = new Blob([certificate.file], { type: certificate.file.type })
                downloadUrl = URL.createObjectURL(blob)
                fileName =
                    certificate.fileName || certificate.file.name || `${certificate.name}.pdf`
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
                    toast.error(
                        t('certificates.downloadFailed', 'Failed to download certificate'),
                        t('error', 'Error')
                    )
                    return
                }
            } else {
                toast.error(
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

            toast.success(
                t(
                    'certificates.downloadSuccessful',
                    `Certificate "${certificate.name}" downloaded successfully`
                ),
                t('common.success', 'Success')
            )
        } catch (error) {
            console.error('[Certificate] Download error:', error)
            toast.error(
                t('certificates.downloadFailed', 'Failed to download certificate'),
                t('error', 'Error')
            )
        }
    }

    // Submit Methods
    const handleSubmit = async () => {
        try {
            generalError.value = ''

            const certificates = form.certificates.map((cert: Certificate) => ({
                id: cert.id || null,
                name: cert.name,
                certificateNumber: cert.certificateNumber,
                issueDate: cert.issueDate,
                expiryDate: cert.expiryDate,
                file: cert.file,
                fileName: cert.fileName,
            }))

            const { success, nextStep } = await completeGeneralCertificates(certificates)

            if (success) {
                toast.success(
                    t('success.saved', 'Saved successfully'),
                    t('common.success', 'Success')
                )

                const stepRoutes: Record<string, string> = {
                    'public-profile': '/register/public-profile',
                    'profile-media': '/register/public-profile',
                }

                const route = stepRoutes[nextStep || 'public-profile']
                await router.push(localePath(route || '/register/public-profile'))
            } else {
                generalError.value = t(
                    'errors.generalSubmit',
                    'Failed to save certificates. Please try again.'
                )
            }
        } catch (error) {
            console.error('Certificate submission error:', error)
            generalError.value = t(
                'errors.generalSubmit',
                'Failed to save certificates. Please try again.'
            )
        }
    }

    // Navigation Methods
    const handleGoBack = async () => {
        updateCertificatesData()
        await router.push(localePath('/register/company-certificates'))
    }

    const handleSkip = async () => {
        try {
            const { success } = await completeGeneralCertificates([])

            if (success) {
                toast.info(
                    t('certificates.skipped', 'Certificates skipped. You can add them later.'),
                    t('common.info', 'Info')
                )

                await router.push(localePath('/register/public-profile'))
            } else {
                toast.error(
                    t('errors.navigationFailed', 'Failed to navigate. Please try again.'),
                    t('error', 'Error')
                )
            }
        } catch (error) {
            toast.error(
                t('error.navigationFailed', 'Failed to navigate. Please try again.'),
                t('error', 'Error')
            )
        }
    }

    const loadCompanyCertificates = async () => {
        try {
            const certificates = await loadAndPopulateFieldRegistration('media_documents')
            const companyCertificates = certificates.filter(
                (item) => item.type === 'general_certificate'
            )
            if (companyCertificates?.length) {
                form.certificates =
                    certificatesData?.certificates ||
                    companyCertificates.map((certificate) => ({
                        id: certificate.id || null,
                        name: certificate.file_name,
                        certificateNumber: certificate.certificate_number,
                        expiryDate: certificate.expiry_date,
                        issueDate: certificate.issue_date,
                        file: certificate.url || certificate.file_path, // ✅ Use URL with signature for download
                        size: certificate.file_size,
                    }))
            }
        } catch (error) {
            console.error('[CompanyForm] Error loading user company data:', error)
        }
    }

    // Watch form changes to update store
    watch(
        () => ({ ...form }),
        (newForm) => {
            updateStepData('certificates', {
                certificates: newForm.certificates,
                completed: true,
            })
        },
        { deep: true }
    )

    // Lifecycle
    onMounted(async () => {
        await loadCompanyCertificates()
        initializeStep('certificates')
        isLoading.value = false
    })
</script>