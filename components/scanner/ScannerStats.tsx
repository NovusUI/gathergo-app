import { BarChart3, CheckCircle, Clock, XCircle } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
import tw from "twrnc";

interface ScannerStatsProps {
  stats: {
    totalScans: number;
    successfulScans: number;
    failedScans: number;
    ticketsMarkedUsed: number;
    registrationsMarkedUsed: number;
    successRate: number;
    recentScans: Array<{
      type: string;
      action: string;
      success: boolean;
      message: string;
      scannedAt: string;
      eventName?: string;
    }>;
  };
}

const ScannerStats: React.FC<ScannerStatsProps> = ({ stats }) => {
  return (
    <View style={tw`bg-[#1B2A50] rounded-2xl p-5`}>
      <View style={tw`flex-row items-center justify-between mb-4`}>
        <Text style={tw`text-white text-lg font-bold`}>Scanner Statistics</Text>
        <BarChart3 size={20} color="#5669FF" />
      </View>

      <View style={tw`flex-row justify-between mb-6`}>
        <View style={tw`items-center`}>
          <Text style={tw`text-white text-3xl font-bold`}>
            {stats.totalScans}
          </Text>
          <Text style={tw`text-gray-400 text-sm`}>Total Scans</Text>
        </View>

        <View style={tw`items-center`}>
          <Text style={tw`text-[#0FF1CF] text-3xl font-bold`}>
            {stats.successRate.toFixed(1)}%
          </Text>
          <Text style={tw`text-gray-400 text-sm`}>Success Rate</Text>
        </View>

        <View style={tw`items-center`}>
          <Text style={tw`text-white text-3xl font-bold`}>
            {stats.ticketsMarkedUsed + stats.registrationsMarkedUsed}
          </Text>
          <Text style={tw`text-gray-400 text-sm`}>Marked Used</Text>
        </View>
      </View>

      <View style={tw`space-y-3`}>
        <View style={tw`flex-row items-center`}>
          <CheckCircle size={16} color="#0FF1CF" />
          <Text style={tw`text-white text-sm ml-2`}>
            Successful: {stats.successfulScans}
          </Text>
        </View>

        <View style={tw`flex-row items-center`}>
          <XCircle size={16} color="#FF5757" />
          <Text style={tw`text-white text-sm ml-2`}>
            Failed: {stats.failedScans}
          </Text>
        </View>

        <View style={tw`flex-row items-center`}>
          <Clock size={16} color="#FF932E" />
          <Text style={tw`text-white text-sm ml-2`}>
            Tickets Used: {stats.ticketsMarkedUsed}
          </Text>
        </View>

        <View style={tw`flex-row items-center`}>
          <Clock size={16} color="#5669FF" />
          <Text style={tw`text-white text-sm ml-2`}>
            Registrations Used: {stats.registrationsMarkedUsed}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default ScannerStats;
