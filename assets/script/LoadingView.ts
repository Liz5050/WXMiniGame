import { _decorator, assetManager, Component, Label, Node } from 'cc';
import { EventManager } from './manager/EventManager';
import { EventEnum } from './enum/EventEnum';
const { ccclass, property } = _decorator;

@ccclass('LoadingView')
export class LoadingView extends Component {
    private _txtProgress:Label;
    start() {
        let self = this;
        this._txtProgress = this.node.getChildByName("txtProgress").getComponent(Label);
        assetManager.loadBundle("common_atlas",{
            onFileProgress:function(e){
                self._txtProgress.string = "加载中..." + Math.floor(e.progress) + "%";
            }
        },
        (err,bundle) => {
            if(err){
                console.log("bundle加载失败",err);
            }
            else{
                console.log("bundle加载成功",bundle);
                EventManager.dispatch(EventEnum.OnGameResLoadComplete);
                this.node.active = false;
            }
        });
    }

    update(deltaTime: number) {
        
    }
}


