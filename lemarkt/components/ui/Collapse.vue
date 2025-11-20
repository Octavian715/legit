<template>
    <div class="w-full rounded-sm border border-gray-600 py-0.5">
        <div class="bg-white cursor-pointer" :class="[innerPadding]" @click="toggle">
            <div class="flex items-center justify-between w-full">
                <div
                    class="flex items-center gap-2 w-full"
                    :class="{ 'flex-row-reverse': arrowPosition === 'right' }"
                >
                    <svg
                        class="w-4 h-4 transition-transform duration-300 shrink-0"
                        :class="{ 'rotate-180': isOpen }"
                        aria-hidden="true"
                    >
                        <use :xlink:href="`/sprite.svg#a_down`" />
                    </svg>

                    <slot name="title" />
                </div>

                <div v-if="hasActions" class="flex items-center gap-2" @click.stop>
                    <button
                        v-if="edit"
                        class="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                        @click="$emit('edit')"
                    >
                        <svg class="w-5 h-5 hover:text-blue-600" aria-hidden="true">
                            <use :xlink:href="`/sprite.svg#edit`" />
                        </svg>
                    </button>
                    <button
                        v-if="close"
                        class="p-1 text-gray-600 hover:text-red-600 transition-colors"
                        @click="$emit('delete')"
                    >
                        <svg class="w-5 h-5 hover:text-red-600" aria-hidden="true">
                            <use :xlink:href="`/sprite.svg#close`" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <Transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-75 ease-out"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0"
        >
            <div
                v-show="isOpen"
                class="border-t border-gray-600"
                :class="{
                    'mx-4 py-4': innerPadding === 'p-4',
                    'mx-2 py-2': innerPadding === 'p-2',
                }"
            >
                <slot />
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
    interface Props {
        edit?: boolean
        close?: boolean
        defaultOpen?: boolean
        arrowPosition?: 'left' | 'right'
        innerPadding?: string
    }

    defineEmits(['edit', 'delete'])

    const props = withDefaults(defineProps<Props>(), {
        edit: false,
        close: false,
        defaultOpen: false,
        arrowPosition: 'left',
        innerPadding: 'p-4',
    })

    const isOpen = ref(props.defaultOpen)

    const toggle = () => {
        isOpen.value = !isOpen.value
    }

    const hasActions = computed(() => props.edit || props.close)
</script>
