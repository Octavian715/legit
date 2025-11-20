import { defineNuxtPlugin } from '#app'
import FloatingVue from 'floating-vue'
import 'floating-vue/dist/style.css'

export default defineNuxtPlugin((nuxtApp) => {
    // Initialize FloatingVue
    nuxtApp.vueApp.use(FloatingVue, {
        themes: {
            'custom-tooltip': {
                $extend: 'tooltip',
                placement: 'top',
                triggers: ['hover', 'focus', 'touch'],
                delay: { show: 300, hide: 0 },
                html: true,
                classes: 'bg-gray-900 text-white text-body px-2 py-1 rounded shadow-lg',
            },
        },
    })
})
