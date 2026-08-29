import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export const CARPOOL_VEHICLE_OPTIONS = [
  {
    key: "sport_car",
    label: "Sport car",
    iconName: "car-sport-outline",
  },
  {
    key: "city_car",
    label: "City car",
    iconName: "car-outline",
  },
  {
    key: "party_bus",
    label: "Party bus",
    iconName: "bus-outline",
  },
  {
    key: "bus",
    label: "Classic bus",
    iconName: "bus-outline",
  },
  {
    key: "monster_truck",
    label: "Monster truck",
    iconName: "bus-outline",
  },
  {
    key: "food_truck",
    label: "Food truck",
    iconName: "bus-outline",
  },
  {
    key: "mystery_machine",
    label: "Mystery machine",
    iconName: "bus-outline",
  },
  {
    key: "go_kart",
    label: "Go-kart",
    iconName: "car-sport-outline",
  },
  {
    key: "moon_buggy",
    label: "Moon buggy",
    iconName: "car-sport-outline",
  },
  {
    key: "bicycle",
    label: "Bicycle",
    iconName: "bicycle-outline",
  },
  {
    key: "speed_boat",
    label: "Speed boat",
    iconName: "boat-outline",
  },
  {
    key: "boat",
    label: "Boat",
    iconName: "boat-outline",
  },
  {
    key: "pirate_ship",
    label: "Pirate ship",
    iconName: "boat-outline",
  },
  {
    key: "hovercraft",
    label: "Hovercraft",
    iconName: "boat-outline",
  },
  {
    key: "helicopter",
    label: "Helicopter",
    iconName: "airplane-outline",
  },
  {
    key: "stunt_plane",
    label: "Stunt plane",
    iconName: "airplane-outline",
  },
  {
    key: "midnight_train",
    label: "Midnight train",
    iconName: "train-outline",
  },
  {
    key: "ghost_tram",
    label: "Ghost tram",
    iconName: "train-outline",
  },
  {
    key: "subway_beast",
    label: "Subway beast",
    iconName: "subway-outline",
  },
  {
    key: "airplane",
    label: "Airplane",
    iconName: "airplane-outline",
  },
  {
    key: "rocket",
    label: "Spaceship",
    iconName: "rocket-outline",
  },
] as const satisfies readonly {
  key: string;
  label: string;
  iconName: IoniconName;
}[];

export type CarpoolVehicleIconKey =
  (typeof CARPOOL_VEHICLE_OPTIONS)[number]["key"];

export interface CarpoolVibeSafetyTip {
  iconName: IoniconName;
  title: string;
  body: string;
}

export interface CarpoolVibeSafetySignal {
  title: string;
  passengerAction: string;
  driverAction: string;
  description: string;
}

export interface CarpoolVibeSafetyRoleCopy {
  description: string;
  emptyChatBody: string;
  emptyChatTitle: string;
  modalInstruction: string;
  primarySignalLabel: string;
  primarySignalValue: string;
  secondarySignalLabel: string;
  secondarySignalValue: string;
}

export const normalizeCarpoolVehicleIconKey = (vehicleIcon?: string | null) => {
  if (!vehicleIcon) return null;

  const normalized = vehicleIcon
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  const option = CARPOOL_VEHICLE_OPTIONS.find(
    (item) =>
      item.key === normalized ||
      item.label.toLowerCase().replace(/[\s-]+/g, "_") === normalized
  );

  return option?.key ?? null;
};

export const getCarpoolVehicleOption = (vehicleIcon?: string | null) => {
  const normalizedKey = normalizeCarpoolVehicleIconKey(vehicleIcon);

  return (
    CARPOOL_VEHICLE_OPTIONS.find((option) => option.key === normalizedKey) ??
    null
  );
};

export const getCarpoolPassengerMessage = (vehicleIcon?: string | null) => {
  switch (normalizeCarpoolVehicleIconKey(vehicleIcon)) {
    case "sport_car":
      return "The pooler picked a sport car vibe, so expect a ride that thinks every turn deserves its own soundtrack.";
    case "city_car":
      return "The pooler went with city car energy. Clean, practical, and very much 'we know exactly where we're going.'";
    case "party_bus":
      return "Party bus mode is on, so this ride is bringing full pre-event group chat energy.";
    case "bus":
      return "Classic bus means roomy, reliable, and ready to carry the crew without any drama.";
    case "monster_truck":
      return "Monster truck is a bold choice. Translation: this pickup plans to be impossible to miss.";
    case "food_truck":
      return "Food truck energy means this ride is arriving with flavor, chaos, and suspiciously good vibes.";
    case "mystery_machine":
      return "The pooler picked the Mystery Machine, so yes, this ride comes with full Scooby-Doo energy.";
    case "go_kart":
      return "Go-kart means the pooler is leaning playful, quick, and a little competitive about getting there first.";
    case "moon_buggy":
      return "Moon buggy selected. Very adventurous. Mildly unhinged. Somehow still a valid transportation mood.";
    case "bicycle":
      return "Bicycle vibe says this pooler likes things light, simple, and just the right amount of wholesome.";
    case "speed_boat":
      return "Speed boat energy means the pooler is not here for slow entrances or boring arrivals.";
    case "boat":
      return "Boat mode keeps it calm and steady. Smooth crossing, no panic, just show up and float with it.";
    case "pirate_ship":
      return "Pirate ship chosen. This ride is clearly operating under 'arrive loud, leave legendary' rules.";
    case "hovercraft":
      return "Hovercraft is the pooler's way of saying regular roads are only a suggestion.";
    case "helicopter":
      return "Helicopter energy means the pooler wants the whole thing to feel a little more premium than necessary.";
    case "stunt_plane":
      return "Stunt plane is pure showmanship. Expect dramatic timing and a pooler who enjoys a memorable entrance.";
    case "midnight_train":
      return "Midnight train sets the mood nicely. A little cinematic, a little mysterious, and very locked in.";
    case "ghost_tram":
      return "Ghost tram is strange in exactly the right way. Quietly iconic, slightly eerie, and impossible to forget.";
    case "subway_beast":
      return "Subway beast means this ride is embracing big-city momentum with zero patience for moving slowly.";
    case "airplane":
      return "Airplane picked. The pooler is thinking efficient, committed, and fully ready for takeoff.";
    case "rocket":
      return "Spaceship mode means the pooler has absolutely no intention of making an ordinary arrival.";
    default:
      return "The pooler has not picked a ride vibe yet. Once they do, it will show up here.";
  }
};

interface CarpoolVibeChatContext {
  pickupLocation?: string | null;
  destination?: string | null;
  departureTime?: string | null;
}

const getRideChatDetail = (
  value: string | null | undefined,
  fallback: string
) => {
  const trimmed = value?.trim();

  return trimmed || fallback;
};

// Future pin: grow vibe copy into engagement prompts, riddles, fun facts, and small ride games.
export const getCarpoolVibeChatMessages = (
  vehicleIcon?: string | null,
  context: CarpoolVibeChatContext = {}
) => {
  const normalizedKey = normalizeCarpoolVehicleIconKey(vehicleIcon);
  const pickupLocation = getRideChatDetail(
    context.pickupLocation,
    "the pickup spot"
  );
  const destination = getRideChatDetail(context.destination, "the destination");
  const departureTime = context.departureTime?.trim();
  const pickupAtTime = departureTime
    ? `${pickupLocation} at ${departureTime}`
    : `${pickupLocation} once timing is set`;
  const timeLabel = departureTime || "departure time";

  switch (normalizedKey) {
    case "sport_car":
      return [
        `Sport car mode: launch from ${pickupAtTime}. Main-character arrival loading.`,
        `Fast route toward ${destination}. Drop pickup notes before the engine warms up.`,
        `Sharp timing, sharper coordination. ${timeLabel} is the moment to beat.`,
      ];
    case "city_car":
      return [
        `City car energy: ${pickupAtTime}, then a clean cruise to ${destination}.`,
        `Practical ride, tidy plan. Keep ${pickupLocation} drama-free.`,
        `Low-drama timing check: ${timeLabel}. Everyone gets there without guesswork.`,
      ];
    case "party_bus":
      return [
        `Party bus mode: meet at ${pickupAtTime}. The pre-event lobby is mobile.`,
        `Playlist opinions, pickup timing, and the road to ${destination} all belong here.`,
        `Big crew energy. Keep the ${pickupLocation} roll call warm.`,
      ];
    case "bus":
      return [
        `Classic bus mode: roomy, steady, and rolling from ${pickupAtTime}.`,
        `Drop the ${pickupLocation} pickup plan here so nobody has to play detective.`,
        `Reliable ride energy to ${destination}. Simple updates work beautifully.`,
      ];
    case "monster_truck":
      return [
        `Monster truck mode: subtle? no. Meet at ${pickupAtTime} and make it obvious.`,
        `This pickup has presence. ${pickupLocation} should be just as easy to spot.`,
        `Big ride, big coordination. ${destination} is waiting.`,
      ];
    case "food_truck":
      return [
        `Food truck energy: flavorful route from ${pickupAtTime}.`,
        `This chat accepts pickup notes, snack debates, and the plan for ${destination}.`,
        `Tell the crew where to meet at ${pickupLocation} before someone starts asking about menus.`,
      ];
    case "mystery_machine":
      return [
        `Mystery machine mode: the clue says ${pickupAtTime}.`,
        `No mystery about the destination: ${destination}. Confirm who is already on the way.`,
        `A little playful, a little iconic, fully coordinated for ${timeLabel}.`,
      ];
    case "go_kart":
      return [
        `Go-kart mode: quick roll-out from ${pickupAtTime}.`,
        `Short messages work here. Fast updates, clean arrival at ${destination}.`,
        `Keep the crew in the loop before ${timeLabel} starts feeling like a lap timer.`,
      ];
    case "moon_buggy":
      return [
        `Moon buggy mode: lunar launch from ${pickupAtTime}.`,
        `Destination locked: ${destination}. The vibe is cosmic, the directions should be practical.`,
        `Unusual energy, clear plan. Tell everyone where to stand at ${pickupLocation}.`,
      ];
    case "bicycle":
      return [
        `Bicycle mode: light, simple, and rolling from ${pickupAtTime}.`,
        `Gentle timing updates, clear pickup spot, smooth path to ${destination}.`,
        `Easy ride energy. Keep the ${pickupLocation} notes breezy.`,
      ];
    case "speed_boat":
      return [
        `Speed boat mode: no slow entrance from ${pickupAtTime}.`,
        `Smooth arrival at ${destination} starts with clear chat updates.`,
        `Fast vibe, steady coordination. Anchor the plan at ${pickupLocation}.`,
      ];
    case "boat":
      return [
        `Boat mode: calm departure from ${pickupAtTime}.`,
        `Smooth crossing energy toward ${destination}. Keep everyone floating the same way.`,
        `This chat likes clear plans, relaxed confirmations, and a known ${timeLabel}.`,
      ];
    case "pirate_ship":
      return [
        `Pirate ship mode: crew gathers at ${pickupAtTime}.`,
        `All updates go here before the ride sets sail for ${destination}.`,
        `Bold ride energy. Keep ${pickupLocation} impossible to miss.`,
      ];
    case "hovercraft":
      return [
        `Hovercraft mode: float out from ${pickupAtTime}.`,
        `Regular roads are optional, clear route to ${destination} is not.`,
        `Floaty vibe, firm pickup details at ${pickupLocation}. Best of both worlds.`,
      ];
    case "helicopter":
      return [
        `Helicopter mode: landing-zone clarity at ${pickupAtTime}.`,
        `Premium entrance, precise timing, destination set to ${destination}.`,
        `High-energy pickup at ${pickupLocation}, clean communication. Perfect.`,
      ];
    case "stunt_plane":
      return [
        `Stunt plane mode: dramatic takeoff from ${pickupAtTime}.`,
        `The vibe can loop; the route to ${destination} should not.`,
        `Showmanship is welcome. Confusing directions at ${pickupLocation} are not.`,
      ];
    case "midnight_train":
      return [
        `Midnight train mode: all aboard at ${pickupAtTime}.`,
        `Cinematic ride toward ${destination}, punctual updates only.`,
        `Quietly iconic, very locked in. Keep ${pickupLocation} posted before ${timeLabel}.`,
      ];
    case "ghost_tram":
      return [
        `Ghost tram mode: quietly iconic pickup at ${pickupAtTime}.`,
        `This ride is memorable. Make ${pickupLocation} memorable too.`,
        `Soft mystery, clear timing, destination set to ${destination}.`,
      ];
    case "subway_beast":
      return [
        `Subway beast mode: city momentum from ${pickupAtTime}.`,
        `Fast-moving ride energy toward ${destination}. Keep the chat direct.`,
        `Station-level clarity: ${pickupLocation}, ${timeLabel}, and who is close.`,
      ];
    case "airplane":
      return [
        `Airplane mode: boarding starts at ${pickupAtTime}.`,
        `Gate details go here before takeoff to ${destination}.`,
        `Boarding energy is real. Keep the crew synced for ${timeLabel}.`,
      ];
    case "rocket":
      return [
        `Spaceship mode: countdown begins at ${pickupAtTime}.`,
        `Destination coordinates: ${destination}. Ordinary arrivals have left the chat.`,
        `Big launch energy, tiny margin for vague ${pickupLocation} directions.`,
      ];
    default:
      return [
        `Shared ride energy: meet at ${pickupAtTime}.`,
        `Destination is ${destination}. Timing and pickup notes belong here.`,
        `Keep the crew synced before ${timeLabel} gets the ride moving.`,
      ];
  }
};

export const getCarpoolVibeSafetySignal = (
  vehicleIcon?: string | null
): CarpoolVibeSafetySignal => {
  switch (normalizeCarpoolVehicleIconKey(vehicleIcon)) {
    case "sport_car":
      return {
        title: "Pit stop signal",
        passengerAction: "Pit stop complete",
        driverAction: "Back on track",
        description:
          "Use this once the rider has checked the plate and met the pooler.",
      };
    case "city_car":
      return {
        title: "City signal",
        passengerAction: "At the curb",
        driverAction: "Curb confirmed",
        description: "A quick curbside signal for a calm, practical pickup.",
      };
    case "party_bus":
      return {
        title: "Crew signal",
        passengerAction: "I found the crew",
        driverAction: "Crew member onboard",
        description:
          "A group-friendly signal after the rider verifies the ride.",
      };
    case "bus":
      return {
        title: "Boarding signal",
        passengerAction: "Ready to board",
        driverAction: "Seat saved",
        description: "A simple shared signal for a steady pickup.",
      };
    case "monster_truck":
      return {
        title: "Big rig signal",
        passengerAction: "I see the rig",
        driverAction: "Rig confirmed",
        description: "A bold signal for an easy-to-spot pickup.",
      };
    case "food_truck":
      return {
        title: "Order-up signal",
        passengerAction: "Order ready",
        driverAction: "Pickup served",
        description: "A playful signal once the rider confirms the right ride.",
      };
    case "mystery_machine":
      return {
        title: "Clue signal",
        passengerAction: "Clue matched",
        driverAction: "Case confirmed",
        description:
          "Use it only after the plate, pooler, and pickup spot all match.",
      };
    case "go_kart":
      return {
        title: "Lap signal",
        passengerAction: "At the line",
        driverAction: "Green light",
        description: "A quick signal for a fast, confirmed pickup.",
      };
    case "moon_buggy":
      return {
        title: "Lunar signal",
        passengerAction: "Moon boots on",
        driverAction: "Cabin sealed",
        description: "A cosmic signal after the rider checks the ride details.",
      };
    case "bicycle":
      return {
        title: "Roll-out signal",
        passengerAction: "Ready to roll",
        driverAction: "Rolling together",
        description: "A light signal for a simple, safe meet-up.",
      };
    case "speed_boat":
      return {
        title: "Dock signal",
        passengerAction: "At the dock",
        driverAction: "Dock cleared",
        description: "A fast signal after the rider confirms the pickup.",
      };
    case "boat":
      return {
        title: "Sail signal",
        passengerAction: "Ready to sail",
        driverAction: "Crew aboard",
        description:
          "A calm signal once everyone is sure they found the right ride.",
      };
    case "pirate_ship":
      return {
        title: "Boarding signal",
        passengerAction: "Permission to board",
        driverAction: "Welcome aboard",
        description:
          "A bold signal after the rider checks the plate and pooler.",
      };
    case "hovercraft":
      return {
        title: "Hover signal",
        passengerAction: "Hover point reached",
        driverAction: "Landing confirmed",
        description: "A floaty signal for a very clear pickup point.",
      };
    case "helicopter":
      return {
        title: "Landing signal",
        passengerAction: "Landing zone clear",
        driverAction: "Touchdown confirmed",
        description: "A precise signal after the rider verifies the ride.",
      };
    case "stunt_plane":
      return {
        title: "Runway signal",
        passengerAction: "Runway ready",
        driverAction: "Takeoff cleared",
        description: "A dramatic signal, still grounded in real safety checks.",
      };
    case "midnight_train":
      return {
        title: "All-aboard signal",
        passengerAction: "All aboard",
        driverAction: "Ticket punched",
        description:
          "A cinematic signal once the rider confirms the right pickup.",
      };
    case "ghost_tram":
      return {
        title: "Quiet signal",
        passengerAction: "Platform found",
        driverAction: "Platform confirmed",
        description: "A quiet little signal for a clearly verified pickup.",
      };
    case "subway_beast":
      return {
        title: "Station signal",
        passengerAction: "At the station",
        driverAction: "Train arriving",
        description: "A direct signal for city-speed coordination.",
      };
    case "airplane":
      return {
        title: "Gate signal",
        passengerAction: "At the gate",
        driverAction: "Boarding confirmed",
        description:
          "A tidy signal after the rider checks the ride and pooler.",
      };
    case "rocket":
      return {
        title: "Launch signal",
        passengerAction: "Ready for launch",
        driverAction: "Launch confirmed",
        description:
          "A spacey signal after the rider verifies the plate and pickup.",
      };
    default:
      return {
        title: "Ride signal",
        passengerAction: "Ride found",
        driverAction: "Rider confirmed",
        description:
          "A shared signal after the rider confirms the plate, pooler, and pickup point.",
      };
  }
};

export const getCarpoolVibeSafetyRoleCopy = (
  safetySignal: CarpoolVibeSafetySignal,
  roleLabel?: string | null,
  rideLabel = "Ride"
): CarpoolVibeSafetyRoleCopy => {
  const isPooler = roleLabel?.toLowerCase() === "pooler";

  if (isPooler) {
    return {
      description: `Let each rider say "${safetySignal.passengerAction}" only after they match your ride, plate, and pickup point. Confirm each person with "${safetySignal.driverAction}".`,
      emptyChatBody:
        "Share pickup landmarks, vehicle details, and where riders should stand before the vibe-check.",
      emptyChatTitle: `${rideLabel} crew is waiting`,
      modalInstruction:
        "Let each rider say the signal after they verify your ride details. Confirm them one by one.",
      primarySignalLabel: "Your pooler signal",
      primarySignalValue: safetySignal.driverAction,
      secondarySignalLabel: "Rider says",
      secondarySignalValue: safetySignal.passengerAction,
    };
  }

  return {
    description: `${safetySignal.description} Say "${safetySignal.passengerAction}" only after the plate, pooler, and pickup point match.`,
    emptyChatBody: "Send the first pickup note and get the ride moving.",
    emptyChatTitle: `${rideLabel} chat is quiet`,
    modalInstruction:
      "Say the signal only after the plate, pooler, and pickup point match.",
    primarySignalLabel: "Your rider signal",
    primarySignalValue: safetySignal.passengerAction,
    secondarySignalLabel: "Pooler replies",
    secondarySignalValue: safetySignal.driverAction,
  };
};

export const getCarpoolVibeSafetyTips = (
  vehicleIcon?: string | null
): CarpoolVibeSafetyTip[] => {
  switch (normalizeCarpoolVehicleIconKey(vehicleIcon)) {
    case "sport_car":
      return [
        {
          iconName: "speedometer-outline",
          title: "Fast vibe, slow check",
          body: "Check the plate number, pooler name, and pickup point before you hop in.",
        },
        {
          iconName: "navigate-circle-outline",
          title: "Share the route",
          body: "Open WhatsApp and share live location with someone you trust before the engine warms up.",
        },
        {
          iconName: "chatbubble-ellipses-outline",
          title: "Leave a trace",
          body: "Text a friend the car details and keep pickup updates inside this chat.",
        },
      ];
    case "city_car":
      return [
        {
          iconName: "location-outline",
          title: "Curbside clarity",
          body: "Meet in a visible spot and confirm the plate before stepping in.",
        },
        {
          iconName: "navigate-circle-outline",
          title: "Keep someone posted",
          body: "Use WhatsApp live location so someone you trust can follow the city route.",
        },
        {
          iconName: "shield-checkmark-outline",
          title: "Practical check",
          body: "If the car, pooler, or pickup point feels off, pause and confirm in chat.",
        },
      ];
    case "party_bus":
      return [
        {
          iconName: "people-outline",
          title: "Crew check",
          body: "Confirm the pooler and plate before the group energy takes over.",
        },
        {
          iconName: "navigate-circle-outline",
          title: "Share the party route",
          body: "Use WhatsApp live location so someone outside the ride can follow along.",
        },
        {
          iconName: "chatbox-ellipses-outline",
          title: "Keep it in the chat",
          body: "Use this chat for pickup changes, late arrivals, and who is already onboard.",
        },
      ];
    case "mystery_machine":
      return [
        {
          iconName: "search-outline",
          title: "Solve the first clue",
          body: "The plate number, pooler name, and pickup spot should all match before you board.",
        },
        {
          iconName: "navigate-circle-outline",
          title: "Share the clue trail",
          body: "Send your WhatsApp live location to someone you trust.",
        },
        {
          iconName: "shield-checkmark-outline",
          title: "No mystery boarding",
          body: "If anything feels off, stay visible and confirm details in chat.",
        },
      ];
    case "moon_buggy":
    case "rocket":
      return [
        {
          iconName: "rocket-outline",
          title: "Pre-launch check",
          body: "Confirm the plate, pooler, and pickup point before entering the cabin.",
        },
        {
          iconName: "navigate-circle-outline",
          title: "Send mission control",
          body: "Send mission control your WhatsApp live location before launch.",
        },
        {
          iconName: "chatbubble-ellipses-outline",
          title: "Keep comms open",
          body: "Post pickup changes here so the crew stays synced.",
        },
      ];
    case "pirate_ship":
      return [
        {
          iconName: "boat-outline",
          title: "Permission to board",
          body: "Check the plate and pooler before you accept the ride as yours.",
        },
        {
          iconName: "navigate-circle-outline",
          title: "Share the voyage",
          body: "Share your WhatsApp live location with a trusted person before the ride sets off.",
        },
        {
          iconName: "shield-checkmark-outline",
          title: "Stay on deck",
          body: "Wait somewhere visible until the ride details match.",
        },
      ];
    case "boat":
    case "speed_boat":
    case "hovercraft":
      return [
        {
          iconName: "boat-outline",
          title: "Dock check",
          body: "Confirm the plate, pooler, and pickup point before you set sail.",
        },
        {
          iconName: "navigate-circle-outline",
          title: "Share your crossing",
          body: "Let a trusted person follow your WhatsApp live location while the ride is active.",
        },
        {
          iconName: "chatbubble-ellipses-outline",
          title: "Signal in chat",
          body: "Use this chat if the meeting point changes or the ride is delayed.",
        },
      ];
    case "midnight_train":
    case "ghost_tram":
    case "subway_beast":
      return [
        {
          iconName: "train-outline",
          title: "Platform check",
          body: "Confirm the plate and pooler before you go all aboard.",
        },
        {
          iconName: "navigate-circle-outline",
          title: "Share your line",
          body: "Send your WhatsApp live location to someone you trust before departure.",
        },
        {
          iconName: "shield-checkmark-outline",
          title: "Stay visible",
          body: "Wait in a clear public spot if the ride details do not match yet.",
        },
      ];
    case "airplane":
    case "helicopter":
    case "stunt_plane":
      return [
        {
          iconName: "airplane-outline",
          title: "Gate check",
          body: "Confirm the plate, pooler, and pickup point before boarding.",
        },
        {
          iconName: "navigate-circle-outline",
          title: "Share your flight path",
          body: "Send your WhatsApp live location to a trusted person.",
        },
        {
          iconName: "chatbubble-ellipses-outline",
          title: "Keep the tower updated",
          body: "Put pickup changes and timing updates in chat.",
        },
      ];
    case "bicycle":
    case "go_kart":
      return [
        {
          iconName: "checkmark-circle-outline",
          title: "Roll-out check",
          body: "Confirm the pooler, plate, and pickup point before the ride starts.",
        },
        {
          iconName: "navigate-circle-outline",
          title: "Share your roll",
          body: "Send your WhatsApp live location to a trusted person during pickup.",
        },
        {
          iconName: "shield-checkmark-outline",
          title: "Stay visible",
          body: "Meet somewhere clear and pause if anything feels mismatched.",
        },
      ];
    default:
      return [
        {
          iconName: "car-outline",
          title: "Match the ride",
          body: "Confirm the plate number, pooler name, and pickup point before getting in.",
        },
        {
          iconName: "navigate-circle-outline",
          title: "Share your live location",
          body: "Send WhatsApp live location to someone you trust.",
        },
        {
          iconName: "chatbubble-ellipses-outline",
          title: "Keep pickup in chat",
          body: "Use this chat for timing changes, pickup notes, and quick confirmations.",
        },
      ];
  }
};

export const getRandomCarpoolVehicleIcon = (seed: string) => {
  const hash = Array.from(seed).reduce(
    (total, char) => total + char.charCodeAt(0),
    0
  );

  return CARPOOL_VEHICLE_OPTIONS[hash % CARPOOL_VEHICLE_OPTIONS.length];
};
