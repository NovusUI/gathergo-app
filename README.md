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

The creation chooser offers Create an event and Create a fundraiser. In event
setup, Volunteering unlocks only after a physical event has non-empty impact
story text. The volunteer-only option then removes ticket and attendee
registration requirements. Roles can also be added alongside tickets or
registration. An impact title alone does not unlock volunteering, and fundraisers
must add a story too. Attempts to add volunteers first show a reminder.
Role creation and editing open a bottom sheet in the event draft and organiser
management. Draft roles change only on Save; organiser saves use the role API.
Each role has its own capacity and organiser approval setting. Optional donations are available only
for volunteer-only events; fundraisers keep their donation setup. The form
displays naira and sends donation amounts in kobo.
The update API keeps an omitted target; switching donations off removes it.

The Give your time card opens volunteer roles for ticket, registration and
donation events, keeping the main action focused on event participation.
Volunteer-only events keep a full-width primary Volunteer action. Organisers open
volunteer management from the people icon beside Edit, and the feed header includes a
compact Volunteer action. The Give your time card and Volunteer actions open a
sheet of roles, where participants can apply, join or withdraw. Roles load when
the sheet opens.
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
Unpublished ticket sheets omit totals and checkout controls. Scanner guidance,
wallet setup reminders, logout confirmation and Circle's coming-soon page also
use Gogo. Event search uses the small loader just below the search bar.
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
chat, image uploads and web views share this loader. AppRefreshControl retains
the native pull gesture and refresh callback, with Gogo in the content header
while refreshing.

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

Startup uses assets/mascot/gogo-startup.svg: the three rings become Gogo, who
pops up and waves. GogoStartupArtwork and useGogoStartupMotion reproduce its
5.6-second animation natively. It plays once after the startup view lays out;
navigation waits for the sequence, auth restoration and store hydration. Reduced
motion shows the finished pose immediately. Later page loaders are unchanged.

The native launch screen uses a still frame of the same artwork at 240 points
on white, configured through expo-splash-screen. Native asset changes require
a new app build and installation; restarting Metro or sending an OTA update
will not update them.
