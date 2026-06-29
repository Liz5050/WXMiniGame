# 项目概览

## 基本信息

- 项目名称：`MiniGame`
- 引擎版本：Cocos Creator `3.7.4`
- 语言：TypeScript
- 目标平台：微信小游戏为主，同时保留字节跳动小游戏和编辑器/默认平台适配
- 当前编译配置：`tsconfig.json` 继承 Cocos Creator 生成配置，`strict` 为 `false`

## 项目定位

本项目是一个小游戏合集式项目，主界面提供多个玩法入口，并通过统一的事件、资源加载、缓存和 UI 层级管理组织各个模块。

已出现的玩法包括：

- 舒尔特方格：`GameType.Shulte`
- 方格消除/方格战斗：`GameType.Grid`
- 弹球/数字球类玩法：`GameType.GameBall`
- 点击/命中类玩法：`GameType.GameHit`
- 3D 方格玩法：`GameType.Grid3D`

项目正在重构中，代码里存在部分未完成实现、临时测试入口和潜在报错。本轮文档仅描述现状和后续开发约定，不修复源码。

## 目录概览

```text
assets/
  game/                 游戏资源，按 UI、音频、模型、场景、图集等类型划分
  lib/                  平台声明文件，例如 wx.d.ts
  resources/            resources 动态加载资源与配置
  scenes/               Cocos 场景文件
  script/               TypeScript 业务代码
build-templates/        小游戏平台构建模板
dts/                    项目补充类型声明
settings/               Cocos Creator 项目设置
docs/                   后续开发文档
../cloud/               微信云托管 Express 服务端、数据库导出和测试脚本
```

## 代码主目录

```text
assets/script/
  common/               通用 UI、音频、提示、动画辅助
  config/               配置表读取封装
  cache/                运行时数据缓存与本地存储封装
  enum/                 全局枚举、事件、接口常量
  game/                 各玩法模块和基础 UI/Controller 类；`gameGrid3D` 为 1006 独立 3D 玩法模块
  manager/              全局管理器
  net/                  网络协议/协议码占位
  RVO/                  避障/移动相关算法
  SDK/                  微信、字节、默认平台 SDK 适配
  utils/                工具类和消息中心
```

## 当前重构状态提示

- 存在新旧事件体系并存迹象：`EventEnum/EventManager` 与 `GEvent/MessageCenter` 同时存在。
- `gameGrid3D` 使用 Entity-Component-EntityVo 运行时设计，由 `ComponentSystem` 统一更新自定义组件。
- 存在部分未完成代码和临时测试代码，后续重构应先建立可运行基线，再分模块清理。

## 文档索引

- `architecture.md`：客户端架构、启动流程、Controller/View/事件/资源加载约定。
- `modules.md`：客户端功能模块职责。
- `game-grid-3d.md`：`GameType.Grid3D = 1006` 独立重构、Entity-Component-EntityVo 架构和后续开发边界。
- `grid3d-combat-design.md`：Grid3D 构建消除、地块升级、单位召唤和核心据点防守的战斗设计草案。
- `resources-and-config.md`：客户端资源、配置和构建说明。
- `platform-sdk.md`：微信、字节和默认平台 SDK 适配说明。
- `coding-style.md`：编码风格、文件组织和 TypeScript 建议。
- `development-notes.md`：后续迭代、测试和提交注意事项。
- `cloud-server.md`：微信云托管 Express 服务端、数据模型、API 和运维说明。
