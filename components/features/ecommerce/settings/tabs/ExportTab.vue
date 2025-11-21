<!-- ~/components/settings/tabs/ExportTab.vue -->
<template>
    <div class="w-full space-y-3 mb-20">
        <!-- Export Question Section -->
        <section class="">
            <h2 class="text-subtitle3 text-gray-800 mb-3">
                {{ $t('company.exportDetails', 'Export details') }}
            </h2>

            <div class="rounded p-6 border border-gray-600 space-y-3">
                <h3 class="text-subtitle3 text-gray-850 text-center">
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

                <div v-if="errors.doesExport" class="text-center mt-2">
                    <p class="text-caption1 text-red-500" role="alert">
                        {{ errors.doesExport }}
                    </p>
                </div>
            </div>
        </section>

        <!-- Export Details Section (shown only if doesExport is true) -->
        <section v-if="form.doesExport" class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <!-- Export Start Year -->
            <Select
                v-model="form.exportSinceYear"
                :label="$t('company.startYearExport', 'Year when your Company started exporting')"
                name="exportSinceYear"
                background="bg-white"
                size="lg"
                required
                :options="yearOptions"
                :error="!!errors.exportSinceYear"
                :error-message="errors.exportSinceYear"
                @update:model-value="
                    (value) => {
                        form.exportSinceYear = value?.toString() || null
                        clearFieldError('exportSinceYear')
                    }
                "
            />

            <!-- Export Percentage -->
            <Select
                v-model="form.userExportPercentageId"
                :label="$t('company.chooseExportProcentage', 'Export Percentage')"
                name="userExportPercentageId"
                background="bg-white"
                size="lg"
                required
                :options="exportPercentageOptions"
                :error="!!errors.userExportPercentageId"
                :error-message="errors.userExportPercentageId"
                @update:model-value="clearFieldError('userExportPercentageId')"
            />

            <!-- Export Countries -->
            <Select
                v-model="form.exportCountries"
                :label="$t('company.chooseExportCountries', 'Export Countries')"
                name="exportCountries"
                background="bg-white"
                size="lg"
                multiple
                required
                :options="countryOptions"
                :disabled="!staticDataReady"
                :error="!!errors.exportCountries"
                :clearable="false"
                :error-message="errors.exportCountries"
                @update:model-value="clearFieldError('exportCountries')"
            />

            <!-- Nearest Ports -->
            <TagInput
                v-model="form.exportPorts"
                :label="$t('company.nearestPort', 'Nearest Port')"
                :suggestions="portSuggestions"
                :placeholder="$t('company.portPlaceholder', 'Type port name...')"
                size="lg"
                :allow-duplicates="false"
                :min-chars="1"
            />
        </section>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, nextTick } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useUserStore } from '~/stores/user'
    import { useStaticData } from '~/composables/useStaticData'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { validator } from '~/utils/validator/index'
    import { exportTabSchema } from '~/utils/validator/schemas/user/exportTab'
    import type { ExportTabFormData } from '~/utils/validator/schemas/user/exportTab'

    const { t } = useI18n()
    const userStore = useUserStore()

    // Get formatted options from useStaticData
    const {
        countryOptions,
        exportPercentageOptions,
        isLoading: staticDataLoading,
    } = useStaticData()

    // Static data ready
    const staticDataReady = computed(() => !staticDataLoading.value)

    // Form data
    const form = ref({
        doesExport: false,
        exportSinceYear: null as string | null,
        exportCountries: [] as number[],
        userExportPercentageId: null as number | null,
        exportPorts: [] as string[], // Array of port names (strings)
    })

    // Session storage key for persisting form during re-mounts
    const FORM_STORAGE_KEY = 'exportTab_unsavedForm'
    const ERRORS_STORAGE_KEY = 'exportTab_validationErrors'

    // Normalize exportPorts array to ensure all values are strings
    const normalizeExportPorts = (ports: any[]): string[] => {
        if (!Array.isArray(ports)) return []
        return ports.map((port) => {
            // If it's already a string, return it
            if (typeof port === 'string') return port
            // If it's an object with value property, extract the value
            if (typeof port === 'object' && port !== null && 'value' in port) {
                return String(port.value)
            }
            // Fallback: convert to string
            return String(port)
        })
    }

    // Try to restore form from sessionStorage (survives re-mounts)
    const restoreFormFromSession = () => {
        try {
            const saved = sessionStorage.getItem(FORM_STORAGE_KEY)
            if (saved) {
                const parsed = JSON.parse(saved)
                console.log('[ExportTab] Restored form from session:', parsed)
                // Normalize exportPorts to ensure they're all strings
                if (parsed.exportPorts) {
                    parsed.exportPorts = normalizeExportPorts(parsed.exportPorts)
                }
                form.value = parsed
                return true
            }
        } catch (error) {
            console.error('[ExportTab] Failed to restore form from session:', error)
        }
        return false
    }

    // Try to restore errors from sessionStorage
    const restoreErrorsFromSession = () => {
        try {
            const saved = sessionStorage.getItem(ERRORS_STORAGE_KEY)
            if (saved) {
                const parsed = JSON.parse(saved)
                console.log('[ExportTab] Restoring errors from session:', parsed)

                // ✅ Clear errors first, then assign to preserve reactivity
                errors.value = {}
                Object.assign(errors.value, parsed)

                console.log('[ExportTab] Errors restored:', errors.value)

                // Force re-render in nextTick to ensure components show errors
                nextTick(() => {
                    console.log('[ExportTab] After nextTick - errors still present:', errors.value)
                })

                return true
            }
        } catch (error) {
            console.error('[ExportTab] Failed to restore errors from session:', error)
        }
        return false
    }

    // Save form to sessionStorage
    const saveFormToSession = () => {
        try {
            sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(form.value))
            console.log('[ExportTab] Saved form to session')
        } catch (error) {
            console.error('[ExportTab] Failed to save form to session:', error)
        }
    }

    // Save errors to sessionStorage
    const saveErrorsToSession = () => {
        try {
            sessionStorage.setItem(ERRORS_STORAGE_KEY, JSON.stringify(errors.value))
            console.log('[ExportTab] Saved errors to session')
        } catch (error) {
            console.error('[ExportTab] Failed to save errors to session:', error)
        }
    }

    // Clear form from sessionStorage
    const clearFormFromSession = () => {
        try {
            sessionStorage.removeItem(FORM_STORAGE_KEY)
            console.log('[ExportTab] Cleared form from session')
        } catch (error) {
            console.error('[ExportTab] Failed to clear form from session:', error)
        }
    }

    // Clear errors from sessionStorage
    const clearErrorsFromSession = () => {
        try {
            sessionStorage.removeItem(ERRORS_STORAGE_KEY)
            console.log('[ExportTab] Cleared errors from session')
        } catch (error) {
            console.error('[ExportTab] Failed to clear errors from session:', error)
        }
    }

    // Port suggestions (hardcoded list like in export-details.vue)
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

    // Original data for change detection
    const originalData = ref({ ...form.value })

    // Validation errors
    const errors = ref<Partial<Record<keyof ExportTabFormData, string>>>({})

    // Generate year options (current year - 100 to current year)
    const yearOptions = computed(() => {
        const currentYear = new Date().getFullYear()
        const years = []
        for (let year = currentYear; year >= currentYear - 100; year--) {
            years.push({
                value: year.toString(),
                label: year.toString(),
            })
        }
        return years
    })

    // Check if form has unsaved changes
    const isDirty = computed(() => {
        return JSON.stringify(form.value) !== JSON.stringify(originalData.value)
    })

    // Debug: Watch isDirty changes
    watch(isDirty, (newValue, oldValue) => {
        console.log('[ExportTab] isDirty changed:', {
            from: oldValue,
            to: newValue,
            formData: JSON.parse(JSON.stringify(form.value)),
            originalData: JSON.parse(JSON.stringify(originalData.value)),
        })

        // Save form to session when it becomes dirty
        if (newValue) {
            saveFormToSession()
        }
    })

    // Watch form changes to auto-save to sessionStorage
    watch(
        form,
        () => {
            if (isDirty.value) {
                saveFormToSession()
            }
        },
        { deep: true }
    )

    // Watch errors changes to auto-save to sessionStorage
    // This ensures errors persist even when user corrects some fields
    watch(
        errors,
        (newErrors) => {
            const hasErrors = Object.keys(newErrors).length > 0
            if (hasErrors) {
                saveErrorsToSession()
                console.log('[ExportTab] Errors changed, saved to session:', newErrors)
            } else {
                clearErrorsFromSession()
                console.log('[ExportTab] All errors cleared, removed from session')
            }
        },
        { deep: true }
    )

    /**
     * Clear field error
     */
    const clearFieldError = (field: keyof ExportTabFormData) => {
        delete errors.value[field]
    }

    /**
     * Validate single field
     */
    const validateField = (field: keyof ExportTabFormData) => {
        const result = validator.validateField(
            exportTabSchema,
            field,
            form.value[field],
            form.value as ExportTabFormData
        )

        if (!result.valid && result.errors) {
            const error = result.errors[0]
            errors.value[field] = t(error.message)
        } else {
            clearFieldError(field)
        }

        return result.valid
    }

    // Load export details from user store
    const loadExportData = () => {
        const user = userStore.user

        // If export_details is null/undefined → company doesn't export
        if (!user?.export_details) {
            form.value = {
                doesExport: false,
                exportSinceYear: null,
                exportCountries: [],
                userExportPercentageId: null,
                exportPorts: [],
            }
            originalData.value = { ...form.value }
            return
        }

        // If export_details exists → company exports
        const exportDetails = user.export_details

        form.value = {
            // If export_details exists, company exports
            doesExport: true,
            // export_since_year is a number from API
            exportSinceYear: exportDetails.export_since_year?.toString() || null,
            // export_countries is at user root level, contains objects with id
            exportCountries: user.export_countries?.map((c: any) => c.id) || [],
            // export_percentage is an object with id property
            userExportPercentageId: exportDetails.export_percentage?.id || null,
            // export_ports is at user root level, normalize to ensure strings
            exportPorts: normalizeExportPorts(user.export_ports || []),
        }

        // Store original data
        originalData.value = { ...form.value }
    }

    /**
     * Validate form
     * Returns { isValid: boolean, errors: string[] }
     * Note: errors array is always empty - field errors are shown inline
     */
    /**
     * Validate form
     * Returns { isValid: boolean, errors: string[] }
     * Errors are shown inline under fields, not as toast notifications
     */
    const validate = () => {
        // Clear all errors
        errors.value = {}

        // If doesExport is false, no validation needed
        if (!form.value.doesExport) {
            // Clear errors from session if validation passes
            clearErrorsFromSession()
            return { isValid: true, errors: [] }
        }

        // Manual validation when doesExport is true
        if (!form.value.exportSinceYear) {
            errors.value.exportSinceYear = t('validation.export.exportSinceYearRequired')
        } else if (!/^\d{4}$/.test(form.value.exportSinceYear)) {
            errors.value.exportSinceYear = t('validation.export.exportSinceYearInvalid')
        }

        if (!form.value.userExportPercentageId) {
            errors.value.userExportPercentageId = t(
                'validation.export.userExportPercentageIdRequired'
            )
        }

        if (!form.value.exportCountries || form.value.exportCountries.length === 0) {
            errors.value.exportCountries = t('validation.export.exportCountriesRequired')
        } else if (form.value.exportCountries.length > 50) {
            errors.value.exportCountries = t('validation.export.exportCountriesTooMany')
        }

        const isValid = Object.keys(errors.value).length === 0

        // ✅ Save errors to sessionStorage if validation failed
        // This ensures errors persist across re-mounts (e.g., when modal closes)
        if (!isValid) {
            saveErrorsToSession()
        } else {
            clearErrorsFromSession()
        }

        // Return empty errors array - validation errors are shown inline only
        return { isValid, errors: [] }
    }

    /**
     * Save export details
     */
    /**
     * Save export details
     */
    const save = async (): Promise<boolean> => {
        try {
            // Validate first
            const validation = validate()
            if (!validation.isValid) {
                // Validation errors are shown inline under fields
                // No toast notifications for validation errors
                // Errors are already saved to sessionStorage by validate()
                return false
            }

            // Build payload conditionally
            const payload: any = {
                does_export: form.value.doesExport,
            }

            // Only include export fields if doesExport is true
            if (form.value.doesExport) {
                payload.export_since_year = parseInt(form.value.exportSinceYear || '')
                payload.export_countries = form.value.exportCountries
                payload.user_export_percentage_id = form.value.userExportPercentageId

                // Optional: export_ports - normalize to ensure all values are strings
                if (form.value.exportPorts && form.value.exportPorts.length > 0) {
                    payload.export_ports = normalizeExportPorts(form.value.exportPorts)
                }
            }

            await userStore.updateExportDetails(payload)

            // Update original data after successful save
            originalData.value = { ...form.value }

            // ✅ Clear form and errors from sessionStorage after successful save
            clearFormFromSession()
            clearErrorsFromSession()

            return true
        } catch (error) {
            console.error('[ExportTab] Save failed:', error)
            // Show toast only for server errors
            useToast().error(
                t('settings.errorSavingChanges', 'Error saving changes'),
                t('error', 'Error')
            )
            return false
        }
    }

    // Reset form to original data
    const reset = () => {
        form.value = { ...originalData.value }
        errors.value = {} // Clear errors

        // ✅ Clear form and errors from sessionStorage when resetting
        clearFormFromSession()
        clearErrorsFromSession()
    }

    // Clear export fields when doesExport is set to false
    watch(
        () => form.value.doesExport,
        (newValue) => {
            if (!newValue) {
                form.value.exportSinceYear = null
                form.value.exportCountries = []
                form.value.userExportPercentageId = null
                form.value.exportPorts = []
            }
        }
    )

    // Watch user data and auto-load when it changes
    // BUT: Don't reload if form has unsaved changes (is dirty) OR if form is persisted in session
    watch(
        () => userStore.user?.export_details,
        (exportDetails, oldExportDetails) => {
            console.log('[ExportTab] Watcher triggered', {
                isDirty: isDirty.value,
                hasExportDetails: !!exportDetails,
                isOldExportDetails: !!oldExportDetails,
                currentErrors: { ...errors.value },
            })

            // ✅ Guard #0: Check if form is persisted in sessionStorage
            // This protects against re-mounts when modal is open
            const formRestored = restoreFormFromSession()
            const errorsRestored = restoreErrorsFromSession()

            if (formRestored) {
                console.log('[ExportTab] Form restored from session - skipping auto-reload')
                console.log('[ExportTab] Current state after restore:', {
                    form: { ...form.value },
                    errors: { ...errors.value },
                    errorsRestored,
                })

                // Force a re-validation to ensure errors are visible
                if (errorsRestored) {
                    console.log('[ExportTab] Errors were restored, forcing component update')
                    nextTick(() => {
                        console.log('[ExportTab] After nextTick - errors:', { ...errors.value })
                    })
                }

                return
            }

            // ✅ Guard #1: Nu reîncărcăm datele dacă form-ul e dirty (are modificări nesalvate)
            if (isDirty.value) {
                console.log('[ExportTab] Skipping auto-reload - form has unsaved changes')
                return
            }

            // ✅ Guard #2: Nu reîncărcăm dacă datele nu s-au schimbat de fapt
            // (previne reload-uri inutile când watcher-ul se trigger fără schimbări reale)
            if (oldExportDetails && exportDetails) {
                const oldData = JSON.stringify(oldExportDetails)
                const newData = JSON.stringify(exportDetails)
                if (oldData === newData) {
                    console.log('[ExportTab] Skipping auto-reload - data unchanged')
                    return
                }
            }

            if (exportDetails) {
                console.log('[ExportTab] Loading export data from store')
                loadExportData()
            }
        },
        { immediate: true, deep: true }
    )

    // Expose methods to parent
    defineExpose({
        validate,
        save,
        reset,
        isDirty,
    })
</script>
