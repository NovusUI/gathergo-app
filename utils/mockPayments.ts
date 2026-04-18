// utils/mockPayments.ts

export interface Payment {
  id: string;
  name: string;
  amount: number;
  time: string;
  date: string;
  event: string;
}

// Mock event names
const eventNames = [
  "Tech Conference 2024",
  "Music Festival",
  "Charity Gala",
  "Business Summit",
  "Art Exhibition",
  "Sports Tournament",
  "Workshop Series",
  "Annual Meetup",
  "Product Launch",
  "Networking Event",
];

// Mock payment names (combinations of first and last names)
const firstNames = [
  "John",
  "Sarah",
  "Michael",
  "Emma",
  "David",
  "Lisa",
  "James",
  "Maria",
  "Robert",
  "Jennifer",
];
const lastNames = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
];

// Generate random date within the last 30 days
const generateRandomDate = (): { date: string; time: string } => {
  const now = new Date();
  const pastDate = new Date();
  pastDate.setDate(now.getDate() - Math.floor(Math.random() * 30));

  const date = pastDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Generate random time between 9 AM and 9 PM
  const hour = Math.floor(Math.random() * 12) + 9;
  const minute = Math.floor(Math.random() * 60)
    .toString()
    .padStart(2, "0");
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour;

  const time = `${displayHour}:${minute} ${ampm}`;

  return { date, time };
};

// Generate a single mock payment
export const generateMockPayment = (index: number): Payment => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const event = eventNames[Math.floor(Math.random() * eventNames.length)];
  const { date, time } = generateRandomDate();

  return {
    id: `payment-${index + 1}`,
    name: `${firstName} ${lastName}`,
    amount: Math.floor(Math.random() * 1000) + 50, // Amount between 50 and 1050
    time,
    date,
    event,
  };
};

// Generate multiple mock payments
export const generateMockPayments = (count: number): Payment[] => {
  return Array.from({ length: count }, (_, index) =>
    generateMockPayment(index)
  );
};

// Simulate API call with delay
export const fetchMockPayments = async (
  page: number = 1,
  pageSize: number = 10
): Promise<Payment[]> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const startIndex = (page - 1) * pageSize;
  const payments = Array.from({ length: pageSize }, (_, i) =>
    generateMockPayment(startIndex + i)
  );

  return payments;
};
