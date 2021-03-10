import React from 'react';
import {Video} from 'expo-av';
import firestore from '@react-native-firebase/firestore';
import {Dimensions, Image, StyleSheet, View} from 'react-native';
import {Text} from '@ui-kitten/components';
import {nFormatter} from '../utils/NumberFormat';

const {height, width} = Dimensions.get('window');

const cellHeight = height;
const cellWidth = width;

export class VideoItemExpo extends React.PureComponent {
  private video: Video | null;
  private id: string | null;
  private uid: string | null;
  private viewsUnsubscribe;
  private state = {
    paused: false,
    views: 0,
  };

  _loadTotalViews = async () => {
    let subscriber = await firestore().collection('views').doc(this.id).collection('viewers').onSnapshot(querySnapshot => {
      if (querySnapshot !== null) {
        let viewCount = 0;
        querySnapshot.forEach(documentSnapshot => {
          viewCount += documentSnapshot.data().count;
          this.setState({views: viewCount});
        });
      }
    });
    return () => subscriber();
  };

  _onPlaybackStatusUpdate = async playbackStatus => {
    if (!playbackStatus.isLoaded) {
      // Update your UI for the unloaded state
      if (playbackStatus.error) {
        console.log(`Encountered a fatal error during playback: ${playbackStatus.error}`);
        // Send Expo team the error on Slack or the forums so we can help you debug!
      }
    } else {
      // Update your UI for the loaded state

      if (playbackStatus.isPlaying) {
        // Update your UI for the playing state
      } else {
        // Update your UI for the paused state
      }

      if (playbackStatus.isBuffering) {
        // Update your UI for the buffering state
      }

      if (playbackStatus.didJustFinish) {
        // The player has just finished playing and will stop. Maybe you want to play something else?
        const increment = firestore.FieldValue.increment(1);
        const myViewRef = firestore().collection('views').doc(this.id).collection('viewers').doc(this.uid);
        let myView = await myViewRef.get();
        if (myView.data() === undefined) {
          await myViewRef.set({count: increment});
        } else {
          await myViewRef.update({count: increment});
        }
      }
    }
  };

  componentDidMount() {
    if (this.video) {
      this.video.setOnPlaybackStatusUpdate(this._onPlaybackStatusUpdate);
    }
    this._loadTotalViews().then(value => {
      this.viewsUnsubscribe = value;
    }).catch(reason => {
      console.log(reason);
    });
  }

  componentWillUnmount() {
    if (this.video) {
      this.video.unloadAsync();
    }
    this.viewsUnsubscribe();
  }

  async play() {
    const status = await this.video.getStatusAsync();
    if (status.isPlaying) {
      return;
    }
    return this.video.playAsync();
  }

  pause() {
    if (this.video) {
      this.video.pauseAsync();
    }
  }

  resume() {
    if (this.video) {
      this.video.playAsync();
    }
  }

  stop() {
    if (this.video) {
      this.video.stopAsync();
    }
  }

  render() {
    const {id, uid, cover, videoUrl} = this.props;
    const uri = videoUrl;
    this.id = id;
    this.uid = uid;
    console.log(id);
    return (
      <View style={styles.cell}>
        <Image
          source={{
            uri: cover,
            cache: 'force-cache',
          }}
          style={[styles.full, styles.poster]}
        />
        <Video
          ref={(ref) => {
            this.video = ref;
          }}
          source={{uri, type: 'm3u8'}}
          shouldPlay={false}
          isMuted={true}
          resizeMode='cover'
          isLooping={true}
          style={styles.full}
        />
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>{nFormatter(this.state.views, 2)} VIEWS</Text>
        </View>
      </View>
    );
  }
}


const styles = StyleSheet.create({
  cell: {
    width: cellWidth,
    height: cellHeight,
    backgroundColor: '#0B2740',
  },
  overlay: {
    position: 'absolute',
    right: 0,
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingTop: 10,
    paddingBottom: 10,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  full: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  poster: {
    resizeMode: 'cover',
  },
  overlayText: {
    color: '#fff',
  },
});
