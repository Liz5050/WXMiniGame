import { _decorator, Component, director, utils } from 'cc';
import Mgr from './manager/Mgr';
import WXSDK from './SDK/WXSDK';
const { ccclass, property } = _decorator;

@ccclass('Main')
export class Main extends Component {
    start() {
        Mgr.Init();
        WXSDK.showShareMenu();
        WXSDK.login();
    }

    update(deltaTime: number) {
    }
}


