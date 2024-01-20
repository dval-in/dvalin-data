
export interface EventList {
    list: EventWrapper[]
    total: number
    typeList: EventTypeList[]
    alert: boolean
    alertId: number
    timeZone: number
    t: string
    picList: any[]
    picTotal: number
    picTypeList: any[]
    picAlert: boolean
    picAlertId: number
    staticSign: string
}
  
export interface EventWrapper {
    list: Event[]
    typeId: number
    typeLabel: string
}
  
export interface Event {
    annId: number
    title: string
    subTitle: string
    banner: string
    content: string
    typeLabel: string
    tagLabel: string
    tagIcon: string
    loginAlert: number
    lang: string
    startTime: string
    endTime: string
    type: number
    remind: number
    alert: number
    tagStartTime: string
    tagEndTime: string
    remindVer: number
    hasContent: boolean
    extraRemind: number
    tagIconHover: string
}

//random hoyo thing
export interface EventTypeList {
    id: number
    name: string
    mi18nName: string
}
  
