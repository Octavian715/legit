export interface Company {
    id: string
    name: string
    legalName: string
    companyName: string
    logoUrl: string
    coverImage?: string
    location: string
    verified: boolean
    topSeller: boolean
    productsCount: number
    connectionsCount: number
    followersCount: number
    descriptionParagraphs: string[]
    allowsPrivateLabel: boolean
    revenue?: string
    galleryImages: string[]
    hasVideo: boolean
    videoThumbnail?: string
    marketingChannel: string
    businessType: string
    registrationNumber: string
    vatNumber: string
    yearOfRegistration: string
    registrationCountry: string
    street: string
    zipCode: string
    contactPerson: string
    phoneNumber: string
    mobileNumber?: string
    fax: string
    email?: string
    languages: string[]
    website?: string
    numberOfEmployees: string
    products: Products[]
}

export interface Products {
    name: string
    slug: string
    categorySlug: string
    imageUrl: string
    productCount: number
}
