import { _decorator, Button, Component, Node } from 'cc';
import { EventManager } from '../../manager/EventManager';
import { EventEnum } from '../../enum/EventEnum';
import { GameType } from '../../enum/GameType';
const { ccclass, property } = _decorator;

@ccclass('BaseView')
export class BaseView extends Component {
    protected _gameType:GameType;
    start() {
        this.initUI();
    }

    protected initUI(){
        let self = this;
        let btnExit:Node = this.node.getChildByName("btnExit");
        if(btnExit){
            btnExit.on(Button.EventType.CLICK,function(){
                //退出前回到初始化状态
                self.exit();
            });
        }
    }

    protected exit(){
        this.node.active = false;
        EventManager.dispatch(EventEnum.OnGameExit,this._gameType);
    }
}


