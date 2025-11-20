<template>
    <div class="min-h-screen bg-gray-50">
        <OrdersOrderForm
            v-if="documentId"
            mode="edit"
            :document-id="documentId"
            @cancel="handleCancel"
            @success="handleSuccess"
        />
    </div>
</template>

<script setup lang="ts">
    definePageMeta({
        middleware: ['supplier'],
        layout: 'app',
    })

    const route = useRoute()
    const router = useRouter()

    const documentId = computed(() => {
        const id = route.params.id
        return typeof id === 'string' ? parseInt(id, 10) : null
    })

    const handleCancel = () => {
        router.push('/supplier/orders')
    }

    const handleSuccess = () => {
        router.push('/supplier/orders')
    }

    useSeoMeta({
        title: 'Edit Order',
        description: 'Edit order document',
    })
</script>
