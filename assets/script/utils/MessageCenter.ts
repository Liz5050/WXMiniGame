import { error } from "cc";
import { MSG_IDS_NULL, MSG_IDS_NONNULL, MSG_DATA, MSG_IDS } from "./MessageInterface";

/**用于标识一个类的原型对象*/
type MethodProtoInfo = {
    /**方法ID*/
    id: number;
    /**存储方法信息*/
    handlers: Map<string | number, Methodvo>;
};
/**消息监听控制器接口*/
export interface Methodvo {
    /**回调方法*/
    method: Function;
    /**优先级*/
    priority: number;
    /**监听次数*/
    times: number;
}

interface MethodProtovo extends Methodvo {
    /**监听消息的对象实例*/
    target: unknown;
}
/**用于标识一个类的原型对象*/
const target2IdMap: Map<object, number> = new Map();
/**存储类原型监听的消息ID，次数，以及优先级信息*/
const methodProtoInfoMap: Record<number, MethodProtoInfo> = Object.create(null);
/**存储消息ID，以及对应的消息处理方法信息*/
const msgHandlerInfoMap: Record<string | number, Array<MethodProtovo>> = Object.create(null);
/**用于标识一个类的原型对象，每个原型全局唯一*/
let gid = 0;
/**
 * 给一个类添加监听事件
 * @param {unknown} target 类的实例
 * @example: addobserver(this);
 */
export function addObserver(target: unknown): void {
    addObserverRecursive(target, target);
}

/**
 * 递归类的原型链，为类添加监听事件
 * @param {unknown} target 类的实例
 * @example: removeobserver(this);
 * @param {unknown} oriTarget 原始的类的实例，用于判断是否是同一个类的实例
 */
function addObserverRecursive(target: unknown, oriTarget: unknown): void {
    if (!target) return;
    const proto = Object.getPrototypeOf(target);
    const id = target2IdMap.get(proto);
    //递归获取proto，看看是否有监听事件，子类的事件会比父类先触发
    addObserverRecursive(proto, oriTarget);
    if (id <= 0) {
        // console.error(^target2IdMap.get(proto) is null, proto: ${proto});
        return;
    }
    const methodProtoInfo = methodProtoInfoMap[id];
    if (!methodProtoInfo) {
        // console.error(^methodProtoInfoMap[id] is null, id: ${id});
        return;
    }

    methodProtoInfo.handlers.forEach((methodvo: Methodvo, msgId: string | number) => {
        let msgHandlerInfos = msgHandlerInfoMap[msgId];
        if (!msgHandlerInfos) {
            msgHandlerInfos = [];
            msgHandlerInfoMap[msgId] = msgHandlerInfos;
        }
        const index = msgHandlerInfos.findIndex((msgHandlerInfo: MethodProtovo) => {
            return msgHandlerInfo.target === oriTarget;
        });
        if (index === -1) {
            msgHandlerInfos.push({ method: methodvo.method, priority: methodvo.priority, times: methodvo.times, target: oriTarget });
            msgHandlerInfos.sort((a: MethodProtovo, b: MethodProtovo) => {
                return a.priority - b.priority;
            });
            // console.error(addobserverRecursive ${msgId}, oriTarget, id);
        } else {
            console.error(`target msgId ${msgId} already exist`, oriTarget);
        }
    });
}

/**
 * 给一个类移除监听事件
 * @param {unknown} target 类的实例
 * @example: removeobserver(this);
 */
export function removeObserver(target: unknown): void {
    removeObserverRecursive(target, target);
}

/**
 * 递归类的原型链，为类移除监听事件
 * @param {unknown} target 类的原型
 * @param {unknown} oriTarget 类的初始实例
 * @example: removeobserverRecursive(this, this);
 */
function removeObserverRecursive(target: unknown, oriTarget: unknown): void {
    if (!target) return;
    const proto = Object.getPrototypeOf(target);
    removeObserverRecursive(proto, oriTarget);
    const id = target2IdMap.get(proto);
    if (id <= 0) {
        console.error(`target2IdMap.get(proto) is null, proto: ${proto}`);
        return;
    }
    const methodProtoInfo = methodProtoInfoMap[id];
    if (!methodProtoInfo) {
        // console.error(^methodProtoInfoMap[id] is null, id: ${id});
        return;
    }
    const msgIds = [];
    methodProtoInfo.handlers.forEach((methodvo: Methodvo, msgId: string | number) => {
        msgIds.push(msgId);
    });
    for (const msgId of msgIds) {
        const msgHandlerInfos = msgHandlerInfoMap[msgId];
        if (!msgHandlerInfos) {
            console.error(`msgHandlerInfoMap[msgId] is null, msgId: ${msgId}`);
            continue;
        }
        const index = msgHandlerInfos.findIndex((msgHandlerInfo: MethodProtovo) => {
            return msgHandlerInfo.target === oriTarget;
        });
        if (index !== -1) {
            msgHandlerInfos.splice(index, 1);
            // console.error(^removeobserverRecursive ${msgId}, oriTarget, id);
        }
    }
}

/**
 * 为类原型的方法添加消息监听信息，添加监听信息后，即可通过addobserver方法使其具备监听消息的能力
 * @param msgId 消息ID
 * @param times 消息触发次数（default：0)
 * 0：一直触发，直到被offMsg，>0：触发指定次数后自动offMsg
 * @param priority（default：0）优先级值越小越先接收到消息（可负数）
 */
export function msg<K extends MSG_IDS_NULL, F extends () => void>(msgId: K, times?: number, priority?: number): (target: object, propertykey: string, descriptor: TypedPropertyDescriptor<F>) => void;
export function msg<K extends MSG_IDS_NONNULL, F extends (data: MSG_DATA<K>) => void>(msgId: K, times?: number, priority?: number): (target: object, propertykey: string, descriptor: TypedPropertyDescriptor<F>) => void;
export function msg<K extends MSG_IDS, F extends (msgId: MSG_IDS, data: unknown) => void>(msgIds: K[]): (target: object, propertykey: string, descriptor: TypedPropertyDescriptor<F>) => void;
export function msg<F extends () => void>(msgId: string, times?: number, priority?: number): (target: object, propertykey: string, descriptor: PropertyDescriptor) => void;
export function msg(msgIdorArray: string | number | string[] | number[], times: number = 0, priority: number = 0): MethodDecorator {
    return (target: object, propertykey: string | symbol, descriptor: PropertyDescriptor) => {
        recordMethodProtoInfo(target, descriptor.value, msgIdorArray, priority, times);
    }
}
/**
 * *给一个类添加监听事件，只触发一次
 * @param msgId 消息ID
 * @param priority （default：0）优先级 值越小越先接收到消息（可负数）
 */
export function onceMsg<K extends MSG_IDS_NULL, F extends () => void>(msgId: K, priority?: number): (target: object, propertykey: string, descriptor: TypedPropertyDescriptor<F>) => void;
export function onceMsg<K extends MSG_IDS_NONNULL, F extends (data: MSG_DATA<K>) => void>(msgId: K, priority?: number): (target: object, propertykey: string, descriptor: TypedPropertyDescriptor<F>) => void;
export function onceMsg<K extends MSG_IDS, F extends (msgId: MSG_IDS, data: unknown) => void>(msgIds: K[]): (target: object, propertykey: string, descriptor: TypedPropertyDescriptor<F>) => void;
export function onceMsg<F extends () => void>(msgId: string, priority?: number): (target: object, propertykey: string | symbol, descriptor: PropertyDescriptor) => void;
export function onceMsg(msgIdorArray: string | number | string[] | number[], priority = 0) {
    return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        recordMethodProtoInfo(target, descriptor.value, msgIdorArray, priority, 1)
    }
}



/**
 * @param target 消息接收类实例    
 * @param method 消息处理方法
 * @param msgIdorArray 消息ID|消息ID数组
 * @param priority（default：θ）优先级值越小越先接收到消息（可负数）
 * @param times 消息触发次数（default：0)
 * 0:一直触发，直到被offMsg，>0：触发指定次数后自动offMsg
 */
function recordMethodProtoInfo(target: object, method: Function, msgIdorArray: string | number | string[] | number[], priority: number = 0, times: number = 0) {
    let id = target2IdMap.get(target);
    if (id == undefined) {
        id = ++gid;
        target2IdMap.set(target, id);
    }
    let methodProtoInfo = methodProtoInfoMap[id];
    if (!methodProtoInfo) {
        methodProtoInfo = { id: id, /** target: typeof target == "function" ? target : null ,*/ handlers: new Map() };
        methodProtoInfoMap[id] = methodProtoInfo;
    }
    if (Array.isArray(msgIdorArray)) {
        for (const msgId of msgIdorArray) {
            if (msgId) {
                if (methodProtoInfo.handlers.has(msgId)) {
                    error(`repeat msgId(${msgId})`);
                }
                methodProtoInfo.handlers.set(msgId, { method: method, priority: priority, times: times });
            }
        }
    } else {
        if (msgIdorArray) {
            if (methodProtoInfo.handlers.has(msgIdorArray)) {
                error(`repeat msgId(${msgIdorArray})`);
            }
            methodProtoInfo.handlers.set(msgIdorArray, { method: method, priority: priority, times: times });
        }
    }
}
/**
 * @paramtarget 消息接收类实例
 * @param msgId 消息ID
 */
export function offMsg<K extends MSG_IDS_NULL>(target: object, msgId: K): void;
export function offMsg<K extends MSG_IDS_NONNULL>(target: object, msgId: K): void;
export function offMsg<K extends MSG_IDS>(target: object, msgIds: K): void;
export function offMsg(target: object, msgId: string | number): void {
    const methodHandlerInfo = msgHandlerInfoMap[msgId];
    if (!methodHandlerInfo || !methodHandlerInfo.length) {
        console.error(`offMsg: methodHandlerInfo is null, msgId: ${msgId}`);
        return;
    }
    for (let i = methodHandlerInfo.length - 1; i >= 0; i--) {
        if (methodHandlerInfo[i].target === target) {
            methodHandlerInfo.splice(i, 1);
        }
    }
}

/**
 * 分发消息
 * @param msgId 消息ID
 * @param data 消息数据
 */
export function dispatchMsg<K extends MSG_IDS_NULL>(msgId: K): void;
export function dispatchMsg<K extends MSG_IDS_NONNULL>(msgId: K, data?: MSG_DATA<K>): void;
export function dispatchMsg(msgId: string | number, data?: unknown): void {
    const methodHandlerInfo = msgHandlerInfoMap[msgId];
    if (!methodHandlerInfo || !methodHandlerInfo.length) return;
    //使用倒序遍历避免修改数组影响遍历顺序
    for (let i = methodHandlerInfo.length - 1; i >= 0; i--) {
        const methodvo = methodHandlerInfo[i];
        const { method, times } = methodvo;
        method.call(methodvo.target, data);
        if (times > 0) {
            methodvo.times--;
            if (methodvo.times <= 0) {
                methodHandlerInfo.splice(i, 1);
            }
        }
    }
}

/**提前加载的待注册的控制器*/
let _preloadWaitRegistCls: Set<new () => any> | null = null;
export function preloadMsgCls(cls: new () => any): void {
    const waitRegistCtrls = _preloadWaitRegistCls || (_preloadWaitRegistCls = new Set());
    waitRegistCtrls.add(cls);
}
/**待注册的控制器*/
let _waitRegistcls: Set<new () => any> | null = null;
export function msgcls(cls: new () => any): void {
    const waitRegistCtrls = _waitRegistcls || (_waitRegistcls = new Set());
    waitRegistCtrls.add(cls);
}
export function registerPreloadWaitCls(): void {
    registerCls(_preloadWaitRegistCls);
    _preloadWaitRegistCls = null;
}
export function registerWaitCls(): void {
    registerCls(_waitRegistcls);
    _waitRegistcls = null;
}
function registerCls(cls: Set<new () => any>) {
    if (cls) {
        console.log("开始注册类", cls);
        cls.forEach((CLS) => {
            if (CLS["_inst"]) {
                //如果已经有实例，也调用一次init方法。
                const msgCls = CLS["_inst"];
                msgCls.init && typeof msgCls.init == "function" && msgCls.init();
                addObserver(CLS["_inst"]);
            } else {
                const msgCls = new CLS();
                CLS["_inst"] = msgCls;
                msgCls.init && typeof msgCls.init == "function" && msgCls.init();
                addObserver(msgCls);
                // //用于调试
                // if (CC_DEV) {
                //     window["ctrls"] = window["ctrls"] || { };
                //     window["ctrls"][CLS.name] = msgCls;
                // }
            }
        });
    }
}