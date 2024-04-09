import { Camera, Component, Node, Tween, Vec3, _decorator, tween } from "cc";
import { EventManager } from "./manager/EventManager";
import { EventEnum } from "./enum/EventEnum";
const {ccclass , property} = _decorator;

export enum CameraType {
    TopView = 1,
    BattleView = 2,
}
@ccclass
export class Root3D extends Component{
    @property(Camera) mainCamera:Camera = null;
    @property(Node) public canvas : Node = null;
    public static mainCamera:Camera;
    public static instance:Root3D;

    private _pos:Vec3;
    private _eulerAngle:Vec3;
    private _type:CameraType;
    protected onLoad(): void {
        Root3D.mainCamera = this.mainCamera;
        Root3D.instance = this;
        this._pos = new Vec3();
        this._eulerAngle = new Vec3();
    }

    public switchCamera(type:CameraType){
        if(this._type === type) {
            return;
        }
        this._type = type;
        let fov;
        let pos = this.mainCamera.node.position;
        this._pos.x = pos.x;
        this._pos.y = pos.y;
        if(this._type == CameraType.TopView){
            this._pos.z = 8;
            this._eulerAngle.x = -90;
            fov = 90;
        }
        else{
            this._pos.z = 12;
            this._eulerAngle.x = -70;
            fov = 100;
            this.mainCamera.projection = Camera.ProjectionType.PERSPECTIVE;
        }
        Tween.stopAllByTarget(this.mainCamera);
        Tween.stopAllByTarget(this.mainCamera.node);
        tween(this.mainCamera.node).to(0.5,{eulerAngles:this._eulerAngle}).call(()=>{
            if(this._type == CameraType.TopView){
                this.mainCamera.orthoHeight = 12;
                this.mainCamera.projection = Camera.ProjectionType.ORTHO;
            }
            EventManager.dispatch(EventEnum.OnGameGridSceneReady);
        }).start();
        tween(this.mainCamera).to(0.5,{fov:fov}).start();
    }
}