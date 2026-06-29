import { Node } from "cc";
import { GameFactory } from "../../GameFactory";
import { EntityType } from "../utils/EntityUtil";
import { EntityComponent } from "../components/EntityComponent";
import { ComponentFactory, ComponentType } from "../components/ComponentType";
import ComponentSystem from "../components/ComponentSystem";
import EntityVo from "../vo/EntityVo";
export class BaseEntity {
    private _parent:Node;
    private _node:Node;
    private _active:boolean = true;
    protected _vo: EntityVo;
    protected _deltaTime: number = 0;
    protected _updateInterval: number = 0.5;
    protected _type:EntityType;
    protected _comps:{[type:string]:EntityComponent} = {};
    public get entityVo():EntityVo{
        return this._vo;
    }

    public init(vo:EntityVo){
        if (this._vo) {
            this._vo.offProp(this.onEntityPropUpdate,this);
        }
        this._vo = vo;
        this._type = vo.type;
        this._vo.setEntity(this);
        this._vo.onProp(this.onEntityPropUpdate,this);
        this.onInit();
        // this._vo.setState(this._vo.state);
    }

    protected onInit() { }
    protected onEntityPropUpdate(evt:{key:OwnKeys<EntityVo>; val: any}){}

    public addCusComponent(type:ComponentType){
        if(this._comps[type]) {
            console.warn("重复添加:" + type);
            return;
        }
        const comp:EntityComponent = ComponentFactory.createComponent(type);
        if (!comp) {
            console.warn("未处理的组件类型:" + type);
            return;
        }
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
        comp.stop();
        ComponentSystem.removeComponent(comp);
        delete this._comps[type];
    }
    
    public getCusComponent(type:ComponentType){
        return this._comps[type];
    }

    public setSelected(val:boolean){
        if(!this._vo || this._vo.isSelected == val) return;
        this._vo.isSelected = val;
        this.onSelectChanged();
    }

    public get isSelected():boolean{
        return !!this._vo && this._vo.isSelected;
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

    public set active(val: boolean) {
        this._active = val;
    }

    public get active(): boolean {
        return this._active;
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
    protected onSelectChanged() { }
    protected death(){
        this.resetEntity();
    }

    protected removeAllComponents(){
        const types = Object.keys(this._comps);
        for(let type of types){
            this.removeCusComponent(type as ComponentType);
        }
    }

    protected stopComponent(){
        this.removeAllComponents();
    }

    public resetEntity(): void {
        this.recyleEntity();
    }

    public recyleEntity(){
        this.entityVo && this.entityVo.offProp(this.onEntityPropUpdate,this);
        this.entityVo && this.entityVo.setEntity(null);
        this.removeAllComponents();
        GameFactory.recycleEntity(this);
        this._vo = null;
    }

    public setParent(parent:Node){
        this._parent = parent;
    }

    public get parentNode():Node {
        return this._parent;
    }

    public set node(node:Node){
        this._node = node;
    }
    public get node():Node {
        return this._node;
    }
}
