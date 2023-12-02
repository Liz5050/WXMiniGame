import { GameType } from "../../enum/GameType";
import { EventEnum } from "../../enum/EventEnum";
import { EventManager } from "../../manager/EventManager";
import { CacheManager } from "../../manager/CacheManager";
import { GameBallView } from "./view/GameBallView";

export default class GameBallController {
    private _gameBall:GameBallView;
    public constructor(){
        this.init();
    }

    private init(){
        EventManager.addListener(EventEnum.OnGameStart,this.onGameStart,this);
    }

    private onGameStart(type:GameType):void {
        if(type != GameType.GameBall) return;
        CacheManager.gameBall.initGameBallInfo();
        if(!this._gameBall){
            this._gameBall = new GameBallView();
        }
        this._gameBall.show();
    }
}