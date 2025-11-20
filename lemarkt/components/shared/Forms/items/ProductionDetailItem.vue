<!-- components/ui/ProductionDetailItem.vue -->
<template>
    <div
        class="production-detail-item rounded-md bg-white overflow-hidden transition-all"
        :class="{ 'ring-2 ring-blue-500': isEditing }"
    >
        <!-- Header with Production Name and Actions -->
        <div
            class="flex items-center justify-between p-4 pb-3.5 cursor-pointer hover:bg-gray-50"
            @click="toggleExpanded"
        >
            <div class="flex items-center gap-2">
                <!-- Expand/Collapse Icon -->
                <svg
                    :class="[
                        'w-4 h-4 text-gray-950 hover:text-gray-800 active:scale-95 transition-colors duration-200',
                        { 'rotate-180': isExpanded },
                    ]"
                >
                    <use :xlink:href="`/sprite.svg#a_down`"></use>
                </svg>

                <!-- Production Name -->
                <h3 class="font-medium text-gray-950 text-subtitle1">
                    {{ detail.name }}
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
                    <svg class="w-4 h-4">
                        <use :xlink:href="`/sprite.svg#edit2`"></use>
                    </svg>
                </button>

                <ButtonClose size="md" icon-size="md" :label="$t('close')" @click="handleDelete" />
            </div>
        </div>

        <!-- Expanded Content -->
        <transition name="accordion">
            <div v-if="isExpanded">
                <div class="">
                    <div class="mx-4 border border-gray-300"></div>

                    <!-- Production Details Grid -->
                    <div
                        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50"
                    >
                        <FieldDisplay
                            v-for="(field, key) in mappedProductionFields(detail)"
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
    import type { ProductionDetailsFormData } from '~/utils/validator/schemas/auth/registerSchema'

    interface Props {
        detail: ProductionDetailsFormData
        index: number
        isEditing?: boolean
    }

    const props = withDefaults(defineProps<Props>(), {
        isEditing: false,
    })

    const emit = defineEmits<{
        (e: 'edit'): void
        (e: 'delete'): void
        (e: 'save', data: ProductionDetailsFormData): void
        (e: 'cancel'): void
    }>()

    // Composables
    const { t } = useI18n({ useScope: 'global' })
    const { countries, factorySizes, findStatesByCountryId } = useStaticData()

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

    const mappedProductionFields = (production: ProductionDetailsFormData) => ({
        name: {
            label: t('factory.name', 'Factory Name'),
            value: production.name,
        },
        userFactorySizeId: {
            label: t('factory.factorySize', 'Factory Size'),
            value: getFactorySizeName(production.userFactorySizeId),
        },
        countryId: {
            label: t('country', 'Country'),
            value: getCountryName(production.countryId),
        },
        stateId: {
            label: t('state', 'State'),
            value: getStateName(production.stateId, production.countryId),
        },
        cityName: {
            label: t('city', 'City'),
            value: production.cityName,
        },
        streetName: {
            label: t('company.street', 'Street'),
            value: production.streetName,
        },
        streetNumber: {
            label: t('company.number', 'Number'),
            value: production.streetNumber,
        },
        postalCode: {
            label: t('company.postalCode', 'Postal Code'),
            value: production.postalCode,
        },
    })

    const getCountryName = (countryId: number): string => {
        if (!countryId) return ''
        const country = countries.value.find((c) => c.id === countryId)
        return country?.name || ''
    }

    const getFactorySizeName = (factorySizeId: number): string => {
        if (!factorySizeId) return ''
        const factorySize = factorySizes.value.find((fs) => fs.id === factorySizeId)
        return factorySize?.name || ''
    }

    const getStateName = (stateId: number, countryId: number): string => {
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
