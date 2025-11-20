<template>
    <div>
        <button
            class="flex justify-between items-center rounded-sm w-full py-4 px-3 text-left text-gray-950 hover:bg-red-50 hover:text-red-500 active:bg-red-500 active:text-white transition-colors"
            :aria-expanded="isActive"
            @click="$emit('toggle')"
        >
            <span class="text-subtitle1 font-medium">{{ item.title }}</span>
            <svg
                class="w-5 h-5 transform transition-transform duration-200"
                :class="{ 'rotate-180': isActive }"
            >
                <use xlink:href="/sprite.svg#a_down"></use>
            </svg>
        </button>

        <transition name="accordion">
            <div v-if="isActive" class="overflow-hidden mt-1 mb-4" :aria-hidden="!isActive">
                <div class="py-2">
                    <p class="text-body text-gray-700 leading-relaxed">{{ item.content }}</p>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
    interface AccordionItem {
        title: string
        content: string
    }

    defineProps({
        item: {
            type: Object as PropType<AccordionItem>,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: false,
        },
    })

    defineEmits(['toggle'])
</script>

<style lang="scss">
    .accordion-enter-active,
    .accordion-leave-active {
        transition: all 0.3s ease-in-out;
    }

    .accordion-enter-from,
    .accordion-leave-to {
        opacity: 0;
        max-height: 0;
    }

    .accordion-enter-to,
    .accordion-leave-from {
        opacity: 1;
        max-height: 500px;
    }
</style>
