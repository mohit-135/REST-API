# Mamta — A Night Written in Stars (V17)

V17 fixes the wish-delivery bug in V16.

V16 accidentally contained the older local-only `sendWish()` function, so the browser never called `/api/send-wish`. V17 restores the actual POST request.

The Vercel API sends the wish through Resend to:
tejas.kmsd@gmail.com

Required Vercel environment variable:
RESEND_API_KEY

For Resend's default `onboarding@resend.dev` sender, the recipient must be the email address associated with the Resend account. For sending to arbitrary recipients, verify a domain in Resend and use a sender address on that verified domain.
