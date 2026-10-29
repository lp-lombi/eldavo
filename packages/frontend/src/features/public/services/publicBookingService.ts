import { createPublicBookingRequest, getPublicAvailability, getPublicProfile } from '../../../services';

export const loadPublicProfile = (username: string) => getPublicProfile(username);
export const loadPublicAvailability = (username: string, date: string) => getPublicAvailability(username, date);
export const submitPublicBooking = (username: string, data: Parameters<typeof createPublicBookingRequest>[1]) =>
  createPublicBookingRequest(username, data);
