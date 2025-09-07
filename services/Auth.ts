import { getItem } from "@/utils/storage";

export * from "./mutations";
export * from "./queries";

export const getAuthToken = async() => {
    const token = await getItem("token")
    return token || null
  }