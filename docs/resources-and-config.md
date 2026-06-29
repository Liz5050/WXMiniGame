# 资源、配置与构建

## Bundle 约定

项目中常用 Bundle 名称：

- `ui`：界面 Prefab。
- `audio`：音频资源。
- `atlas`：图集资源。
- `effect`：特效 Prefab。
- `scene`：3D 场景 Prefab。
- `resources`：Cocos 默认 resources 目录。

加载入口优先使用 `Mgr.loader`，避免业务层直接调用 Cocos 原生加载 API。

## UI 资源路径

UI Prefab 目录位于：

```text
assets/game/ui/{moduleName}/{ViewName}.prefab
```

其中 `{moduleName}` 来自 `UIModuleEnum`：

```ts
export enum UIModuleEnum {
    common = 1,
    main,
    gameBall,
    gameGrid,
    gameGrid3D,
    gameShulte,
    rank,
    gameHit,
    sideBarReward,
}
```

`BaseUIView` 加载 UI 的实际路径：

```text
UIModuleEnum[moduleId] + "/" + viewName
```

示例：

```ts
super(UIModuleEnum.gameGrid, "GameGridStartView");
```

对应：

```text
assets/game/ui/gameGrid/GameGridStartView.prefab
```

## 玩法预加载资源

`GameDefine.getGameRes(type)` 维护玩法首次进入前需要预加载的资源。

当前配置：

- `GameType.Grid`：`GameGridMapItem`、`ScoreAddItem`
- `GameType.GameBall`：`BallItem`、`Enemy`
- `GameType.Shulte`：`ShulteGridItemShow`、`ShulteGridItem`
- 其他玩法：默认认为资源已准备好

新增玩法时应同步补充预加载资源，避免玩法进入后出现短时间空节点或回调竞态。

## 配置表

配置表位于：

```text
assets/resources/config/
```

当前可见配置：

- `grid_skin_shop.json`：方格皮肤商店配置

配置读取基类：

- `BaseConfig`
- `GridSkinShopConfig`

`BaseConfig` 通过表名从 `ConfigManager.Data[tableName]` 读取源数据，并按主键转换为字典。当前代码中未看到统一加载 JSON 到 `ConfigManager.Data` 的完整流程，后续重构需要确认配置初始化链路。

## 音频资源

音频资源位于：

```text
assets/game/audio/
```

音频播放入口：

- `Mgr.soundMgr.play(audioName)`
- `Mgr.soundMgr.playBGM(audioName)`
- `Mgr.soundMgr.stopBGM()`
- `Mgr.soundMgr.setMute(isMute)`

`SoundManager` 依赖场景中的 `SoundManager` 节点和 `AudioPlayer` 组件，并将该节点设为常驻节点。

## 图集和图片

图集资源位于：

```text
assets/game/atlas/
```

`LoaderManager.SetSpriteByAtlas(sp, atlasName, resName)` 会从 `atlas` Bundle 加载 `SpriteAtlas` 并设置 `SpriteFrame`。

远程头像等图片使用 `LoaderManager.SetSpriteFrame(sp, url)` 加载，并在内部维护 `SpriteFrame` 缓存。

## 3D 模型与场景资源

3D 模型位于：

```text
assets/game/model/
assets/game/scene/
```

`GameType.Grid3D` 启动时会加载：

```text
Bundle: scene
Path: gameGrid3D/GameGridMap
```

3D 方格 UI 资源位于：

```text
assets/game/ui/gameGrid3D/
```

## 小游戏平台构建模板

构建模板目录：

```text
build-templates/wechatgame/
build-templates/bytedance-mini-game/
```

微信小游戏模板包含：

- `project.config.json`
- `game.json`
- `game.ejs`
- `init_view_bg.png`

字节跳动小游戏模板包含：

- `project.config.json`
- `game.json`
- `game.ejs`

微信模板中当前 `appid` 和 `projectname` 为空，正式构建前需按发布环境补齐。

## TypeScript 配置

`tsconfig.json`：

```json
{
  "extends": "./temp/tsconfig.cocos.json",
  "compilerOptions": {
    "strict": false
  }
}
```

当前未启用严格模式。后续重构可以先保持该设置，逐步减少 `any` 和隐式类型后，再评估是否开启更严格选项。

## Creator 版本

`package.json` 指定：

```json
{
  "creator": {
    "version": "3.7.4"
  }
}
```

后续开发、导入资源、提交 `.meta` 文件时应使用 Cocos Creator 3.7.4，避免不同版本改写资源元数据。
