// import CustomeTopBarNav from "@/components/CustomeTopBarNav";
// import { useRouter } from "expo-router";
// import { View } from "react-native";
// import tw from "twrnc";

// const Wallet = () => {
//   const router = useRouter();
//   return (
//     <View
//       style={tw`flex-1 bg-[#01082E] flex items-center flex-col pt-10 pb-10 px-5 overflow-hidden w-full`}
//     >
//       <CustomeTopBarNav
//         title="Wallet"
//         onClickBack={() => router.replace("/dashboard")}
//       />
//     </View>
//   );
// };

// export default Wallet;

import Shortcut from "@/components/Shortcut";
import CustomView from "@/components/View";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  PiggyBank,
  Plus,
  Settings,
  Smartphone,
  TrendingUp,
  Wallet as WalletIcon,
  X,
  XCircle,
} from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";

interface WalletBalance {
  availableBalance: number;
  pendingBalance: number;
  totalBalance: number;
  currency: string;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  status: "completed" | "pending" | "failed";
  counterparty: string;
  date: string;
  event?: string;
  color: string;
}

interface PaymentMethod {
  id: string;
  type: "bank" | "card" | "mobile_money";
  provider: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
  color: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: "pending" | "processing" | "completed" | "failed";
  reference: string;
  paymentMethod: string;
  accountNumber: string;
  createdAt: string;
  completedAt?: string;
}

// Mock Data
const MOCK_BALANCE: WalletBalance = {
  availableBalance: 1250000.5,
  pendingBalance: 250000.25,
  totalBalance: 1500000.75,
  currency: "NGN",
};

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    description: "Ticket Sales - Education Fund",
    amount: 500000,
    type: "credit",
    status: "completed",
    counterparty: "Multiple Buyers",
    date: "2024-01-25T10:30:00Z",
    event: "Education Fund",
    color: "#0FF1CF",
  },
  {
    id: "2",
    description: "Donation - Feed500",
    amount: 150000,
    type: "credit",
    status: "completed",
    counterparty: "John Doe",
    date: "2024-01-24T14:45:00Z",
    event: "Feed500",
    color: "#5669FF",
  },
  {
    id: "3",
    description: "Bank Transfer Fee",
    amount: 5000,
    type: "debit",
    status: "completed",
    counterparty: "Zenith Bank",
    date: "2024-01-23T09:15:00Z",
    color: "#FF5757",
  },
  {
    id: "4",
    description: "Registration Fees - Medical Aid",
    amount: 75000,
    type: "credit",
    status: "completed",
    counterparty: "Multiple Registrants",
    date: "2024-01-22T16:20:00Z",
    event: "Medical Aid",
    color: "#FF932E",
  },
  {
    id: "5",
    description: "Withdrawal Request",
    amount: 200000,
    type: "debit",
    status: "pending",
    counterparty: "GT Bank",
    date: "2024-01-21T11:00:00Z",
    color: "#FFC107",
  },
  {
    id: "6",
    description: "Ticket Sales - VIP Access",
    amount: 300000,
    type: "credit",
    status: "completed",
    counterparty: "Corporate Group",
    date: "2024-01-20T13:30:00Z",
    event: "VIP Event",
    color: "#9D4EDD",
  },
  {
    id: "7",
    description: "Failed Transaction",
    amount: 50000,
    type: "debit",
    status: "failed",
    counterparty: "Service Fee",
    date: "2024-01-19T08:45:00Z",
    color: "#DC3545",
  },
  {
    id: "8",
    description: "Donation - Housing Project",
    amount: 100000,
    type: "credit",
    status: "completed",
    counterparty: "Jane Smith",
    date: "2024-01-18T15:10:00Z",
    event: "Housing Project",
    color: "#9D4EDD",
  },
];

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "1",
    type: "bank",
    provider: "Zenith Bank",
    accountNumber: "0087623525",
    accountName: "John Doe",
    isDefault: true,
    color: "#5669FF",
  },
  {
    id: "2",
    type: "bank",
    provider: "GT Bank",
    accountNumber: "0123456789",
    accountName: "John Doe",
    isDefault: false,
    color: "#28A745",
  },
  {
    id: "3",
    type: "card",
    provider: "Visa",
    accountNumber: "**** 4832",
    accountName: "John Doe",
    isDefault: false,
    color: "#9D4EDD",
  },
  {
    id: "4",
    type: "mobile_money",
    provider: "MTN",
    accountNumber: "0803 456 7890",
    accountName: "John Doe",
    isDefault: false,
    color: "#FFC107",
  },
];

const MOCK_WITHDRAWALS: Withdrawal[] = [
  {
    id: "1",
    amount: 200000,
    status: "pending",
    reference: "WDR202401211100",
    paymentMethod: "Zenith Bank",
    accountNumber: "••••3525",
    createdAt: "2024-01-21T11:00:00Z",
  },
  {
    id: "2",
    amount: 150000,
    status: "completed",
    reference: "WDR202401151430",
    paymentMethod: "GT Bank",
    accountNumber: "••••6789",
    createdAt: "2024-01-15T14:30:00Z",
    completedAt: "2024-01-17T09:15:00Z",
  },
  {
    id: "3",
    amount: 300000,
    status: "processing",
    reference: "WDR202401081200",
    paymentMethod: "Zenith Bank",
    accountNumber: "••••3525",
    createdAt: "2024-01-08T12:00:00Z",
  },
];

// Quick access shortcuts for wallet
const WALLET_SHORTCUTS = [
  {
    id: "dashboard",
    title: "Dashboard",
    link: "dashboard",
    iconColor: "#5669FF",
  },
  { id: "withdraw", title: "Withdraw", link: "#", iconColor: "#FF932E" },
  { id: "add-money", title: "Add Money", link: "#", iconColor: "#28A745" },
  { id: "history", title: "History", link: "#", iconColor: "#9D4EDD" },
  { id: "events", title: "Events", link: "events", iconColor: "#0FF1CF" },
];

const Wallet = () => {
  const [balance, setBalance] = useState<WalletBalance>(MOCK_BALANCE);
  const [transactions, setTransactions] =
    useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [paymentMethods, setPaymentMethods] =
    useState<PaymentMethod[]>(MOCK_PAYMENT_METHODS);
  const [withdrawals, setWithdrawals] =
    useState<Withdrawal[]>(MOCK_WITHDRAWALS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showAddMethodModal, setShowAddMethodModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("");
  const [activeTab, setActiveTab] = useState<
    "overview" | "transactions" | "methods" | "withdrawals"
  >("overview");
  const [filter, setFilter] = useState<"all" | "credit" | "debit">("all");
  const [newMethod, setNewMethod] = useState({
    type: "bank" as "bank" | "card" | "mobile_money",
    provider: "",
    accountNumber: "",
    accountName: "",
  });

  const fetchWalletData = () => {
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWalletData();
  };

  const handleWithdraw = () => {
    if (!withdrawAmount || !selectedPaymentMethod) {
      Alert.alert("Error", "Please enter amount and select payment method");
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (amount <= 0 || amount > balance.availableBalance) {
      Alert.alert("Error", "Invalid withdrawal amount");
      return;
    }

    // Create new withdrawal
    const newWithdrawal: Withdrawal = {
      id: String(withdrawals.length + 1),
      amount,
      status: "pending",
      reference: `WDR${Date.now()}`,
      paymentMethod:
        paymentMethods.find((m) => m.id === selectedPaymentMethod)?.provider ||
        "Bank",
      accountNumber:
        paymentMethods
          .find((m) => m.id === selectedPaymentMethod)
          ?.accountNumber.slice(-4) || "****",
      createdAt: new Date().toISOString(),
    };

    // Update balance
    const newBalance = {
      ...balance,
      availableBalance: balance.availableBalance - amount,
      pendingBalance: balance.pendingBalance + amount,
      totalBalance: balance.totalBalance,
    };

    // Add transaction
    const newTransaction: Transaction = {
      id: String(transactions.length + 1),
      description: "Withdrawal Request",
      amount,
      type: "debit",
      status: "pending",
      counterparty: "Your Bank",
      date: new Date().toISOString(),
      color: "#FFC107",
    };

    setBalance(newBalance);
    setWithdrawals([newWithdrawal, ...withdrawals]);
    setTransactions([newTransaction, ...transactions]);
    setShowWithdrawModal(false);
    setWithdrawAmount("");
    setSelectedPaymentMethod("");

    Alert.alert(
      "Success",
      "Withdrawal request submitted! Funds will arrive in 2-3 business days."
    );
  };

  const handleAddPaymentMethod = () => {
    if (
      !newMethod.provider ||
      !newMethod.accountNumber ||
      !newMethod.accountName
    ) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    const colors = ["#5669FF", "#28A745", "#9D4EDD", "#FFC107", "#FF932E"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newPaymentMethod: PaymentMethod = {
      id: String(paymentMethods.length + 1),
      type: newMethod.type,
      provider: newMethod.provider,
      accountNumber:
        newMethod.type === "card"
          ? `**** ${newMethod.accountNumber.slice(-4)}`
          : newMethod.accountNumber,
      accountName: newMethod.accountName,
      isDefault: paymentMethods.length === 0,
      color: randomColor,
    };

    setPaymentMethods([...paymentMethods, newPaymentMethod]);
    setShowAddMethodModal(false);
    setNewMethod({
      type: "bank",
      provider: "",
      accountNumber: "",
      accountName: "",
    });

    Alert.alert("Success", "Payment method added successfully!");
  };

  const handleSetDefault = (id: string) => {
    const updatedMethods = paymentMethods.map((method) => ({
      ...method,
      isDefault: method.id === id,
    }));
    setPaymentMethods(updatedMethods);
  };

  const handleRemoveMethod = (id: string) => {
    if (paymentMethods.find((m) => m.id === id)?.isDefault) {
      Alert.alert(
        "Cannot Remove",
        "Please set another payment method as default before removing this one."
      );
      return;
    }

    const updatedMethods = paymentMethods.filter((method) => method.id !== id);
    setPaymentMethods(updatedMethods);
    Alert.alert("Removed", "Payment method removed successfully.");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: balance.currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle size={16} color="#28A745" />;
      case "pending":
        return <Clock size={16} color="#FFC107" />;
      case "failed":
        return <XCircle size={16} color="#FF5757" />;
      default:
        return null;
    }
  };

  const getWithdrawalStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#28A745";
      case "processing":
        return "#0FF1CF";
      case "pending":
        return "#FFC107";
      case "failed":
        return "#FF5757";
      default:
        return "#6C757D";
    }
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case "bank":
        return <PiggyBank size={20} color="white" />;
      case "card":
        return <CreditCard size={20} color="white" />;
      case "mobile_money":
        return <Smartphone size={20} color="white" />;
      default:
        return <CreditCard size={20} color="white" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "processing":
        return "Processing";
      case "pending":
        return "Pending";
      case "failed":
        return "Failed";
      default:
        return "Unknown";
    }
  };

  const filteredTransactions =
    filter === "all"
      ? transactions
      : transactions.filter((t) => t.type === filter);

  const monthlyIncome = transactions
    .filter((t) => t.type === "credit" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpense = transactions
    .filter((t) => t.type === "debit" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingWithdrawals = withdrawals
    .filter((w) => w.status === "pending" || w.status === "processing")
    .reduce((sum, w) => sum + w.amount, 0);

  return (
    <View style={tw`flex-1 bg-[#01082E]`}>
      {/* Top Navigation */}
      <View style={tw`pt-10 pb-4 px-5 bg-[#01082E]`}>
        <View style={tw`flex-row justify-between items-center`}>
          <View style={tw`flex-row items-center gap-3`}>
            <View
              style={tw`w-12 h-12 rounded-full bg-[#0FF1CF] justify-center items-center`}
            >
              <WalletIcon size={24} color="#01082E" />
            </View>
            <View>
              <Text style={tw`text-white text-2xl font-bold`}>Wallet</Text>
              <Text style={tw`text-gray-400 text-sm`}>Manage your funds</Text>
            </View>
          </View>
          <View style={tw`flex-row gap-3`}>
            <TouchableOpacity style={tw`p-2`}>
              <Bell size={22} color="#6C757D" />
            </TouchableOpacity>
            <TouchableOpacity style={tw`p-2`}>
              <Settings size={22} color="#6C757D" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-5 pb-28`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0FF1CF"]}
            tintColor="#0FF1CF"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Card */}
        <CustomView
          style={tw`rounded-2xl p-6 mb-6 bg-gradient-to-r from-[#1B2A50] via-[#152238] to-[#0A1126] border border-[#0FF1CF]/20`}
        >
          <View style={tw`flex-row justify-between items-start mb-6`}>
            <View>
              <Text style={tw`text-gray-300 text-sm mb-1`}>Total Balance</Text>
              <Text style={tw`text-white text-4xl font-bold`}>
                {formatCurrency(balance.totalBalance)}
              </Text>
              <Text style={tw`text-gray-400 text-sm mt-1`}>
                ≈ ${(balance.totalBalance / 750).toFixed(2)} USD
              </Text>
            </View>
            <View style={tw`items-end`}>
              <View
                style={tw`flex-row items-center gap-1 bg-[#0FF1CF]/10 px-3 py-1 rounded-full mb-2`}
              >
                <Activity size={12} color="#0FF1CF" />
                <Text style={tw`text-[#0FF1CF] text-xs`}>Live</Text>
              </View>
              <DollarSign size={32} color="#0FF1CF" />
            </View>
          </View>

          <View style={tw`flex-row justify-between mb-6`}>
            <View style={tw`items-center`}>
              <Text style={tw`text-gray-300 text-xs mb-1`}>Available</Text>
              <Text style={tw`text-white text-xl font-bold`}>
                {formatCurrency(balance.availableBalance)}
              </Text>
              <View style={tw`w-16 h-1 bg-[#28A745] rounded-full mt-2`} />
            </View>
            <View style={tw`items-center`}>
              <Text style={tw`text-gray-300 text-xs mb-1`}>Pending</Text>
              <Text style={tw`text-yellow-300 text-xl font-bold`}>
                {formatCurrency(balance.pendingBalance)}
              </Text>
              <View style={tw`w-16 h-1 bg-[#FFC107] rounded-full mt-2`} />
            </View>
            <View style={tw`items-center`}>
              <Text style={tw`text-gray-300 text-xs mb-1`}>Withdrawing</Text>
              <Text style={tw`text-orange-300 text-xl font-bold`}>
                {formatCurrency(pendingWithdrawals)}
              </Text>
              <View style={tw`w-16 h-1 bg-[#FF932E] rounded-full mt-2`} />
            </View>
          </View>

          <View style={tw`flex-row gap-3`}>
            <TouchableOpacity
              style={tw`flex-1 bg-gradient-to-r from-[#5669FF] to-[#4D44FF] py-4 rounded-xl flex-row justify-center items-center gap-2`}
              onPress={() => setShowWithdrawModal(true)}
            >
              <ArrowUpRight size={20} color="white" />
              <Text style={tw`text-white font-bold`}>Withdraw</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`flex-1 bg-gradient-to-r from-[#0FF1CF] to-[#00D4B4] py-4 rounded-xl flex-row justify-center items-center gap-2`}
            >
              <ArrowDownLeft size={20} color="black" />
              <Text style={tw`text-black font-bold`}>Add Money</Text>
            </TouchableOpacity>
          </View>
        </CustomView>

        {/* Stats Overview */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-white text-xl font-bold mb-4`}>
            Monthly Overview
          </Text>
          <View style={tw`flex-row gap-3`}>
            <CustomView style={tw`flex-1 p-4 bg-[#1B2A50] rounded-xl`}>
              <View style={tw`flex-row items-center gap-2 mb-2`}>
                <TrendingUp size={16} color="#28A745" />
                <Text style={tw`text-gray-300 text-xs`}>Income</Text>
              </View>
              <Text style={tw`text-white text-2xl font-bold`}>
                {formatCurrency(monthlyIncome)}
              </Text>
              <Text style={tw`text-green-400 text-xs mt-1`}>
                ↑ 12.5% from last month
              </Text>
            </CustomView>

            <CustomView style={tw`flex-1 p-4 bg-[#1B2A50] rounded-xl`}>
              <View style={tw`flex-row items-center gap-2 mb-2`}>
                <TrendingUp size={16} color="#FF5757" />
                <Text style={tw`text-gray-300 text-xs`}>Expenses</Text>
              </View>
              <Text style={tw`text-white text-2xl font-bold`}>
                {formatCurrency(monthlyExpense)}
              </Text>
              <Text style={tw`text-red-400 text-xs mt-1`}>
                ↑ 8.2% from last month
              </Text>
            </CustomView>
          </View>
        </View>

        {/* Tabs */}
        <View style={tw`flex-row mb-6 border-b border-gray-800`}>
          {["overview", "transactions", "methods", "withdrawals"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={tw`flex-1 pb-3 border-b-2 ${
                activeTab === tab ? "border-[#0FF1CF]" : "border-transparent"
              }`}
              onPress={() => setActiveTab(tab as any)}
            >
              <Text
                style={[
                  tw`text-center text-base font-medium capitalize`,
                  activeTab === tab ? tw`text-[#0FF1CF]` : tw`text-gray-400`,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <>
            {/* Quick Actions */}
            <View style={tw`mb-6`}>
              <Text style={tw`text-white text-lg font-bold mb-3`}>
                Quick Actions
              </Text>
              <View style={tw`flex-row gap-3 flex-wrap`}>
                <TouchableOpacity
                  style={tw`flex-1 min-w-[45%] p-4 bg-[#1B2A50] rounded-xl items-center`}
                >
                  <View
                    style={tw`w-12 h-12 rounded-full bg-[#5669FF] justify-center items-center mb-2`}
                  >
                    <CreditCard size={24} color="white" />
                  </View>
                  <Text style={tw`text-white text-sm font-medium`}>
                    Add Card
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={tw`flex-1 min-w-[45%] p-4 bg-[#1B2A50] rounded-xl items-center`}
                >
                  <View
                    style={tw`w-12 h-12 rounded-full bg-[#28A745] justify-center items-center mb-2`}
                  >
                    <Activity size={24} color="white" />
                  </View>
                  <Text style={tw`text-white text-sm font-medium`}>
                    Analytics
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={tw`flex-1 min-w-[45%] p-4 bg-[#1B2A50] rounded-xl items-center`}
                >
                  <View
                    style={tw`w-12 h-12 rounded-full bg-[#9D4EDD] justify-center items-center mb-2`}
                  >
                    <Bell size={24} color="white" />
                  </View>
                  <Text style={tw`text-white text-sm font-medium`}>Alerts</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={tw`flex-1 min-w-[45%] p-4 bg-[#1B2A50] rounded-xl items-center`}
                >
                  <View
                    style={tw`w-12 h-12 rounded-full bg-[#FF932E] justify-center items-center mb-2`}
                  >
                    <Settings size={24} color="white" />
                  </View>
                  <Text style={tw`text-white text-sm font-medium`}>
                    Settings
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Recent Transactions Preview */}
            <View style={tw`mb-6`}>
              <View style={tw`flex-row justify-between items-center mb-3`}>
                <Text style={tw`text-white text-lg font-bold`}>
                  Recent Transactions
                </Text>
                <TouchableOpacity onPress={() => setActiveTab("transactions")}>
                  <Text style={tw`text-[#0FF1CF] text-sm`}>View All</Text>
                </TouchableOpacity>
              </View>

              <View style={tw`gap-3`}>
                {transactions.slice(0, 3).map((transaction) => (
                  <CustomView
                    key={transaction.id}
                    style={tw`p-4 bg-[#1B2A50] rounded-xl`}
                  >
                    <View style={tw`flex-row justify-between items-start`}>
                      <View style={tw`flex-1`}>
                        <Text style={tw`text-white font-medium`}>
                          {transaction.description}
                        </Text>
                        <Text style={tw`text-gray-400 text-xs mt-1`}>
                          {transaction.counterparty} •{" "}
                          {formatDate(transaction.date)}
                        </Text>
                        {transaction.event && (
                          <View style={tw`flex-row items-center gap-1 mt-1`}>
                            <View
                              style={tw`w-2 h-2 rounded-full`}
                              //style={{ backgroundColor: transaction.color }}
                            />
                            <Text style={tw`text-gray-500 text-xs`}>
                              {transaction.event}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={tw`items-end`}>
                        <Text
                          style={[
                            tw`text-lg font-bold`,
                            transaction.type === "credit"
                              ? tw`text-green-400`
                              : tw`text-red-400`,
                          ]}
                        >
                          {transaction.type === "credit" ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </Text>
                        <View style={tw`flex-row items-center gap-1 mt-1`}>
                          {getStatusIcon(transaction.status)}
                          <Text
                            style={[
                              tw`text-xs capitalize`,
                              transaction.status === "completed"
                                ? tw`text-green-400`
                                : transaction.status === "pending"
                                ? tw`text-yellow-400`
                                : tw`text-red-400`,
                            ]}
                          >
                            {transaction.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </CustomView>
                ))}
              </View>
            </View>
          </>
        )}

        {activeTab === "transactions" && (
          <View style={tw`mb-6`}>
            {/* Filters */}
            <View style={tw`flex-row gap-2 mb-4`}>
              {["all", "credit", "debit"].map((filterType) => (
                <TouchableOpacity
                  key={filterType}
                  style={[
                    tw`px-4 py-2 rounded-full flex-row items-center gap-2`,
                    filter === filterType ? tw`bg-[#0FF1CF]` : tw`bg-[#1B2A50]`,
                  ]}
                  onPress={() => setFilter(filterType as any)}
                >
                  <Text
                    style={[
                      tw`text-sm capitalize`,
                      filter === filterType
                        ? tw`text-black font-bold`
                        : tw`text-gray-300`,
                    ]}
                  >
                    {filterType}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Transaction List */}
            <View style={tw`gap-3`}>
              {filteredTransactions.map((transaction) => (
                <CustomView
                  key={transaction.id}
                  style={tw`p-4 bg-[#1B2A50] rounded-xl border-l-4`}
                  // style={{ borderLeftColor: transaction.color }}
                >
                  <View style={tw`flex-row justify-between items-start`}>
                    <View style={tw`flex-1`}>
                      <View style={tw`flex-row items-center gap-2`}>
                        <View
                          style={[
                            tw`w-10 h-10 rounded-full justify-center items-center`,
                            { backgroundColor: transaction.color },
                          ]}
                        >
                          {transaction.type === "credit" ? (
                            <ArrowDownLeft size={20} color="white" />
                          ) : (
                            <ArrowUpRight size={20} color="white" />
                          )}
                        </View>
                        <View>
                          <Text style={tw`text-white font-medium`}>
                            {transaction.description}
                          </Text>
                          <Text style={tw`text-gray-400 text-xs mt-1`}>
                            {transaction.counterparty} •{" "}
                            {formatDate(transaction.date)}
                          </Text>
                        </View>
                      </View>
                      {transaction.event && (
                        <View style={tw`mt-2 flex-row items-center gap-1`}>
                          <View
                            style={tw`w-2 h-2 rounded-full`}
                            //style={{ backgroundColor: transaction.color }}
                          />
                          <Text style={tw`text-gray-500 text-xs`}>
                            {transaction.event}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={tw`items-end`}>
                      <Text
                        style={[
                          tw`text-xl font-bold`,
                          transaction.type === "credit"
                            ? tw`text-green-400`
                            : tw`text-red-400`,
                        ]}
                      >
                        {transaction.type === "credit" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </Text>
                      <View style={tw`flex-row items-center gap-1 mt-1`}>
                        {getStatusIcon(transaction.status)}
                        <Text
                          style={[
                            tw`text-xs capitalize`,
                            transaction.status === "completed"
                              ? tw`text-green-400`
                              : transaction.status === "pending"
                              ? tw`text-yellow-400`
                              : tw`text-red-400`,
                          ]}
                        >
                          {transaction.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </CustomView>
              ))}
            </View>
          </View>
        )}

        {activeTab === "methods" && (
          <View style={tw`mb-6`}>
            <View style={tw`flex-row justify-between items-center mb-3`}>
              <Text style={tw`text-white text-xl font-bold`}>
                Payment Methods
              </Text>
              <TouchableOpacity
                style={tw`bg-[#0FF1CF] px-4 py-2 rounded-full flex-row items-center gap-2`}
                onPress={() => setShowAddMethodModal(true)}
              >
                <Plus size={16} color="black" />
                <Text style={tw`text-black font-bold`}>Add New</Text>
              </TouchableOpacity>
            </View>

            <View style={tw`gap-3`}>
              {paymentMethods.map((method) => (
                <CustomView
                  key={method.id}
                  style={tw`p-4 bg-[#1B2A50] rounded-xl`}
                >
                  <View style={tw`flex-row justify-between items-center`}>
                    <View style={tw`flex-row items-center gap-3`}>
                      <View
                        style={[
                          tw`w-14 h-14 rounded-2xl justify-center items-center`,
                          { backgroundColor: method.color },
                        ]}
                      >
                        {getPaymentMethodIcon(method.type)}
                      </View>
                      <View>
                        <Text style={tw`text-white font-bold text-lg`}>
                          {method.provider}
                        </Text>
                        <Text style={tw`text-gray-400 text-sm`}>
                          {method.accountNumber}
                        </Text>
                        <Text style={tw`text-gray-500 text-xs`}>
                          {method.accountName}
                        </Text>
                        {method.isDefault && (
                          <View style={tw`flex-row items-center gap-1 mt-1`}>
                            <View
                              style={tw`w-2 h-2 rounded-full bg-[#0FF1CF]`}
                            />
                            <Text
                              style={tw`text-[#0FF1CF] text-xs font-medium`}
                            >
                              Default Payment Method
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={tw`flex-row items-center gap-2`}>
                      {!method.isDefault && (
                        <>
                          <TouchableOpacity
                            style={tw`px-3 py-1 bg-[#0FF1CF]/20 rounded-full`}
                            onPress={() => handleSetDefault(method.id)}
                          >
                            <Text
                              style={tw`text-[#0FF1CF] text-xs font-medium`}
                            >
                              Set Default
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={tw`px-3 py-1 bg-[#FF5757]/20 rounded-full`}
                            onPress={() => handleRemoveMethod(method.id)}
                          >
                            <Text
                              style={tw`text-[#FF5757] text-xs font-medium`}
                            >
                              Remove
                            </Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                </CustomView>
              ))}
            </View>
          </View>
        )}

        {activeTab === "withdrawals" && (
          <View style={tw`mb-6`}>
            <Text style={tw`text-white text-xl font-bold mb-3`}>
              Withdrawal History
            </Text>

            <View style={tw`gap-3`}>
              {withdrawals.map((withdrawal) => (
                <CustomView
                  key={withdrawal.id}
                  style={tw`p-4 bg-[#1B2A50] rounded-xl`}
                >
                  <View style={tw`flex-row justify-between items-start mb-3`}>
                    <View>
                      <Text style={tw`text-white font-bold text-lg`}>
                        {formatCurrency(withdrawal.amount)}
                      </Text>
                      <Text style={tw`text-gray-400 text-xs mt-1`}>
                        Reference: {withdrawal.reference}
                      </Text>
                    </View>
                    <View style={tw`items-end`}>
                      <View
                        style={[
                          tw`px-3 py-1 rounded-full`,
                          {
                            backgroundColor:
                              getWithdrawalStatusColor(withdrawal.status) +
                              "20",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            tw`text-xs font-bold capitalize`,
                            {
                              color: getWithdrawalStatusColor(
                                withdrawal.status
                              ),
                            },
                          ]}
                        >
                          {getStatusText(withdrawal.status)}
                        </Text>
                      </View>
                      <Text style={tw`text-gray-500 text-xs mt-1`}>
                        {formatDate(withdrawal.createdAt)}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={tw`flex-row justify-between items-center pt-3 border-t border-gray-800`}
                  >
                    <View>
                      <Text style={tw`text-gray-400 text-xs`}>To</Text>
                      <Text style={tw`text-white text-sm`}>
                        {withdrawal.paymentMethod} ••••{" "}
                        {withdrawal.accountNumber}
                      </Text>
                    </View>
                    {withdrawal.completedAt && (
                      <View>
                        <Text style={tw`text-gray-400 text-xs`}>Completed</Text>
                        <Text style={tw`text-gray-300 text-xs`}>
                          {formatDate(withdrawal.completedAt)}
                        </Text>
                      </View>
                    )}
                  </View>
                </CustomView>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick Access */}
      <View
        style={tw`absolute bottom-0 left-0 right-0 bg-[#01082E] pt-3 pb-5 px-5 border-t border-gray-800`}
      >
        <Text style={tw`text-white text-lg font-bold mb-3`}>Quick Access</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={tw`flex-row`}
        >
          <View style={tw`flex-row gap-3`}>
            {WALLET_SHORTCUTS.map((shortcut) => (
              <Shortcut
                key={shortcut.id}
                title={shortcut.title}
                link={shortcut.link}
                iconColor={shortcut.iconColor}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Withdrawal Modal */}
      <Modal
        visible={showWithdrawModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <KeyboardAvoidingView
          style={tw`flex-1 bg-black/70 justify-end`}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
        >
          <View style={tw`bg-[#1B2A50] rounded-t-3xl p-6 max-h-4/5`}>
            <View style={tw`flex-row justify-between items-center mb-6`}>
              <View>
                <Text style={tw`text-white text-2xl font-bold`}>
                  Withdraw Funds
                </Text>
                <Text style={tw`text-gray-400 text-sm`}>
                  Transfer to your bank account
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowWithdrawModal(false)}
                style={tw`p-2`}
              >
                <X size={24} color="#6C757D" />
              </TouchableOpacity>
            </View>

            <View style={tw`mb-6`}>
              <Text style={tw`text-gray-300 mb-2`}>Amount to Withdraw</Text>
              <View
                style={tw`flex-row items-center border-b border-gray-700 pb-2`}
              >
                <Text style={tw`text-white text-3xl font-bold mr-3`}>₦</Text>
                <TextInput
                  style={tw`flex-1 text-white text-3xl font-bold bg-transparent`}
                  placeholder="0.00"
                  placeholderTextColor="#6C757D"
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                  keyboardType="decimal-pad"
                />
              </View>
              <Text style={tw`text-gray-500 text-sm mt-2`}>
                Available: {formatCurrency(balance.availableBalance)}
              </Text>
            </View>

            <View style={tw`mb-6`}>
              <Text style={tw`text-gray-300 mb-3`}>Select Payment Method</Text>
              <ScrollView
                style={tw`max-h-48`}
                showsVerticalScrollIndicator={false}
              >
                <View style={tw`gap-3`}>
                  {paymentMethods.map((method) => (
                    <TouchableOpacity
                      key={method.id}
                      style={[
                        tw`p-4 rounded-xl border-2 flex-row justify-between items-center`,
                        selectedPaymentMethod === method.id
                          ? tw`border-[#0FF1CF] bg-[#0FF1CF]/10`
                          : tw`border-gray-700 bg-[#0A1126]`,
                      ]}
                      onPress={() => setSelectedPaymentMethod(method.id)}
                    >
                      <View style={tw`flex-row items-center gap-3`}>
                        <View
                          style={[
                            tw`w-12 h-12 rounded-full justify-center items-center`,
                            { backgroundColor: method.color },
                          ]}
                        >
                          {getPaymentMethodIcon(method.type)}
                        </View>
                        <View>
                          <Text style={tw`text-white font-bold`}>
                            {method.provider}
                          </Text>
                          <Text style={tw`text-gray-400 text-sm`}>
                            {method.accountNumber}
                          </Text>
                          {method.isDefault && (
                            <Text style={tw`text-[#0FF1CF] text-xs mt-1`}>
                              Default
                            </Text>
                          )}
                        </View>
                      </View>
                      {selectedPaymentMethod === method.id && (
                        <View
                          style={tw`w-6 h-6 rounded-full bg-[#0FF1CF] justify-center items-center`}
                        >
                          <CheckCircle size={16} color="black" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={tw`mb-4 p-4 bg-[#0A1126] rounded-xl`}>
              <Text style={tw`text-gray-300 text-sm mb-2`}>
                Transaction Summary
              </Text>
              <View style={tw`flex-row justify-between mb-1`}>
                <Text style={tw`text-gray-400`}>Amount</Text>
                <Text style={tw`text-white`}>
                  {withdrawAmount
                    ? formatCurrency(parseFloat(withdrawAmount))
                    : "₦0.00"}
                </Text>
              </View>
              <View style={tw`flex-row justify-between mb-1`}>
                <Text style={tw`text-gray-400`}>Processing Fee</Text>
                <Text style={tw`text-white`}>₦50.00</Text>
              </View>
              <View style={tw`h-px bg-gray-700 my-2`} />
              <View style={tw`flex-row justify-between`}>
                <Text style={tw`text-white font-bold`}>Total to Receive</Text>
                <Text style={tw`text-[#0FF1CF] font-bold`}>
                  {withdrawAmount
                    ? formatCurrency(parseFloat(withdrawAmount) - 50)
                    : "₦0.00"}
                </Text>
              </View>
            </View>

            <View style={tw`gap-3`}>
              <TouchableOpacity
                style={[
                  tw`py-4 rounded-xl justify-center items-center`,
                  !withdrawAmount || !selectedPaymentMethod
                    ? tw`bg-gray-700`
                    : tw`bg-gradient-to-r from-[#5669FF] to-[#4D44FF]`,
                ]}
                onPress={handleWithdraw}
                disabled={!withdrawAmount || !selectedPaymentMethod}
              >
                <Text style={tw`text-white font-bold text-lg`}>
                  Confirm Withdrawal
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={tw`text-gray-500 text-xs text-center mt-6`}>
              Funds typically arrive within 2-3 business days
            </Text>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Payment Method Modal */}
      <Modal
        visible={showAddMethodModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddMethodModal(false)}
      >
        <KeyboardAvoidingView
          style={tw`flex-1 bg-black/70 justify-end`}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
        >
          <View style={tw`bg-[#1B2A50] rounded-t-3xl p-6 max-h-4/5`}>
            <View style={tw`flex-row justify-between items-center mb-6`}>
              <Text style={tw`text-white text-2xl font-bold`}>
                Add Payment Method
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddMethodModal(false)}
                style={tw`p-2`}
              >
                <X size={24} color="#6C757D" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={tw`mb-6`}>
                <Text style={tw`text-gray-300 mb-2`}>Method Type</Text>
                <View style={tw`flex-row gap-3`}>
                  {["bank", "card", "mobile_money"].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        tw`flex-1 p-4 rounded-xl border-2 items-center`,
                        newMethod.type === type
                          ? tw`border-[#0FF1CF] bg-[#0FF1CF]/10`
                          : tw`border-gray-700 bg-[#0A1126]`,
                      ]}
                      onPress={() =>
                        setNewMethod({ ...newMethod, type: type as any })
                      }
                    >
                      {getPaymentMethodIcon(type)}
                      <Text style={tw`text-white text-sm mt-2 capitalize`}>
                        {type.replace("_", " ")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={tw`gap-4 mb-6`}>
                <View>
                  <Text style={tw`text-gray-300 mb-2`}>
                    {newMethod.type === "bank"
                      ? "Bank Name"
                      : newMethod.type === "card"
                      ? "Card Provider"
                      : "Mobile Provider"}
                  </Text>
                  <TextInput
                    style={tw`bg-[#0A1126] text-white p-4 rounded-xl border border-gray-700`}
                    placeholder={
                      newMethod.type === "bank"
                        ? "e.g., Zenith Bank"
                        : newMethod.type === "card"
                        ? "e.g., Visa, Mastercard"
                        : "e.g., MTN, Airtel"
                    }
                    placeholderTextColor="#6C757D"
                    value={newMethod.provider}
                    onChangeText={(text) =>
                      setNewMethod({ ...newMethod, provider: text })
                    }
                  />
                </View>

                <View>
                  <Text style={tw`text-gray-300 mb-2`}>
                    {newMethod.type === "bank"
                      ? "Account Number"
                      : newMethod.type === "card"
                      ? "Card Number"
                      : "Phone Number"}
                  </Text>
                  <TextInput
                    style={tw`bg-[#0A1126] text-white p-4 rounded-xl border border-gray-700`}
                    placeholder={
                      newMethod.type === "bank"
                        ? "10-digit account number"
                        : newMethod.type === "card"
                        ? "16-digit card number"
                        : "11-digit phone number"
                    }
                    placeholderTextColor="#6C757D"
                    value={newMethod.accountNumber}
                    onChangeText={(text) =>
                      setNewMethod({ ...newMethod, accountNumber: text })
                    }
                    keyboardType="number-pad"
                  />
                </View>

                <View>
                  <Text style={tw`text-gray-300 mb-2`}>
                    Account Holder Name
                  </Text>
                  <TextInput
                    style={tw`bg-[#0A1126] text-white p-4 rounded-xl border border-gray-700`}
                    placeholder="Name as it appears on account"
                    placeholderTextColor="#6C757D"
                    value={newMethod.accountName}
                    onChangeText={(text) =>
                      setNewMethod({ ...newMethod, accountName: text })
                    }
                  />
                </View>
              </View>

              <View style={tw`gap-3`}>
                <TouchableOpacity
                  style={tw`bg-[#0FF1CF] py-4 rounded-xl justify-center items-center`}
                  onPress={handleAddPaymentMethod}
                >
                  <Text style={tw`text-black font-bold text-lg`}>
                    Add Payment Method
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={tw`py-4 rounded-xl justify-center items-center border border-gray-700`}
                  onPress={() => setShowAddMethodModal(false)}
                >
                  <Text style={tw`text-gray-300`}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default Wallet;
