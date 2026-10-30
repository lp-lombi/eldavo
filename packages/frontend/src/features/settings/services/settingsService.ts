import { changePassword, getOwnPublicProfile, GoogleReview, LandingService, PublicContact, updateOwnPublicProfile } from '../../../services';

export const loadOwnProfile = (token: string) => getOwnPublicProfile(token);
export const saveOwnProfile = (token: string, publicBrandName: string, publicSlug: string, brandLogo: string | null, publicDescription: string, publicBookingEnabled: boolean, landingTitle: string, landingAbout: string, heroTitle: string, heroDescription: string, heroImage: string | null, aboutTitle: string, aboutDescription: string, googleReviews: GoogleReview[], publicContacts: PublicContact[], landingServices: LandingService[]) =>
  updateOwnPublicProfile(token, { publicBrandName, publicSlug, brandLogo, publicDescription, publicBookingEnabled, landingTitle, landingAbout, heroTitle, heroDescription, heroImage, aboutTitle, aboutDescription, googleReviews, publicContacts, landingServices });
export const updatePassword = (token: string, currentPassword: string, newPassword: string) =>
  changePassword(token, currentPassword, newPassword);
