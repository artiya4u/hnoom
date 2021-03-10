import React, {useState, useEffect} from 'react';
import {StyleSheet, Text, View, TouchableOpacity, Dimensions} from 'react-native';
import {Camera} from 'expo-camera';
import {Icon} from "@ui-kitten/components";
import {StatusBar} from 'expo-status-bar';
import {Audio} from 'expo-av';

const videoMaxDuration = 27;

export default function RecordScreen({navigation, route}) {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [cameraRef, setCameraRef] = useState(null);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    (async () => {
      const CameraPermission = await Camera.requestPermissionsAsync();
      const AudioPermission = await Audio.requestPermissionsAsync();
      setHasPermission(CameraPermission.status === 'granted' && AudioPermission.status === 'granted');
    })();
  }, []);

  if (hasPermission === null) {
    return <View/>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }
  return (
    <View style={styles.container}>
      <StatusBar style="light"/>
      <Camera style={styles.camera} type={type} ratio='16:9'
              useCamera2Api={true}
              videoStabilizationMode={Camera.Constants.VideoStabilization.cinematic}
              ref={ref => {
                setCameraRef(ref);
              }}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            justifyContent: 'flex-end',
          }}>
          <View style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-evenly',
            marginBottom: 20,
          }}>
            <TouchableOpacity
              style={{
                flex: 0.1,
                alignSelf: 'flex-end'
              }}
              onPress={() => {
                setType(
                  type === Camera.Constants.Type.back
                    ? Camera.Constants.Type.front
                    : Camera.Constants.Type.back
                );
              }}>
              <Icon
                style={styles.icon}
                fill='white'
                name='flip-2'
              />

            </TouchableOpacity>
            <TouchableOpacity style={{alignSelf: 'center'}} onPress={async () => {
              if (!recording) {
                setRecording(true)
                let video = await cameraRef.recordAsync({
                  quality: Camera.Constants.VideoQuality['1080p'],
                  videoBitrate: 5000,
                  maxDuration: videoMaxDuration
                });
                console.log('video', video);
                navigation && navigation.navigate('Preview', {
                    videoUri: video.uri,
                  },
                );
              } else {
                setRecording(false)
                cameraRef.stopRecording()
              }
            }}>
              <View style={{
                borderWidth: 2,
                borderRadius: 25,
                borderColor: '#13DCF2',
                height: 50,
                width: 50,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
              >
                <View style={{
                  borderWidth: 2,
                  borderRadius: 25,
                  borderColor: '#13DCF2',
                  height: 40,
                  width: 40,
                  backgroundColor: '#13DCF2'
                }}>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, alignItems: "center", backgroundColor: 'black'
  },
  camera: {
    backgroundColor: 'black',
    width: Dimensions.get('screen').height / (16 / 9),
    height: Dimensions.get('screen').height,
  },
  button: {
    flex: 0.1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    color: 'white',
  },
  icon: {
    width: 40,
    height: 40,
  },
});
