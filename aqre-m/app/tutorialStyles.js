import { StyleSheet } from 'react-native';

export const tutorialStyles = StyleSheet.create({
  // 오버레이 스타일
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  
  // 메인 컨테이너
  container: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  
  // 콘텐츠 컨테이너 (전체 영역)
  contentContainer: {
    width: '100%',
  },
  
  // 이미지와 텍스트를 담는 행
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },

  // 이미지 컨테이너 (30%)
  imageContainer: {
    width: '25%',
    alignItems: 'center',
    paddingRight: 16,
    paddingTop: 16, // 상단 패딩 16px 추가
  },

  // 간호사 아바타
  avatar: {
    width: 90,  // 크기 증가
    height: 90,  // 크기 증가
    borderRadius: 45,  // 둥근 모서리도 크기에 맞게 조정
    borderWidth: 3,
    borderColor: '#4c6ef5',
  },
  
  // 텍스트 컨테이너 (75%)
  textContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 100,
  },
  
  // 대화 텍스트
  text: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    textAlign: 'left',
    marginBottom: 16,
  },
  
  // 하단 컨테이너 (진행 상태와 버튼)
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  // 진행 상태 표시기
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 3,
  },
  
  progressDotActive: {
    backgroundColor: '#4c6ef5',
    width: 20,
  },
  
  // 다음/시작 버튼
  button: {
    backgroundColor: '#4c6ef5',
    paddingVertical: 4, // 패딩 더 줄임
    paddingHorizontal: 12, // 패딩 더 줄임
    borderRadius: 10, // 둥근 모서리 조정
    alignItems: 'center',
    minWidth: 70, // 최소 너비 더 줄임
  },
  
  buttonText: {
    color: 'white',
    fontSize: 12, // 폰트 크기 더 줄임
    fontWeight: '600',
    paddingHorizontal: 2, // 좌우 패딩 조정
  },
  
  skipButton: {
    position: 'absolute',
    top: 4, // 더 위로 조정
    right: 24,
    zIndex: 10,
    alignSelf: 'flex-end',
  },
  
  skipButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
});
