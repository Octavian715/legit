import { defineStore } from 'pinia'
import { ref, markRaw, type Component } from 'vue'
import type { ModalOptions, ModalType } from '~/types/modal'

export const useModalStore = defineStore('modal', () => {
    const isOpen = ref(false)
    const component = ref<Component | null>(null)
    const componentProps = ref<Record<string, any>>({})
    const options = ref<ModalOptions>({})
    const modalType = ref<ModalType>(null)

    const openModal = (
        modalComponent: Component,
        type: ModalType,
        props: Record<string, any> = {},
        modalOptions: ModalOptions = {}
    ) => {
        isOpen.value = true
        component.value = markRaw(modalComponent)
        componentProps.value = props
        options.value = { ...modalOptions }
        modalType.value = type
    }

    const closeModal = () => {
        // Execute callback BEFORE clearing state to prevent circular calls
        const onCloseCallback = options.value.onClose

        // Clear state immediately
        isOpen.value = false
        component.value = null
        componentProps.value = {}
        options.value = {}
        modalType.value = null

        // Execute callback after state is cleared
        if (onCloseCallback) {
            onCloseCallback()
        }
    }

    const confirmModal = () => {
        // Execute callback BEFORE clearing state
        const onOkCallback = options.value.onOk

        // Clear state immediately
        isOpen.value = false
        component.value = null
        componentProps.value = {}
        options.value = {}
        modalType.value = null

        // Execute callback after state is cleared
        if (onOkCallback) {
            onOkCallback()
        }
    }

    return {
        isOpen: readonly(isOpen),
        component,
        componentProps,
        options,
        openModal,
        closeModal,
        confirmModal,
        modalType,
    }
})
