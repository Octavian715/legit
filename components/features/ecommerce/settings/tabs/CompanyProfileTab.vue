<template>
    <div class="w-full space-y-3">
        <!-- Cover Image Section - EDITABLE -->
        <div class="bg-white rounded-md overflow-hidden">
            <div
                :class="[
                    'relative w-full h-40 bg-gradient-to-br from-blue-600 via-purple-600 to-red-600 overflow-hidden cursor-pointer hover:opacity-90 transition-all',
                    { 'upload-pulse': !headerImage },
                ]"
                @dragover.prevent
                @drop.prevent="handleHeaderDrop"
                @click="triggerHeaderInput"
            >
                <div class="absolute inset-0 opacity-20">
                    <div
                        class="absolute inset-0"
                        style="
                            background-image: url('data:image/svg+xml,<svg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;><g fill=&quot;none&quot; fill-rule=&quot;evenodd&quot;><g fill=&quot;%23ffffff&quot; fill-opacity=&quot;0.1&quot;><circle cx=&quot;30&quot; cy=&quot;30&quot; r=&quot;2&quot;/></g></g></svg>');
                        "
                    ></div>
                </div>

                <div v-if="!headerImage" class="absolute inset-0 flex items-center justify-center">
                    <div class="text-center text-white">
                        <svg class="w-10 h-10 mx-auto mb-2">
                            <use xlink:href="/sprite.svg#image-add" />
                        </svg>
                        <p class="text-sm">Click to upload banner</p>
                    </div>
                </div>

                <div class="absolute inset-0 bg-white bg-opacity-10"></div>

                <input
                    ref="headerInput"
                    type="file"
                    class="hidden"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    @change="handleHeaderUpload"
                />

                <img
                    v-if="headerImage"
                    :src="headerImage"
                    :alt="`${companyName} cover`"
                    class="w-full h-full object-cover"
                />

                <!-- Edit Button -->
                <button
                    v-if="headerImage"
                    class="absolute top-3 right-3 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-all"
                    @click.stop="triggerHeaderInput"
                >
                    <svg class="w-5 h-5">
                        <use xlink:href="/sprite.svg#edit2" />
                    </svg>
                </button>
            </div>

            <!-- Profile Header -->
            <div class="p-3">
                <div class="flex flex-col lg:flex-row gap-4">
                    <!-- Left Side: Avatar + Info -->
                    <div class="flex flex-col lg:flex-row lg:items-start items-center gap-3 flex-1">
                        <!-- Avatar - EDITABLE with overlap -->
                        <div class="relative -mt-36 lg:-mt-16 flex-shrink-0">
                            <div
                                :class="[
                                    'w-40 h-40 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white overflow-hidden cursor-pointer hover:opacity-90 transition-all',
                                    { 'upload-pulse': !logoImage },
                                ]"
                                @dragover.prevent
                                @drop.prevent="handleLogoDrop"
                                @click="triggerLogoInput"
                            >
                                <input
                                    ref="logoInput"
                                    type="file"
                                    class="hidden"
                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                    @change="handleLogoUpload"
                                />

                                <div
                                    v-if="!logoImage"
                                    class="flex flex-col items-center justify-center text-gray-400"
                                >
                                    <svg class="w-10 h-10 mb-1">
                                        <use xlink:href="/sprite.svg#image-add" />
                                    </svg>
                                    <p class="text-xs">Upload logo</p>
                                </div>

                                <img
                                    v-if="logoImage"
                                    :src="logoImage"
                                    :alt="companyName"
                                    class="w-full h-full object-cover"
                                />
                            </div>

                            <!-- Edit Button -->
                            <button
                                class="absolute bottom-1 right-1 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-all border border-gray-200"
                                @click="triggerLogoInput"
                            >
                                <svg class="w-4 h-4">
                                    <use xlink:href="/sprite.svg#edit2" />
                                </svg>
                            </button>
                        </div>

                        <!-- Profile Info -->
                        <div class="flex-1 min-w-0 pt-2">
                            <div
                                class="flex justify-center lg:justify-start items-center gap-2 mb-1"
                            >
                                <h1 class="text-title1 font-bold text-gray-950">
                                    {{ companyName }}
                                </h1>
                                <svg v-if="isVerified" class="w-4 h-4 text-blue-500">
                                    <use xlink:href="/sprite.svg#verified" />
                                </svg>
                            </div>

                            <p
                                class="flex justify-center lg:justify-start items-center mb-2 text-gray-800 text-body"
                            >
                                @{{ companyUsername }}
                            </p>

                            <!-- Stats with VERTICAL DIVIDERS -->
                            <div class="flex items-center gap-3">
                                <div class="flex flex-col sm:flex-row items-center gap-1">
                                    <div class="text-subtitle1 font-bold text-gray-950">
                                        {{ productsCount }}
                                    </div>
                                    <div class="text-subtitle1 text-gray-800">
                                        {{ $t('profile.tabs.products', 'Products') }}
                                    </div>
                                </div>

                                <div class="w-px h-5 mx-1 bg-gray-400" />

                                <div class="flex flex-col sm:flex-row items-center gap-1">
                                    <div class="text-subtitle1 font-bold text-gray-950">
                                        {{ connectionsCount }}
                                    </div>
                                    <div class="text-subtitle1 text-gray-800">
                                        {{ $t('profile.connections', 'connections') }}
                                    </div>
                                </div>

                                <div class="w-px h-5 mx-1 bg-gray-400" />

                                <div class="flex flex-col sm:flex-row items-center gap-1">
                                    <div class="text-subtitle1 font-bold text-gray-950">
                                        {{ followersCount }}
                                    </div>
                                    <div class="text-subtitle1 text-gray-800">
                                        {{ $t('profile.followers', 'Followers') }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Side: Social Buttons (disabled in edit mode) -->
                    <div class="flex lg:ml-auto justify-center lg:justify-end gap-3">
                        <div class="flex flex-col gap-2 lg:items-end lg:justify-center">
                            <div class="flex gap-2">
                                <!-- Chat Button -->
                                <Button
                                    color="gray"
                                    variant="filled"
                                    size="md"
                                    disabled
                                    class="opacity-50"
                                >
                                    <div class="flex items-center">
                                        <svg class="w-4 h-4 mr-1">
                                            <use xlink:href="/sprite.svg#message" />
                                        </svg>
                                        {{ $t('profile.chat', 'Chat') }}
                                    </div>
                                </Button>

                                <!-- Follow Button -->
                                <Button
                                    color="gray"
                                    variant="filled"
                                    size="md"
                                    disabled
                                    class="opacity-50"
                                >
                                    {{ $t('profile.follow', 'Follow') }}
                                </Button>

                                <!-- Connect Button -->
                                <Button
                                    color="red"
                                    variant="filled"
                                    size="md"
                                    disabled
                                    class="opacity-50"
                                >
                                    <svg class="w-4 h-4">
                                        <use xlink:href="/sprite.svg#disconnect" />
                                    </svg>
                                    {{ $t('profile.connect', 'Connect') }}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-md">
            <h2 class="text-subtitle3 text-gray-800 mb-3">
                {{ $t('profile.sections.gallery', 'Gallery images') }}
            </h2>

            <input
                ref="galleryInput"
                type="file"
                class="hidden"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                @change="handleGalleryUpload"
            />

            <div class="relative">
                <!-- Left Arrow Button - EXACT style from _profileId_.vue -->
                <button
                    v-if="showScrollLeft"
                    class="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-50 active:bg-red-500 active:text-white active:border-red-500 p-2 rounded-sm shadow-lg transition-all duration-300"
                    @click="scrollLeft"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                </button>

                <!-- Gallery Container -->
                <div
                    ref="scrollContainer"
                    class="overflow-x-auto scrollbar-hide scroll-smooth"
                    @scroll="updateScrollVisibility"
                >
                    <div class="flex gap-3 pb-2 py-2">
                        <!-- Existing Gallery Images -->
                        <div
                            v-for="(image, index) in form.gallery"
                            :key="index"
                            class="relative flex-shrink-0 w-48 h-48 rounded-md border border-gray-300 cursor-pointer hover:shadow-lg transition-all duration-200 group"
                        >
                            <img
                                :src="image.preview || image.url"
                                :alt="`Gallery ${index + 1}`"
                                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />

                            <!-- Remove Button -->
                            <button
                                class="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-sm shadow-md flex items-center justify-center text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all z-10"
                                @click.stop="removeGalleryImage(index)"
                            >
                                <svg class="w-4 h-4">
                                    <use xlink:href="/sprite.svg#close" />
                                </svg>
                            </button>
                        </div>

                        <!-- Add New Placeholder -->
                        <div
                            :class="[
                                'flex-shrink-0 w-48 h-48 bg-gray-100 rounded-md flex flex-col items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-all border-2 border-dashed border-gray-300 cursor-pointer',
                                { 'upload-pulse': form.gallery.length === 0 },
                            ]"
                            @click="triggerGalleryInput"
                            @dragover.prevent
                            @drop.prevent="handleGalleryDrop"
                        >
                            <svg class="w-12 h-12 mb-2">
                                <use xlink:href="/sprite.svg#image-add" />
                            </svg>
                            <span class="text-sm text-center px-4">
                                {{ $t('profile.addImages', 'Click to add images') }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Right Arrow Button - EXACT style from _profileId_.vue -->
                <button
                    v-if="showScrollRight"
                    class="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-400 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-50 active:bg-red-500 active:text-white active:border-red-500 p-2 rounded-sm shadow-lg transition-all duration-300"
                    @click="scrollRight"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </button>
            </div>

            <p class="text-caption1 text-gray-600 mt-2">
                {{
                    $t(
                        'profile.galleryHelper',
                        'Add up to 10 images showcasing your products, facilities, or team. PNG, JPG up to 5MB each'
                    )
                }}
            </p>
        </div>

        <!-- Watch Preview Button -->
        <div class="flex justify-center">
            <Button color="blue" variant="filled" size="lg" @click="showPreview = true">
                {{ $t('watchPreview') }}
            </Button>
        </div>

        <!-- Preview Modal -->
        <Teleport to="body">
            <div
                v-if="showPreview"
                class="fixed inset-0 z-[999] flex items-center justify-center bg-white/80 backdrop-blur p-4"
                @click.self="showPreview = false"
            >
                <CompanyPreviewModal
                    :form-data="formData"
                    :header-image="headerImage"
                    :logo-image="logoImage"
                    :gallery-images="form.gallery"
                    :user="user"
                    @cancel="showPreview = false"
                />
            </div>
        </Teleport>

        <!-- Edit Forms -->
        <div class="space-y-3">
            <h2 class="text-subtitle3 text-gray-800">
                {{ $t('profile.editProfile', 'Edit Company Profile') }}
            </h2>

            <!-- Company Name & Username -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                    v-model="formData.legal_name"
                    :label="$t('profile.companyName', 'Company Name')"
                    name="legal_name"
                    :error="errors.legal_name"
                    @blur="validateField('legal_name')"
                />

                <Input
                    v-model="formData.username"
                    :label="$t('profile.username', 'Username')"
                    name="username"
                    :error="errors.username"
                    @blur="validateField('username')"
                />
            </div>

            <!-- Description -->
            <Textarea
                v-model="formData.description"
                :label="$t('profile.description', 'Description')"
                name="description"
                :rows="6"
                :maxlength="1000"
                :error="errors.description"
                @blur="validateField('description')"
            />

            <!-- Contact Details -->
            <div class="space-y-3">
                <h3 class="text-subtitle3 text-gray-800">
                    {{ $t('profile.contactDetails', 'Contact Details') }}
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                        v-model="formData.email"
                        type="email"
                        :label="$t('profile.email', 'Email')"
                        name="email"
                        :error="errors.email"
                        disabled
                        @blur="validateField('email')"
                    />

                    <Input
                        v-model="formData.website_url"
                        type="url"
                        :label="$t('profile.website', 'Website')"
                        name="website_url"
                        :error="errors.website_url"
                        @blur="validateField('website_url')"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, onMounted, nextTick } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useUserStore } from '~/stores/user'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { validator } from '~/utils/validator/index'
    import { companyProfileFormSchema } from '~/utils/validator/schemas/user/companyProfile'
    import type { CompanyProfileFormData } from '~/utils/validator/schemas/user/companyProfile'

    interface GalleryImage {
        id?: number // ✅ ID for existing images
        file?: File
        preview?: string
        url?: string
    }

    const { t } = useI18n()
    const userStore = useUserStore()
    const { success, error: errorToast } = useToastNotification()

    const user = computed(() => userStore.user)
    const isDirty = ref(false)
    const showPreview = ref(false)

    const headerInput = ref<HTMLInputElement | null>(null)
    const logoInput = ref<HTMLInputElement | null>(null)
    const galleryInput = ref<HTMLInputElement | null>(null)
    const scrollContainer = ref<HTMLElement | null>(null)

    const headerImage = ref<string | null>(null)
    const logoImage = ref<string | null>(null)

    const showScrollLeft = ref(false)
    const showScrollRight = ref(false)
    const SCROLL_AMOUNT = 200

    const form = ref<{
        profilePicture: File | null
        companyCover: File | null
        gallery: GalleryImage[]
    }>({
        profilePicture: null,
        companyCover: null,
        gallery: [],
    })

    const formData = ref<CompanyProfileFormData>({
        legal_name: '',
        username: '',
        description: '',
        email: '',
        website_url: '',
    })

    const errors = ref<Record<string, string>>({})
    const originalData = ref<typeof formData.value>()

    const companyName = computed(
        () => formData.value.legal_name || user.value?.company_details?.legal_name || 'My company'
    )
    const companyUsername = computed(
        () => formData.value.username || user.value?.company_details?.username || 'test_company'
    )
    const isVerified = computed(() => user.value?.is_verified || false)
    const productsCount = computed(() => user.value?.products_count || 0)
    const connectionsCount = computed(() => user.value?.social?.connections_count || 0)
    const followersCount = computed(() => user.value?.social?.followers_count || 0)

    const loadFormData = () => {
        const companyDetails = user.value?.company_details
        const contacts = user.value?.contacts?.[0]

        formData.value = {
            legal_name: companyDetails?.legal_name || '',
            username: companyDetails?.username || '',
            description: companyDetails?.description || '',
            email: contacts?.email || '',
            website_url: companyDetails?.website_url || '',
        }

        const banner = user.value?.profile_media?.find((m) => m.type === 'banner')
        const picture = user.value?.profile_media?.find((m) => m.type === 'picture')
        const gallery = user.value?.profile_media?.filter((m) => m.type === 'gallery') || []

        if (banner) headerImage.value = banner.url
        if (picture) logoImage.value = picture.url
        form.value.gallery = gallery.map((img) => ({
            id: img.id, // ✅ Include ID for existing images
            preview: img.url,
            url: img.url,
        }))

        originalData.value = JSON.parse(JSON.stringify(formData.value))
        errors.value = {}
        nextTick(updateScrollVisibility)
    }

    const validateImageFile = (file: File): boolean => {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        const maxSize = 5 * 1024 * 1024
        if (!allowed.includes(file.type)) {
            errorToast(t('errors.invalidImageType', 'Invalid image type'), t('error', 'Error'))
            return false
        }
        if (file.size > maxSize) {
            errorToast(t('errors.imageTooLarge', 'Image too large'), t('error', 'Error'))
            return false
        }
        return true
    }

    const readImage = (file: File, callback: (src: string) => void) => {
        const reader = new FileReader()
        reader.onload = (e) => callback(e.target?.result as string)
        reader.readAsDataURL(file)
    }

    const triggerHeaderInput = () => headerInput.value?.click()
    const handleHeaderUpload = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file && validateImageFile(file)) {
            form.value.companyCover = file
            readImage(file, (src) => (headerImage.value = src))
            markDirty()
        }
    }
    const handleHeaderDrop = (e: DragEvent) => {
        const file = e.dataTransfer?.files?.[0]
        if (file && validateImageFile(file)) {
            form.value.companyCover = file
            readImage(file, (src) => (headerImage.value = src))
            markDirty()
        }
    }

    const triggerLogoInput = () => logoInput.value?.click()
    const handleLogoUpload = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file && validateImageFile(file)) {
            form.value.profilePicture = file
            readImage(file, (src) => (logoImage.value = src))
            markDirty()
        }
    }
    const handleLogoDrop = (e: DragEvent) => {
        const file = e.dataTransfer?.files?.[0]
        if (file && validateImageFile(file)) {
            form.value.profilePicture = file
            readImage(file, (src) => (logoImage.value = src))
            markDirty()
        }
    }

    const triggerGalleryInput = () => galleryInput.value?.click()
    const handleGalleryUpload = (e: Event) => {
        const files = (e.target as HTMLInputElement).files
        if (files) addGalleryImages(Array.from(files))
    }
    const handleGalleryDrop = (e: DragEvent) => {
        const files = e.dataTransfer?.files
        if (files) addGalleryImages(Array.from(files))
    }

    const addGalleryImages = (files: File[]) => {
        const validFiles = files.filter(validateImageFile)
        const promises = validFiles.map((file) => {
            return new Promise<GalleryImage>((resolve) => {
                const reader = new FileReader()
                reader.onload = (e) => {
                    const result = e.target?.result
                    if (typeof result === 'string') {
                        resolve({ file, preview: result })
                    }
                }
                reader.readAsDataURL(file)
            })
        })
        Promise.all(promises).then((results) => {
            form.value.gallery = [...form.value.gallery, ...results]
            updateScrollVisibility()
            nextTick(scrollToLast)
            markDirty()
        })
    }

    const removeGalleryImage = (index: number) => {
        form.value.gallery = form.value.gallery.filter((_, i) => i !== index)
        nextTick(updateScrollVisibility)
        markDirty()
    }

    const updateScrollVisibility = () => {
        const el = scrollContainer.value
        if (!el) return
        showScrollLeft.value = el.scrollLeft > 10
        showScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 10
    }

    const scrollLeft = () => {
        scrollContainer.value?.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' })
    }

    const scrollRight = () => {
        scrollContainer.value?.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' })
    }

    const scrollToLast = () => {
        const el = scrollContainer.value
        if (!el) return
        el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' })
    }

    const validateField = (field: keyof CompanyProfileFormData) => {
        const result = validator.validateField(
            'companyProfile',
            companyProfileFormSchema,
            field,
            formData.value[field]
        )
        if (!result.isValid && result.errors.length > 0) {
            errors.value[field] = result.errors[0].message
        } else {
            delete errors.value[field]
        }
    }

    const markDirty = () => {
        isDirty.value = true
    }

    watch(
        formData,
        () => {
            if (originalData.value) {
                isDirty.value =
                    JSON.stringify(formData.value) !== JSON.stringify(originalData.value) ||
                    !!form.value.profilePicture ||
                    !!form.value.companyCover ||
                    form.value.gallery.some((g) => g.file)
            }
        },
        { deep: true }
    )

    const validate = () => {
        errors.value = {}
        const result = validator.validate(
            'companyProfile',
            companyProfileFormSchema,
            formData.value
        )
        if (!result.isValid) {
            result.errors.forEach((error) => {
                errors.value[error.field] = error.message
            })
        }
        const isValid = Object.keys(errors.value).length === 0
        return { isValid, errors: isValid ? [] : Object.values(errors.value) }
    }

    const save = async () => {
        try {
            // Validate first
            const validation = validate()
            if (!validation.isValid) {
                errorToast(
                    t('validation.pleaseFixErrors', 'Please fix the errors before saving'),
                    t('error', 'Error')
                )
                return false
            }

            // Call user store to update profile
            await userStore.updateCompanyProfile({
                formData: formData.value,
                profilePicture: form.value.profilePicture,
                companyCover: form.value.companyCover,
                gallery: form.value.gallery,
            })

            // Show success message
            // success(
            //     t('profile.profileUpdated', 'Profile updated successfully'),
            //     t('success', 'Success')
            // )

            // Reset dirty state
            isDirty.value = false
            originalData.value = JSON.parse(JSON.stringify(formData.value))
            form.value.profilePicture = null
            form.value.companyCover = null

            // Wait for next tick to ensure user.value is updated
            await nextTick()

            // Reload form data to get updated values from server (including new IDs)
            loadFormData()

            return true
        } catch (err: any) {
            console.error('Failed to update profile:', err)
            errorToast(
                err.message || t('profile.updateFailed', 'Failed to update profile'),
                t('error', 'Error')
            )
            throw err
        }
    }

    const reset = () => {
        loadFormData()
        form.value.profilePicture = null
        form.value.companyCover = null
        isDirty.value = false
        nextTick(updateScrollVisibility)
    }

    defineExpose({ validate, save, reset, isDirty })

    onMounted(() => {
        loadFormData()
    })
</script>

<style scoped>
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
    @keyframes pulse-animation {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0.7;
        }
    }
    .upload-pulse {
        animation: pulse-animation 2s ease-in-out infinite;
    }
</style>
