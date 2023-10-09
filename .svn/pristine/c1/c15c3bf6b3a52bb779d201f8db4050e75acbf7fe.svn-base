import { _decorator } from 'cc';
import { BaseView } from '../../base/BaseView';
import { GameType } from '../../../enum/GameType';
const { ccclass, property } = _decorator;

@ccclass('GameNumberStartView')
export class GameNumberStartView extends BaseView {
    private _time:number = 0;
    start() {
        this._gameType = GameType.Nullify;
        super.start();
    }

    update(deltaTime: number) {
        this._time += deltaTime;
        if(this._time >= 0.5){
            this._time = 0;
            this.exit();
        }
    }

    protected initUI(){
        super.initUI();
    }
}


