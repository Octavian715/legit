<template>
    <Teleport to="body">
        <transition :name="`drawer-${position}`">
            <div v-if="isOpen" class="drawer-container">
                <div class="drawer__backdrop" @click="onBackdropClick" />
                <div
                    ref="drawerContent"
                    role="dialog"
                    aria-modal="true"
                    :aria-labelledby="title ? 'drawer-title' : undefined"
                    class="drawer__content"
                    :class="position"
                    :style="drawerStyle"
                >
                    <header v-if="$slots.header || title" class="drawer__header">
                        <div class="drawer__header-content">
                            <slot name="header">
                                <h2 :id="titleId" class="text-title2 font-bold text-gray-950">
                                    {{ title }}
                                </h2>
                                <p class="text-gray-800 font-medium text-subtitle1 pt-1">
                                    {{ subTitle || '' }}
                                </p>
                            </slot>
                        </div>

                        <ButtonClose
                            size="md"
                            icon-size="md"
                            :label="$t('close')"
                            @click="onClose"
                        />
                    </header>

                    <section class="drawer__body">
                        <slot />
                    </section>

                    <footer v-if="$slots.footer || showDefaultFooter" class="drawer__footer">
                        <slot name="footer">
                            <Button variant="outline" color="gray" size="lg" @click="onClose">
                                {{ cancelText || t('cancel') }}
                            </Button>
                            <Button variant="filled" color="blue" size="lg" @click="ok">
                                {{ okText || t('ok') }}
                            </Button>
                        </slot>
                    </footer>
                </div>
            </div>
        </transition>
    </Teleport>
</template>

<script setup lang="ts">
    import { ref, watch, computed, onUnmounted, nextTick, onMounted } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { onKeyStroke, useScrollLock } from '@vueuse/core'

    import type { DrawerType } from '~/types/ui/drawer'

    defineOptions({
        inheritAttrs: false,
    })

    const props = withDefaults(defineProps<DrawerType>(), {
        position: 'right',
        title: '',
        subTitle: '',
        cancelText: '',
        okText: '',
        showDefaultFooter: false,
        closeOnEscape: true,
        closeOnBackdrop: true,
        width: '400px',
    })

    const emit = defineEmits<{
        (e: 'update:isOpen', payload: boolean): void
        (e: 'ok'): void
        (e: 'cancel'): void
    }>()

    const { t } = useI18n()
    const titleId = `drawer-title-${Math.random().toString(36).substr(2, 9)}`
    const drawerContent = ref<HTMLElement | null>(null)

    const drawerStyle = computed(() => {
        if (props.position === 'left' || props.position === 'right') {
            return {
                width: props.width,
                maxWidth: '90vw',
            }
        }
        return {}
    })

    const isLocked = ref(false)
    let scrollLockInstance: any = null

    onMounted(() => {
        if (process.client && typeof document !== 'undefined') {
            scrollLockInstance = useScrollLock(document.body)
        }
    })

    const onClose = () => {
        emit('update:isOpen', false)
        emit('cancel')
    }

    const onBackdropClick = () => {
        if (props.closeOnBackdrop) {
            onClose()
        }
    }

    const ok = () => {
        emit('ok')
        emit('update:isOpen', false)
    }

    if (props.closeOnEscape) {
        onKeyStroke('Escape', (e) => {
            if (props.isOpen) {
                e.preventDefault()
                emit('update:isOpen', false)
                emit('cancel')
            }
        })
    }

    watch(
        () => props.isOpen,
        (newVal) => {
            if (process.client && scrollLockInstance) {
                scrollLockInstance.value = newVal
            }

            if (newVal) {
                nextTick(() => {
                    drawerContent.value?.focus()
                })
            }
        },
        { immediate: true }
    )

    onUnmounted(() => {
        if (process.client && scrollLockInstance) {
            scrollLockInstance.value = false
        }
    })
</script>

<style scoped lang="scss">
    .drawer-container {
        @apply fixed inset-0 z-[9999] flex;
    }

    .drawer {
        &__backdrop {
            @apply fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300;
        }

        &__content {
            @apply fixed bg-white shadow-xl transform transition-transform duration-300 ease-out flex flex-col overflow-hidden;

            &.top {
                @apply top-0 left-0 right-0 max-h-[90vh] w-full;
            }

            &.bottom {
                @apply bottom-0 left-0 right-0 max-h-[90vh] w-full;
            }

            &.left {
                @apply left-0 top-0 bottom-0 h-full;
            }

            &.right {
                @apply right-0 top-0 bottom-0 h-full;
            }
        }

        &__header {
            @apply flex items-start justify-between p-6 pb-5 shrink-0;

            &-content {
                @apply flex-1;
            }
        }

        &__close {
            @apply p-2 rounded-full hover:bg-gray-100 transition-colors;
        }

        &__body {
            @apply flex-1 overflow-y-auto px-6 py-4;
        }

        &__footer {
            @apply flex gap-3 justify-end px-6 py-4 border-t border-gray-200 shrink-0;
        }
    }

    .drawer-right-enter-active,
    .drawer-right-leave-active {
        .drawer__backdrop {
            @apply transition-opacity duration-300;
        }
        .drawer__content {
            @apply transition-transform duration-300 ease-out;
        }
    }

    .drawer-right-enter-from,
    .drawer-right-leave-to {
        .drawer__backdrop {
            @apply opacity-0;
        }
        .drawer__content {
            transform: translateX(100%);
        }
    }

    .drawer-right-enter-to,
    .drawer-right-leave-from {
        .drawer__backdrop {
            @apply opacity-100;
        }
        .drawer__content {
            transform: translateX(0);
        }
    }

    .drawer-left-enter-active,
    .drawer-left-leave-active {
        .drawer__backdrop {
            @apply transition-opacity duration-300;
        }
        .drawer__content {
            @apply transition-transform duration-300 ease-out;
        }
    }

    .drawer-left-enter-from,
    .drawer-left-leave-to {
        .drawer__backdrop {
            @apply opacity-0;
        }
        .drawer__content {
            transform: translateX(-100%);
        }
    }

    .drawer-left-enter-to,
    .drawer-left-leave-from {
        .drawer__backdrop {
            @apply opacity-100;
        }
        .drawer__content {
            transform: translateX(0);
        }
    }

    .drawer-top-enter-active,
    .drawer-top-leave-active {
        .drawer__backdrop {
            @apply transition-opacity duration-300;
        }
        .drawer__content {
            @apply transition-transform duration-300 ease-out;
        }
    }

    .drawer-top-enter-from,
    .drawer-top-leave-to {
        .drawer__backdrop {
            @apply opacity-0;
        }
        .drawer__content {
            transform: translateY(-100%);
        }
    }

    .drawer-top-enter-to,
    .drawer-top-leave-from {
        .drawer__backdrop {
            @apply opacity-100;
        }
        .drawer__content {
            transform: translateY(0);
        }
    }

    .drawer-bottom-enter-active,
    .drawer-bottom-leave-active {
        .drawer__backdrop {
            @apply transition-opacity duration-300;
        }
        .drawer__content {
            @apply transition-transform duration-300 ease-out;
        }
    }

    .drawer-bottom-enter-from,
    .drawer-bottom-leave-to {
        .drawer__backdrop {
            @apply opacity-0;
        }
        .drawer__content {
            transform: translateY(100%);
        }
    }

    .drawer-bottom-enter-to,
    .drawer-bottom-leave-from {
        .drawer__backdrop {
            @apply opacity-100;
        }
        .drawer__content {
            transform: translateY(0);
        }
    }
</style>
