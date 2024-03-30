import {instantiate, Node} from "cc";
import {EntityType} from "../../vo/EntityVo";
import {BaseEntity} from "./BaseEntity";

export class EntityPool {
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
        return entityNode;
    }   

    public static recycleEntity(type:EntityType,node:Node){
        let poolList = EntityPool[type];
        if(!poolList){
            poolList = [];
            EntityPool[type] = poolList;
        }
        poolList.push(node);
    }
}