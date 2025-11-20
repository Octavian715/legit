// utils/validator/schemas/companyProfile.ts
import type { JSONSchemaType } from 'ajv'

export interface CompanyProfileFormData {
    legal_name: string
    username: string
    description: string
    email: string
    website_url: string
}

export const companyProfileFormSchema: JSONSchemaType<CompanyProfileFormData> = {
    type: 'object',
    properties: {
        legal_name: {
            type: 'string',
            minLength: 2,
            maxLength: 255,
            errorMessage: {
                minLength: 'validation.companyProfile.legalNameTooShort',
                maxLength: 'validation.companyProfile.legalNameTooLong',
                type: 'validation.companyProfile.legalNameRequired',
            },
        },
        username: {
            type: 'string',
            minLength: 3,
            maxLength: 50,
            pattern: '^[a-zA-Z0-9_]+$',
            errorMessage: {
                minLength: 'validation.companyProfile.usernameTooShort',
                maxLength: 'validation.companyProfile.usernameTooLong',
                pattern: 'validation.companyProfile.usernameInvalidChars',
                type: 'validation.companyProfile.usernameRequired',
            },
        },
        description: {
            type: 'string',
            minLength: 50,
            maxLength: 2000,
            errorMessage: {
                minLength: 'validation.companyProfile.descriptionTooShort',
                maxLength: 'validation.companyProfile.descriptionTooLong',
                type: 'validation.companyProfile.descriptionRequired',
            },
        },
        email: {
            type: 'string',
            format: 'email',
            minLength: 5,
            maxLength: 255,
            errorMessage: {
                format: 'validation.companyProfile.emailInvalid',
                minLength: 'validation.companyProfile.emailTooShort',
                maxLength: 'validation.companyProfile.emailTooLong',
                type: 'validation.companyProfile.emailRequired',
            },
        },
        website_url: {
            type: 'string',
            format: 'flexible-url',
            minLength: 5,
            maxLength: 255,
            errorMessage: {
                format: 'validation.companyProfile.websiteInvalid',
                minLength: 'validation.companyProfile.websiteTooShort',
                maxLength: 'validation.companyProfile.websiteTooLong',
                type: 'validation.companyProfile.websiteRequired',
            },
        },
    },
    required: ['legal_name', 'username', 'description', 'email', 'website_url'],
    additionalProperties: false,
    errorMessage: {
        required: {
            legal_name: 'validation.companyProfile.legalNameRequired',
            username: 'validation.companyProfile.usernameRequired',
            description: 'validation.companyProfile.descriptionRequired',
            email: 'validation.companyProfile.emailRequired',
            website_url: 'validation.companyProfile.websiteRequired',
        },
        additionalProperties: 'validation.additionalPropertiesNotAllowed',
    },
}

export interface PhoneNumberData {
    phone_number: string
    country_id: number
}

export const phoneNumberSchema: JSONSchemaType<PhoneNumberData> = {
    type: 'object',
    properties: {
        phone_number: {
            type: 'string',
            minLength: 8,
            maxLength: 25,
            pattern: '^\\+\\d{1,3}\\s\\d{4,}$',
            errorMessage: {
                minLength: 'validation.phoneTooShort',
                maxLength: 'validation.phoneTooLong',
                pattern: 'validation.phoneInvalidFormat',
                type: 'validation.phoneRequired',
            },
        },
        country_id: {
            type: 'number',
            minimum: 1,
            errorMessage: {
                minimum: 'validation.countryRequired',
                type: 'validation.countryRequired',
            },
        },
    },
    required: ['phone_number', 'country_id'],
    additionalProperties: false,
}
