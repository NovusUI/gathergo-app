import { EventTicket, eventTicketSchema } from '@/schemas/event'
import { showGlobalError, showGlobalSuccess } from '@/utils/globalErrorHandler'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Text, View } from 'react-native'
import "react-native-get-random-values"
import { v4 as uuidv4 } from "uuid"
import CustomSwitcher from '../CustomSwitcher'
import CustomView from '../View'
import CustomButton from '../buttons/CustomBtn1'
import Input from '../inputs/CustomInput1'
import TextArea from '../inputs/CustomTextArea'
import PerksList from './PerkList'


interface Props {
  setTicket: (updated: EventTicket[]) => void;
  tickets: EventTicket[] | undefined
  close: ()=>void
  editingTicket?: EventTicket | null;
  editMode?:boolean
}

const CreateTicket = ({setTicket,tickets,close,editingTicket,editMode=false}:Props) => {

const id = uuidv4()
  const {control,watch,formState:{errors,}, reset, handleSubmit,setValue}  = useForm<EventTicket>({
      resolver:zodResolver(eventTicketSchema),
      defaultValues: {
        description: "",
        limited: true,
        quantity: undefined,
        paid:true,
        price: undefined,
        type: "",
        perks: [],
        updatedPrice: undefined,
        isVisible:true,
        isNew: true,
        id 
      }
  })

  useEffect(() => {
    if (editingTicket) {
      console.log(editingTicket)
      reset(editingTicket); // ✅ Populate form with existing ticket values
    }else{
      console.log("reset")
      reset({
        description: "",
        limited: true,
        quantity: undefined,
        paid:true,
        price: undefined,
        type: "",
        perks: [],
        updatedPrice: undefined,
        isVisible:true,
        isNew: true,
        id 
      })
    }
  }, [editingTicket]);
  

  const ErrorText = ({ message }: { message?: string }) => message ? <Text className="text-red-500">{message}</Text> : null;

  const limited = watch("limited")
  const paid = watch("paid")
  const isNew = watch("isNew")


  useEffect(() => {
    const subscription = watch((value) => {
      console.log("Form changed:", value);
    });
    return () => subscription.unsubscribe();
  }, [watch]);
   
  const onError = (errors: any) => {
    showGlobalError("Error in form");
    console.log(errors);
  };

  useEffect(()=>{
    if(!limited){
      setValue("quantity",1000000)
    }
    if(!paid){
      if(editMode && !isNew)
        setValue("updatedPrice",0)
      if(!editMode)
        setValue("price",0)
    }
  },[limited,paid])


  const onSubmit = async(data:EventTicket) => {
    
    console.log(data,"defined")

    const updatedTickets = tickets?.filter(ticket=>ticket.id !== data.id) || []
    
    setTicket([...updatedTickets, data]);
    close()
    reset({
      description: "",
      limited: true,
      quantity: undefined,
      paid:true,
      price: undefined,
      type: "",
      perks: [],
      updatedPrice: undefined,
      isVisible:true,
      isNew: true,
      id 
    }); 
  }

  const onSubmitAndAddNew = async(data:EventTicket) => {
    
    const updatedTickets = tickets?.filter(ticket=>ticket.id !== data.id) || []
    setTicket([...updatedTickets, data]);
   
    showGlobalSuccess("saved successfully")
    reset({
      description: "",
      limited: true,
      quantity: undefined,
      paid:true,
      price: undefined,
      type: "",
      perks: [],
      updatedPrice: undefined,
      isVisible:true,
      isNew: true,
      id 
    }); 
  }

  return (
    <CustomView className='gap-8'>
        <View className='gap-3'>
            <Text className='text-white'>Name of ticket</Text>
            <Controller
              control={control}
              name='type'
              render={({field:{value,onChange}})=>(
                <>
              <Input  value={value} onChangeText={onChange} placeholder='Basic'/>
                  <ErrorText message={errors.type?.message}/>
                </>
           
              )}
            />
        </View>
        <View className='gap-3'>
            <Text className='text-white'>Ticket Description</Text>
            <Controller
              control={control}
              name='description'
              render={({field:{value,onChange}})=>(
                <>
                    <TextArea maxLength={100} onChange={onChange} value={value}/>
                 <ErrorText message={errors.description?.message}/>
                </>
        
            )}
            />
        </View>
        <CustomView className='my-5'>
        <Controller
  control={control}
  name="perks"
  defaultValue={[]} // make sure your schema has perks: z.array(z.string())
  render={({ field: { value, onChange } }) => (
    <PerksList value={value || []} onChange={onChange} />
  )}
/>
        </CustomView>
        <View className='gap-3'>
        <View className="flex flex-row justify-between items-center gap-3">
                        <Text className="text-white">{limited ? "Limited":"Unlimited"}</Text>
                        <Controller
              control={control}
              name='limited'
              render={({field:{value,onChange}})=>(
                        <CustomSwitcher  isEnabled={value} setIsEnabled={onChange}/>
                        )}
            />
                 
                    </View>
                 {limited &&   <Controller
              control={control}
              name='quantity'
              render={({field:{value,onChange}})=>(
                <>
              <Input numeric moneyFormat onChangeText={onChange} value={value} placeholder='enter quantity'/>
               <ErrorText message={errors.quantity?.message}/>
              </>
            )}
            />}
        </View>
        
        
        <View className='gap-3'>
        <View className="flex flex-row justify-between items-center gap-3">
                        <Text className="text-white">{paid ? "Paid" :"Free"}</Text>
                        <Controller
              control={control}
              name='paid'
              render={({field:{value,onChange}})=>(
                      
                        <CustomSwitcher isEnabled={value} setIsEnabled={onChange}/>
              )}
              />
                     
                    </View>
            {
              paid &&
              <Controller
              control={control}
              name={(editMode && !isNew) ? 'updatedPrice':'price'}
              render={({field:{value,onChange}})=>(
                <>
                  <Input numeric moneyFormat placeholder='enter price' onChangeText={onChange} value={value} />
                  <ErrorText message={errors.price?.message}/>
                </>
              )}
            />}
            
        </View>
        <View className="gap-3">
  <View className="flex flex-row justify-between items-center gap-3">
    <Text className="text-white">{watch("isVisible") ? "Visible" : "Hidden"}</Text>
    <Controller
      control={control}
      name="isVisible"
      render={({ field: { value, onChange } }) => (
        <CustomSwitcher isEnabled={value} setIsEnabled={onChange} />
      )}
    />
  </View>
</View>
        <CustomView className="gap-5">
        <CustomButton onPress={handleSubmit(onSubmit,onError)} buttonClassName="bg-[#0FF1CF] w-full" showArrow={false} textClassName="!text-black" title="save ticket"/>
        <CustomButton onPress={handleSubmit(onSubmitAndAddNew,onError)} buttonClassName="border-[#0FF1CF] w-full"  textClassName="!text-[#0FF1CF]" showArrow={false} title="save and add new ticket"/>
      </CustomView>
    </CustomView>
  )
}

export default CreateTicket
