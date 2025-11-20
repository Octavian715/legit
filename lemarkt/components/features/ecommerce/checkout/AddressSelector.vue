<template>
    <div class="address-selector">
        <!-- Loading Skeleton -->
        <div v-if="loading" class="animate-pulse">
            <div class="h-12 bg-gray-300 rounded mb-2"></div>
            <div class="h-4 bg-gray-300 rounded w-1/4"></div>
        </div>
        <!-- Address Dropdown and Selected Address Display -->
        <div v-else>
            <!-- Dropdown Selector -->
            <Select
                :model-value="modelValue"
                :label="t('checkout.deliveryAddress')"
                :options="addressOptions"
                :error-message="errors?.address"
                :required="true"
                :searchable="false"
                :clearable="false"
                size="lg"
                :placeholder="t('checkout.selectAddress')"
                @update:model-value="handleAddressChange"
            />

            <Transition
                enter-active-class="transition ease-out duration-200"
                enter-from-class="transform opacity-0 scale-95"
                enter-to-class="transform opacity-100 scale-100"
                leave-active-class="transition ease-in duration-150"
                leave-from-class="transform opacity-100 scale-100"
                leave-to-class="transform opacity-0 scale-95"
            >
                <div v-if="selectedAddress" class="mt-3">
                    <div
                        class="bg-white border border-gray-400 rounded-sm overflow-hidden transition-colors"
                    >
                        <div class="p-3">
                            <div class="flex justify-between items-start mb-3">
                                <h4 class="text-subtitle1 font-bold text-gray-950">
                                    {{ t('checkout.selectedAddress') }}
                                </h4>
                            </div>

                            <div class="space-y-3 text-body text-gray-950">
                                <p>{{ selectedAddress.contact_name }}</p>
                                <p
                                    >{{ selectedAddress.street_number }},
                                    {{ selectedAddress.street_name }}</p
                                >
                                <p
                                    >{{ selectedAddress.city_name }},
                                    {{ selectedAddress.postal_code }}</p
                                >
                                <p>{{ getCountryName(selectedAddress.country_id) }}</p>
                                <p>{{ selectedAddress.phone_number }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Transition>

            <!-- No Addresses Warning -->
            <div
                v-if="addresses.length === 0"
                class="mt-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200"
            >
                <div class="flex">
                    <svg
                        class="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clip-rule="evenodd"
                        />
                    </svg>
                    <p class="text-caption1 text-yellow-800">
                        {{ t('checkout.noSavedAddresses') }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useStaticData } from '~/composables/useStaticData'

    interface DeliveryLocation {
        id?: number
        contact_name: string
        phone_number: string
        phone_country_id?: number
        country_id: number
        state_name?: string
        city_name: string
        street_name: string
        street_number: string
        postal_code: string
        is_default?: boolean
    }

    interface Props {
        modelValue: number | null
        addresses: DeliveryLocation[]
        loading?: boolean
        errors?: Record<string, string>
    }

    const props = withDefaults(defineProps<Props>(), {
        loading: false,
        errors: () => ({}),
    })

    const emit = defineEmits<{
        'update:modelValue': [value: number | null]
        'add-new-address': []
    }>()

    const { t } = useI18n()
    const { countryOptions } = useStaticData()

    const addressOptions = computed(() => {
        return props.addresses.map((addr) => ({
            value: addr.id,
            label: `${addr.contact_name} - ${addr.street_name} ${addr.street_number}, ${addr.city_name}${addr.is_default ? ` (${t('default')})` : ''}`,
        }))
    })

    const selectedAddress = computed(() => {
        if (!props.modelValue) return null
        return props.addresses.find((addr) => addr.id === props.modelValue)
    })

    const getCountryName = (countryId: number): string => {
        const country = countryOptions.value.find((c) => c.value === countryId)
        return country?.label || ''
    }

    const handleAddressChange = (value: number | null) => {
        emit('update:modelValue', value)
    }
</script>

<style scoped>
    .address-selector {
        @apply w-full;
    }
</style>
