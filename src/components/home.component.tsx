import React from 'react';
import {Platform, SafeAreaView} from 'react-native';
import {Icon, TopNavigation, TopNavigationAction} from '@ui-kitten/components';
import {useActionSheet} from '@expo/react-native-action-sheet'
import * as DocumentPicker from "expo-document-picker";
import FeedScreen from "../screens/feed";
import GlobalStyles from "../GlobalStyles";

const AddIcon = (props) => (
  <Icon {...props} name='plus'/>
);

export const HomeScreen = ({navigation}) => {
  const options = Platform.select({
    ios: ['Select video', 'Record video', 'Cancel'],
    default: ['Select video', 'Record video'],
  }) as string[]
  const {showActionSheetWithOptions} = useActionSheet();
  let feedScreen: FeedScreen;

  const renderRightActions = () => (
    <React.Fragment>
      <TopNavigationAction icon={AddIcon} onPress={handleAddOption}/>
    </React.Fragment>
  );

  const handleAddOption = () => {
    if (feedScreen !== null) {
      feedScreen.pausePlaying();
    }

    showActionSheetWithOptions(
      {
        title: "",
        options: options,
        cancelButtonIndex: 2,
      },
      async (buttonIndex) => {
        switch (buttonIndex) {
          case 0: {
            let result = await DocumentPicker.getDocumentAsync({
              type: "video/*",
              copyToCacheDirectory: true,
              multiple: false
            });
            if (result.type === 'success') {
              navigation && navigation.navigate('Preview', {
                  videoUri: result.uri,
                },
              );
            }
            break
          }
          case 1: {
            navigation.navigate('Record');
            break
          }
          case 2: {
            feedScreen.resumePlaying();
            break
          }
        }
      },
    )
  }

  return (
    <SafeAreaView style={GlobalStyles.droidSafeArea}>
      <TopNavigation title='HNOOM' alignment='center' accessoryRight={renderRightActions}/>
      <FeedScreen ref={(ref) => {
        feedScreen = ref;
      }}/>
    </SafeAreaView>
  );
};
