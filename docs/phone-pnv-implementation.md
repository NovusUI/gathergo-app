# Firebase PNV Implementation Plan

## Frontend (gathergo-app)

### Implemented in this pass
- Added shared phone auth payload types:
  - `types/auth.ts`
- Added auth URL:
  - `services/urls.ts` -> `AUTH_URLS.phoneFirebaseToken`
- Added service function:
  - `services/serviceFn.ts` -> `phoneFirebaseAuthFn(payload)`
- Added mutation:
  - `services/mutations.ts` -> `usePhoneFirebaseAuth()`
- Added flow hook:
  - `hooks/usePhoneAuthFlow.ts`
- Added auth screens:
  - `app/(auth)/phone-login.tsx`
  - `app/(auth)/phone-verify.tsx`
- Added entry point in login screen:
  - `app/(auth)/login/index.tsx` -> "Continue with phone"

### Still required on frontend
- Replace placeholder verification flow with actual Firebase PNV SDK flow.
- Return a real verification artifact from Firebase (instead of SMS-only placeholder data).
- Add analytics events for phone auth lifecycle.

## Backend (gathergo-backend)

### Required endpoint
- `POST /api/v1/auth/phone/firebase-token`

### Request body
```json
{
  "phoneNumber": "+2348012345678",
  "verificationArtifact": {
    "provider": "firebase_pnv",
    "sessionId": "optional",
    "idToken": "optional",
    "verificationId": "optional",
    "smsCode": "optional"
  },
  "deviceInfo": {
    "platform": "android",
    "osVersion": "optional",
    "appVersion": "optional",
    "deviceName": "optional"
  }
}
```

### Response body (expected by app)
```json
{
  "status": "success",
  "status_code": 200,
  "message": "Phone authentication successful",
  "data": {
    "accessToken": "jwt",
    "refreshToken": "jwt",
    "user": {
      "id": "uuid",
      "email": "optional@email.com",
      "username": "optional",
      "hasPreferences": true,
      "isProfileComplete": true,
      "phoneNumber": "+2348012345678",
      "phoneVerifiedAt": "2026-02-27T10:00:00.000Z",
      "authProvider": "phone"
    }
  }
}
```

### Backend implementation checklist
- Verify Firebase artifact using Firebase Admin SDK.
- Normalize phone to E.164 format.
- Upsert user by verified phone number.
- Issue GatherGo `accessToken` + `refreshToken`.
- Return response in the format above.
- Add throttling/rate-limits to prevent abuse.

