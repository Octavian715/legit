import { defineNuxtPlugin } from '#app'
import Toast, { type PluginOptions, POSITION, useToast } from 'vue-toastification'
import 'vue-toastification/dist/index.css'

const options: PluginOptions = {
    position: POSITION.TOP_RIGHT,
    timeout: 5000,
    closeOnClick: false,
    pauseOnFocusLoss: true,
    pauseOnHover: true,
    draggable: true,
    draggablePercent: 0.6,
    showCloseButtonOnHover: false,
    hideProgressBar: true,
    closeButton: false,
    icon: false,
    rtl: false,
    maxToasts: 5,
    newestOnTop: true,
    toastClassName: 'my-toast',
    bodyClassName: 'my-toast-body',
    transition: 'Vue-Toastification__fade',
}

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.use(Toast, options)

    return {
        provide: {
            toast: useToast(),
        },
    }
})
