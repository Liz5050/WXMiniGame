import { _decorator, Button, Component, director, Label, Node } from 'cc';
import Mgr from './manager/Mgr';
const { ccclass, property } = _decorator;

@ccclass('TestScene')
export class TestScene extends Component {
    private _isPlaying:boolean;
    private _isPause:boolean;
    start() {
        let self = this;
        let btnPlay = this.node.getChildByName("btnPlay");
        btnPlay.on(Button.EventType.CLICK,function(){
            if(!self._isPlaying){
                self._isPlaying = true;
                Mgr.soundMgr.playBGM("bgm1");
            }
            else if(self._isPause){
                Mgr.soundMgr.resume();
            }
        });
        
        let btnPause = this.node.getChildByName("btnPause");
        btnPause.on(Button.EventType.CLICK,function(){
            if(self._isPlaying){
                Mgr.soundMgr.pause();
                this._isPause = true;
            }
        });

        let btnBack = this.node.getChildByName("btnBack");
        btnBack.on(Button.EventType.CLICK,function(){
            Mgr.sceneMgr.LoadScene("scene");
        });
    }

    onDestroy() {
        this._isPlaying = false;
        this._isPause = false;
        Mgr.soundMgr.stopBGM();
    }

    update(deltaTime: number) {
        
    }
}


