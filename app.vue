<template>
    <div>
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
        <ClientOnly>
            <Teleport to="body">
                <Modal />
            </Teleport>
            <template #fallback>
                <div></div>
            </template>
        </ClientOnly>
    </div>
</template>

<script setup lang="ts">
    const { locale } = useI18n()
    const Modal = defineAsyncComponent(() => import('~/components/ui/Modal.vue'))

    useHead({
        htmlAttrs: {
            lang: locale.value,
        },
    })

    watch(locale, (newLocale) => {
        useHead({
            htmlAttrs: {
                lang: newLocale,
            },
        })
    })

    useSeoMeta({
        title: 'LeMarkt - Empowering food trade',
        ogTitle: 'LeMarkt - Connect Food Industry Professionals',
        description:
            'Closed B2B platform connecting sellers, buyers in HoReCa and retail food sectors.',
        ogDescription:
            'Professional network for food industry with order management, product showcase, and industry news.',
        ogImage: '/public/images/og-lemarkt.jpg',
        twitterCard: 'summary_large_image',
    })
</script>
