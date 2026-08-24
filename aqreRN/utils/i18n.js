import * as Localization from 'expo-localization';

export const SUPPORTED_LANGUAGES = ['en', 'ko', 'ja', 'zh'];

const translations = {
  'options.title': { en: 'Options', ko: '옵션', ja: 'オプション', zh: '选项' },
  'options.soundEffects': { en: 'Sound Effects', ko: '효과음', ja: '効果音', zh: '音效' },
  'options.backgroundMusic': { en: 'Background Music', ko: '배경음', ja: 'BGM', zh: '背景音乐' },
  'options.vibration': { en: 'Vibration', ko: '진동', ja: '振動', zh: '振动' },
  'options.language': { en: 'Language', ko: '언어', ja: '言語', zh: '语言' },
  'options.resetClearData': { en: 'Reset Clear Data', ko: '클리어 데이터 초기화', ja: 'クリアデータをリセット', zh: '重置通关数据' },
  'options.developedBy': { en: 'Developed by', ko: '개발:', ja: '開発:', zh: '开发者：' },
  'options.specialThanks': { en: 'Special Thanks to Eric Fox', ko: 'Eric Fox에게 특별한 감사를 전합니다', ja: 'Eric Foxに特別な感謝を', zh: '特别感谢 Eric Fox' },
  'options.resetDataTitle': { en: 'Reset Data', ko: '데이터 초기화', ja: 'データをリセット', zh: '重置数据' },
  'options.resetDataConfirm': { en: 'Do you want to reset all clear data?', ko: '게임 클리어 데이터를 정말로 지우시겠습니까?', ja: 'すべてのクリアデータをリセットしますか？', zh: '确定要重置所有通关数据吗？' },
  'options.resetDataSuccess': { en: 'Clear data has been reset.', ko: '성공적으로 초기화되었습니다', ja: 'クリアデータをリセットしました。', zh: '通关数据已重置。' },
  'options.resetFailed': { en: 'Reset failed', ko: '초기화 실패', ja: 'リセットに失敗しました', zh: '重置失败' },
  'options.masterActivated': { en: 'Master Mode activated!', ko: '마스터 모드가 활성화되었습니다!', ja: 'マスターモードが有効になりました！', zh: '大师模式已启用！' },
  'options.masterDeactivated': { en: 'Master Mode deactivated.', ko: '마스터 모드가 비활성화되었습니다.', ja: 'マスターモードが無効になりました。', zh: '大师模式已停用。' },
  'options.dailyReset': { en: 'Daily event has been reset.', ko: '데일리 이벤트를 초기화하였습니다.', ja: 'デイリーイベントをリセットしました。', zh: '每日活动已重置。' },
  'common.error': { en: 'Error', ko: '오류', ja: 'エラー', zh: '错误' },
  'button.close': { en: 'Close', ko: '닫기', ja: '閉じる', zh: '关闭' },
  'button.cancel': { en: 'Cancel', ko: '취소', ja: 'キャンセル', zh: '取消' },
  'button.reset': { en: 'Reset', ko: '초기화', ja: 'リセット', zh: '重置' },
  'game.complete': { en: 'COMPLETE!', ko: '완료!', ja: 'クリア!', zh: '完成！' },
  'game.puzzleComplete': { en: 'PUZZLE COMPLETE', ko: '퍼즐 클리어', ja: 'パズルクリア', zh: '谜题完成' },
  'game.levels': { en: 'LEVELS', ko: '레벨', ja: 'レベル', zh: '关卡' },
  'level.select': { en: 'Level Select', ko: '레벨 선택', ja: 'レベル選択', zh: '关卡选择' },
  'level.comingSoon': { en: 'COMING SOON', ko: '준비 중', ja: '近日公開', zh: '即将推出' },
  'level.locked': { en: 'LOCKED', ko: '잠김', ja: 'ロック中', zh: '已锁定' },
  'level.chapter': { en: 'Chapter', ko: '챕터', ja: 'チャプター', zh: '章节' },
  'level.loading': { en: 'Loading...', ko: '로딩 중...', ja: '読み込み中...', zh: '加载中...' },
  'level.chapter2': { en: 'CHAPTER 2', ko: '챕터 2', ja: 'チャプター2', zh: '第2章' },
  'level.unlock.tutorial': { en: 'Complete the tutorial to unlock.', ko: '튜토리얼을 완료하면 잠금 해제됩니다.', ja: 'チュートリアルを完了するとロックが解除されます。', zh: '完成教程后即可解锁。' },
  'level.unlock.easy1': { en: 'Clear 5 EASY 1 puzzles to unlock.', ko: 'EASY 1 퍼즐을 5개 이상 클리어하면 잠금 해제됩니다.', ja: 'EASY 1のパズルを5問クリアするとロックが解除されます。', zh: '通关5个 EASY 1 谜题后即可解锁。' },
  'level.unlock.easy': { en: 'Clear 10 EASY puzzles to unlock.', ko: 'EASY 퍼즐을 10개 이상 클리어하면 잠금 해제됩니다.', ja: 'EASYのパズルを10問クリアするとロックが解除されます。', zh: '通关10个 EASY 谜题后即可解锁。' },
  'level.unlock.normal1': { en: 'Clear 5 NORMAL 1 puzzles to unlock.', ko: 'NORMAL 1 퍼즐을 5개 이상 클리어하면 잠금 해제됩니다.', ja: 'NORMAL 1のパズルを5問クリアするとロックが解除されます。', zh: '通关5个 NORMAL 1 谜题后即可解锁。' },
  'level.unlock.normal': { en: 'Clear 10 NORMAL puzzles to unlock.', ko: 'NORMAL 퍼즐을 10개 이상 클리어하면 잠금 해제됩니다.', ja: 'NORMALのパズルを10問クリアするとロックが解除されます。', zh: '通关10个 NORMAL 谜题后即可解锁。' },
  'level.skipTutorial': { en: 'Press and hold the lock to skip the tutorial.', ko: '튜토리얼을 스킵할려면 자물쇠를 꾸욱 눌러주세요.', ja: 'チュートリアルをスキップするにはロックを長押ししてください。', zh: '长按锁即可跳过教程。' },
  'level.comingSoonChapter': { en: 'CHAPTER 2', ko: '챕터 2', ja: 'チャプター2', zh: '第2章' },
  'game.time': { en: 'TIME', ko: '시간', ja: '時間', zh: '时间' },
  'game.hint': { en: 'HINT', ko: '힌트', ja: 'ヒント', zh: '提示' },
  'game.ruleCheck': { en: 'Rule Check', ko: '룰 체크', ja: 'ルールチェック', zh: '规则检查' },
  'game.rule.area': { en: 'Area', ko: '영역 규칙', ja: 'エリア', zh: '区域规则' },
  'game.rule.connect': { en: 'Connect', ko: '연결 규칙', ja: '接続', zh: '连接规则' },
  'game.rule.noFour': { en: 'No Four', ko: '4연속 규칙', ja: '4連続禁止', zh: '禁止四连' },
};

let currentLanguage = 'en';

export function resolveLanguage(language) {
  const normalized = String(language || '').toLowerCase();
  return SUPPORTED_LANGUAGES.find(code => normalized.startsWith(code)) || 'en';
}

export function getDeviceLanguage() {
  const locale = Localization.getLocales()?.[0]?.languageCode
    || Localization.getLocales()?.[0]?.languageTag
    || '';
  return resolveLanguage(locale);
}

export function setCurrentLanguage(language) {
  currentLanguage = resolveLanguage(language);
  return currentLanguage;
}

export function getCurrentLanguage() {
  return currentLanguage;
}

export function getText(code) {
  const entry = translations[code];
  if (!entry) return code;
  return entry[currentLanguage] || entry.en || code;
}
