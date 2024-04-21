import { BaseComponent } from "../components/BaseComponent";

export class Entity {
    protected _components:{[type:number]:BaseComponent} = {};
    protected _id:number = 0;
}