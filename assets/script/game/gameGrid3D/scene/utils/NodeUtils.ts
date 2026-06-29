import { Color, gfx, MeshRenderer, Node } from "cc";

export default class NodeUtils {
    public static set3DNodeOpacity(node: Node, alpha: number) {
        this.set3DNodeColor(node, new Color(75, 84, 150, Math.floor(255 * alpha)));
    }

    public static set3DNodeColor(node: Node, color: Color) {
        const renderers = node.getComponentsInChildren(MeshRenderer);
    
        for (const renderer of renderers) {
            const mat = renderer.getMaterialInstance(0);
            if (!mat) continue;
    
            mat.setProperty("mainColor", color, 0);
    
            mat.overridePipelineStates({
                blendState: {
                    targets: [{
                        blend: true,
                        blendSrc: gfx.BlendFactor.SRC_ALPHA,
                        blendDst: gfx.BlendFactor.ONE_MINUS_SRC_ALPHA,
                        blendSrcAlpha: gfx.BlendFactor.SRC_ALPHA,
                        blendDstAlpha: gfx.BlendFactor.ONE_MINUS_SRC_ALPHA,
                    }],
                },
                depthStencilState: {
                    depthWrite: false,
                },
            }, 0);
        }
    }
}