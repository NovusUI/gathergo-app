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
    iconName: "tram-outline",
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

export const getCarpoolVehicleOption = (vehicleIcon?: string | null) =>
  CARPOOL_VEHICLE_OPTIONS.find((option) => option.key === vehicleIcon) ?? null;

export const getCarpoolPassengerMessage = (vehicleIcon?: string | null) => {
  switch (vehicleIcon) {
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

export const getRandomCarpoolVehicleIcon = (seed: string) => {
  const hash = Array.from(seed).reduce(
    (total, char) => total + char.charCodeAt(0),
    0
  );

  return CARPOOL_VEHICLE_OPTIONS[hash % CARPOOL_VEHICLE_OPTIONS.length];
};
