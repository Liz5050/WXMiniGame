import { GameType } from "../../enum/GameType";
import { EventEnum } from "../../enum/EventEnum";
import { EventManager } from "../../manager/EventManager";
import { Node, utils } from "cc";

export default class GameNumberController {
    private _gameNumber:Node;
    public constructor(){
        this.init();
    }

    private init(){
        EventManager.addListener(EventEnum.OnGameStart,this.onGameStart,this);
    }

    private onGameStart(type:GameType):void {
        if(type != GameType.Nullify) return;
        if(!this._gameNumber){
            this._gameNumber = utils.find("Canvas/Main/Game/GameNumber");
        }
        this._gameNumber.active = true;
    }
}