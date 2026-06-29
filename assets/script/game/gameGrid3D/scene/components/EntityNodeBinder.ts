import { Component, Node, _decorator } from "cc";
import type { BaseEntity } from "../entity/BaseEntity";

const { ccclass } = _decorator;

@ccclass("EntityNodeBinder")
export class EntityNodeBinder extends Component {

    private _entity: BaseEntity = null;

    public set entity(entity: BaseEntity) {
        this._entity = entity;
    }

    public get entity(): BaseEntity {
        return this._entity;
    }

    protected onDestroy(): void {
        if (this._entity) {
            this._entity = null;
        }
    }
}
