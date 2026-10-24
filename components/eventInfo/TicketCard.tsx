import { useAppTheme } from "@/hooks/useAppTheme";
import { usePressGuard } from "@/hooks/usePressGuard";
import { showGlobalWarning } from "@/utils/globalErrorHandler";
import { numberWithCommas } from "@/utils/utils";
import { ChevronRight, Edit3, Trash } from "lucide-react-native";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type PricingCardProps = {
  title: string;
  description: string;
  price: string | number;
  onPress?: () => void;
  perks?: string[];
  ticketQuantity?: number;
  selectedQuantity?: number;
  canIncrease?: boolean;
  onQuantityChange?: (quantity: number) => void;
  sold?: number;
  isNew?: boolean;
  isEdit?: boolean;
  updatedPrice?: number | null | undefined;
  isVisible: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
  onPublish?: () => void;
  isPublishing?: boolean;
  publishDisabled?: boolean;
};

const PricingCard = ({
  title,
  description,
  price,
  perks,
  ticketQuantity,
  selectedQuantity,
  canIncrease = true,
  sold,
  onQuantityChange,
  isNew,
  isEdit,
  updatedPrice,
  isVisible,
  onDelete,
  onEdit,
  onPublish,
  isPublishing = false,
  publishDisabled = false,
}: PricingCardProps) => {
  const { tw, color } = useAppTheme();
  const publish = usePressGuard(onPublish);
  const [showPerk, setShowPerk] = useState(false);
  const [localQuantity, setQuantity] = useState(0);
  const quantity = selectedQuantity ?? localQuantity;

  const handleAdd = () => {
    if (
      canIncrease &&
      ticketQuantity &&
      sold !== undefined &&
      ticketQuantity - sold > quantity
    ) {
      if (selectedQuantity === undefined) setQuantity((prev) => prev + 1);
      onQuantityChange?.(1);
    } else {
      showGlobalWarning("Reached stock limit");
    }
  };

  const handleRemove = () => {
    if (quantity > 0) {
      if (selectedQuantity === undefined) setQuantity((prev) => prev - 1);
      onQuantityChange?.(-1);
    }
  };

  const hasDiscount =
    updatedPrice !== undefined &&
    updatedPrice !== null &&
    updatedPrice < Number(price);
  const displayPrice =
    updatedPrice !== undefined && updatedPrice !== null ? updatedPrice : price;

  return (
    <View style={tw`relative`}>
      {/* Overlay if not visible */}
      {!isVisible && (
        <View
          style={tw`absolute inset-0 bg-black/40 z-10 rounded-2xl flex-row justify-center items-center`}
        >
          <View style={tw`items-center gap-3`}>
            <Text style={tw`text-foreground dark:text-white text-sm font-bold`}>Not Live</Text>
            {onPublish ? (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Publish ${title} ticket`}
                accessibilityState={{
                  disabled: publishDisabled || isPublishing,
                  busy: isPublishing,
                }}
                disabled={publishDisabled || isPublishing}
                onPress={publish}
                style={[
                  tw`rounded-full bg-accentFill dark:bg-[#0FF1CF] px-5 py-3`,
                  (publishDisabled || isPublishing) && tw`opacity-50`,
                ]}
              >
                <Text style={tw`font-semibold text-onAccent dark:text-[#01082E]`}>
                  {isPublishing ? "Publishing…" : "Publish ticket"}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      )}

      {/* Main Card */}
      <View style={tw`bg-surface dark:bg-[#010E3A] border border-borderStrong dark:border-0 rounded-2xl p-5 w-full max-w-md`}>
        {/* Top Right Buttons */}
        {(isNew || isEdit) && (
          <View style={tw`absolute top-3 right-3 flex-row gap-3 z-20`}>
            {isEdit && (
              <TouchableOpacity
                onPress={onEdit}
                style={tw`bg-accentFill dark:bg-[#0FF1CF] p-2 rounded-full`}
                activeOpacity={0.8}
              >
                <Edit3 size={18} color={color("#fff", "foreground")} />
              </TouchableOpacity>
            )}
            {isNew && (
              <TouchableOpacity
                onPress={onDelete}
                style={tw`bg-danger dark:bg-red-500 p-2 rounded-full`}
                activeOpacity={0.8}
              >
                <Trash size={18} color={color("#fff", "foreground")} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Title & Description */}
        <Text style={tw`text-foreground dark:text-white text-lg font-bold mb-2`}>{title}</Text>
        <Text style={tw`text-foreground/80 dark:text-white/80 text-base mb-6`}>{description}</Text>

        {/* Price Section */}
        <View style={tw`flex-row justify-between items-center`}>
          <TouchableOpacity
            style={tw`flex-row items-center`}
            onPress={
              perks && perks.length
                ? () => setShowPerk((prev) => !prev)
                : undefined
            }
            activeOpacity={0.7}
          >
            {perks && perks.length > 0 && (
              <>
                <Text style={tw`text-accent dark:text-teal-400 text-sm font-medium`}>
                  {showPerk ? "Show Less" : "See Perks"}
                </Text>
                <ChevronRight size={16} color={color("#14b8a6", "accent")} />
              </>
            )}
          </TouchableOpacity>

          <View style={tw`flex-row items-center gap-2`}>
            {hasDiscount && (
              <Text style={tw`text-foreground/50 dark:text-white/50 text-sm line-through`}>
                {numberWithCommas(price, true, null)}
              </Text>
            )}
            <Text style={tw`text-foreground dark:text-white text-base font-semibold`}>
              {numberWithCommas(displayPrice, true, null)}
            </Text>
          </View>
        </View>

        {/* Perks */}
        {showPerk && perks && (
          <View style={tw`gap-2 py-3`}>
            {perks.map((perk, idx) => (
              <Text key={idx} style={tw`text-foreground dark:text-white text-sm`}>
                {perk}
              </Text>
            ))}
          </View>
        )}

        {/* Quantity Controls */}
        {onQuantityChange && ticketQuantity && ticketQuantity > 0 && (
          <View style={tw`flex-row items-center mt-4 gap-3`}>
            <TouchableOpacity
              onPress={handleRemove}
              accessibilityRole="button"
              accessibilityLabel="Remove ticket"
              disabled={quantity === 0}
              style={tw`bg-surface dark:bg-[#ffff] h-8 w-8 rounded-full flex-row justify-center items-center`}
            >
              <Text style={tw`text-onAccent dark:text-black text-lg`}>-</Text>
            </TouchableOpacity>
            <Text style={tw`text-foreground dark:text-white text-lg`}>{quantity}</Text>
            <TouchableOpacity
              onPress={handleAdd}
              accessibilityRole="button"
              accessibilityLabel="Add ticket"
              disabled={!canIncrease}
              style={tw`${
                quantity ? "bg-accentFill dark:bg-[#0FF1CF]" : "bg-surface dark:bg-[#ffff]"
              } h-8 w-8 rounded-full flex-row justify-center items-center`}
            >
              <Text style={tw`text-onAccent dark:text-[#01082E] text-lg`}>+</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Out of stock */}
        {!!ticketQuantity && !!sold && ticketQuantity - sold === 0 && (
          <Text style={tw`mt-3 text-danger dark:text-red-500`}>Out of stock</Text>
        )}
      </View>
    </View>
  );
};

export default PricingCard;
