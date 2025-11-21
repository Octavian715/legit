<!-- pages/register/company-details/banks.vue - Fixed navigation -->
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
                {{ $t('bank.bankingAccount', 'Banking account') }}
            </h2>
            <p class="text-subtitle3 text-gray-700 text-center mt-2">
                {{ $t('stepOf', { n: '6/6' }, `Step 6/6`) }}
            </p>
        </template>

        <div class="py-3">
            <!-- Loading State -->
            <div v-if="isLoading" class="flex justify-center items-center p-8">
                <span class="loader"></span>
            </div>

            <!-- Bank Accounts Management -->
            <div v-else class="w-full max-w-2xl mx-auto">
                <!-- Empty State -->
                <div v-if="form.bankAccounts.length === 0" class="text-center py-6 pt-3">
                    <!-- <NuxtImg
                        src="/images/register/no-banks.webp"
                        :alt="`no banks`"
                        class="max-h-64 w-full h-full object-contain transition-transform duration-200"
                        loading="lazy"
                    /> -->
                    <img
                        src="/images/register/no-banks.webp"
                        :alt="`no banks`"
                        class="max-h-64 w-full h-full object-contain transition-transform duration-200"
                        loading="lazy"
                    />
                    <!-- Add Bank Account Button -->
                    <Button
                        variant="filled"
                        color="blue"
                        size="lg"
                        :label="$t('bank.addBankAccount', 'Add bank account')"
                        :disabled="isSubmitting"
                        class="w-full max-w-md mx-auto"
                        @click="handleAddBank"
                    />
                </div>

                <!-- Bank Accounts List -->
                <div v-else class="space-y-3 pb-6">
                    <div v-for="(account, index) in form.bankAccounts" :key="account.id || index">
                        <BankAccountItem
                            :account="account"
                            :index="index"
                            :is-editing="editingIndex === index"
                            @edit="handleEditBank(index, account)"
                            @delete="handleDeleteBank(index)"
                            @save="handleSaveBank"
                            @cancel="handleCancelEdit"
                        />
                    </div>

                    <!-- Add Another Bank Account Button -->
                    <div class="flex w-full max-w-md mx-auto">
                        <Button
                            variant="filled"
                            color="blue"
                            size="lg"
                            :label="$t('bank.addBankAccount', 'Add bank account')"
                            :disabled="isSubmitting"
                            class="w-full"
                            @click="handleAddBank"
                        />
                    </div>
                </div>

                <!-- Error Display -->
                <div v-if="errors.bankAccounts" class="text-center mt-4">
                    <p class="text-caption1 text-red-500" role="alert">
                        {{ errors.bankAccounts }}
                    </p>
                </div>

                <!-- Navigation Buttons -->
                <div class="flex flex-col w-full max-w-md mx-auto gap-6">
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
                @save="handleSaveBank"
                @cancel="handleCloseModal"
            />
        </Modal>
    </AuthContainer>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, onMounted, watch } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useLocalePath } from '#imports'
    import { useRouter } from 'vue-router'
    import { validateData } from '~/utils/validator'
    import { useRegistrationNavigation } from '~/composables/useRegistrationNavigation'
    import { useToastNotification } from '~/composables/useToastNotification'

    import {
        bankAccountSchema,
        type BankAccountFormData,
    } from '~/utils/validator/schemas/auth/registerSchema'

    definePageMeta({ middleware: ['registration'], layout: 'auth' })

    // Composables
    const { t } = useI18n({ useScope: 'global' })
    const localePath = useLocalePath()
    const router = useRouter()
    const {
        getStepData,
        updateStepData,
        initializeStep,
        isSavingCompanyDetails,

        getError,
        getFieldErrors,
        hasFieldErrors,
        clearError,
        completeBankDetails,
        loadAndPopulateFieldRegistration,
    } = useRegistrationNavigation()

    const registerStore = useRegistrationStore()
    const toast = useToastNotification()

    // State
    const isLoading = ref(true)
    const showModal = ref(false)
    const editingIndex = ref<number | null>(null)
    const editingAccount = ref<Partial<BankAccountFormData> | null>(null)
    const isSubmittingModal = ref(false)

    // Get current data
    const companyData = getStepData('companyDetails') as any

    // Form data
    const form = reactive({
        bankAccounts: companyData?.banks?.bankAccounts || [],
    })

    // Field errors
    const errors = reactive({
        bankAccounts: '',
    })

    // Enhanced backend error mapping
    const fieldMapping: Record<string, keyof typeof errors> = {
        bank_accounts: 'bankAccounts',
        bankAccounts: 'bankAccounts',
    }

    // Computed Properties
    const isSubmitting = computed(() => isSavingCompanyDetails.value)

    const canSubmit = computed(() => {
        return (
            form.bankAccounts.length > 0 &&
            !Object.values(errors).some((error) => error) &&
            !isSubmitting.value
        )
    })

    const modalTitle = computed(() => {
        return editingIndex.value !== null
            ? t('bank.editBankAccount', 'Edit Bank Account')
            : t('bank.addBankAccount', 'Add Bank Account')
    })

    // Helper function to determine next step based on account type
    const getNextStepPath = (supplier: boolean): string => {
        // ONLY Supplier (id: 1) → production-details
        if (supplier) {
            return '/register/production-details'
        }

        // Buyer (id: 2) and Service Provider (id: 3) → company-certificates
        return '/register/company-certificates'
    }

    // Methods
    const handleAddBank = () => {
        editingIndex.value = null
        editingAccount.value = null
        showModal.value = true
    }

    const handleSkip = async () => {
        try {
            clearAllErrors()

            toast.info(
                t(
                    'bank.bankDetailsSkipped',
                    'Bank details skipped. You can add them later from settings.'
                ),
                t('info', 'Info')
            )

            const isSupplier = useUserStore().isSupplier
            // Navigate to correct next step
            const nextPath = getNextStepPath(isSupplier)

            // const bankAccountsData = form.bankAccounts.map((account) => ({
            //     id: account.id || null,
            //     bank_name: account.bankName,
            //     account_holder_name: account.accountHolderName,
            //     iban: account.iban,
            //     swift_code: account.swiftCode,
            //     currency_id: account.currencyId,
            //     country_id: account.countryId,
            //     state_id: account.stateName || null,
            //     city_name: account.cityName,
            //     street_name: account.streetName,
            //     street_number: account.streetNumber,
            //     postal_code: account.postalCode,
            // }))

            const { success } = await registerStore.completeCompanyDetails(
                6,
                {},
                isSupplier ? 'factory-details' : 'certificates',
                1
            )
            if (success) {
                await router.push(localePath(nextPath))
            }
        } catch (error) {
            console.error('[Banks] Navigation error:', error)
            toast.error(
                t('error.navigationFailed', 'Failed to navigate. Please try again.'),
                t('error', 'Error')
            )
        }
    }

    const handleEditBank = (index: number, account: BankAccountFormData) => {
        editingIndex.value = index
        editingAccount.value = { ...account }
        showModal.value = true
    }

    const handleDeleteBank = (index: number) => {
        form.bankAccounts.splice(index, 1)
        clearFieldError('bankAccounts')
        updateBankData()

        toast.success(
            t('bank.accountRemoved', 'Bank account removed successfully'),
            t('success', 'Success')
        )
    }

    const handleSaveBank = async (accountData: BankAccountFormData) => {
        isSubmittingModal.value = true

        try {
            if (editingIndex.value !== null) {
                form.bankAccounts[editingIndex.value] = { ...accountData }
                toast.success(
                    t('bank.accountUpdated', 'Bank account updated successfully'),
                    t('success', 'Success')
                )
            } else {
                form.bankAccounts.push({ ...accountData })
                toast.success(
                    t('bank.accountAdded', 'Bank account added successfully'),
                    t('success', 'Success')
                )
            }

            clearFieldError('bankAccounts')
            updateBankData()
            handleCloseModal()
        } catch (error) {
            toast.error(
                t('errors.generalSubmit', 'Failed to save bank account. Please try again.'),
                t('error', 'Error')
            )
        } finally {
            isSubmittingModal.value = false
        }
    }

    const handleCancelEdit = () => {
        editingIndex.value = null
    }

    const handleCloseModal = () => {
        showModal.value = false
        editingIndex.value = null
        editingAccount.value = null
        isSubmittingModal.value = false
    }

    // Enhanced backend error mapping function
    const mapBackendErrorsToFields = (backendErrors: Record<string, string | string[]>) => {
        Object.entries(backendErrors).forEach(([backendField, messages]) => {
            const message = Array.isArray(messages) ? messages[0] : messages
            const frontendField = fieldMapping[backendField]

            if (frontendField && frontendField in errors) {
                errors[frontendField] = message as string
            }
        })
    }

    // Enhanced store error sync
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
                t('errors.generalSubmit', 'Failed to save bank details. Please try again.')
            toast.error(errorMessage, t('error', 'Error'))
        }
    }

    // Form validation
    const validateForm = (): boolean => {
        clearAllErrors()

        if (form.bankAccounts.length === 0) {
            errors.bankAccounts = t(
                'validation.bankAccountRequired',
                'At least one bank account is required'
            )
            return false
        }

        let allValid = true
        for (const account of form.bankAccounts) {
            const validationResult = validateData('bankAccount', bankAccountSchema, account)
            if (!validationResult.isValid) {
                allValid = false
                errors.bankAccounts = t(
                    'validation.invalidBankAccounts',
                    'Please check all bank account details'
                )
                break
            }
        }

        return allValid
    }

    // Clear field error
    const clearFieldError = (field: keyof typeof errors) => {
        if (errors[field]) {
            errors[field] = ''
        }
        clearError()
    }

    // Clear all field errors
    const clearAllErrors = () => {
        Object.keys(errors).forEach((key) => {
            errors[key as keyof typeof errors] = ''
        })
        clearError()
    }

    // Update store
    const updateBankData = () => {
        updateStepData('companyDetails', {
            section: 'banks', // Changed from 'bank' to match your store structure
            data: { ...form },
        })
    }

    // Enhanced submit handler - FIXED NAVIGATION
    const handleSubmit = async () => {
        clearAllErrors()

        if (!validateForm()) {
            return
        }

        try {
            // Prepare bank accounts data for backend
            const bankAccountsData = form.bankAccounts.map((account) => ({
                id: account.id || null,
                bank_name: account.bankName,
                account_holder_name: account.accountHolderName,
                iban: account.iban,
                swift_code: account.swiftCode,
                currency_id: account.currencyId,
                country_id: account.countryId,
                state_name: account.stateName || null,
                city_name: account.cityName,
                street_name: account.streetName,
                street_number: account.streetNumber,
                postal_code: account.postalCode,
            }))

            const payload = {
                bank_accounts: bankAccountsData,
            }

            const { success, nextStep, nextSubstep } = await completeBankDetails({ ...payload })

            if (success) {
                toast.success(
                    t('register.bankDetailsSaved', 'Bank details saved successfully!'),
                    t('success', 'Success')
                )

                return useUserStore().isSupplier
                    ? await router.push(localePath('/register/production-details'))
                    : await router.push(localePath('/register/company-certificates'))
            } else {
                syncStoreErrorsToFields()
            }
        } catch (error) {
            console.error('[Banks] Submit error:', error)
            toast.error(
                t('errors.generalSubmit', 'Failed to save bank details. Please try again.'),
                t('error', 'Error')
            )
        }
    }

    // Go back handler
    const handleGoBack = async () => {
        updateBankData()

        await router.push(localePath('/register/company-details/contacts'))
    }

    const loadUserBanksAccounts = async () => {
        try {
            const userCompanyBanksAccounts = await loadAndPopulateFieldRegistration('bank_accounts')

            const hasBanksAccounts = userCompanyBanksAccounts.length > 0

            if (hasBanksAccounts) {
                form.bankAccounts =
                    companyData?.banks?.bankAccounts ||
                    userCompanyBanksAccounts.map((account) => ({
                        id: account.id || null,
                        bankName: account.bank_name,
                        accountHolderName: account.account_holder_name,
                        iban: account.iban,
                        swiftCode: account.swift_code,
                        currencyId: account.currency?.id || null,
                        countryId: account.country?.id || null,
                        stateName: account.state_name || null,
                        cityName: account.city_name,
                        streetName: account.street_name,
                        streetNumber: account.street_number,
                        postalCode: account.postal_code,
                    }))
            }
        } catch (error) {
            console.error('[CompanyForm] Error loading user company data:', error)
        }
    }

    // Watch store errors and sync them to fields
    watch(
        () => [getError(), getFieldErrors(), hasFieldErrors()],
        ([newError, newFieldErrors, hasErrors]) => {
            if (newError || hasErrors) {
                syncStoreErrorsToFields()
            }
        },
        { immediate: true, deep: true }
    )

    // Watch form changes to update store
    watch(
        () => ({ ...form }),
        (newForm) => {
            updateStepData('companyDetails', {
                section: 'banks', // Updated to match naming convention
                data: newForm,
            })
        },
        { deep: true }
    )

    // Lifecycle
    onMounted(async () => {
        await loadUserBanksAccounts()
        initializeStep('companyDetails')
        isLoading.value = false

        // Check for any existing store errors
        syncStoreErrorsToFields()
    })
</script>

<style scoped>
    .space-y-4 > * + * {
        margin-top: 1rem;
    }
</style>
