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
