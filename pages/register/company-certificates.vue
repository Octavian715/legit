<!-- pages/register/company-certificates.vue - Fixed file handling -->
<template>
    <AuthContainer
        class="bg-gray-150"
        :full-height="false"
        content-class="max-w-4xl mx-auto"
        class-container="w-full"
        spacing
    >
        <template #header>
            <h2 class="font-bold text-gray-950 text-subtitle1 text-center">
                {{ $t('register.uploadCompanyDocuments') }}
            </h2>
        </template>

        <div>
            <!-- Loading State -->
            <div v-if="isLoading" class="flex justify-center items-center p-8">
                <span class="loader"></span>
            </div>

            <!-- Main Content -->
            <div v-else class="w-full md:w-1/2 mx-auto">
                <!-- Hero Section -->
                <div v-if="!hasAnyDocuments" class="text-center space-y-6">
                    <!-- <NuxtImg
                        src="/public/images/register/no-passport.webp"
                        :alt="$t('register.companyDocuments', 'Company Documents')"
                        class="max-h-64 w-full h-full object-contain transition-transform duration-200"
                        loading="lazy"
                    /> -->
                    <img
                        src="/public/images/register/no-passport.webp"
                        :alt="$t('register.companyDocuments', 'Company Documents')"
                        class="max-h-64 w-full h-full object-contain transition-transform duration-200"
                        loading="lazy"
                    />

                    <h3 class="text-title3 font-bold text-gray-950">
                        {{ $t('register.pleaseUploadDocuments') }}
                    </h3>
                    <p class="text-subtitle2 text-gray-800">
                        {{ $t('register.uploadPassportDescription') }}
                    </p>
                </div>

                <Button
                    variant="filled"
                    color="blue"
                    size="lg"
                    :label="
                        hasAnyDocuments
                            ? $t('manageDocuments', 'Manage Documents')
                            : $t('addDocuments', 'Add Documents')
                    "
                    :disabled="isSubmitting"
                    class="mx-auto my-6"
                    @click="openDocumentModal"
                />

                <!-- Validation Status -->
                <div v-if="hasAnyDocuments" class="bg-white rounded shadow-sm border p-4 mb-8">
                    <h4 class="text-subtitle2 font-medium text-gray-950 mb-3">
                        {{ $t('documentValidation', 'Document Validation') }}
                    </h4>
                    <div class="space-y-2">
                        <!-- Passport Validation -->
                        <!-- <div class="flex items-center space-x-2">
                            <svg
                                :class="[
                                    'w-4 h-4',
                                    form.passportImages.length > 0
                                        ? 'text-green-500'
                                        : 'text-gray-400',
                                ]"
                            >
                                <use
                                    :xlink:href="
                                        form.passportImages.length > 0
                                            ? '/sprite.svg#check'
                                            : '/sprite.svg#close'
                                    "
                                ></use>
                            </svg>
                            <span
                                :class="[
                                    'text-caption1',
                                    form.passportImages.length > 0
                                        ? 'text-green-700'
                                        : 'text-gray-500',
                                ]"
                            >
                                {{ $t('passportDocumentsUploaded', 'Passport documents uploaded') }}
                            </span>
                        </div> -->

                        <!-- Company Certificate Validation -->
                        <div class="flex items-center space-x-2">
                            <svg
                                :class="[
                                    'w-4 h-4',
                                    form.companyRegistrationCertificate.length > 0
                                        ? 'text-green-500'
                                        : 'text-gray-400',
                                ]"
                            >
                                <use
                                    :xlink:href="
                                        form.companyRegistrationCertificate.length > 0
                                            ? '/sprite.svg#check'
                                            : '/sprite.svg#close'
                                    "
                                ></use>
                            </svg>
                            <span
                                :class="[
                                    'text-caption1',
                                    form.companyRegistrationCertificate.length > 0
                                        ? 'text-green-700'
                                        : 'text-gray-500',
                                ]"
                            >
                                {{
                                    $t('companyCertificateUploaded', 'Company certificate uploaded')
                                }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Error Display -->
                <div v-if="generalError" class="bg-red-50 border border-red-200 rounded p-4 mb-6">
                    <p class="text-caption1 text-red-700" role="alert">
                        {{ generalError }}
                    </p>
                </div>

                <!-- Navigation Buttons -->
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
                        :loading="isSubmitting"
                        :disabled="!canSubmit"
                        @click="handleSubmit"
                    />
                </div>
            </div>
        </div>

        <!-- Document Upload Modal -->
        <DocumentUploadModal
            v-model="showDocumentModal"
            :initial-data="documentModalData"
            :is-submitting="isSubmittingDocuments"
            :require-passport="true"
            :require-company-certificate="true"
            :max-passport-files="5"
            :max-company-certificate-files="1"
            @confirm="handleDocumentUpload"
            @cancel="handleDocumentCancel"
        />
    </AuthContainer>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, onMounted, watch } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useLocalePath } from '#imports'
    import { useRouter } from 'vue-router'
    import { useRegistrationNavigation } from '~/useRegistrationNavigation'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { NuxtImg } from '#components'
    import { toRaw } from 'vue'
    import { useUserStore } from '~/stores/user'

    definePageMeta({
        layout: 'auth',
        middleware: ['registration'],
    })

    // Composables
    const { t } = useI18n({ useScope: 'global' })
    const localePath = useLocalePath()
    const router = useRouter()
    const {
        getStepData,
        updateStepData,
        initializeStep,
        isSavingCompanyCertificates,
        goBack,
        canGoBack,
        clearError,
        completeCompanyCertificates,
        loadAndPopulateFieldRegistration,
    } = useRegistrationNavigation()
    const toast = useToastNotification()

    // State
    const isLoading = ref(true)
    const showDocumentModal = ref(false)
    const isSubmittingDocuments = ref(false)

    // Get current data
    const companyCertificatesData = getStepData('companyCertificates') as any

    // Form data
    const form = reactive({
        companyRegistrationCertificate: companyCertificatesData?.companyCertificate || [],
        passportImages: companyCertificatesData?.passportImages || [],
    })

    const generalError = ref('')

    // Computed Properties
    const isSubmitting = computed(
        () => isSavingCompanyCertificates.value || isSubmittingDocuments.value
    )

    const hasAnyDocuments = computed(() => {
        return form.passportImages.length > 0 || form.companyRegistrationCertificate.length > 0
    })

    const canSubmit = computed(() => {
        // const hasRequiredDocuments =
        //     form.passportImages.length > 0 && form.companyRegistrationCertificate.length > 0
        // return hasRequiredDocuments && !isSubmitting.value

        return form.companyRegistrationCertificate.length > 0 && !isSubmitting.value
    })

    const documentModalData = computed(() => ({
        passportImages: form.passportImages,
        companyCertificate: form.companyRegistrationCertificate,
    }))

    // Helper function to safely extract File objects from reactive wrappers
    const extractFileFromReactive = (fileObj: any): File | null => {
        // If it's already a File instance, return it
        if (fileObj instanceof File) {
            return fileObj
        }

        // If it's a reactive object with a file property
        if (fileObj && typeof fileObj === 'object') {
            // Try to get the raw value using toRaw
            const rawObj = toRaw(fileObj)

            // Check if the raw object has a file property that's a File
            if (rawObj?.file instanceof File) {
                return rawObj.file
            }

            // Check if the raw object itself is a File
            if (rawObj instanceof File) {
                return rawObj
            }

            // If it has a file property directly
            if (fileObj.file instanceof File) {
                return fileObj.file
            }
        }

        console.warn('Could not extract File from object:', fileObj)
        return null
    }

    // Methods
    const updateCertificatesData = () => {
        updateStepData('companyCertificates', {
            passportImages: form.passportImages,
            companyCertificate: form.companyRegistrationCertificate,
            completed: true,
        })
    }

    // Document Upload Methods
    const openDocumentModal = () => {
        showDocumentModal.value = true
    }

    const handleDocumentUpload = async (documents: any) => {
        try {
            isSubmittingDocuments.value = true

            // Update form data
            form.passportImages = [...documents.passportImages]
            form.companyRegistrationCertificate = [...documents.companyCertificate]

            generalError.value = ''
            clearError()
            showDocumentModal.value = false

            toast.success(
                t('certificates.documentsUploadedSuccessfully', 'Documents uploaded successfully!'),
                t('success', 'Success')
            )

            updateCertificatesData()
        } catch (error) {
            toast.error(
                t('error.documentUploadFailed', 'Failed to upload documents. Please try again.'),
                t('error', 'Error')
            )
        } finally {
            isSubmittingDocuments.value = false
        }
    }

    const handleDocumentCancel = (documents: any) => {
        isSubmittingDocuments.value = true

        // Update form data
        form.passportImages = [...documents.passportImages]
        form.companyRegistrationCertificate = [...documents.companyCertificate]
        updateCertificatesData()

        showDocumentModal.value = false
        isSubmittingDocuments.value = false
    }

    // Submit Methods - Fixed to properly handle File extraction
    const handleSubmit = async () => {
        if (!canSubmit.value) return

        try {
            generalError.value = ''

            // Safely extract all File objects from reactive wrappers
            const allFileObjects = [...form.passportImages, ...form.companyRegistrationCertificate]

            const certificates = allFileObjects
                .map((fileObj) => {
                    // For existing files from server (have ID)
                    if (fileObj?.id) {
                        return {
                            id: fileObj.id,
                            file: null,
                        }
                    }

                    // For new uploaded files (no ID yet)
                    const file = extractFileFromReactive(fileObj)
                    if (!file) return null

                    return {
                        file,
                    }
                })
                .filter(Boolean)

            if (certificates.length === 0) {
                generalError.value = t('error.noValidFiles')
                return
            }

            // Use the composable method
            const { success } = await completeCompanyCertificates(certificates)

            if (success) {
                toast.success(
                    t('register.companyDocumentsSaved', 'Company documents saved successfully!'),
                    t('success', 'Success')
                )

                await router.push(localePath('/register/business-certificates'))
            } else {
                generalError.value = t(
                    'errors.generalSubmit',
                    'Failed to save documents. Please try again.'
                )
            }
        } catch (error) {
            console.error('Submit error:', error)
            generalError.value = t(
                'errors.generalSubmit',
                'Failed to save documents. Please try again.'
            )
        }
    }

    // Navigation Methods
    const handleGoBack = async () => {
        updateCertificatesData()

        if (!useUserStore().isSupplier) {
            await router.push(localePath('/register/company-details/banks'))
        } else {
            await router.push(localePath('/register/export-details'))
        }
    }

    const loadCompanyCertificates = async () => {
        try {
            const certificates = await loadAndPopulateFieldRegistration('media_documents')
            const companyCertificates = certificates.filter(
                (item) => item.type === 'company_certificate'
            )
            if (companyCertificates?.length) {
                form.companyRegistrationCertificate = companyCertificates.map((certificate) => ({
                    id: certificate.id || null,
                    name: certificate.file_name,
                    file: certificate.file_path,
                    size: certificate.file_size,
                    previewUrl: certificate.url,
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
            updateStepData('companyCertificates', {
                passportImages: newForm.passportImages,
                companyCertificate: newForm.companyRegistrationCertificate,
                completed: true,
            })
        },
        { deep: true }
    )

    // Lifecycle
    onMounted(async () => {
        await loadCompanyCertificates()
        initializeStep('companyCertificates')
        isLoading.value = false
    })
</script>
