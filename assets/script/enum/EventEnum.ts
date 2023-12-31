export enum EventEnum {
    OnGameStart = 1,
    OnGameExit,

    //舒尔特
    OnGameShulteStart,
    OnGameShulteExit,

    //消消乐
    OnGameGridTouchEnd,
    OnGameGridTouchMove,
    OnGameGridReqNextPreview,
    OnGameGridSaveDataUpdate,
    OnGameGridPropUseUpdate,
    OnGameGridPropUseCheck,

    OnUserInfoUpdate,
    OnBannerAdComplete,

    OnShowWorldRank,
    OnCloudGetUpdate,

    OnGameGridRankUpdate,

    OnGameResLoadComplete,
    OnRankViewClose,
    OnGridSkinUpdate,
    OnPlayerInfoUpdate,
    OnPlayerMoneyUpdate,
    OnShareRewardUpdate,

    OnGameBallReset,
    OnEnemyReset,
    OnEnemyDeath,
    OnEnemyRoundComplete,
    OnGameBallNextRound,
}