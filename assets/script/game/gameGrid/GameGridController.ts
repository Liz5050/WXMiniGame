import { GameType } from "../../enum/GameType";
import { EventEnum } from "../../enum/EventEnum";
import { EventManager } from "../../manager/EventManager";
import { GameGridStartView } from "./view/GameGridStartView";

export default class GameGridController {
    private _gameStartView:GameGridStartView;
    public constructor(){
        this.init();
    }

    private init(){
        EventManager.addListener(EventEnum.OnGameStart,this.onGameStart,this);
    }

    private onGameStart(type:GameType):void {
        if(type != GameType.Grid) return;
        if(!this._gameStartView){
            this._gameStartView = new GameGridStartView();
        }
        this._gameStartView.show();
    }
}