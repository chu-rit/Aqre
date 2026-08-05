import { StyleSheet, Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  tooltipWrapper: {
    width: '100%',
    paddingHorizontal: 16,
  },
  tooltipContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    shadowColor: '#4c6ef5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 5,
    transform: [{ translateY: 0 }],
    overflow: 'visible',
    padding: 24,
    paddingBottom: 12,
    marginTop: 0,
  },
  tooltipContent: {
    flexDirection: 'row',
    alignItems: 'flex-end', // 하단 정렬로 변경
  },
  avatarContainer: {
    flex: 3,
    marginRight: 0,
    marginBottom: 4,
    marginTop: 0,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 16,
  },
  textContainer: {
    flex: 7,
    marginTop: 16,
    marginBottom: 16,
    marginLeft: 8,
  },
  speechBubble: {
    backgroundColor: '#f0f8ff',
    borderRadius: 20,
    padding: 15,
    position: 'relative',
    marginLeft: 0,
    minHeight: 80,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  speechBubbleTriangle: {
    position: 'absolute',
    left: -10,
    bottom: 20,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderTopWidth: 10,
    borderRightWidth: 20,
    borderBottomWidth: 10,
    borderLeftWidth: 0,
    borderTopColor: 'transparent',
    borderRightColor: '#f0f8ff',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  tooltipText: {
    fontSize: 15, // 글자 크기 감소
    lineHeight: 22, // 줄간격 조정
    color: '#333',
    textAlign: 'left',
    marginBottom: 12, // 하단 여백 감소
    fontWeight: '500',
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 8,
    marginTop: 8,
    marginBottom: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  // 진행 상태 표시기 컨테이너
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  // 진행 상태 점
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e8ff',
    marginHorizontal: 3,
  },
  // 현재 진행 중인 단계의 점
  progressDotActive: {
    backgroundColor: '#4c6ef5',
    width: 24,
    height: 8,
    borderRadius: 4,
  },
  // 다음 버튼
  nextButton: {
    backgroundColor: '#4c6ef5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginLeft: 'auto',
    ...Platform.select({
      ios: {
        shadowColor: '#4c6ef5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  nextButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.5,
  },
  skipButton: {
    position: 'absolute',
    top: 8,
    right: 12,
    minWidth: 64,
    minHeight: 44,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
    elevation: 30,
  },
  skipButtonText: {
    color: '#8e8e93',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
  },
  highlightArea: {
    borderWidth: 2,
    borderColor: '#4c6ef5',
    borderRadius: 12,
    backgroundColor: 'rgba(76, 110, 245, 0.1)',
  },
});

export default styles;
