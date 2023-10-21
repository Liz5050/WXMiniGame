import WXSDK from "../SDK/WXSDK";
import GameGridController from "../game/gameGrid/GameGridController";
import GameNumberController from "../game/gameNumber/GameNumberController";
import GameShulteController from "../game/gameShulte/GameShulteController";
import { CacheManager } from "./CacheManager";
import { LoaderManager } from "./LoaderManager";
import { SceneManager } from "./SceneManager";
import SoundManager from "./SoundManager";
import { UIMgr } from "./UIMgr";

export default class Mgr {
    public static soundMgr:SoundManager;
    public static sceneMgr:SceneManager;
    public static ui:UIMgr;
    public static loader:LoaderManager;
    public static cache:CacheManager;
    private static isInit:boolean = false;

    public static Init() {
        if (Mgr.isInit) return;

        Mgr.InitCtrl();
        Mgr.loader = new LoaderManager();
        Mgr.cache = new CacheManager();
        Mgr.soundMgr = new SoundManager();
        Mgr.sceneMgr = new SceneManager();
        Mgr.ui = new UIMgr();

        WXSDK.Init();
        Mgr.isInit = true;
    }

    private static InitCtrl(){
        new GameShulteController();
        new GameGridController();
        new GameNumberController();
    }
}


