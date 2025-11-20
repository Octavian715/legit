<!-- pages/register/export-details.vue -->
<template>
    <AuthContainer
        class="bg-gray-150"
        :full-height="false"
        content-class="max-w-2xl mx-auto"
        class-container="w-full"
        spacing
    >
        <template #header>
            <h2 class="font-bold text-gray-950 text-subtitle1 text-center">
                {{ $t('company.exportDetails', 'Export details') }}
            </h2>
        </template>

        <div class="mt-3">
            <div v-if="isLoading" class="flex justify-center items-center p-8">
                <span class="loader"></span>
            </div>

            <div v-else class="flex flex-col w-full md:w-1/2 mx-auto space-y-3">
                <form
                    class="flex flex-col gap-3"
                    :class="{ 'gap-6': !form.doesExport }"
                    novalidate
                    @submit.prevent="handleSubmit"
                >
                    <div class="bg-white text-center rounded p-3 border border-gray-600 space-y-3">
                        <h3 class="text-subtitle1 font-medium text-gray-850">
                            {{ $t('company.doesCompanyExport', 'Does your company export?') }}
                        </h3>
                        <div class="flex justify-center gap-5">
                            <Radiobox
                                v-model="form.doesExport"
                                :value="true"
                                name="doesExport"
                                :label="$t('yes', 'Yes')"
                                @update:model-value="clearFieldError('doesExport')"
                            />
                            <Radiobox
                                v-model="form.doesExport"
                                :value="false"
                                name="doesExport"
                                :label="$t('no', 'No')"
                                @update:model-value="clearFieldError('doesExport')"
                            />
                        </div>
                        <div v-if="errors.doesExport" class="text-center">
                            <p class="text-caption1 text-red-500" role="alert">
                                {{ errors.doesExport }}
                            </p>
                        </div>
                    </div>

                    <div v-if="form.doesExport" class="space-y-3">
                        <Select
                            v-model="form.exportSinceYear"
                            :label="
                                $t(
                                    'company.startYearExport',
                                    'Year when your company started exporting'
                                )
                            "
                            name="exportSinceYear"
                            background="bg-white"
                            :error="!!errors.exportSinceYear"
                            :error-message="errors.exportSinceYear"
                            size="lg"
                            required
                            class="select-year"
                            :options="yearOptions"
                            @update:model-value="clearFieldError('exportSinceYear')"
                        />

                        <MultiSelect
                            v-model="form.exportCountries"
                            :label="
                                $t(
                                    'company.chooseExportCountries',
                                    'Which countries do you export?'
                                )
                            "
                            required
                            name="exportCountries"
                            background="bg-white"
                            :error="!!errors.exportCountries"
                            :error-message="errors.exportCountries"
                            size="lg"
                            :options="countryOptions"
                            :disabled="!staticDataReady"
                            @update:model-value="clearFieldError('exportCountries')"
                        />

                        <Select
                            v-model="form.userExportPercentageId"
                            :label="$t('company.chooseExportProcentage', 'Export percentage')"
                            name="userExportPercentageId"
                            background="bg-white"
                            :error="!!errors.userExportPercentageId"
                            :error-message="errors.userExportPercentageId"
                            size="lg"
                            required
                            :options="exportPercentageOptions"
                            :disabled="!staticDataReady"
                            @update:model-value="clearFieldError('userExportPercentageId')"
                        />

                        <div class="space-y-2">
                            <TagInput
                                v-model="form.exportPorts"
                                :label="$t('company.nearestPort', 'Nearest Port')"
                                :suggestions="portSuggestions"
                                :placeholder="$t('company.portPlaceholder', 'Type port name...')"
                                size="lg"
                                :allow-duplicates="false"
                                :min-chars="1"
                                :validate-on-enter="true"
                                @add="handleAddPort"
                                @remove="handleRemovePort"
                                @search="handlePortSearch"
                            />
                            <div v-if="errors.exportPorts" class="text-left">
                                <p class="text-caption1 text-red-500" role="alert">
                                    {{ errors.exportPorts }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div v-if="generalError" class="text-center">
                        <p class="text-caption1 text-red-500" role="alert">
                            {{ generalError }}
                        </p>
                    </div>

                    <div class="flex flex-col gap-6">
                        <div class="flex flex-col sm:flex-row gap-3 justify-between">
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
                                type="submit"
                                variant="filled"
                                color="red"
                                :label="$t('nextStep', 'Next step')"
                                class="w-full"
                                :loading="isSubmitting"
                                :disabled="!canSubmit"
                            />
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </AuthContainer>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, onMounted, watch } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useLocalePath } from '#imports'
    import { useRouter } from 'vue-router'
    import { validateData } from '~/utils/validator/index'
    import { useRegistrationNavigation } from '~/useRegistrationNavigation'
    import { useStaticData } from '~/composables/useStaticData'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { useUserStore } from '~/stores/user'
    import { useRegistrationStore } from '~/stores/register'

    import {
        exportDetailsSchema,
        type ExportDetailsFormData,
    } from '~/utils/validator/schemas/auth/registerSchema'

    definePageMeta({ middleware: ['registration'], layout: 'auth' })

    const { t } = useI18n({ useScope: 'global' })
    const localePath = useLocalePath()
    const router = useRouter()
    const userStore = useUserStore()
    const registerStore = useRegistrationStore()
    const {
        getStepData,
        updateStepData,
        initializeStep,
        isSavingExportDetails,

        getError,
        getFieldErrors,
        hasFieldErrors,
        clearError,
        completeExportDetails,
    } = useRegistrationNavigation()
    const {
        countryOptions,
        exportPercentageOptions,
        error: staticDataError,
        isLoaded: staticDataReady,
    } = useStaticData()
    const toast = useToastNotification()

    const isLoading = ref(true)
    const exportData = getStepData('exportDetails') as any

    const form = reactive<ExportDetailsFormData>({
        doesExport: exportData?.doesExport ?? false,
        exportSinceYear: exportData?.exportSinceYear || null,
        userExportPercentageId: exportData?.userExportPercentageId || null,
        exportCountries: exportData?.exportCountries || [],
        exportPorts: exportData?.exportPorts || [],
    })

    const errors = reactive({
        doesExport: '',
        exportSinceYear: '',
        userExportPercentageId: '',
        exportCountries: '',
        exportPorts: '',
    })

    const generalError = ref('')

    const yearOptions = computed(() => {
        const currentYear = new Date().getFullYear()
        const years = []
        for (let year = currentYear; year >= 1850; year--) {
            years.push({
                value: year,
                label: year.toString(),
            })
        }
        return years
    })

    const portSuggestions = ref([
        { value: 'Port Baltimore', label: 'Port Baltimore' },
        { value: 'UKI Port', label: 'UKI Port' },
        { value: 'Rotterdam Port', label: 'Rotterdam Port' },
        { value: 'Hamburg Port', label: 'Hamburg Port' },
        { value: 'Antwerp Port', label: 'Antwerp Port' },
        { value: 'Le Havre Port', label: 'Le Havre Port' },
        { value: 'Gioia Tauro Port', label: 'Gioia Tauro Port' },
        { value: 'Valencia Port', label: 'Valencia Port' },
        { value: 'Piraeus Port', label: 'Piraeus Port' },
        { value: 'Barcelona Port', label: 'Barcelona Port' },
        { value: 'Marseille Port', label: 'Marseille Port' },
        { value: 'Genoa Port', label: 'Genoa Port' },
        { value: 'Naples Port', label: 'Naples Port' },
        { value: 'Livorno Port', label: 'Livorno Port' },
        { value: 'Venice Port', label: 'Venice Port' },
    ])

    const fieldMapping: Record<string, keyof typeof errors> = {
        does_export: 'doesExport',
        export_since_year: 'exportSinceYear',
        user_export_percentage_id: 'userExportPercentageId',
        export_countries: 'exportCountries',
        export_ports: 'exportPorts',
    }

    const isSubmitting = computed(() => isSavingExportDetails.value)

    const canSubmit = computed(() => {
        if (form.doesExport === null || isSubmitting.value) return false

        if (!form.doesExport) return true

        const requiredFieldsFilled =
            form.exportSinceYear !== null &&
            form.userExportPercentageId !== null &&
            form.exportCountries.length > 0

        const noErrors = !Object.values(errors).some((error) => error)

        return requiredFieldsFilled && noErrors
    })

    const handleAddPort = (port: any) => {
        const portName = typeof port === 'string' ? port : port.value || port.label
        clearFieldError('exportPorts')
        toast.success(
            t('company.portAdded', `Port "${portName}" added successfully`),
            t('success', 'Success')
        )
    }

    const handleRemovePort = (port: any, index: number) => {
        const portName = typeof port === 'string' ? port : port.value || port.label
        toast.info(t('company.portRemoved', `Port "${portName}" removed`), t('info', 'Info'))
    }

    const handlePortSearch = (query: string) => {
        // Optional: implement dynamic port search
    }

    const mapBackendErrorsToFields = (backendErrors: Record<string, string | string[]>) => {
        Object.entries(backendErrors).forEach(([backendField, messages]) => {
            const message = Array.isArray(messages) ? messages[0] : messages
            const frontendField = fieldMapping[backendField]

            if (frontendField && frontendField in errors) {
                errors[frontendField] = message as string
            } else {
                generalError.value = message as string
            }
        })
    }

    const syncStoreErrorsToFields = () => {
        const storeError = getError()
        const fieldErrors = getFieldErrors()

        if (hasFieldErrors() && fieldErrors) {
            mapBackendErrorsToFields(fieldErrors)
            return
        }

        if (storeError?.status === 422 && storeError.errors) {
            mapBackendErrorsToFields(storeError.errors)
            return
        }

        if (storeError && !hasFieldErrors()) {
            const errorMessage =
                storeError.message ||
                t('errors.generalSubmit', 'Failed to save export details. Please try again.')
            toast.error(errorMessage, t('error', 'Error'))
        }
    }

    const validateForm = (): boolean => {
        clearAllErrors()

        if (!form.doesExport && form.doesExport !== false) {
            errors.doesExport = t(
                'company.exportRequired',
                'Please specify if your company exports.'
            )
            return false
        }

        if (form.doesExport === false) {
            return true
        }

        const exportPorts = form.exportPorts.map((port) => {
            return port.label || port
        })

        const validationResult = validateData('exportDetails', exportDetailsSchema, {
            ...form,
            exportPorts: exportPorts,
        })

        if (!validationResult.isValid) {
            validationResult.errors.forEach((error) => {
                if (error.field in errors) {
                    errors[error.field as keyof typeof errors] = error.message
                } else {
                    generalError.value = error.message
                }
            })
        }

        return validationResult.isValid
    }

    const clearFieldError = (field: keyof typeof errors) => {
        if (errors[field]) {
            errors[field] = ''
        }
        generalError.value = ''
        clearError()
    }

    const clearAllErrors = () => {
        Object.keys(errors).forEach((key) => {
            errors[key as keyof typeof errors] = ''
        })
        generalError.value = ''
        clearError()
    }

    const updateExportData = () => {
        updateStepData('exportDetails', { ...form })
    }

    const handleSubmit = async () => {
        clearAllErrors()

        if (!validateForm()) {
            return
        }

        try {
            let exportDetailsData = { does_export: form.doesExport }

            if (form.doesExport) {
                const exportPorts = form.exportPorts.map((port) => {
                    return port.label || port
                })
                exportDetailsData = {
                    ...exportDetailsData,
                    export_since_year: form.exportSinceYear,
                    user_export_percentage_id: form.userExportPercentageId,
                    export_countries: form.exportCountries,
                }

                if (exportPorts.length)
                    exportDetailsData = Object.assign(exportDetailsData, {
                        export_ports: exportPorts,
                    })
            }

            const { success } = await completeExportDetails(1, exportDetailsData)

            if (success) {
                toast.success(
                    t('register.exportDetailsSaved', 'Export details saved successfully!'),
                    t('success', 'Success')
                )

                await router.push(localePath('/register/company-certificates'))
            }
        } catch (error) {
            toast.error(
                t('errors.generalSubmit', 'Failed to save export details. Please try again.'),
                t('error', 'Error')
            )
        }
    }

    const handleGoBack = async () => {
        updateExportData()
        await router.push(localePath('/register/production-details'))
    }

    const loadExportData = async () => {
        try {
            const currentUser = userStore.user

            if (!currentUser) {
                return
            }

            const exportDetails = currentUser.export_details
            const exportCountries = currentUser.export_countries
            const exportPorts = currentUser.export_ports

            const hasExportData = Boolean(
                exportCountries?.length ||
                    exportPorts?.length ||
                    (exportDetails?.export_since_year !== null &&
                        exportDetails?.export_since_year !== undefined)
            )

            if (form.doesExport === null || form.doesExport === undefined) {
                form.doesExport = hasExportData
            }

            if (!form.exportSinceYear && exportDetails?.export_since_year) {
                form.exportSinceYear = exportDetails.export_since_year
            }

            if (!form.userExportPercentageId && exportDetails?.export_percentage?.id) {
                form.userExportPercentageId = exportDetails.export_percentage.id
            }

            if (!form.exportCountries?.length && Array.isArray(exportCountries)) {
                form.exportCountries = exportCountries
                    .map((item) => item?.id)
                    .filter((id) => id !== null && id !== undefined)
            }

            if (!form.exportPorts?.length && Array.isArray(exportPorts)) {
                form.exportPorts = exportPorts.filter(Boolean)
            }
        } catch (error) {
            console.error('[ExportDetails] Error loading user data:', error)

            if (form.doesExport === null) {
                form.doesExport = false
            }
        }
    }

    watch(
        () => [getError(), getFieldErrors(), hasFieldErrors()],
        ([newError, newFieldErrors, hasErrors]) => {
            if (newError || hasErrors) {
                syncStoreErrorsToFields()
            }
        },
        { immediate: true, deep: true }
    )

    watch(
        () => ({ ...form }),
        (newForm) => {
            updateStepData('exportDetails', newForm)
        },
        { deep: true }
    )

    watch(
        () => form.doesExport,
        (newValue) => {
            if (newValue === false) {
                form.exportSinceYear = null
                form.userExportPercentageId = null
                form.exportCountries = []
                form.exportPorts = []
                clearAllErrors()
            }
        }
    )

    onMounted(async () => {
        await loadExportData()
        initializeStep('exportDetails')
        isLoading.value = false
        syncStoreErrorsToFields()
    })
</script>

<style lang="scss">
    .select-year {
        .floating-label.lg {
            @apply md:!top-2;
        }
    }
</style>
