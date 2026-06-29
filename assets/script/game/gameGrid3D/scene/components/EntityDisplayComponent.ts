import { instantiate, Node, Prefab } from "cc";
import Mgr from "../../../../manager/Mgr";
import { EntityComponent } from "./EntityComponent";
import { EntityNodeBinder } from "./EntityNodeBinder";
import EntityVo from "../vo/EntityVo";

export class EntityDisplayComponent extends EntityComponent {
    protected _viewRoot: Node = null;
    private _loadToken: number = 0;

    private _modelUrl: string = "";
    protected updateVo(): void {
        this.updateModel();
    }

    private updateModel(){
        if (!this.vo) return;
        if (this.vo.modelUrl && this._modelUrl !== this.vo.modelUrl) {
            this._modelUrl = this.vo.modelUrl;
            this.loadViewPart("scene", this._modelUrl);
        }
    }
    
    protected onViewLoaded(node: Node): void {}

    protected onEntityVoPropUpdate(evt: { key: OwnKeys<EntityVo>; val: any }): void {
    }

    protected get displayParent(): Node {
        return this.entity && this.entity.parentNode;
    }

    protected loadViewPart(bundleName: string, resPath: string): void {
        if (!resPath) return;
        const token = this.nextLoadToken();
        Mgr.loader.LoadBundleRes(bundleName, resPath, (prefab: Prefab) => {
            if (!this._vo || !this.isValidLoadToken(token)) return;
            const node = instantiate(prefab);
            node.name = this.vo.getShowName();
            this.entity.node = node;
            this.bindViewRoot(node);
            this.onViewLoaded(node);
        });
    }

    protected nextLoadToken(): number {
        return ++this._loadToken;
    }

    protected isValidLoadToken(token: number): boolean {
        return token === this._loadToken;
    }

    protected invalidateLoadToken(): void {
        this._loadToken++;
    }

    protected bindViewRoot(node: Node): void {
        this.destroyViewRoot();
        this._viewRoot = node;
        const parent = this.displayParent;
        parent && parent.addChild(this._viewRoot);
        let binder = this._viewRoot.getComponent(EntityNodeBinder);
        if (!binder) {
            binder = this._viewRoot.addComponent(EntityNodeBinder);
        }
        binder.entity = this.entity;

        if(this.vo) {
            this._viewRoot.setPosition(this.vo.pos);
            this._viewRoot.forward = this.vo.forward;
        }
    }

    protected destroyViewRoot(): void {
        if (!this._viewRoot) return;
        const binder = this._viewRoot.getComponent(EntityNodeBinder);
        if (binder) {
            binder.entity = null;
        }
        this._viewRoot.removeFromParent();
        this._viewRoot.destroy();
        this._viewRoot = null;
    }

    protected onReset(): void {
        this.invalidateLoadToken();
        this.destroyViewRoot();
    }
}
