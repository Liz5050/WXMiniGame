import { Camera, Component, _decorator } from "cc";
const {ccclass , property} = _decorator;

@ccclass
export class Root3D extends Component{
    @property(Camera) mainCamera:Camera = null;
    public static mainCamera:Camera;
    protected onLoad(): void {
        Root3D.mainCamera = this.mainCamera;
    }
}