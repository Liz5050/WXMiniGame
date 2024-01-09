import { GameType } from "../../enum/GameType";
import { EventEnum } from "../../enum/EventEnum";
import { EventManager } from "../../manager/EventManager";
import { CacheManager } from "../../manager/CacheManager";
import { GameHitView } from "./view/GameHitView";

export default class GameHitController {
    private _gameHit:GameHitView;
    public constructor(){
        this.init();
    }

    private init(){
        EventManager.addListener(EventEnum.OnGameStart,this.onGameStart,this);
    }

    private onGameStart(type:GameType):void {
        if(type != GameType.GameHit) return;
        if(!this._gameHit){
            this._gameHit = new GameHitView();
        }
        this._gameHit.show();
    }
}