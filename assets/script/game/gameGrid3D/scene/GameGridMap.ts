import { instantiate, Node, Prefab } from "cc";
import { CacheManager } from "../../../manager/CacheManager";
import BaseLayer from "./layer/BaseLayer";
import GameEntityLayer from "./layer/GameEntityLayer";
import { LayerType } from "./layer/LayerType";
import { msg, addObserver, removeObserver, dispatchMsg } from "../../../utils/MessageCenter";
import { GEvent } from "../../../enum/GEvent";
import Mgr from "../../../manager/Mgr";
import GameMapGridLayer from "./layer/GameMapGridLayer";
import { Layer3DManager } from "../../../manager/Layer3DManager";

export class GameGridMap {
    private _mapNode:Node;
    
    private _layerMap:Map<LayerType,BaseLayer> = new Map();
    public constructor() {
        addObserver(this);
        this.onGameStart();
    }

    private onGameStart(){
        Mgr.soundMgr.playBGM("bgm1");
        this.loadScene();
    }

    private loadScene(){
        let prefab = Mgr.loader.getBundleRes("scene","gameGrid3D/GameGridMap") as Prefab;
        if(prefab) {
            this._mapNode = instantiate(prefab);
            Layer3DManager.gameLayer.addChild(this._mapNode);
            this.initLayer();
            dispatchMsg(GEvent.OnGameGrid3DSceneReady);
        }
    }

    private initLayer(){
        const gridRoot = this._mapNode.getChildByPath("GameRoot/MapGridRoot");
        let mapGridLayer = new GameMapGridLayer();
        mapGridLayer.init(gridRoot);
        this._layerMap.set(LayerType.MapGrid,mapGridLayer);

        const entityRoot = this._mapNode.getChildByPath("GameRoot/EntityRoot");
        let entityLayer = new GameEntityLayer();
        entityLayer.init(entityRoot);
        this._layerMap.set(LayerType.Entity,entityLayer);
    }

    public getLayer(type:LayerType){
        return this._layerMap.get(type);
    }

    // public show(){
    //     Layer3DManager.gameLayer.addChild(this);
    // }

    public onExitGame(){
        this._layerMap.forEach((layer)=>{
            layer.destroy();
        });
        this._layerMap.clear();
        removeObserver(this);
    }
    
    @msg(GEvent.OnGameGrid3DRoundUpdate)
    private onRoundUpdate(){
        if(CacheManager.gameGrid3D.isBattle()){
            // for(let row = 0; row < 10; row++){
            //     for(let col = 0; col < 10; col++){
            //         let item = this._mapItemList[row][col];
            //         if(!item.isEmpty){
            //             let vo = CacheManager.gameGrid3D.addEntity(EntityType.Grid);
            //             item.setData(vo);
            //         }
            //     }
            // }
        }
    }
}
