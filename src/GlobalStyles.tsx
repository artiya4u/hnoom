import { StyleSheet } from 'react-native';
import Constants from 'expo-constants';

export default StyleSheet.create({
  droidSafeArea: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingTop: Constants.appOwnership === 'expo' ? 25 : 0
  },
});
