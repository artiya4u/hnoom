import React from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import {ActivityIndicator} from 'react-native';
import auth from '@react-native-firebase/auth';
import {VideoItemExpo} from '../components/VideoItemExpo';
import {VideoItemRNV} from '../components/VideoItemRNV';

const IPFSGatewayBaseURL = 'https://cloudflare-ipfs.com'; // const IPFSGatewayBaseURL = 'https://ipfs.io/';
const {height, width} = Dimensions.get('window');

const cellHeight = height;
const cellWidth = width;

const viewAbilityConfig = {
  itemVisiblePercentThreshold: 80
};

export default class FeedScreen extends React.PureComponent {
  state = {
    items: [],
    loading: false,
  };
  private cellRefs: any;
  private activeCell: any;
  private uid: string;
  private loadItemUnsub: any;

  constructor(props) {
    super(props);
    this.cellRefs = {};
    this.uid = '';
  }

  componentDidMount() {
    this.signIn();
  }

  componentWillUnmount() {
    if (this.loadItemUnsub !== null) {
      this.loadItemUnsub();
    }
  }

  pausePlaying = () => {
    if (this.activeCell !== null) {
      this.activeCell.pause();
    }
  };

  resumePlaying = () => {
    if (this.activeCell !== null) {
      this.activeCell.resume();
    }
  };

  _onViewableItemsChanged = (props) => {
    const changed = props.changed;
    changed.forEach((item) => {
      const cell = this.cellRefs[item.key];
      if (cell) {
        if (item.isViewable) {
          cell.play();
          this.activeCell = cell;
        } else {
          cell.stop();
        }
      }
    });
  };

  signIn = () => {
    (async () => {
      auth()
        .signInAnonymously()
        .then((cred) => {
          console.log(`signInAnonymously: ${cred.user.uid}`);
          this.uid = cred.user.uid;
          this.loadItemUnsub = this.loadItems();
        })
        .catch(error => {
          if (error.code === 'auth/operation-not-allowed') {
            console.log('Enable anonymous in your firebase console.');
          }

          console.error(error);
        });
    })();
  };

  loadItems = () => {
    console.log('loadItems');
    const subscriber = firestore()
      .collection('videos').orderBy('created', 'desc').limit(240)
      .onSnapshot(querySnapshot => {
        if (querySnapshot !== null) {
          const items = [];
          querySnapshot.forEach(documentSnapshot => {
            let videoUrl = `${IPFSGatewayBaseURL}/ipfs/${documentSnapshot.id}?filename=playlist.m3u8`;
            if (Platform.OS === 'android' && documentSnapshot.data().res1920p !== undefined) { // Quick fix no hi-res for Android, adaptive bitrate suck.
              videoUrl = `${IPFSGatewayBaseURL}/ipfs/${documentSnapshot.data().res1920p}?filename=playlist.m3u8`;
            }
            items.push({
              ...documentSnapshot.data(),
              cover: `${IPFSGatewayBaseURL}/ipfs/${documentSnapshot.data().cover}?filename=cover.jpg`,
              videoUrl: videoUrl,
              key: documentSnapshot.id,
              id: documentSnapshot.id,
              uid: this.uid,
            });
          });

          this.setState({items: items});
          this.setState({loading: false});
        }
      });

    // Unsubscribe from events when no longer in use
    return () => subscriber();
  };

  _renderItem = ({item}) => {
    if (Platform.OS === 'ios') {
      return (
        <VideoItemRNV
          ref={(ref) => {
            this.cellRefs[item.id] = ref;
          }}
          {...item}
        />
      );
    } else {
      return (
        <VideoItemExpo
          ref={(ref) => {
            this.cellRefs[item.id] = ref;
          }}
          {...item}
        />
      );
    }
  };

  onRefresh() {
    this.setState({loading: true,}, () => {
      if (this.loadItemUnsub !== null) {
        this.loadItemUnsub();
      }
      this.loadItemUnsub = this.loadItems();
    });
  }

  render() {
    if (this.state.loading) {
      return <ActivityIndicator/>;
    }
    const {items} = this.state;
    return (
      <View style={styles.container}>
        <FlatList
          snapToAlignment={'start'}
          snapToInterval={Dimensions.get('window').height}
          decelerationRate={'fast'}
          pagingEnabled
          onRefresh={() => this.onRefresh()}
          refreshing={this.state.loading}
          showsVerticalScrollIndicator={false}
          style={{flex: 1}}
          data={items}
          renderItem={this._renderItem}
          keyExtractor={(item) => item.id}
          onViewableItemsChanged={this._onViewableItemsChanged}
          initialNumToRender={1}
          maxToRenderPerBatch={1}
          windowSize={2}
          getItemLayout={(_data, index) => ({
            length: Dimensions.get('window').height,
            offset: Dimensions.get('window').height * index,
            index,
          })}
          viewabilityConfig={viewAbilityConfig}
          removeClippedSubviews={true}
          onEndReached={() => this.onRefresh()}
          onEndReachedThreshold={0}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B2740',
  },
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
  icon: {
    width: 16,
    height: 16,
  },
});
