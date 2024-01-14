
export interface EventList {
    list: EventWrapper[]
    total: number
    type_list: EventTypeList[]
    alert: boolean
    alert_id: number
    timezone: number
    t: string
    pic_list: any[]
    pic_total: number
    pic_type_list: any[]
    pic_alert: boolean
    pic_alert_id: number
    static_sign: string
}
  
export interface EventWrapper {
    list: Event[]
    type_id: number
    type_label: string
}
  
export interface Event {
    ann_id: number
    title: string
    subtitle: string
    banner: string
    content: string
    type_label: string
    tag_label: string
    tag_icon: string
    login_alert: number
    lang: string
    start_time: string
    end_time: string
    type: number
    remind: number
    alert: number
    tag_start_time: string
    tag_end_time: string
    remind_ver: number
    has_content: boolean
    extra_remind: number
    tag_icon_hover: string
}

//random hoyo thing
export interface EventTypeList {
    id: number
    name: string
    mi18n_name: string
}
  
