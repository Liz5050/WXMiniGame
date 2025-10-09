import { BoxCollider, Component, Node, PhysicsSystem, Prefab, Vec3, _decorator, game, geometry, instantiate } from "cc";
import { CacheManager } from "../../../manager/CacheManager";
import Mgr from "../../../manager/Mgr";
import { Root3D } from "../../../Root3D";
import { EventManager } from "../../../manager/EventManager";
import { EventEnum } from "../../../enum/EventEnum";
import { GameGridMapItem } from "../scene/entity/GameGridMapItem";
import { Layer3DManager } from "../../../manager/Layer3DManager";
import { SDK } from "../../../SDK/SDK";
import { EntityType } from "../scene/utils/EntityUtil";
import BaseLayer from "../scene/layer/BaseLayer";
import GameBackgroundLayer from "../scene/layer/GameBackgroundLayer";
import GameUILayer from "../scene/layer/GameUILayer";
import GameEntityLayer from "../scene/layer/GameEntityLayer";
import { LayerType } from "../scene/layer/LayerType";
const { ccclass, property } = _decorator;

export class GameGridMapView extends Node {
    private static GridPool:Node[] = [];
    @property(Node) mapGrid:Node = null;
    @property(Node) mapGridContainer:Node = null;
    @property(Node) tempGroup:Node = null;
    @property(BoxCollider) posTrigger:BoxCollider = null;
    @property(Prefab) gridPrefab:Prefab;
    
    private _layerMap:Map<LayerType,BaseLayer> = new Map();
    public constructor() {
        super();
        this.initLayer();
    }

    private initLayer(){
        let bg = new GameBackgroundLayer();
        bg.show();
        this.addChild(bg);
        this._layerMap.set(LayerType.Background,bg);

        let entity = new GameEntityLayer();
        entity.show();
        this.addChild(entity);
        this._layerMap.set(LayerType.Entity,entity);

        let ui = new GameUILayer();
        ui.show();
        this.addChild(ui);
        this._layerMap.set(LayerType.UI,ui);
    }

    public getLayer(type:LayerType){
        return this._layerMap.get(type);
    }

    public show(){
        Layer3DManager.gameLayer.addChild(this);
    }

    public hide(){
        this._layerMap.forEach((layer)=>{
            layer.destroy();
        });
        this._layerMap.clear();
        this.removeFromParent();
    }

    private addEvent(){
        EventManager.addListener(EventEnum.OnGameSceneGridMove,this.onGridMove,this);
        EventManager.addListener(EventEnum.OnGridMoveCancel,this.onMoveCancel,this);
        EventManager.addListener(EventEnum.OnGameGridRoundUpdate,this.onRoundUpdate,this);
    }
    
    private onRoundUpdate(){
        if(CacheManager.gameGrid.isBattle()){
            // for(let row = 0; row < 10; row++){
            //     for(let col = 0; col < 10; col++){
            //         let item = this._mapItemList[row][col];
            //         if(!item.isEmpty){
            //             let vo = CacheManager.gameGrid.addEntity(EntityType.Grid);
            //             item.setData(vo);
            //         }
            //     }
            // }
        }
    }
}