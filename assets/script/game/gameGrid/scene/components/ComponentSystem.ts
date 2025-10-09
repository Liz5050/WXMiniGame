import { TimerManager } from "db://assets/script/manager/TimerManager";
import { EntityComponent } from "./EntityComponent";

export default class ComponentSystem {
    private static _components: { [type: string]: EntityComponent[] } = {};

    private static _timer: number = -1;
    private static _now: number = 0;
    private static _isPause: boolean = false;
    public static addComponent(component: EntityComponent): void {
        let comps = ComponentSystem._components[component.type];
        if (!comps) {
            comps = [];
            ComponentSystem._components[component.type] = comps;
        }
        let index: number = comps.indexOf(component);
        if (index != -1) {
            console.error("重复添加组件");
            return;
        }
        comps.push(component);
    }

    public static removeComponent(component: EntityComponent): void {
        if (!ComponentSystem._components[component.type]) {
            return;
        }

        let index: number = ComponentSystem._components[component.type].indexOf(component);
        if (index != -1) {
            ComponentSystem._components[component.type].splice(index, 1);
        }
    }

    public static removeAllComponents() {
        for (let key in ComponentSystem._components) {
            const list = ComponentSystem._components[key];
            console.log(`[战斗调试]组件type：${key}->数量：${list.length}`);
            if (list.length > 0) {
                console.warn("[战斗调试]，退出战斗，存在组件引用残留，强制清理干净");
                for (let comp of list) {
                    comp.stop();
                }
                list.length = 0;
            }
        }
    }

    public static start(): void {
        if (ComponentSystem._timer < 0) {
            ComponentSystem._now = Date.now();
            ComponentSystem._timer = TimerManager.instance.doTimer(0, 0, ComponentSystem.onUpdate,ComponentSystem);
        }
    }

    public static stop(): void {
        if (ComponentSystem._timer > 0) {
            TimerManager.instance.removeById(ComponentSystem._timer);
            ComponentSystem._timer = -1;
        }
    }

    public static pause() {
        ComponentSystem._isPause = true;
    }

    public static resume() {
        ComponentSystem._now = Date.now();
        ComponentSystem._isPause = false;
    }

    private static onUpdate(): void {
        if (ComponentSystem._isPause) return;

        const now = Date.now();
        const dt = (now - ComponentSystem._now) / 1000;
        ComponentSystem._now = now;
        // const timeScale = BattleController.inst().getModel().curTimeScale;
        const timeScaleDt = dt * 1;
        // ComponentSystem.dealComponents(ComponentSystem._components[ComponentType.Move], timeScaleDt);
        // ComponentSystem.dealComponents(ComponentSystem._components[ComponentType.ReportMove], timeScaleDt);
        // ComponentSystem.dealComponents(ComponentSystem._components[ComponentType.Bullet], timeScaleDt);
        // ComponentSystem.dealComponents(ComponentSystem._components[ComponentType.ReportSkill], timeScaleDt);
        // ComponentSystem.dealComponents(ComponentSystem._components[ComponentType.TimeScale], dt);
    }

    private static dealComponents(components: EntityComponent[], deltaTime: number): void {
        if (!components || !components.length) {
            return;
        }
        let component: EntityComponent;
        for (let i: number = 0; i < components.length; i++) {
            component = components[i];
            component.update(deltaTime);
        }
    }
}