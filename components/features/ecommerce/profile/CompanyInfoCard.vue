<template>
    <div
        class="bg-white rounded-md p-6 opacity-0 animate-fade-in-up"
        :style="{ animationDelay: `${delay}ms` }"
    >
        <h2 class="text-title2 font-bold text-gray-950 mb-4">{{ title }}</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
                v-for="(item, index) in items"
                :key="index"
                class="space-y-1 opacity-0 animate-fade-in"
                :style="{ animationDelay: `${delay + index * 50}ms` }"
            >
                <div class="text-subtitle4 text-gray-800">{{ item.label }}</div>

                <!-- Email Link -->
                <a
                    v-if="isEmail(item.value)"
                    :href="`mailto:${item.value}`"
                    class="text-body text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 hover:underline block"
                >
                    {{ item.value || '--' }}
                </a>

                <!-- Phone Link -->
                <a
                    v-else-if="isPhone(item.value)"
                    :href="`tel:${item.value}`"
                    class="text-body text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 hover:underline block"
                >
                    {{ item.value || '--' }}
                </a>

                <!-- Website Link (clean display without protocol) -->
                <a
                    v-else-if="isWebsite(item.value)"
                    :href="getFullWebsiteUrl(item.value)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-body text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 hover:underline block break-all"
                >
                    {{ cleanWebsiteUrl(item.value) || '--' }}
                </a>

                <!-- Regular Text -->
                <div v-else class="text-body text-gray-950 font-medium">
                    {{ item.value || '--' }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    interface InfoItem {
        label: string
        value: string
    }

    interface Props {
        title: string
        items: InfoItem[]
        delay?: number
    }

    withDefaults(defineProps<Props>(), {
        delay: 0,
    })

    const isEmail = (value: string): boolean => {
        if (!value) return false
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(value)
    }

    const isPhone = (value: string): boolean => {
        if (!value) return false

        const cleanValue = value.replace(/[\s\-\(\)\.]/g, '')
        const digitCount = cleanValue.replace(/\D/g, '').length

        if (/^\d{4}$/.test(cleanValue)) {
            return false
        }

        if (digitCount < 7) {
            return false
        }

        if (digitCount > 15) {
            return false
        }

        const phoneRegex =
            /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{2,4}[-\s\.]?[0-9]{2,4}[-\s\.]?[0-9]{0,4}$/

        return phoneRegex.test(value)
    }

    const isWebsite = (value: string): boolean => {
        if (!value) return false
        const websiteRegex =
            /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}([\/\w\-._~:?#[\]@!$&'()*+,;=]*)?$/
        return websiteRegex.test(value)
    }

    const cleanWebsiteUrl = (url: string): string => {
        if (!url) return ''
        return url
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .replace(/\/$/, '')
    }

    const getFullWebsiteUrl = (url: string): string => {
        if (!url) return ''
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url
        }
        return `https://${url.replace(/^www\./, '')}`
    }
</script>

<style scoped lang="scss">
    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .animate-fade-in {
        animation: fadeIn 0.6s ease-out forwards;
    }

    .animate-fade-in-up {
        animation: fadeInUp 0.6s ease-out forwards;
    }
</style>
