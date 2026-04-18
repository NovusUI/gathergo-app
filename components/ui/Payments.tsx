import { usePayments } from "@/hooks/useDashboard";
import ActivityIndicator from "@/components/ui/AppLoader";
import { ChevronDown, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
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
  creatorPayable:number,
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
  console.log(payment.creatorPayable)

  return (
    <View style={tw`p-4 bg-[#1B2A50] rounded-xl gap-3 mb-2`}>
      <View style={tw`flex-row justify-between`}>
        <Text style={tw`text-white text-base font-medium`}>{payment.name}</Text>
        <Text style={tw`text-white text-base font-semibold`}>
          {payment.creatorPayable.toLocaleString("en-NG", {
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

const Payments = ({ title = "Payments", payments: initialPayments }: Props) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    data: paymentsResponse,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    error,
  } = usePayments("", undefined, { enabled: isExpanded });

  // Flatten all payments from all pages
  const allPayments = useMemo(() => {
    if (!paymentsResponse?.pages) return [];
    
    const flattened = paymentsResponse.pages.flatMap((page) => {
      // Log each page to verify structure
      console.log('Page data:', page);
      return page.data || []; // Fallback to empty array if data is undefined
    });
    
    console.log('All payments count:', flattened.length);
    return flattened;
  }, [paymentsResponse]);

  // Debug logging
  useEffect(() => {
    if (isExpanded) {
      console.log('Modal opened, paymentsResponse:', paymentsResponse);
      console.log('All payments:', allPayments);
      console.log('Has next page:', hasNextPage);
      console.log('Is fetching:', isFetching);
      console.log('Error:', error);
    }
  }, [isExpanded, paymentsResponse, allPayments, hasNextPage, isFetching, error]);

  const handleScroll = useCallback(
    (event: any) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const paddingToBottom = 20;

      console.log('Scroll position:', {
        layoutHeight: layoutMeasurement.height,
        offsetY: contentOffset.y,
        contentHeight: contentSize.height,
        hasNextPage,
        isFetchingNextPage
      });

      if (
        hasNextPage &&
        layoutMeasurement.height + contentOffset.y >=
          contentSize.height - paddingToBottom &&
        !isFetchingNextPage &&
        !isLoading &&
        !isFetching
      ) {
        console.log('Fetching next page...');
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isFetching]
  );

  const initialDisplayPayments = initialPayments.slice(0, 3);
  const hasMorePayments = initialPayments.length > 3;

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
              <Text style={tw`text-white text-xl font-bold`}>
                All Payments ({allPayments.length})
              </Text>
              <TouchableOpacity onPress={() => setIsExpanded(false)}>
                <X color="white" size={24} />
              </TouchableOpacity>
            </View>

            {/* Error Display */}
            {error && (
              <View style={tw`bg-red-500/20 p-4 m-4 rounded-lg`}>
                <Text style={tw`text-red-500 text-center`}>
                  Error loading payments: {error.message}
                </Text>
              </View>
            )}

            {/* Payments List */}
            <ScrollView
              ref={scrollViewRef}
              style={tw`flex-1 px-4`}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={400}
            >
              <View style={tw`gap-2 pb-4`}>
                {allPayments.length === 0 && !isLoading && !isFetching ? (
                  <View style={tw`py-8`}>
                    <Text style={tw`text-white text-center`}>No payments found</Text>
                  </View>
                ) : (
                  allPayments.map((payment, index) => (
                    <PaymentCard
                      key={`${payment.id}-${index}`}
                      payment={payment}
                    />
                  ))
                )}

                {(isLoading || isFetchingNextPage) && (
                  <View style={tw`py-8`}>
                    <ActivityIndicator tone="accent" size="large" />
                    <Text style={tw`text-white text-center mt-2`}>
                      {isLoading ? 'Loading payments...' : 'Loading more...'}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Bottom indicator when there's more data */}
            {hasNextPage && !isFetchingNextPage && allPayments.length > 0 && (
              <View style={tw`py-2 items-center border-t border-gray-700`}>
                <Text style={tw`text-gray-400 text-sm`}>
                  Scroll for more payments
                </Text>
              </View>
            )}
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

      {!initialPayments?.length ? (
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
