import React from 'react';
import Video from 'react-native-video';
import firestore from '@react-native-firebase/firestore';
import {Dimensions, Image, StyleSheet, View} from 'react-native';
import {Text} from '@ui-kitten/components';
import {nFormatter} from '../utils/NumberFormat';

const {height, width} = Dimensions.get('window');

const cellHeight = height;
const cellWidth = width;

export class VideoItemRNV extends React.PureComponent {
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

  _onEnd = async () => {
    const increment = firestore.FieldValue.increment(1);
    const myViewRef = firestore().collection('views').doc(this.id).collection('viewers').doc(this.uid);
    let myView = await myViewRef.get();
    if (myView.data() === undefined) {
      await myViewRef.set({count: increment});
    } else {
      await myViewRef.update({count: increment});
    }
  };

  componentDidMount() {
    this._loadTotalViews().then(value => {
      this.viewsUnsubscribe = value;
    }).catch(reason => {
      console.log(reason);
    });
  }

  componentWillUnmount() {
    if (this.video) {
      this.setState({paused: true});
    }
    this.viewsUnsubscribe();
  }

  async play() {
    if (this.video) {
      this.setState({paused: false});
    }
  }

  pause() {
    if (this.video) {
      this.video.seek(0);
      this.setState({paused: true});
    }
  }

  resume() {
    if (this.video) {
      this.video.seek(0);
      this.setState({paused: false});
    }
  }

  stop() {
    if (this.video) {
      this.setState({paused: true});
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
          paused={this.state.paused}
          muted={true}
          resizeMode='cover'
          repeat={true}
          poster={cover}
          posterResizeMode='cover'
          style={styles.full}
          onEnd={this._onEnd}
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
