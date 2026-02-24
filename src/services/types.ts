export type Campus = 'UNC'

export type LocationType = 'home_studio' | 'mobile'

export type Service = {
  serviceId: string
  name: string
  price: number
  hairIncluded: boolean
  durationMins: number
  imageUrls?: string[]
  depositAmount?: number
  requiresDeposit?: boolean
}

export type Stylist = {
  stylistId: string
  userId: string
  name: string
  campus: Campus
  verified: boolean
  portfolioImageUrls: string[]
  locationOptions: LocationType[]

  // Public Location (Approximate)
  publicLocationLabel?: string // e.g. "Downtown Chapel Hill"
  publicCoordinates?: { lat: number; lng: number } // Obfuscated

  // Private Location (Exact - visible only to confirmed clients)
  homeStudioAddress?: string
  exactCoordinates?: { lat: number; lng: number }

  mobileServiceAreaPublic?: string
  ratingAvg: number
  ratingCount: number
  services: Service[]
  bio?: string
  profileImageUrl?: string
  setupComplete?: boolean
  availability?: {
    slotDurationMins?: number
    weeklyRules: Record<
      'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat',
      { start: string; end: string }[]
    >
  }
}

export type BookingStatus = 'requested' | 'confirmed' | 'declined' | 'cancelled' | 'service_complete' | 'completed'

export type RescheduleProposal = {
  proposedStartAt: string
  proposedEndAt: string
  proposedBy: string // uid
  createdAt: string // ISO
}

export type Booking = {
  bookingId: string
  clientId: string
  clientName?: string
  stylistId: string
  stylistName?: string
  serviceId: string
  campus: Campus
  startAt: string // ISO
  endAt: string // ISO
  status: BookingStatus
  requestedAt: string // ISO
  respondedAt?: string // ISO
  locationType: LocationType
  mobileLocationNote?: string
  lastMessageAt?: string // ISO
  depositAmount: number
  depositPaid: boolean
  totalAmount: number
  balancePaid: boolean
  rescheduleProposal?: RescheduleProposal
  reviewId?: string

  // Notifications
  clientHasNotification?: boolean
  stylistHasNotification?: boolean
}

export type Review = {
  reviewId: string
  bookingId: string
  clientId: string
  clientName: string
  stylistId: string
  rating: number // 1-5
  comment: string
  createdAt: string // ISO
}

export type Message = {
  messageId: string
  senderId: string
  text: string
  createdAt: string // ISO
}

export type Conversation = {
  conversationId: string
  participantIds: string[]
  lastMessage?: string
  lastMessageAt?: string
  lastMessageSenderId?: string
  // For easy display
  otherParticipantName?: string
  otherParticipantPhoto?: string
  otherParticipantId?: string
  unreadCount?: Record<string, number>
}

export type StylistApplicationStatus = 'pending' | 'approved' | 'rejected'

export type StylistApplication = {
  applicationId: string
  userId: string
  campus: Campus
  fullName: string
  phone?: string
  portfolioImageUrls: string[]
  locationOptions: LocationType[]
  homeStudioPublicArea?: string
  mobileServiceAreaPublic?: string
  status: StylistApplicationStatus
  submittedAt: string // ISO
  reviewedAt?: string // ISO
  reviewedBy?: string
  rejectionReason?: string
  profileImageUrl?: string
  governmentIdUrl?: string
}

export type Availability = {
  stylistId: string
  slotDurationMins?: number
  weeklyRules: Record<
    'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat',
    { start: string; end: string }[]
  >
}

