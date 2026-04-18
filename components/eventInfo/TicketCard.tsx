import { showGlobalWarning } from "@/utils/globalErrorHandler";
import { numberWithCommas } from "@/utils/utils";
import { ChevronRight, Edit3, Trash } from "lucide-react-native";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

type PricingCardProps = {
  title: string;
  description: string;
  price: string | number;
  onPress?: () => void;
  perks?: string[];
  ticketQuantity?: number;
  onQuantityChange?: (quantity: number) => void;
  sold?: number;
  isNew?: boolean;
  isEdit?: boolean;
  updatedPrice?: number | null | undefined;
  isVisible: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
};

const PricingCard = ({
  title,
  description,
  price,
  perks,
  ticketQuantity,
  sold,
  onQuantityChange,
  isNew,
  isEdit,
  updatedPrice,
  isVisible,
  onDelete,
  onEdit,
}: PricingCardProps) => {
  const [showPerk, setShowPerk] = useState(false);
  const [quantity, setQuantity] = useState(0);

  const handleAdd = () => {
    console.log(
      ticketQuantity,
      sold,
      quantity,
      ticketQuantity && sold && ticketQuantity - sold > quantity
    );
    if (
      ticketQuantity &&
      sold !== undefined &&
      ticketQuantity - sold > quantity
    ) {
      setQuantity((prev) => prev + 1);
      onQuantityChange?.(1);
    } else {
      showGlobalWarning("Reached stock limit");
    }
  };

  const handleRemove = () => {
    if (quantity > 0) {
      setQuantity((prev) => prev - 1);
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
          <Text style={tw`text-white text-sm font-bold`}>Not Live</Text>
        </View>
      )}

      {/* Main Card */}
      <View style={tw`bg-[#010E3A] rounded-2xl p-5 w-full max-w-md`}>
        {/* Top Right Buttons */}
        {(isNew || isEdit) && (
          <View style={tw`absolute top-3 right-3 flex-row gap-3 z-20`}>
            {isEdit && (
              <TouchableOpacity
                onPress={onEdit}
                style={tw`bg-[#0FF1CF] p-2 rounded-full`}
                activeOpacity={0.8}
              >
                <Edit3 size={18} color="#fff" />
              </TouchableOpacity>
            )}
            {isNew && (
              <TouchableOpacity
                onPress={onDelete}
                style={tw`bg-red-500 p-2 rounded-full`}
                activeOpacity={0.8}
              >
                <Trash size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Title & Description */}
        <Text style={tw`text-white text-lg font-bold mb-2`}>{title}</Text>
        <Text style={tw`text-white/80 text-base mb-6`}>{description}</Text>

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
                <Text style={tw`text-teal-400 text-sm font-medium`}>
                  {showPerk ? "Show Less" : "See Perks"}
                </Text>
                <ChevronRight size={16} color="#14b8a6" />
              </>
            )}
          </TouchableOpacity>

          <View style={tw`flex-row items-center gap-2`}>
            {hasDiscount && (
              <Text style={tw`text-white/50 text-sm line-through`}>
                {numberWithCommas(price, true, null)}
              </Text>
            )}
            <Text style={tw`text-white text-base font-semibold`}>
              {numberWithCommas(displayPrice, true, null)}
            </Text>
          </View>
        </View>

        {/* Perks */}
        {showPerk && perks && (
          <View style={tw`gap-2 py-3`}>
            {perks.map((perk, idx) => (
              <Text key={idx} style={tw`text-white text-sm`}>
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
              style={tw`bg-[#ffff] h-8 w-8 rounded-full flex-row justify-center items-center`}
            >
              <Text style={tw`text-black text-lg`}>-</Text>
            </TouchableOpacity>
            <Text style={tw`text-white text-lg`}>{quantity}</Text>
            <TouchableOpacity
              onPress={handleAdd}
              style={tw`${
                quantity ? "bg-[#0FF1CF]" : "bg-[#ffff]"
              } h-8 w-8 rounded-full flex-row justify-center items-center`}
            >
              <Text style={tw`text-black text-lg`}>+</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Out of stock */}
        {!!ticketQuantity && !!sold && ticketQuantity - sold === 0 && (
          <Text style={tw`mt-3 text-red-500`}>Out of stock</Text>
        )}
      </View>
    </View>
  );
};

export default PricingCard;
