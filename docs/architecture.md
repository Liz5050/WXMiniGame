# 架构与启动流程

## 总体架构

项目当前采用“全局管理器 + 事件中心 + 模块 Controller + View/Cache 分层”的组织方式。

核心角色：

- `GameStart`：场景入口组件，负责初始化全局依赖。
- `Main`：主界面容器，接收游戏开始/退出事件并切换主菜单显示状态。
- `MainMenu`：主菜单子视图，负责玩法入口、排行榜入口、商店页签、音效开关等。
- `ControllerManager`：集中创建各玩法 Controller。
- `CacheManager`：集中创建运行时缓存对象。
- `Mgr`：保存加载、音频、场景、计时器、UI 等全局管理器实例。
- `EventManager`：全局事件派发中心。
- `LoaderManager`：Bundle、Prefab、resources、远程图片等加载封装。

## 启动流程

当前入口为场景中的 `GameStart` 组件。

```text
GameStart.start()
  -> Mgr.loader = new LoaderManager()
  -> LayerManager.init()
  -> new Main()
  -> 注册 UI 加载和资源加载完成事件
  -> director.getScheduler().schedule(gameUpdate)

EventEnum.OnGameResLoadComplete
  -> ConfigManager.init()
  -> CacheManager.init()
  -> CacheManager.game.scheduler = scheduler
  -> Mgr.Init()
  -> ControllerManager.init()
  -> SDK.Init()
  -> registerPreloadWaitCls()
  -> Main.show()
```

## 主界面与玩法切换

主界面状态由 `Main` 维护：

- 收到 `EventEnum.OnGameStart` 后进入 `GameState.Playing`，隐藏主界面根节点。
- 收到 `EventEnum.OnGameExit` 后进入 `GameState.Home`，重新显示主界面根节点。
- 舒尔特玩法退出时会额外调用 `SDK.HideBannerAd()`。

`MainMenu.OnStartGame(type)` 会先通过 `GameDefine.getGameRes(type)` 获取玩法预加载资源；如果资源未准备完，先加载玩法依赖 UI Prefab，再派发 `OnGameStart`。

## Controller 职责

Controller 主要监听全局事件并控制对应 View 的创建与显示。

```text
ControllerManager.init()
  -> ShopController
  -> GameShulteController
  -> GameGridController
  -> GameGrid3DController
  -> GameBallController
  -> RankController
  -> GameHitController
  -> SideBarRewardController
```

典型模式：

```ts
EventManager.addListener(EventEnum.OnGameStart, this.onGameStart, this);

private onGameStart(type: GameType): void {
    if (type !== GameType.SomeGame) return;
    if (!this._view) {
        this._view = new SomeGameView();
    }
    this._view.show();
}
```

## View 层级体系

项目有三类主要 View 基类：

- `BaseView`：最基础视图类，提供根节点、初始化、定时器、显示/隐藏钩子。
- `BaseUIView`：独立 UI 界面，支持按 `UIModuleEnum` 从 `ui` Bundle 加载 Prefab。
- `BaseUISubView`：已有节点上的子视图，通常用于主界面内部区域。
- `BaseCCView`：继承 Cocos `Component` 的组件式视图基类。

`BaseUIView` 默认添加到 `LayerManager.popupLayer`，可通过覆盖 `parent` 指定层级，例如 `Main` 使用 `LayerManager.mainLayer`。

## 层级管理

`LayerManager.init()` 会查找 `Canvas/LayerManager` 下的节点：

- `HUDLayer`
- `MainLayer`
- `GameLayer`
- `PopupLayer`
- `TipsLayer`
- `TopLayer`

后续新增 UI 时，应优先复用这些层级，不建议在业务代码中散落查找 Canvas 节点。

## 资源加载

`LoaderManager` 统一处理：

- `LoadBundle`
- `LoadBundleRes`
- `LoadUIPrefab`
- `LoadRes`
- 远程图片转 `SpriteFrame`
- 图集 `SpriteAtlas` 设置

UI Prefab 的加载约定：

```text
Bundle: ui
路径: UIModuleEnum[moduleId] + "/" + viewName
示例: gameGrid/GameGridStartView
```

`GameDefine` 维护玩法首次进入前需要预加载的 UI Prefab 列表。

## 事件系统

当前主要事件系统是 `EventManager + EventEnum`：

- `addListener(name, listener, listenerObj)`
- `removeListener(name, listener, listenerObj)`
- `dispatch(name, ...params)`
- `clear()`

项目中也出现了 `MessageCenter`、`GEvent`、`LoginEvent`、`GameGridEvent` 等类型化事件体系，说明重构中可能正在向更强类型的消息中心迁移。后续开发应避免继续扩大两套事件系统的混用范围。

## Grid3D 独立战斗架构

`GameType.Grid3D = 1006` 已从 2D 方格玩法 `GameType.Grid = 1002` 拆出，独立模块目录为 `assets/script/game/gameGrid3D/`。`GameGridController` 只处理 1002，`GameGrid3DController` 只处理 1006；`CacheManager.gameGrid` 与 `CacheManager.gameGrid3D` 也分别维护各自运行时数据。

`gameGrid3D/scene` 下包含一套 Entity-Component-EntityVo 结构：

- `entity/`：`BaseEntity`、敌人、英雄、地图格子等运行时逻辑实体，不直接作为 Cocos 节点挂载。
- `vo/`：实体数据对象，继承 `BaseVo`，承载状态、位置、目标、血量、资源路径等可同步数据。
- `components/`：`EntityComponent`、`ComponentSystem`、State、Battle、RVO Move、Skill、Actor、HUD、GridPreview 等组件；显示相关组件按需加载并持有显示部件。
- `statemachine/`：Idle、Walk、Attack、Battle、Die 等状态实现。
- `layer/`：地图格子、动态实体、背景、UI 等 3D 场景层。

这部分更接近实体组件架构，和普通 UI Controller 写法不同。实体逻辑与显示部件分离：`EntityVo` 保存可同步状态，`BaseEntity` 负责绑定 Vo、挂载组件并持有显示对象引用，`ComponentSystem` 统一更新组件，表现组件只消费 Vo 快照并更新模型、动画、HUD 或格子预览。地图交互格子由 `GameMapGridLayer` 管理，动态战斗实体由 `GameEntityLayer` 管理。重构时应单独作为战斗运行时子系统维护，禁止继续依赖 2D `gameGrid/scene` 或 `GameGridCache` 的实体职责。

Grid3D 内部事件优先使用 `MessageCenter/GEvent`，并统一使用 `OnGameGrid3D...` 命名；只有玩法入口、退出和主界面切换等全局流程继续使用 `EventManager/EventEnum`。更多约定见 `game-grid-3d.md`。

Grid3D 局内流程由 `GameGrid3DPhaseController` 调度，具体阶段控制器继承统一的 `BasePhaseController` 生命周期。游戏初始进入构建阶段；构建到战斗由 UI 派发 `OnGameGrid3DStartBattle` 主动触发；战斗到构建只由敌人全灭的战斗结果触发；核心据点死亡进入失败流程，不回到正常构建循环。阶段状态同步到 `GameGrid3DCache`，表现层通过 `OnGameGrid3DRoundUpdate` 和阶段事件刷新。
