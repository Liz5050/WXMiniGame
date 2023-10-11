import { GameType } from "../../enum/GameType";
import { EventEnum } from "../../enum/EventEnum";
import { EventManager } from "../../manager/EventManager";
import { resources , Node, utils} from "cc";
import { GameGridStartView } from "./view/GameGridStartView";
import Mgr from "../../manager/Mgr";

export default class GameGridController {
    private _gameGridNode:Node;
    private _gameStartView:GameGridStartView;
    public constructor(){
        this.init();
    }

    private init(){
        EventManager.addListener(EventEnum.OnGameStart,this.onGameStart,this);
    }

    private onGameStart(type:GameType):void {
        if(type != GameType.Grid) return;
        
        let url:string = "prefab/GameGridMapItem";
        if(resources.get(url)){
            this.start();
        }else{
            let self = this;
            resources.load(url,function(){
                self.start();
            });
        }
    }

    private start(){
        if(!this._gameGridNode){
            this._gameGridNode = utils.find("Canvas/Main/Game/GameGrid");
            this._gameStartView = this._gameGridNode.getComponent(GameGridStartView);
        }
        else{
            this._gameStartView.OnGameStart();
        }
        this._gameGridNode.active = true;
        let scoreItemUrl = "prefab/ScoreAddItem"
        if(!resources.get(scoreItemUrl)){
            resources.load(scoreItemUrl,function(){
                let itemPrefab = resources.get(scoreItemUrl);
            });
        }
        // Mgr.soundMgr.playBGM("bgm1");
    }
}