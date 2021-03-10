import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from './home.component';
import RecordScreen from "../screens/record";
import {PreviewScreen} from "../screens/preview";

const { Navigator, Screen } = createStackNavigator();

const HomeNavigator = () => (
  <Navigator headerMode='none' screenOptions={{animationEnabled: false}}  detachInactiveScreens={false}>
    <Screen name='Home' component={HomeScreen}/>
    <Screen name='Record' component={RecordScreen} options={{headerShown: false}} />
    <Screen name='Preview' component={PreviewScreen} options={{headerShown: false}} />
  </Navigator>
);

export const AppNavigator = () => (
  <NavigationContainer theme={{ colors: { background: 'black' }}}>
    <HomeNavigator/>
  </NavigationContainer>
);
