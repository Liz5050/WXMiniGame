import { Component, Node, _decorator } from "cc";
import { EntityVo } from "../vo/EntityVo";
import { HUDComponent } from "../components/HUDComponent";
import { EntityPool } from "./EntityPool";
import {EntityState, EntityType, EntityUtil} from "../utils/EntityUtil";
import { BaseComponent } from "../components/BaseComponent";
import { ComponentFactory, ComponentType } from "../components/ComponentType";
import { EntityAction } from "../vo/EntityAction";
const { ccclass, property } = _decorator;

@ccclass
export class BaseEntity extends Component {
    @property(Node) HUD:Node = null;
    protected _vo: EntityVo;
    protected _deltaTime: number = 0;
    protected _updateInterval: number = 0.5; 
    protected _type:EntityType;
    protected _isSelected:boolean = false;
    protected _components:{[type:number]:BaseComponent} = {};
    protected onLoad(): void {
        this.init();
    }

    public addCusComponent(type:ComponentType){
        let com = this._components[type];
        if(com) {
            if(com.vo){
                console.warn("重复添加:" + ComponentType[type]);
            }
            else{
                com.setData(this._vo);
            }
            return;
        }
        let comCls:any = ComponentFactory.getComponentCls(type);
        if(!comCls) {
            console.error("未定义的component:" + ComponentType[type]);
            return;
        }
        com = this.addComponent(comCls) as BaseComponent;
        com.init();
        com.setData(this._vo);
        this._components[type] = com;
    }

    public removeCusComponent(type:ComponentType){
        let com = this._components[type];
        if(com){
            com.reset(true);
            delete this._components[type];
        }
    }

    public setSelected(val:boolean){
        if(this._isSelected == val) return;
        this._isSelected = val;
        this.onSelectChanged();
    }

    public get isSelected():boolean{
        return this._isSelected;
    }

    public updateLevel(){
        let com = this._components[ComponentType.HUD];
        // @ts-ignore
        com && com.updateLevel();
    }

    public isEnemy():boolean{
        return this._type == EntityType.Enemy;
    }

    public get type():EntityType{
        return this._type;
    }

    public get vo():EntityVo{
        return this._vo;
    }

    public hurt() {
        this.playHurt();
    }

    public updateHp(){
        let com = this._components[ComponentType.HUD];
        // @ts-ignore
        com && com.updateHp();
    }

    protected update(dt: number): void {
        this._deltaTime += dt;
        if (!this.canUpdate()) return;
        this._deltaTime = 0;
        this.updateSub(dt);
    }

    protected updateSub(dt: number) { }

    protected canUpdate(): boolean {
        return this._deltaTime >= this._updateInterval
    }

    public setData(vo: EntityVo) {
        this._vo = vo;
        this._type = vo.type;
        this._vo.setEntity(this);
        // if(EntityUtil.isBattleEntity(vo.type)){
        //     this.addCusComponent(ComponentType.HUD);
        // }
        this.initComponent();
        this.onEntityVoUpdate();
    }
    // //VO层同步状态
    // public setStateFromVo(state:EntityState){
    //     this.setState(state);
    // }
    protected init() { }
    protected initComponent() { }
    protected onEntityVoUpdate() { }
    // protected setState(state: EntityState): boolean {
    //     if (!this._vo.setState(state)) return false;
    //     return true;
    // }
    private onNone(){
        this.playNone();
    }
    private onIdle() {
        this.playAction(EntityAction.Idle);
        this.playIdle();
    };
    private onWalk() {
        this.playAction(EntityAction.Walk);
        this.playWalk();
    };
    private onAttackPre() {
        this.playAction(EntityAction.AttackPre);
        this.playAttackPre();
    }
    private onAttack() {
        this.playAction(EntityAction.Attack);
        this.playAttack();
    };
    private onStiffness() {
        this.playAction(EntityAction.Stiffness);
        this.playStiffness();
    };
    private onDie() {
        this.playAction(EntityAction.Die);
        this.playDie();
    };
    
    private playAction(action:EntityAction){
        let comp = this._components[ComponentType.Actor];
        //@ts-ignore
        comp && comp.playAction(action);
    }
    public onStateChanged(state: EntityState) { 
        switch (state) {
            case EntityState.none:
                this.onNone();
                break;
            case EntityState.idle:
                this.onIdle();
                break;
            case EntityState.walk:
                this.onWalk();
                break;
            case EntityState.attackEmpty:
            case EntityState.attackPre:
                this.onAttackPre();
                break;
            case EntityState.attack:
                this.onAttack();
                break;
            case EntityState.attackAfter:
                break;
            case EntityState.stiffness:
                this.onStiffness();
                break;
            case EntityState.die:
                this.onDie();
                break;
        }
    }
    protected onSelectChanged() { }
    protected playNone() { }
    protected playIdle() { }
    protected playWalk() { }
    protected moving() { }
    protected playAttackPre() { }
    protected playAttack() { }
    protected playStiffness() { }
    protected playDie() { }
    protected playHurt(isDead:boolean = false) { 
        this.updateHp();
    }
    protected stopMove() { }
    protected death(){
        this.resetEntity();
    }

    protected stopComponent(){
        for(let t in this._components){
            this._components[t].reset();
        }
    }

    public resetEntity(){
        this.stopComponent();
        this._isSelected = false;
        EntityPool.recycleEntity(this._type,this.node);
        this._vo = null;
    }
}