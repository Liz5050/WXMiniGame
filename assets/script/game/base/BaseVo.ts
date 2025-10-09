import { EventTarget } from "cc";


export default class BaseVo {

    private static readonly PROPERTY_EVENT = "BaseVo.PROPERTY_EVENT";

    protected _eventTarget: EventTarget = new EventTarget();

    /**
     * 创建vo，做基础类型属性赋值
     * @param json json对象或字符串
     * @returns 
     */
    static create<T extends BaseVo>(this: typeof BaseVo, json?: any): T {
        return this.fromJSON(json);
    }

    /**
     * 从json解析对象
     * @param json json对象或字符串
     * @returns 
     */
    static fromJSON<T extends BaseVo>(this: typeof BaseVo, json: any): T {
        let jsonObj = null;
        if (typeof json === "string") {
            jsonObj = JSON.parse(json);
        } else {
            jsonObj = json;
        }
        let obj = new this();
        for (const key of Object.keys(jsonObj)) {
            let val = obj.reviver(key, jsonObj[key]);
            if (val != undefined) {
                obj[key] = val;
            }
        }
        obj.init(jsonObj);
        return obj as T;
    }

    /**
     * 在创建和更新对象时，对象中的每个键/值对都会调用该函数
     * @param key 
     * @param value 
     * @returns 返回解析之后的value
     */
    reviver(key: string, value: any) {
        return value;
    }

    static replacer(key: string, value: any) {
        if (key == "_eventTarget") {
            return undefined;
        } else {
            return value;
        }
    }
    public init(data?: any) {
        this.onInit(data);
    }
    protected onInit(data?: any) {
    }

    /**
     * 数据更新处理，做基础类型属性更新
     * @param data 
     */
    update(data: any) {
        for (const key of Object.keys(data)) {
            let currentVal = this.reviver(key, data[key]);
            let previousVal = this[key];
            if (currentVal !== undefined && currentVal !== previousVal) {
                this[key] = currentVal;
                // cc.log(key, previousVal, currentVal);
                this.dispatchPropertyEvent(key, previousVal);
            }
        }

        this.updateFinish();
    }

    updateFinish() { }

    /**
     * 派发属性变化事件
     * @param propertyName 
     * @param previousVal 
     */
    dispatchPropertyEvent(propertyName: string, previousVal: any = null) {
        this._eventTarget.emit(BaseVo.PROPERTY_EVENT, { key: propertyName, val: previousVal });
    }

    /**
     * 添加属性监听
     * @param callback 
     */
    onProp(callback: (params: any)=>void, target?: any) {
        this.on(BaseVo.PROPERTY_EVENT, callback, target);
    }

    /**
     * 移除属性监听
     * @param obj 
     */
    offProp(callback: (params: any)=>void, target?: any) {
        this.off(BaseVo.PROPERTY_EVENT, callback, target);
    }

    on(type: string, callback: (params: any)=>void, target?: any) {
        this._eventTarget.on(type, callback, target);
    }

    off(type: string, callback: (params: any)=>void, target?: any) {
        this._eventTarget.off(type, callback, target);
    }

    fire(type: string, params?: any) {
        this._eventTarget.emit(type, params);
    }

    removeAllListeners(target: any) {
        this._eventTarget.targetOff(target);
    }


    public setProperty(key: string, val: any) {
        if (this[key] != val) {
            let lastVal = this[key];
            this[key] = val;
            this.dispatchPropertyEvent(key, lastVal);
        }
    }

}