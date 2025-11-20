// utils/validator/companyDetailsValidator.ts
import { validateData } from '~/utils/validator'
import type { JSONSchemaType } from 'ajv'

export interface PhoneNumber {
    countryId: number
    phoneNumber: string
    verified: boolean
}

export interface CompanyDetailsFormData {
    // Section 1: Company Information
    legalName: string
    businessTypeId: number | null
    registrationNumber: string
    vatNumber: string
    yearOfRegistration: number | null
    spokenLanguageIds: number[]
    annualRevenueId: number | null
    numberOfEmployeesId: number | null
    websiteUrl: string

    // Section 2: Location
    countryId: number | null
    stateName: string
    cityName: string
    streetName: string
    streetNumber: string
    postalCode: string

    // Section 3: Categories/Topics
    categoryIds: number[]

    // Section 4: Contact Details
    contactPersonName: string
    contactEmail: string
    userContactPositionId: number | null
    customPosition: string

    // Phone Numbers
    phones: PhoneNumber[]
    faxCountryId: number | null
    faxNumber: string
}

// Schema definition using existing validator system
export const companyDetailsTabSchema: JSONSchemaType<CompanyDetailsFormData> = {
    type: 'object',
    properties: {
        // Company Information
        legalName: {
            type: 'string',
            minLength: 2,
            maxLength: 255,
        },
        businessTypeId: {
            type: ['integer', 'null'],
            nullable: true,
            minimum: 1,
        },
        registrationNumber: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
        },
        vatNumber: {
            type: 'string',
            minLength: 1,
            maxLength: 50,
        },
        yearOfRegistration: {
            type: ['integer', 'null'],
            nullable: true,
            minimum: 1900,
            maximum: new Date().getFullYear(),
        },
        spokenLanguageIds: {
            type: 'array',
            items: {
                type: 'integer',
                minimum: 1,
            },
        },
        annualRevenueId: {
            type: ['integer', 'null'],
            nullable: true,
            minimum: 1,
        },
        numberOfEmployeesId: {
            type: ['integer', 'null'],
            nullable: true,
            minimum: 1,
        },
        websiteUrl: {
            type: 'string',
            format: 'flexible-url', // Using existing custom format!
            maxLength: 255,
        },

        // Location
        countryId: {
            type: ['integer', 'null'],
            nullable: true,
            minimum: 1,
        },
        stateName: {
            type: 'string',
            maxLength: 255,
        },
        cityName: {
            type: 'string',
            minLength: 2,
            maxLength: 255,
        },
        streetName: {
            type: 'string',
            minLength: 1,
            maxLength: 255,
        },
        streetNumber: {
            type: 'string',
            minLength: 1,
            maxLength: 20,
        },
        postalCode: {
            type: 'string',
            minLength: 1,
            maxLength: 20,
        },

        // Categories
        categoryIds: {
            type: 'array',
            items: {
                type: 'integer',
                minimum: 1,
            },
            minItems: 1,
        },

        // Contact Details
        contactPersonName: {
            type: 'string',
            minLength: 2,
            maxLength: 255,
        },
        contactEmail: {
            type: 'string',
            format: 'email',
            minLength: 5,
            maxLength: 255,
        },
        userContactPositionId: {
            type: ['integer', 'null'],
            nullable: true,
            minimum: 1,
        },
        customPosition: {
            type: 'string',
            maxLength: 100,
        },

        // Phone Numbers - FIXED TYPE
        phones: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    countryId: {
                        type: 'integer',
                        minimum: 1,
                    },
                    phoneNumber: {
                        type: 'string',
                        minLength: 1,
                    },
                    verified: {
                        type: 'boolean',
                    },
                },
                required: ['countryId', 'phoneNumber', 'verified'],
                additionalProperties: false,
            },
            minItems: 1,
            maxItems: 5,
        },

        faxCountryId: {
            type: ['integer', 'null'],
            nullable: true,
            minimum: 1,
        },
        faxNumber: {
            type: 'string',
            maxLength: 50,
        },
    },
    required: [
        'legalName',
        'businessTypeId',
        'registrationNumber',
        'vatNumber',
        'countryId',
        'cityName',
        'streetName',
        'streetNumber',
        'postalCode',
        'categoryIds',
        'contactPersonName',
        'contactEmail',
        'userContactPositionId',
        'phones',
    ],
    additionalProperties: false,
}

/**
 * Validate company details form data using existing validation system
 */
export const validateCompanyDetails = (data: CompanyDetailsFormData) => {
    // Use the existing validateData from utils/validator/index.ts
    return validateData('companyDetailsTab', companyDetailsTabSchema, data)
}

/**
 * Transform validation errors to field error map
 */
export const transformValidationErrors = (errors: Array<{ field: string; message: string }>) => {
    const errorMap: Record<string, string> = {}

    errors.forEach((error) => {
        errorMap[error.field] = error.message
    })

    return errorMap
}
