// utils/validator/schemas/auth/registerSchema.ts
import type { JSONSchemaType } from '~/utils/validator'

// Account Type Data
export interface AccountTypeFormData {
    inviteCode: string
    type: 'supplier' | 'buyer' | 'serviceProvider'
    id: number
}

export const accountTypeSchema: JSONSchemaType<AccountTypeFormData> = {
    type: 'object',
    properties: {
        inviteCode: {
            type: 'string',
            minLength: 0,
            maxLength: 50,
        },
        type: {
            type: 'string',
            enum: ['supplier', 'buyer', 'serviceProvider'],
        },
        id: {
            type: 'integer',
            minimum: 1,
        },
    },
    required: ['type', 'id'],
    additionalProperties: false,
}

// Personal Info Data (Step 2)
export interface RegistrationFormData {
    email: string
    password: string
    confirmPassword: string
    destinationType: string
    terms: boolean
    subscribeToNewsletter: boolean
    language?: string
}

export const registrationSchema: JSONSchemaType<RegistrationFormData> = {
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
        confirmPassword: {
            type: 'string',
            minLength: 6,
            maxLength: 128,
        },
        destinationType: {
            type: 'string',
            enum: ['both', 'horeca', 'retail'],
            minLength: 1,
        },
        terms: {
            type: 'boolean',
            const: true,
        },
        subscribeToNewsletter: {
            type: 'boolean',
            default: false,
        },
        language: {
            type: 'string',
            nullable: true,
            minLength: 2,
            maxLength: 5,
        },
    },
    required: ['email', 'password', 'confirmPassword', 'destinationType', 'terms'],
    additionalProperties: false,
}

// Email Verification Data
export interface EmailVerificationFormData {
    verifiedEmail: boolean
    code: string
}

export const emailVerificationSchema: JSONSchemaType<EmailVerificationFormData> = {
    type: 'object',
    properties: {
        verifiedEmail: {
            type: 'boolean',
            const: true,
        },
        code: {
            type: 'string',
            minLength: 1,
            maxLength: 255,
        },
    },
    required: ['verifiedEmail', 'code'],
    additionalProperties: false,
}

// Company Profile Data (Substep 1 of Company Details)
export interface CompanyProfileFormData {
    legalName: string
    username: string
    businessTypeId: number
    registrationNumber: string
    vatNumber: string
    registrationYear: string
}

export const companyProfileSchema: JSONSchemaType<CompanyProfileFormData> = {
    type: 'object',
    properties: {
        legalName: {
            type: 'string',
            minLength: 2,
            maxLength: 255,
        },
        username: {
            type: 'string',
            pattern: '^[a-zA-Z][a-zA-Z0-9_]{2,29}$',
            minLength: 2,
            maxLength: 100,
            errorMessage: {
                pattern: 'validation.usernamePattern',
            },
        },
        businessTypeId: {
            type: 'integer',
            minimum: 1,
        },
        registrationNumber: {
            type: 'string',
            minLength: 1,
            maxLength: 50,
        },
        vatNumber: {
            type: 'string',
            minLength: 1,
            maxLength: 50,
        },
        registrationYear: {
            type: 'string',
            pattern: '^[0-9]{4}$',
        },
    },
    required: [
        'legalName',
        'username',
        'businessTypeId',
        'registrationNumber',
        'vatNumber',
        'registrationYear',
    ],
    additionalProperties: false,
}

// Company Detailed Data (Substep 2 of Company Details)
export interface CompanyDetailedFormData {
    revenueRangeId: number
    employeeCountRangeId: number
    websiteUrl: string
    description: string
    spokenLanguages: number[]
}

export const companyDetailedSchema: JSONSchemaType<CompanyDetailedFormData> = {
    type: 'object',
    properties: {
        revenueRangeId: {
            type: 'integer',
            minimum: 1,
        },
        employeeCountRangeId: {
            type: 'integer',
            minimum: 1,
        },
        websiteUrl: {
            type: 'string',
            nullable: true,
            format: 'flexible-url',
            errorMessage: {
                format: 'validation.formatUrl',
            },
        },
        description: {
            type: 'string',
            minLength: 0,
            maxLength: 1000,
        },
        spokenLanguages: {
            type: 'array',
            items: {
                type: 'integer',
                minimum: 1,
            },
            minItems: 1,
            maxItems: 10,
        },
    },
    required: ['revenueRangeId', 'employeeCountRangeId', 'spokenLanguages', 'description'],
    additionalProperties: false,
}

// Company Address Data (Substep 3 of Company Details)
export interface CompanyAddressFormData {
    countryId: number
    stateName?: string
    cityName: string
    streetName: string
    streetNumber: string
    postalCode: string
}

export const companyAddressSchema: JSONSchemaType<CompanyAddressFormData> = {
    type: 'object',
    properties: {
        countryId: {
            type: 'integer',
            minimum: 1,
        },
        stateName: {
            type: 'string',
        },
        cityName: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
        },
        streetName: {
            type: 'string',
            minLength: 2,
            maxLength: 255,
        },
        streetNumber: {
            type: 'string',
            minLength: 1,
            maxLength: 50,
        },
        postalCode: {
            type: 'string',
            minLength: 3,
            maxLength: 20,
        },
    },
    required: ['countryId', 'cityName', 'streetName', 'streetNumber', 'postalCode'],
    additionalProperties: false,
}

// Company Topics Data (Substep 4 of Company Details)
export interface CompanyTopicsFormData {
    interestingCategories: number[]
    suggestedCategories: string[]
}

export const companyTopicsSchema: JSONSchemaType<CompanyTopicsFormData> = {
    type: 'object',
    properties: {
        interestingCategories: {
            type: 'array',
            items: {
                type: 'integer',
                minimum: 1,
            },
            minItems: 1,
            maxItems: 50,
        },
        suggestedCategories: {
            type: 'array',
            items: {
                type: 'string',
                minLength: 1,
                maxLength: 100,
            },
            minItems: 0,
            maxItems: 10,
        },
    },
    required: ['interestingCategories'],
    additionalProperties: false,
}

// Company Contacts Data (Substep 5 of Company Details)
export interface CompanyContactsFormData {
    name: string
    email: string
    userContactPositionId: number | null
    customPosition: string
    phones: Array<{
        countryId: number
        phoneNumber: string
        verified?: boolean
    }>
    faxCountryId: number | null
    faxNumber: string
}

export const companyContactsSchema: JSONSchemaType<CompanyContactsFormData> = {
    type: 'object',
    properties: {
        name: {
            type: 'string',
            minLength: 2,
            maxLength: 255,
        },
        email: {
            type: 'string',
            format: 'email',
            minLength: 5,
            maxLength: 255,
        },
        userContactPositionId: {
            type: 'integer',
            nullable: true,
            minimum: 1,
        },
        customPosition: {
            type: 'string',
            minLength: 0,
            maxLength: 255,
        },
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
                        minLength: 8,
                        maxLength: 30,
                    },
                    verified: {
                        type: 'boolean',
                        default: false,
                        nullable: true,
                    },
                },
                required: ['countryId', 'phoneNumber'],
                additionalProperties: false,
            },
            minItems: 1,
            maxItems: 5,
        },
        faxCountryId: {
            type: 'integer',
            nullable: true,
            minimum: 1,
        },
        faxNumber: {
            type: 'string',
            minLength: 0,
            maxLength: 30,
        },
    },
    required: ['name', 'email', 'phones'],
    additionalProperties: false,
}

// Phone Verification Data (Substep 4 of Company Details)
export interface PhoneVerificationFormData {
    selectedPhoneId: string
    verificationCode: string
    isVerified: boolean
}

export const phoneVerificationSchema: JSONSchemaType<PhoneVerificationFormData> = {
    type: 'object',
    properties: {
        selectedPhoneId: {
            type: 'string',
            minLength: 1,
            maxLength: 50,
        },
        verificationCode: {
            type: 'string',
            minLength: 4,
            maxLength: 10,
        },
        isVerified: {
            type: 'boolean',
            default: false,
        },
    },
    required: ['selectedPhoneId'],
    additionalProperties: false,
}

// Bank Details Data (Substep 6 of Company Details)
export interface BankAccountFormData {
    id?: number | null
    bankName: string
    accountHolderName: string
    iban: string
    swiftCode: string
    currencyId: number
    countryId: number
    stateName?: string | null
    cityName: string
    streetName: string
    streetNumber: string
    postalCode: string
}

export const bankAccountSchema: JSONSchemaType<BankAccountFormData> = {
    type: 'object',
    properties: {
        id: {
            type: 'integer',
            nullable: true,
            minimum: 1,
        },
        bankName: {
            type: 'string',
            minLength: 2,
            maxLength: 255,
        },
        accountHolderName: {
            type: 'string',
            minLength: 2,
            maxLength: 255,
        },
        iban: {
            type: 'string',
            minLength: 15,
            maxLength: 34,
        },
        swiftCode: {
            type: 'string',
            minLength: 8,
            maxLength: 11,
        },
        currencyId: {
            type: 'integer',
            minimum: 1,
        },
        countryId: {
            type: 'integer',
            minimum: 1,
        },
        stateName: {
            type: 'string',
            nullable: true,
        },
        cityName: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
        },
        streetName: {
            type: 'string',
            minLength: 2,
            maxLength: 255,
        },
        streetNumber: {
            type: 'string',
            minLength: 1,
            maxLength: 50,
        },
        postalCode: {
            type: 'string',
            minLength: 3,
            maxLength: 20,
        },
    },
    required: [
        'bankName',
        'accountHolderName',
        'iban',
        'swiftCode',
        'currencyId',
        'countryId',
        'cityName',
        'streetName',
        'streetNumber',
        'postalCode',
    ],
    additionalProperties: false,
}

// Company Bank Details Data (Collection of Bank Accounts)
export interface CompanyBankDetailsFormData {
    bankAccounts: BankAccountFormData[]
}

export const companyBankDetailsSchema: JSONSchemaType<CompanyBankDetailsFormData> = {
    type: 'object',
    properties: {
        bankAccounts: {
            type: 'array',
            items: bankAccountSchema,
            minItems: 1,
            maxItems: 10,
        },
    },
    required: ['bankAccounts'],
    additionalProperties: false,
}

// Production Details Data (for suppliers only) - Updated to match API structure
export interface ProductionDetailsFormData {
    name: string
    userFactorySizeId: number
    countryId: number
    stateName: string | null
    cityName: string
    streetName: string
    streetNumber: string
    postalCode: string
}

export const productionDetailsSchema: JSONSchemaType<ProductionDetailsFormData> = {
    type: 'object',
    properties: {
        name: {
            type: 'string',
            minLength: 2,
            maxLength: 255,
        },
        userFactorySizeId: {
            type: 'integer',
            minimum: 1,
        },
        countryId: {
            type: 'integer',
            minimum: 1,
        },
        stateName: {
            type: 'string',
            nullable: true,
        },
        cityName: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
        },
        streetName: {
            type: 'string',
            minLength: 2,
            maxLength: 255,
        },
        streetNumber: {
            type: 'string',
            minLength: 1,
            maxLength: 50,
        },
        postalCode: {
            type: 'string',
            minLength: 3,
            maxLength: 20,
        },
    },
    required: [
        'name',
        'userFactorySizeId',
        'countryId',
        'cityName',
        'streetName',
        'streetNumber',
        'postalCode',
    ],
    additionalProperties: false,
}

// Export Details Data (for suppliers only)
export interface ExportDetailsFormData {
    doesExport: boolean
    exportSinceYear?: number
    userExportPercentageId?: number
    exportCountries?: number[]
    exportPorts?: string[]
}

export const exportDetailsSchema: JSONSchemaType<ExportDetailsFormData> = {
    type: 'object',
    properties: {
        doesExport: {
            type: 'boolean',
        },
        exportSinceYear: {
            type: 'integer',
            minimum: 1900,
            maximum: new Date().getFullYear(),
            nullable: true,
        },
        userExportPercentageId: {
            type: 'integer',
            minimum: 1,
            nullable: true,
        },
        exportCountries: {
            type: 'array',
            items: {
                type: 'integer',
                minimum: 1,
            },
            minItems: 1,
            maxItems: 50,
            nullable: true,
        },
        exportPorts: {
            type: 'array',
            items: {
                type: 'string',
                minLength: 2,
                maxLength: 255,
            },
            nullable: true,
        },
    },
    required: ['doesExport'],
    additionalProperties: false,
    if: {
        properties: {
            doesExport: { const: true },
        },
    },
    then: {
        required: ['doesExport', 'exportSinceYear', 'userExportPercentageId', 'exportCountries'],
    },
    else: {
        required: ['doesExport'],
    },
}

// Company Certificates Data (Substep 1 - Required Documents)
export interface CompanyCertificatesFormData {
    companyCertificates: Array<{
        id?: number | null
        file: File
    }>
}

export const companyCertificatesSchema: JSONSchemaType<CompanyCertificatesFormData> = {
    type: 'object',
    properties: {
        companyCertificates: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: {
                        type: 'integer',
                        nullable: true,
                        minimum: 1,
                    },
                    file: {
                        type: 'object',
                    },
                },
                required: ['file'],
                additionalProperties: false,
            },
            minItems: 1,
            maxItems: 10,
        },
    },
    required: ['companyCertificates'],
    additionalProperties: false,
}

// General Certificates Data (Substep 2 - Quality/Business Certificates with Metadata)
export interface GeneralCertificatesFormData {
    generalCertificates: Array<{
        id?: number | null
        file?: File
        certificateNumber: string
        issueDate: string
        expiryDate: string
    }>
}

export const generalCertificatesSchema: JSONSchemaType<GeneralCertificatesFormData> = {
    type: 'object',
    properties: {
        generalCertificates: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: {
                        type: 'integer',
                        nullable: true,
                        minimum: 1,
                    },
                    file: {
                        type: 'object',
                        nullable: true,
                    },
                    certificateNumber: {
                        type: 'string',
                        minLength: 1,
                        maxLength: 255,
                    },
                    issueDate: {
                        type: 'string',
                        format: 'date',
                    },
                    expiryDate: {
                        type: 'string',
                        format: 'date',
                    },
                },
                required: ['certificateNumber', 'issueDate', 'expiryDate'],
                additionalProperties: false,
            },
            minItems: 1,
            maxItems: 20,
        },
    },
    required: ['generalCertificates'],
    additionalProperties: false,
}

// Legacy Certificates interface for backward compatibility
export interface CertificatesFormData {
    companyCertificates?: CompanyCertificatesFormData
    generalCertificates?: GeneralCertificatesFormData
}

export const certificatesSchema: JSONSchemaType<CertificatesFormData> = {
    type: 'object',
    properties: {
        companyCertificates: {
            ...companyCertificatesSchema,
            nullable: true,
        },
        generalCertificates: {
            ...generalCertificatesSchema,
            nullable: true,
        },
    },
    required: [],
    additionalProperties: false,
}

// Public Profile Data
export interface PublicProfileFormData {
    profilePicture: File | null
    companyCover: File | null
    publicDescription: string
    publicDescriptionImages: File[]
}

export const publicProfileSchema: JSONSchemaType<PublicProfileFormData> = {
    type: 'object',
    properties: {
        profilePicture: {
            type: 'object',
            nullable: true,
        },
        companyCover: {
            type: 'object',
            nullable: true,
        },
        publicDescription: {
            type: 'string',
            minLength: 0,
            maxLength: 5000,
        },
        publicDescriptionImages: {
            type: 'array',
            items: {
                type: 'object',
            },
            minItems: 0,
            maxItems: 10,
        },
    },
    required: [],
    additionalProperties: false,
}

// Complete registration data (all steps combined)
export interface CompleteRegistrationData {
    accountType: AccountTypeFormData
    personalInfo: RegistrationFormData
    emailVerification: EmailVerificationFormData
    companyDetails?: {
        profile: CompanyProfileFormData
        detailed: CompanyDetailedFormData
        address: CompanyAddressFormData
        topics: CompanyTopicsFormData
        contacts: CompanyContactsFormData
        banks: CompanyBankDetailsFormData
    }
    productionDetails?: ProductionDetailsFormData
    exportDetails?: ExportDetailsFormData
    companyCertificates?: CompanyCertificatesFormData
    generalCertificates?: GeneralCertificatesFormData
    publicProfile?: PublicProfileFormData
}

export const completeRegistrationSchema: JSONSchemaType<CompleteRegistrationData> = {
    type: 'object',
    properties: {
        accountType: accountTypeSchema,
        personalInfo: registrationSchema,
        emailVerification: emailVerificationSchema,
        companyDetails: {
            type: 'object',
            nullable: true,
            properties: {
                profile: companyProfileSchema,
                detailed: companyDetailedSchema,
                address: companyAddressSchema,
                topics: companyTopicsSchema,
                contacts: companyContactsSchema,
                banks: companyBankDetailsSchema,
            },
            required: ['profile', 'detailed', 'address', 'contacts', 'banks'],
            additionalProperties: false,
        },
        productionDetails: {
            ...productionDetailsSchema,
            nullable: true,
        },
        exportDetails: {
            ...exportDetailsSchema,
            nullable: true,
        },
        companyCertificates: {
            ...companyCertificatesSchema,
            nullable: true,
        },
        generalCertificates: {
            ...generalCertificatesSchema,
            nullable: true,
        },
        publicProfile: {
            ...publicProfileSchema,
            nullable: true,
        },
    },
    required: ['accountType', 'personalInfo', 'emailVerification'],
    additionalProperties: false,
}

// Legacy schemas for backward compatibility
export interface CompanyDetailsFormData extends CompanyProfileFormData {}
export const companyDetailsSchema: JSONSchemaType<CompanyDetailsFormData> = companyProfileSchema
