
import { EventPricing, EventTicket, eventPricingSchema } from "@/schemas/event";
import { showGlobalError, showGlobalWarning } from "@/utils/globalErrorHandler";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, PlusCircle } from "lucide-react-native";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text, TouchableOpacity, View } from "react-native";
import CustomSwitcher from "../CustomSwitcher";
import CustomView from "../View";
import CustomButton from "../buttons/CustomBtn1";
import Input from "../inputs/CustomInput1";
import PricingCard from "./TicketCard";




interface Props {
    createTicket: ()=>void
    onSave: (data: EventPricing) => void;
    tickets: EventTicket[] | undefined
    initialData?: EventPricing | null;
    setTicket: (updated: EventTicket[]) => void; 
    onEdit?:(data:EventTicket)=>void
    editMode?: boolean
}

const Pricing = ({createTicket,tickets,onSave,initialData,setTicket,onEdit,editMode=false}:Props) => {


    const {control,watch,
        setValue,
        reset,
         handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<EventPricing>({
        resolver: zodResolver(eventPricingSchema),
        defaultValues: initialData ||{
            registrationType:undefined,
            paid: false,
            registrationFee: undefined,
            limited: false,
            registrationAttendees: undefined,
            tickets:[]
        }
    })



    useEffect(() => {
        if (initialData) {
          reset(initialData);
        }
      }, [initialData, reset]);

   

    const registrationType = watch("registrationType");

    const paid = watch("paid")
    const limited = watch("limited")
   

    const ErrorText = ({ message }: { message?: string }) => message ? <Text className="text-red-500">{message}</Text> : null;
    const onError = (errors: any) => {
        showGlobalError("Error in form");
        console.log(errors);
    };
   
    useEffect(() => {
        const subscription = watch((value) => {
          console.log("Form changed:", value);
        });
        return () => subscription.unsubscribe();
      }, [watch])

      useEffect(()=>{
       if(tickets)
        setValue("tickets",tickets)
      },[tickets])
  
      const onSubmit = (data: EventPricing) => {

         onSave( data);
        console.log(data)
      };
  
    const onDelete = (id:string)=> {

        const updatedTickets = tickets?.filter(ticket=>ticket.id !== id)
        setTicket(updatedTickets??[])
       
    }

    const changePricing = (type:"registration" | "ticket",onChange:(event:any)=>void)=>{


        if(editMode){

            if( registrationType !== type)
                showGlobalWarning("you can't change pricing types")
            return
        }
        
        onChange(type)
    }

    
  return (
    <>
    <CustomView className='mb-16'>
           
    <Controller
        control={control}
        name="registrationType"
        render={({ field: { value, onChange } }) => ( 
        <CustomView className='flex-row justify-between'>

            <TouchableOpacity onPress={()=>changePricing("ticket",onChange)} className={`${registrationType === "ticket" ? "bg-[#0FF1CF] ":"bg-[#101C45]"}  p-5  rounded-xl mt-3 w-[45%] flex justify-center items-center`}>
              <Text className={`${registrationType === "ticket" ? "bg-[#0FF1CF] text-black":"bg-[#101C45] text-white "}`}>Ticket</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>changePricing("registration",onChange)} className={`${registrationType === "registration" ? "bg-[#0FF1CF] ":"bg-[#101C45]"}  p-5  rounded-xl mt-3 w-[45%] flex justify-center items-center`}>
              <Text className={`${registrationType === "registration" ? "bg-[#0FF1CF] text-black":"bg-[#101C45] text-white "}`}>Registration</Text>
            </TouchableOpacity>
        </CustomView>
        )}
        />
        {/* <CustomView className='gap-5 mb-5'>
            <CustomEventInfoSelector title='date'/>
            <CustomEventInfoSelector title='start date'/>
            <CustomEventInfoSelector title='end date'/>
            {priceType === "repeat" &&
            <>
                <CustomEventInfoSelector title='repeat'/>
                <CustomEventInfoSelector title='end repeat'/>
            </>
            }
        </CustomView> */}
        {
            !registrationType &&<View className="mt-5 gap-5 flex flex-row px-5"> 
            <Info color="white" size="15"/>
                    <Text className="text-white text-sm">An event ticket can have multiple 
                price options, meaning you can offer up to five different 
                ticket types, each with its own price. 
                However, registration-based events are limited to a single price tag.</Text>
                </View>
        }
        {
            registrationType ==="ticket" && 
            <CustomView>
                <TouchableOpacity className="flex flex-row gap-3 items-center mt-4" onPress={()=>createTicket()}>
                    <PlusCircle size={15} color={"#0FF1CF"}/>
                    <Text className="text-[#0FF1CF]" >Add New Ticket</Text>
                </TouchableOpacity>
                {
                    tickets?.map(ticket=>
                        <CustomView className="my-5">
                        <PricingCard 
                        updatedPrice={ticket.updatedPrice}
                        isVisible={ticket.isVisible}
                        isNew={ticket.isNew}
                        title={ticket.type} 
                        description={ticket.description}
                        price={ticket?.price || "Free"}
                        isEdit
                        onDelete={()=>onDelete(ticket.id)}
                        onEdit={()=>onEdit ? onEdit(ticket) :null}
                        
                        />
                    </CustomView>
                    )
                }
               
                <CustomButton onPress={handleSubmit(onSubmit,onError)} disabled={tickets?.length === 0} showArrow={false} buttonClassName='bg-[#0FF1CF] w-full mt-10' textClassName='!text-black' title='Save and Continue'/>
            </CustomView>
        }
        {
            registrationType ==="registration" &&
            <CustomView>
               
                <CustomView>
                    
                    <View className="flex flex-row justify-between items-center mb-4">
                        <Text className="text-white">{limited? "Limited" :"Unlimited"}</Text>
                        <Controller name="limited" control={control} render={({field:{value,onChange}})=>(
                            <CustomSwitcher isEnabled={value} setIsEnabled={onChange}/>
                        )}/>
                        
                    </View>
                   {limited && <Controller name="registrationAttendees" control={control} render={({field:{value,onChange}})=>(
                        <>
                        <Input numeric moneyFormat onChangeText={onChange} value={value?.toString()} placeholder="Number of attendees"/>
                        <ErrorText message={errors.registrationAttendees?.message}/>
                        </>
                    )}/>}
                    
                </CustomView>
                <CustomView>
                    
                    <View className="flex flex-row justify-between items-center mb-4">
                        <Text className="text-white">{paid ? "Paid" : "Free"}</Text>
                        <Controller name="paid" control={control} render={({field:{value,onChange}})=>(
                            <CustomSwitcher isEnabled={value} setIsEnabled={onChange}/>
                        )}/>
                        
                    </View>
                   {paid && <Controller name="registrationFee" control={control} render={({field:{value,onChange}})=>(
                        <>
                            <Input onChangeText={onChange} value={value?.toString()} placeholder="Price"/>
                            <ErrorText message={errors.registrationFee?.message}/>
                        </>
                    )}/>}
                </CustomView>
                <CustomButton onPress={handleSubmit(onSubmit,onError)} showArrow={false} buttonClassName='bg-[#0FF1CF] w-full mt-10' textClassName='!text-black' title='Save and Continue'/>
            </CustomView>
        }
     
    </CustomView>
   
    </>
  )
}

export default Pricing
