// schemas/passwordResetSchemas.ts
import type { JSONSchemaType } from '~/utils/validator'

export interface ForgotPasswordFormData {
    email: string
}

export interface ConfirmCodeFormData {
    code: string
}

export interface ResetPasswordFormData {
    token: string
    password: string
    confirmPassword: string
}

export const forgotPasswordSchema: JSONSchemaType<ForgotPasswordFormData> = {
    type: 'object',
    properties: {
        email: {
            type: 'string',
            format: 'email',
            minLength: 5,
            maxLength: 254,
        },
    },
    required: ['email'],
    additionalProperties: false,
}

export const confirmCodeSchema: JSONSchemaType<ConfirmCodeFormData> = {
    type: 'object',
    properties: {
        code: {
            type: 'string',
            pattern: '^[0-9]{6}$',
            minLength: 6,
            maxLength: 6,
        },
    },
    required: ['code'],
    additionalProperties: false,
}

export const resetPasswordSchema: JSONSchemaType<ResetPasswordFormData> = {
    type: 'object',
    properties: {
        token: {
            type: 'string',
            minLength: 1,
        },
        password: {
            type: 'string',
            minLength: 8,
            maxLength: 128,
        },
        confirmPassword: {
            type: 'string',
            minLength: 8,
            maxLength: 128,
        },
    },
    required: ['token', 'password', 'confirmPassword'],
    additionalProperties: false,
}
