<template>
    <div class="space-y-3">
        <div
            v-if="isAnyOperationInProgress"
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
            <div class="bg-white rounded-lg p-6 flex flex-col items-center gap-4 max-w-sm mx-4">
                <div
                    class="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"
                ></div>
                <div class="text-center">
                    <p class="text-subtitle2 font-semibold text-gray-900">
                        {{ loadingPreview ? t('orders.creatingPreview') : t('orders.processing') }}
                    </p>
                    <p class="text-subtitle3 text-gray-600 mt-1">
                        {{ t('orders.pleaseWait') }}
                    </p>
                </div>
            </div>
        </div>

        <div v-if="loadingDocument" class="space-y-4">
            <OrdersOrderFormSkeleton />
        </div>

        <form v-else @submit.prevent="handleSubmit">
            <div class="space-y-3">
                <div class="bg-white rounded-sm p-6 space-y-4">
                    <div class="flex items-center gap-2 py-4">
                        <div class="flex flex-1 items-center">
                            <h3 class="text-title3 font-bold text-gray-950 flex-1">
                                {{ t('orders.sections.buyerData.title') }}
                            </h3>

                            <Select
                                v-model="formData.type"
                                :options="documentTypeOptions"
                                :label="t('orders.sections.buyerData.documentType')"
                                select-label="label"
                                :reduce="(option: any) => option.value"
                                :searchable="false"
                                size="lg"
                                class="flex-1"
                                :error-message="getFieldError('type')"
                                :disabled="isAnyOperationInProgress || isEditMode"
                                required
                                @update:model-value="handleDocumentTypeChange"
                            />
                        </div>

                        <div class="flex items-start gap-2 flex-1">
                            <Button
                                :label="t('orders.reset')"
                                size="lg"
                                color="blue"
                                variant="outline"
                                :disabled="isAnyOperationInProgress"
                                @click="handleReset"
                            />
                        </div>
                    </div>

                    <div class="flex flex-col gap-3">
                        <div class="flex gap-2">
                            <Select
                                v-model="formData.buyerId"
                                :options="connectedClientOptions"
                                :label="t('orders.sections.buyerData.buyerCompany')"
                                select-label="label"
                                :reduce="(option: any) => option.value"
                                size="lg"
                                :error-message="getFieldError('buyerId')"
                                :disabled="isAnyOperationInProgress || loadingClients"
                                class="flex-1"
                                required
                                @update:model-value="handleBuyerChange"
                            />
                            <div class="hidden md:flex flex-1"></div>
                        </div>

                        <div class="flex gap-2">
                            <div class="flex flex-1">
                                <Input
                                    v-model="invoiceNumber"
                                    :label="t('orders.sections.buyerData.invoiceNumber')"
                                    type="text"
                                    size="lg"
                                    copy
                                    :disabled="!customInvoice || isAnyOperationInProgress"
                                    required
                                    @update:model-value="handleInvoiceNumberInput"
                                    @copy="
                                        () =>
                                            toast.success(
                                                t('notifications.copyNotificationMessage')
                                            )
                                    "
                                />
                                <div class="hidden md:flex flex-1"></div>
                            </div>

                            <div class="flex flex-1">
                                <Checkbox
                                    v-model="customInvoice"
                                    :label="t('orders.sections.buyerData.customInvoiceNumber')"
                                    :disabled="isAnyOperationInProgress"
                                    @update:model-value="toggleCustomInvoice"
                                />
                            </div>
                        </div>
                    </div>

                    <div class="flex gap-2">
                        <div class="flex gap-2 flex-1">
                            <DatePicker
                                v-model="formData.date"
                                :label="t('orders.sections.buyerData.date')"
                                size="lg"
                                :disabled="isAnyOperationInProgress"
                                :error-message="getFieldError('date')"
                                class="flex-1"
                                required
                                @date-selected="handleDateChange"
                            />

                            <Select
                                v-model="formData.currencyId"
                                :options="userCurrencyOptions"
                                :label="t('orders.sections.buyerData.currency')"
                                select-label="label"
                                :reduce="(option: any) => option.value"
                                size="lg"
                                :error-message="getFieldError('currencyId')"
                                class="flex-1"
                                :disabled="
                                    isAnyOperationInProgress || userCurrencyOptions.length === 0
                                "
                                required
                                @update:model-value="handleCurrencyChange"
                            />
                        </div>
                        <div class="hidden md:flex flex-1"></div>
                    </div>

                    <div
                        v-if="userCurrencyOptions.length === 0"
                        class="p-4 bg-yellow-50 border border-yellow-200 rounded-sm flex items-start gap-2"
                    >
                        <svg class="h-12 w-12 text-gray-950">
                            <use xlink:href="/sprite.svg#alert"></use>
                        </svg>
                        <div class="flex flex-col flex-1 gap-2">
                            <p class="text-subtitle1 font-semibold text-yellow-900">
                                {{ t('orders.noCurrenciesConfigured') }}
                            </p>
                            <p class="text-body text-yellow-800">
                                {{ t('orders.noCurrenciesConfiguredDescription') }}
                            </p>
                            <NuxtLink :to="localePath('/settings?tab=currencies')">
                                <Button :label="t('orders.currencySettings')"></Button>
                            </NuxtLink>
                        </div>
                    </div>

                    <div
                        v-else-if="formData.currencyId && !isUserDefaultCurrency"
                        class="p-4 bg-blue-50 border border-blue-200 rounded-sm flex items-start gap-2"
                    >
                        <svg class="h-5 w-5 text-blue-600 flex-shrink-0">
                            <use xlink:href="/sprite.svg#info"></use>
                        </svg>
                        <p class="text-subtitle3 text-blue-900">
                            {{ t('orders.currencyNotInDefaults') }}
                        </p>
                    </div>

                    <h3 class="text-subtitle2 font-semibold text-gray-950">
                        {{ t('orders.sections.deliveryLocation.title') }}
                    </h3>

                    <div class="space-y-4">
                        <div v-if="deliveryLocationOptions.length > 0" class="space-y-3">
                            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                                <label
                                    v-for="(option, index) in deliveryLocationOptions"
                                    :key="option.value"
                                    class="relative cursor-pointer group h-full"
                                    :class="{
                                        'pointer-events-none opacity-50': isAnyOperationInProgress,
                                    }"
                                >
                                    <div
                                        class="h-full border rounded-md p-4 transition-all duration-200 hover:border-gray-600"
                                        :class="[
                                            selectedDeliveryLocationId === option.value
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-400 bg-white',
                                        ]"
                                    >
                                        <div class="flex items-start gap-3">
                                            <Radiobox
                                                :model-value="selectedDeliveryLocationId"
                                                :value="option.value"
                                                :name="`delivery-location`"
                                                :disabled="isAnyOperationInProgress"
                                                @update:model-value="
                                                    handleDeliveryLocationRadioSelect
                                                "
                                            />

                                            <div class="flex-1 min-w-0">
                                                <h4
                                                    class="text-subtitle2 font-bold mb-2 transition-colors duration-200"
                                                    :class="[
                                                        selectedDeliveryLocationId === option.value
                                                            ? 'text-blue-600'
                                                            : 'text-gray-950',
                                                    ]"
                                                >
                                                    {{
                                                        index === 0
                                                            ? t(
                                                                  'orders.sections.deliveryLocation.defaultAddress'
                                                              )
                                                            : t(
                                                                  'orders.sections.deliveryLocation.addressNumber',
                                                                  { n: index + 1 }
                                                              )
                                                    }}
                                                </h4>

                                                <div class="space-y-1 text-subtitle3 text-gray-950">
                                                    <p>{{ option.location.contactName }}</p>
                                                    <p>
                                                        {{ option.location.streetNumber }}
                                                        {{ option.location.streetName }}
                                                    </p>
                                                    <p>
                                                        {{ option.location.cityName }},
                                                        {{ option.location.postalCode }}
                                                    </p>
                                                    <p>{{
                                                        getCountryName(option.location.country.id)
                                                    }}</p>
                                                    <p v-if="option.location.phoneNumber">
                                                        {{ option.location.phoneNumber }}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </label>
                            </div>

                            <div class="pt-3">
                                <Checkbox
                                    v-model="formData.hasCustomDelivery"
                                    :label="t('orders.sections.deliveryLocation.useCustomAddress')"
                                    :disabled="isAnyOperationInProgress"
                                    @update:model-value="toggleCustomDelivery"
                                />
                            </div>
                        </div>

                        <div v-else>
                            <Checkbox
                                v-model="formData.hasCustomDelivery"
                                :label="t('orders.sections.deliveryLocation.customBuyerLocation')"
                                :disabled="isAnyOperationInProgress || !formData.buyerId"
                                @update:model-value="toggleCustomDelivery"
                            />
                        </div>

                        <Transition name="fade">
                            <div
                                v-if="formData.hasCustomDelivery && formData.deliveryDetail"
                                class="space-y-4 pt-4"
                            >
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        v-model="formData.deliveryDetail.contactName"
                                        :label="t('company.contactPerson')"
                                        type="text"
                                        size="lg"
                                        :error-message="getFieldError('deliveryDetail.contactName')"
                                        :disabled="isAnyOperationInProgress"
                                        required
                                        @input="handleDeliveryFieldChange"
                                    />
                                    <PhoneInput
                                        v-model="formData.deliveryDetail.phoneNumber"
                                        :label="t('phone')"
                                        size="lg"
                                        :country-code="getPhoneCountryCode()"
                                        :error="getFieldError('deliveryDetail.phoneNumber')"
                                        :disabled="isAnyOperationInProgress"
                                        @input="handleDeliveryFieldChange"
                                        @update:is-valid="handlePhoneValidation"
                                        @update:selected-country="handlePhoneCountryChange"
                                    />
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Select
                                        v-model="formData.deliveryDetail.countryId"
                                        :options="countryOptions"
                                        :label="t('country')"
                                        select-label="label"
                                        :reduce="(option: any) => option.value"
                                        size="lg"
                                        :error-message="getFieldError('deliveryDetail.countryId')"
                                        :disabled="isAnyOperationInProgress"
                                        required
                                        @update:model-value="handleDeliveryFieldChange"
                                    />
                                    <Input
                                        v-model="formData.deliveryDetail.stateName"
                                        :label="t('state')"
                                        type="text"
                                        size="lg"
                                        :error-message="getFieldError('deliveryDetail.stateName')"
                                        :disabled="isAnyOperationInProgress"
                                        @input="handleDeliveryFieldChange"
                                    />
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        v-model="formData.deliveryDetail.cityName"
                                        :label="t('city')"
                                        type="text"
                                        size="lg"
                                        :error-message="getFieldError('deliveryDetail.cityName')"
                                        :disabled="isAnyOperationInProgress"
                                        required
                                        @input="handleDeliveryFieldChange"
                                    />
                                    <Input
                                        v-model="formData.deliveryDetail.streetName"
                                        :label="t('street')"
                                        type="text"
                                        size="lg"
                                        :error-message="getFieldError('deliveryDetail.streetName')"
                                        :disabled="isAnyOperationInProgress"
                                        required
                                        @input="handleDeliveryFieldChange"
                                    />
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        v-model="formData.deliveryDetail.streetNumber"
                                        :label="t('number')"
                                        type="text"
                                        size="lg"
                                        :error-message="
                                            getFieldError('deliveryDetail.streetNumber')
                                        "
                                        :disabled="isAnyOperationInProgress"
                                        @input="handleDeliveryFieldChange"
                                    />
                                    <Input
                                        v-model="formData.deliveryDetail.postalCode"
                                        :label="t('company.postalCode')"
                                        type="text"
                                        size="lg"
                                        :error-message="getFieldError('deliveryDetail.postalCode')"
                                        :disabled="isAnyOperationInProgress"
                                        @input="handleDeliveryFieldChange"
                                    />
                                </div>
                            </div>
                        </Transition>
                    </div>

                    <h3 class="text-subtitle2 font-semibold text-gray-950 mb-4">
                        {{ t('orders.sections.headArea.title') }}
                    </h3>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            v-model="formData.title"
                            :label="t('orders.sections.headArea.documentTitle')"
                            type="text"
                            size="lg"
                            :error-message="getFieldError('title')"
                            :disabled="isAnyOperationInProgress"
                            @input="handleHeadFieldChange"
                        />
                        <Input
                            v-model="formData.subtitle"
                            :label="t('orders.sections.headArea.documentSubtitle')"
                            type="text"
                            size="lg"
                            :error-message="getFieldError('subtitle')"
                            :disabled="isAnyOperationInProgress"
                            @input="handleHeadFieldChange"
                        />
                    </div>

                    <div>
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-subtitle2 font-semibold text-gray-950">
                                {{ t('orders.sections.documentPositions.title') }}
                            </h3>
                            <Button
                                :label="t('orders.sections.documentPositions.addProduct')"
                                size="md"
                                color="blue"
                                variant="filled"
                                :disabled="isAnyOperationInProgress || !canAddProducts"
                                @click="handleAddProduct"
                            />
                        </div>

                        <div
                            v-if="showStockAlert"
                            class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded flex items-start gap-2"
                        >
                            <svg
                                class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <p class="text-subtitle3 text-blue-900">
                                {{ t('orders.sections.documentPositions.stockAlert') }}
                            </p>
                            <button
                                type="button"
                                class="ml-auto text-blue-600 hover:text-blue-800"
                                @click="showStockAlert = false"
                            >
                                <svg
                                    class="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        <Table
                            :key="`table-${formData.items.length}-${formData.currencyId}`"
                            :columns="tableColumns"
                            :rows="tableRows"
                            :editable-columns="[
                                'quantity',
                                'unitPrice',
                                'discountPercent',
                                'vatPercent',
                            ]"
                            :show-column-borders="true"
                            :fixed-layout="true"
                            :loading="isLoadingProducts || isAnyOperationInProgress"
                            :actions="['delete']"
                            @cell-edit="handleCellEdit"
                            @delete="handleDelete"
                            @edit-product="handleEditProduct"
                        >
                            <template #empty>
                                <div class="flex flex-col items-center justify-center py-12">
                                    <svg
                                        class="w-16 h-16 text-gray-600 mb-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                        />
                                    </svg>
                                    <p class="text-subtitle2 font-semibold text-gray-700">
                                        {{ t('orders.sections.documentPositions.noProducts') }}
                                    </p>
                                    <p class="text-subtitle3 text-gray-600 mt-2">
                                        {{ t('orders.sections.documentPositions.clickToAdd') }}
                                    </p>
                                </div>
                            </template>
                        </Table>
                        <div v-if="tableError" class="mt-3">
                            <div class="space-y-1">
                                <div
                                    v-for="(error, index) in tableError.split('\n')"
                                    :key="index"
                                    class="flex items-start gap-1 text-body mx-1"
                                >
                                    <svg class="w-3 h-3 flex-shrink-0 text-red-500 mt-0.5">
                                        <use xlink:href="/sprite.svg#warn-error"></use>
                                    </svg>
                                    <span class="text-red-500 break-words">
                                        {{ error }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="p-4">
                            <div class="flex justify-end">
                                <div class="w-full max-w-md space-y-2">
                                    <div class="flex justify-between text-subtitle3">
                                        <span class="text-gray-700">
                                            {{ t('orders.sections.documentPositions.subtotal') }}
                                        </span>
                                        <span class="font-semibold text-gray-950">
                                            {{ formatCurrency(totals.subtotal, currencySymbol) }}
                                        </span>
                                    </div>
                                    <div class="flex justify-between text-subtitle3">
                                        <span class="text-gray-700">
                                            {{ t('orders.sections.documentPositions.totalVat') }}
                                        </span>
                                        <span class="font-semibold text-gray-950">
                                            {{ formatCurrency(totals.totalVat, currencySymbol) }}
                                        </span>
                                    </div>
                                    <div class="flex justify-between text-subtitle3">
                                        <span class="text-gray-700">
                                            {{
                                                t('orders.sections.documentPositions.totalDiscount')
                                            }}
                                        </span>
                                        <span class="font-semibold text-gray-950">
                                            {{
                                                formatCurrency(totals.totalDiscount, currencySymbol)
                                            }}
                                        </span>
                                    </div>

                                    <div
                                        class="flex justify-between text-title3 pt-2 border-t border-gray-400"
                                    >
                                        <span class="text-gray-950 font-bold">
                                            {{ t('orders.sections.documentPositions.total') }}
                                        </span>
                                        <span class="font-bold text-gray-950">
                                            {{ formatCurrency(totals.total, currencySymbol) }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <h3 class="text-subtitle2 font-semibold text-gray-950 mb-4">
                        {{ t('orders.sections.footArea.title') }}
                    </h3>

                    <div class="flex gap-2">
                        <Textarea
                            v-model="formData.documentNotes"
                            :label="t('orders.sections.footArea.legendText')"
                            :rows="4"
                            size="lg"
                            class="flex-1"
                            :error-message="getFieldError('documentNotes')"
                            :disabled="isAnyOperationInProgress"
                            @input="handleFootFieldChange"
                        />
                        <div class="hidden md:flex flex-1"></div>
                    </div>

                    <div class="flex gap-2">
                        <Textarea
                            v-model="formData.documentCommentary"
                            :label="t('orders.sections.footArea.commentary')"
                            :rows="4"
                            class="flex-1"
                            size="lg"
                            :error-message="getFieldError('documentCommentary')"
                            :disabled="isAnyOperationInProgress"
                            @input="handleFootFieldChange"
                        />
                        <div class="hidden md:flex flex-1"></div>
                    </div>

                    <h3 class="text-subtitle2 font-semibold text-gray-950 mb-4">
                        {{ t('orders.sections.actions.title') }}
                    </h3>

                    <div class="flex gap-2">
                        <Button
                            size="md"
                            color="blue"
                            variant="filled"
                            class="flex-1"
                            :disabled="isAnyOperationInProgress || !canPreview"
                            @click="handlePreview"
                        >
                            <template #default>
                                <div class="flex items-center gap-2">
                                    <div
                                        v-if="loadingPreview"
                                        class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                                    ></div>
                                    <svg v-else class="h-4 w-4">
                                        <use xlink:href="/sprite.svg#eye"></use>
                                    </svg>
                                    <span>
                                        {{
                                            loadingPreview
                                                ? t('orders.creating')
                                                : t('orders.preview')
                                        }}
                                    </span>
                                </div>
                            </template>
                        </Button>

                        <Button
                            size="md"
                            color="blue"
                            variant="filled"
                            class="flex-1"
                            :disabled="isAnyOperationInProgress || !canPrint"
                            @click="handlePrint"
                        >
                            <template #default>
                                <div class="flex items-center gap-2">
                                    <svg class="h-4 w-4">
                                        <use xlink:href="/sprite.svg#printer"></use>
                                    </svg>
                                    <span>{{ t('orders.print') }}</span>
                                </div>
                            </template>
                        </Button>
                    </div>

                    <div class="flex items-start justify-center pt-6 gap-3">
                        <Button
                            size="lg"
                            color="gray"
                            variant="filled"
                            :label="t('cancel')"
                            :disabled="isAnyOperationInProgress"
                            @click="handleCancel"
                        />
                        <Button
                            size="lg"
                            color="red"
                            variant="filled"
                            :label="t('saveAndNotfiy')"
                            :disabled="isAnyOperationInProgress"
                            @click="handleSubmit"
                        />
                    </div>
                </div>
            </div>
        </form>

        <OrdersProductSearchModal
            v-model:is-open="showProductModal"
            @product-selected="handleProductSelected"
            @error="handleProductModalError"
        />
    </div>
</template>

<script setup lang="ts">
    import type { DocumentType, Document } from '~/types/documents'
    import type { TableColumn } from '~/types/ui/table'
    import { useOrderForm } from '~/composables/useOrderForm'
    import { useOrderFormValidation } from '~/composables/useOrderFormValidation'
    import { useDocumentTypes } from '~/composables/useDocumentTypes'
    import { useStaticData } from '~/composables/useStaticData'
    import { useUserStore } from '~/stores/user'
    import { useDocumentsStore } from '~/stores/documents'
    import { storeToRefs } from 'pinia'
    import type { OrderFormItemData } from '~/types/order-form'
    import { useLocalePath } from '#imports'
    import { useFormatters } from '~/composables/useFormatters'

    interface Props {
        mode: 'create' | 'edit'
        initialType?: DocumentType | null
        documentId?: number
    }

    interface ProductPriceData {
        price: number
        localPrice?: number
        exportPrice?: number
        vatLocal?: number
        vatExport?: number
    }

    interface CurrencyOption {
        label: string
        value: number
        type: 'local' | 'export' | 'static'
        code: string
        symbol: string
        isUserDefault?: boolean
    }

    const props = defineProps<Props>()

    const emit = defineEmits<{
        cancel: []
        success: [document?: Document]
        error: [message: string]
        formDirty: [isDirty: boolean]
    }>()

    const { t } = useI18n()
    const toast = useToastNotification()
    const userStore = useUserStore()
    const documentsStore = useDocumentsStore()
    const { user, doExport } = storeToRefs(userStore)
    const localePath = useLocalePath()
    const { formatCurrency } = useFormatters()

    const { currencies, countryOptions } = useStaticData()

    const userCurrencyOptions = computed<CurrencyOption[]>(() => {
        const options: CurrencyOption[] = []

        if (user.value?.default_local_currency) {
            options.push({
                label: `${user.value.default_local_currency.code} (${user.value.default_local_currency.symbol}) - ${t('orders.currencyType.local')}`,
                value: user.value.default_local_currency.id,
                type: 'local',
                code: user.value.default_local_currency.code,
                symbol: user.value.default_local_currency.symbol,
                isUserDefault: true,
            })
        }

        if (user.value?.default_export_currency && doExport.value) {
            options.push({
                label: `${user.value.default_export_currency.code} (${user.value.default_export_currency.symbol}) - ${t('orders.currencyType.export')}`,
                value: user.value.default_export_currency.id,
                type: 'export',
                code: user.value.default_export_currency.code,
                symbol: user.value.default_export_currency.symbol,
                isUserDefault: true,
            })
        }

        const userCurrencyIds = new Set(options.map((opt) => opt.value))

        if (formData.value.currencyId && !userCurrencyIds.has(formData.value.currencyId)) {
            const staticCurrency = currencies.value.find((c) => c.id === formData.value.currencyId)

            if (staticCurrency) {
                options.push({
                    label: `${staticCurrency.code} (${staticCurrency.symbol})`,
                    value: staticCurrency.id,
                    type: 'static',
                    code: staticCurrency.code,
                    symbol: staticCurrency.symbol,
                    isUserDefault: false,
                })
            }
        }

        return options
    })

    const selectedCurrencyType = computed(() => {
        if (!formData.value.currencyId) return null

        const selectedOption = userCurrencyOptions.value.find(
            (opt) => opt.value === formData.value.currencyId
        )

        return selectedOption?.type || null
    })

    const currencySymbol = computed(() => {
        const selectedOption = userCurrencyOptions.value.find(
            (opt) => opt.value === formData.value.currencyId
        )
        return selectedOption?.symbol || '€'
    })

    const isUserDefaultCurrency = computed(() => {
        if (!formData.value.currencyId) return false

        const selectedOption = userCurrencyOptions.value.find(
            (opt) => opt.value === formData.value.currencyId
        )

        return selectedOption?.isUserDefault ?? false
    })

    const getProductPrice = (product: ProductPriceData): number => {
        if (selectedCurrencyType.value === 'local') {
            return Number(product.localPrice) || Number(product.price) || 0
        }

        if (selectedCurrencyType.value === 'export') {
            return Number(product.exportPrice) || Number(product.price) || 0
        }

        return Number(product.price) || 0
    }

    const getProductVat = (product: ProductPriceData): number => {
        if (selectedCurrencyType.value === 'local') {
            return Number(product.vatLocal) || 20
        }

        if (selectedCurrencyType.value === 'export') {
            return Number(product.vatExport) || 0
        }

        return 20
    }

    const {
        formData,
        loading,
        loadingDocument,
        loadingPreview,
        isAnyOperationInProgress,
        isEditMode,
        connectedClientOptions,
        loadingClients,
        deliveryLocationOptions,
        selectedDeliveryLocationId,
        totals,
        toggleCustomDelivery,
        handleDeliveryLocationSelect,
        handleBuyerChange: onBuyerChange,
        initializeConnectedClients,
        submit,
        createPreview,
        reset,
        addItem,
        loadDocumentForEdit,
        removeItem,
    } = useOrderForm(props.mode, props.documentId)

    const { documentTypes } = useDocumentTypes()
    const {
        errors,
        getFieldError,
        validateField,
        validateForm,
        validateItems,
        setBackendErrors,
        clearAllErrors,
    } = useOrderFormValidation(formData)

    const showProductModal = ref(false)
    const showStockAlert = ref(false)
    const tableError = ref<string | null>(null)
    const isLoadingProducts = ref(false)
    const invoiceNumber = ref('')
    const customInvoice = ref(false)
    const currentEditingItemIndex = ref<number | null>(null)
    const lastAddedItemId = ref<string | null>(null)
    const phoneValidation = ref(false)

    const generateDefaultInvoiceNumber = (): string => {
        return `LE-${Date.now()}`
    }

    const initializeInvoiceNumber = () => {
        if (!customInvoice.value) {
            invoiceNumber.value = generateDefaultInvoiceNumber()
        }
    }

    const updateProductPrices = () => {
        if (formData.value.items.length === 0) return

        formData.value.items.forEach((item) => {
            if (!item.productPriceData) return

            const newPrice = getProductPrice(item.productPriceData)
            const newVat = getProductVat(item.productPriceData)

            item.unitPrice = newPrice
            item.vatPercent = newVat
        })

        toast.info(t('orders.pricesUpdated'))
    }

    const documentTypeOptions = computed(() =>
        documentTypes.map((dt) => ({
            label: t(dt.labelKey),
            value: dt.value,
        }))
    )

    const tableColumns = computed<TableColumn[]>(() => [
        {
            key: 'nr',
            label: t('orders.sections.documentPositions.columns.nr'),
            width: '60px',
            sortable: false,
            view: 'TableCellText',
        },
        {
            key: 'product',
            label: t('table.sku'),
            width: '300px',
            sortable: false,
            view: 'TableCellProductSelect',
            cellOptions: {
                editable: false,
            },
        },
        {
            key: 'ean',
            label: t('orders.sections.documentPositions.columns.ean'),
            width: '150px',
            sortable: false,
            view: 'TableCellImage',
            cellOptions: {
                imgClasses: 'w-12 h-12 object-cover rounded mr-2',
                classes: 'text-subtitle3',
            },
        },
        {
            key: 'bbd',
            label: t('orders.sections.documentPositions.columns.mhd'),
            width: '120px',
            sortable: false,
            view: 'TableCellText',
        },
        {
            key: 'quantity',
            label: t('orders.sections.documentPositions.columns.quantity'),
            width: '120px',
            sortable: false,
            view: 'TableCellEditablePrice',
            editable: true,
            cellOptions: {
                currencySymbol: '',
                editable: !isAnyOperationInProgress.value,
                min: 0.01,
                step: 1,
            },
        },
        {
            key: 'unitPrice',
            label: !!selectedCurrencyType.value
                ? t('orders.sections.documentPositions.columns.price') +
                  ` (${currencySymbol.value})`
                : t('orders.sections.documentPositions.columns.price'),
            width: '130px',
            sortable: false,
            view: 'TableCellEditablePrice',
            editable: true,
            cellOptions: {
                editable: !isAnyOperationInProgress.value,
                min: 0.01,
                step: 0.01,
            },
        },
        {
            key: 'vatPercent',
            label: t('orders.sections.documentPositions.columns.vat'),
            width: '130px',
            sortable: false,
            view: 'TableCellEditablePrice',
            editable: true,
            cellOptions: {
                editable: !isAnyOperationInProgress.value,
                min: 0,
                max: 100,
                step: 0.1,
            },
        },
        {
            key: 'discountPercent',
            label: t('orders.sections.documentPositions.columns.discount'),
            width: '130px',
            sortable: false,
            view: 'TableCellEditablePrice',
            editable: true,
            cellOptions: {
                editable: !isAnyOperationInProgress.value,
                min: 0,
                max: 100,
                step: 0.1,
            },
        },
        {
            key: 'lineTotal',
            label: !!selectedCurrencyType.value
                ? t('table.totalAmount') + ` (${currencySymbol.value})`
                : t('table.totalAmount'),
            width: '120px',
            sortable: false,
            view: 'TableCellText',
            cellOptions: { classes: 'font-bold' },
        },
        {
            key: 'actions',
            label: '',
            sortable: false,
            view: 'TableCellActions',
            width: '120px',
            align: 'right',
        },
    ])

    const tableRows = computed(() => {
        if (formData.value.items.length === 0) {
            return []
        }

        return formData.value.items.map((item, index) => {
            const rowId = item.tempId || item.id?.toString() || `item-${index}`

            return {
                id: rowId,
                nr: index + 1,
                product: {
                    name: item.name || '',
                    sku: item.sku || '',
                    image: item.image || '',
                },
                ean: {
                    code: item.ean || '-',
                    barcodeUrl: item.eanBarcodeUrl || '',
                },
                bbd: item.bbd || '-',
                quantity: Number(item.quantity) || 0,
                unitPrice: Number(item.unitPrice) || 0,
                vatPercent: Number(item.vatPercent) || 20,
                discountPercent: Number(item.discountPercent) || 0,
                lineTotal: calculateLineTotal(item),
                originalData: item,
            }
        })
    })

    const canAddProducts = computed(
        () =>
            formData.value.buyerId !== null &&
            formData.value.currencyId !== null &&
            userCurrencyOptions.value.length > 0
    )

    const canPreview = computed(
        () => formData.value.items.length > 0 && formData.value.buyerId !== null
    )

    const canPrint = computed(
        () => formData.value.items.length > 0 && formData.value.buyerId !== null
    )

    const calculateLineTotal = (item: OrderFormItemData): number => {
        const quantity = Number(item.quantity) || 0
        const unitPrice = Number(item.unitPrice) || 0
        const discountPercent = Number(item.discountPercent) || 0
        const vatPercent = Number(item.vatPercent) || 0

        const subtotal = quantity * unitPrice
        const discountAmount = subtotal * (discountPercent / 100)
        const netAmount = subtotal - discountAmount
        const vatAmount = netAmount * (vatPercent / 100)
        const total = netAmount + vatAmount

        return Number(total.toFixed(2))
    }

    const getPhoneCountryCode = (): string => {
        if (formData.value.deliveryDetail?.phoneCountryId) {
            const country = countryOptions.value.find(
                (c) => c.value === formData.value.deliveryDetail?.phoneCountryId
            )
            return country?.code || 'MD'
        }
        return 'MD'
    }

    const handlePhoneValidation = (isValid: boolean) => {
        phoneValidation.value = isValid
    }

    const handlePhoneCountryChange = (country: { value: number; code: string; label: string }) => {
        if (formData.value.deliveryDetail && country) {
            formData.value.deliveryDetail.phoneCountryId = country.value
        }
        emit('formDirty', true)
    }

    const getCountryName = (countryId: number): string => {
        const country = countryOptions.value.find((c) => c.value === countryId)
        return country?.label || ''
    }

    const handleDocumentTypeChange = () => {
        validateField('type')
        emit('formDirty', true)
    }

    const handleBuyerChange = async () => {
        onBuyerChange()
        validateField('buyerId')
        emit('formDirty', true)
    }

    const handleDateChange = () => {
        validateField('date')
        emit('formDirty', true)
    }

    const handleCurrencyChange = () => {
        validateField('currencyId')
        updateProductPrices()
        emit('formDirty', true)
    }

    const handleDeliveryFieldChange = () => {
        emit('formDirty', true)
    }

    const handleHeadFieldChange = () => {
        emit('formDirty', true)
    }

    const handleFootFieldChange = () => {
        emit('formDirty', true)
    }

    const toggleCustomInvoice = (value: boolean) => {
        customInvoice.value = value

        if (!value) {
            invoiceNumber.value = generateDefaultInvoiceNumber()
        }

        emit('formDirty', true)
    }

    const handleInvoiceNumberInput = (value: string) => {
        invoiceNumber.value = value
        emit('formDirty', true)
    }

    const handleDeliveryLocationRadioSelect = (locationId: number) => {
        selectedDeliveryLocationId.value = locationId
        handleDeliveryLocationSelect(locationId)

        if (formData.value.hasCustomDelivery) {
            formData.value.hasCustomDelivery = false
        }

        emit('formDirty', true)
    }

    const handleReset = () => {
        if (confirm(t('orders.confirmReset'))) {
            reset()
            clearAllErrors()
            customInvoice.value = false
            initializeInvoiceNumber()
            emit('cancel')
        }
    }

    const handleCancel = () => {
        emit('cancel')
    }

    const handleAddProduct = () => {
        if (!canAddProducts.value) {
            if (userCurrencyOptions.value.length === 0) {
                toast.error(t('orders.error.noCurrenciesConfigured'))
            } else {
                toast.error(t('orders.error.selectBuyerAndCurrency'))
            }
            return
        }

        currentEditingItemIndex.value = null
        showProductModal.value = true
    }

    const handleProductSelected = (product: any) => {
        try {
            tableError.value = null

            let targetItem: OrderFormItemData
            let isNewItem = false

            if (currentEditingItemIndex.value !== null && currentEditingItemIndex.value >= 0) {
                if (currentEditingItemIndex.value >= formData.value.items.length) {
                    throw new Error(t('orders.error.itemNotFound'))
                }
                targetItem = formData.value.items[currentEditingItemIndex.value]
            } else {
                addItem()
                targetItem = formData.value.items[formData.value.items.length - 1]
                isNewItem = true
                lastAddedItemId.value = targetItem.tempId || null
            }

            const productPriceData: ProductPriceData = {
                price: Number(product.price) || 0,
                localPrice: Number(product.localPrice) || Number(product.price) || 0,
                exportPrice: Number(product.exportPrice) || Number(product.price) || 0,
                vatLocal: Number(product.vatLocal) || 20,
                vatExport: Number(product.vatExport) || 0,
            }

            const productPrice = getProductPrice(productPriceData)
            const productVat = getProductVat(productPriceData)

            Object.assign(targetItem, {
                productId: product.productId || product.id,
                name: product.name || '',
                sku: product.sku || '',
                ean: product.ean || '',
                bbd: product.bbd || '',
                eanBarcodeUrl: product.eanBarcodeUrl || null,
                image: product.image || '',
                unitPrice: productPrice,
                vatPercent: productVat,
                quantity: targetItem.quantity || 1,
                quantityUnitId: targetItem.quantityUnitId || 1,
                discountPercent: targetItem.discountPercent || 0,
                productPriceData: productPriceData,
            })

            currentEditingItemIndex.value = null
            emit('formDirty', true)

            if (isNewItem) {
                showStockAlert.value = true
                setTimeout(() => {
                    showStockAlert.value = false
                    lastAddedItemId.value = null
                }, 5000)
            }
        } catch (error: any) {
            console.error('[OrderForm] Product selection error:', error)
            tableError.value = error.message || t('orders.error.productAddFailed')
            currentEditingItemIndex.value = null
        }
    }

    const handleProductModalError = (error: string) => {
        toast.error(error)
    }

    const handleEditProduct = (payload: { rowId: string }) => {
        const itemIndex = formData.value.items.findIndex((item) => {
            const itemId = item.tempId || item.id?.toString()
            return itemId === payload.rowId
        })

        if (itemIndex === -1) {
            tableError.value = t('orders.error.itemNotFound')
            return
        }

        currentEditingItemIndex.value = itemIndex
        showProductModal.value = true
    }

    const handleCellEdit = (payload: any) => {
        try {
            tableError.value = null

            const itemIndex = formData.value.items.findIndex((item) => {
                const itemId = item.tempId || item.id?.toString()
                return itemId === payload.rowId
            })

            if (itemIndex === -1) {
                tableError.value = t('orders.error.itemNotFound')
                return
            }

            const item = formData.value.items[itemIndex]
            const column = payload.column
            let value = Number(payload.value)

            if (isNaN(value) || value < 0) {
                tableError.value = t('orders.error.invalidNumber')
                return
            }

            if (column === 'quantity' && value === 0) {
                tableError.value = t('orders.error.zeroQuantity')
                return
            }

            if ((column === 'discountPercent' || column === 'vatPercent') && value > 100) {
                tableError.value = t('orders.error.percentageOver100')
                return
            }

            item[column as keyof typeof item] = value
            emit('formDirty', true)
        } catch (error: any) {
            console.error('[OrderForm] Cell edit error:', error)
            tableError.value = t('orders.error.cellEditFailed')
        }
    }

    const handleDelete = (payload: { row: any }) => {
        const itemIndex = formData.value.items.findIndex((item) => {
            const itemId = item.tempId || item.id?.toString()
            return itemId === payload.row.id
        })

        if (itemIndex !== -1) {
            removeItem(itemIndex)
            emit('formDirty', true)
        }
    }

    const handleSubmit = async () => {
        tableError.value = null
        clearAllErrors()

        if (!validateForm()) {
            toast.error(t('orders.error.validationFailed'))
            return
        }

        if (!validateItems()) {
            const itemErrorKeys = Object.keys(errors.value).filter((key) =>
                key.startsWith('items.')
            )
            if (itemErrorKeys.length > 0) {
                const errorMessages = itemErrorKeys
                    .map((key) => {
                        const index = key.split('.')[1]
                        return `${t('orders.validation.item.itemNumber', { n: Number(index) + 1 })}: ${errors.value[key]}`
                    })
                    .join('\n')
                tableError.value = errorMessages
            }

            toast.error(t('orders.error.itemValidationFailed'))
            return
        }

        try {
            const result = await submit()

            if (result && (result.success || result.document)) {
                toast.success(t('orders.success.documentCreated'))
                emit('success', result.document)
            } else {
                throw new Error('No result returned from submit')
            }
        } catch (error: any) {
            console.error('[OrderForm] Submit error:', error)

            if (error?.data?.errors || error?.errors) {
                const backendErrors = error?.data?.errors || error?.errors
                setBackendErrors(backendErrors)

                Object.entries(backendErrors).forEach(([field, messages]) => {
                    const message = Array.isArray(messages) ? messages[0] : messages
                    toast.error(`${field}: ${message}`)
                })
            } else {
                const errorMessage =
                    error?.data?.message || error?.message || t('orders.error.submitFailed')
                toast.error(errorMessage)
            }

            emit('error', error?.data?.message || error?.message || t('orders.error.submitFailed'))
        }
    }

    const handlePreview = async () => {
        tableError.value = null
        clearAllErrors()

        if (!validateForm()) {
            toast.error(t('orders.error.validationFailed'))
            return
        }

        if (!validateItems()) {
            const itemErrorKeys = Object.keys(errors.value).filter((key) =>
                key.startsWith('items.')
            )
            if (itemErrorKeys.length > 0) {
                const errorMessages = itemErrorKeys
                    .map((key) => {
                        const index = key.split('.')[1]
                        return `${t('orders.validation.item.itemNumber', { n: Number(index) + 1 })}: ${errors.value[key]}`
                    })
                    .join('\n')
                tableError.value = errorMessages
            }

            toast.error(t('orders.error.itemValidationFailed'))
            return
        }

        try {
            const result = await createPreview()

            if (result.success) {
                toast.success(t('orders.success.previewCreated'))
            }
        } catch (error: any) {
            console.error('[OrderForm] Preview error:', error)

            let errorMessage = t('orders.error.previewFailed')

            if (error?.data?.errors || error?.errors) {
                const backendErrors = error?.data?.errors || error?.errors
                setBackendErrors(backendErrors)

                const firstError = Object.values(errors.value)[0]
                errorMessage = firstError as string
            } else if (error?.data?.message || error?.message) {
                errorMessage = error?.data?.message || error?.message
            }

            toast.error(errorMessage)
        }
    }

    const handlePrint = async () => {
        toast.info(t('orders.printNotImplemented'))
    }

    watch(
        () => formData.value,
        () => {
            emit('formDirty', true)
        },
        { deep: true }
    )

    watch(showProductModal, (isOpen) => {
        if (!isOpen) {
            currentEditingItemIndex.value = null
        }
    })

    watch(
        () => props.mode,
        () => {
            showProductModal.value = false
            currentEditingItemIndex.value = null
        }
    )

    watch(
        () => [user.value?.default_local_currency?.id, user.value?.default_export_currency?.id],
        ([newLocalId, newExportId], [oldLocalId, oldExportId]) => {
            if (formData.value.currencyId) {
                const stillExists = userCurrencyOptions.value.some(
                    (opt) => opt.value === formData.value.currencyId
                )

                if (!stillExists) {
                    formData.value.currencyId = userCurrencyOptions.value[0]?.value || null

                    if (formData.value.items.length > 0) {
                        toast.warning(t('orders.currencyResetWarning'))
                    }
                }
            }
        },
        { deep: true }
    )

    onMounted(async () => {
        try {
            await initializeConnectedClients()

            if (props.mode === 'edit' && props.documentId) {
                await loadDocumentForEdit()
            } else {
                if (props.initialType) {
                    formData.value.type = props.initialType
                }

                if (!formData.value.currencyId && userCurrencyOptions.value.length > 0) {
                    formData.value.currencyId = userCurrencyOptions.value[0].value
                }
            }

            initializeInvoiceNumber()
        } catch (error: any) {
            console.error('[OrderForm] Initialization error:', error)
            toast.error(t('orders.error.initialization'))
            emit('error', error?.message || t('orders.error.initialization'))
        }
    })

    onUnmounted(() => {
        showProductModal.value = false
        currentEditingItemIndex.value = null
        showStockAlert.value = false
    })
</script>

<style scoped>
    .fade-enter-active,
    .fade-leave-active {
        transition: opacity 0.3s ease;
    }

    .fade-enter-from,
    .fade-leave-to {
        opacity: 0;
    }
</style>
