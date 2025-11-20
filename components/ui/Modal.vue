<template>
    <Teleport to="body">
        <transition name="modal" appear>
            <div v-if="isOpen" class="modal-wrapper">
                <div class="modal-backdrop" @click.self="onBackdropClick" />
                <div
                    ref="modalContent"
                    role="dialog"
                    aria-modal="true"
                    :aria-labelledby="title ? titleId : undefined"
                    class="modal-content"
                    :class="contentWidth"
                >
                    <header
                        v-if="!hideHeader && ($slots.header || title)"
                        class="px-5 py-3 flex justify-between items-center gap-2.5 border-b border-gray-400 h-[64px]"
                    >
                        <slot name="header">
                            <h2 :id="titleId" class="text-title3 font-bold text-gray-950">
                                {{ title }}
                            </h2>
                        </slot>
                        <ButtonClose
                            v-show="!hideClose"
                            :aria-labelledby="titleId"
                            @click="onClose"
                        />
                    </header>

                    <section class="py-5 text-center text-gray-900 text-title2 font-normal">
                        <component
                            :is="component"
                            v-if="component"
                            ref="componentRef"
                            v-bind="componentProps"
                            @confirm="handleComponentConfirm"
                            @cancel="onClose"
                        />

                        <slot v-else></slot>
                    </section>

                    <footer
                        v-if="!hideFooter"
                        class="flex gap-2.5 justify-center px-5 py-3 sm:px-5 border-t border-gray-500"
                    >
                        <slot name="footer">
                            <Button
                                v-if="!hideClose"
                                color="gray"
                                variant="filled"
                                size="lg"
                                @click="onClose"
                            >
                                {{ cancelText || $t('cancel') }}
                            </Button>
                            <Button
                                :color="okBtnColor"
                                variant="filled"
                                size="lg"
                                @click="handleOkClick"
                            >
                                {{ okText || $t('ok') }}
                            </Button>
                        </slot>
                    </footer>
                </div>
            </div>
        </transition>
    </Teleport>
</template>

<script setup lang="ts">
    import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
    import { useModalStore } from '~/stores/modal'
    import { storeToRefs } from 'pinia'
    import type { ModalOptions } from '~/types/modal'

    const props = withDefaults(defineProps<ModalOptions>(), {
        isOpen: undefined,
        title: '',
        contentWidth: 'min-w-sm sm:max-w-sm md:max-w-xl',
        cancelText: '',
        okText: '',
        okColor: 'red',
        hideClose: false,
        hideFooter: false,
        hideHeader: false,
        persistent: false,
    })

    const emit = defineEmits<{
        (e: 'update:isOpen', payload: boolean): void
        (e: 'ok'): void
        (e: 'close'): void
    }>()

    const modalStore = useModalStore()

    const { isOpen: storeIsOpen, options, component, componentProps } = storeToRefs(modalStore)

    const title = computed(() => props.title || options.value.title || '')
    const contentWidth = computed(
        () => options.value?.contentWidth || props.contentWidth || 'max-w-sm md:max-w-lg'
    )
    const cancelText = computed(() => options.value?.cancelText || props.cancelText || '')
    const okText = computed(() => options.value?.okText || props.okText || '')
    const hideFooter = computed(
        () => (options.value?.hideFooter ?? false) || props.hideFooter || false
    )
    const hideHeader = computed(
        () => (options.value?.hideHeader ?? false) || props.hideHeader || false
    )
    const hideClose = computed(
        () => (options.value?.hideClose ?? false) || props.hideClose || false
    )
    const persistent = computed(
        () => (options.value?.persistent ?? false) || props.persistent || false
    )
    const okBtnColor = computed(() => options.value?.okColor || props.okColor || 'red')
    const isOpen = computed(() => (props.isOpen !== undefined ? props.isOpen : storeIsOpen.value))

    const titleId = `modal-title-${Date.now()}`
    const modalContent = ref<HTMLElement | null>(null)
    const componentRef = ref<any>(null)

    const onClose = () => {
        if (props.isOpen !== undefined) {
            emit('update:isOpen', false)
            emit('close')
        } else {
            modalStore.closeModal()
        }
    }

    const handleComponentConfirm = (data: any) => {
        if (options.value.onOk) {
            options.value.onOk(data)
        }
    }

    const handleOkClick = async () => {
        if (componentRef.value && typeof componentRef.value.validate === 'function') {
            const isValid = componentRef.value.validate()
            if (!isValid) {
                return
            }
        } else {
            if (props.isOpen !== undefined) {
                emit('ok')
                onClose()
            } else {
                modalStore.confirmModal()
            }
        }
    }

    const onBackdropClick = () => {
        if (!persistent.value) {
            onClose()
        }
    }

    const onKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && isOpen.value && !persistent.value) {
            onClose()
        }
    }

    const onTouchMove = (event: TouchEvent) => {
        if (isOpen.value) {
            event.preventDefault()
        }
    }

    onMounted(() => {
        window.addEventListener('keydown', onKeydown)
        document.addEventListener('touchmove', onTouchMove, { passive: false })

        if (isOpen.value) {
            document.body.classList.add('overflow-hidden')
        }
    })

    onUnmounted(() => {
        window.removeEventListener('keydown', onKeydown)
        document.removeEventListener('touchmove', onTouchMove)
        document.body.classList.remove('overflow-hidden')
    })

    watch(
        () => isOpen.value,
        (newValue) => {
            if (newValue) {
                document.body.classList.add('overflow-hidden')
            } else {
                document.body.classList.remove('overflow-hidden')
            }
        }
    )
</script>

<style scoped>
    .modal-wrapper {
        position: fixed;
        inset: 0;
        z-index: 999;
        display: flex;
        align-items: center;
        justify-content: center;
        will-change: opacity;
    }

    .modal-backdrop {
        position: absolute;
        inset: 0;
        background: rgb(243 244 246 / 0.8);
        backdrop-filter: blur(2px);
        -webkit-backdrop-filter: blur(2px);
        will-change: opacity;
    }

    .modal-content {
        position: relative;
        background: white;
        border-radius: 0.25rem;
        box-shadow:
            0 25px 50px -12px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(0, 0, 0, 0.05);
        width: 100%;
        max-height: 90vh;
        z-index: 51;
        overflow: auto;
    }

    /* Responsive width handling */
    @media (min-width: 640px) {
        .modal-content {
            width: auto;
        }
    }

    .modal-enter-from,
    .modal-leave-to {
        opacity: 0;
    }

    .modal-enter-to,
    .modal-leave-from {
        opacity: 1;
    }

    /* Backdrop transitions - instant for better UX */
    .modal-enter-active .modal-backdrop,
    .modal-leave-active .modal-backdrop {
        transition: opacity 100ms ease-out;
    }

    .modal-enter-from .modal-backdrop,
    .modal-leave-to .modal-backdrop {
        opacity: 0;
    }

    /* Content transitions with slight delay and spring effect */
    .modal-enter-active .modal-content {
        transition:
            transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1),
            opacity 150ms ease-out;
        transition-delay: 50ms;
    }

    .modal-leave-active .modal-content {
        transition:
            transform 150ms cubic-bezier(0.4, 0, 1, 1),
            opacity 100ms ease-in;
    }

    .modal-enter-from .modal-content {
        transform: translate3d(-50%, -50%, 0) scale(0.95);
        opacity: 0;
    }

    .modal-leave-to .modal-content {
        transform: translate3d(-50%, -50%, 0) scale(0.98);
        opacity: 0;
    }

    .modal-enter-to .modal-content,
    .modal-leave-from .modal-content {
        transform: translate3d(-50%, -50%, 0) scale(1);
        opacity: 1;
    }

    /* Position modal content */
    .modal-content {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate3d(-50%, -50%, 0);
    }

    /* Select elements styling */
    :deep(select) {
        position: relative;
        z-index: 10;
    }

    /* Focus trap enhancement */
    .modal-content:focus {
        outline: none;
    }

    /* Smooth scrolling for modal content */
    .modal-content {
        scroll-behavior: smooth;
    }

    /* Performance optimizations for mobile */
    @media (max-width: 640px) {
        .modal-content {
            max-height: calc(100vh - 2rem);
            max-width: 90vw;
        }

        .modal-enter-from .modal-content {
            transform: translate3d(-50%, -40%, 0) scale(0.9);
        }
    }

    /* Reduce motion for accessibility */
    @media (prefers-reduced-motion: reduce) {
        .modal-enter-active,
        .modal-leave-active,
        .modal-enter-active .modal-backdrop,
        .modal-leave-active .modal-backdrop,
        .modal-enter-active .modal-content,
        .modal-leave-active .modal-content {
            transition-duration: 0.01ms !important;
            transition-delay: 0ms !important;
        }
    }
</style>
