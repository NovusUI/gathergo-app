import CustomeTopBarNav from "@/components/CustomeTopBarNav";
import Shortcut from "@/components/Shortcut";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import type { ComponentProps, ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type DashboardLayoutProps = {
  title: string;
  onBack: () => void;
  shortcuts: readonly (ComponentProps<typeof Shortcut> & { id: string; iconColor: string })[];
  currentShortcutId?: string;
  children?: ReactNode;
  secondary?: ReactNode;
  header?: ReactNode;
  loading?: ReactNode;
};

export default function DashboardLayout({
  title, onBack, shortcuts, currentShortcutId, children, secondary, header, loading,
}: DashboardLayoutProps) {
  const { tw } = useAppTheme();
  const layout = useResponsiveLayout({ hasTabNavigation: false });
  const inColumns = layout.detailColumns === 2 && Boolean(secondary);

  return (
    <SafeAreaView edges={["top"]} style={tw`flex-1 bg-background dark:bg-[#01082E]`}>
      <View style={{ flex: 1, width: "100%", maxWidth: layout.pageWidth, alignSelf: "center" }}>
        <View style={{ paddingHorizontal: layout.horizontalPadding, paddingBottom: 12 }}>
          <CustomeTopBarNav title={title} onClickBack={onBack} />
        </View>
        {loading ?? (
          <ScrollView
            style={tw`flex-1`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: layout.horizontalPadding, paddingBottom: 20, gap: 16 }}
          >
            {header}
            <View style={{ flexDirection: inColumns ? "row" : "column", gap: 16 }}>
              <View style={{ flex: inColumns ? 1 : undefined, minWidth: 0 }}>{children}</View>
              {secondary ? (
                <View style={{ flex: inColumns ? 1 : undefined, minWidth: 0 }}>{secondary}</View>
              ) : null}
            </View>
          </ScrollView>
        )}
        {shortcuts.length > 0 ? (
          <View style={[tw`border-t border-border dark:border-gray-800 pt-3 pb-3`, { paddingHorizontal: layout.horizontalPadding }]}>
            <Text style={tw`text-foreground dark:text-white text-lg font-bold mb-3`}>Quick Access</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={tw`flex-row gap-3`}>
                {shortcuts.map(({ id, ...shortcut }) => (
                  <Shortcut key={id} {...shortcut} isCurrent={id === currentShortcutId} />
                ))}
              </View>
            </ScrollView>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
