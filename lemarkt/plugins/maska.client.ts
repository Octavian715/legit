import { vMaska } from 'maska/vue'

export default defineNuxtPlugin((nuxtApp) => {
    // Register maska directive globally
    nuxtApp.vueApp.directive('maska', vMaska)
})
