// utils/schemas/invitations.ts
import type { JSONSchemaType } from 'ajv'

export interface InvitationFormData {
    email: string
    companyName: string
    phone: string
    message?: string
    partnerType: 'supplier' | 'buyer' | 'serviceProvider'
}

export const invitationFormSchema: JSONSchemaType<InvitationFormData> = {
    type: 'object',
    properties: {
        email: {
            type: 'string',
            format: 'email',
            minLength: 5,
            maxLength: 255,
            errorMessage: {
                format: 'validation.emailInvalid',
                minLength: 'validation.emailTooShort',
                maxLength: 'validation.emailTooLong',
                type: 'validation.emailRequired',
            },
        },
        companyName: {
            type: 'string',
            minLength: 2,
            maxLength: 255,
            errorMessage: {
                minLength: 'validation.companyNameTooShort',
                maxLength: 'validation.companyNameTooLong',
                type: 'validation.companyNameRequired',
            },
        },
        phone: {
            type: 'string',
            minLength: 8,
            maxLength: 25,
            errorMessage: {
                type: 'validation.phoneRequired',
            },
        },
        message: {
            type: 'string',
            maxLength: 500,
            nullable: true,
            errorMessage: {
                maxLength: 'validation.messageTooLong',
            },
        },
        partnerType: {
            type: 'string',
            enum: ['supplier', 'buyer', 'serviceProvider'],
            errorMessage: {
                enum: 'validation.partnerTypeInvalid',
                type: 'validation.partnerTypeRequired',
            },
        },
    },
    required: ['email', 'companyName', 'phone', 'partnerType'],
    additionalProperties: false,
    errorMessage: {
        required: {
            email: 'validation.emailRequired',
            companyName: 'validation.companyNameRequired',
            phone: 'validation.phoneRequired',
            partnerType: 'validation.partnerTypeRequired',
        },
        additionalProperties: 'validation.additionalPropertiesNotAllowed',
    },
}

// Field-specific validation schemas for individual field validation
export const emailSchema: JSONSchemaType<{ email: string }> = {
    type: 'object',
    properties: {
        email: invitationFormSchema.properties.email,
    },
    required: ['email'],
    additionalProperties: false,
}

export const companyNameSchema: JSONSchemaType<{ companyName: string }> = {
    type: 'object',
    properties: {
        companyName: invitationFormSchema.properties.companyName,
    },
    required: ['companyName'],
    additionalProperties: false,
}

export const phoneSchema: JSONSchemaType<{ phone: string }> = {
    type: 'object',
    properties: {
        phone: invitationFormSchema.properties.phone,
    },
    required: ['phone'],
    additionalProperties: false,
}

export const messageSchema: JSONSchemaType<{ message?: string }> = {
    type: 'object',
    properties: {
        message: invitationFormSchema.properties.message,
    },
    required: [],
    additionalProperties: false,
}

// API payload schema for backend validation
export interface InvitationApiPayload {
    email: string
    company_name: string
    phone_number: string
    comment?: string | null
    referred_role: 'supplier' | 'buyer' | 'serviceProvider'
}

export const invitationApiSchema: JSONSchemaType<InvitationApiPayload> = {
    type: 'object',
    properties: {
        email: {
            type: 'string',
            format: 'email',
            minLength: 5,
            maxLength: 255,
        },
        company_name: {
            type: 'string',
            minLength: 1,
            maxLength: 255,
        },
        phone_number: {
            type: 'string',
            minLength: 8,
            maxLength: 25,
        },
        comment: {
            type: 'string',
            maxLength: 500,
            nullable: true,
        },
        referred_role: {
            type: 'string',
            enum: ['supplier', 'buyer', 'serviceProvider'],
        },
    },
    required: ['email', 'company_name', 'phone_number', 'referred_role'],
    additionalProperties: false,
}
