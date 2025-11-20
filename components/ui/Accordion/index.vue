<template>
    <div class="w-full max-w-full mx-auto">
        <AccordionItem
            v-for="(item, index) in items"
            :key="index"
            :item="item"
            :is-active="activeIndex === index"
            :class="{
                'border-b border-gray-600': true,
                'last:border-b-transparent': activeIndex === index,
            }"
            @toggle="handleToggle(index)"
        />
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue'
    import { useTransition } from '@vueuse/core'

    interface AccordionItem {
        title: string
        content: string
    }

    const props = defineProps({
        items: {
            type: Array as PropType<AccordionItem[]>,
            required: true,
        },
    })

    const activeIndex = ref<number | null>(null)

    const handleToggle = (index: number) => {
        activeIndex.value = activeIndex.value === index ? null : index
        useTransition(activeIndex, {
            duration: 300,
            transition: [0.25, 0.1, 0.25, 1],
        })
    }
</script>

<style scoped></style>
