<template>
    <div class="flex flex-col gap-3">
        <Breadcrumbs :items="breadcrumbs" />

        <div class="flex flex-col gap-6">
            <div class="flex items-center justify-between px-2.5">
                <div></div>
                <h1 class="text-title1 text-gray-950">
                    {{
                        isEditMode
                            ? t('editTemplate', { template: t('sku', 0) })
                            : t('addATemplate', { n: 2, template: t('sku', 0) })
                    }}
                </h1>
                <ButtonClose
                    v-tooltip="$t('close')"
                    :aria-labelledby="'close'"
                    size="xl"
                    icon-size="xl"
                    @click="handleClose"
                />
            </div>

            <div v-if="shouldShowStepper" class="px-8">
                <Steps
                    :steps="stepperStepsWithCompletion"
                    :active-step="currentStepIndex"
                    @step-click="handleStepperClick"
                />
            </div>

            <div
                v-if="!isEditMode || (isEditMode && isInitialized)"
                class="bg-white p-8 pb-20 space-y-3 rounded"
            >
                <ClientOnly>
                    <Suspense>
                        <template #default>
                            <component
                                :is="currentStepComponent"
                                v-if="currentStepComponent"
                                ref="currentStepRef"
                                :step-data="stepData[currentStep] || {}"
                                :field-errors="currentStepErrors"
                                @update="handleStepUpdate"
                                @method-selected="handleMethodSelected"
                                @clear-error="handleClearError"
                            />
                            <div v-else class="min-h-[400px] flex items-center justify-center">
                                <div class="flex justify-center items-center p-8">
                                    <span class="loader"></span>
                                </div>
                            </div>
                        </template>

                        <template #fallback>
                            <div class="min-h-[400px] flex items-center justify-center">
                                <div class="flex justify-center items-center p-8">
                                    <span class="loader"></span>
                                </div>
                            </div>
                        </template>
                    </Suspense>

                    <template #fallback>
                        <div class="min-h-[400px] flex items-center justify-center">
                            <div class="flex justify-center items-center p-8">
                                <span class="loader"></span>
                            </div>
                        </div>
                    </template>
                </ClientOnly>
            </div>

            <div v-else class="bg-white p-8 pb-20 space-y-3 rounded">
                <div class="min-h-[400px] flex items-center justify-center">
                    <div class="flex justify-center items-center p-8">
                        <span class="loader"></span>
                    </div>
                </div>
            </div>

            <StepControlPanel
                v-if="shouldShowControlPanel && isMounted"
                :current-step="currentStep"
                :current-step-index="currentStepIndex"
                :total-steps="totalSteps"
                :can-go-back="canGoBack"
                :can-go-forward="canGoForward"
                :is-valid="isStepValid"
                :is-loading="isLoading"
                :is-last-step="isLastStep"
                @previous="handlePrevious"
                @next="handleNext"
                @complete="handleComplete"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
    import { camelToSnake } from '~/utils/case-converter'
    import { cleanPayload } from '~/utils/payload-cleaner'
    import { transformProductFromBackend } from '~/utils/product-transformer'
    import { useStaticData } from '~/composables/useStaticData'
    import { useProductStaticData } from '~/composables/useProductStaticData'
    import { useProductImport } from '~/composables/useProductImport'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { useProductFormValidation } from '~/composables/useProductFormValidation'
    import type { Step } from '~/types/ui/step'
    import StepChooseMethod from '~/components/features/supplier/sku/StepChooseMethod.vue'
    import StepBasicInfo from '~/components/features/supplier/sku/StepBasicInfo.vue'
    import StepDescriptions from '~/components/features/supplier/sku/StepDescriptions.vue'
    import StepAiAssistent from '~/components/features/supplier/sku/StepAiAssistent.vue'
    import StepPricing from '~/components/features/supplier/sku/StepPricing.vue'
    import StepLogistics from '~/components/features/supplier/sku/StepLogistics.vue'
    import StepDelivery from '~/components/features/supplier/sku/StepDelivery.vue'
    import StepFeatures from '~/components/features/supplier/sku/StepFeatures.vue'
    import StepImages from '~/components/features/supplier/sku/StepImages.vue'
    import StepImport from '~/components/features/supplier/sku/StepImport.vue'

    definePageMeta({
        middleware: ['supplier', 'price-config-required'],
        layout: 'app',
        ssr: false,
    })

    const { t } = useI18n()
    const localPath = useLocalePath()
    const route = useRoute()
    const router = useRouter()
    const toast = useToastNotification()

    const { importProducts, isUploading, resetImport, isDownloadingTemplate } = useProductImport()
    const { showConfirmation } = useConfirmation()
    const userStore = useUserStore()
    const { user, doExport } = storeToRefs(userStore)

    const isMounted = ref(false)
    const currentStepRef = ref(null)
    const productStore = useProductStore()
    const isStepValid = ref(true)
    const isInitialized = ref(false)

    const staticData = useStaticData()
    const productStaticData = useProductStaticData()

    const isEditMode = computed(() => !!route.query.product && route.query.product !== 'new')
    const isImportMode = computed(() => currentStep.value === 'import')

    const shouldShowStepper = computed(() => {
        if (isImportMode.value) return false
        if (currentStep.value === 'method') return false
        return true
    })

    const shouldShowControlPanel = computed(() => {
        if (currentStep.value === 'method') return false
        return true
    })

    const stepData = ref<Record<string, any>>({
        method: { type: null },
        'basic-info': {},
        descriptions: {},
        'ai-assistant': {},
        pricing: {},
        logistics: {},
        delivery: {},
        features: {},
        images: {},
        import: {},
    })

    let validateStep: any = null
    let getStepErrors: any = null
    let clearStepErrors: any = null
    let clearFieldError: any = null

    const componentMap: Record<string, any> = {
        method: StepChooseMethod,
        'basic-info': StepBasicInfo,
        descriptions: StepDescriptions,
        'ai-assistant': StepAiAssistent,
        pricing: StepPricing,
        logistics: StepLogistics,
        delivery: StepDelivery,
        features: StepFeatures,
        images: StepImages,
        import: StepImport,
    }

    const steps = computed(() => [
        { key: 'method', name: t('chooseMethod'), component: StepChooseMethod },
        { key: 'basic-info', name: t('basicInformation'), component: StepBasicInfo },
        { key: 'descriptions', name: t('descriptionsDetails'), component: StepDescriptions },
        { key: 'ai-assistant', name: t('aiAssistant'), component: StepAiAssistent },
        { key: 'pricing', name: t('product.pricing'), component: StepPricing },
        { key: 'logistics', name: t('product.logistics'), component: StepLogistics },
        { key: 'delivery', name: t('deliveryAvailability'), component: StepDelivery },
        { key: 'features', name: t('featuresDiscounts'), component: StepFeatures },
        { key: 'images', name: t('productImages'), component: StepImages },
        { key: 'import', name: t('importProducts'), component: StepImport },
    ])

    const stepperSteps = computed(() => {
        return steps.value
            .filter((step) => step.key !== 'method' && step.key !== 'import')
            .map((step) => ({
                label: step.name,
                value: step.key,
            }))
    })

    const stepperStepsWithCompletion = computed<Step[]>(() => {
        const currentStepNum = productStore.stepProgress?.current_step || 1
        const isComplete = productStore.stepProgress?.is_complete || false

        return stepperSteps.value.map((step, index) => {
            const stepNumber = index + 1
            const routePath = getStepRoute(step.value as string)

            return {
                value: step.value,
                label: step.label,
                to: routePath,
                completed: isComplete ? true : stepNumber < currentStepNum,
                disabled: !isComplete && stepNumber > currentStepNum,
            }
        })
    })

    const nonMethodSteps = computed(() =>
        steps.value.filter((step) => step.key !== 'method' && step.key !== 'import')
    )

    const totalSteps = computed(() => nonMethodSteps.value.length)

    const currentStep = computed(() => {
        const step = route.query.step as string
        const foundStep = steps.value.find((s) => s.key === step)

        if (isEditMode.value && !step) {
            return 'basic-info'
        }

        return foundStep?.key || (isEditMode.value ? 'basic-info' : 'method')
    })

    const currentStepComponent = computed(() => {
        return (
            componentMap[currentStep.value] || (isEditMode.value ? StepBasicInfo : StepChooseMethod)
        )
    })

    const currentStepIndex = computed(() => {
        if (currentStep.value === 'method' || currentStep.value === 'import') return 0
        return nonMethodSteps.value.findIndex((s) => s.key === currentStep.value)
    })

    const currentStepErrors = computed(() => {
        if (!productStore) return {}

        const validationErrors = getStepErrors ? getStepErrors(currentStep.value) : {}
        const backendErrors = productStore.fieldErrors || {}

        return {
            ...validationErrors,
            ...backendErrors,
        }
    })

    const canGoBack = computed(() => {
        if (currentStep.value === 'method' || currentStep.value === 'import') return false
        return currentStepIndex.value > 0
    })

    const canGoForward = computed(() => {
        return currentStepIndex.value < nonMethodSteps.value.length - 1
    })

    const isLastStep = computed(() => {
        return currentStepIndex.value === nonMethodSteps.value.length - 1
    })

    const isLoading = computed(() => {
        if (currentStep.value === 'import' && (isUploading.value || isDownloadingTemplate.value)) {
            return true
        }

        return (
            productStore.isCreatingProduct ||
            (productStore.productId &&
                productStore.isStepSaving?.(productStore.productId, currentStepIndex.value + 1))
        )
    })

    const breadcrumbs = computed(() => [
        { label: t('home'), to: localPath('/supplier/dashboard') },
        { label: t('products', 1), to: localPath('/supplier/products/all') },
        {
            label: isEditMode.value
                ? t('editTemplate', { template: t('sku', 0).toUpperCase() })
                : t('addATemplate', { template: t('sku', 0).toUpperCase() }),
        },
    ])

    const getStepRoute = (stepKey: string): string => {
        const productId = productStore.productId || route.query.product
        return `/supplier/products/new?step=${stepKey}${productId ? `new&product=${productId}` : ''}`
    }

    const handleStepperClick = async (step: Step, index: number) => {
        if (step.disabled) return

        const targetStepKey = step.value as string
        await router.push({
            query: {
                step: targetStepKey,
                product: productStore.productId || route.query.product,
            },
        })
    }

    const handleClearError = (fieldName: string) => {
        if (!clearFieldError || !productStore) return
        clearFieldError(currentStep.value, fieldName)
        productStore.clearFieldError(fieldName)
    }

    const handleStepUpdate = (data: any) => {
        if (!data) return

        if (data instanceof FormData) {
            stepData.value[currentStep.value] = data
            return
        }

        if (currentStep.value === 'import' && data.file instanceof File) {
            stepData.value[currentStep.value] = {
                file: data.file,
            }
            return
        }

        if (typeof data === 'object') {
            stepData.value[currentStep.value] = {
                ...stepData.value[currentStep.value],
                ...toRaw(data),
            }
        }
    }

    const handleNext = async () => {
        if (!validateStep || !clearStepErrors) {
            console.error('Missing required dependencies')
            return
        }

        clearStepErrors(currentStep.value)
        productStore.clearAllErrors()

        if (currentStep.value === 'method') {
            if (!stepData.value.method?.type) {
                console.warn('No method selected')
                return
            }
            return
        }

        if (currentStep.value === 'import') {
            const importData = stepData.value.import

            if (!importData?.file || !(importData.file instanceof File)) {
                toast.error(t('product.import.noFileSelected'))
                productStore.generalError = t('product.import.noFileSelected')
                window.scrollTo({ top: 0, behavior: 'smooth' })
                return
            }

            try {
                const success = await importProducts(importData.file)

                if (success) {
                    await nextTick()
                    productStore.resetFlow()
                    await router.push(localPath('/supplier/products/all'))
                }
            } catch (error: any) {
                console.error('Import failed:', error)
                productStore.generalError = error.message || t('product.import.error')
            } finally {
                window.scrollTo({ top: 0, behavior: 'smooth' })
            }

            return
        }

        const isValid = validateStep(currentStep.value, () => {
            if (currentStepRef.value?.validate) {
                return currentStepRef.value.validate()
            }
            return { isValid: false, errors: [] }
        })

        if (!isValid) {
            console.warn('Validation failed for step:', currentStep.value)
            window.scrollTo({ top: 0, behavior: 'smooth' })
            return
        }

        try {
            if (
                currentStep.value === 'basic-info' &&
                !productStore.productId &&
                !isEditMode.value
            ) {
                await handleCreateProduct(stepData.value[currentStep.value])
                return
            }

            if (productStore.productId && currentStepIndex.value >= 0) {
                const rawData = stepData.value[currentStep.value]
                const dataToSend = prepareStepData(currentStep.value, rawData)

                await productStore.updateProductStep(
                    productStore.productId,
                    currentStepIndex.value + 1,
                    dataToSend
                )

                await nextTick()
                await navigateToNextStep()
            }
        } catch (error: any) {
            if (error.statusCode === 422) {
            }

            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const hasRequiredCurrencies = computed(() => {
        const hasLocalCurrency = !!user.value?.default_local_currency?.id

        if (doExport.value) {
            const hasExportCurrency = !!user.value?.default_export_currency?.id
            return hasLocalCurrency && hasExportCurrency
        }

        return hasLocalCurrency
    })

    const showCurrencySelectionModal = async (): Promise<boolean> => {
        const details = []

        if (!user.value?.default_local_currency?.id) {
            details.push({
                label: t('settings.currencies.localCurrency'),
                value: t('settings.currencies.notSet'),
            })
        }

        if (doExport.value && !user.value?.default_export_currency?.id) {
            details.push({
                label: t('settings.currencies.exportCurrency'),
                value: t('settings.currencies.notSet'),
            })
        }

        return await showConfirmation({
            title: t('product.currencies.required.title'),
            message: t('product.currencies.required.message'),
            details,
            warningText: t('product.currencies.required.warning'),
            confirmText: t('product.currencies.required.goToSettings'),
            cancelText: t('cancel'),
            confirmColor: 'blue',
            iconType: 'info',
        })
    }

    const handleMethodSelected = async (method: string) => {
        if (!hasRequiredCurrencies.value) {
            const shouldGoToSettings = await showCurrencySelectionModal()

            if (shouldGoToSettings) {
                await router.push(localPath('/settings?tab=currencies'))
                return
            } else {
                return
            }
        }

        stepData.value.method = { type: method }

        if (method === 'manual') {
            await router.push({ query: { step: 'basic-info' } })
        } else if (method === 'excel') {
            await router.push({ query: { step: 'import' } })
        }
    }

    const handlePrevious = async () => {
        if (!canGoBack.value || !clearStepErrors) return

        clearStepErrors(currentStep.value)

        const prevIndex = currentStepIndex.value - 1

        if (prevIndex >= 0) {
            const prevStep = nonMethodSteps.value[prevIndex]
            await router.push({
                query: {
                    step: prevStep.key,
                    product: productStore.productId || route.query.product,
                },
            })
        } else {
            await router.push({
                query: {
                    step: isEditMode.value ? 'basic-info' : 'method',
                    product: productStore.productId || route.query.product,
                },
            })
        }
    }

    const navigateToNextStep = async () => {
        const nextIndex = currentStepIndex.value + 1

        if (nextIndex < nonMethodSteps.value.length) {
            const nextStep = nonMethodSteps.value[nextIndex]

            await router.push({
                query: {
                    step: nextStep.key,
                    product: productStore.productId || route.query.product,
                },
            })
        }
    }

    const prepareStepData = (step: string, data: any) => {
        if (step === 'images') {
            if (data instanceof FormData) {
                return data
            } else {
                console.error('Images: Expected FormData but got:', typeof data)
                return data
            }
        }

        if (step === 'pricing' && data.prices) {
            const payload = {
                prices: data.prices.map((price: any) => ({
                    currency_id: price.currencyId || price.currency_id,
                    price:
                        typeof price.price === 'number'
                            ? price.price
                            : parseFloat(price.price) || 0,
                    price_type: price.priceType || price.price_type,
                })),
            }

            if (data.volumePrices && Array.isArray(data.volumePrices)) {
                payload.volume_prices = data.volumePrices.map((vp: any) => ({
                    currency_id: vp.currencyId || vp.currency_id,
                    quantity_from: vp.quantityFrom || vp.quantity_from,
                    price: typeof vp.price === 'number' ? vp.price : parseFloat(vp.price) || 0,
                    price_type: vp.priceType || vp.price_type,
                }))
            }

            return cleanPayload(camelToSnake(payload))
        }

        if (step === 'features') {
            const payload: any = {}

            if (data.featureIds && Array.isArray(data.featureIds) && data.featureIds.length > 0) {
                payload.feature_ids = data.featureIds
            }

            if (
                data.additionalFeatureIds &&
                Array.isArray(data.additionalFeatureIds) &&
                data.additionalFeatureIds.length > 0
            ) {
                payload.additional_feature_ids = data.additionalFeatureIds
            }

            if (data.discounts && Array.isArray(data.discounts) && data.discounts.length > 0) {
                payload.discounts = data.discounts.map((discount: any) => ({
                    price_type: discount.priceType || discount.price_type,
                    percentage: discount.percentage,
                    start_date: discount.startDate || discount.start_date,
                    end_date: discount.endDate || discount.end_date,
                }))
            }

            return payload
        }

        const converted = camelToSnake(data)
        const cleaned = cleanPayload(converted)

        return cleaned
    }

    const handleCreateProduct = async (productData: any) => {
        if (!productStore) return

        try {
            const result = await productStore.createProduct(camelToSnake(productData))
            if (result?.product?.id) {
                await router.push({
                    query: { step: 'descriptions', product: result.product.id },
                })
            }
        } catch (error) {
            console.error('Failed to create product:', error)
        }
    }

    const handleComplete = async () => {
        if (!productStore || !validateStep || !clearStepErrors) return

        if (currentStep.value === 'import') {
            await handleNext()
            return
        }

        clearStepErrors(currentStep.value)

        const isValid = validateStep(currentStep.value, () => {
            if (currentStepRef.value?.validate) {
                return currentStepRef.value.validate()
            }
            return { isValid: false, errors: [] }
        })

        if (!isValid) {
            window.scrollTo({ top: 0, behavior: 'smooth' })
            return
        }

        try {
            if (productStore.productId) {
                const dataToSend = prepareStepData(
                    currentStep.value,
                    stepData.value[currentStep.value]
                )

                await productStore.updateProductStep(
                    productStore.productId,
                    currentStepIndex.value + 1,
                    dataToSend
                )

                productStore.resetFlow()
                await router.push(localPath('/supplier/products/all'))
            }
        } catch (error) {
            console.error('Failed to complete product:', error)
        }
    }

    const handleClose = async () => {
        const hasUnsavedData = Object.values(stepData.value).some(
            (data) => typeof data === 'object' && Object.keys(data).length > 0
        )

        if (hasUnsavedData && !isEditMode.value) {
            const confirmed = confirm(t('confirmLeaveWithoutSaving'))
            if (!confirmed) return
        }

        productStore.resetFlow()
        await router.push(localPath('/supplier/products/all'))
    }

    const getStaticDataContext = () => {
        return {
            countries: staticData.countryOptions.value,
            categories: productStaticData.categories.value,
            quantityTypes: productStaticData.quantityTypeOptions.value,
            languageOptions: staticData.languageOptions.value,
            materials: productStaticData.materialOptions.value,
            storageConditions: productStaticData.storageConditionOptions.value,
            incoterms: productStaticData.incotermOptions.value,
            features: productStaticData.additionalFeatureOptions.value,
            additionalFeatures: productStaticData.additionalFeatureOptions.value,
            allergens: productStaticData.allergenOptions.value,
            productTypes: productStaticData.productTypeOptions.value,
            businessTypes: staticData.businessTypeOptions.value,
        }
    }

    const initProductData = async () => {
        const productIdQuery = route.query.product

        if (!productIdQuery || productIdQuery === 'new') {
            productStore.resetFlow()
            stepData.value = {
                method: { type: null },
                'basic-info': {},
                descriptions: {},
                'ai-assistant': {},
                pricing: {},
                logistics: {},
                delivery: {},
                features: {},
                images: {},
                import: {},
            }
            isInitialized.value = true
            return
        }

        try {
            await productStore.fetchProductStatus(Number(productIdQuery))

            if (productStore.currentProduct) {
                const staticDataContext = getStaticDataContext()
                const transformedData = transformProductFromBackend(
                    productStore.currentProduct,
                    staticDataContext
                )

                Object.keys(transformedData).forEach((step) => {
                    stepData.value[step] = transformedData[step]
                })
            }
            await nextTick()
            isInitialized.value = true
        } catch (error) {
            console.error('Failed to initialize product data:', error)
            productStore.resetFlow()
            isInitialized.value = true
        }
    }

    onMounted(async () => {
        isMounted.value = true

        const validation = useProductFormValidation()
        validateStep = validation.validateStep
        getStepErrors = validation.getStepErrors
        clearStepErrors = validation.clearStepErrors
        clearFieldError = validation.clearFieldError

        await Promise.all([staticData.initialize(), productStaticData.initialize()])

        await initProductData()

        if (!route.query.step) {
            await router.replace({
                query: {
                    step: isEditMode.value ? 'basic-info' : 'method',
                    product: route?.query?.product,
                },
            })
        }
    })

    onUnmounted(() => {
        if (productStore) {
            productStore.resetFlow()
        }
        resetImport()
    })

    watch(
        () => route.query.product,
        async (newProductId, oldProductId) => {
            if (newProductId !== oldProductId) {
                isInitialized.value = false
                productStore.resetFlow()
                await initProductData()
            }
        }
    )
</script>
