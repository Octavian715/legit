export default defineNuxtConfig({
    ssr: true,
    site: {
        url: process.env.NUXT_PUBLIC_SITE_URL || 'https://shop.lemarkt.com',
        name: 'LeMarkt - Empowering food trade',
        description:
            'Closed B2B platform connecting sellers, buyers in HoReCa and retail food sectors.',
        defaultLocale: 'en',
    },
    app: {
        baseURL: '/',
        title: 'LeMarkt - Empowering food trade',
        head: {
            viewport: 'width=device-width, initial-scale=1',
            charset: 'utf-8',
            meta: [
                { name: 'viewport', content: 'width=device-width, initial-scale=1' },
                { name: 'format-detection', content: 'telephone=no' },
            ],
            link: [
                { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
                {
                    rel: 'preconnect',
                    href: 'https://fonts.gstatic.com',
                    crossorigin: 'anonymous',
                },
                {
                    href: 'https://fonts.googleapis.com/css2?family=Onest:wght@100..900&display=swap',
                    rel: 'stylesheet',
                },
                { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
            ],
        },
        pageTransition: {
            name: 'fade',
            mode: 'out-in',
        },
        layoutTransition: {
            name: 'layout',
            mode: 'out-in',
        },
    },

    components: [
        {
            path: '~/components',
            pathPrefix: false,
        },
    ],

    modules: [
        '@nuxtjs/i18n',
        '@vueuse/nuxt',
        '@nuxtjs/tailwindcss',
        '@nuxtjs/seo',
        '@pinia/nuxt',
        'pinia-plugin-persistedstate/nuxt',
        '@nuxt/image',
        // '@nuxtjs/html-validator',
        // 'nuxt-og-image',
        'nuxt-security',
        '@nuxtjs/fontaine',
        'floating-vue/nuxt',
    ],

    imports: {
        dirs: ['composables'],
    },
    fontaine: {
        fonts: [
            {
                family: 'Onest',
                fallbacks: ['sans-serif'],
            },
        ],
    },
    runtimeConfig: {
        apiBaseURL: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://192.168.88.226:8000/api',
        env: process.env.NUXT_ENV || 'development',

        public: {
            apiBaseURL: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://192.168.88.226:8000/api',
            socketUrl: process.env.SOCKET_URL || 'http://38.242.255.80:3000',
            domain: process.env.NUXT_PUBLIC_DOMAIN,
            defaultLocale: process.env.NUXT_PUBLIC_LOCALE || 'en',
            publicMocks: process.env.NUXT_PUBLIC_USE_MOCKS === 'true',
            siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://shop.lemarkt.com',
            env: process.env.NUXT_ENV || 'development',
        },
    },

    devServer: {
        port: 3000,
        host: '0.0.0.0',
    },

    pinia: {
        autoImports: {
            imports: ['defineStore', 'storeToRefs', 'acceptHMRUpdate'],
        },
    },

    piniaPluginPersistedstate: {
        storage: 'cookies',
        cookieOptions: {
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: false,
            maxAge: 60 * 60 * 24 * 7, // 7 days
        },
    },

    css: [
        '~/assets/css/main.css',
        '~/assets/css/chat.css',
        '~/assets/css/transitions.css',
        '~/assets/css/scroller-styles.css',
        'vue-select/dist/vue-select.css',
        'floating-vue/dist/style.css',
    ],
    plugins: [
        '~/plugins/router.scroll.client.ts',
        '~/plugins/01.language.client.ts',
        '~/plugins/02.socket.client.ts',
        '~/plugins/04.plan.change.handler.client.ts',
        '~/plugins/pinia-persist.ts',
        '~/plugins/notification.client.ts',
        '~/plugins/axios.client.ts',
        '~/plugins/charts.ts',
        '~/plugins/serialization.client.ts',
        '~/plugins/maska.client.ts',
        '~/plugins/tooltip.client.ts',
    ],

    postcss: {
        plugins: {
            tailwindcss: {},
            autoprefixer: {},
        },
    },

    image: {
        quality: 80,
        format: ['webp', 'png', 'jpg'],
        screens: {
            xs: 320,
            sm: 640,
            md: 768,
            lg: 1024,
            xl: 1280,
            xxl: 1536,
        },
        presets: {
            avatar: {
                modifiers: {
                    format: 'webp',
                    width: 140,
                    height: 140,
                    quality: 80,
                },
            },
        },
    },

    i18n: {
        lazy: true,
        langDir: '../i18n/locales/',
        defaultLocale: 'en',
        strategy: 'prefix_except_default',
        detectBrowserLanguage: {
            useCookie: true,
            cookieKey: 'i18n_redirected',
            redirectOn: 'root',
            alwaysRedirect: false,
            fallbackLocale: 'en',
        },
        trailingSlash: false,
        vueI18n: './i18n/i18n.config.ts',
        locales: [
            {
                code: 'en',
                name: 'English',
                file: 'en.json',
                iso: 'en-US',
                dir: 'ltr',
            },
        ],
        bundle: {
            optimizeTranslationDirective: false,
        },
        compilation: {
            strictMessage: false,
            escapeHtml: true,
        },
    },

    htmlValidator: {
        usePrettier: false,
        logLevel: 'verbose',
        failOnError: false,
        ignore: [/\.(xml|rss|json)$/],
        options: {
            extends: [
                'html-validate:document',
                'html-validate:recommended',
                'html-validate:standard',
            ],
            rules: {
                'svg-focusable': 'off',
                'no-unknown-elements': 'error',
                'void-style': 'off',
                'no-trailing-whitespace': 'off',
                'require-sri': 'off',
                'attribute-boolean-style': 'off',
                'doctype-style': 'off',
                'no-inline-style': 'off',
            },
        },
    },

    security: {
        headers: false, // Disable all security headers temporarily
    },

    typescript: {
        strict: true,
        typeCheck: false,
    },
    nitro: {
        preset: 'node-server',

        compressPublicAssets: {
            gzip: true,
            brotli: true,
            threshold: 1024,
        },
        errorHandler: '~/server/error-handler.ts',

        // Prerender for better SEO
        prerender: {
            routes: ['/'], // Only prerender home page
            crawlLinks: false, // Disable automatic link crawling
            // ignore: [
            //     '/api/**',
            //     '/supplier/**',
            //     '/buyer/**',
            //     '/supplier/order/new',
            //     '/supplier/product',
            //     '/marketplace', // Skip marketplace until server error is fixed
            //     '/marketplace/**', // Skip marketplace until server error is fixed
            // ],
        },
        // Performance optimizations
        minify: true,
        routeRules: {
            // '/about': { prerender: true },
            // '/privacy': { prerender: true },
            // '/terms': { prerender: true },

            '/': { ssr: false },
            // Dynamic content with ISR
            '/marketplace': {
                isr: 300, // 5 minutes
                headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
            },
            '/marketplace/category/**': { isr: 600 }, // 10 minutes for categories
            '/supplier/product/new': { ssr: false },

            // Product pages - SSR for SEO but with smart caching
            '/marketplace/product/**': {
                ssr: true,
                headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
            },
            '/supplier/products/new': { ssr: false },
            // Auth pages - SPA mode
            '/auth/**': { ssr: false },
            '/login': { ssr: false },
            '/register/**': { ssr: false },

            // // User dashboard - SPA for interactivity
            // '/dashboard/**': { ssr: false },
            // '/profile/**': { ssr: false },

            // API routes with proper CORS
            '/api/**': {
                cors: true,
                headers: {
                    'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Access-Control-Max-Age': '86400',
                },
            },
        },
        experimental: {
            wasm: true,
        },
    },
    vite: {
        define: {
            __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: process.env.NODE_ENV === 'development',
        },

        build: {
            sourcemap: false,
            rollupOptions: {
                output: {
                    manualChunks: {
                        // Vendor splitting for better caching
                        'vue-vendor': ['vue', 'vue-router'],
                        'ui-vendor': ['@vueuse/core', 'maska'],
                        validation: ['ajv', 'ajv-formats'],
                    },
                },
            },
        },

        optimizeDeps: {
            exclude: ['pinia', 'pinia-plugin-persistedstate', '@pinia/nuxt'],
            include: [
                'vue',
                '@vueuse/core',
                'maska/vue',
                'vue-router',
                'axios',
                'vue-toastification',
                'floating-vue',
                'ajv',
                'ajv-formats',
                // 'lodash',
            ],
        },

        ssr: {
            noExternal: ['vue-toastification', '@vueuse/core', 'maska', 'floating-vue'],
        },
    },

    vue: {
        compilerOptions: {
            isCustomElement: (tag: string) => tag.startsWith('custom-'),
        },
        runtimeCompiler: false,
    },

    experimental: {
        // payloadExtraction: true,
        // componentIslands: true,
        // inlineRouteRules: true,
        // renderJsonPayloads: true,
        // viewTransition: true,
        payloadExtraction: true,
        componentIslands: true,
        inlineRouteRules: false,
        renderJsonPayloads: true,
        viewTransition: false,
    },

    devtools: {
        enabled: process.env.NODE_ENV === 'development',
        timeline: {
            enabled: true,
        },
    },

    compatibilityDate: '2024-10-02',
})
