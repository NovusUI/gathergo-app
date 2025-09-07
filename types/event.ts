
import { EventData, StandardResponse } from "./auth";

// export interface StandardResponse {
//     status: string
//     status_code: number
//     message: string
//     data:any

//   }

export enum searchTypes {
    EVENTS = 'events',
    USERS = 'users',
    communities = 'communites',
}

interface paginatedResponse extends StandardResponse {
    meta:{total:number,
    page:number,
    pageSize:number,
    hasNextPage: boolean
}
}

type EventTicket = {
    id:string,
    type: string,
    description: string,
    price:number,
    quantity: number,
    sold: number,
    perks: string [],
    isVisible:boolean,
    updatedPrice: number | null
}

export interface PaginatedEventResponse extends paginatedResponse {
    data : EventData[]
}

export interface PaginatedSeachResponse extends paginatedResponse {
    data : EventData[] | {id:string}[] // event, community, or user
}
export interface EventDetails extends EventData {
    eventTickets?: EventTicket[]
 }

export interface EventDetailsResponse extends StandardResponse {

    data: EventDetails
}
 
export interface GetTickets {

    id: string,
    quantity: number,
    ticketName: string,
   
}

export interface GetTicketsResponse extends StandardResponse {

    data: {
        message:  string,
        transactionId: string,
        paymentUrl: string | null
        unavailableTickets: any[],
        freeTickets: any[]
        totalAmount: number
    }
}


