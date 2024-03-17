import { LoaderManager } from "./LoaderManager";
import { SceneManager } from "./SceneManager";
import SoundManager from "./SoundManager";
import { TimerManager } from "./TimerManager";
import { UIMgr } from "./UIMgr";

export default class Mgr {
    public static soundMgr:SoundManager;
    public static sceneMgr:SceneManager;
    public static ui:UIMgr;
    public static loader:LoaderManager;
    public static timer:TimerManager;
    private static isInit:boolean = false;

    public static Init() {
        if (Mgr.isInit) return;

        Mgr.timer = TimerManager.instance;
        Mgr.soundMgr = new SoundManager();
        Mgr.sceneMgr = new SceneManager();
        Mgr.ui = new UIMgr();

        
        Mgr.isInit = true;
    }
}


