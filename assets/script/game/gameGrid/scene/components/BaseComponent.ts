import { Component } from "cc";
import { EntityVo } from "../vo/EntityVo";
import { ComponentType } from "./ComponentType";
import { BaseEntity } from "../entity/BaseEntity";

export class BaseComponent extends Component{
    protected _vo:EntityVo;
    protected _entity:BaseEntity;
    public comType:ComponentType;
    protected _isInit:boolean;
    public init():void{
        if(this._isInit) return;
        this._entity = this.getComponent(BaseEntity);
        this.onInit();
        this._isInit = true;
    }

    protected update(dt: number): void {
        this.onUpdate(dt);
    }

    public setData(vo:EntityVo){
        this._vo = vo;
        this.enabled = true;
        this.updateVo();
    }

    public get vo():EntityVo{
        return this._vo;
    }

    public reset(isDestroy:boolean = false){
        this.enabled = false;
        this._vo = null;
        this.onReset();
    }

    protected updateVo(){}
    protected onInit(){}
    protected onUpdate(dt: number){}
    protected onReset(){}
}