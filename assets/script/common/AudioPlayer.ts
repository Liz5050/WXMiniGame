import { game } from 'cc';
import { _decorator, Component, AudioSource, resources, AudioClip } from 'cc';
import Mgr from '../manager/Mgr';
import { AssetManager } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AudioPlayer')
export class AudioPlayer extends Component {
    private _audioPlayers:AudioSource[];
    private _audioIdx:number;
    private _audioLastIdx:number;
    private _bgmPlayer:AudioSource;
    private _isMute:boolean;
    private _maxAudio:number = 5;
    private _playTime:{[url:string]:number} = {}
    private _curBGM:string;
    public start() {
        this._audioPlayers = [];
        this._audioIdx = 0;
        this._audioLastIdx = -1;
        for(let i = 1; i <= this._maxAudio; i++){
            let audio:AudioSource = this.node.getChildByName("Sound" + i).getComponent(AudioSource);
            this._audioPlayers.push(audio);
        }

        this._bgmPlayer = this.node.getChildByName("BGM").getComponent(AudioSource);
        // this._audioPlayer = this.getComponent(engine.AudioSource);
    }

    public onUpdate(dt) {

    }

    public play(audioName:string,stopLast:boolean = true) {
        let url:string = audioName;
        let playTime = this._playTime[url];
        let curTime = game.totalTime;
        if(!playTime){
            playTime = 0;
        }
        let audioClip = Mgr.loader.getBundleRes("audio",audioName) as AudioClip;
        if(audioClip){
            let audioTime = audioClip.getDuration() * 1000;
            let playInterval = curTime - playTime;
            if(playInterval < audioTime * 0.1){
                //相同音频播放间隔时间太短，这次不播放
                return;
            }
        }
        
        if (stopLast) {
            if(this._audioLastIdx >= 0){
                this._audioPlayers[this._audioLastIdx].stop();
                this._audioPlayers[this._audioLastIdx].clip = null;
            }
        }
        this._audioIdx = this._audioLastIdx + 1;
        this._audioLastIdx = this._audioIdx;
        if(this._audioIdx >= this._maxAudio){
            this._audioIdx = 0;
            this._audioLastIdx = 0;
        }
        let source:AudioSource = this._audioPlayers[this._audioIdx];
        this.playByUrl(url,source);
        this._playTime[url] = curTime;
    }

    public playBGM(audioName:string){
        let url:string = "bgm/" + audioName;
        this._curBGM = url;
        this.playByUrl(url,this._bgmPlayer,true);
    }
    
    public stopBGM(){
        this._curBGM = "";//防止加载未完成时调用停止失效
        this._bgmPlayer.stop();
        this._bgmPlayer.clip = null;
    }

    private playByUrl(url:string,source:AudioSource,isBGM:boolean = false){
        if(!source){
            let idx:number = this._audioLastIdx >= 0 ? this._audioLastIdx : 0;
            source = this._audioPlayers[idx];
        }
        Mgr.loader.LoadAudio(url,(audio)=>{
            if(isBGM){
                if(!this._curBGM || this._curBGM != url){
                    return;
                }
            }
            source.clip = audio as AudioClip;
            source.play();
        });
    }

    public setMute(isMute:boolean){
        this._isMute = isMute;
        for(let i = 0;i < this._audioPlayers.length; i++){
            this._audioPlayers[i].volume = isMute ? 0 : 1;
        }
        this._bgmPlayer.volume = isMute ? 0 : 1;
    }

    public onPause(){
        this._bgmPlayer.pause();
    }

    public onResume(){
        this._bgmPlayer.play();
    }

    public onDestroy() {

    }
}



