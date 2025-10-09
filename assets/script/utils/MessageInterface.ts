
import { GEventType, GEventData } from "../enum/GEvent";
import { ProtoCode } from "../net/ProtoCode";

type ID_DATA<ID, DATA extends Record<string | number | symbol, unknown>> = {
    [K in KeyLikeValues<ID>]: K extends Keys<DATA> ? DATA[K] : null | undefined;
};

type CODE_DATA<ID, DATA extends Record<string | number | symbol, unknown>> = {
    [K in KeyLikeValues<ID>]: K extends Keys<DATA> ? DATA[K] : null | undefined;
};

type ProtoCodeType = typeof ProtoCode;
type ProtoCodeData = UnionRecords<[Record<number, Object>]>;

type MSG_ID_DATA = Prettify<CODE_DATA<ProtoCodeType, ProtoCodeData> & ID_DATA<GEventType, GEventData>>;

export type MSG_IDS = keyof MSG_ID_DATA;

export type MSG_IDS_NONNULL = ReverseFilterKeys<MSG_ID_DATA, null | undefined>;

export type MSG_IDS_NULL = FilterKeys<MSG_ID_DATA, null | undefined>;

export type MSG_DATA<K extends MSG_IDS> = MSG_ID_DATA[K];

export interface IMsgCls {
    /** 当类被初始化时调用 */
    init(): void;
}

/** 消息监听控制器接口 */
export interface MethodVo {
    method: Function;
    isArray: boolean;
    priority: number;
    times: number;
}

export interface ProtoInfo {
    key: number;
    target: unknown | null;
    observerKey: unknown | null;
    lastMsgIndex: number;
    handlers: Map<string | number, MethodVo>;
}

export interface MsgInfo {
    sortType: number;
    neg: (ProtoInfo | undefined)[] | null;
    zero: (ProtoInfo | undefined)[] | null;
    pos: (ProtoInfo | undefined)[] | null;
}

export interface MsgCache {
    // time: number;
    msgId: string | number;
    data: unknown;
    index: number;
}


