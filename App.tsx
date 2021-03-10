import React from 'react';
import * as eva from '@eva-design/eva';
import {ApplicationProvider, IconRegistry} from '@ui-kitten/components';
import {EvaIconsPack} from '@ui-kitten/eva-icons';
import {AppNavigator} from './src/components/navigation.component';
import {default as theme} from './theme.json';
import {StatusBar} from "react-native";
import {default as mapping} from './mapping.json';
import {ActionSheetProvider} from "@expo/react-native-action-sheet";

export default () => (
  <>
    <IconRegistry icons={EvaIconsPack}/>
    <ActionSheetProvider>
      <ApplicationProvider {...eva} theme={{...eva.dark, ...theme}} customMapping={mapping}>
        <StatusBar barStyle="dark-content"/>
        <AppNavigator/>
      </ApplicationProvider>
    </ActionSheetProvider>
  </>
);
