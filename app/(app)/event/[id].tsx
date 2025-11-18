// EventPage.tsx
import AvatarWithLabel from "@/components/AvatarWithLabel";
import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import CustomView from "@/components/View";
import CustomButton from "@/components/buttons/CustomBtn1";
import PricingCard from "@/components/eventInfo/TicketCard";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { EventDetails } from "@/components/ui/EventDetails";
import { useAuth } from "@/context/AuthContext";
import { useGetTickets, useRegisterEvent } from "@/services/mutations";
import { useEventDetails } from "@/services/queries";
import { GetTickets } from "@/types/event";
import { formatEventDateTime } from "@/utils/dateTimeHandler";
import {
  showGlobalError,
  showGlobalSuccess,
  showGlobalWarning,
} from "@/utils/globalErrorHandler";
import { numberWithCommas } from "@/utils/utils";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Calendar,
  Edit2Icon,
  MapIcon,
  Share2Icon,
  Ticket,
} from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { usePaystack } from "react-native-paystack-webview";
import tw from "twrnc";

const EventPage = () => {
  const { id } = useLocalSearchParams(); // eventId
  const { user } = useAuth();

  const eventId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();

  const [ticketTotal, setTicketTotal] = useState(0);
  const [selectedTickets, setSelectedTickets] = useState<GetTickets[]>([]);

  const handleTicketSelection = (
    ticketId: string,
    ticketName: string,
    price: number,
    change: number
  ) => {
    setTicketTotal((prev) => prev + price * change);

    setSelectedTickets((prevTickets) => {
      const existingTicket = prevTickets.find(
        (ticket) => ticket.id === ticketId
      );

      if (existingTicket) {
        const updatedTickets = prevTickets
          .map((ticket) =>
            ticket.id === ticketId
              ? { ...ticket, quantity: ticket.quantity + change }
              : ticket
          )
          .filter((ticket) => ticket.quantity > 0); // Remove if quantity is 0
        return updatedTickets;
      }

      if (change > 0) {
        return [...prevTickets, { id: ticketId, ticketName, quantity: change }];
      }

      return prevTickets;
    });
  };

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["100%"], []);
  const openSheet = useCallback(() => {
    // BottomSheetModal: present / dismiss
    bottomSheetRef.current?.present?.();
    // fallback to snapToIndex if present isn't available
    bottomSheetRef.current?.snapToIndex?.(1);
  }, []);

  const { data, isPending, isError } = useEventDetails(eventId);

  const { mutateAsync, isPending: gettingTickets } = useGetTickets({
    onSuccess: (data) => {
      showGlobalSuccess("initiation successful");
      if (data.data.paymentUrl) {
        if (data.data.freeTickets.length > 0)
          showGlobalSuccess("Free tickets created.. initializing paystack", 10);

        if (user?.email) {
          popup.newTransaction({
            email: user?.email,
            amount: data.data.totalAmount,
            reference: data.data.transactionId,
            onSuccess: () => {
              showGlobalSuccess("Transaction successful");
              router.push(`/transaction/${data.data.transactionId}`);
            },
            onCancel: () => {
              showGlobalWarning("cancelled");
            },
            onError: (e) => {
              showGlobalError("error");
              console.error(e);
            },
          });
        }
      } else {
        router.push(`/transaction/${data.data.transactionId}`);
      }
    },
    onError: (error) => {
      console.log(error);
      showGlobalError("Error initiating transaction");
    },
  });

  const { popup } = usePaystack();

  const { mutateAsync: registerEvent, isPending: registeringEvent } =
    useRegisterEvent({
      onSuccess: (data) => {
        showGlobalSuccess("initiation successful");
        if (data.data.paymentUrl) {
          if (user?.email) {
            popup.newTransaction({
              email: user?.email,
              amount: data.data.totalAmount,
              reference: data.data.transactionId,
              onSuccess: () => {
                showGlobalSuccess("Transaction successful");
                router.push(`/transaction/${data.data.transactionId}`);
              },
              onCancel: () => {
                showGlobalWarning("cancelled");
              },
              onError: (e) => {
                showGlobalError("error");
                console.log(e);
              },
            });
          }
        } else {
          router.push(`/transaction/${data.data.transactionId}`);
        }
      },
      onError: (error) => {
        console.log(error);
        showGlobalError("Error initiating transaction");
      },
    });

  const handleTransaction = async (isRegistration?: boolean) => {
    if (isRegistration) {
      await registerEvent(eventId);
      return;
    }
    if (selectedTickets.length > 0) console.log(selectedTickets);
    await mutateAsync(selectedTickets);
  };

  // Skeleton UI for loading
  if (isPending) {
    return (
      <View style={tw`flex-1 pt-10 bg-[#01082E]`}>
        <CustomView className={`px-3`}>
          <CustomeTopBarNav
            title="Event Details"
            onClickBack={() => router.replace("/")}
          />
        </CustomView>
        <ScrollView>
          <View style={tw`bg-gray-700 h-60 w-full`} />
          <View style={tw`py-2 px-5`}>
            <View style={tw`bg-gray-700 h-6 w-3/4 mb-4 rounded`} />
            <View style={tw`bg-gray-700 h-4 w-full mb-2 rounded`} />
            <View style={tw`bg-gray-700 h-4 w-5/6 rounded`} />
          </View>
          <View style={tw`bg-[#1B2A50]/40 h-2 my-3`} />
          <View style={tw`py-2 px-5`}>
            <View style={tw`bg-gray-700 h-5 w-1/2 mb-4 rounded`} />
            {[1, 2, 3, 4].map((_, i) => (
              <View key={i} style={tw`flex-row items-center mb-4`}>
                <View style={tw`bg-gray-700 h-8 w-8 rounded-full`} />
                <View style={tw`ml-3`}>
                  <View style={tw`bg-gray-700 h-4 w-32 mb-2 rounded`} />
                  <View style={tw`bg-gray-700 h-3 w-24 rounded`} />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={tw`py-5 px-5`}>
          <View style={tw`bg-gray-700 h-12 w-full rounded`} />
        </View>
      </View>
    );
  }

  // Error / Not Found Fallback
  if (isError || !data) {
    const isNotFound = data?.status_code === 404;
    return (
      <View style={tw`flex-1 bg-[#01082E] items-center justify-center px-5`}>
        <Ionicons name="alert-circle-outline" size={60} color="#FF5555" />
        <Text style={tw`text-white text-xl mt-4`}>
          {isNotFound ? "Event not found" : "Something went wrong"}
        </Text>
        <CustomButton
          title="Go Back"
          onPress={() => router.replace("/")}
          buttonClassName="bg-[#0FF1CF] mt-6 w-full max-w-[300px]"
          textClassName="!text-black"
        />
      </View>
    );
  }

  // Extract Event Data
  const {
    title,
    description,
    imageUrl,
    startDate,
    endDate,
    location,
    eventTickets,
    creator,
    registrationFee,
    registrationType,
  } = data.data;

  const eventDateTime = formatEventDateTime(startDate, endDate);

  return (
    <View style={tw`flex-1 pt-10 pb-5 bg-[#01082E] items-center w-full`}>
      <CustomView style={tw`flex-1`}>
        <CustomView style={tw`px-3`}>
          <CustomeTopBarNav
            title="Event Details"
            onClickBack={() => router.replace("/")}
          />
        </CustomView>

        <TouchableOpacity style={tw`absolute right-5 top-10 z-20`}>
          <Image
            style={{ width: 35, height: 35 }}
            source={require("../../../assets/images/fire.png")}
          />
        </TouchableOpacity>

        <ScrollView
          style={tw`w-full`}
          contentContainerStyle={tw`max-w-[500px]`}
        >
          {imageUrl ? (
            <Image
              source={imageUrl}
              style={{ width: "100%", height: 240 }}
              cachePolicy="disk"
              transition={400}
              contentFit="cover"
            />
          ) : (
            <View
              style={tw`flex-1 items-center justify-center bg-gray-300 h-60`}
            >
              <Ionicons name="image-outline" size={40} color="gray" />
              <Text style={tw`text-gray-500 mt-2`}>No cover picture</Text>
            </View>
          )}

          <CustomView style={tw`py-2 px-5`}>
            <Text style={tw`text-white text-lg font-bold`}>{title}</Text>
          </CustomView>

          <CustomView style={tw`bg-[#1B2A50]/40 h-2`} />

          <CustomView style={tw`py-2 px-5`}>
            <View style={tw`gap-3`}>
              <Text style={tw`uppercase text-white`}>About this event</Text>
              <Text style={tw`text-white`}>{description}</Text>
            </View>
          </CustomView>

          <CustomView style={tw`bg-[#1B2A50]/40 h-2`} />

          <CustomView style={tw`py-2 px-5`}>
            <Text style={tw`uppercase text-white`}>event details</Text>

            <View style={tw`ml-3 mt-5`}>
              <View style={tw`flex-row items-center mb-4`}>
                <Calendar color="white" />
                <View style={tw`ml-3 flex-1`}>
                  <EventDetails title="date & time" subtitle={eventDateTime} />
                </View>
              </View>

              <View style={tw`flex-row items-center mb-4`}>
                <MapIcon color="white" />
                <View style={tw`ml-3 flex-1`}>
                  <EventDetails title="Location" subtitle={location} />
                </View>
              </View>

              <View style={tw`flex-row items-center mb-4`}>
                <Ticket color="white" />
                <View style={tw`ml-3 flex-1`}>
                  {registrationType === "ticket" &&
                  eventTickets &&
                  eventTickets.length > 0 ? (
                    <EventDetails
                      title="Tickets"
                      subtitle={
                        eventTickets?.length
                          ? (() => {
                              const prices = eventTickets
                                .map((t) => t.price)
                                .filter(
                                  (p): p is number => p != null && !isNaN(p)
                                );

                              if (prices.length === 0) {
                                return "No valid ticket prices";
                              }

                              const minPrice = Math.min(...prices);
                              const maxPrice = Math.max(...prices);

                              if (minPrice === 0 && maxPrice === 0) {
                                return "Free";
                              }

                              return `${
                                eventTickets.length
                              } Types, ${numberWithCommas(
                                minPrice,
                                true,
                                null
                              )} - ${numberWithCommas(maxPrice, true, null)}`;
                            })()
                          : "No tickets available"
                      }
                    />
                  ) : registrationType === "registration" ? (
                    <EventDetails
                      title="Registration"
                      subtitle={
                        registrationFee && registrationFee > 0
                          ? `${numberWithCommas(registrationFee, true, null)}`
                          : "Free RSVP event"
                      }
                    />
                  ) : null}
                </View>
              </View>

              <View style={tw`flex-row items-center mb-4`}>
                <Share2Icon color="white" />
                <View style={tw`ml-3 flex-1`}>
                  <EventDetails title="Share" subtitle="Send to friend." />
                </View>
              </View>
            </View>
          </CustomView>

          <CustomView style={tw`bg-[#1B2A50]/40 h-2`} />
        </ScrollView>

        <View style={tw`py-5`}>
          <View
            style={tw`px-5 w-full max-w-[500px] flex-row justify-between items-center`}
          >
            <AvatarWithLabel
              imageUrl={creator.profilePicUrlTN}
              username={creator.username}
              role="Organizer"
            />
            {user?.id !== creator.id && (
              <TouchableOpacity style={tw`p-3 rounded-lg bg-[#0c1447]`}>
                <Text style={tw`text-white`}>Follow</Text>
              </TouchableOpacity>
            )}
            {user?.id === creator.id && (
              <TouchableOpacity
                style={tw`p-3 rounded-lg`}
                onPress={() => router.push(`/event/edit/${eventId}`)}
              >
                <Edit2Icon color="#0FF1CF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {registrationType === "ticket" ? (
          <View style={tw`px-5 w-full max-w-[500px]`}>
            <CustomButton
              onPress={openSheet}
              buttonClassName="bg-[#0FF1CF] border-0 w-full max-w-[500px]"
              textClassName="!text-black"
              arrowCircleColor="bg-[#0C7F7F]"
              title="View tickets"
            />
          </View>
        ) : (
          <View style={tw`px-5 w-full max-w-[500px]`}>
            <CustomButton
              onPress={() => handleTransaction(true)}
              disabled={registeringEvent}
              buttonClassName="bg-[#0FF1CF] border-0 w-full max-w-[500px]"
              textClassName="!text-black"
              arrowCircleColor="bg-[#0C7F7F]"
              title={
                registeringEvent
                  ? "Registering"
                  : registrationFee && registrationFee > 0
                  ? `Register - ${numberWithCommas(
                      registrationFee,
                      true,
                      null
                    )}`
                  : "Register Now"
              }
            />
          </View>
        )}
      </CustomView>

      {/* BottomSheet for Tickets */}
      <BottomSheet
        index={-1}
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={0}
            appearsOnIndex={1}
          />
        )}
        backgroundStyle={{ backgroundColor: "#01082E" }}
      >
        <View style={tw`flex-row justify-between items-center p-5`}>
          <Text style={tw`text-white`}>BUY TICKET</Text>
          <AnimatedNumber value={ticketTotal} />
        </View>

        <BottomSheetScrollView style={tw`p-5`}>
          <View style={tw`py-5`}>
            {eventTickets?.map((ticket, index) => (
              <PricingCard
                key={index}
                onQuantityChange={(change) =>
                  handleTicketSelection(
                    ticket.id,
                    ticket.type,
                    ticket.updatedPrice || ticket.price || 0,
                    change
                  )
                }
                title={ticket.type}
                price={ticket.price}
                description={ticket.description}
                perks={ticket.perks}
                ticketQuantity={ticket.quantity}
                sold={ticket.sold}
                isVisible={ticket.isVisible}
                updatedPrice={ticket.updatedPrice}
              />
            ))}
          </View>
        </BottomSheetScrollView>

        <View style={tw`w-full max-w-[500px] p-5`}>
          <CustomButton
            onPress={() => handleTransaction(false)}
            disabled={selectedTickets.length === 0 || gettingTickets}
            title={`${gettingTickets ? "initiating..." : "buy tickets"}`}
            buttonClassName="bg-[#0FF1CF] w-full border-0"
            textClassName="!text-black"
            showArrow={false}
          />
        </View>
      </BottomSheet>
    </View>
  );
};

export default EventPage;
