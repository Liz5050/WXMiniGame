import { _decorator, Component, director, Node, Scene, utils } from 'cc';
const { ccclass, property } = _decorator;

export class SceneManager {
    private _mainSceneNode:Node;
    public constructor() {
        this._mainSceneNode = utils.find("Canvas");
        director.addPersistRootNode(this._mainSceneNode);
    }    

    public LoadScene(sceneName:string){
        let self = this;
        director.loadScene(sceneName,function(error:Error,scene:Scene){
            if(scene.name == "scene"){
                self._mainSceneNode.active = true;
            }
            else {
                self._mainSceneNode.active = false;
            }
        });
    }
}


