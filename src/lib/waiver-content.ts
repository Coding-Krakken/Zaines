export type WaiverType = 'liability' | 'medical' | 'photo_release';

export const WAIVER_CONTENT_BY_TYPE: Record<WaiverType, string> = {
  liability:
    'I accept the liability waiver and understand supervised dogs may still experience normal dog-behavior risks such as scratches, scrapes, or property damage.',
  medical:
    "I authorize Zaine's Stay & Play to seek emergency medical treatment for my pet if necessary, and I agree to cover all associated costs.",
  photo_release:
    'I consent to the use of photos and videos of my pet for promotional purposes.',
};
