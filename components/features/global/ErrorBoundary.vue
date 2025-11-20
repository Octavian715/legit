<template>
    <div class="flex flex-col items-center justify-center min-h-[400px] py-16 bg-white">
        <slot>
            <!-- <NuxtImg
                src="/images/content/error-products.svg"
                width="160"
                height="160"
                class="mb-6"
                loading="lazy"
            /> -->
            <!-- <img
                src="/images/content/error-products.svg"
                width="160px"
                height="160px"
                class="mb-6"
                loading="lazy"
            /> -->
            <img
                src="/images/content/empty-data.svg"
                alt="Error illustration"
                width="160"
                height="160"
                class="mb-6"
                loading="lazy"
            />
            <h3 class="text-title1 font-bold text-gray-950 mb-3 text-center">
                {{ computedTitle }}
            </h3>
            <p class="text-body text-gray-800 text-center max-w-md mb-3">
                {{ computedSubtitle }}
            </p>
            <Button
                :label="computedButtonLabel"
                variant="filled"
                color="blue"
                size="lg"
                @click="emit('action')"
            />
        </slot>
    </div>
</template>

<script lang="ts" setup>
    interface Props {
        title?: string
        subtitle?: string
        buttonLabel?: string
    }

    const props = defineProps<Props>()

    const emit = defineEmits(['action'])

    const { t } = useI18n()

    const computedTitle = computed(() => props.title || t('filters.noProductsFound'))
    const computedSubtitle = computed(
        () => props.subtitle || t('filters.errorNoProductsDescription')
    )
    const computedButtonLabel = computed(() => props.buttonLabel || t('tryAgain'))
</script>
