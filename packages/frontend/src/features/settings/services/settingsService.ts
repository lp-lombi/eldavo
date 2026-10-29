import { changePassword, getOwnPublicProfile, LandingService, updateOwnPublicProfile } from '../../../services';

export const loadOwnProfile = (token: string) => getOwnPublicProfile(token);
export const saveOwnProfile = (token: string, publicDescription: string, publicBookingEnabled: boolean, landingTitle: string, landingAbout: string, heroTitle: string, heroDescription: string, aboutTitle: string, aboutDescription: string, landingServices: LandingService[]) =>
  updateOwnPublicProfile(token, { publicDescription, publicBookingEnabled, landingTitle, landingAbout, heroTitle, heroDescription, aboutTitle, aboutDescription, landingServices });
export const updatePassword = (token: string, currentPassword: string, newPassword: string) =>
  changePassword(token, currentPassword, newPassword);
