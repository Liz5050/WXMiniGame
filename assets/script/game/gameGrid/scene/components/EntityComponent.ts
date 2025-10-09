import { Component } from "cc";
import { EntityVo } from "../vo/EntityVo";
import { ComponentFactory, ComponentType } from "./ComponentType";
import { BaseEntity } from "../entity/BaseEntity";
import { addObserver, removeObserver } from "db://assets/script/utils/MessageCenter";

export class EntityComponent {
    private _deltaTime:number = 0;
    protected _dealInterval:number = 0;//组件更新频率(单位:秒)
    protected _entity:BaseEntity;
    protected _vo:EntityVo;
    protected _isRunning:boolean = false;
    protected _type:ComponentType;
    public constructor(){
        addObserver(this);
        this.onInit();
    }

    public set entity(e:BaseEntity){
        this._entity = e;
        this._vo = e.entityVo;
        this._vo.onProp(this.onEntityVoPropUpdate,this);
    }

    public get entity():BaseEntity{
        return this._entity;
    }

    public start(){
        this.onStart();
        this._isRunning = true;
    }
    
    public update(dt: number): void {
        if(!this._isRunning) return;
        if(!this.canUpdate()) return;
        this._deltaTime += dt;
        if(this._deltaTime >= this._dealInterval){
            this.onUpdate(dt);
            this._deltaTime = 0;
        }
    }

    protected onEntityVoPropUpdate(evt:{key:OwnKeys<EntityVo>; val: any}){}

    public get vo():EntityVo{
        return this._vo;
    }

    public set type(t:ComponentType){
        this._type = t;
    }
    public get type():ComponentType{
        return this._type;
    }

    public stop(){
        if(!this._isRunning) return;
        removeObserver(this);
        this._vo.offProp(this.onEntityVoPropUpdate,this);
        this._dealInterval = 0;
        this._deltaTime = 0;
        this._isRunning = false;
        this.onStop();
        this._entity = null;
        this._vo = null;
        ComponentFactory.recycleComponent(this);
    }

    protected onInit(){}
    protected onStart(){}
    protected onUpdate(dt: number){}
    protected onStop(){}
    protected canUpdate():boolean {
        if(this._vo) return false;
        return true;
    }
}