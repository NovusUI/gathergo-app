import {
  DateTimeFormData,
  dateTimeEditSchema,
  dateTimeSchema,
} from "@/schemas/event";
import { extractDate, extractTime } from "@/utils/dateTimeHandler";
import { showGlobalError } from "@/utils/globalErrorHandler";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, Resolver, useForm } from "react-hook-form";
import { Text, TouchableOpacity, View } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import tw, { style as twStyle } from "twrnc";
import CustomEventInfoSelector from "../CustomEventInfoSelector";
import CustomView from "../View";
import CustomButton from "../buttons/CustomBtn1";

interface DateAndTimeProps {
  onSave: (data: DateTimeFormData) => void;
  initialData?: DateTimeFormData | null;
  editMode: boolean;
  allowRecurring?: boolean;
}

type PickerType =
  | "date"
  | "endDate"
  | "startTime"
  | "endTime"
  | "repeat"
  | "endRepeat";

const toDate = (value?: Date | string | null) => {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const sameCalendarDate = (
  first?: Date | string | null,
  second?: Date | string | null
) => {
  const firstDate = toDate(first);
  const secondDate = toDate(second);

  if (!firstDate || !secondDate) return false;

  return extractDate(firstDate) === extractDate(secondDate);
};

const formatDateLabel = (value?: Date | string | null) => {
  const date = toDate(value);
  if (!date) return "";

  return date.toLocaleDateString("en-NG", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTimeLabel = (value?: string | null) => {
  if (!value) return "";

  const [hour, minute] = value.split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;

  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  return date.toLocaleTimeString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const addMinutesToTime = (value: string, minutesToAdd: number) => {
  const [hour, minute] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hour || 0, minute || 0, 0, 0);
  date.setMinutes(date.getMinutes() + minutesToAdd);
  return extractTime(date);
};

const getSuggestedStartTime = (selectedDate?: Date | string | null) => {
  const eventDate = toDate(selectedDate);
  const now = new Date();
  const suggestion = new Date();

  if (eventDate && extractDate(eventDate) === extractDate(now)) {
    suggestion.setTime(now.getTime() + 60 * 60 * 1000);

    if (suggestion.getMinutes() <= 30) {
      suggestion.setMinutes(30, 0, 0);
    } else {
      suggestion.setHours(suggestion.getHours() + 1, 0, 0, 0);
    }

    return extractTime(suggestion);
  }

  suggestion.setHours(9, 0, 0, 0);
  return extractTime(suggestion);
};

const getAllDayStartTime = (selectedDate?: Date | string | null) => {
  const eventDate = toDate(selectedDate);
  const now = new Date();

  if (eventDate && extractDate(eventDate) === extractDate(now)) {
    return getSuggestedStartTime(selectedDate);
  }

  return "00:00";
};

const getTimePickerDate = (value?: string | null) => {
  const date = new Date();

  if (!value) return date;

  const [hour, minute] = value.split(":").map(Number);
  if (!Number.isNaN(hour) && !Number.isNaN(minute)) {
    date.setHours(hour, minute, 0, 0);
  }

  return date;
};

const ChoicePill = ({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={twStyle(
      "flex-1 rounded-full border px-4 py-3",
      selected
        ? "border-[#0FF1CF] bg-[#0FF1CF]"
        : "border-[#223B68] bg-[#101C45]"
    )}
  >
    <Text
      style={twStyle(
        "text-center text-sm font-semibold",
        selected ? "text-[#01082E]" : "text-white"
      )}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const DateAndTime = ({
  onSave,
  initialData,
  editMode = false,
  allowRecurring = false,
}: DateAndTimeProps) => {
  const [picker, setPicker] = useState<PickerType | null>(null);
  const [sameEndDate, setSameEndDate] = useState(
    initialData?.startDate && initialData?.endDate
      ? sameCalendarDate(initialData.startDate, initialData.endDate)
      : true
  );
  const [isAllDay, setIsAllDay] = useState<boolean | null>(() => {
    if (!initialData?.startTime && !initialData?.endTime) return null;
    return (
      initialData?.startTime === "00:00" && initialData?.endTime === "23:59"
    );
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
  } = useForm<DateTimeFormData>({
    resolver: zodResolver(
      editMode ? dateTimeEditSchema : dateTimeSchema
    ) as Resolver<DateTimeFormData>,
    defaultValues: initialData || {
      startDate: undefined,
      endDate: undefined,
      isRecurring: false,
      startTime: undefined,
      endTime: undefined,
      repeat: "NONE",
      endRepeat: undefined,
    },
  });

  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const startTime = watch("startTime");
  const endTime = watch("endTime");
  const isRecurring = watch("isRecurring");
  const repeat = watch("repeat");

  useEffect(() => {
    if (!initialData) {
      return;
    }

    reset(initialData);
    setSameEndDate(
      initialData.startDate && initialData.endDate
        ? sameCalendarDate(initialData.startDate, initialData.endDate)
        : true
    );
    setIsAllDay(
      initialData.startTime || initialData.endTime
        ? initialData.startTime === "00:00" && initialData.endTime === "23:59"
        : null
    );
  }, [initialData, reset]);

  useEffect(() => {
    if (!allowRecurring) {
      return;
    }

    if (isRecurring) {
      setValue("repeat", repeat === "NONE" ? "DAILY" : repeat);
    } else {
      setValue("repeat", "NONE");
    }
  }, [allowRecurring, isRecurring, repeat, setValue]);

  useEffect(() => {
    if (sameEndDate && startDate) {
      setValue("endDate", startDate, { shouldValidate: false });
    }
  }, [sameEndDate, setValue, startDate]);

  const onError = (errors: any) => {
    showGlobalError("Error in form");
    console.log(errors);
  };

  const ErrorText = ({ message }: { message?: string }) =>
    message ? <Text className="text-red-500">{message}</Text> : null;

  const repeatOptions = [
    { label: "Daily", value: "DAILY" },
    { label: "Weekly", value: "WEEKLY" },
  ];

  const selectSameEndDate = (value: boolean) => {
    setSameEndDate(value);

    const selectedStartDate = toDate(startDate);
    if (!selectedStartDate) return;

    if (value) {
      setValue("endDate", selectedStartDate, { shouldValidate: true });
      return;
    }

    const selectedEndDate = toDate(endDate);
    if (
      !selectedEndDate ||
      sameCalendarDate(selectedStartDate, selectedEndDate)
    ) {
      const suggestedEndDate = new Date(selectedStartDate);
      suggestedEndDate.setDate(suggestedEndDate.getDate() + 1);
      setValue("endDate", suggestedEndDate, { shouldValidate: false });
    }
  };

  const selectAllDay = (value: boolean) => {
    setIsAllDay(value);

    if (value) {
      setValue("startTime", getAllDayStartTime(startDate), {
        shouldValidate: true,
      });
      setValue("endTime", "23:59", { shouldValidate: true });
      return;
    }

    const nextStartTime = startTime || getSuggestedStartTime(startDate);
    setValue("startTime", nextStartTime, { shouldValidate: false });
    setValue("endTime", endTime || addMinutesToTime(nextStartTime, 60), {
      shouldValidate: false,
    });
  };

  const onSubmit = (data: DateTimeFormData) => {
    if (!allowRecurring) {
      onSave({
        ...data,
        isRecurring: initialData?.isRecurring || false,
        repeat: initialData?.repeat || "NONE",
        endRepeat: initialData?.endRepeat,
      });
      return;
    }

    onSave(data);
  };

  const renderDateTimePicker = (
    fieldValue: any,
    onChange: (value: any) => void,
    pickerType: "date" | "endDate" | "startTime" | "endTime" | "endRepeat",
    mode: "date" | "time"
  ) => {
    if (picker !== pickerType) return null;

    return (
      <DateTimePickerModal
        isVisible={true}
        mode={mode}
        date={
          mode === "time"
            ? getTimePickerDate(fieldValue)
            : toDate(fieldValue) || new Date()
        }
        onConfirm={(selected) => {
          if (mode === "date") {
            onChange(selected);

            if (pickerType === "date") {
              const selectedEndDate = toDate(endDate);

              if (sameEndDate || !selectedEndDate) {
                setValue("endDate", selected, { shouldValidate: false });
              } else if (selectedEndDate < selected) {
                const suggestedEndDate = new Date(selected);
                suggestedEndDate.setDate(suggestedEndDate.getDate() + 1);
                setValue("endDate", suggestedEndDate, {
                  shouldValidate: false,
                });
              }
            }
          } else {
            const nextTime = extractTime(selected);
            onChange(nextTime);

            if (
              pickerType === "startTime" &&
              (!endTime || endTime <= nextTime)
            ) {
              setValue("endTime", addMinutesToTime(nextTime, 60), {
                shouldValidate: false,
              });
            }
          }

          setPicker(null);
        }}
        onCancel={() => setPicker(null)}
      />
    );
  };

  return (
    <CustomView style={tw`mb-16`}>
      {allowRecurring ? (
        <Controller
          control={control}
          name="isRecurring"
          render={({ field: { value, onChange } }) => (
            <CustomView style={tw`flex-row justify-between`}>
              <TouchableOpacity
                onPress={() => onChange(false)}
                style={tw`
                  ${!value ? "bg-[#0FF1CF]" : "bg-[#101C45]"}
                  p-5 rounded-xl mt-3 w-[45%] justify-center items-center
                `}
              >
                <Text style={tw`${!value ? "text-[#01082E]" : "text-white"}`}>
                  One off event
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onChange(true)}
                style={tw`
                  ${value ? "bg-[#0FF1CF]" : "bg-[#101C45]"}
                  p-5 rounded-xl mt-3 w-[45%] justify-center items-center
                `}
              >
                <Text style={tw`${value ? "text-[#01082E]" : "text-white"}`}>
                  Recurring Event
                </Text>
              </TouchableOpacity>
            </CustomView>
          )}
        />
      ) : null}

      <CustomView style={tw`gap-5 mb-5`}>
        <View style={tw`rounded-3xl bg-[#08143B] p-4`}>
          <Text style={tw`text-xs uppercase tracking-widest text-[#8FA1CB]`}>
            Date
          </Text>
          <Text style={tw`mt-1 text-sm leading-5 text-[#B7C5E9]`}>
            Pick the day people should show up.
          </Text>

          <View style={tw`mt-4`}>
            <Controller
              control={control}
              name="startDate"
              render={({ field: { value, onChange } }) => (
                <>
                  <CustomEventInfoSelector
                    title="Date"
                    value={formatDateLabel(value)}
                    onPress={() => setPicker("date")}
                  />
                  <ErrorText message={errors.startDate?.message} />
                  {renderDateTimePicker(value, onChange, "date", "date")}
                </>
              )}
            />
          </View>

          {startDate && (
            <View style={tw`mt-4`}>
              <Text style={tw`mb-3 text-sm font-semibold text-white`}>
                Does it end the same day?
              </Text>
              <View style={tw`flex-row gap-3`}>
                <ChoicePill
                  label="Same day"
                  selected={sameEndDate}
                  onPress={() => selectSameEndDate(true)}
                />
                <ChoicePill
                  label="Different day"
                  selected={!sameEndDate}
                  onPress={() => selectSameEndDate(false)}
                />
              </View>
            </View>
          )}

          {startDate && !sameEndDate && (
            <View style={tw`mt-4`}>
              <Controller
                control={control}
                name="endDate"
                render={({ field: { value, onChange } }) => (
                  <>
                    <CustomEventInfoSelector
                      title="Ends"
                      value={formatDateLabel(value)}
                      onPress={() => setPicker("endDate")}
                    />
                    <ErrorText message={errors.endDate?.message} />
                    {renderDateTimePicker(value, onChange, "endDate", "date")}
                  </>
                )}
              />
            </View>
          )}
        </View>

        {startDate && (
          <View style={tw`rounded-3xl bg-[#08143B] p-4`}>
            <Text style={tw`text-xs uppercase tracking-widest text-[#8FA1CB]`}>
              Time
            </Text>
            <Text style={tw`mt-2 text-sm leading-5 text-[#B7C5E9]`}>
              Choose all-day or set the exact time window.
            </Text>

            <View style={tw`mt-4`}>
              <Text style={tw`mb-3 text-sm font-semibold text-white`}>
                Is this an all-day event?
              </Text>
              <View style={tw`flex-row gap-3`}>
                <ChoicePill
                  label="All day"
                  selected={isAllDay === true}
                  onPress={() => selectAllDay(true)}
                />
                <ChoicePill
                  label="Set times"
                  selected={isAllDay === false}
                  onPress={() => selectAllDay(false)}
                />
              </View>
            </View>

            {isAllDay === true && (
              <View style={tw`mt-4 rounded-2xl bg-[#101C45] p-4`}>
                <Text style={tw`text-sm font-semibold text-[#0FF1CF]`}>
                  All day
                </Text>
                <Text style={tw`mt-1 text-xs leading-5 text-[#B7C5E9]`}>
                  GatherGo will hold the event window from{" "}
                  {formatTimeLabel(startTime || getAllDayStartTime(startDate))}{" "}
                  to {formatTimeLabel(endTime || "23:59")}.
                </Text>
              </View>
            )}

            {isAllDay === false && (
              <View style={tw`mt-4 gap-3`}>
                <Controller
                  control={control}
                  name="startTime"
                  render={({ field: { value, onChange } }) => (
                    <>
                      <CustomEventInfoSelector
                        title="Starts"
                        value={formatTimeLabel(value)}
                        onPress={() => setPicker("startTime")}
                      />
                      <ErrorText message={errors.startTime?.message} />
                      {renderDateTimePicker(
                        value,
                        onChange,
                        "startTime",
                        "time"
                      )}
                    </>
                  )}
                />

                <Controller
                  control={control}
                  name="endTime"
                  render={({ field: { value, onChange } }) => (
                    <>
                      <CustomEventInfoSelector
                        title="Ends"
                        value={formatTimeLabel(value)}
                        onPress={() => setPicker("endTime")}
                      />
                      <ErrorText message={errors.endTime?.message} />
                      {renderDateTimePicker(value, onChange, "endTime", "time")}
                    </>
                  )}
                />
              </View>
            )}

            {isAllDay === null && (errors.startTime || errors.endTime) && (
              <ErrorText message="Choose all day or set the event times." />
            )}
          </View>
        )}

        {allowRecurring && isRecurring && (
          <>
            <Controller
              control={control}
              name="repeat"
              render={({ field: { value } }) => (
                <>
                  <CustomEventInfoSelector
                    title="repeat"
                    value={value ?? ""}
                    onPress={() => setPicker("repeat")}
                  />
                  <ErrorText message={errors.repeat?.message} />

                  {picker === "repeat" && (
                    <CustomView style={tw`bg-white p-4 rounded-xl shadow-lg`}>
                      {repeatOptions.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          onPress={() => {
                            setValue(
                              "repeat",
                              option.value as DateTimeFormData["repeat"]
                            );
                            setPicker(null);
                          }}
                          style={tw`p-3`}
                        >
                          <Text style={tw`text-black`}>{option.label}</Text>
                        </TouchableOpacity>
                      ))}

                      <TouchableOpacity
                        onPress={() => setPicker(null)}
                        style={tw`p-3`}
                      >
                        <Text style={tw`text-red-500`}>Cancel</Text>
                      </TouchableOpacity>
                    </CustomView>
                  )}
                </>
              )}
            />

            <Controller
              control={control}
              name="endRepeat"
              render={({ field: { value, onChange } }) => (
                <>
                  <CustomEventInfoSelector
                    title="end repeat"
                    value={formatDateLabel(value)}
                    onPress={() => setPicker("endRepeat")}
                  />
                  <ErrorText message={errors.endRepeat?.message} />
                  {renderDateTimePicker(value, onChange, "endRepeat", "date")}
                </>
              )}
            />
          </>
        )}
      </CustomView>

      <CustomButton
        onPress={handleSubmit(onSubmit, onError)}
        disabled={isSubmitting}
        showArrow={false}
        buttonClassName="bg-[#0FF1CF] w-full"
        textClassName="!text-black"
        title={isSubmitting ? "Saving..." : "Save and Continue"}
      />
    </CustomView>
  );
};

export default DateAndTime;
