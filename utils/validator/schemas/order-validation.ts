import type { JSONSchemaType } from 'ajv'
import type { OrderFormData, OrderFormItemData, OrderFormDeliveryDetail } from '~/types/order-form'

export const orderFormSchema: JSONSchemaType<Partial<OrderFormData>> = {
    type: 'object',
    properties: {
        type: {
            type: 'string',
            nullable: true,
            minLength: 1,
        },
        buyerId: {
            type: 'number',
            nullable: true,
            minimum: 1,
        },
        currencyId: {
            type: 'number',
            nullable: true,
            minimum: 1,
        },
        statusId: {
            type: 'number',
            nullable: true,
        },
        paymentStatusId: {
            type: 'number',
            nullable: true,
        },
        date: {
            type: 'string',
            minLength: 1,
        },
        title: {
            type: 'string',
            nullable: true,
        },
        subtitle: {
            type: 'string',
            nullable: true,
        },
        documentNotes: {
            type: 'string',
            nullable: true,
        },
        documentCommentary: {
            type: 'string',
            nullable: true,
        },
        hasCustomDelivery: {
            type: 'boolean',
        },
        deliveryDetail: {
            type: 'object',
            nullable: true,
            required: [],
            properties: {},
        } as any,
        items: {
            type: 'array',
            items: {
                type: 'object',
                required: [],
                properties: {},
            } as any,
        },
    },
    required: [],
    additionalProperties: false,
}

export const orderItemSchema: JSONSchemaType<Partial<OrderFormItemData>> = {
    type: 'object',
    properties: {
        tempId: {
            type: 'string',
            nullable: true,
        },
        id: {
            type: 'number',
            nullable: true,
        },
        productId: {
            type: 'number',
            nullable: true,
            minimum: 1,
        },
        name: {
            type: 'string',
            nullable: true,
            minLength: 1,
        },
        sku: {
            type: 'string',
            nullable: true,
        },
        ean: {
            type: 'string',
            nullable: true,
        },
        bbd: {
            type: 'string',
            nullable: true,
        },
        image: {
            type: 'string',
            nullable: true,
        },
        eanBarcodeUrl: {
            type: 'string',
            nullable: true,
        },
        quantity: {
            type: 'number',
            minimum: 0.01,
        },
        quantityUnitId: {
            type: 'number',
            nullable: true,
            minimum: 1,
        },
        unitPrice: {
            type: 'number',
            minimum: 0,
        },
        vatPercent: {
            type: 'number',
            minimum: 0,
            maximum: 100,
        },
        discountPercent: {
            type: 'number',
            minimum: 0,
            maximum: 100,
        },
    },
    required: [],
    additionalProperties: false,
}

export const deliveryDetailSchema: JSONSchemaType<Partial<OrderFormDeliveryDetail>> = {
    type: 'object',
    properties: {
        contactName: {
            type: 'string',
            minLength: 2,
        },
        phoneNumber: {
            type: 'string',
            minLength: 5,
        },
        phoneCountryId: {
            type: 'number',
            nullable: true,
        },
        countryId: {
            type: 'number',
            nullable: true,
            minimum: 1,
        },
        stateName: {
            type: 'string',
            nullable: true,
        },
        cityName: {
            type: 'string',
            minLength: 2,
        },
        streetName: {
            type: 'string',
            minLength: 2,
        },
        streetNumber: {
            type: 'string',
            minLength: 1,
        },
        postalCode: {
            type: 'string',
            minLength: 3,
        },
    },
    required: [],
    additionalProperties: false,
}
