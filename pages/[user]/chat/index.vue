<template>
    <div class="space-y-4">
        <Breadcrumbs :items="breadcrumbs" />

        <ChatLayout />
    </div>
</template>

<script setup lang="ts">
    import { useLocalePath } from '#imports'
    import { useChatStore } from '~/stores/chat'

    const localePath = useLocalePath()
    const { t } = useI18n()

    definePageMeta({
        layout: 'app',
        middleware: ['role'],
    })

    const chatStore = useChatStore()

    const breadcrumbs = computed(() => [
        { label: t('home'), to: localePath('/supplier/dashboard') },
        { label: t('navigation.chat') },
    ])

    useSeoMeta({
        title: 'Messages - LeMarkt',
        description: 'Connect with buyers and suppliers on LeMarkt platform',
    })

    onMounted(async () => {
        if (process.client) {
            await chatStore.fetchChats()
        }
    })
</script>
