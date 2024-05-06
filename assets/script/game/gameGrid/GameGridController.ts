import { GameType } from "../../enum/GameType";
import { EventEnum } from "../../enum/EventEnum";
import { EventManager } from "../../manager/EventManager";
import { GameGridStartView } from "./view/GameGridStartView";
import Mgr from "../../manager/Mgr";
import { GameGrid3DView } from "./view/GameGrid3DView";
import { CacheManager } from "../../manager/CacheManager";
import { GameBuildHeroView } from "./view/GameBuildHeroView";
import { BaseEntity } from "./scene/entity/BaseEntity";

export default class GameGridController {
    private _gameStartView:GameGridStartView;

    private _gameGrid3D:GameGrid3DView;
    private _buildHeroView:GameBuildHeroView;
    public constructor(){
        this.init();
    }

    private init(){
        EventManager.addListener(EventEnum.OnGameStart,this.onGameStart,this);
        EventManager.addListener(EventEnum.OnGameGridSceneReady,this.onSceneReady,this);
        EventManager.addListener(EventEnum.OpenGameBuildView,this.openGameBuildView,this);
        EventManager.addListener(EventEnum.CloseGameBuildView,this.closeGameBuildView,this);
    }

    private onSceneReady(){
        CacheManager.gameGrid.sceneReady = true;
    }

    private onGameStart(type:GameType):void {
        if(type == GameType.Grid) {
            if(!this._gameStartView){
                this._gameStartView = new GameGridStartView();
            }
            this._gameStartView.show();
        }
        else if(type == GameType.Grid3D){
            Mgr.loader.LoadBundleRes("scene","GameGrid3D/GameGridMap",(prefab)=>{
                if(!this._gameGrid3D){
                    this._gameGrid3D = new GameGrid3DView();
                }
                this._gameGrid3D.show();
            });
        }
    }

    private openGameBuildView(entity:BaseEntity){
        if(!this._buildHeroView){
            this._buildHeroView = new GameBuildHeroView();
        }
        this._buildHeroView.show(entity);
    }

    private closeGameBuildView(){
        this._buildHeroView && this._buildHeroView.hide();
    }
}