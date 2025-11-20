<!-- components/forms/BankAccountForm.vue -->
<template>
    <div class="bank-account-form">
        <form novalidate @submit.prevent="handleSubmit">
            <div class="flex flex-col gap-3 px-5">
                <!-- Bank Name -->
                <Input
                    v-model="form.bankName"
                    :label="t('bank.bankName', 'Bank Name')"
                    name="bankName"
                    background="bg-white"
                    :error="!!errors.bankName"
                    :error-message="errors.bankName"
                    required
                    autocomplete="organization"
                    @input="clearFieldError('bankName')"
                />

                <!-- Account Holder Name -->
                <Input
                    v-model="form.accountHolderName"
                    :label="t('bank.accountHolderName', 'Account Holder Name')"
                    name="accountHolderName"
                    background="bg-white"
                    :error="!!errors.accountHolderName"
                    :error-message="errors.accountHolderName"
                    required
                    autocomplete="name"
                    @input="clearFieldError('accountHolderName')"
                />

                <!-- IBAN -->
                <Input
                    v-model="form.iban"
                    :label="t('bank.iban', 'IBAN')"
                    name="iban"
                    background="bg-white"
                    :error="!!errors.iban"
                    :error-message="errors.iban"
                    required
                    @input="clearFieldError('iban')"
                />

                <!-- BIC/SWIFT Code -->
                <Input
                    v-model="form.swiftCode"
                    :label="t('bank.bicSwiftCode', 'BIC/SWIFT Code')"
                    name="swiftCode"
                    background="bg-white"
                    :error="!!errors.swiftCode"
                    :error-message="errors.swiftCode"
                    required
                    @input="clearFieldError('swiftCode')"
                />

                <!-- Currency Type -->
                <Select
                    v-model="form.currencyId"
                    :label="t('bank.currencyType', 'Currency Type')"
                    name="currencyId"
                    background="bg-white"
                    :error="!!errors.currencyId"
                    :error-message="errors.currencyId"
                    required
                    size="lg"
                    :options="currencyOptions"
                    :disabled="!staticDataReady"
                    @update:model-value="clearFieldError('currencyId')"
                />

                <!-- Choose Country -->
                <Select
                    v-model="form.countryId"
                    :label="t('bank.chooseCountry', 'Choose country')"
                    name="countryId"
                    background="bg-white"
                    :error="!!errors.countryId"
                    :error-message="errors.countryId"
                    required
                    size="lg"
                    :options="countryOptions"
                    :disabled="!staticDataReady"
                    @update:model-value="clearFieldError('countryId')"
                />

                <!-- State -->
                <Input
                    v-model="form.stateName"
                    :label="t('company.chooseState')"
                    name="stateName"
                    background="bg-white"
                    :error="!!errors.stateName"
                    :error-message="errors.stateName"
                    @input="clearFieldError('stateName')"
                />

                <!-- Enter Your City -->
                <Input
                    v-model="form.cityName"
                    :label="t('bank.enterYourCity', 'Enter your city')"
                    name="cityName"
                    background="bg-white"
                    :error="!!errors.cityName"
                    :error-message="errors.cityName"
                    required
                    @input="clearFieldError('cityName')"
                />

                <!-- Street -->
                <Input
                    v-model="form.streetName"
                    :label="t('bank.street', 'Street')"
                    name="streetName"
                    background="bg-white"
                    :error="!!errors.streetName"
                    :error-message="errors.streetName"
                    required
                    @input="clearFieldError('streetName')"
                />

                <!-- Number and Postal Code - Side by Side -->
                <div class="flex gap-3">
                    <!-- Number -->
                    <div class="flex-1">
                        <Input
                            v-model="form.streetNumber"
                            :label="t('bank.number', 'Number')"
                            name="streetNumber"
                            background="bg-white"
                            :error="!!errors.streetNumber"
                            :error-message="errors.streetNumber"
                            required
                            @input="clearFieldError('streetNumber')"
                        />
                    </div>

                    <!-- Postal Code -->
                    <div class="flex-1">
                        <Input
                            v-model="form.postalCode"
                            :label="t('bank.postalCode', 'Postal code')"
                            name="postalCode"
                            background="bg-white"
                            :error="!!errors.postalCode"
                            :error-message="errors.postalCode"
                            required
                            @input="clearFieldError('postalCode')"
                        />
                    </div>
                </div>
            </div>

            <!-- Actions (if showActions is true) -->
            <div
                v-if="showActions"
                class="flex gap-3 justify-center border-t border-gray-400 mt-3 pt-3"
            >
                <Button
                    type="button"
                    color="gray"
                    variant="filled"
                    :label="t('cancel', 'Cancel')"
                    :disabled="isSubmitting"
                    @click="handleCancel"
                />

                <Button
                    type="submit"
                    color="blue"
                    :label="editMode ? t('update', 'Update') : t('addBank', 'Add bank')"
                    :loading="isSubmitting"
                    :disabled="!canSubmit"
                />
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, onMounted, watch } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { validateData } from '~/utils/validator/index'
    import { useStaticData } from '~/composables/useStaticData'
    import { useToastNotification } from '~/composables/useToastNotification'

    import {
        bankAccountSchema,
        type BankAccountFormData,
    } from '~/utils/validator/schemas/auth/registerSchema'

    interface Props {
        initialData?: Partial<BankAccountFormData> | null
        showActions?: boolean
        isSubmitting?: boolean
    }

    const props = withDefaults(defineProps<Props>(), {
        initialData: null,
        showActions: false,
        isSubmitting: false,
    })

    const emit = defineEmits<{
        (e: 'save', data: BankAccountFormData): void
        (e: 'cancel'): void
    }>()

    // Composables
    const { t } = useI18n({ useScope: 'global' })
    const toast = useToastNotification()
    const {
        countryOptions,
        currencyOptions,
        error: staticDataError,
        isLoaded: staticDataReady,
    } = useStaticData()

    // State
    const editMode = computed(() => !!props.initialData?.id)

    // Form data - using exact schema field names
    const form = reactive<BankAccountFormData>({
        id: props.initialData?.id || null,
        bankName: props.initialData?.bankName || '',
        accountHolderName: props.initialData?.accountHolderName || '',
        iban: props.initialData?.iban || '',
        swiftCode: props.initialData?.swiftCode || '',
        currencyId: props.initialData?.currencyId || 0,
        countryId: props.initialData?.countryId || 0,
        stateName: props.initialData?.stateName || null,
        cityName: props.initialData?.cityName || '',
        streetName: props.initialData?.streetName || '',
        streetNumber: props.initialData?.streetNumber || '',
        postalCode: props.initialData?.postalCode || '',
    })

    // Field errors
    const errors = reactive({
        bankName: '',
        accountHolderName: '',
        iban: '',
        swiftCode: '',
        currencyId: '',
        countryId: '',
        stateName: '',
        cityName: '',
        streetName: '',
        streetNumber: '',
        postalCode: '',
    })

    // Computed Properties
    const canSubmit = computed(() => {
        return (
            form.bankName &&
            form.accountHolderName &&
            form.iban &&
            form.swiftCode &&
            form.currencyId > 0 &&
            form.countryId > 0 &&
            form.cityName &&
            form.streetName &&
            form.streetNumber &&
            form.postalCode &&
            !Object.values(errors).some((error) => error) &&
            !props.isSubmitting &&
            staticDataReady.value
        )
    })

    // Form validation
    const validateForm = (): boolean => {
        clearAllErrors()

        const validationResult = validateData('bankAccount', bankAccountSchema, form)

        if (!validationResult.isValid) {
            validationResult.errors.forEach((error) => {
                if (error.field in errors) {
                    errors[error.field as keyof typeof errors] = error.message
                }
            })
        }

        return validationResult.isValid
    }

    // Clear field error on user input
    const clearFieldError = (field: keyof typeof errors) => {
        if (errors[field]) {
            errors[field] = ''
        }
    }

    // Clear all field errors
    const clearAllErrors = () => {
        Object.keys(errors).forEach((key) => {
            errors[key as keyof typeof errors] = ''
        })
    }

    // Handlers
    const handleSubmit = () => {
        if (!validateForm()) {
            return
        }

        emit('save', { ...form })
    }

    const handleCancel = () => {
        emit('cancel')
    }

    // Update form when initialData changes
    watch(
        () => props.initialData,
        (newData) => {
            if (newData) {
                Object.assign(form, {
                    id: newData.id || null,
                    bankName: newData.bankName || '',
                    accountHolderName: newData.accountHolderName || '',
                    iban: newData.iban || '',
                    swiftCode: newData.swiftCode || '',
                    currencyId: newData.currencyId || 0,
                    countryId: newData.countryId || 0,
                    stateName: newData.stateName,
                    cityName: newData.cityName || '',
                    streetName: newData.streetName || '',
                    streetNumber: newData.streetNumber || '',
                    postalCode: newData.postalCode || '',
                })
            }
        },
        { immediate: true, deep: true }
    )

    onMounted(() => {
        // Check for static data errors
        if (staticDataError.value) {
            toast.error(
                t('error.staticDataLoad', 'Failed to load application data'),
                t('error', 'Error')
            )
        }
    })
</script>
