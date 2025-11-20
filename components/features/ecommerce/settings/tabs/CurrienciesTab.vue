<template>
    <div class="currencies-tab space-y-6">
        <h2 class="text-subtitle2 text-gray-800 py-1">
            {{ t('settings.currencies.title') }}
        </h2>

        <div v-if="isLoading" class="animate-pulse space-y-4">
            <div class="bg-white border border-gray-400 rounded-sm p-5">
                <div class="h-5 bg-gray-300 rounded w-40 mb-4"></div>
                <div class="h-10 bg-gray-200 rounded"></div>
            </div>
            <div v-if="doExport" class="bg-white border border-gray-400 rounded-sm p-5">
                <div class="h-5 bg-gray-300 rounded w-40 mb-4"></div>
                <div class="h-10 bg-gray-200 rounded"></div>
            </div>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
                id="local-currency"
                v-model="localCurrencyId"
                :label="t('settings.currencies.localCurrency')"
                :options="currencyOptions"
                :error-message="localCurrencyError"
                size="lg"
                :disabled="isLoading"
                :required="true"
                :searchable="true"
                :clearable="false"
                @update:model-value="handleLocalCurrencyChange"
            />

            <Select
                v-if="doExport"
                id="export-currency"
                v-model="exportCurrencyId"
                :label="t('settings.currencies.exportCurrency')"
                :options="currencyOptions"
                :error-message="exportCurrencyError"
                size="lg"
                :disabled="isLoading"
                :required="true"
                :searchable="true"
                :clearable="false"
                @update:model-value="handleExportCurrencyChange"
            />
        </div>

        <div
            v-if="!doExport"
            class="bg-blue-50 border border-blue-200 rounded-sm p-4 flex items-start gap-3"
        >
            <svg
                class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
            <div class="flex-1">
                <p class="text-small text-blue-800 font-medium mb-1">
                    {{ t('settings.currencies.exportNotEnabled') }}
                </p>
                <p class="text-small text-blue-700">
                    {{ t('settings.currencies.exportNotEnabledDescription') }}
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { useI18n } from 'vue-i18n'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { useStaticData } from '~/composables/useStaticData'
    import { useConfirmation } from '~/composables/useConfirmModal'
    import { useUserStore } from '~/stores/user'
    import { storeToRefs } from 'pinia'

    const { t } = useI18n()
    const { error: showError } = useToastNotification()
    const { currencyOptions } = useStaticData()
    const { showConfirmation } = useConfirmation()
    const userStore = useUserStore()
    const { user, doExport } = storeToRefs(userStore)

    const localCurrencyId = ref<number | null>(null)
    const exportCurrencyId = ref<number | null>(null)
    const originalLocalCurrencyId = ref<number | null>(null)
    const originalExportCurrencyId = ref<number | null>(null)
    const isLoading = ref(true)
    const isDirty = ref(false)

    const localCurrencyError = ref<string>('')
    const exportCurrencyError = ref<string>('')

    const loadCurrencies = () => {
        try {
            isLoading.value = true

            const localId = user.value?.default_local_currency?.id || null
            const exportId = user.value?.default_export_currency?.id || null

            localCurrencyId.value = localId
            exportCurrencyId.value = exportId
            originalLocalCurrencyId.value = localId
            originalExportCurrencyId.value = exportId

            isDirty.value = false
            clearErrors()
        } catch (error) {
            console.error('Error loading currencies:', error)
            showError(t('settings.currencies.errorLoadingCurrencies'))
        } finally {
            isLoading.value = false
        }
    }

    const clearErrors = () => {
        localCurrencyError.value = ''
        exportCurrencyError.value = ''
    }

    const handleLocalCurrencyChange = (value: number | null) => {
        localCurrencyId.value = value
        localCurrencyError.value = ''
        markDirty()
    }

    const handleExportCurrencyChange = (value: number | null) => {
        exportCurrencyId.value = value
        exportCurrencyError.value = ''
        markDirty()
    }

    const markDirty = () => {
        isDirty.value = true
    }

    const validate = (): { isValid: boolean; errors: string[] } => {
        const errors: string[] = []

        clearErrors()

        if (!localCurrencyId.value) {
            const errorMsg = t('settings.currencies.localCurrencyRequired')
            localCurrencyError.value = errorMsg
            errors.push(errorMsg)
        }

        if (doExport.value && !exportCurrencyId.value) {
            const errorMsg = t('settings.currencies.exportCurrencyRequired')
            exportCurrencyError.value = errorMsg
            errors.push(errorMsg)
        }

        return {
            isValid: errors.length === 0,
            errors,
        }
    }

    const getCurrencyName = (currencyId: number | null): string => {
        if (!currencyId) return ''
        const currency = currencyOptions.value.find((c) => c.value === currencyId)
        return currency?.label || ''
    }

    const save = async (): Promise<boolean> => {
        const validation = validate()

        if (!validation.isValid) {
            return false
        }

        const details = [
            {
                label: t('settings.currencies.localCurrency'),
                value: getCurrencyName(localCurrencyId.value),
            },
        ]

        if (doExport.value) {
            details.push({
                label: t('settings.currencies.exportCurrency'),
                value: getCurrencyName(exportCurrencyId.value),
            })
        }

        const confirmed = await showConfirmation({
            title: t('settings.currencies.confirmChange.title'),
            message: t('settings.currencies.confirmChange.description'),
            details,
            warningText: t('settings.currencies.confirmChange.warning'),
            confirmText: t('settings.currencies.confirmChange.confirm'),
            cancelText: t('cancel'),
            confirmColor: 'blue',
            iconType: 'warning',
        })

        if (!confirmed) {
            return false
        }

        try {
            // Build payload for currency updates
            const payload: Record<string, number> = {}

            if (localCurrencyId.value) {
                payload.default_local_currency_id = localCurrencyId.value
            }

            if (doExport.value && exportCurrencyId.value) {
                payload.default_export_currency_id = exportCurrencyId.value
            }

            // Call updateProfile directly with both currencies in one request
            if (Object.keys(payload).length > 0) {
                await userStore.updateProfile(payload)
            }

            await userStore.fetchUser(true)

            originalLocalCurrencyId.value = localCurrencyId.value
            originalExportCurrencyId.value = exportCurrencyId.value
            isDirty.value = false
            clearErrors()

            return true
        } catch (error) {
            console.error('Error saving currencies:', error)
            showError(t('settings.currencies.errorSavingCurrencies'))

            localCurrencyId.value = originalLocalCurrencyId.value
            exportCurrencyId.value = originalExportCurrencyId.value

            return false
        }
    }

    const reset = () => {
        localCurrencyId.value = originalLocalCurrencyId.value
        exportCurrencyId.value = originalExportCurrencyId.value
        isDirty.value = false
        clearErrors()
    }

    const getTabName = () => t('settings.currencies.tabName')

    onMounted(() => {
        loadCurrencies()
    })

    watch(
        () => [user.value?.default_local_currency, user.value?.default_export_currency],
        () => {
            if (!isDirty.value) {
                loadCurrencies()
            }
        },
        { deep: true }
    )

    defineExpose({
        save,
        validate,
        reset,
        isDirty,
        getTabName,
    })
</script>

<style scoped>
    .currencies-tab {
        min-height: 400px;
    }
</style>
