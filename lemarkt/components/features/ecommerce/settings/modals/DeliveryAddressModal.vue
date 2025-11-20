<template>
    <div class="delivery-address-modal">
        <DeliveryAddressForm
            :initial-data="initialData"
            :is-saving="isSaving"
            :disable-default-checkbox="disableDefaultCheckbox"
            @submit="handleSubmit"
            @cancel="handleCancel"
        />
    </div>
</template>

<script setup lang="ts">
    import type { DeliveryLocation, DeliveryLocationFormData } from '~/types/auth'

    interface Props {
        initialData?: DeliveryLocation
        onSubmit: (data: DeliveryLocationFormData) => void
        disableDefaultCheckbox?: boolean
    }

    const props = withDefaults(defineProps<Props>(), {
        disableDefaultCheckbox: false,
    })

    const modalStore = useModalStore()
    const isSaving = ref(false)

    const handleSubmit = async (formData: DeliveryLocationFormData) => {
        isSaving.value = true
        try {
            props.onSubmit(formData)
        } finally {
            isSaving.value = false
        }
    }

    const handleCancel = () => {
        modalStore.closeModal()
    }
</script>
