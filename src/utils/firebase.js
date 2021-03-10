// In /utils/firebase.js
// We should import firebase from this module instead of the default package.

import Constants from 'expo-constants';
import {firebase} from "@react-native-firebase/firestore";

firebase.initializeApp(Constants.manifest.extra.firebase);

export default firebase;
