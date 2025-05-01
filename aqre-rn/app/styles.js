import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  // 기존 스타일들...
  
  // 튜토리얼 스타일 추가
  tutorialContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 20,
  },
  tutorialContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    alignItems: 'center',
  },
  tutorialTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 15,
  },
  tutorialDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  tutorialHint: {
    fontSize: 14,
    color: '#4caf50',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  tutorialNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginTop: 20,
  },
  tutorialNavButton: {
    backgroundColor: '#1976d2',
    padding: 10,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  tutorialNavButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default styles;
