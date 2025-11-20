<template>
    <AuthContainer class="bg-gray-150" :full-height="false" content-class="max-w-2xl mx-auto">
        <template #header>
            <div class="text-center mb-6 md:w-1/3 mx-auto">
                <h1 class="text-h6 font-semibold text-gray-950 mb-1">
                    {{ $t('auth.signIn', 'Sign in') }}
                </h1>
                <p class="text-gray-800 text-subtitle2">
                    {{ $t('auth.signInDescription') }}
                </p>
            </div>
        </template>

        <form
            class="flex flex-col gap-3 w-full md:w-1/2 mx-auto"
            novalidate
            @submit.prevent="handleSubmit"
        >
            <Input
                v-model="form.email"
                type="email"
                name="email"
                :label="$t('email', 'E-Mail address')"
                :error="errors.email"
                :required="true"
                background="bg-white"
                autocomplete="email"
                @input="clearFieldError('email')"
            />

            <Input
                v-model="form.password"
                type="password"
                name="password"
                :label="$t('password', 'Password')"
                :error="errors.password"
                :required="false"
                background="bg-white"
                autocomplete="current-password"
                @input="clearFieldError('password')"
            />

            <div class="flex items-center justify-center">
                <Checkbox v-model="form.remember" :label="$t('rememberMe')" />
            </div>

            <Button
                type="submit"
                color="red"
                class="w-full"
                size="lg"
                :loading="isLoading"
                :disabled="!canSubmit"
                :label="submitButtonLabel"
            />

            <div v-if="!form.password" class="flex items-start gap-1 text-caption1 text-gray-800">
                <svg class="w-3 h-3 flex-shrink-0">
                    <use xlink:href="/sprite.svg#warn-error"></use>
                </svg>
                <span class="break-words">
                    {{
                        $t(
                            'auth.emailLoginHint',
                            'Leave password empty to receive a login link via email'
                        )
                    }}
                </span>
            </div>
        </form>

        <template #footer>
            <div class="text-center md:w-1/2 mx-auto">
                <p class="text-gray-800 text-subtitle2 my-4">
                    {{ $t('auth.noAccount') }}
                </p>
                <NuxtLink :to="localePath('/register')" class="block w-full">
                    <Button
                        color="green"
                        size="lg"
                        class="w-full"
                        :label="$t('auth.registerAccount')"
                    />
                </NuxtLink>
                <div class="my-4">
                    <Link
                        color="danger"
                        class="my-4"
                        :to="localePath('/auth/forgot-password')"
                        :title="$t('auth.forgetPassword', 'Forgot password?')"
                    />
                </div>
            </div>
        </template>
    </AuthContainer>
</template>

<script setup lang="ts">
    import { ref, reactive, computed, onMounted } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useLocalePath, useRoute, navigateTo } from '#imports'
    import { validateData } from '~/utils/validator/index'
    import { loginSchema, type LoginFormData } from '~/utils/validator/schemas/auth/loginSchema'
    import { useToastNotification } from '~/composables/useToastNotification'
    import Link from '~/components/ui/Link.vue'

    interface BackendError {
        message?: string
        errors?: Record<string, string | string[]>
    }

    definePageMeta({ middleware: 'guest', layout: 'auth' })

    const userStore = useUserStore()
    const { getRegistrationProgressMessage } = useAuthNavigation()

    const { t } = useI18n()
    const localePath = useLocalePath()
    const toast = useToastNotification()
    const route = useRoute()

    const isLoading = ref(false)

    const rememberCookie = useCookie<string | null>('remember.credentials', {
        path: '/',
        sameSite: 'lax',
        secure: process.client,
        maxAge: 60 * 60 * 24 * 14,
    })

    const form = reactive<LoginFormData>({
        email: '',
        password: '',
        remember: false,
    })

    const errors = reactive({
        email: '',
        password: '',
    })

    const submitButtonLabel = computed(() => {
        if (!form.password || form.password.trim() === '') {
            return t('auth.sendLoginLink', 'Send Login Link')
        }
        return t('auth.signIn', 'Sign in')
    })

    const initializeForm = () => {
        if (rememberCookie.value) {
            try {
                const [email, password] = atob(rememberCookie.value).split('|')
                form.email = email || ''
                form.password = password || ''
                form.remember = true
            } catch {
                rememberCookie.value = null
                form.email = ''
                form.password = ''
                form.remember = false
            }
        }
    }

    const validateForm = (isEmailLogin = false): boolean => {
        errors.email = ''
        errors.password = ''

        // For email login, only validate email
        if (isEmailLogin) {
            if (!form.email || !form.email.trim()) {
                errors.email = t('validation.emailRequired', 'Email is required')
                return false
            }

            // Basic email format validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(form.email)) {
                errors.email = t('validation.emailInvalid', 'Please enter a valid email address')
                return false
            }

            return true
        }

        // For regular login, validate both email and password
        const validationResult = validateData('login', loginSchema, form)

        if (!validationResult.isValid) {
            validationResult.errors.forEach((error) => {
                if (error.field === 'email') {
                    errors.email = error.message
                }
                if (error.field === 'password') {
                    errors.password = error.message
                }
            })
            return false
        }

        return true
    }

    const clearFieldError = (field: 'email' | 'password') => {
        errors[field] = ''
    }

    const canSubmit = computed(() => {
        return form.email.length > 0 && !errors.email && !errors.password && !isLoading.value
    })

    const handleRememberCredentials = () => {
        if (form.remember && form.email && form.password) {
            rememberCookie.value = btoa(`${form.email}|${form.password}`)
        } else {
            rememberCookie.value = null
        }
    }

    const extractErrorMessage = (messages: string | string[]): string => {
        return Array.isArray(messages) ? messages[0] : messages
    }

    const handleEmailLoginError = (error: any) => {
        const status = error.response?.status
        const responseData: BackendError | undefined = error.response?.data
        const backendErrors = responseData?.errors

        errors.email = ''

        if (backendErrors && typeof backendErrors === 'object') {
            Object.entries(backendErrors).forEach(([field, messages]) => {
                const message = extractErrorMessage(messages)

                if (field === 'email') {
                    errors.email = message
                }
            })
        }

        if (errors.email) {
            toast.error(errors.email, t('auth.emailLoginError', 'Email Login Error'))
            return
        }

        switch (status) {
            case 422:
                toast.error(
                    t('auth.emailNotFound', 'No account found with this email address'),
                    t('auth.emailLoginError', 'Email Login Error')
                )
                break
            case 429:
                toast.error(
                    t('auth.tooManyAttempts', 'Too many attempts. Please try again later.'),
                    t('auth.emailLoginError', 'Email Login Error')
                )
                break
            case 500:
            case 502:
            case 503:
                toast.error(
                    t('auth.serverError', 'Server error. Please try again later.'),
                    t('auth.emailLoginError', 'Email Login Error')
                )
                break
            default:
                toast.error(
                    t('auth.emailLoginFailed', 'Failed to send login link. Please try again.'),
                    t('auth.emailLoginError', 'Email Login Error')
                )
        }
    }

    const handleLoginError = (error: any) => {
        const status = error.response?.status
        const responseData: BackendError | undefined = error.response?.data
        const backendErrors = responseData?.errors

        errors.email = ''
        errors.password = ''
        let hasFieldErrors = false

        if (backendErrors && typeof backendErrors === 'object') {
            Object.entries(backendErrors).forEach(([field, messages]) => {
                const message = extractErrorMessage(messages)

                if (field === 'email') {
                    errors.email = message
                    hasFieldErrors = true
                }
                if (field === 'password') {
                    errors.password = message
                    hasFieldErrors = true
                }
            })
        }

        if (hasFieldErrors) {
            toast.error(
                responseData?.message || t('auth.invalidCredentials', 'Invalid email or password')
            )
            return
        }

        switch (status) {
            case 401:
                toast.error(t('auth.invalidCredentials', 'Invalid email or password'))
                break
            case 403:
                toast.error(t('auth.accountDisabled', 'Your account has been disabled'))
                break
            case 422:
                toast.error(
                    t('validation.credentialError', 'Please check your input and try again')
                )
                break
            case 429:
                toast.error(
                    t('auth.tooManyAttempts', 'Too many login attempts. Please try again later.')
                )
                break
            case 500:
            case 502:
            case 503:
                toast.error(t('auth.serverError', 'Server error. Please try again later.'))
                break
            default:
                toast.error(t('auth.loginError', 'Login failed. Please try again later.'))
        }
    }

    const handleEmailLogin = async () => {
        if (!validateForm(true)) {
            return
        }

        isLoading.value = true

        try {
            await userStore.requestEmailLogin(form.email)

            toast.success(
                t(
                    'auth.emailLoginSuccess',
                    'A login link has been sent to your email address. Please check your inbox.'
                ),
                t('auth.checkEmail', 'Check Your Email')
            )

            form.password = ''
        } catch (error: any) {
            if (error.message?.includes('wait') && error.message?.includes('seconds')) {
                toast.warning(error.message, t('auth.pleaseWait', 'Please Wait'))
            } else {
                handleEmailLoginError(error)
            }
        } finally {
            isLoading.value = false
        }
    }

    const handlePasswordLogin = async () => {
        if (!validateForm(false)) {
            return
        }

        isLoading.value = true

        try {
            const result = await userStore.login({
                email: form.email,
                password: form.password,
            })

            handleRememberCredentials()

            if (!userStore.isRegistrationComplete) {
                const step = userStore.currentRegistrationStep
                const message = getRegistrationProgressMessage(step)
                toast.info(message)

                const registrationPath = userStore.getRegistrationRedirectPath()
                await navigateTo(registrationPath, { replace: true })
                return
            }

            if (userStore.isVerified) {
                toast.success(t('auth.loginSuccess', 'Welcome back!'))

                const nextParam = route.query.next as string | undefined
                const targetPath = nextParam && isValidRedirectUrl(nextParam) ? nextParam : '/'

                if (process.client) {
                    setTimeout(() => {
                        window.location.href = targetPath
                    }, 100)
                }
            } else if (userStore.isPending) {
                toast.warning(
                    t(
                        'auth.verificationPending',
                        'Your account is pending verification. Please wait for admin approval.'
                    )
                )
                form.password = ''
            } else if (userStore.isRejected) {
                toast.error(
                    t(
                        'auth.verificationRejected',
                        'Your account verification was rejected. Please contact support.'
                    )
                )
                form.password = ''
            } else {
                toast.info(
                    t(
                        'auth.verificationRequired',
                        'Please submit your documents for account verification.'
                    )
                )
                form.password = ''
            }
        } catch (error) {
            handleLoginError(error)
        } finally {
            isLoading.value = false
        }
    }

    const handleSubmit = async () => {
        if (!form.password || form.password.trim() === '') {
            await handleEmailLogin()
        } else {
            await handlePasswordLogin()
        }
    }

    const isValidRedirectUrl = (url: string): boolean => {
        try {
            if (url.startsWith('/')) {
                const blockedPaths = ['/login', '/register', '/auth/']
                return !blockedPaths.some((path) => url.startsWith(path))
            }
            return false
        } catch {
            return false
        }
    }

    onMounted(() => {
        initializeForm()
    })
</script>
