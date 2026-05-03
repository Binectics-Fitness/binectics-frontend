export const queryKeys = {
  progress: {
    all: ["progress"] as const,
    dashboardStats: () =>
      [...queryKeys.progress.all, "dashboardStats"] as const,
    clientProfiles: (orgId?: string) =>
      [...queryKeys.progress.all, "clientProfiles", orgId ?? "mine"] as const,
    progressSummary: (clientProfileId: string, days?: number) =>
      [...queryKeys.progress.all, "summary", clientProfileId, days] as const,
    latestWeights: () => [...queryKeys.progress.all, "latestWeights"] as const,
    invitations: (orgId?: string) =>
      [...queryKeys.progress.all, "invitations", orgId ?? "mine"] as const,
    sentRequests: (orgId?: string) =>
      [...queryKeys.progress.all, "sentRequests", orgId ?? "mine"] as const,
    myOwnProfiles: () => [...queryKeys.progress.all, "myOwnProfiles"] as const,
    myWorkoutPlans: () =>
      [...queryKeys.progress.all, "myWorkoutPlans"] as const,
    myDietPlans: () => [...queryKeys.progress.all, "myDietPlans"] as const,
    activityReports: (profileId?: string) =>
      [...queryKeys.progress.all, "activityReports", profileId] as const,
    mealFeedbacks: (profileId?: string) =>
      [...queryKeys.progress.all, "mealFeedbacks", profileId] as const,
    myRecommendations: (limit?: number) =>
      [...queryKeys.progress.all, "myRecommendations", limit] as const,
    pendingClientRequests: () =>
      [...queryKeys.progress.all, "pendingClientRequests"] as const,
    pendingInvitations: () =>
      [...queryKeys.progress.all, "pendingInvitations"] as const,
    orgDietPlans: (orgId: string) =>
      [...queryKeys.progress.all, "orgDietPlans", orgId] as const,
    clientSummaryStats: (profileId: string) =>
      [...queryKeys.progress.all, "clientSummaryStats", profileId] as const,
  },

  consultations: {
    all: ["consultations"] as const,
    providerBookings: (params?: Record<string, string>) =>
      [...queryKeys.consultations.all, "providerBookings", params] as const,
    myBookings: (params?: Record<string, string>) =>
      [...queryKeys.consultations.all, "myBookings", params] as const,
    types: () => [...queryKeys.consultations.all, "types"] as const,
  },

  teams: {
    all: ["teams"] as const,
    myOrganizations: () => [...queryKeys.teams.all, "myOrganizations"] as const,
    organization: (orgId: string) =>
      [...queryKeys.teams.all, "detail", orgId] as const,
    members: (orgId: string) =>
      [...queryKeys.teams.all, "members", orgId] as const,
    roles: (orgId: string) => [...queryKeys.teams.all, "roles", orgId] as const,
    invitations: (orgId: string) =>
      [...queryKeys.teams.all, "invitations", orgId] as const,
  },

  marketplace: {
    all: ["marketplace"] as const,
    subscriptions: () =>
      [...queryKeys.marketplace.all, "subscriptions"] as const,
    search: (params?: Record<string, unknown>) =>
      [...queryKeys.marketplace.all, "search", params] as const,
    myListing: () => [...queryKeys.marketplace.all, "myListing"] as const,
    myListings: () => [...queryKeys.marketplace.all, "myListings"] as const,
    facilityItems: (listingId: string) =>
      [...queryKeys.marketplace.all, "facilityItems", listingId] as const,
    orgListing: (orgId: string) =>
      [...queryKeys.marketplace.all, "orgListing", orgId] as const,
    myListingRequests: () =>
      [...queryKeys.marketplace.all, "myListingRequests"] as const,
    orgMembershipSubscriptions: (orgId: string) =>
      [...queryKeys.marketplace.all, "orgMembershipSubs", orgId] as const,
    orgMembershipPlans: (orgId: string) =>
      [...queryKeys.marketplace.all, "orgMembershipPlans", orgId] as const,
  },

  notifications: {
    all: ["notifications"] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.notifications.all, "list", params] as const,
    preferences: () => [...queryKeys.notifications.all, "preferences"] as const,
  },

  reviews: {
    all: ["reviews"] as const,
    targetAggregate: (targetType: string, targetId: string) =>
      [...queryKeys.reviews.all, "aggregate", targetType, targetId] as const,
    targetReviews: (
      targetType: string,
      targetId: string,
      params?: { page?: number; sort?: string },
    ) =>
      [...queryKeys.reviews.all, "list", targetType, targetId, params] as const,
  },

  checkins: {
    all: ["checkins"] as const,
    orgDashboardStats: (orgId: string) =>
      [...queryKeys.checkins.all, "orgDashboardStats", orgId] as const,
    myCheckIns: (params?: Record<string, string>) =>
      [...queryKeys.checkins.all, "myCheckIns", params] as const,
    orgCheckIns: (orgId: string, params?: Record<string, string>) =>
      [...queryKeys.checkins.all, "orgCheckIns", orgId, params] as const,
  },

  utility: {
    countries: () => ["utility", "countries"] as const,
    platformConfig: () => ["utility", "platformConfig"] as const,
  },

  loyalty: {
    all: ["loyalty"] as const,
    balance: () => [...queryKeys.loyalty.all, "balance"] as const,
    history: (limit?: number, skip?: number) =>
      [...queryKeys.loyalty.all, "history", limit, skip] as const,
    rewards: (orgId?: string) =>
      [...queryKeys.loyalty.all, "rewards", orgId ?? "all"] as const,
    myRedemptions: () =>
      [...queryKeys.loyalty.all, "myRedemptions"] as const,
    adminUserBalance: (userId: string) =>
      [...queryKeys.loyalty.all, "adminUserBalance", userId] as const,
  },

  assignmentRules: {
    all: ["assignmentRules"] as const,
    list: (orgId: string) =>
      [...queryKeys.assignmentRules.all, "list", orgId] as const,
    detail: (orgId: string, ruleId: string) =>
      [...queryKeys.assignmentRules.all, "detail", orgId, ruleId] as const,
  },
} as const;
