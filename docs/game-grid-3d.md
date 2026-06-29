# Grid3D 独立重构说明

## 模块定位

`GameType.Grid3D = 1006` 是独立于 `GameType.Grid = 1002` 的 3D 玩法模块，代码模块名为 `gameGrid3D`。

当前目标是搭建 roguelike + 塔防 + 割草方向的战斗框架，不在本阶段实现完整业务规则。现有回合、生成、建造、方块放置逻辑只作为 3D 运行时占位流程保留。

战斗玩法设计草案见 `grid3d-combat-design.md`，当前方向为“构建消除 + 地块养成 + 自动战斗 + 核心据点防守”。

## 目录边界

客户端代码：

- `assets/script/game/gameGrid3D/`：Grid3D Controller、View、场景层、Entity、Vo、Component、状态机、事件和工具。
- `assets/script/cache/GameGrid3DCache.ts`：Grid3D 局内运行时缓存。
- `assets/game/ui/gameGrid3D/`：Grid3D UI Prefab 资源路径，暂不改动。
- `assets/game/scene/gameGrid3D/`：Grid3D 场景和 3D 资源路径，暂不改动。

与 2D Grid 的边界：

- `assets/script/game/gameGrid/` 只服务 `GameType.Grid = 1002`。
- `assets/script/cache/GameGridCache.ts` 只保留 2D Grid 排行榜、皮肤、存档、道具和方块预览等职责。
- Grid3D 不接入 1002 的排行榜、皮肤、存档、广告道具链路。
- Grid3D 代码不得引用 `CacheManager.gameGrid` 或 2D `gameGrid` 模块；如需同形数据类型，应在 `gameGrid3D` 内定义独立类型。

## Controller 与 Cache

`ControllerManager` 同时初始化：

- `GameGridController`：只响应 `GameType.Grid`。
- `GameGrid3DController`：只响应 `GameType.Grid3D`。

`CacheManager.gameGrid3D` 暴露 `GameGrid3DCache`，当前职责包括：

- 局内初始化与清理：`initGameData()`、`clearAll()`。
- 地图数据初始化：Controller 收到 `OnGameResAllReady` 后先调用 `initGameData()`，生成 `mapGridList` 等数据，再创建场景视图。
- 阶段状态：`roundType`、`round`、`switchToBuild()`、`switchToBattle()`、`switchRound()`、`isBattle()`、`sceneReady`。
- 地块状态：地块等级、升级进度、战斗格配置、召唤单位类型、分支和本轮召唤标记。
- 核心据点：初始化并保存 `KingVo`，根据中央 2x2 核心格最低等级同步据点等级。
- Entity 注册与删除：`addEntity()`、`delEntity()`。
- 目标查询：`findTarget()`、`findTargetByList()`、`getSelectedEntity()`。
- 方块预览占位数据：`getGridDataList()`、`getRandomType()`。

阶段切换规则：

- 游戏初始进入构建阶段。
- 构建阶段由 UI 派发 `OnGameGrid3DStartBattle`，玩家主动切换到战斗阶段。
- 战斗阶段玩家不可主动切回构建；敌人全灭后由 `BattleEndCheckSystem` 触发胜利，再回到构建阶段。
- 核心据点死亡触发失败流程，不进入正常构建循环。
- 不使用倒计时自动切换阶段；旧 `switchRound()` 仅作为兼容入口，内部仍转到显式阶段切换方法。

## Entity-Component-EntityVo 设计

Grid3D 当前架构以 `EntityVo` 保存实体状态，以 `BaseEntity` 作为运行时实体壳，以自定义 Component 承接可组合能力，并由唯一的 `ComponentSystem` 统一更新所有组件。

- `BaseEntity` 是运行时逻辑实体和自定义组件载体，不继承 Cocos `Node`，不再要求脚本挂载到完整实体 Prefab。
- Entity 持有逻辑父层引用和对应显示对象引用，例如 `parentNode` 与 `node`；显示对象由组件创建、绑定和回收，Entity 本身不作为显示节点加入场景树。
- `EntityVo` 是实体数据与状态事件源，继承 `BaseVo`，通过属性事件通知组件和表现层；状态、位置、目标、血量、选中、预览、朝向等运行时数据都应先写入 Vo。
- `EntityComponent` 是自定义组件基类，不继承 Cocos `Component`；它负责绑定 Entity/Vo、监听 Vo 属性变化、执行生命周期，并在停止时清理监听和资源。
- Component 用于描述实体具备的能力或表现适配，例如 `StateComponent`、`BattleComponent`、`RVOMoveComponent`、`SkillComponent`、`ActorComponent`、`HUDComponent`、`GridPreviewComponent`。
- `ComponentSystem` 是唯一组件更新入口，按组件类型注册 `EntityComponent`，由 `start()` 启动定时更新，统一处理 `update(dt)`、暂停、恢复、停止和退出清理。
- 显示对象由 `EntityDisplayComponent` 或后续专用显示组件按需创建、持有和回收，可按 `modelUrl` 等资源字段异步加载部件 Prefab。
- Entity 初始化时绑定 Vo，调用 `vo.setEntity(this)`，再挂载组件并同步初始状态。
- 组件绑定 Entity 后必须调用 `updateVo()`；显示组件在显示对象迟到时必须从 Vo 全量同步当前快照，不能依赖错过的历史表现事件。
- 地图不可见或显示对象尚未创建时，战斗逻辑仍应继续运行；核心战斗结算、寻路、攻击范围不应依赖 Cocos 显示节点或 Collider。

推荐的数据流：

```text
GameGrid3DCache 生成/注册 EntityVo
  -> GameEntityLayer 或 GameMapGridLayer 创建 BaseEntity
  -> BaseEntity 绑定 Vo 并挂载能力组件
  -> ComponentSystem 统一更新已注册组件
  -> Vo 派发属性变化
  -> 表现组件同步模型、动画、HUD、格子预览
```

`EntityVo` 当前已有和设计目标中的通用能力：

- 基础属性：`id`、`type`、`name`、`level`。
- 位置与状态：`pos`、`worldPos`、`state`、`defaultState`、`setState()`、`updatePos()`。
- 战斗属性：`hp`、`maxHp`、`attack`、`battleVo`、`skills`、`isDead()`。
- 展示与资源：`getShowName()`、`modelUrl`、`getNextSkillId()`、`visible`、`isSelected`、`forward`、`setPreview()`。

`GridEntityVo` 当前承载地块核心状态：

- `isCoreGrid`：是否属于中央 2x2 核心据点占用格。
- `isBattleGrid`：是否配置为战斗格。
- `tileLevel`、`tileProgress`：由行列消除推动的地块等级和进度。
- `summonUnitType`、`summonUnitStage`、`summonBranchId`：战斗阶段基础召唤配置。
- `hasSummonedThisBattle`：限制每个战斗格每轮只基础召唤 1 次。

实体组件开发注意事项：

- 新增核心战斗规则时，优先拆成可组合 Component，不要继续塞进 Controller、Cache、View 或具体 Entity 子类。
- 新增实体数据时，优先扩展 Vo 子类，例如 `BattleEntityVo`、`HeroVo`、`EnemyVo`、`GridEntityVo`。
- 新增表现能力时，可继续使用 `EntityDisplayComponent` 派生组件，但显示组件只消费 Vo 快照，不应反向决定战斗结算。
- 需要持续更新的组件必须通过 `BaseEntity.addCusComponent()` 挂载，由 `ComponentSystem.addComponent()` 注册；回收实体时必须移除组件，避免组件引用残留。
- 状态、移动、攻击、技能和表现都应围绕 Vo 数据变化协作，避免组件之间直接持有过深依赖。

后续新增单位时，应优先新增 Vo 子类和 Component 组合，不应把具体业务分支堆回 Controller 或 Cache。

## 地图格子层与实体层职责

- `GameMapGridLayer` 负责地图交互格子：从 `CacheManager.gameGrid3D.mapGridList` 读取格子数据，创建并管理对应 `GameGridMapItem` 逻辑对象。
- `GameMapGridLayer` 负责 Ready 阶段的预览方块、拖动检测、落点检测、行列消除检查，并通过 Vo 更新格子状态。
- `GameEntityLayer` 不再创建地图交互格子，不再执行预览和拖放检测；该层只作为动态战斗实体的生命周期管理入口。
- `GameGridMap` 当前创建 `LayerType.MapGrid` 和 `LayerType.Entity` 两层；预览方块、拖放落点和行列消除都收敛在 `GameMapGridLayer`。

## 事件边界

Grid3D 内部事件使用 `MessageCenter/GEvent`，事件定义位于：

- `assets/script/game/gameGrid3D/event/GameGrid3DEvent.ts`

当前 3D 专用事件统一使用 `OnGameGrid3D...` 命名，例如：

- `OnGameGrid3DSceneReady`
- `OnGameGrid3DRoundUpdate`
- `OnGameGrid3DEntityInit`
- `OnGameGrid3DEntityDelete`
- `OnGameGrid3DSceneGridCreate`
- `OnGameGrid3DSceneGridDrop`

只在玩法入口、退出和主界面切换等全局流程继续使用 `EventManager/EventEnum`。

## 当前阶段流程

- Build/Ready 阶段由 `GameMapGridLayer` 允许拖拽预览方块并放置到 3D 棋盘。
- 放置后若触发行列消除，实际被消除的行列会通过 `GameGrid3DCache.addTileProgressByLines()` 推进地块成长；同时命中行列的交叉格会分别结算进度。
- `GameBuildHeroView` 不再直接创建 Hero，而是把选中地块配置为战斗格并写入召唤配置。
- Battle 阶段由 `BattleUnitSpawnSystem` 遍历战斗格，每格每轮基础召唤 1 个单位；阶段控制器按当前回合数投放基础敌人。
- `BattleEndCheckSystem` 检测核心据点死亡和敌人全灭，胜利回构建，失败进入失败流程。

## 后续开发要求

- 继续保持 `gameGrid3D` 与 `gameGrid` 完全解耦。
- 移动 Cocos 脚本时必须同步移动 `.ts.meta`，优先保留脚本 UUID，避免 Prefab 脚本绑定丢失。
- 新增 3D 事件必须使用 `OnGameGrid3D...` 命名，不复用 2D Grid 事件。
- 新增局内运行时状态优先放入 `GameGrid3DCache`，但不要把具体战斗行为塞进 Cache。
- 新增单位行为优先通过 Vo 数据和 Component 能力组合表达，Entity 只作为运行时实体壳、组件挂载点和显示对象引用入口。
- 修改 Grid3D 架构、事件、缓存、资源路径或运行流程时，必须同步更新本文档和相关 `MiniGame/docs/` 文档。
