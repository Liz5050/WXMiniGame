import {_decorator, Component, instantiate, Node} from "cc";
import {EntityType} from "../../vo/EntityVo";
import {BaseEntity} from "./BaseEntity";
const {ccclass} = _decorator;

@ccclass
export class EntityPool extends Component{
    protected onLoad(): void {
        EntityPool.EntityPoolNode = this.node;
    }
    private static EntityPoolNode:Node;
    private static EntityPool:{[type:number]:BaseEntity[]} = {};
    public static getEntity(type:EntityType,prefab?){
        let poolList = EntityPool[type];
        if(!poolList){
            poolList = [];
            EntityPool[type] = poolList;
        }
        let entityNode = poolList.pop();
        if(!entityNode && prefab){
            entityNode = instantiate(prefab);
        }
        entityNode.active = true;
        return entityNode;
    }   

    public static recycleEntity(type:EntityType,node:Node){
        node.removeFromParent();
        node.parent = EntityPool.EntityPoolNode;
        node.active = false;
        node.setPosition(0,0,0);
        let poolList = EntityPool[type];
        if(!poolList){
            poolList = [];
            EntityPool[type] = poolList;
        }
        poolList.push(node);
    }
}