import { DateTimeFormData, dateTimeEditSchema, dateTimeSchema } from "@/schemas/event";
import { extractDate, extractTime } from "@/utils/dateTimeHandler";
import { showGlobalError } from "@/utils/globalErrorHandler";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text, TouchableOpacity } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import CustomEventInfoSelector from "../CustomEventInfoSelector";
import CustomView from "../View";
import CustomButton from "../buttons/CustomBtn1";

interface DateAndTimeProps {
  onSave: (data: DateTimeFormData) => void;
  initialData?: DateTimeFormData | null;
  editMode: boolean
}

const DateAndTime = ({onSave,initialData,editMode=false}:DateAndTimeProps) => {



  const [picker, setPicker] = useState<null | "endDate" |  "startDate" | "startTime" | "endTime" | "repeat" | "endRepeat">(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm< DateTimeFormData>({
    resolver: zodResolver(editMode ? dateTimeEditSchema : dateTimeSchema),
    defaultValues: initialData || {
      startDate: undefined,
      endDate:undefined,
      isRecurring: false,
      startTime: undefined,
      endTime: undefined,
      repeat: "NONE",
      endRepeat: undefined,
    },
  });

  const isRecurring = watch("isRecurring");
  const repeat = watch("repeat")


  useEffect(()=>{
    if(isRecurring){
      setValue("repeat",repeat === "NONE" ? "DAILY": repeat)
    }else{
      setValue("repeat","NONE")
      
    }
  },[isRecurring])

  const onError = (errors: any) => {
    showGlobalError("Error in form");
    console.log(errors);
  };

  const ErrorText = ({ message }: { message?: string }) => message ? <Text className="text-red-500">{message}</Text> : null;

  const repeatOptions = [
    { label: "Daily", value: "DAILY" },
    { label: "Weekly", value: "WEEKLY" },

  ];
  

  const onSubmit = (data: DateTimeFormData) => {
    onSave( data);
  };

  const renderDateTimePicker = (
    fieldValue: any,
    onChange: (value: any) => void,
    pickerType: "startDate" | "endDate" | "startTime" | "endTime" | "endRepeat",
    mode: "date" | "time"
  ) => {
    if (picker !== pickerType) return null;
  
    return (
      <DateTimePickerModal
        isVisible={true}
        mode={mode}
        onConfirm={(selected) => {
          onChange(mode === "date" ? extractDate(selected) : extractTime(selected));
          setPicker(null);
        }}
        onCancel={() => setPicker(null)}
      />
    );
  };

  useEffect(() => {
    const subscription = watch((value) => {
      console.log("Form changed:", value);
    });
    return () => subscription.unsubscribe();
  }, [watch]);


  return (
    <CustomView className="mb-16">
      {/* Toggle recurring */}
      <Controller
        control={control}
        name="isRecurring"
        render={({ field: { value, onChange } }) => (
          <CustomView className="flex-row justify-between">
            <TouchableOpacity
              onPress={() => onChange(false)}
              className={`${
                !value ? "bg-[#0FF1CF]" : "bg-[#101C45]"
              } p-5 rounded-xl mt-3 w-[45%] flex justify-center items-center`}
            >
              <Text
                className={`${
                  !value ? "text-black" : "text-white"
                }`}
              >
                One off event
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onChange(true)}
              className={`${
                value ? "bg-[#0FF1CF]" : "bg-[#101C45]"
              } p-5 rounded-xl mt-3 w-[45%] flex justify-center items-center`}
            >
              <Text
                className={`${
                  value ? "text-black" : "text-white"
                }`}
              >
                Recurring Event
              </Text>
            </TouchableOpacity>
          </CustomView>
        )}
      />

      {/* Date & time fields */}
      <CustomView className="gap-5 mb-5">
      <Controller
  control={control}
  name="startDate"
  render={({ field: { value, onChange } }) => (
    <>
      <CustomEventInfoSelector
        title="date"
        value={typeof value === "string"  ? value : value ?  extractDate(value): value }
        onPress={() => setPicker("startDate")}
      />
      <ErrorText message={errors.startDate?.message} />
      {renderDateTimePicker(value, onChange, "startDate", "date")}
     
    </>
  )}
/>

<Controller
  control={control}
  name="endDate"
  render={({ field: { value, onChange } }) => (
    <>
      <CustomEventInfoSelector
        title="End date"
        value={ typeof value === "string"  ? value :  value ?  extractDate(value): value }
        onPress={() => setPicker("endDate")}
      />
      <ErrorText message={errors.endDate?.message} />

      {renderDateTimePicker(value, onChange, "endDate", "date")}

    </>
  )}
/>


        <Controller
          control={control}
          name="startTime"
          render={({ field: { value, onChange } }) => (
            <>
            <CustomEventInfoSelector
              title="start time"
              value={value}
              onPress={() => setPicker("startTime")}
            />
            <ErrorText message={errors.startTime?.message} />
            {renderDateTimePicker(value, onChange, "startTime", "time")}
           
            </>
          )}
        />

        <Controller
          control={control}
          name="endTime"
          render={({ field: { value, onChange } }) => (
            <>
            <CustomEventInfoSelector
              title="end time"
              value={value}
              onPress={()=> setPicker("endTime")}
            />
            <ErrorText message={errors.endTime?.message} />
            {renderDateTimePicker(value, onChange, "endTime", "time")}
            </>
            
          )}
        />

        {isRecurring && (
          <>
            <Controller
              control={control}
              name="repeat"
              render={({ field: { value, onChange } }) => (
                <>

                <CustomEventInfoSelector
                  title="repeat"
                  value={value}
                  onPress={()=>setPicker("repeat")}
                />
                <ErrorText message={errors.repeat?.message} />
                {picker === "repeat" && (
  <CustomView className="bg-white p-4 rounded-xl shadow-lg">
    {repeatOptions.map(option => (
      <TouchableOpacity
        key={option.value}
        onPress={() => {
          setValue("repeat", option.value);
          setPicker(null);
        }}
        className="p-3"
      >
        <Text className="text-black">{option.label}</Text>
      </TouchableOpacity>
    ))}
    <TouchableOpacity onPress={() => setPicker(null)} className="p-3">
      <Text className="text-red-500">Cancel</Text>
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
                  value={typeof value === "string"  ? value : value? extractDate(value): value }
                  onPress={()=>setPicker("endRepeat")}
                />
                <ErrorText message={errors.endRepeat?.message} />
                {renderDateTimePicker(value, onChange, "endRepeat", "date")}
                </>
              )}
            />
          </>
        )}
      </CustomView>

      {/* Submit */}
      <CustomButton
        onPress={handleSubmit(onSubmit,onError)}
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
