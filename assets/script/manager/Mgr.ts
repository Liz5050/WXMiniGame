import WXSDK from "../SDK/WXSDK";
import GameGridController from "../game/gameGrid/GameGridController";
import GameNumberController from "../game/gameNumber/GameNumberController";
import GameShulteController from "../game/gameShulte/GameShulteController";
import { SceneManager } from "./SceneManager";
import SoundManager from "./SoundManager";

export default class Mgr {
    public static soundMgr:SoundManager;
    public static sceneMgr:SceneManager;
    private static isInit:boolean = false;

    public static Init() {
        if (Mgr.isInit) return;

        Mgr.InitCtrl();
        Mgr.soundMgr = new SoundManager();
        Mgr.sceneMgr = new SceneManager();

        WXSDK.Init();
        Mgr.isInit = true;
    }

    private static InitCtrl(){
        new GameShulteController();
        new GameGridController();
        new GameNumberController();
    }
}


