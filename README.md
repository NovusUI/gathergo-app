# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Events and impact

Every event has its own description and interests. Organisers can optionally add
an impact story and choose individual map suggestions; only saved selections
appear publicly. Removing the story also clears its map. Existing event records
are preserved until their organiser edits them.

Impact suggestions come from the backend's DeepSeek integration after typing
pauses for one second. The app does not use keyword suggestions or a local
fallback. If AI suggestions fail, organisers can retry, keep their selections,
or continue without a map. Configure `DEEPSEEK_API_KEY` on the backend only.

Run the event creation and map regression checks with `npm run test:event-first`.
Run AI suggestion and selection checks with `npm run test:impact-suggestions`.

## Event volunteering

New Event offers Fundraiser, Ticket, Registration and Volunteer and donation.
Volunteer roles are exclusive to Volunteer and donation events and unlock after
adding a physical venue and impact story. Other types have no volunteer setup,
feed action or event volunteering card. Gogo collects roles as a required step for
Volunteer and donation and never suggests volunteers for another event type.
Attempts to add roles before a story show a reminder.
Role creation and editing open a bottom sheet in the event draft and organiser
management. Draft roles change only on Save; organiser saves use the role API.
Each role has its own capacity and organiser approval setting. Donations remain
optional for Volunteer and donation events; fundraisers keep their donation setup.
The form displays naira and sends donation amounts in kobo. The update API keeps
an omitted target; switching donations off removes it. The stored participation
value remains `volunteer`.

For Volunteer and donation events, Give your time opens a sheet of roles,
and participants keep a full-width Volunteer action. Organisers open management
from the people icon beside Edit. The feed header includes a compact Volunteer
action. Roles load when the sheet opens.
Participants apply or join and can withdraw pending applications or confirmed
places before the event starts, from the roles sheet or My volunteering. They
track their places in Settings
→ My volunteering. Organisers manage roles and applications from the event or
its dashboard, check volunteers in during the event, and confirm actual minutes
after it ends. Recruitment and withdrawals close at the event start.

These screens require the backend volunteering migration and endpoints, including
`/events/:eventId/volunteer-roles`, `/events/:eventId/volunteers`, and
`/volunteers/me`. Run the focused checks with `npm run test:volunteering`.

Free attendee registration is limited to one active place per person and event.
Event details and the feed check the existing registrations endpoint, display
Registered for an owned place, and block repeat submissions. Registration checks
must finish successfully before a new free registration can begin. Settings
scrolls so all destinations and Logout remain reachable on smaller screens.

## Gogo feature

The `components/gogo/` folder owns Gogo's AI tasks and reusable mascot presentation:

- `components/gogo/tasks/eventCreation/`: the anchored event guide, conversation state,
  draft mapping, and event-creation API types.
- `components/gogo/tasks/impactSuggestions/`: the impact-map selector, query, and API types.
- `components/gogo/services/`: authenticated AI requests and their endpoint URLs.
- `components/gogo/mascot/`: shared artwork, messages, palettes, and native animation hooks.

Screens supply the context for their task: the event creator receives the current
form and the impact selector receives the current impact draft. Mascot views can
also be used independently for onboarding, loaders, and status messages. This
keeps task-specific form state separate from the shared presentation that a future
floating assistant can use. Global conversation and automatic screen context need
their own backend contract before being connected. Current AI requests use the
existing event-drafting and impact-suggestions endpoints. Gogo extracts the initial idea into editable
copy, dates, venue and available pricing details, then collects missing required
fields. Optional invitations follow impact story, impact map, volunteering, links
and interests. Each optional step can be skipped; completed and skipped steps stay
addressed during the conversation, including retries and manual-form switches.
Impact maps use the existing suggestion API; only organiser-selected entries are
saved. Physical volunteering still requires an impact story.

The event page shows its essentials once. Creator payout reminders use the same
Gogo prompt as the dashboard and open Wallet directly, including after creation;
there is no intermediate payout reminder modal.

## Gogo mascot

The shared GatherGoMascot uses the supplied Gogo artwork, with its mint body,
ring eyes and antenna. The original base, wave and celebration SVGs live in
assets/mascot; GogoArtwork renders their geometry with react-native-svg, and
useGogoMotion translates the SVG CSS keyframes into native Reanimated motion.
The idle companion uses the wave pose and confirmations use celebration. Empty
states use the lost shrugging pose from the mascot guide, recreated in the shared
vector component and saved as assets/mascot/gogo-lost.svg. Pending and error
states retain their contextual status badges.

Empty passes and unpublished event tickets use a clean, stacked Gogo message.
My passes and My volunteering show the page loader while loading or checking
empty cached results, then show their empty state only after the request finishes.
Failed requests show retry controls. Existing results remain visible during
background refreshes; pulling to refresh an empty list uses the single Gogo pull indicator.
Unpublished ticket sheets omit totals and checkout controls. Scanner guidance,
wallet setup reminders, logout confirmation and Circle's coming-soon page also
use Gogo. Circle’s coming-soon page and home-feed card use the supplied
`gogo-coming-soon-laptop.svg`, with native typing, blinking and floating code
animation that stops for reduced motion. Event search uses the small loader
just below the search bar.
Context palettes style badges and glow while Gogo keeps the supplied colours.
Mascot motion, loading animation and typed messages respect reduced motion.

Shared full-screen and compact page loaders use assets/mascot/gogo-loading.svg.
GogoLoadingArtwork preserves its proportions, patient expression and three ring
dots; useGogoLoadingMotion runs the supplied bob, spin, glance, blink, arm tap
and staggered ring animation natively. Reduced motion shows the still artwork.
Each page keeps its existing loading title and message.

Other loading states use assets/mascot/gogo-loading-small.svg through AppLoader.
Its ring spins while the face pulses and glances; existing sizes, ring colours,
visibility controls and reduced-motion preferences are supported. Forms, lists,
chat, image uploads and web views share this loader. GogoRefreshScrollView
scrubs the ring animation during a pull and starts the loading loop only after
release past the threshold.

The floating live feed button uses the four supplied frenzy SVG designs. Warming
is the default; the latest CURRENT_FRENZY feed maps LOW to Heating up, MEDIUM to
Frenzy, and HIGH to Inferno. The unread badge stays independent of heat. Native
animation follows the supplied flame, bounce, ember and expression keyframes;
reduced motion shows a still pose. Physical events with carpool available use the
front-facing Gogo roadster at the same heat level; online and ended events use
the standing mascot. The roadster replaces the separate car icon and its badge
cycle. Car, wheel, headlight and ray animation stops for reduced motion.

## App icon and startup screen

The app icon PNG assets are rendered from assets/images/gglogo.svg. The app icon
uses an opaque mint background; Android uses a separate transparent foreground
with the mark inside the adaptive icon safe area.

## Startup and first-time welcome

Startup uses the GatherGo app logo on navy (`#01082E`) and stays visible
until fonts and saved preferences are restored, navigation has reached a
destination screen, and its next render frame is ready. Root navigation groups
switch without a fade during the handoff. Authentication loading screens use
the same logo, size, and navy background as the native app window and React root.
The logo-to-Gogo animation from `assets/mascot/gogo-startup.svg` plays for 5.6 seconds as a
welcome screen with the heading “Impact begins here” before onboarding and
respects reduced motion. “Let’s get started” opens the three onboarding slides,
each with an illustration and a short heading: Make an Impact, Go together,
and Find your people. Headings fade and rise into place. Slides advance every
five seconds, or with Next or swiping, and stop on the final slide. The timer
restarts after manual navigation and pauses while dragging, backgrounded or
unfocused. Reduced motion shows text immediately and changes pages without
an animation. Get started and the Skip button go to sign-in. Skip is also available
on the welcome screen. Completing or skipping the welcome is remembered on
this device. Returning signed-in users go straight into the app.

Splash images and native window backgrounds are configured in `app.json`.
Native splash changes require rebuilding and reinstalling the app; refreshing
Metro alone cannot update them. Run `npx expo prebuild` to sync an existing native
project before the next build. Run `node --test tests/startup.test.cjs` for the
startup and welcome flow checks.

Carpool creation uses an explicit To the event / From the event choice and a
pickup-to-destination route. The event venue fills the corresponding end; only
the other end is entered. Both choices use the existing event-linked carpool API
with actual `origin` and `destination` values. Current-location coordinates are
used only for the entered pickup on trips to the event. Ride details and chat
prefer the saved destination so return trips show the route that was created.

Event creation keeps guidance brief and uses field labels, inline choice hints,
and the Skip for now action instead of explanatory paragraphs. Impact suggestions
use compact Gogo guidance for loading, ready, empty and error states. Empty groups
are hidden, and selection counts show each limit. Suggestions still come from
the existing impact API; only explicit organiser selections change the draft.

New Event opens the creation page directly. Gogo first asks the organiser to
choose Fundraiser, Ticket, Registration or Volunteer and donation. Each type has its own
cached draft and stays selected throughout creation; Change event type returns
to the first page. Location and participation details render inline, and the
fundraising target binds directly to the shared form. Registration settings,
ticket changes and location edits update the draft directly, without Apply setup
or Apply location actions. Gogo keeps Continue to advance the conversation.
Publishing validates the same setup rules as the pricing editor. Event-edit
sheets still stage changes until confirmation, so closing them cancels those
edits. Impact-story proposals appear in the conversation and are applied only
after acceptance. The manual editor remains available for corrections. The
optional impact-focus input and second volunteer selector have been removed.
Gogo skips its interests invitation when an impact story and at least one global
goal or impact path are selected. Manual interest editing remains available.

When event creation regains focus, it checks saved drafts before opening a form.
Gogo offers Continue draft or Discard draft and start over for the most recently
edited event type. Discard clears that draft and returns to type selection; other
types' saved drafts remain available when selected. Autosave flushes on blur, and
queued writes finish before reads or deletion so a late save cannot revive a
discarded or published draft. Drafts retain the form, mode, Gogo question, story
proposal and addressed optional steps. Existing form-only drafts resume in the
manual editor. Merely choosing a type does not create a resumable draft.
Drafts use the existing AsyncStorage dependency because form data and Gogo
history can exceed SecureStore's 2 KB value limit. The current form-only caches
remain readable and are removed only after a successful save to the new cache,
or when the organiser discards that draft.


Closing Paystack checkout for tickets or registration releases the checkout hold.
The app clears its saved retry key only after cancellation is confirmed, so buying
again starts a fresh checkout. If cancellation cannot be confirmed, payment status
opens after the selection sheet closes. Closing a donation checkout does not call
the ticket/registration cancellation endpoint.

When ticket quantities or ticket types change, Pay replaces an existing unpaid
checkout with the revised selection. The app cancels the previous hold and retries
the revised request once, retaining its new key for network retries. If the old
payment has already been processed or cannot be cancelled, it opens payment status
instead of creating another order.

## Appearance

Settings → Appearance offers System, Light and Dark. System is the default and
follows the phone’s current theme, including changes while the app is open.
An explicit Light or Dark choice overrides the phone setting. The selection is
saved on this device and restores before the app’s first screen.

Shared colors live in `constants/theme.ts`. Use `useAppTheme()` for theme-aware
`tw` styles and `colors`. Existing styles can preserve their dark utility with
`dark:`; `color(darkColor, lightRole)` keeps an exact dark color while selecting
a shared light palette role for inline styles and icons.

Chat surfaces use the shared `chatBackground`, `chatIncoming`, `chatOutgoing`, and `chatPattern` roles. The wallpaper is a decorative SVG tile that stays behind the message list and does not intercept touches or accessibility focus. Shared input boundaries use `borderStrong`; light-mode card backgrounds, status text, and Gogo ride highlights resolve through the app theme.

Global notifications use the shared Gogo toast for success, error, warning, and info messages. It follows app appearance, wraps the full message, respects system safe areas, and supports tapping, closing, or swiping to dismiss. Existing global notification helpers and modal toast hosts use the same design.

### Adaptive layout

Headers, standard form controls, buttons and cards fill their parent container. Keep readable width limits at the page or sheet boundary so nested controls stay aligned on unfolded devices. Home lets an unpaired event or ride card grow across the available row. The carpool creation sheet shows the event’s start and end beside the departure-time section.

Authenticated screens reserve the left, right, and bottom system safe areas in the app layout. Main navigation occupies its own layout space and switches to a rail on sufficiently wide, tall windows; screens should not add a second tab-bar spacer. Home sizes its carousel and event columns from the current window and keeps the active tab during resizing.

Home scrolls its featured card with the feed and pins the tab row at the top beneath the greeting. On supported phone sizes, first scroll the active feed back to the beginning, then start a new downward pull to expand the card and bring the tabs into reach. The card follows the finger between its normal and expanded sizes and settles on release; pulling while browsing always scrolls the feed first. The featured card and Home tabs expose equivalent expand/collapse actions to screen readers without an extra visible control. Short windows and larger text keep the compact layout, and reduced motion disables the settling animation.

Event details use a second column for organizer and participation actions when the safe width reaches 960 points and text scaling permits it. On narrower screens the organizer scrolls with the details and the primary action stays below the scroller. Checkout and feed sheets use actual system insets and centered width limits; creation, Impact Builder, and chat keep readable widths on larger windows. Modal forms protect their own safe areas.

Carpool details, Wallet, and both Dashboards use the same 960-point detail-column threshold and return to a single column above 1.4 text scaling. Carpool keeps its phone action below the scrolling details; its tablet sidebar scrolls independently. Dashboard Quick Access occupies normal layout space below the content. Charts measure their container and update when the window changes. Wallet setup and carpool modals protect their own safe areas.

Every refreshable screen and list uses `GogoRefreshScrollView`: carpool details, chats, notifications, volunteering, passes, Gather, Wallet and its history lists, scanner screens, and both feed-sheet tabs. Gogo and the page follow a downward pull from the top. Releasing a short pull returns the page to rest; releasing past the threshold starts one refresh and keeps Gogo visible until the request finishes. The gesture works with short content and respects reduced motion. Virtualized lists keep their native scroll ref, events, and pagination through `renderScrollComponent`; Passes and Gather reveal Gogo below their profile tabs. The feed sheet reserves its content gesture for refreshing and its handle for dismissal. Socket-backed refresh indicators stop on a response, error, or disconnect. Carpool keeps its loaded ride if refreshing fails. The Chat button stays in Ride crew and is visible only to the pooler and accepted riders. Riders see previous declines or removals; poolers see the history in View Requests and a prior-outcome label on repeat requests. A declined rider can request again, while removal blocks another request to that ride. A denied request displays the server error without a success message. Request, rejection, and removal notifications open the carpool page; acceptances and chat messages still open chat.

The app supports rotation (`expo.orientation: default`). Installed development and release apps need a native rebuild to pick up this configuration change.

Profile opens on Passes, which combines the existing owned-ticket and registration queries in one list. The profile summary scrolls with that list and its tabs remain sticky. QR access, event navigation, refresh, loading, and retry remain available. Bio editing and its route are removed; Settings no longer links to My passes.

Dashboard event overview rows and event Quick Access shortcuts open the organiser detail screen (`/dashboard/:eventId`). The explicit attendee-view action on that screen opens the public event page.

Google sign-in keeps a shared, non-persisted handoff phase while the browser is open and the user and tokens are saved. The root navigator covers intermediate routes until the authenticated destination renders: profile completion, interest mapping, or Explore. Cancelled and failed attempts release the cover so sign-in can be retried.

Chat saves every outgoing message in an account-owned AsyncStorage outbox before clearing the composer. The app-level socket sender keeps it until a saved-message acknowledgment, live receipt, or history confirms the same sender/conversation/client key. Lost receipts retry after 15 seconds with backoff up to 30 seconds; connection and foreground changes resume delivery. Rejected sends remain visible with a retry action. A restart restores pending content and keys; background delivery resumes when the operating system lets the app run again.

The server must be updated with the saved-message acknowledgment contract before this app version is released. The previous `message-queue-storage` contained no sender identity; it is retained untouched and is not automatically replayed under a possibly different account. Its pending messages may need to be sent again manually. The new outbox uses `chat-outbox-storage`.

Conversation previews share the socket query cache. Partial updates for an unknown carpool request the full tray instead of creating an incomplete row. A preview failure after an outgoing message has been saved does not report a send failure or leave the sent text in the composer. Local save and retry failures appear beside the composer; delivery rejections stay beside the affected message.

Incoming chat bubbles show the sender’s `@username` above the message. Ride check messages identify the sender alongside their role; your own checks say “You”. Accounts without a username display “Ride member”.

The local `withFoldableActivity` Expo plugin preserves `smallestScreenSize` in the Android activity’s configuration changes to avoid recreating the activity when folding or unfolding. This native change requires rebuilding the Android app.

Chat enables padding-based keyboard avoidance on Android as well as iOS. This reserves keyboard overlap in edge-to-edge windows and removes that extra padding when Android has already resized the window.

Passes pull-to-refresh keeps the profile summary as the unchanged list header. Its refresh indicator appears in the Passes section below the profile tabs; only tickets and registrations are refetched.

Opening Notifications marks existing notifications as read after a socket connection is available. The server confirms the write with `allNotificationsRead`, which clears the shared count and read state across cached pages. The default All tab keeps notification history visible; new arrivals still increase the unread count.

Notification audio uses the supplied Gogo foley clips, converted to PCM WAV in `assets/sounds` for both iOS and Android: general alerts/chat messages, carpool requests/acceptances, carpool rejections/removals, and frenzy/milestone celebrations. `expo-notifications` bundles the files and the matching Android channels are created before permission/token registration. The OS plays one sound per push, including foreground alerts; socket tray updates do not play a second sound. System mute, Focus/Do Not Disturb, and per-channel settings still apply.

Custom audio needs a rebuilt native app; an OTA update or Expo Go cannot add these bundled resources. Install/open the rebuilt app before testing backend notifications so Android channels exist. The backend selects the filename and channel; deploy both changes together. This does not add sounds to local Gogo toasts or loading animations.

## Food banks

Food bank events use a physical venue and one collection date range. Organisers
set total meals, people per window, and window length (5–120 minutes). Collection
hours must accommodate the stated meal capacity. Capacity and arrival settings
lock after the first pass; an explicit reschedule preserves issued passes. Food banks start with Gogo and can switch to the same
manual form. Gogo extracts meal totals, collection windows, dates and venue
from the description and collects missing details inline before optional steps.
Creation and editing use a fixed physical venue. Longer collection and donation
explanations are available through expandable info icons.

The home scanner opens directly beside notifications. Event share sheets offer
an event QR/link, and food banks additionally offer a labelled meal-collection
QR/link. Native QR sharing uses `expo-sharing` and `expo-file-system`; rebuild the
native app after installing these modules. QR images retain an Event/Meals label.
Android app links include `/food-bank`; the public hosting/deep-link association
must also allow that path.

Anyone with a GatherGo account can reserve a meal without donating. The server
assigns the earliest available collection window. A first verified donation in the native app also
issues a pass while windows remain available; repeat donations and repeat claims
reuse the person's single entitlement for that event, including after collection.
Donations support the bank and are not meal purchases. Donations made through the
food collection page remain donations and carry `source: FOOD_BANK` in payment
and feed metadata. Meal passes and staff scan results contain no donation source
or amount. Collection receipts and donation transactions both open the same pass
view, with Donate again; passes also appear in Profile.

Deploy the companion backend food bank migrations, including
`20261028140000_flexible_food_bank_collection`, before using these screens.
The organiser opens Manage collection from the event to start, pause, close,
reopen or reschedule. Banks start closed to collection until explicitly started.
Start/reopen is limited to the scheduled local day range; exact hours and arrival
windows are advisory for redemption. Staff can confirm early or late arrivals
while open. Each pass remains single-use. New reservations use planned hours.

New banks store the creator's IANA timezone; existing banks use Africa/Lagos.
Rescheduling keeps duration and existing QR codes, shifts unused arrival windows,
leaves collected passes collected and notifies affected holders. A notification
failure is shown separately from the successful schedule change. Public collection
state refreshes every 30 seconds; mutation responses update the organiser immediately.
Capacity controls pace bookings; they do not measure physical crowd density.
Run the app regressions with `node --test tests/*.test.cjs`.

## Event cover sharing

All event share sheets show the uploaded cover when it is available. On Android
and iOS, Share image + link attaches that image and includes the selected event
or meal-collection URL in the message. Link-only and QR sharing remain available.
The download is checked before opening the share sheet and its temporary file is
removed afterwards. Cancelling does not show a success or error message.

This uses the autolinked `react-native-share` module and app-internal cache
storage. Rebuild the native app after installing it; no new storage permission
is needed. The receiving app decides how it displays the image and caption.
Web keeps link and QR display; combined image sharing is currently native only.

## Branded short links

Event, meal-collection and carpool sharing create or reuse an eight-character
code, for example `https://gathergo.events/s/8nQ4xK2p` (illustrative). Link copying,
QR codes and cover-image captions all use that same short URL. The event page
and food-collection page retain separate codes. Existing full-length URLs still
open normally. Codes are generated by the backend, saved once per destination,
and never rotated or reassigned. Sharing waits for a real code, with a retry if
the request fails; no shortened URL is fabricated locally.

Deploy backend migration `20261027160000_short_links` and its API before releasing
the app. The public website can resolve `/s/*` through its shared-link page, or forward
those paths to the backend's public `/s/*` handler for a 302 redirect to the original page. Keep `/api/v1/share-links`
available through the app's configured API origin. Update the public Apple app
association to allow `/s/*`; Android declares the new path and needs a native
rebuild. The app has a matching `/s/[code]` resolver for installed-app navigation
and QR scans. Existing destination access and onboarding checks still apply.

The branded domain could not be resolved from the development environment;
public DNS, hosting forwarding and device app-link association need verification
before the links are live outside the app.


## Public web participation

The companion initiative website serves shared event, carpool and meal links.
Tickets, registrations, donations and volunteer applications can be completed
there after email verification. The backend keeps these on the same participant
identity, so verified app signup or Google sign-in with that email retains the
activity. Web sessions cannot access native-only APIs.

Web food-bank donations issue donation receipts without reserving meals. Native
meal claims remain free, and native donations retain the existing single-pass
rules. Carpool participation and event Live remain in GatherGo.

The root navigator remembers an incoming event, meal, carpool or short-link
destination until sign-in, profile setup and preferences finish. Public Live
URLs open the native event feed. Installation does not itself preserve a browser
URL: users can reopen the shared or confirmation link after installing.

Deploy the companion public-web backend migration and configure release app-link
association on gathergo.events before releasing these links. Store buttons on the
website stay unavailable until real listing URLs are configured. Run the focused
handoff checks with `node --test tests/incoming-share-route.test.cjs`.

## Account cache isolation

Authenticated query clients and persisted caches are scoped to the JWT user ID.
Every sign-in gets a new client lifetime; token refreshes retain the current one.
Central logout cancels queries and removes cached account data, legacy query cache,
credentials and the saved profile. Queued disk writes and responses from an older
session cannot populate the new session. Device appearance and onboarding choices
are retained. Shared-link navigation stays above the session provider boundary.

Run cache and request lifecycle regressions with
`node --test tests/session-isolation.test.cjs`. Startup, Google login, shared-link
and logout UI tests also cover the session boundary.
