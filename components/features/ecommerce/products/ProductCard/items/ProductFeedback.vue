<template>
    <div class="flex flex-col items-center gap-2 w-full">
        <div class="flex gap-2 w-full">
            <div
                class="flex items-center justify-center py-1 bg-blue-50 text-blue-500 text-caption1 rounded flex-1"
            >
                {{ totalFeedback > 0 ? t('reviews', { n: totalFeedback }) : 'No reviews' }}
            </div>
            <Button
                size="sm"
                font-weight="light"
                color="gray"
                disabled
                variant="filled"
                class="!text-caption1 flex-1"
                :wrap="false"
                @click="showReviews"
                >{{ t('viewReviews') }}</Button
            >
        </div>

        <Button
            size="sm"
            color="blue"
            variant="filled"
            class="w-full"
            disabled
            @click="addReview"
            >{{ t('writeReview') }}</Button
        >
    </div>
</template>

<script setup lang="ts">
    const props = defineProps<{
        totalFeedback: number
    }>()

    const { t } = useI18n()

    const emit = defineEmits<{
        (e: 'add'): void
        (e: 'show'): void
    }>()

    const showReviews = () => {
        emit('show')
    }

    const addReview = () => {
        emit('add')
    }
</script>
