import { Node, _decorator } from "cc";
import { GameFactory } from "../../GameFactory";
import {EntityState, EntityType} from "../utils/EntityUtil";
import { EntityComponent } from "../components/EntityComponent";
import { ComponentFactory, ComponentType } from "../components/ComponentType";
import { EntityAction } from "../vo/EntityAction";
import { ActorComponent } from "../components/ActorComponent";
import ComponentSystem from "../components/ComponentSystem";
import EntityVo from "../vo/EntityVo";
export class BaseEntity extends Node {
    protected _vo: EntityVo;
    protected _deltaTime: number = 0;
    protected _updateInterval: number = 0.5; 
    protected _type:EntityType;
    protected _isSelected:boolean = false;
    protected _comps:{[type:string]:EntityComponent} = {};
    public get entityVo():EntityVo{
        return this._vo;
    }

    public init(vo:EntityVo){
        this._vo = vo;
        this._vo.onProp(this.onEntityPropUpdate,this);
        this.onInit();
    }
    protected onInit() { }
    protected onEntityPropUpdate(evt:{key:OwnKeys<EntityVo>; val: any}){}

    public addCusComponent(type:ComponentType){
        if(this._comps[type]) {
            console.warn("重复添加:" + type);
            return;
        }
        const comp:EntityComponent = ComponentFactory.createComponent(type);
        comp.type = type;
        comp.entity = this;
        ComponentSystem.addComponent(comp);
        this._comps[type] = comp;
        comp.start();
    }

    public removeCusComponent(type:ComponentType){
        const comp = this._comps[type];
        if(!comp){
            return;
        }
        ComponentFactory.recycleComponent(comp);
        comp.stop();
        delete this._comps[type];
    }
    
    public getCusComponent(type:ComponentType){
        return this._comps[type];
    }

    public setSelected(val:boolean){
        if(this._isSelected == val) return;
        this._isSelected = val;
        this.onSelectChanged();
    }

    public get isSelected():boolean{
        return this._isSelected;
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

    protected update(dt: number): void {
        this._deltaTime += dt;
        if (!this.canUpdate()) return;
        this._deltaTime = 0;
        this.onUpdate(dt);
    }

    protected onUpdate(dt: number) { }

    protected canUpdate(): boolean {
        return this._deltaTime >= this._updateInterval
    }
    // //VO层同步状态
    // public setStateFromVo(state:EntityState){
    //     this.setState(state);
    // }
    
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
        let comp = this._comps[ComponentType.Actor];
        comp && (comp as ActorComponent).playAction(action);
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
    protected stopMove() { }
    protected death(){
        // this.resetEntity();
    }

    protected removeAllComponents(){
        for(let type in this._comps){
            this.removeCusComponent(type as ComponentType);
        }
    }

    public recyleEntity(){
        this.entityVo.offProp(this.onEntityPropUpdate,this);
        this.removeAllComponents();
        if(this.parent) this.removeFromParent();
        this._isSelected = false;
        GameFactory.recycleEntity(this);
        this._vo = null;
    }
}