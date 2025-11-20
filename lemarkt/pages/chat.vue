<template>
    <div class="space-y-4 px-4 md:px-0">
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
        layout: 'default',
    })

    const chatStore = useChatStore()

    const breadcrumbs = computed(() => [
        { label: t('home'), to: localePath('/marketplace') },
        { label: t('navigation.chat') },
    ])

    useSeoMeta({
        title: 'Messages - LeMarkt',
        description: 'Connect with buyers and suppliers on LeMarkt platform',
    })

    onMounted(async () => {
        await chatStore.fetchChats()
    })

    onUnmounted(() => {
        chatStore.clear()
    })
</script>
