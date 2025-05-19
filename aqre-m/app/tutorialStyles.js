import { StyleSheet } from 'react-native';

export const tutorialStyles = StyleSheet.create({
  // 오버레이 스타일
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  
  // 컨테이너
  container: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  
  // 간호사 아바타
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#4c6ef5',
  },
  
  // 대화 내용 영역
  content: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // 대화 텍스트
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    textAlign: 'center',
  },
  
  // 다음/시작 버튼
  button: {
    backgroundColor: '#4c6ef5',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  
  // 진행 상태 표시기
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 4,
  },
  
  progressDotActive: {
    backgroundColor: '#4c6ef5',
    width: 24,
  },
  
  // SKIP 버튼
  skipButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 10,
  },
  
  skipButtonText: {
    color: '#666',
    fontSize: 14,
  },
});
