import { _decorator, Component, error, JsonAsset, Label} from 'cc';
import { EventManager } from './manager/EventManager';
import { EventEnum } from './enum/EventEnum';
import Mgr from './manager/Mgr';
import { ConfigManager } from './manager/ConfigManager';
const { ccclass, property } = _decorator;

@ccclass('LoadingView')
export class LoadingView extends Component {
    private _txtProgress:Label;
    private _commonResReady:boolean = false;
    private _configReady:boolean;
    private _progressNum:number = 0;
    start() {
        let self = this;
        this._txtProgress = this.node.getChildByName("txtProgress").getComponent(Label);
        console.log("LoadingView start");
        Mgr.loader.LoadBundle("ui",{
            onProgress:function(e){
                self._progressNum += (e.progress * 0.5);
                self._txtProgress.string = "资源加载中..." + Math.floor(self._progressNum) + "%";
                console.log("LoadingView LoadBundle" + e.progress + " num:" + self._progressNum);
            },
            onComplete:function(err,bundle){
                if(err){
                    console.log("ui bundle加载失败",err);
                    self._txtProgress.string = "ui资源加载失败，请刷新重试...";
                }
                else{
                    console.log("ui bundle加载成功",bundle);
                    self._commonResReady = true;
                    self.checkAllReady();
                }
            }
        });
        Mgr.loader.LoadRes('config/grid_skin_shop',{
            onComplete:(err: any, res: JsonAsset)=>{
                if (err) {
                    error(err.message || err);
                    return;
                }
                // 获取到 Json 数据
                ConfigManager.Data["grid_skin_shop"] = res.json!;
                this._configReady = true;
                this.checkAllReady();
            },
            onProgress:(finished:number,totalNum:number)=>{
                this._progressNum += finished * 0.5;
                this._txtProgress.string = "资源加载中..." + Math.floor(self._progressNum) + "%";
                console.log("LoadingView LoadRes:" + finished + " total:" + totalNum + " num:" + self._progressNum);
            }
        })
    }

    private checkAllReady(){
        if(this._commonResReady && this._configReady){
            EventManager.dispatch(EventEnum.OnGameResLoadComplete);
            this.node.active = false;
        }
    }

    update(deltaTime: number) {
        
    }
}


