import { _decorator, Component, Node, resources } from 'cc';
import Mgr from './manager/Mgr';
import WXSDK from './SDK/WXSDK';
import { EventManager } from './manager/EventManager';
import { EventEnum } from './enum/EventEnum';
const { ccclass, property } = _decorator;

@ccclass('Main')
export class Main extends Component {
    private _worldRank:Node;
    onLoad(): void {
        console.log("Main onLoad");
    }
    start() {
        Mgr.Init();
        WXSDK.showShareMenu();
        WXSDK.login();

        this._worldRank = this.node.getChildByPath("PopupWindow/GameWorldRankView");
        EventManager.addListener(EventEnum.OnShowWorldRank,this.OnShowWorldRankView,this);
    }

    private OnShowWorldRankView(){
        let itemUrl = "prefab/GameWorldRankItem";
        let self = this;
        if(!resources.get(itemUrl)){
            resources.load(itemUrl,function(){
                self._worldRank.active = true;
            });
        }
        else {
            self._worldRank.active = true;
        }
    }

    update(deltaTime: number) {
    }
}


