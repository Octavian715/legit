<template>
    <div class="pt-1">
        <div class="px-5 pb-6">
            <form @submit.prevent="handleSubmit">
                <div class="space-y-3">
                    <Checkbox
                        v-model="sameAsLocation"
                        :label="t('settings.delivery.sameAsCompanyLocation')"
                        @update:model-value="handleSameAsLocationToggle"
                    />

                    <Input
                        v-model="formData.contact_name"
                        :label="t('company.contactPerson')"
                        name="contact_name"
                        :error="errors.contact_name"
                        :required="true"
                    />

                    <PhoneInput
                        v-model="formData.phone_number"
                        name="phone_number"
                        :label="t('phone')"
                        :error="errors.phone_number"
                        :required="true"
                        @update:country="handlePhoneCountryChange"
                    />

                    <div class="grid grid-cols-2 gap-4">
                        <Select
                            v-model="formData.country_id"
                            :label="t('country')"
                            :options="countryOptions"
                            :error-message="errors.country_id"
                            :required="true"
                            size="lg"
                        />

                        <Input
                            v-model="formData.state_name"
                            :label="t('state')"
                            name="state_name"
                            :error="errors.state_name"
                        />
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <Input
                            v-model="formData.city_name"
                            :label="t('city')"
                            name="city_name"
                            :required="true"
                            :error="errors.city_name"
                        />

                        <Input
                            v-model="formData.street_name"
                            :label="t('street')"
                            name="street_name"
                            :required="true"
                            :error="errors.street_name"
                        />
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <Input
                            v-model="formData.street_number"
                            :label="t('number')"
                            name="street_number"
                            :required="true"
                            :error="errors.street_number"
                        />

                        <Input
                            v-model="formData.postal_code"
                            :label="t('company.postalCode')"
                            name="postal_code"
                            :required="true"
                            :error="errors.postal_code"
                        />
                    </div>

                    <Checkbox
                        v-model="formData.is_default"
                        :label="t('settings.delivery.setAsDefaultDelivery')"
                        :disabled="disableDefaultCheckbox"
                    />
                </div>
            </form>
        </div>

        <div class="flex gap-3 justify-center px-5 py-3 pb-0 border-t border-gray-400">
            <Button
                variant="filled"
                color="gray"
                :label="t('cancel')"
                :disabled="isSaving"
                @click="handleCancel"
            />
            <Button color="blue" :label="t('save')" :loading="isSaving" @click="handleSubmit" />
        </div>
    </div>
</template>

<script setup lang="ts">
    import Ajv from 'ajv'
    import addFormats from 'ajv-formats'
    import addErrors from 'ajv-errors'
    import { useI18n } from 'vue-i18n'
    import { useStaticData } from '~/composables/useStaticData'
    import { deliveryLocationSchema } from '~/utils/validator/schemas/user/deliveryLocationsSchema'
    import type { DeliveryLocation, DeliveryLocationFormData } from '~/types/auth'

    interface Props {
        initialData?: DeliveryLocation
        isSaving?: boolean
        disableDefaultCheckbox?: boolean
    }

    const props = withDefaults(defineProps<Props>(), {
        isSaving: false,
        disableDefaultCheckbox: false,
    })

    const emit = defineEmits<{
        submit: [data: DeliveryLocationFormData]
        cancel: []
    }>()

    const { t } = useI18n()
    const { countryOptions } = useStaticData()
    const userStore = useUserStore()

    const sameAsLocation = ref(false)
    const isFillingFromToggle = ref(false)

    const formData = ref<DeliveryLocationFormData>({
        id: props.initialData?.id,
        contact_name: props.initialData?.contact_name || '',
        phone_number: props.initialData?.phone_number || '',
        phone_country_id: props.initialData?.phone_country_id || 1,
        country_id: props.initialData?.country_id || 0,
        state_name: props.initialData?.state_name || '',
        city_name: props.initialData?.city_name || '',
        street_name: props.initialData?.street_name || '',
        street_number: props.initialData?.street_number || '',
        postal_code: props.initialData?.postal_code || '',
        is_default: props.initialData?.is_default || false,
    })

    const errors = ref<Record<string, string>>({})

    const ajv = new Ajv({ allErrors: true })
    addFormats(ajv)
    addErrors(ajv)

    const validate = ajv.compile(deliveryLocationSchema)

    const handlePhoneCountryChange = (countryData: { id: number; code: string }) => {
        formData.value.phone_country_id = countryData.id
    }

    const handleSameAsLocationToggle = () => {
        if (sameAsLocation.value) {
            const companyDetails = userStore.user?.company_details
            const userContacts = userStore.user?.contacts

            if (companyDetails) {
                isFillingFromToggle.value = true
                formData.value = {
                    ...formData.value,
                    contact_name: companyDetails.legal_name || '',
                    phone_number: userContacts?.[0]?.phones?.[0]?.phone_number || '',
                    phone_country_id: userContacts?.[0]?.phones?.[0]?.phone_country_id || 1,
                    country_id: companyDetails.country?.id || 0,
                    state_name: companyDetails.state_name || '',
                    city_name: companyDetails.city_name || '',
                    street_name: companyDetails.street_name || '',
                    street_number: companyDetails.street_number || '',
                    postal_code: companyDetails.postal_code || '',
                }
                nextTick(() => {
                    isFillingFromToggle.value = false
                })
            }
        }
    }

    const validateForm = (): boolean => {
        errors.value = {}

        const isValid = validate(formData.value)

        if (!isValid && validate.errors) {
            validate.errors.forEach((error) => {
                const field =
                    error.instancePath.replace('/marketplace', '') || error.params?.missingProperty

                if (field) {
                    switch (error.keyword) {
                        case 'required':
                            errors.value[field] = t('validation.required', {
                                field: t(field),
                            })
                            break
                        case 'minLength':
                            errors.value[field] = t('validation.minLength', {
                                field: t(field),
                                min: error.params?.limit,
                            })
                            break
                        case 'maxLength':
                            errors.value[field] = t('validation.maxLength', {
                                field: t(field),
                                max: error.params?.limit,
                            })
                            break
                        case 'minimum':
                            errors.value[field] = t('validation.required', {
                                field: t(field),
                            })
                            break
                        default:
                            errors.value[field] = error.message || t('validation.invalid')
                    }
                }
            })
        }

        return isValid
    }

    const handleSubmit = () => {
        if (props.isSaving) return

        if (!validateForm()) {
            return
        }

        // Don't send ID for new records (let backend generate it)
        const submitData = { ...formData.value }
        if (!props.initialData?.id) {
            delete submitData.id
        }

        emit('submit', submitData)
    }

    const handleCancel = () => {
        emit('cancel')
    }

    const resetForm = () => {
        formData.value = {
            id: undefined,
            contact_name: '',
            phone_number: '',
            phone_country_id: 1,
            country_id: 0,
            state_name: '',
            city_name: '',
            street_name: '',
            street_number: '',
            postal_code: '',
            is_default: false,
        }
        errors.value = {}
        sameAsLocation.value = false
    }

    // Uncheck "Same as registration location" when address fields are manually changed
    watch(
        () => [
            formData.value.country_id,
            formData.value.state_name,
            formData.value.city_name,
            formData.value.street_name,
            formData.value.street_number,
            formData.value.postal_code,
        ],
        () => {
            if (sameAsLocation.value && !isFillingFromToggle.value) {
                sameAsLocation.value = false
            }
        }
    )

    watch(
        () => props.initialData,
        (newData) => {
            if (newData) {
                formData.value = {
                    id: newData.id,
                    contact_name: newData.contact_name,
                    phone_number: newData.phone_number,
                    phone_country_id: newData.phone_country_id || 1,
                    country_id: newData.country_id,
                    state_name: newData.state_name || '',
                    city_name: newData.city_name,
                    street_name: newData.street_name,
                    street_number: newData.street_number,
                    postal_code: newData.postal_code,
                    is_default: newData.is_default,
                }
            } else {
                resetForm()
            }
        },
        { immediate: true }
    )

    defineExpose({
        resetForm,
        validateForm,
    })
</script>
