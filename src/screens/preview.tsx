import React, {useState} from 'react';
import {Dimensions, StyleSheet, TouchableOpacity, View} from 'react-native';
import encodeHLS from '../services/encode';
import * as FileSystem from 'expo-file-system';
import uploadFileToIPFS from '../services/upload';
import {Icon, Modal} from '@ui-kitten/components';
import {Video} from 'expo-av';
import firestore, {firebase} from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import * as Progress from 'react-native-progress';

export const PreviewScreen = ({navigation, route}): React.ReactElement => {
  const [video, setVideo] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0.0);
  const encodedProgress = 0.5;

  const finishVideo = async () => {
    if (processing) {
      return;
    }
    setProcessing(true);
    if (video != null) {
      video.pauseAsync();
    }

    let progressCallback = (progress) => {
      setProgress(encodedProgress * progress);
    };

    let resultDir = await encodeHLS(route.params.videoUri, progressCallback);
    const remainProgress = 1 - encodedProgress;
    setProgress(encodedProgress);
    if (resultDir != null) {
      let playlistCIDs: { [key: string]: string } = {};
      let resCIDs: { [key: string]: string } = {};
      let hslVideoCIDs: { [key: string]: string } = {};
      let dir = await FileSystem.readDirectoryAsync(resultDir);
      let fileToUploadCount = 5;
      let uploadedFileCount = 0;

      // Count all ts files
      for (let filename of dir) {
        if (filename.endsWith('.ts')) {
          fileToUploadCount += 1;
        }
      }

      // Video files
      for (let filename of dir) {
        if (filename.endsWith('.ts')) {
          let result = await uploadFileToIPFS(resultDir + `/${filename}`);
          hslVideoCIDs[filename] = result.Hash;
          console.log(`${filename} hash: ` + result.Hash);

          setProgress((++uploadedFileCount / fileToUploadCount * remainProgress) + encodedProgress);
        }
      }

      // Playlist file
      for (let filename of dir) {
        if (filename.endsWith('.m3u8') && filename !== 'playlist.m3u8') {
          let playlistFilename = resultDir + `/${filename}`;
          let playlistContent = await FileSystem.readAsStringAsync(playlistFilename);
          for (const property in hslVideoCIDs) {
            playlistContent = playlistContent.replace(property, hslVideoCIDs[property]);
          }
          await FileSystem.writeAsStringAsync(playlistFilename, playlistContent, {});
          let uploadPlaylistResult = await uploadFileToIPFS(playlistFilename);
          playlistCIDs[filename] = uploadPlaylistResult.Hash;
          resCIDs[`res${filename.replace('.m3u8', '')}`] = uploadPlaylistResult.Hash;
          console.log(`${filename} playlist hash: ` + uploadPlaylistResult.Hash);

          setProgress((++uploadedFileCount / fileToUploadCount * remainProgress) + encodedProgress);
        }
      }

      // Upload cover image
      let uploadCoverResult = await uploadFileToIPFS(resultDir + `/cover.jpg`);
      setProgress((++uploadedFileCount / fileToUploadCount * remainProgress) + encodedProgress);

      // All playlist file
      let playlistAllFilename = resultDir + `/playlist.m3u8`;
      let playlistAllContent = await FileSystem.readAsStringAsync(playlistAllFilename);
      for (const property in playlistCIDs) {
        playlistAllContent = playlistAllContent.replace(property, playlistCIDs[property]);
      }
      await FileSystem.writeAsStringAsync(playlistAllFilename, playlistAllContent, {});
      let uploadPlaylistAllResult = await uploadFileToIPFS(playlistAllFilename);
      setProgress((++uploadedFileCount / fileToUploadCount * remainProgress) + encodedProgress);
      console.log('All playlist hash: ' + uploadPlaylistAllResult.Hash);
      let result = {
        videoUrl: `https://cloudflare-ipfs.com/ipfs/${uploadPlaylistAllResult.Hash}?filename=playlist.m3u8`,
        cover: `https://cloudflare-ipfs.com/ipfs/${uploadCoverResult.Hash}?filename=cover.jpg`,
      };
      console.log(result);
      if (auth().currentUser !== null) {
        const {uid} = auth().currentUser;
        firestore()
          .collection('videos')
          .doc(uploadPlaylistAllResult.Hash).set({
          cover: uploadCoverResult.Hash,
          creator: uid,
          created: firebase.firestore.FieldValue.serverTimestamp(),
          ...resCIDs
        })
          .then(() => {
            navigation && navigation.navigate('Home', result,);
            console.log('Video added!');
          });
      }
    } else {
      alert('Invalid video format! The video must be 1920x1080 vertical video.');
    }
    setProcessing(false);
  };

  return (
    <View style={styles.container}>
      <Video
        ref={(ref) => {
          setVideo(ref);
        }}
        source={{uri: route.params.videoUri}}
        shouldPlay={true}
        isMuted={true}
        resizeMode='cover'
        isLooping={true}
        style={styles.preview}
      />
      <Modal visible={processing} backdropStyle={styles.backdrop}>
        <Progress.Bar progress={progress} width={200} color='#13DCF2'/>
      </Modal>
      <View
        style={{
          flex: 1,
          backgroundColor: 'transparent',
          justifyContent: 'flex-end',
          ...StyleSheet.absoluteFillObject,
        }}>
        <View style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-evenly',
          marginBottom: 100,
        }}>
          <TouchableOpacity
            style={{
              flex: 0.1,
              alignSelf: 'flex-end'
            }}
            onPress={() => {
              finishVideo().then();
            }}>
            <Icon
              style={styles.icon}
              fill='white'
              name='checkmark'
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 0.1,
              alignSelf: 'flex-end'
            }}
            onPress={() => {
              navigation.goBack();
            }}>
            <Icon
              style={styles.icon}
              fill='white'
              name='close'
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B2740',
  },
  title: {
    fontSize: 20,
  },
  preview: {
    width: Dimensions.get('screen').height / (16 / 9),
    height: Dimensions.get('screen').height,
  },
  icon: {
    width: 40,
    height: 40,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});
