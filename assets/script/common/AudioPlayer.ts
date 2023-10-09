import { _decorator, Component, AudioSource, resources, AudioClip } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AudioPlayer')
export class AudioPlayer extends Component {
    private _audioPlayers:AudioSource[];
    private _audioIdx:number;
    private _audioLastIdx:number;
    private _bgmPlayer:AudioSource;
    private _isMute:boolean;

    public start() {
        this._audioPlayers = [];
        this._audioIdx = 0;
        this._audioLastIdx = -1;
        let audio:AudioSource = this.node.getChildByName("Sound1").getComponent(AudioSource);
        this._audioPlayers.push(audio);
        audio = this.node.getChildByName("Sound2").getComponent(AudioSource);
        this._audioPlayers.push(audio);
        audio = this.node.getChildByName("Sound3").getComponent(AudioSource);
        this._audioPlayers.push(audio);

        this._bgmPlayer = this.node.getChildByName("BGM").getComponent(AudioSource);
        // this._audioPlayer = this.getComponent(engine.AudioSource);
    }

    public onUpdate(dt) {

    }

    public play(audioName:string,stopLast:boolean = true) {
        if (stopLast) {
            if(this._audioLastIdx >= 0){
                this._audioPlayers[this._audioLastIdx].stop();
                this._audioPlayers[this._audioLastIdx].clip = null;
            }
        }
        this._audioIdx = this._audioLastIdx + 1;
        this._audioLastIdx = this._audioIdx;
        if(this._audioIdx >= 3){
            this._audioIdx = 0;
            this._audioLastIdx = 0;
        }
        let source:AudioSource = this._audioPlayers[this._audioIdx];
        let url:string = "audio/" + audioName;
        this.playByUrl(url,source);
    }

    public playBGM(audioName:string){
        let url:string = "audio/bgm/" + audioName;
        this.playByUrl(url,this._bgmPlayer);
    }
    
    public stopBGM(){
        this._bgmPlayer.stop();
        this._bgmPlayer.clip = null;
    }

    public playByUrl(url:string,source:AudioSource){
        if(!source){
            let idx:number = this._audioLastIdx >= 0 ? this._audioLastIdx : 0;
            source = this._audioPlayers[idx];
        }
        let audioClip = resources.get(url) as AudioClip;
        if(audioClip){
            source.clip = audioClip;
            source.play();
        }else{
            resources.load(url,function(error:Error,audio){
                source.clip = audio as AudioClip;
                source.play();
            });
        }
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



