<!-- components/ui/CertificateItem.vue -->
<template>
    <div class="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
        <!-- Certificate Name -->
        <div class="col-span-3 flex items-center">
            <div class="flex items-center space-x-3">
                <div
                    class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0"
                >
                    <svg class="w-4 h-4 text-blue-600">
                        <use xlink:href="/sprite.svg#certificate"></use>
                    </svg>
                </div>
                <div class="min-w-0">
                    <p
                        class="text-subtitle3 font-medium text-gray-900 truncate"
                        :title="certificate.name"
                    >
                        {{ certificate.name }}
                    </p>
                    <p v-if="certificate.file" class="text-caption2 text-gray-500">
                        {{ getFileSize(certificate.file) }}
                    </p>
                </div>
            </div>
        </div>

        <!-- Certificate Number -->
        <div class="col-span-2 flex items-center">
            <span class="text-caption1 text-gray-700 font-mono">
                {{ certificate.number }}
            </span>
        </div>

        <!-- Issue Date -->
        <div class="col-span-2 flex items-center">
            <span class="text-caption1 text-gray-700">
                {{ formatDate(certificate.issueDate) }}
            </span>
        </div>

        <!-- Expiry Date -->
        <div class="col-span-2 flex items-center">
            <div class="flex items-center space-x-2">
                <span class="text-caption1 text-gray-700">
                    {{ formatDate(certificate.expiryDate) }}
                </span>
                <span
                    v-if="isExpiringSoon"
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-caption2 font-medium bg-yellow-100 text-yellow-800"
                >
                    {{ $t('expiringSoon', 'Expiring soon') }}
                </span>
                <span
                    v-else-if="isExpired"
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-caption2 font-medium bg-red-100 text-red-800"
                >
                    {{ $t('expired', 'Expired') }}
                </span>
            </div>
        </div>

        <!-- Issuing Authority -->
        <div class="col-span-2 flex items-center">
            <span
                class="text-caption1 text-gray-700 truncate"
                :title="certificate.issuingAuthority"
            >
                {{ certificate.issuingAuthority }}
            </span>
        </div>

        <!-- Actions -->
        <div class="col-span-1 flex items-center justify-end">
            <div class="flex items-center space-x-1">
                <!-- View Button -->
                <button
                    v-if="certificate.file"
                    class="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors duration-150"
                    :title="$t('viewCertificate', 'View certificate')"
                    @click="handleView"
                >
                    <svg class="w-4 h-4">
                        <use xlink:href="/sprite.svg#eye"></use>
                    </svg>
                </button>

                <!-- Download Button -->
                <button
                    v-if="certificate.file"
                    class="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-md transition-colors duration-150"
                    :title="$t('downloadCertificate', 'Download certificate')"
                    @click="handleDownload"
                >
                    <svg class="w-4 h-4">
                        <use xlink:href="/sprite.svg#download"></use>
                    </svg>
                </button>

                <!-- Dropdown Menu -->
                <div ref="dropdownRef" class="relative">
                    <button
                        class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors duration-150"
                        :title="$t('moreOptions', 'More options')"
                        @click="toggleDropdown"
                    >
                        <svg class="w-4 h-4">
                            <use xlink:href="/sprite.svg#dots-vertical"></use>
                        </svg>
                    </button>

                    <!-- Dropdown Menu -->
                    <Teleport to="body">
                        <div
                            v-if="showDropdown"
                            class="absolute z-50 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1"
                            :style="dropdownStyle"
                        >
                            <button
                                class="w-full px-4 py-2 text-left text-caption1 text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                @click="handleEdit"
                            >
                                <svg class="w-4 h-4">
                                    <use xlink:href="/sprite.svg#edit"></use>
                                </svg>
                                <span>{{ $t('edit', 'Edit') }}</span>
                            </button>

                            <button
                                class="w-full px-4 py-2 text-left text-caption1 text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                @click="handleDelete"
                            >
                                <svg class="w-4 h-4">
                                    <use xlink:href="/sprite.svg#trash"></use>
                                </svg>
                                <span>{{ $t('delete', 'Delete') }}</span>
                            </button>
                        </div>
                    </Teleport>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { format, isAfter, isBefore, addDays } from 'date-fns'

    interface Certificate {
        id?: number
        name: string
        number: string
        issueDate: string
        expiryDate: string
        issuingAuthority: string
        file: File | null
    }

    interface Props {
        certificate: Certificate
        index: number
    }

    const props = defineProps<Props>()

    const emit = defineEmits<{
        (e: 'edit', index: number): void
        (e: 'delete', index: number): void
        (e: 'view', certificate: Certificate): void
        (e: 'download', certificate: Certificate): void
    }>()

    // Composables
    const { t } = useI18n({ useScope: 'global' })

    // State
    const showDropdown = ref(false)
    const dropdownRef = ref<HTMLElement | null>(null)
    const dropdownStyle = ref<Record<string, string>>({})

    // Computed Properties
    const isExpired = computed(() => {
        const expiryDate = new Date(props.certificate.expiryDate)
        return isBefore(expiryDate, new Date())
    })

    const isExpiringSoon = computed(() => {
        const expiryDate = new Date(props.certificate.expiryDate)
        const thirtyDaysFromNow = addDays(new Date(), 30)
        return !isExpired.value && isBefore(expiryDate, thirtyDaysFromNow)
    })

    // Methods
    const formatDate = (dateString: string): string => {
        try {
            return format(new Date(dateString), 'MMM dd, yyyy')
        } catch {
            return dateString
        }
    }

    const getFileSize = (file: File): string => {
        const bytes = file.size
        const sizes = ['B', 'KB', 'MB', 'GB']
        if (bytes === 0) return '0 B'
        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`
    }

    const toggleDropdown = async () => {
        showDropdown.value = !showDropdown.value
        if (showDropdown.value) {
            await nextTick()
            positionDropdown()
        }
    }

    const positionDropdown = () => {
        if (!dropdownRef.value) return

        const rect = dropdownRef.value.getBoundingClientRect()
        const vw = window.innerWidth
        const vh = window.innerHeight

        let left = rect.left
        let top = rect.bottom + 4

        // Adjust horizontal position if dropdown would go off-screen
        if (left + 192 > vw) {
            // 192px = w-48
            left = rect.right - 192
        }

        // Adjust vertical position if dropdown would go off-screen
        if (top + 100 > vh) {
            // Approximate dropdown height
            top = rect.top - 100 - 4
        }

        dropdownStyle.value = {
            position: 'fixed',
            left: `${left}px`,
            top: `${top}px`,
            zIndex: '9999',
        }
    }

    const closeDropdown = () => {
        showDropdown.value = false
    }

    // Handlers
    const handleView = () => {
        emit('view', props.certificate)
        closeDropdown()
    }

    const handleDownload = () => {
        emit('download', props.certificate)
        closeDropdown()
    }

    const handleEdit = () => {
        emit('edit', props.index)
        closeDropdown()
    }

    const handleDelete = () => {
        emit('delete', props.index)
        closeDropdown()
    }

    // Click outside handler
    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
            closeDropdown()
        }
    }

    // Lifecycle
    onMounted(() => {
        document.addEventListener('click', handleClickOutside)
        window.addEventListener('resize', closeDropdown)
    })

    onBeforeUnmount(() => {
        document.removeEventListener('click', handleClickOutside)
        window.removeEventListener('resize', closeDropdown)
    })
</script>
