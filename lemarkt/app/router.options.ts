import type { RouterConfig } from '@nuxt/schema'

export default <RouterConfig>{
    scrollBehavior(to, from, savedPosition) {
        return new Promise((resolve) => {
            if (process.server) {
                resolve({ top: 0 })
                return
            }

            setTimeout(() => {
                if (savedPosition) {
                    resolve(savedPosition)
                } else if (to.hash) {
                    resolve({
                        el: to.hash,
                        behavior: 'smooth',
                        top: 80,
                    })
                } else {
                    resolve({ top: 0, left: 0 })
                }
            }, 50)
        })
    },
}
