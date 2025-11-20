import type { JSONSchemaType } from '~/utils/validator'

export interface LoginFormData {
    email: string
    password: string
    remember: boolean
}

export const loginSchema: JSONSchemaType<LoginFormData> = {
    type: 'object',
    properties: {
        email: {
            type: 'string',
            format: 'email',
            minLength: 5,
            maxLength: 254,
        },
        password: {
            type: 'string',
            minLength: 6,
            maxLength: 128,
        },
        remember: {
            type: 'boolean',
            default: false,
        },
    },
    required: ['email', 'password'],
    additionalProperties: false,
}
