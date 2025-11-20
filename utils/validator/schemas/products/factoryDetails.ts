// utils/validator/schemas/user/factoryDetails.ts
import type { JSONSchemaType } from 'ajv'

export interface FactoryDetailFormData {
    id?: number | null
    name: string
    user_factory_size_id: number
    country_id: number
    state_name?: string | null
    city_name: string
    street_name: string
    street_number: string
    postal_code: string
    phone_number?: string | null
}

export const factoryDetailSchema: JSONSchemaType<FactoryDetailFormData> = {
    type: 'object',
    properties: {
        id: {
            type: 'integer',
            nullable: true,
            errorMessage: {
                type: 'validation.factory.idInvalid',
            },
        },
        name: {
            type: 'string',
            minLength: 2,
            maxLength: 255,
            errorMessage: {
                minLength: 'validation.factory.nameTooShort',
                maxLength: 'validation.factory.nameTooLong',
                type: 'validation.factory.nameRequired',
            },
        },
        user_factory_size_id: {
            type: 'integer',
            minimum: 1,
            errorMessage: {
                minimum: 'validation.factory.sizeInvalid',
                type: 'validation.factory.sizeRequired',
            },
        },
        country_id: {
            type: 'integer',
            minimum: 1,
            errorMessage: {
                minimum: 'validation.factory.countryInvalid',
                type: 'validation.factory.countryRequired',
            },
        },
        state_name: {
            type: 'string',
            nullable: true,
            maxLength: 255,
            errorMessage: {
                maxLength: 'validation.factory.stateTooLong',
            },
        },
        city_name: {
            type: 'string',
            minLength: 2,
            maxLength: 255,
            errorMessage: {
                minLength: 'validation.factory.cityTooShort',
                maxLength: 'validation.factory.cityTooLong',
                type: 'validation.factory.cityRequired',
            },
        },
        street_name: {
            type: 'string',
            minLength: 2,
            maxLength: 255,
            errorMessage: {
                minLength: 'validation.factory.streetTooShort',
                maxLength: 'validation.factory.streetTooLong',
                type: 'validation.factory.streetRequired',
            },
        },
        street_number: {
            type: 'string',
            minLength: 1,
            maxLength: 50,
            errorMessage: {
                minLength: 'validation.factory.streetNumberTooShort',
                maxLength: 'validation.factory.streetNumberTooLong',
                type: 'validation.factory.streetNumberRequired',
            },
        },
        postal_code: {
            type: 'string',
            minLength: 3,
            maxLength: 20,
            errorMessage: {
                minLength: 'validation.factory.postalCodeTooShort',
                maxLength: 'validation.factory.postalCodeTooLong',
                type: 'validation.factory.postalCodeRequired',
            },
        },
        phone_number: {
            type: 'string',
            nullable: true,
            minLength: 8,
            maxLength: 30,
            errorMessage: {
                minLength: 'validation.factory.phoneTooShort',
                maxLength: 'validation.factory.phoneTooLong',
            },
        },
    },
    required: [
        'name',
        'user_factory_size_id',
        'country_id',
        'city_name',
        'street_name',
        'street_number',
        'postal_code',
    ],
    additionalProperties: false,
    errorMessage: {
        required: {
            name: 'validation.factory.nameRequired',
            user_factory_size_id: 'validation.factory.sizeRequired',
            country_id: 'validation.factory.countryRequired',
            city_name: 'validation.factory.cityRequired',
            street_name: 'validation.factory.streetRequired',
            street_number: 'validation.factory.streetNumberRequired',
            postal_code: 'validation.factory.postalCodeRequired',
        },
        additionalProperties: 'validation.additionalPropertiesNotAllowed',
    },
}

// Array schema for multiple factory details
export interface FactoryDetailsArrayFormData {
    factory_details: FactoryDetailFormData[]
}

export const factoryDetailsArraySchema: JSONSchemaType<FactoryDetailsArrayFormData> = {
    type: 'object',
    properties: {
        factory_details: {
            type: 'array',
            items: factoryDetailSchema,
            minItems: 0,
            maxItems: 20,
            errorMessage: {
                type: 'validation.factory.arrayInvalid',
                maxItems: 'validation.factory.tooManyFactories',
            },
        },
    },
    required: ['factory_details'],
    additionalProperties: false,
}
