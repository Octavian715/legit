<!-- components/ui/BankAccountItem.vue -->
<template>
    <div
        class="bank-account-item rounded-md bg-white overflow-hidden transition-all"
        :class="{ 'ring-2 ring-blue-500': isEditing }"
    >
        <!-- Header with Bank Name and Actions -->
        <div
            class="flex items-center justify-between p-4 pb-3.5 cursor-pointer hover:bg-gray-50"
            @click="toggleExpanded"
        >
            <div class="flex items-center gap-2">
                <!-- Expand/Collapse Icon -->
                <svg
                    :class="[
                        'w-4 h-4 text-gray-950   hover:text-gray-800 active:scale-95 transition-colors duration-200',
                        { 'rotate-180': isExpanded },
                    ]"
                >
                    <use :xlink:href="`/sprite.svg#a_down`"></use>
                </svg>

                <!-- Bank Name -->
                <h3 class="font-medium text-gray-950 text-subtitle1">
                    {{ account.bankName }}
                </h3>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2">
                <button
                    type="button"
                    class="p-2 hover:bg-blue-100 text-gray-950 hover:text-blue-600 active:scale-95 transition-colors duration-200 rounded"
                    :aria-label="$t('edit', 'Edit')"
                    @click.stop="handleEdit"
                >
                    <svg :class="['w-4 h-4  ']">
                        <use :xlink:href="`/sprite.svg#edit2`"></use>
                    </svg>
                </button>

                <ButtonClose
                    size="md"
                    icon-size="md"
                    :label="$t('close')"
                    @click="$emit('delete')"
                />
            </div>
        </div>

        <!-- Expanded Content -->
        <transition name="accordion">
            <div v-if="isExpanded">
                <div class="">
                    <div class="mx-4 border border-gray-300"></div>

                    <!-- Bank Details Grid -->
                    <div
                        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50"
                    >
                        <FieldDisplay
                            v-for="(field, key) in mappedBankFields(account)"
                            :key="key"
                            :label="field.label"
                            :value="field.value"
                        />
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
    import { ref, watch } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useStaticData } from '~/composables/useStaticData'
    import type { BankAccountFormData } from '~/utils/validator/schemas/auth/registerSchema'

    interface Props {
        account: BankAccountFormData
        index: number
        isEditing?: boolean
    }

    const props = withDefaults(defineProps<Props>(), {
        isEditing: false,
    })

    const emit = defineEmits<{
        (e: 'edit'): void
        (e: 'delete'): void
        (e: 'save', data: BankAccountFormData): void
        (e: 'cancel'): void
    }>()

    // Composables
    const { t } = useI18n({ useScope: 'global' })
    const { countries, currencies, findStatesByCountryId } = useStaticData()

    // State
    const isExpanded = ref(false)

    // Methods
    const toggleExpanded = () => {
        if (!props.isEditing) {
            isExpanded.value = !isExpanded.value
        }
    }

    const handleEdit = () => {
        isExpanded.value = true
        emit('edit')
    }

    const handleDelete = () => {
        emit('delete')
    }

    const mappedBankFields = (bank: BankAccountFormData) => ({
        bankName: {
            label: t('bank.bankName', 'Bank Name'),
            value: bank.bankName,
        },
        accountHolderName: {
            label: t('bank.accountHolderName', 'Account Holder Name'),
            value: bank.accountHolderName,
        },
        iban: {
            label: t('bank.iban', 'IBAN'),
            value: formatIban(bank.iban),
        },
        swiftCode: {
            label: t('bank.bicSwiftCode', 'BIC/SWIFT Code'),
            value: bank.swiftCode,
        },
        currencyId: {
            label: t('bank.currencyType', 'Currency Type'),
            value: getCurrencyName(bank.currencyId),
        },
        countryId: {
            label: t('bank.chooseCountry', 'Country'),
            value: getCountryName(bank.countryId),
        },
        stateId: {
            label: t('bank.chooseState', 'State'),
            value: getStateName(bank.stateId, bank.countryId),
        },
        cityName: {
            label: t('bank.enterYourCity', 'City'),
            value: bank.cityName,
        },
        streetName: {
            label: t('bank.street', 'Street'),
            value: bank.streetName,
        },
        streetNumber: {
            label: t('bank.number', 'Number'),
            value: bank.streetNumber,
        },
        postalCode: {
            label: t('bank.postalCode', 'Postal Code'),
            value: bank.postalCode,
        },
    })

    const formatIban = (iban: string): string => {
        if (!iban) return ''
        return iban.replace(/(.{4})/g, '$1 ').trim()
    }

    const getCountryName = (countryId: number): string => {
        if (!countryId) return ''
        const country = countries.value.find((c) => c.id === countryId)
        return country?.name || ''
    }

    const getCurrencyName = (currencyId: number): string => {
        if (!currencyId) return ''
        const currency = currencies.value.find((c) => c.id === currencyId)
        return currency ? `${currency.name} (${currency.symbol})` : ''
    }

    const getStateName = (stateId: number | null, countryId: number): string => {
        if (!stateId || !countryId) return ''
        const states = findStatesByCountryId(countryId)
        const state = states.find((s) => s.id === stateId)
        return state?.name || ''
    }

    // Watch editing state to expand when editing
    watch(
        () => props.isEditing,
        (newVal) => {
            if (newVal) {
                isExpanded.value = true
            }
        }
    )
</script>

<style scoped>
    .accordion-enter-active,
    .accordion-leave-active {
        transition: all 0.3s ease;
        overflow: hidden;
    }

    .accordion-enter-from,
    .accordion-leave-to {
        max-height: 0;
        opacity: 0;
    }

    .accordion-enter-to,
    .accordion-leave-from {
        max-height: 1000px;
        opacity: 1;
    }
</style>
