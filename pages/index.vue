<template>
    <div class="ecommerce-page space-x-6"> </div>
</template>

<script setup lang="ts">
    import { useLocalePath } from '#imports'

    const localePath = useLocalePath()

    // const breadcrumbs = computed(() => [{ label: t('home'), to: localePath('/marketplace') }])
    definePageMeta({ layout: 'default' })
    // Use nextTick or onMounted to ensure proper timing
    onBeforeMount(async () => {
        await navigateTo(localePath('/marketplace'), {
            replace: true,
            redirectCode: 302,
        })
    })
</script>
