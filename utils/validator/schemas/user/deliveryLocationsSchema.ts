import type { JSONSchemaType } from 'ajv'
import type { DeliveryLocationFormData } from '~/types/auth'

export const deliveryLocationSchema: JSONSchemaType<DeliveryLocationFormData> = {
    type: 'object',
    properties: {
        id: { type: 'number', nullable: true },
        contact_name: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
        },
        phone_number: {
            type: 'string',
        },
        phone_country_id: {
            type: 'number',
            minimum: 1,
        },
        country_id: {
            type: 'number',
            minimum: 1,
        },
        state_name: {
            type: 'string',
            nullable: true,
        },
        city_name: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
        },
        street_name: {
            type: 'string',
            minLength: 2,
            maxLength: 200,
        },
        street_number: {
            type: 'string',
            minLength: 1,
            maxLength: 20,
        },
        postal_code: {
            type: 'string',
            minLength: 3,
            maxLength: 20,
        },
        is_default: {
            type: 'boolean',
        },
    },
    required: [
        'contact_name',
        'phone_number',
        'phone_country_id',
        'country_id',
        'city_name',
        'street_name',
        'street_number',
        'postal_code',
        'is_default',
    ],
    additionalProperties: false,
}
