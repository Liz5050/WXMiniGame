import { _decorator, Component, Node, utils } from 'cc';
import { EventManager } from './manager/EventManager';
import { EventEnum } from './enum/EventEnum';
const { ccclass, property } = _decorator;

@ccclass('GameStart')
export class GameStart extends Component {
    private _main:Node;
    start() {
        this._main = utils.find("Canvas/Main");
        EventManager.addListener(EventEnum.OnGameResLoadComplete,this.onGameResLoadComplete,this)
    }

    update(deltaTime: number) {
        
    }

    private onGameResLoadComplete(){
        this._main.active = true;
    }
}


