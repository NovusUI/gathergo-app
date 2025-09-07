import { useAuth } from "@/context/AuthContext";
import { CompleteProfileData, StandardResponse, authResponse, checkUsernameRes, uploadProfilePictureRes } from "@/types/auth";
import { GetTickets, GetTicketsResponse } from "@/types/event";
import { saveItem } from "@/utils/storage";
import { UseMutationOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { QUERY_KEYS } from "./queryKeys";
import { SignUpPayload, UserResponse, checkUsernameExists, completUserProfile, createEvent, edtUserBio, getTickets, googleLoginFn, loginFn, logoutFn, registerForEvent, signUpFn, updateEvent, updatePreference, uploadPicture } from "./serviceFn";



export const useLogin = () => {
  const queryClient = useQueryClient();

  const { setUser,setToken } = useAuth();
  return useMutation({
    mutationFn: loginFn,
    onSuccess: async(data) => {
      // ✅ set current user cache after login
      console.log(data,"data")
      setUser(data.data.user)
      setToken(data.data.accessToken)
      await saveItem("token", data.data.accessToken);
      await saveItem("user", JSON.stringify(data.data.user));
      //queryClient.setQueryData(QUERY_KEYS.currentUser, data.user);
    },
  });
};
export const useSavePreferences = () => {
    const { user, setUser } = useAuth();
  
    return useMutation({
      mutationFn:updatePreference,
      onSuccess: async (data) => {
        // update user state
        const updatedUser = { ...user, hasPreferences: true };
        setUser(updatedUser);
  
        // optionally persist updated user locally
        await saveItem("user", JSON.stringify(updatedUser));
  

    },
      onError: (err: any) => {
        console.log(err)
      },
    });
  };

export const useSignUpMutation = () => {
   
    const { setUser } = useAuth();
    return useMutation<UserResponse, Error, SignUpPayload>({
      mutationFn: signUpFn,
      onSuccess: (data) => {
        console.log(data,"data")
        //setUser(data); // automatically set user on signup success

        // saveItem("user")
        // saveItem("token")
      },
      onError:(error)=>{
         console.log(error)
        
     
    }
       
    });
  };

  export const useGoogleLogin = () => {
    const queryClient = useQueryClient();
    const { setUser ,setToken} = useAuth();
  
    return useMutation<authResponse, any, string>({
      mutationFn: googleLoginFn,
      onSuccess: async(data) => {
        setUser(data.data.user)
      setToken(data.data.accessToken)
      await saveItem("token", data.data.accessToken);
      await saveItem("user", JSON.stringify(data.data.user));
        //queryClient.setQueryData(QUERY_KEYS.currentUser, data.user);
      },
    });
  };

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutFn,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: QUERY_KEYS.currentUser });
    },
  });
};

export const useCheckUsernameExists = (
    options: UseMutationOptions<checkUsernameRes, AxiosError,string>
  ) => {
    const { mutate, mutateAsync, isPending,error } = useMutation({mutationFn:checkUsernameExists,...options})
  
    return { mutate, mutateAsync, isPending,error }
  }

  export const useCompleteProfile = (
    options: UseMutationOptions<StandardResponse, AxiosError,CompleteProfileData>
  ) => {
    const { mutate, mutateAsync, isPending,error } = useMutation({mutationFn:completUserProfile,...options})
  
    return { mutate, mutateAsync, isPending,error }
  }

  export const useEditBio = (
    options: UseMutationOptions<StandardResponse, AxiosError,{bio:string}>
  ) => {
    const { mutate, mutateAsync, isPending,error } = useMutation({mutationFn:edtUserBio,...options})
  
    return { mutate, mutateAsync, isPending,error }
  }

  export const useEditProfilePicture = (
    options: UseMutationOptions<uploadProfilePictureRes, AxiosError,FormData>
  ) => {
    const { mutate, mutateAsync, isPending,error } = useMutation({mutationFn:uploadPicture,...options})
  
    return { mutate, mutateAsync, isPending,error }
  }


  export const useCreateEvent = (
    options: UseMutationOptions<StandardResponse, AxiosError,FormData>
  ) => {
    const { mutate, mutateAsync, isPending,error } = useMutation({mutationFn:createEvent,...options})
  
    return { mutate, mutateAsync, isPending,error }
  }

  export const useUpdateEvent = (eventId :string,
    options: UseMutationOptions<StandardResponse, AxiosError,FormData>
  ) => {
    const { mutate, mutateAsync, isPending,error } = useMutation({mutationFn:(formData:FormData)=>updateEvent(formData,eventId),...options})
  
    return { mutate, mutateAsync, isPending,error }
  }

  export const useGetTickets = (
    options: UseMutationOptions<GetTicketsResponse, AxiosError,GetTickets[]>
  ) => {
    const { mutate, mutateAsync, isPending,error } = useMutation({mutationFn:getTickets,...options})
  
    return { mutate, mutateAsync, isPending,error }
  }


  export const useRegisterEvent = (
    options: UseMutationOptions<StandardResponse, AxiosError,string>
  ) => {
    const { mutate, mutateAsync, isPending,error } = useMutation({mutationFn:registerForEvent,...options})
  
    return { mutate, mutateAsync, isPending,error }
  }
