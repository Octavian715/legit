<template>
    <div class="flex flex-col gap-3 px-5">
        <div class="flex flex-col gap-3">
            <Input
                v-model="formData.quantityFrom"
                type="number"
                :label="t('product.quantityBoxes')"
                :min="1"
                :max="9999999"
                :error="errors.quantityFrom"
                size="lg"
                @update:model-value="clearError('quantityFrom')"
            />

            <Input
                v-model="formData.localPrice"
                type="number"
                :label="t('product.localUnitPrice', { currency: localCurrency })"
                :min="0.01"
                :max="999999.99"
                :step="0.01"
                :error="errors.localPrice"
                size="lg"
                @update:model-value="clearError('localPrice')"
            />

            <Input
                v-if="hasExport"
                v-model="formData.exportPrice"
                type="number"
                :label="t('product.exportUnitPrice', { currency: exportCurrency })"
                :min="0.01"
                :max="999999.99"
                :step="0.01"
                :error="errors.exportPrice"
                size="lg"
                @update:model-value="clearError('exportPrice')"
            />
        </div>

        <div v-if="generalError" class="text-red-500 text-caption1 flex items-center gap-1">
            <svg class="w-3 h-3 flex-shrink-0">
                <use :xlink:href="`/sprite.svg#info`"></use>
            </svg>
            {{ generalError }}
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue'
    import { useI18n } from 'vue-i18n'

    interface VolumeDiscountData {
        quantityFrom: number
        localPrice: number
        exportPrice: number | null
    }

    interface Props {
        localCurrency: string
        exportCurrency?: string
        hasExport: boolean
        existingData?: VolumeDiscountData
        existingQuantities?: number[]
    }

    const props = withDefaults(defineProps<Props>(), {
        hasExport: false,
        exportCurrency: '',
        existingQuantities: () => [],
    })

    const emit = defineEmits<{
        confirm: [data: VolumeDiscountData]
        cancel: []
    }>()

    const { t } = useI18n()

    const formData = ref<VolumeDiscountData>({
        quantityFrom: props.existingData?.quantityFrom || null,
        localPrice: props.existingData?.localPrice || null,
        exportPrice: props.existingData?.exportPrice || null,
    })

    const errors = ref<Record<string, string>>({})
    const generalError = ref<string | null>(null)

    const clearError = (field: string) => {
        errors.value[field] = ''
        generalError.value = null
    }

    const validateForm = (): boolean => {
        errors.value = {}
        generalError.value = null

        if (!formData.value.quantityFrom || formData.value.quantityFrom < 1) {
            errors.value.quantityFrom = t('validation.required')
            return false
        }

        if (formData.value.quantityFrom > 9999999) {
            errors.value.quantityFrom = t('validation.numberMaximum', { max: 9999999 })
            return false
        }

        if (
            props.existingQuantities.includes(formData.value.quantityFrom) &&
            (!props.existingData || props.existingData.quantityFrom !== formData.value.quantityFrom)
        ) {
            errors.value.quantityFrom = t('product.quantityAlreadyExists')
            return false
        }

        if (!formData.value.localPrice || formData.value.localPrice < 0.01) {
            errors.value.localPrice = t('validation.required')
            return false
        }

        if (formData.value.localPrice > 999999.99) {
            errors.value.localPrice = t('validation.numberMaximum', { max: 999999.99 })
            return false
        }

        if (props.hasExport) {
            if (!formData.value.exportPrice || formData.value.exportPrice < 0.01) {
                errors.value.exportPrice = t('validation.required')
                return false
            }

            if (formData.value.exportPrice > 999999.99) {
                errors.value.exportPrice = t('validation.numberMaximum', { max: 999999.99 })
                return false
            }
        }

        return true
    }

    const validate = () => {
        const isValid = validateForm()
        if (isValid) {
            emit('confirm', { ...formData.value })
        }
        return isValid
    }

    defineExpose({
        validate,
    })
</script>
