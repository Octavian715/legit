<template>
    <section
        class="flex flex-col rounded-sm w-full"
        :class="[
            spacing ? 'p-6 pt-10 md:p-10' : '',
            centered ? 'items-center justify-center' : '',
            fullHeight ? 'h-full' : 'h-auto',
            classContainer,
        ]"
    >
        <transition name="fade" mode="out-in">
            <div class="w-full flex flex-col" :class="fullHeight ? 'h-full' : 'h-auto'">
                <!-- Header Section - Fixed at Top -->
                <header v-if="$slots.header || title" class="w-full flex-shrink-0 mb-4">
                    <slot name="header">
                        <h3 :class="['font-bold', centered ? 'text-center' : '', headerClass]">
                            {{ title }}
                        </h3>
                    </slot>
                </header>

                <!-- Content Area -->
                <div
                    class="w-full"
                    :class="[
                        contentClass,
                        fullHeight ? 'flex-1 overflow-y-auto' : '',
                        fullHeight
                            ? 'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400'
                            : '',
                    ]"
                >
                    <!-- Content wrapper with proper spacing -->
                    <div class="w-full px-1 md:px-0" :class="[fullHeight ? 'min-h-full' : '']">
                        <slot />
                    </div>
                </div>

                <!-- Footer Section - Fixed at Bottom -->
                <footer
                    v-if="$slots.footer"
                    class="w-full flex-shrink-0 mt-4"
                    :class="['max-w-2xl mx-auto', footerClass]"
                >
                    <div>
                        <slot name="footer" />
                    </div>
                </footer>
            </div>
        </transition>
    </section>
</template>

<script setup lang="ts">
    interface ContainerProps {
        title?: string
        classContainer?: string
        headerClass?: string
        contentClass?: string
        footerClass?: string
        centered?: boolean
        spacing?: boolean
        fullHeight?: boolean
    }

    // Props definition with improved defaults
    withDefaults(defineProps<ContainerProps>(), {
        centered: true,
        spacing: true,
        fullHeight: true,
        headerClass: '',
        contentClass: '',
        footerClass: '',
    })

    defineEmits<{
        (e: 'update:modelValue', value: any): void
    }>()
</script>

<style scoped lang="scss">
    /* Smooth fade transition */
    .fade-enter-active,
    .fade-leave-active {
        transition: opacity 0.2s ease;
    }

    .fade-enter-from,
    .fade-leave-to {
        opacity: 0;
    }
</style>
