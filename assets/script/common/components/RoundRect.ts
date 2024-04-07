import {
    _decorator, Component, Node,
    CCFloat, CCInteger,
    Vec3, Color, Mesh, Material,
    MeshRenderer, Canvas, UITransform,
    math, primitives, utils,
} from 'cc';
import { EDITOR } from 'cc/env';
const { ccclass, property, executeInEditMode } = _decorator;

/** [圆角矩形] 通过调整公开参数, 动态绘制一个圆角矩形的Mesh;
 * * 基于引擎API: *utils.MeshUtils.createDynamicMesh* 绘制;
 * * 内部包含优化策略, 各公开参数均可暴力调整;
 * * 主要为3D场合使用, 顺带做了UI模式;
 * * 暂时不支持合批, 大量使用时谨慎谨慎;
 * @version 1.0.0
 */
@ccclass('RoundRect')
@executeInEditMode(true)
export class RoundRect extends Component {

    //#region [Editor]

    private static readonly uipreset: Partial<RoundRect> = {
        isUI: true,
        anchor: 0,
        round: 20,
        lineWidth: 10,
    }
    private __checkPreset_inEditor() {
        if (!EDITOR) return;
        if (this._) return;
        this._ = true;

        if (this.node._uiProps.uiTransformComp)
            return this.__setPreset_inEditor();

        let cvs: Canvas;
        let node = this.node;
        while (node) {
            cvs = node.getComponent(Canvas);
            if (cvs) break;
            node = node.parent;
        }
        if (!cvs) return;

        this.node.addComponent(UITransform);
        this.__setPreset_inEditor();
    }
    private __setPreset_inEditor() {
        const preset = RoundRect.uipreset;
        for (const key in preset)
            this[key] = preset[key];
    }

    //#endregion [Editor]

    //#region [propertys]

    @property({ displayName: '手动初始化', tooltip: '在编辑器中, 如果没有生成网格, 则手动点一下', visible: function (this: RoundRect) { return !this._mr; } })
    private get draw() { return true; }
    private set draw(v) { this.init(); }

    @property({ displayName: '[只读]多边形数量', tooltip: '显示创建网格的三角面的数量', visible: function (this: RoundRect) { return !!this._geometry?.indices16; }, })
    private get triCount() { return this._geometry?.indices16?.length / 3; }

    /** [hasPresetInEditor] 用于记录从编辑器添加时, 自动判断当前节点是否UI */
    private _ = false;

    private static _showEditor = false;
    @property({ displayName: '调试模式', tooltip: '在编辑器面板显示内部数据' })
    private get showEditor() { return RoundRect._showEditor; }
    private set showEditor(v) { RoundRect._showEditor = v; }

    private _isUI = false;
    @property({ displayName: 'UI模式', tooltip: '设置为UI模式之后, 网格将会竖放, 同时矩形宽高由UITransfrom的Size调整\n* 编辑器时, 组件会自动判断节点是否UI, 此选项仅供必要时手动设置' })
    /** [UI模式] 设置为UI模式之后, 网格将会竖放, 同时矩形宽高由UITransfrom的Size调整
     * * 通常由场景处理, 仅代码手动创建时需要勾选 */
    public get isUI() { return this._isUI; }
    public set isUI(v) { if (this._isUI === v) return; this._isUI = v; this._listenWH(v); this.dirty |= DirtyType.gmyPos; }

    private _color = Color.WHITE.clone();
    @property({ displayName: '颜色' })
    /** [颜色] 修改材质的颜色 */
    public get color() { return this._color; }
    public set color(v) { this._color.set(v); this._mr.sharedMaterial.setProperty('mainColor', v, 0); }

    private _showLine = true;
    @property({ displayName: '是否显示线段', tooltip: '不选中的话, 则仅显示4个角' })
    /** [是否显示线段] 不选中的话, 则仅显示4个角 */
    public get showLine() { return this._showLine; }
    public set showLine(v) { if (this._showLine === v) return; this._showLine = v; this.dirty |= DirtyType.count; }

    private _hasRound = true;
    /** [是否圆角] 切换圆角和直角
     * * 切换成直角时, `圆角半径`和`圆角步长`将会失效 */
    @property({ displayName: '是否圆角', tooltip: '切换圆角和直角\n* 切换成直角时, `圆角半径`和`圆角步长`将会失效' })
    public get hasRound() { return this._hasRound; }
    public set hasRound(v) { if (this._hasRound === v) return; this._hasRound = v; this.dirty |= DirtyType.count; }

    @property(CCInteger) private _roundStep = 10;
    /** [圆角步长] 步长越大, 圆角越圆滑, 网格面数越多
     * * 此数值必须大于0, 会自行判断并处理
     * * 此数值必须小于40, 会自行判断并处理
     * * 显示直角时, 此数值不相应 */
    @property({ type: CCInteger, displayName: '圆角步长', tooltip: '步长越大, 圆角越圆滑, 网格面数越多\n* 此数值必须大于0\n* 此数值必须小于40', slide: true, step: 1, range: [1, 40], visible: function (this: RoundRect) { return this._hasRound; }, })
    public get roundStep() { return this._roundStep; }
    public set roundStep(v) { if (v < 0) v = 0; if (v > 40) v = 40; if (this._roundStep === v) return; this._roundStep = v; this.dirty |= DirtyType.count; }

    @property({ type: CCFloat, displayName: '[只读]实际半径', readonly: true, serializable: false, visible: function (this: RoundRect) { return RoundRect._showEditor; } }) private _realRound = 1;
    @property(CCFloat) private _round = 1;
    /** [圆角半径] 圆角半径越大, 圆角占用的面积越大
     * * 此数值必须大于0, 会自行判断并处理
     * * 矩形尺寸过小时, 圆角半径会自适应
     * * 显示直角时, 此数值不相应 */
    @property({ type: CCFloat, displayName: '圆角半径', tooltip: '圆角半径越大, 圆角占用的面积越大\n* 此数值必须大于0\n* 矩形尺寸过小时, 圆角半径会自适应', visible: function (this: RoundRect) { return this._hasRound; }, })
    public get round() { return this._round; }
    public set round(v) { if (v < 0) v = 0; if (this._round === v) return; this._round = v; this.dirty |= DirtyType.sharp; }

    @property({ type: CCFloat, displayName: '[只读]外部线宽', readonly: true, serializable: false, visible: function (this: RoundRect) { return RoundRect._showEditor; } }) private _outerLineWidth = 0.5;
    @property({ type: CCFloat, displayName: '[只读]内部线宽', readonly: true, serializable: false, visible: function (this: RoundRect) { return RoundRect._showEditor; } }) private _innerLineWidth = 0.5;
    @property(CCFloat) private _lineWidth = 0.5;
    /** [线宽] 线宽越大, 矩形线框的宽度越大
     * * 此数值必须大于0, 会自行判断并处理 */
    @property({ type: CCFloat, displayName: '线宽', tooltip: '线宽越大, 矩形线框的宽度越大\n* 此数值必须大于0' })
    public get lineWidth() { return this._lineWidth; }
    public set lineWidth(v) { if (v < 0) v = 0; if (this._lineWidth === v) return; this._lineWidth = v; this.dirty |= DirtyType.sharp; }

    @property(CCFloat) private _anchor = 0.5;
    /** [内外偏移] 调整线宽时的方向和比例
     * * 0: 内侧, 0.5: 居中, 1: 外侧 */
    @property({ type: CCFloat, displayName: '内外偏移', tooltip: '调整线宽时的方向和比例\n0: 内侧, 0.5: 居中, 1: 外侧', slide: true, step: 0.01, range: [0, 1] })
    public get anchor() { return this._anchor; }
    public set anchor(v) { if (v < 0) v = 0; if (v > 1) v = 1; if (this._anchor === v) return; this._anchor = v; this.dirty |= DirtyType.sharp; }

    @property(CCFloat) private _width = 10;
    /** [矩形宽度] 矩形在X轴向的长度
     * * 此数值必须大于0, 会自行判断并处理
     * * UI模式下, 修改`UITransform`的`contentSize` */
    @property({ type: CCFloat, displayName: '矩形宽度', tooltip: '矩形在X轴向的长度\n* 此数值必须大于0', visible: function (this: RoundRect) { return !this._isUI; } })
    public get width() { return this._width; }
    public set width(v) { if (v < 0) v = 0; if (this._width === v) return; this._width = v; this.dirty |= DirtyType.wh; }

    @property(CCFloat) private _height = 10;
    /** [矩形宽度] 矩形在Z轴向的长度
     * * 此数值必须大于0, 会自行判断并处理
     * * UI模式下, 修改`UITransform`的`contentSize` */
    @property({ type: CCFloat, displayName: '矩形深度', tooltip: '矩形在Z轴向的长度\n* 此数值必须大于0', visible: function (this: RoundRect) { return !this._isUI; } })
    public get height() { return this._height; }
    public set height(v) { if (v < 0) v = 0; if (this._height === v) return; this._height = v; this.dirty |= DirtyType.wh; }

    @property(CCFloat) private _y = 0.5;
    /** [整体高度] 矩形在Y轴向的位置
     * * UI模式下, 此数值不相应 */
    @property({ type: CCFloat, displayName: '整体高度', tooltip: '矩形在Y轴向的位置', visible: function (this: RoundRect) { return !this._isUI; } })
    public get y() { return this._y; }
    public set y(v) { this._y = v; this.dirty |= DirtyType.gmyPos; }

    //#endregion [propertys]

    private init() {
        if (this._mr) return;

        // this.__checkPreset_inEditor();
        this.initMesh();
        this.initV();
        if (this._isUI) this._listenWH(true);
        this._onRAL_VC();
        this.updateCount();
        this.dirty = DirtyType.none;
    }

    //#region [Component]

    protected onLoad(): void { this.init(); }
    protected lateUpdate(): void { this.updateDirty(); }

    //#endregion [Component]

    //#region [public]

    /** [立即更新] 适用于修改参数后需要立即更新网格的场合 */
    public updateImmediate(): void { this.updateDirty(); }

    //#endregion [public]

    //#region [UI]

    private _listenWH(isOn: boolean) {
        const cb = isOn ? this.node.on : this.node.off;
        cb.call(this.node, Node.EventType.SIZE_CHANGED, this._onSizeVC, this);
        if (isOn) this._onSizeVC();
    }
    private _onSizeVC() {
        const tsf = this.node.getComponent(UITransform);
        if (!tsf) return;
        const size = tsf.contentSize;
        this.width = size.width;
        this.height = size.height;
    }

    //#endregion [UI]

    //#region [update]

    private dirty: DirtyType = DirtyType.none;

    private updateDirty() {
        if (!this.dirty) return;

        let dirty = this.dirty;
        this.dirty = DirtyType.none;

        if (dirty & DirtyType.sharp) this._onRAL_VC();
        else if (dirty & DirtyType.wh) this._onWH_VC() || (dirty |= DirtyType.sharp);

        if (dirty & DirtyType.count) this.updateCount();
        else if (dirty & DirtyType.sharp) this.updateSharp();
        else if (dirty & DirtyType.wh) this.updatePos();
        else if (dirty & DirtyType.gmy) this.updateGmyPoss();
        else if (dirty & DirtyType.gmyPos) this.updateGmyPoss();
        else if (dirty & DirtyType.mesh) this.updateMesh();
    }

    private updateCount() { this._updateCount(); this.updateSharp(); }
    private updateSharp() { this._updateSharp(); this.updatePos(); }
    private updatePos() { this._updatePos(); this.updateGmy(); }
    private updateGmy() { this._updateGmy(); this.updateMesh(); }
    private updateGmyPoss() { this._updateGmyPoss(); this.updateMesh(); }

    //#endregion [update]

    //#region [mesh]

    private _mr: MeshRenderer;
    private _mesh: Mesh;
    private _geometry: primitives.IDynamicGeometry;
    private _options: primitives.ICreateDynamicMeshOptions;
    private initMesh() {
        this._mr = this.getComponent(MeshRenderer) || this.addComponent(MeshRenderer);
        this._mr.mesh = this._mesh = new Mesh();
        this._mesh.name = 'create by RoundRect';
        if (!this._mr.sharedMaterial) {
            const mtl = new Material();
            mtl.name = 'create by RoundRect';
            mtl.initialize({ effectName: 'builtin-unlit' });
            mtl.setProperty('mainColor', this._color, 0);
            this._mr.sharedMaterials = [mtl];
        }
    }
    private updateMesh() { this._mr.mesh = utils.MeshUtils.createDynamicMesh(0, this._geometry, this._mesh, this._options); }

    //#endregion [mesh]

    //#region [virtual]

    private _tools: Tools;
    private _conners: Conner[];
    private _lines: VFace4[];
    private _pPool: Pool<VPoint>;
    private _mats: math.Mat4[];

    private initV() {
        const vpPool = this._pPool = new Pool<VPoint>(() => ({ v3: new Vec3(), rp: { v3: new Vec3(), i: -1 } }));
        this._tools = { getVPoint() { return vpPool.pop(); }, }
        this._conners = [[1, 1], [1, -1], [-1, -1], [-1, 1]].map(v => new Conner(v[0], v[1]));
        this._mats = [90, 180, -90].map(v => math.Mat4.fromRotation(new math.Mat4, v * anelgToArc, Vec3.UP));
        this._geometry = { positions: null, indices16: null };
    }

    private _onRAL_VC() {
        const minHarfExtend = (this._width < this._height ? this._width : this._height) * 0.5;
        this._realRound = this._round < minHarfExtend ? this._round : minHarfExtend;

        this._outerLineWidth = this._anchor * this._lineWidth;
        const innerWidth = (1 - this._anchor) * this._lineWidth;
        this._innerLineWidth = (innerWidth < minHarfExtend ? innerWidth : minHarfExtend);
    }
    private _onWH_VC() {
        const orr = this._realRound;
        const oil = this._innerLineWidth;
        const ool = this._outerLineWidth;

        this._onRAL_VC();

        return (
            this._realRound === orr &&
            this._innerLineWidth === oil &&
            this._outerLineWidth === ool
        );
    }

    private _updateCount() {
        this._pPool.recyleAll();
        const step = this._hasRound ? this._roundStep : 2;
        const conners = this._conners;
        conners.forEach(v => v.setStep(step, this._tools));
        if (this._showLine) this._lines = conners.map((v, i) => {
            const fl = v.faces[v.faces.length - 1].ps;
            const ff = conners[(i + 1) % conners.length].faces[0].ps;
            return { ps: [fl[2], fl[3], ff[0], ff[1]] } as VFace4;
        });
        this._geometry.positions = new Float32Array(this._pPool.using.length * 3);
        // this.geometry.normals = new Float32Array(this.vpPool.using.reduce(rsl => (rsl.push(0, 1, 0), rsl), [] as number[]));
        this._geometry.indices16 = new Uint16Array(4 * (step + +this._showLine) * 2 * 3);
    }
    private _updateSharp() {
        const c0 = this._conners[0];
        if (this._hasRound) c0.setRAL(this._realRound, this._innerLineWidth, this._outerLineWidth, !this._showLine);
        else c0.setAL(this._realRound, this._innerLineWidth, this._outerLineWidth, !this._showLine);
        this._mats.forEach((v, i) => this._conners[i + 1].matWith(c0, v));
    }
    private _updatePos() {
        const w = this._width * 0.5 - this._realRound;
        const h = this._height * 0.5 - this._realRound;
        this._conners.forEach(v => v.setPos(w, h));
    }
    private _updateGmy() {
        this._updateGmyPoss();
        let i = 0;
        const idxs = this._geometry.indices16;
        this._conners.forEach(v => v.faces.forEach(v => i = this._drawFace4Idx(idxs, i, v)));
        if (this._showLine) this._lines.forEach(v => i = this._drawFace4Idx(idxs, i, v));
    }
    private _updateGmyPoss() {
        const y = this._y;
        const poss = this._geometry.positions;
        this._pPool.using.forEach(this._isUI ? (v, i) => {
            v.rp.i = i;
            const v3 = v.rp.v3;
            poss[i * 3 + 0] = v3.x;
            poss[i * 3 + 1] = -v3.z;
            poss[i * 3 + 2] = 0;
        } : (v, i) => {
            v.rp.i = i;
            const v3 = v.rp.v3;
            poss[i * 3 + 0] = v3.x;
            poss[i * 3 + 1] = y;
            poss[i * 3 + 2] = v3.z;
        });
    }
    private _drawFace4Idx(idxs: Uint16Array, i: number, face: VFace4) {
        const ps = face.ps;
        idxs[i++] = ps[0].rp.i;
        idxs[i++] = ps[1].rp.i;
        idxs[i++] = ps[3].rp.i;
        idxs[i++] = ps[0].rp.i;
        idxs[i++] = ps[3].rp.i;
        idxs[i++] = ps[2].rp.i;
        return i;
    }

    //#endregion [virtual]

    //#region [test]

    // private drawTestQuad_poss_idx() {
    //     this._geometry.positions = new Float32Array([
    //         -1, 0, -1,
    //         -1, 0, 1,
    //         1, 0, -1,
    //         1, 0, 1,
    //     ]);
    //     this._geometry.indices16 = new Uint16Array([
    //         0, 1, 3,
    //         0, 3, 2,
    //     ]);
    //     console.log(this._geometry.positions);
    //     this.updateMesh();
    // }
    // private drawTestQuad_poss() {
    //     const ps = [
    //         [-1, 0, -1,],
    //         [-1, 0, 1,],
    //         [1, 0, -1,],
    //         [1, 0, 1,],
    //     ]
    //     this._geometry.positions = new Float32Array([
    //         ...ps[0],
    //         ...ps[1],
    //         ...ps[3],

    //         ...ps[0],
    //         ...ps[3],
    //         ...ps[2],

    //     ]);
    //     console.log(this._geometry.positions);
    //     this.updateMesh();
    // }

    //#endregion [test]

}

//#region [Tools]

const enum DirtyType {
    none = 0,
    count = 1 << 0,
    sharp = 1 << 1,
    wh = 1 << 2,
    gmy = 1 << 3,
    gmyPos = 1 << 4,
    mesh = 1 << 5,
}

const anelgToArc = Math.PI / 180;
interface Tools { getVPoint(): VPoint, }
interface VFace4 { ps: [VPoint, VPoint, VPoint, VPoint]; }
interface VPoint { v3: Vec3; rp: Point; }
interface Point { v3: Vec3; i: number; }

class Conner {
    constructor(public ofsX: number, public ofsZ: number) { }
    public faces: VFace4[] = [];
    public setStep(step: number, tools: Tools) {
        this.faces.length = step;
        let pO: VPoint = tools.getVPoint();
        let pI: VPoint = tools.getVPoint();
        for (let i = 0; i < step; i++) {
            let opO = pO;
            let opI = pI;
            pO = tools.getVPoint();
            pI = tools.getVPoint();
            this.faces[i] = { ps: [opO, opI, pO, pI] };
        }
    }
    public setAL(radis: number, lineI: number, lineO: number, isClame: boolean) {
        const vIp = isClame && radis - lineI < 0 ? 0 : radis - lineI;
        const vOp = isClame && radis - lineI < 0 ? 0 : radis + lineO;

        this.faces[0].ps[0].v3.z = this.faces[1].ps[2].v3.x = vIp;
        this.faces[0].ps[1].v3.z = this.faces[1].ps[3].v3.x = vOp;

        const pI = this.faces[0].ps[2].v3;
        const pO = this.faces[0].ps[3].v3;
        pI.x = pI.z = vIp;
        pO.x = pO.z = vOp;
    }
    public setRAL(radis: number, lineI: number, lineO: number, isClame: boolean) {
        const preArc = 1 / this.faces.length * 90 * anelgToArc;
        const f0pI = this.faces[0].ps[0].v3;
        const f0pO = this.faces[0].ps[1].v3;
        f0pI.x = f0pO.x = 0;

        const vIp = isClame && radis - lineI < 0 ? 0 : radis - lineI;
        const vOp = isClame && radis + lineO < 0 ? 0 : radis + lineO;
        const vI = f0pI.z = vIp; // > 0 ? vIp : 0;
        const vO = f0pO.z = vOp; // > 0 ? vOp : 0;
        this.faces.forEach((v, i) => {
            const arc = (i + 1) * preArc;
            const sin = Math.sin(arc);
            const cos = Math.cos(arc);
            const pI = v.ps[2];
            const pO = v.ps[3];
            pI.v3.x = sin * vI;
            pI.v3.z = cos * vI;
            pO.v3.x = sin * vO;
            pO.v3.z = cos * vO;
        });
    }
    public matWith(other: Conner, mat: math.Mat4) {
        this._matPoint(other.faces[0].ps[0], this.faces[0].ps[0], mat);
        this._matPoint(other.faces[0].ps[1], this.faces[0].ps[1], mat);
        this.faces.forEach((v, i) => {
            this._matPoint(other.faces[i].ps[2], v.ps[2], mat);
            this._matPoint(other.faces[i].ps[3], v.ps[3], mat);
        });
    }
    private _matPoint(f: VPoint, t: VPoint, mat: math.Mat4) { t.v3.set(f.v3).transformMat4(mat); }
    public setPos(x: number, z: number) {
        x *= this.ofsX;
        z *= this.ofsZ;
        this.updateP(this.faces[0].ps[0], x, z);
        this.updateP(this.faces[0].ps[1], x, z);
        this.faces.forEach(v => {
            this.updateP(v.ps[2], x, z);
            this.updateP(v.ps[3], x, z);
        });
    }
    private updateP(v: VPoint, x: number, z: number) {
        const s = v.v3;
        const t = v.rp.v3;
        t.x = s.x + x;
        t.z = s.z + z;
    }
}

class Pool<T> {
    constructor(protected ctor: { (): T; }) { }
    public cached: T[] = []; public using: T[] = [];
    public pop(): T { const t = this.cached.length > 0 ? this.cached.pop() : this.ctor(); this.using.push(t); return t; }
    public push(t: T) { this.cached.push(t); const i = this.using.indexOf(t); if (i !== -1) this.using.splice(i, 1); }
    public recyleAll() { this.cached.push(...this.using); this.using.length = 0; }
}

//#endregion [Tools]
