import { director, utils } from "cc";
import { AudioPlayer } from "../common/AudioPlayer";

export default class SoundManager {
    private _ap:AudioPlayer;
    public constructor() {
        this.init();
    }

    public init(){
        let soundEntity = utils.find("SoundManager");
        director.addPersistRootNode(soundEntity);
        if(soundEntity){
            this._ap = soundEntity.getComponent(AudioPlayer);
        }
        else{
            console.log("sound不存在");
        }
    }
    public setMute(isMute:boolean){
        this._ap.setMute(isMute);
    }

    public play(audioName:string,stopLast:boolean = true) {
        this._ap.play(audioName,stopLast);
    }

    public playBGM(audioName:string){
        this._ap.playBGM(audioName);
    }

    public stopBGM(){
        this._ap.stopBGM();
    }

    public pause(){
        this._ap.onPause();
    }

    public resume(){
        this._ap.onResume();
    }
}
