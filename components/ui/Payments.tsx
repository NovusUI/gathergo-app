import { usePayments } from "@/hooks/useDashboard";
import { ChevronDown, X } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";
import CustomView from "../View";

interface Payment {
  id: string;
  name: string;
  amount: number;
  time: string;
  date: string;
  event: string;
}

interface Props {
  title?: string;
  payments: Payment[];
  getMore?: () => Promise<void> | void;
  loading?: boolean;
}

const PaymentCard = ({ payment }: { payment: Payment }) => {
  return (
    <View style={tw`p-4 bg-[#1B2A50] rounded-xl gap-3 mb-2`}>
      <View style={tw`flex-row justify-between`}>
        <Text style={tw`text-white text-base font-medium`}>{payment.name}</Text>
        <Text style={tw`text-white text-base font-semibold`}>
          {payment.amount.toLocaleString("en-NG", {
            style: "currency",
            currency: "NGN",
          })}
        </Text>
      </View>
      <View style={tw`flex-row justify-between`}>
        <View style={tw`flex-row gap-2`}>
          <Text style={tw`text-gray-400 text-sm`}>{payment.time}</Text>
          <Text style={tw`text-gray-400 text-sm`}>{payment.date}</Text>
        </View>
        <View style={tw`flex-row gap-2`}>
          <Text
            style={tw`text-[#5669FF] underline text-sm`}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {payment.event}
          </Text>
        </View>
      </View>
    </View>
  );
};

const Payments = ({ title = "Payments", payments }: Props) => {
  const scrollViewRef = useRef<ScrollView>(null);

  const [isExpanded, setIsExpanded] = useState(false);

  const {
    paymenetsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
  } = usePayments("", undefined, { enabled: isExpanded });

  const paymentsData = useMemo(
    () => paymenetsData?.pages.flatMap((page) => page.data),
    [paymenetsData]
  );

  const handleScroll = useCallback(
    (event: any) => {
      const { layoutMeasurement, contentOffset, contentSize } =
        event.nativeEvent;
      const paddingToBottom = 20;

      if (
        hasNextPage &&
        layoutMeasurement.height + contentOffset.y >=
          contentSize.height - paddingToBottom &&
        !isFetchingNextPage &&
        !isLoading &&
        !isFetching
      ) {
        fetchNextPage();
      }
    },
    [fetchNextPage, isFetchingNextPage, isLoading, isFetching]
  );

  const initialDisplayPayments = payments.slice(0, 3);
  const hasMorePayments = payments.length > 3;

  if (isExpanded) {
    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={isExpanded}
        onRequestClose={() => setIsExpanded(false)}
      >
        <SafeAreaView style={tw`flex-1 bg-[#01082E]`}>
          <View style={tw`flex-1`}>
            {/* Header */}
            <View
              style={tw`flex-row items-center justify-between p-4 border-b border-[#5669FF]`}
            >
              <Text style={tw`text-white text-xl font-bold`}>All Payments</Text>
              <TouchableOpacity onPress={() => setIsExpanded(false)}>
                <X color="white" size={24} />
              </TouchableOpacity>
            </View>

            {/* Payments List */}
            <ScrollView
              ref={scrollViewRef}
              style={tw`flex-1 px-4`}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={400}
            >
              <View style={tw`gap-2 pb-4`}>
                {paymentsData.map((payment, index) => (
                  <PaymentCard
                    key={`${payment.id}-${index}`}
                    payment={payment}
                  />
                ))}

                {(isLoading || isFetchingNextPage) && (
                  <View style={tw`py-8`}>
                    <ActivityIndicator size="large" color="#5669FF" />
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <CustomView style={tw`rounded-xl bg-[#031542] flex-1 p-5`}>
      <View style={tw``}>
        <Text style={tw`text-white text-lg font-bold mb-4`}>{title}</Text>
      </View>

      {!payments?.length ? (
        <View style={tw``}>
          <Text style={tw`text-white text-center`}>No payments yet</Text>
        </View>
      ) : (
        <View style={tw``}>
          <View style={tw`gap-2`}>
            {initialDisplayPayments.map((payment, index) => (
              <PaymentCard key={`${payment.id}-${index}`} payment={payment} />
            ))}
          </View>

          {hasMorePayments && (
            <TouchableOpacity
              onPress={() => setIsExpanded(true)}
              style={tw`flex-row items-center justify-center mt-4 pt-4 border-t border-gray-700`}
            >
              <ChevronDown color="#5669FF" size={20} />
              <Text style={tw`text-[#5669FF] ml-2`}>View all payments</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </CustomView>
  );
};

export default Payments;
