<!-- ~/components/features/ecommerce/settings/tabs/BankAccountsTab.vue -->
<template>
    <div class="w-full space-y-3">
        <!-- Bank Accounts Section -->
        <section>
            <h2 class="text-subtitle3 text-gray-800 mb-3">
                {{ $t('bank.bankAccounts', 'Bank Accounts') }}
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
                    v-else-if="bankAccounts.length === 0"
                    image="/images/register/no-banks.webp"
                    image-width="350px"
                    image-height="240px"
                    :title="$t('bank.noBankAccountsFound', 'No Bank Accounts found')"
                    :description="
                        $t(
                            'bank.noBankAccountsDescription',
                            'You haven\'t added any bank accounts yet. To manage your payments, start by adding one.'
                        )
                    "
                    button-color="blue"
                    :button-label="
                        $t(
                            'addATemplate',
                            { template: $t('bank.bankAccount', 'Bank Account') },
                            'Add a Bank Account'
                        )
                    "
                    @action="handleAddBankAccount"
                />

                <!-- Bank Accounts List -->
                <div v-else class="space-y-3">
                    <Collapse
                        v-for="(account, index) in bankAccounts"
                        :key="account.id || `bank-account-${index}`"
                        :edit="true"
                        :close="true"
                        @edit="handleEditBankAccount(index, account)"
                        @delete="handleDeleteBankAccount(index)"
                    >
                        <template #title>
                            <div class="flex items-center gap-2 flex-1">
                                <h3 class="font-medium text-gray-950 text-subtitle3">
                                    {{ account.bankName }}
                                </h3>
                                <svg
                                    v-if="!account.iban || !account.currencyId"
                                    class="w-5 h-5 text-amber-500"
                                    title="Missing required fields"
                                >
                                    <use :xlink:href="`/sprite.svg#warning`" />
                                </svg>
                            </div>
                        </template>

                        <div class="space-y-3">
                            <div
                                v-if="!account.iban || !account.currencyId"
                                class="bg-amber-50 border border-amber-200 rounded p-3 text-amber-800 text-caption1"
                            >
                                {{
                                    $t(
                                        'bank.incompleteDetails',
                                        'This bank account is missing required information. Please edit to add IBAN and currency.'
                                    )
                                }}
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <FieldDisplay
                                    :label="$t('bank.accountHolderName', 'Account Holder Name')"
                                    :value="account.accountHolderName"
                                />
                                <FieldDisplay
                                    :label="$t('bank.iban', 'IBAN')"
                                    :value="account.iban"
                                    :class="{ 'text-amber-600': !account.iban }"
                                />
                                <FieldDisplay
                                    :label="$t('bank.bicSwiftCode', 'BIC/SWIFT Code')"
                                    :value="account.swiftCode"
                                />
                                <FieldDisplay
                                    :label="$t('bank.currencyType', 'Currency Type')"
                                    :value="getCurrencyName(account.currencyId)"
                                    :class="{ 'text-amber-600': !account.currencyId }"
                                />
                                <FieldDisplay
                                    :label="$t('bank.chooseCountry', 'Country')"
                                    :value="getCountryName(account.countryId)"
                                />
                                <FieldDisplay
                                    v-if="account.stateName"
                                    :label="$t('company.chooseState', 'State')"
                                    :value="account.stateName"
                                />
                                <FieldDisplay
                                    :label="$t('company.city', 'City')"
                                    :value="account.cityName"
                                />
                                <FieldDisplay
                                    :label="$t('company.street', 'Street')"
                                    :value="`${account.streetName} ${account.streetNumber}`"
                                />
                                <FieldDisplay
                                    :label="$t('company.postalCode', 'Postal Code')"
                                    :value="account.postalCode"
                                />
                            </div>
                        </div>
                    </Collapse>

                    <!-- Add Another Bank Account Button -->
                    <div class="flex justify-center">
                        <Button
                            variant="filled"
                            color="blue"
                            size="lg"
                            :label="
                                $t(
                                    'addATemplate',
                                    { template: $t('bank.bankAccount', 'Bank Account') },
                                    'Add a Bank Account'
                                )
                            "
                            @click="handleAddBankAccount"
                        />
                    </div>
                </div>
            </div>
        </section>

        <!-- Add/Edit Bank Account Modal -->
        <Modal
            v-model:is-open="showModal"
            :title="modalTitle"
            content-width="sm:max-w-md"
            hide-footer
            @close="handleCloseModal"
        >
            <BankAccountForm
                :initial-data="editingAccount"
                :is-submitting="isSubmittingModal"
                show-actions
                @save="handleSaveBankAccount"
                @cancel="handleCloseModal"
            />
        </Modal>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useUserStore } from '~/stores/user'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { useStaticData } from '~/composables/useStaticData'
    import type { BankAccountFormData } from '~/utils/validator/schemas/auth/registerSchema'

    const { t } = useI18n()
    const userStore = useUserStore()
    const { error: showError } = useToastNotification()
    const { countries, currencies } = useStaticData()

    // Loading states
    const isLoading = ref(false)
    const isSubmittingModal = ref(false)
    const isInitializing = ref(false) // Prevent watch during load

    // Modal state
    const showModal = ref(false)
    const editingIndex = ref<number | null>(null)
    const editingAccount = ref<Partial<BankAccountFormData> | null>(null)

    // Bank accounts data
    const bankAccounts = ref<BankAccountFormData[]>([])

    // Original data for change detection
    const originalData = ref<BankAccountFormData[]>([])

    // Session storage keys
    const BANK_ACCOUNTS_STORAGE_KEY = 'bankAccountsTab_unsavedAccounts'
    const ORIGINAL_STORAGE_KEY = 'bankAccountsTab_originalAccounts'

    // Modal title
    const modalTitle = computed(() => {
        return editingIndex.value !== null
            ? t('modal.editBankAccount', 'Edit Bank Account')
            : t('modal.addBankAccount', 'Add Bank Account')
    })

    // Computed: Check if form is dirty (has unsaved changes)
    const isDirty = computed(() => {
        const currentData = JSON.stringify(bankAccounts.value)
        const original = JSON.stringify(originalData.value)
        return currentData !== original
    })

    /**
     * Get currency name from ID
     */
    const getCurrencyName = (id: number | null) => {
        if (!id) return t('bank.notSet', 'Not set')
        const currency = currencies.value.find((c) => c.id === id)
        return currency?.code || '-'
    }

    /**
     * Get country name from ID
     */
    const getCountryName = (id: number | null) => {
        if (!id) return t('bank.notSet', 'Not set')
        const country = countries.value.find((c) => c.id === id)
        return country?.name || '-'
    }

    /**
     * Restore bank accounts from sessionStorage
     */
    const restoreBankAccountsFromSession = (): boolean => {
        try {
            const savedAccounts = sessionStorage.getItem(BANK_ACCOUNTS_STORAGE_KEY)
            const savedOriginal = sessionStorage.getItem(ORIGINAL_STORAGE_KEY)

            if (savedAccounts && savedOriginal) {
                isInitializing.value = true // Block watch

                bankAccounts.value = JSON.parse(savedAccounts)
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
     * Save bank accounts to sessionStorage
     */
    const saveBankAccountsToSession = () => {
        try {
            sessionStorage.setItem(BANK_ACCOUNTS_STORAGE_KEY, JSON.stringify(bankAccounts.value))
            sessionStorage.setItem(ORIGINAL_STORAGE_KEY, JSON.stringify(originalData.value))
        } catch (error) {
            // Silent fail
        }
    }

    /**
     * Clear bank accounts from sessionStorage
     */
    const clearBankAccountsFromSession = () => {
        try {
            sessionStorage.removeItem(BANK_ACCOUNTS_STORAGE_KEY)
            sessionStorage.removeItem(ORIGINAL_STORAGE_KEY)
        } catch (error) {
            // Silent fail
        }
    }

    /**
     * Load bank accounts from user store
     */
    const loadBankAccounts = () => {
        // Check if we have cached data in session
        if (restoreBankAccountsFromSession()) {
            return
        }

        try {
            isLoading.value = true
            isInitializing.value = true // Block watch

            // ✅ FIX: Get bank_accounts directly from user, NOT from company_details
            const accounts = userStore.user?.bank_accounts || []

            // Transform backend data to frontend format
            bankAccounts.value = accounts.map((account: any) => ({
                id: account.id,
                bankName: account.bank_name,
                accountHolderName: account.account_holder_name,
                iban: account.iban,
                swiftCode: account.swift_code,
                currencyId: account.currency?.id || null,
                countryId: account.country?.id || null,
                stateName: account.state?.name || account.state_name || '',
                cityName: account.city_name,
                streetName: account.street_name,
                streetNumber: account.street_number,
                postalCode: account.postal_code,
            }))

            originalData.value = JSON.parse(JSON.stringify(bankAccounts.value))

            // Wait for next tick to save to session (after watch has been skipped)
            nextTick(() => {
                saveBankAccountsToSession()
                isInitializing.value = false // Unblock watch
            })
        } catch (error: any) {
            isInitializing.value = false
            showError(
                error.message || t('bank.errorLoadingAccounts', 'Error loading bank accounts'),
                t('error', 'Error')
            )
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Handle add bank account
     */
    const handleAddBankAccount = () => {
        editingIndex.value = null
        editingAccount.value = null
        showModal.value = true
    }

    /**
     * Handle edit bank account
     */
    const handleEditBankAccount = (index: number, account: BankAccountFormData) => {
        editingIndex.value = index
        editingAccount.value = { ...account }
        showModal.value = true
    }

    /**
     * Handle save bank account (from modal)
     */
    const handleSaveBankAccount = async (accountData: BankAccountFormData) => {
        try {
            isSubmittingModal.value = true

            if (editingIndex.value !== null) {
                // Update existing account
                bankAccounts.value[editingIndex.value] = accountData
            } else {
                // Add new account
                bankAccounts.value.push(accountData)
            }

            // Watch will auto-save to session

            // Close modal
            handleCloseModal()
        } catch (error: any) {
            showError(
                error.message || t('bank.errorSavingAccount', 'Error saving bank account'),
                t('error', 'Error')
            )
        } finally {
            isSubmittingModal.value = false
        }
    }

    /**
     * Handle delete bank account
     */
    const handleDeleteBankAccount = (index: number) => {
        bankAccounts.value.splice(index, 1)

        // Watch will auto-save to session
    }

    /**
     * Handle close modal
     */
    const handleCloseModal = () => {
        showModal.value = false
        editingIndex.value = null
        editingAccount.value = null
    }

    /**
     * Validate form
     */
    const validate = () => {
        // Check if all bank accounts have required fields
        const invalidAccounts = bankAccounts.value.filter(
            (account) => !account.iban || !account.currencyId
        )

        if (invalidAccounts.length > 0) {
            showError(
                t(
                    'bank.missingRequiredFields',
                    'Some bank accounts are missing required fields (IBAN or currency)'
                ),
                t('error', 'Error')
            )
            return { isValid: false, errors: [] }
        }

        return { isValid: true, errors: [] }
    }

    /**
     * Save bank accounts to backend
     */
    const save = async (): Promise<boolean> => {
        try {
            // Validate first
            const validation = validate()
            if (!validation.isValid) {
                return false
            }

            // Filter only complete bank accounts (with required fields)
            const completeAccounts = bankAccounts.value.filter(
                (account) => account.iban && account.currencyId
            )

            if (completeAccounts.length === 0) {
                showError(
                    t(
                        'bank.noValidAccounts',
                        'No valid bank accounts to save. Please add IBAN and currency.'
                    ),
                    t('error', 'Error')
                )
                return false
            }

            // Transform frontend data to backend format
            const bankAccountsPayload = completeAccounts.map((account) => ({
                id: account.id || undefined,
                bank_name: account.bankName,
                account_holder_name: account.accountHolderName,
                iban: account.iban,
                swift_code: account.swiftCode,
                currency_id: account.currencyId,
                country_id: account.countryId,
                state_name: account.stateName || undefined,
                city_name: account.cityName,
                street_name: account.streetName,
                street_number: account.streetNumber,
                postal_code: account.postalCode,
            }))

            // Use userStore.updateProfile with bank_accounts
            await userStore.updateProfile({
                bank_accounts: bankAccountsPayload,
            })

            // Update original data after successful save
            originalData.value = JSON.parse(JSON.stringify(bankAccounts.value))

            // Clear session storage
            clearBankAccountsFromSession()

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
        bankAccounts.value = JSON.parse(JSON.stringify(originalData.value))

        // Clear session storage
        clearBankAccountsFromSession()
    }

    // Watch bank accounts changes to auto-save to sessionStorage
    watch(
        bankAccounts,
        () => {
            // Skip if initializing to prevent infinite loop
            if (isInitializing.value) {
                return
            }

            // Only save if there are actual changes
            if (isDirty.value) {
                saveBankAccountsToSession()
            }
        },
        { deep: true }
    )

    // Watch user changes to reload bank accounts when user becomes available
    watch(
        () => userStore.user?.bank_accounts,
        (newBankAccounts, oldBankAccounts) => {
            // Clean session storage when user logs out (user becomes null)
            if (oldBankAccounts && !newBankAccounts) {
                clearBankAccountsFromSession()
                bankAccounts.value = []
                originalData.value = []
                return
            }

            // Only reload if user has bank accounts and we haven't loaded from session
            if (newBankAccounts && newBankAccounts.length > 0 && bankAccounts.value.length === 0) {
                loadBankAccounts()
            }
        },
        { immediate: true }
    )

    // Load bank accounts on mount
    onMounted(() => {
        loadBankAccounts()
    })

    // Clean up session storage before component unmounts
    onBeforeUnmount(() => {
        // Only clear if there are no unsaved changes
        if (!isDirty.value) {
            clearBankAccountsFromSession()
        }
    })

    // Expose methods to parent
    defineExpose({
        validate,
        save,
        reset,
        isDirty,
    })
</script>
