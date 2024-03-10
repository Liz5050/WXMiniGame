import { GameType } from "../../enum/GameType";
import { EventEnum } from "../../enum/EventEnum";
import { EventManager } from "../../manager/EventManager";
import { GameGridStartView } from "./view/GameGridStartView";
import Mgr from "../../manager/Mgr";
import { GameGrid3DView } from "./view/GameGrid3DView";
import { Layer3DManager } from "../../manager/Layer3DManager";
import { Node, instantiate } from "cc";
import { GameLoadingView } from "../../common/loading/GameLoadingView";

export default class GameGridController {
    private _gameStartView:GameGridStartView;

    private _gameGrid3D:GameGrid3DView;
    public constructor(){
        this.init();
    }

    private init(){
        EventManager.addListener(EventEnum.OnGameStart,this.onGameStart,this);
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
}